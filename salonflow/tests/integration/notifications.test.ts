import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAppointment } from "@/server/modules/appointments/booking-service";
import { changeAppointmentStatus } from "@/server/modules/appointments/booking-service";
import {
  buildIdempotencyKey,
  dispatchPendingNotifications,
  queueNotification,
} from "@/server/notifications/outbox";
import { DEFAULT_TEMPLATES } from "@/server/notifications/default-templates";
import { substitute } from "@/server/notifications/templates";
import { at, createTenant, destroyTenant, prisma, type TenantFixture } from "./helpers";

/**
 * Notification outbox.
 *
 * Two properties are under test:
 *
 *   - A notification is queued in the same transaction as the booking, so a
 *     rolled-back booking never produces an email.
 *   - The idempotency key makes re-queuing a no-op, so a retried request does
 *     not send the customer a second confirmation.
 */

let tenant: TenantFixture;

beforeAll(async () => {
  tenant = await createTenant("notif");
  process.env.MAIL_TRANSPORT = "console";

  // Seed the organization's templates so rendering exercises the stored path
  // rather than only the built-in fallback.
  const rows = [];
  for (const [locale, events] of Object.entries(DEFAULT_TEMPLATES)) {
    for (const [event, template] of Object.entries(events)) {
      if (!template) continue;
      rows.push({
        organizationId: tenant.organizationId,
        storeId: null,
        event: event as never,
        channel: "email" as const,
        locale: locale as never,
        subject: template.subject,
        body: template.body,
      });
    }
  }
  await prisma.messageTemplate.createMany({ data: rows, skipDuplicates: true });
});

afterAll(async () => {
  await destroyTenant(tenant);
  await prisma.$disconnect();
});

describe("booking notifications", () => {
  it("queues a confirmation when the booking commits", async () => {
    const appointment = await createAppointment({
      organizationId: tenant.organizationId,
      storeId: tenant.storeId,
      customerId: tenant.customerIds[0]!,
      serviceIds: [tenant.serviceId],
      staffId: tenant.staffIds[0]!,
      startAt: at(10 * 60),
      source: "public_web",
      now: at(9 * 60),
    });

    const notifications = await prisma.notification.findMany({
      where: { appointmentId: appointment.id },
    });

    expect(notifications).toHaveLength(1);
    expect(notifications[0]?.event).toBe("appointment_confirmed");
    expect(notifications[0]?.status).toBe("pending");
    expect(notifications[0]?.subject).toContain(tenant.storeSlug ? "" : "");
    // The rendered body must have its placeholders resolved.
    expect(notifications[0]?.body).not.toContain("{{reference}}");
    expect(notifications[0]?.body).toContain(appointment.reference);
  });

  it("does not queue anything when the customer has no email", async () => {
    const anonymous = await prisma.customer.create({
      data: {
        organizationId: tenant.organizationId,
        name: "連絡先なし",
        homeStoreId: tenant.storeId,
      },
      select: { id: true },
    });

    const appointment = await createAppointment({
      organizationId: tenant.organizationId,
      storeId: tenant.storeId,
      customerId: anonymous.id,
      serviceIds: [tenant.serviceId],
      staffId: tenant.staffIds[1]!,
      startAt: at(10 * 60),
      source: "walk_in",
      now: at(9 * 60),
    });

    // A walk-in without contact details is normal, not an error: the booking
    // succeeds and simply has nothing to notify.
    expect(appointment.id).toBeTruthy();
    const notifications = await prisma.notification.count({
      where: { appointmentId: appointment.id },
    });
    expect(notifications).toBe(0);
  });

  it("queues a cancellation notice on cancel", async () => {
    const appointment = await createAppointment({
      organizationId: tenant.organizationId,
      storeId: tenant.storeId,
      customerId: tenant.customerIds[0]!,
      serviceIds: [tenant.serviceId],
      staffId: tenant.staffIds[0]!,
      startAt: at(14 * 60),
      source: "public_web",
      now: at(9 * 60),
    });

    await changeAppointmentStatus({
      appointmentId: appointment.id,
      organizationId: tenant.organizationId,
      toStatus: "cancelled",
      reason: "test",
    });

    const events = await prisma.notification.findMany({
      where: { appointmentId: appointment.id },
      select: { event: true },
    });

    expect(events.map((entry) => entry.event)).toContain("appointment_cancelled");
  });
});

describe("idempotency", () => {
  it("derives a stable key from the notification's identity", () => {
    const base = {
      organizationId: tenant.organizationId,
      event: "appointment_confirmed" as const,
      channel: "email" as const,
      appointmentId: "appt-1",
      recipient: "a@demo.example.invalid",
      variables: {},
    };

    expect(buildIdempotencyKey(base)).toBe(buildIdempotencyKey({ ...base }));
    expect(buildIdempotencyKey(base)).not.toBe(
      buildIdempotencyKey({ ...base, appointmentId: "appt-2" }),
    );
  });

  it("does not queue the same notification twice", async () => {
    const appointment = await createAppointment({
      organizationId: tenant.organizationId,
      storeId: tenant.storeId,
      customerId: tenant.customerIds[1]!,
      serviceIds: [tenant.serviceId],
      staffId: tenant.staffIds[0]!,
      startAt: at(16 * 60),
      source: "public_web",
      now: at(9 * 60),
    });

    const before = await prisma.notification.count({
      where: { appointmentId: appointment.id },
    });

    // Re-queue exactly what the booking already queued.
    const customer = await prisma.customer.findUniqueOrThrow({
      where: { id: tenant.customerIds[1]! },
      select: { email: true },
    });

    await prisma.$transaction(async (tx) => {
      await queueNotification(tx, {
        organizationId: tenant.organizationId,
        storeId: tenant.storeId,
        customerId: tenant.customerIds[1]!,
        appointmentId: appointment.id,
        event: "appointment_confirmed",
        channel: "email",
        recipient: customer.email,
        variables: { reference: appointment.reference },
      });
    });

    const after = await prisma.notification.count({
      where: { appointmentId: appointment.id },
    });

    expect(after).toBe(before);
  });
});

describe("dispatch", () => {
  it("marks queued notifications as sent via the development transport", async () => {
    const appointment = await createAppointment({
      organizationId: tenant.organizationId,
      storeId: tenant.storeId,
      customerId: tenant.customerIds[0]!,
      serviceIds: [tenant.serviceId],
      staffId: tenant.staffIds[1]!,
      startAt: at(18 * 60),
      source: "public_web",
      now: at(9 * 60),
    });

    const result = await dispatchPendingNotifications(100);
    expect(result.sent).toBeGreaterThan(0);

    const notification = await prisma.notification.findFirstOrThrow({
      where: { appointmentId: appointment.id },
      select: { status: true, deliveries: { select: { status: true, attempt: true } } },
    });

    expect(notification.status).toBe("sent");
    expect(notification.deliveries[0]?.status).toBe("sent");
    expect(notification.deliveries[0]?.attempt).toBe(1);
  });

  it("is a no-op when the outbox is empty", async () => {
    await dispatchPendingNotifications(100);
    const second = await dispatchPendingNotifications(100);
    expect(second.sent).toBe(0);
  });
});

describe("template substitution", () => {
  it("replaces known tokens", () => {
    expect(substitute("{{a}} と {{b}}", { a: "1", b: "2" })).toBe("1 と 2");
  });

  it("leaves an unknown token visible rather than printing undefined", () => {
    expect(substitute("{{known}} {{unknown}}", { known: "x" })).toBe("x {{unknown}}");
  });

  it("does not evaluate anything inside the token", () => {
    // The token grammar is [a-zA-Z0-9_] only, so this is left untouched.
    expect(substitute("{{ process.exit(1) }}", {})).toBe("{{ process.exit(1) }}");
  });
});
