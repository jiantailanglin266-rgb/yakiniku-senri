import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  BookingConflictError,
  BookingRejectedError,
  createAppointment,
  createStaffBlock,
  changeAppointmentStatus,
  rescheduleAppointment,
} from "@/server/modules/appointments/booking-service";
import {
  at,
  createTenant,
  destroyTenant,
  prisma,
  TEST_DATE,
  type TenantFixture,
} from "./helpers";

/**
 * Double-booking prevention.
 *
 * The single most important guarantee in the product: two customers must never
 * end up with the same stylist, or the same chair, at the same time.
 *
 * These tests deliberately go through the real service against a real
 * PostgreSQL database, because the guarantee is enforced by GiST exclusion
 * constraints. An in-memory fake would pass while the production behaviour
 * broke.
 */

let tenant: TenantFixture;

beforeAll(async () => {
  tenant = await createTenant("dbl");
});

afterAll(async () => {
  await destroyTenant(tenant);
  await prisma.$disconnect();
});

function bookingInput(overrides: Partial<Parameters<typeof createAppointment>[0]> = {}) {
  return {
    organizationId: tenant.organizationId,
    storeId: tenant.storeId,
    customerId: tenant.customerIds[0]!,
    serviceIds: [tenant.serviceId],
    staffId: tenant.staffIds[0]!,
    startAt: at(12 * 60),
    source: "staff_entry" as const,
    now: at(9 * 60),
    ...overrides,
  };
}

describe("createAppointment", () => {
  it("creates a booking with staff and resource slots", async () => {
    const appointment = await createAppointment(
      bookingInput({ startAt: at(10 * 60) }),
    );

    expect(appointment.reference).toMatch(/^A-\d{8}-[0-9A-F]+$/);
    expect(appointment.status).toBe("confirmed");
    expect(appointment.totalAmount).toBe(5500);

    const slots = await prisma.appointmentStaff.findMany({
      where: { appointmentId: appointment.id },
    });
    expect(slots).toHaveLength(1);
    expect(slots[0]?.isActive).toBe(true);

    const resources = await prisma.appointmentResource.findMany({
      where: { appointmentId: appointment.id },
    });
    expect(resources.length).toBeGreaterThan(0);
  });

  it("rejects an exactly overlapping booking for the same staff member", async () => {
    await createAppointment(bookingInput({ startAt: at(11 * 60) }));

    await expect(
      createAppointment(bookingInput({ startAt: at(11 * 60) })),
    ).rejects.toBeInstanceOf(BookingRejectedError);
  });

  it("rejects a partially overlapping booking", async () => {
    await createAppointment(bookingInput({ startAt: at(13 * 60) }));

    // 13:30–14:30 overlaps the second half of 13:00–14:00.
    await expect(
      createAppointment(bookingInput({ startAt: at(13 * 60 + 30) })),
    ).rejects.toThrow();
  });

  it("allows a booking that starts exactly when the previous one ends", async () => {
    await createAppointment(bookingInput({ startAt: at(15 * 60) }));

    // Half-open intervals: 16:00 does not collide with a booking ending 16:00.
    const second = await createAppointment(bookingInput({ startAt: at(16 * 60) }));
    expect(second.id).toBeTruthy();
  });

  it("allows the same time for a different staff member", async () => {
    await createAppointment(
      bookingInput({ startAt: at(17 * 60), staffId: tenant.staffIds[0]! }),
    );

    const second = await createAppointment(
      bookingInput({ startAt: at(17 * 60), staffId: tenant.staffIds[1]! }),
    );
    expect(second.id).toBeTruthy();
  });

  it("refuses a third concurrent booking when only two chairs exist", async () => {
    // Both staff booked at 18:00 consumes both chairs.
    await createAppointment(
      bookingInput({ startAt: at(18 * 60), staffId: tenant.staffIds[0]! }),
    );
    await createAppointment(
      bookingInput({ startAt: at(18 * 60), staffId: tenant.staffIds[1]! }),
    );

    // A third staff member would have nowhere to sit the customer. Adding one
    // proves the resource constraint bites independently of staff capacity.
    const third = await prisma.staff.create({
      data: {
        organizationId: tenant.organizationId,
        code: `S3-${Date.now()}`,
        name: "third",
        displayName: "THIRD",
        stores: { create: { storeId: tenant.storeId } },
        serviceStaff: { create: { serviceId: tenant.serviceId } },
        shifts: {
          create: {
            storeId: tenant.storeId,
            date: new Date(`${TEST_DATE}T00:00:00.000Z`),
            type: "work",
            startMinute: 9 * 60,
            endMinute: 21 * 60,
          },
        },
      },
      select: { id: true },
    });

    await expect(
      createAppointment(bookingInput({ startAt: at(18 * 60), staffId: third.id })),
    ).rejects.toMatchObject({ reason: "RESOURCE_UNAVAILABLE" });
  });
});

describe("concurrent booking of the same slot", () => {
  it("lets exactly one of two simultaneous requests win", async () => {
    const startAt = at(10 * 60, "2027-06-08");

    const results = await Promise.allSettled([
      createAppointment(bookingInput({ startAt, now: at(9 * 60, "2027-06-08") })),
      createAppointment(bookingInput({ startAt, now: at(9 * 60, "2027-06-08") })),
    ]);

    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    // Whether the loser is stopped by the pre-check or by the database
    // constraint depends on commit timing; both are correct outcomes.
    const reason = (rejected[0] as PromiseRejectedResult).reason;
    expect(
      reason instanceof BookingConflictError || reason instanceof BookingRejectedError,
    ).toBe(true);

    // Exactly one active staff slot exists for that instant.
    const active = await prisma.appointmentStaff.count({
      where: { staffId: tenant.staffIds[0]!, startAt, isActive: true },
    });
    expect(active).toBe(1);
  });

  it("survives five simultaneous attempts on one slot", async () => {
    const startAt = at(12 * 60, "2027-06-09");

    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () =>
        createAppointment(bookingInput({ startAt, now: at(9 * 60, "2027-06-09") })),
      ),
    );

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);

    const active = await prisma.appointmentStaff.count({
      where: { staffId: tenant.staffIds[0]!, startAt, isActive: true },
    });
    expect(active).toBe(1);
  });
});

describe("processing gaps", () => {
  it("frees the stylist during colour processing but keeps the chair", async () => {
    const startAt = at(10 * 60, "2027-06-10");

    const colour = await createAppointment(
      bookingInput({
        startAt,
        serviceIds: [tenant.colourServiceId],
        now: at(9 * 60, "2027-06-10"),
      }),
    );

    const slots = await prisma.appointmentStaff.findMany({
      where: { appointmentId: colour.id },
      orderBy: { startAt: "asc" },
    });

    // Two staff blocks with a 30-minute hole between them.
    expect(slots).toHaveLength(2);
    expect(slots[1]!.startAt.getTime() - slots[0]!.endAt.getTime()).toBe(30 * 60_000);

    // The chair is held for the whole 90 minutes.
    const resources = await prisma.appointmentResource.findMany({
      where: { appointmentId: colour.id },
    });
    const held =
      Math.max(...resources.map((row) => row.endAt.getTime())) -
      Math.min(...resources.map((row) => row.startAt.getTime()));
    expect(held).toBe(90 * 60_000);

    // A 30-minute cut fits exactly in the processing gap — on the other chair.
    const quick = await prisma.service.create({
      data: {
        organizationId: tenant.organizationId,
        storeId: tenant.storeId,
        categoryId: (await prisma.serviceCategory.findFirstOrThrow({
          where: { organizationId: tenant.organizationId },
          select: { id: true },
        })).id,
        name: "前髪カット",
        price: 1650,
        durationMinutes: 30,
        serviceStaff: { create: { staffId: tenant.staffIds[0]! } },
      },
      select: { id: true },
    });

    const filler = await createAppointment(
      bookingInput({
        startAt: new Date(startAt.getTime() + 30 * 60_000),
        serviceIds: [quick.id],
        customerId: tenant.customerIds[1]!,
        now: at(9 * 60, "2027-06-10"),
      }),
    );

    expect(filler.id).toBeTruthy();
  });
});

describe("cancellation frees the slot", () => {
  it("releases the time so another customer can book it", async () => {
    const startAt = at(14 * 60, "2027-06-11");

    const first = await createAppointment(
      bookingInput({ startAt, now: at(9 * 60, "2027-06-11") }),
    );

    // Occupied: a second booking must fail.
    await expect(
      createAppointment(bookingInput({ startAt, now: at(9 * 60, "2027-06-11") })),
    ).rejects.toThrow();

    await changeAppointmentStatus({
      appointmentId: first.id,
      organizationId: tenant.organizationId,
      toStatus: "cancelled",
      reason: "test",
    });

    // The rows survive for history, but no longer block.
    const slots = await prisma.appointmentStaff.findMany({
      where: { appointmentId: first.id },
    });
    expect(slots.length).toBeGreaterThan(0);
    expect(slots.every((slot) => slot.isActive === false)).toBe(true);

    const replacement = await createAppointment(
      bookingInput({
        startAt,
        customerId: tenant.customerIds[1]!,
        now: at(9 * 60, "2027-06-11"),
      }),
    );
    expect(replacement.id).toBeTruthy();
  });

  it("counts a no-show against the customer", async () => {
    const startAt = at(16 * 60, "2027-06-11");

    const appointment = await createAppointment(
      bookingInput({
        startAt,
        customerId: tenant.customerIds[0]!,
        now: at(9 * 60, "2027-06-11"),
      }),
    );

    const before = await prisma.customer.findUniqueOrThrow({
      where: { id: tenant.customerIds[0]! },
      select: { noShowCount: true },
    });

    await changeAppointmentStatus({
      appointmentId: appointment.id,
      organizationId: tenant.organizationId,
      toStatus: "no_show",
    });

    const after = await prisma.customer.findUniqueOrThrow({
      where: { id: tenant.customerIds[0]! },
      select: { noShowCount: true },
    });

    expect(after.noShowCount).toBe(before.noShowCount + 1);
  });
});

describe("staff blocks", () => {
  it("prevents a booking during a manual block", async () => {
    const startAt = at(10 * 60, "2027-06-12");

    await createStaffBlock({
      organizationId: tenant.organizationId,
      storeId: tenant.storeId,
      staffId: tenant.staffIds[0]!,
      startAt,
      endAt: new Date(startAt.getTime() + 60 * 60_000),
      kind: "block",
      note: "ミーティング",
    });

    await expect(
      createAppointment(
        bookingInput({ startAt, now: at(9 * 60, "2027-06-12") }),
      ),
    ).rejects.toThrow();
  });

  it("refuses a block that overlaps an existing block", async () => {
    const startAt = at(15 * 60, "2027-06-12");

    await createStaffBlock({
      organizationId: tenant.organizationId,
      storeId: tenant.storeId,
      staffId: tenant.staffIds[1]!,
      startAt,
      endAt: new Date(startAt.getTime() + 60 * 60_000),
      kind: "break_time",
    });

    await expect(
      createStaffBlock({
        organizationId: tenant.organizationId,
        storeId: tenant.storeId,
        staffId: tenant.staffIds[1]!,
        startAt: new Date(startAt.getTime() + 30 * 60_000),
        endAt: new Date(startAt.getTime() + 90 * 60_000),
        kind: "block",
      }),
    ).rejects.toBeInstanceOf(BookingConflictError);
  });
});

describe("rescheduleAppointment", () => {
  it("moves a booking and does not collide with itself", async () => {
    const startAt = at(10 * 60, "2027-06-13");

    const appointment = await createAppointment(
      bookingInput({ startAt, now: at(9 * 60, "2027-06-13") }),
    );

    const moved = await rescheduleAppointment({
      appointmentId: appointment.id,
      organizationId: tenant.organizationId,
      startAt: new Date(startAt.getTime() + 30 * 60_000),
      now: at(9 * 60, "2027-06-13"),
    });

    expect(moved.startAt.getTime()).toBe(startAt.getTime() + 30 * 60_000);

    const slots = await prisma.appointmentStaff.findMany({
      where: { appointmentId: appointment.id, isActive: true },
    });
    expect(slots).toHaveLength(1);
    expect(slots[0]?.startAt.getTime()).toBe(startAt.getTime() + 30 * 60_000);
  });

  it("refuses to move onto an occupied slot", async () => {
    const first = await createAppointment(
      bookingInput({ startAt: at(12 * 60, "2027-06-14"), now: at(9 * 60, "2027-06-14") }),
    );
    const second = await createAppointment(
      bookingInput({
        startAt: at(14 * 60, "2027-06-14"),
        customerId: tenant.customerIds[1]!,
        now: at(9 * 60, "2027-06-14"),
      }),
    );

    await expect(
      rescheduleAppointment({
        appointmentId: second.id,
        organizationId: tenant.organizationId,
        startAt: at(12 * 60, "2027-06-14"),
        now: at(9 * 60, "2027-06-14"),
      }),
    ).rejects.toThrow();

    // The failed move must leave the original booking intact and blocking.
    const stillActive = await prisma.appointmentStaff.count({
      where: { appointmentId: first.id, isActive: true },
    });
    expect(stillActive).toBe(1);
  });
});
