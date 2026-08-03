import "server-only";

import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";

import { isOverlapViolation, isSerializationFailure, prisma } from "@/server/db/client";
import { verifySlot, type SlotRejectionReason } from "@/server/booking-engine/availability";
import { buildOccupancyPlan, compactSegments } from "@/server/booking-engine/occupancy";
import { normalizeEmail, normalizePhone } from "@/lib/normalize";
import { zonedDateISO } from "@/lib/time";
import { logger } from "@/server/observability/logger";
import { queueNotification } from "@/server/notifications/outbox";
import {
  loadResourceAvailability,
  loadServiceSpecs,
  loadStaffAvailability,
  loadStoreBookingContext,
} from "./availability-service";
import {
  assertTransition,
  occupiesCalendar,
  timestampFieldFor,
  type AppointmentStatus,
} from "./state-machine";

/**
 * Booking write operations.
 *
 * This module owns the transaction boundary for creating and mutating
 * appointments. Its central responsibility is that two customers can never end
 * up with the same stylist at the same time — see docs/PHASE0_DESIGN.md §7.
 */

export class BookingConflictError extends Error {
  readonly code: "SLOT_TAKEN";
  constructor(message = "選択された時間は、ほかの予約で埋まりました") {
    super(message);
    this.name = "BookingConflictError";
    this.code = "SLOT_TAKEN";
  }
}

export class BookingRejectedError extends Error {
  readonly reason: SlotRejectionReason | "NO_SERVICES" | "STORE_NOT_FOUND" | "INVALID_INPUT";
  constructor(
    reason: SlotRejectionReason | "NO_SERVICES" | "STORE_NOT_FOUND" | "INVALID_INPUT",
    message?: string,
  ) {
    super(message ?? REJECTION_MESSAGES[reason]);
    this.name = "BookingRejectedError";
    this.reason = reason;
  }
}

const REJECTION_MESSAGES: Record<string, string> = {
  STORE_CLOSED: "その日は休業日です",
  OUTSIDE_BUSINESS_HOURS: "営業時間外の時間帯です",
  BOOKING_CUTOFF_PASSED: "予約の受付時間を過ぎています",
  TOO_FAR_IN_ADVANCE: "予約可能な期間を超えています",
  STAFF_UNAVAILABLE: "選択されたスタッフはその時間に対応できません",
  STAFF_CANNOT_PERFORM: "選択されたスタッフはこのメニューを担当できません",
  RESOURCE_UNAVAILABLE: "設備に空きがありません",
  NO_SERVICES: "メニューが選択されていません",
  STORE_NOT_FOUND: "店舗が見つかりません",
  INVALID_INPUT: "入力内容を確認してください",
};

export interface CreateAppointmentInput {
  organizationId: string;
  storeId: string;
  customerId?: string | null;
  guest?: {
    name: string;
    phone?: string | null;
    email?: string | null;
  } | null;
  serviceIds: string[];
  optionIds?: string[];
  staffId: string;
  startAt: Date;
  source:
    "public_web" | "phone" | "walk_in" | "next_visit" | "staff_entry" | "external" | "imported";
  isDesignated?: boolean;
  customerNote?: string | null;
  staffNote?: string | null;
  /** Overrides the store's approval mode; used by staff-entered bookings. */
  forceStatus?: Extract<AppointmentStatus, "pending" | "confirmed">;
  actor?: { id?: string | null; label?: string | null };
  now?: Date;
}

export interface CreatedAppointment {
  id: string;
  reference: string;
  startAt: Date;
  endAt: Date;
  status: AppointmentStatus;
  staffId: string;
  totalAmount: number;
}

/**
 * Create an appointment.
 *
 * Sequence, and why each step exists:
 *
 *   1. Read menu + store rules (cheap, outside the transaction).
 *   2. Recompute duration and price server-side. Whatever the client sent for
 *      those is ignored — a manipulated form must not produce a free booking.
 *   3. Open a transaction, re-read the volatile conflict data *inside* it,
 *      and re-validate. This closes the window between "the calendar said it
 *      was free" and "we are about to insert".
 *   4. Insert. The GiST exclusion constraints reject anything the re-check
 *      could not see because a concurrent transaction had not committed yet.
 *   5. Queue the notification in the same transaction, so an email is never
 *      sent for a booking that rolled back.
 */
export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<CreatedAppointment> {
  const now = input.now ?? new Date();

  if (input.serviceIds.length === 0) {
    throw new BookingRejectedError("NO_SERVICES");
  }

  const storeContext = await loadStoreBookingContext(
    input.storeId,
    zonedDateISO(input.startAt, "UTC"),
    zonedDateISO(input.startAt, "UTC"),
  );
  if (!storeContext) throw new BookingRejectedError("STORE_NOT_FOUND");

  const store = await prisma.store.findFirst({
    where: { id: input.storeId, organizationId: input.organizationId, deletedAt: null },
    select: { id: true, approvalMode: true, timezone: true, name: true, slug: true },
  });
  if (!store) throw new BookingRejectedError("STORE_NOT_FOUND");

  const dateISO = zonedDateISO(input.startAt, store.timezone);

  const services = await loadServiceSpecs(
    input.organizationId,
    input.serviceIds,
    input.optionIds ?? [],
  );
  if (services.length !== input.serviceIds.length) {
    throw new BookingRejectedError("INVALID_INPUT", "選択されたメニューが利用できません");
  }

  const planFactory = (durationFactorBps: number) =>
    buildOccupancyPlan(services, {
      durationFactorBps,
      bufferMinutes: storeContext.bufferMinutes,
    });

  const status: AppointmentStatus =
    input.forceStatus ?? (store.approvalMode === "request" ? "pending" : "confirmed");

  return runWithRetry(async () =>
    prisma.$transaction(
      async (tx) => {
        // --- Step 3: re-validate against a transaction-consistent snapshot ---
        const [staff, resources] = await Promise.all([
          loadStaffAvailability({
            storeId: input.storeId,
            dateISO,
            timeZone: store.timezone,
            serviceIds: input.serviceIds,
            db: tx,
          }),
          loadResourceAvailability(input.storeId, dateISO, store.timezone, null, tx),
        ]);

        const candidate = staff.find((entry) => entry.staffId === input.staffId);
        const plan = planFactory(candidate?.durationFactorBps ?? 10_000);

        const verdict = verifySlot({
          dateISO,
          timeZone: store.timezone,
          now,
          policy: storeContext.policy,
          businessHours: storeContext.businessHours,
          holidays: storeContext.holidays,
          plan,
          planFactory,
          staff,
          resources,
          requireResources: resources.length > 0,
          startAt: input.startAt,
          staffId: input.staffId,
        });

        if (!verdict.ok) throw new BookingRejectedError(verdict.reason);

        const slot = verdict.slot;
        const reference = await generateReference(tx, store.timezone, input.startAt);

        const appointment = await tx.appointment.create({
          data: {
            organizationId: input.organizationId,
            storeId: input.storeId,
            customerId: input.customerId ?? null,
            reference,
            status,
            source: input.source,
            startAt: slot.startAt,
            endAt: slot.endAt,
            isDesignated: input.isDesignated ?? false,
            subtotalAmount: plan.subtotal,
            discountAmount: 0,
            totalAmount: plan.subtotal,
            customerNote: input.customerNote ?? null,
            staffNote: input.staffNote ?? null,
            requestedAt: status === "pending" ? now : null,
            confirmedAt: status === "confirmed" ? now : null,
            approvalDueAt: status === "pending" ? new Date(now.getTime() + 24 * 3600_000) : null,
            guestName: input.guest?.name ?? null,
            guestPhone: normalizePhone(input.guest?.phone) ?? input.guest?.phone ?? null,
            guestEmail: normalizeEmail(input.guest?.email),
            createdBy: input.actor?.id ?? null,
          },
          select: { id: true, reference: true, startAt: true, endAt: true },
        });

        // Menu snapshot rows.
        for (const window of plan.serviceWindows) {
          const spec = services.find((service) => service.serviceId === window.serviceId);
          const appointmentService = await tx.appointmentService.create({
            data: {
              appointmentId: appointment.id,
              serviceId: window.serviceId,
              sequence: window.sequence,
              nameSnapshot: window.name,
              priceSnapshot: window.price,
              durationMinutes: window.durationMinutes,
              startAt: new Date(slot.startAt.getTime() + window.startOffset * 60_000),
              endAt: new Date(slot.startAt.getTime() + window.endOffset * 60_000),
            },
            select: { id: true },
          });

          for (const option of spec?.options ?? []) {
            await tx.appointmentServiceOption.create({
              data: {
                appointmentServiceId: appointmentService.id,
                serviceOptionId: option.serviceOptionId,
                nameSnapshot: option.name,
                priceSnapshot: option.price,
                durationMinutes: option.durationMinutes,
              },
            });
          }
        }

        // --- Step 4: the rows the exclusion constraints guard ---------------
        const staffSegments = compactSegments(plan.staffSegments);
        await tx.appointmentStaff.createMany({
          data: staffSegments.map((segment, index) => ({
            organizationId: input.organizationId,
            storeId: input.storeId,
            appointmentId: appointment.id,
            staffId: input.staffId,
            kind: "service" as const,
            startAt: new Date(slot.startAt.getTime() + segment.startOffset * 60_000),
            endAt: new Date(slot.startAt.getTime() + segment.endOffset * 60_000),
            isActive: true,
            isDesignated: input.isDesignated ?? false,
            sequence: index,
          })),
        });

        if (slot.resourceIds.length > 0) {
          const resourceRows: Prisma.AppointmentResourceCreateManyInput[] = [];
          const byType = new Map<string, string[]>();
          for (const resourceId of slot.resourceIds) {
            const resource = resources.find((entry) => entry.resourceId === resourceId);
            if (!resource) continue;
            const bucket = byType.get(resource.resourceTypeId) ?? [];
            bucket.push(resourceId);
            byType.set(resource.resourceTypeId, bucket);
          }

          for (const segment of plan.resourceSegments) {
            for (const resourceId of byType.get(segment.resourceTypeId) ?? []) {
              resourceRows.push({
                organizationId: input.organizationId,
                storeId: input.storeId,
                appointmentId: appointment.id,
                resourceId,
                startAt: new Date(slot.startAt.getTime() + segment.startOffset * 60_000),
                endAt: new Date(slot.startAt.getTime() + segment.endOffset * 60_000),
                isActive: true,
                sequence: segment.sequence,
              });
            }
          }

          if (resourceRows.length > 0) {
            await tx.appointmentResource.createMany({ data: resourceRows });
          }
        }

        await tx.appointmentStatusHistory.create({
          data: {
            appointmentId: appointment.id,
            fromStatus: null,
            toStatus: status,
            reason: "created",
            actorId: input.actor?.id ?? null,
            actorLabel: input.actor?.label ?? null,
          },
        });

        // --- Step 5: outbox, inside the same transaction --------------------
        await queueNotification(tx, {
          organizationId: input.organizationId,
          storeId: input.storeId,
          customerId: input.customerId ?? null,
          appointmentId: appointment.id,
          event: status === "pending" ? "appointment_requested" : "appointment_confirmed",
          channel: "email",
          recipient:
            normalizeEmail(input.guest?.email) ??
            (input.customerId ? await customerEmail(tx, input.customerId) : null),
          variables: {
            reference: appointment.reference,
            storeName: store.name,
            storeSlug: store.slug,
            startAt: appointment.startAt.toISOString(),
            timeZone: store.timezone,
            serviceNames: plan.serviceWindows.map((window) => window.name).join("、"),
            totalAmount: String(plan.subtotal),
          },
        });

        return {
          id: appointment.id,
          reference: appointment.reference,
          startAt: appointment.startAt,
          endAt: appointment.endAt,
          status,
          staffId: input.staffId,
          totalAmount: plan.subtotal,
        } satisfies CreatedAppointment;
      },
      { timeout: 15_000 },
    ),
  );
}

/**
 * Retry once on a transient serialization failure, and translate an exclusion
 * violation into the conflict the caller can act on.
 */
async function runWithRetry<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (isOverlapViolation(error)) {
      throw new BookingConflictError();
    }
    if (isSerializationFailure(error)) {
      logger.warn("booking_serialization_retry", {});
      try {
        return await operation();
      } catch (retryError) {
        if (isOverlapViolation(retryError)) throw new BookingConflictError();
        throw retryError;
      }
    }
    throw error;
  }
}

/**
 * Human-readable booking reference, unique per store-day.
 *
 * Random suffix rather than a sequence: a guessable reference would let anyone
 * enumerate other customers' bookings on the public confirmation page.
 */
async function generateReference(
  tx: Prisma.TransactionClient,
  timeZone: string,
  startAt: Date,
): Promise<string> {
  const datePart = zonedDateISO(startAt, timeZone).replace(/-/g, "");

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = randomBytes(3).toString("hex").toUpperCase();
    const reference = `A-${datePart}-${suffix}`;
    const existing = await tx.appointment.findUnique({
      where: { reference },
      select: { id: true },
    });
    if (!existing) return reference;
  }

  // Astronomically unlikely; fall back to a wider suffix rather than looping.
  return `A-${datePart}-${randomBytes(6).toString("hex").toUpperCase()}`;
}

async function customerEmail(
  tx: Prisma.TransactionClient,
  customerId: string,
): Promise<string | null> {
  const customer = await tx.customer.findUnique({
    where: { id: customerId },
    select: { email: true },
  });
  return normalizeEmail(customer?.email);
}

export interface ChangeStatusInput {
  appointmentId: string;
  organizationId: string;
  toStatus: AppointmentStatus;
  reason?: string | null;
  actor?: { id?: string | null; label?: string | null };
  now?: Date;
}

/**
 * Move an appointment through its lifecycle.
 *
 * When the new status no longer occupies the calendar, the staff and resource
 * slots are deactivated rather than deleted: the time is freed for other
 * customers while the record of what was booked survives for reporting and
 * for the no-show count on the customer's profile.
 */
export async function changeAppointmentStatus(
  input: ChangeStatusInput,
): Promise<{ id: string; status: AppointmentStatus }> {
  const now = input.now ?? new Date();

  return prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.findFirst({
      where: {
        id: input.appointmentId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
        storeId: true,
        customerId: true,
        startAt: true,
        reference: true,
        store: { select: { name: true, timezone: true } },
      },
    });

    if (!appointment) {
      throw new BookingRejectedError("INVALID_INPUT", "予約が見つかりません");
    }

    const from = appointment.status as AppointmentStatus;
    assertTransition(from, input.toStatus);

    const timestampField = timestampFieldFor(input.toStatus);
    const data: Prisma.AppointmentUpdateInput = {
      status: input.toStatus,
      version: { increment: 1 },
      updatedBy: input.actor?.id ?? null,
      ...(timestampField ? { [timestampField]: now } : {}),
      ...(input.toStatus === "cancelled" ? { cancelReason: input.reason ?? null } : {}),
    };

    await tx.appointment.update({ where: { id: appointment.id }, data });

    if (!occupiesCalendar(input.toStatus)) {
      await tx.appointmentStaff.updateMany({
        where: { appointmentId: appointment.id },
        data: { isActive: false },
      });
      await tx.appointmentResource.updateMany({
        where: { appointmentId: appointment.id },
        data: { isActive: false },
      });
    }

    await tx.appointmentStatusHistory.create({
      data: {
        appointmentId: appointment.id,
        fromStatus: from,
        toStatus: input.toStatus,
        reason: input.reason ?? null,
        actorId: input.actor?.id ?? null,
        actorLabel: input.actor?.label ?? null,
      },
    });

    // Keep the customer's cancellation counters honest — they drive the
    // no-show warning shown to reception when the customer books again.
    if (appointment.customerId) {
      if (input.toStatus === "cancelled") {
        await tx.customer.update({
          where: { id: appointment.customerId },
          data: { cancelCount: { increment: 1 } },
        });
      } else if (input.toStatus === "no_show") {
        await tx.customer.update({
          where: { id: appointment.customerId },
          data: { noShowCount: { increment: 1 } },
        });
      } else if (input.toStatus === "completed") {
        await tx.customer.update({
          where: { id: appointment.customerId },
          data: { visitCount: { increment: 1 }, lastVisitAt: now },
        });
        // `firstVisitAt` records the first ever visit, so it is written only
        // while still null rather than being overwritten on every completion.
        await tx.customer.updateMany({
          where: { id: appointment.customerId, firstVisitAt: null },
          data: { firstVisitAt: now },
        });
      }
    }

    if (input.toStatus === "cancelled" || input.toStatus === "confirmed") {
      await queueNotification(tx, {
        organizationId: input.organizationId,
        storeId: appointment.storeId,
        customerId: appointment.customerId,
        appointmentId: appointment.id,
        event: input.toStatus === "cancelled" ? "appointment_cancelled" : "appointment_confirmed",
        channel: "email",
        recipient: appointment.customerId ? await customerEmail(tx, appointment.customerId) : null,
        variables: {
          reference: appointment.reference,
          storeName: appointment.store.name,
          startAt: appointment.startAt.toISOString(),
          timeZone: appointment.store.timezone,
        },
      });
    }

    return { id: appointment.id, status: input.toStatus };
  });
}

export interface RescheduleInput {
  appointmentId: string;
  organizationId: string;
  startAt: Date;
  staffId?: string | null;
  actor?: { id?: string | null; label?: string | null };
  now?: Date;
}

/**
 * Move an appointment to a new time and/or staff member.
 *
 * Implemented as "deactivate the old slots, insert new ones, re-validate" so
 * the exclusion constraints apply to the new position exactly as they would
 * to a fresh booking. The appointment's own slots are excluded from the
 * conflict check, otherwise it would collide with itself.
 */
export async function rescheduleAppointment(
  input: RescheduleInput,
): Promise<{ id: string; startAt: Date; endAt: Date }> {
  const now = input.now ?? new Date();

  return runWithRetry(async () =>
    prisma.$transaction(
      async (tx) => {
        const appointment = await tx.appointment.findFirst({
          where: {
            id: input.appointmentId,
            organizationId: input.organizationId,
            deletedAt: null,
          },
          select: {
            id: true,
            storeId: true,
            status: true,
            customerId: true,
            reference: true,
            isDesignated: true,
            services: {
              orderBy: { sequence: "asc" },
              select: {
                serviceId: true,
                options: { select: { serviceOptionId: true } },
              },
            },
            staffSlots: {
              where: { kind: "service" },
              select: { staffId: true },
              take: 1,
            },
            store: { select: { timezone: true, name: true } },
          },
        });

        if (!appointment) {
          throw new BookingRejectedError("INVALID_INPUT", "予約が見つかりません");
        }
        if (!occupiesCalendar(appointment.status as AppointmentStatus)) {
          throw new BookingRejectedError(
            "INVALID_INPUT",
            "完了・キャンセル済みの予約は変更できません",
          );
        }

        const staffId = input.staffId ?? appointment.staffSlots[0]?.staffId;
        if (!staffId) throw new BookingRejectedError("STAFF_UNAVAILABLE");

        const serviceIds = appointment.services.map((service) => service.serviceId);
        const optionIds = appointment.services.flatMap((service) =>
          service.options.map((option) => option.serviceOptionId),
        );

        const dateISO = zonedDateISO(input.startAt, appointment.store.timezone);
        const storeContext = await loadStoreBookingContext(appointment.storeId, dateISO, dateISO);
        if (!storeContext) throw new BookingRejectedError("STORE_NOT_FOUND");

        const services = await loadServiceSpecs(input.organizationId, serviceIds, optionIds);
        const planFactory = (durationFactorBps: number) =>
          buildOccupancyPlan(services, {
            durationFactorBps,
            bufferMinutes: storeContext.bufferMinutes,
          });

        // Free the old slots first so they do not block the new position.
        await tx.appointmentStaff.updateMany({
          where: { appointmentId: appointment.id },
          data: { isActive: false },
        });
        await tx.appointmentResource.updateMany({
          where: { appointmentId: appointment.id },
          data: { isActive: false },
        });

        const [staff, resources] = await Promise.all([
          loadStaffAvailability({
            storeId: appointment.storeId,
            dateISO,
            timeZone: appointment.store.timezone,
            serviceIds,
            excludeAppointmentId: appointment.id,
            db: tx,
          }),
          loadResourceAvailability(
            appointment.storeId,
            dateISO,
            appointment.store.timezone,
            appointment.id,
            tx,
          ),
        ]);

        const candidate = staff.find((entry) => entry.staffId === staffId);
        const plan = planFactory(candidate?.durationFactorBps ?? 10_000);

        const verdict = verifySlot({
          dateISO,
          timeZone: appointment.store.timezone,
          now,
          policy: storeContext.policy,
          businessHours: storeContext.businessHours,
          holidays: storeContext.holidays,
          plan,
          planFactory,
          staff,
          resources,
          requireResources: resources.length > 0,
          startAt: input.startAt,
          staffId,
        });
        if (!verdict.ok) throw new BookingRejectedError(verdict.reason);

        const slot = verdict.slot;

        // Replace rather than update: the segment count can change when the
        // new staff member works at a different speed.
        await tx.appointmentStaff.deleteMany({ where: { appointmentId: appointment.id } });
        await tx.appointmentResource.deleteMany({ where: { appointmentId: appointment.id } });

        const staffSegments = compactSegments(plan.staffSegments);
        await tx.appointmentStaff.createMany({
          data: staffSegments.map((segment, index) => ({
            organizationId: input.organizationId,
            storeId: appointment.storeId,
            appointmentId: appointment.id,
            staffId,
            kind: "service" as const,
            startAt: new Date(slot.startAt.getTime() + segment.startOffset * 60_000),
            endAt: new Date(slot.startAt.getTime() + segment.endOffset * 60_000),
            isActive: true,
            isDesignated: appointment.isDesignated,
            sequence: index,
          })),
        });

        if (slot.resourceIds.length > 0) {
          const byType = new Map<string, string[]>();
          for (const resourceId of slot.resourceIds) {
            const resource = resources.find((entry) => entry.resourceId === resourceId);
            if (!resource) continue;
            const bucket = byType.get(resource.resourceTypeId) ?? [];
            bucket.push(resourceId);
            byType.set(resource.resourceTypeId, bucket);
          }

          const rows: Prisma.AppointmentResourceCreateManyInput[] = [];
          for (const segment of plan.resourceSegments) {
            for (const resourceId of byType.get(segment.resourceTypeId) ?? []) {
              rows.push({
                organizationId: input.organizationId,
                storeId: appointment.storeId,
                appointmentId: appointment.id,
                resourceId,
                startAt: new Date(slot.startAt.getTime() + segment.startOffset * 60_000),
                endAt: new Date(slot.startAt.getTime() + segment.endOffset * 60_000),
                isActive: true,
                sequence: segment.sequence,
              });
            }
          }
          if (rows.length > 0) await tx.appointmentResource.createMany({ data: rows });
        }

        // Keep the per-service windows aligned with the new start time.
        const windows = plan.serviceWindows;
        const existing = await tx.appointmentService.findMany({
          where: { appointmentId: appointment.id },
          orderBy: { sequence: "asc" },
          select: { id: true },
        });
        for (const [index, row] of existing.entries()) {
          const window = windows[index];
          if (!window) continue;
          await tx.appointmentService.update({
            where: { id: row.id },
            data: {
              startAt: new Date(slot.startAt.getTime() + window.startOffset * 60_000),
              endAt: new Date(slot.startAt.getTime() + window.endOffset * 60_000),
              durationMinutes: window.durationMinutes,
            },
          });
        }

        await tx.appointment.update({
          where: { id: appointment.id },
          data: {
            startAt: slot.startAt,
            endAt: slot.endAt,
            version: { increment: 1 },
            updatedBy: input.actor?.id ?? null,
          },
        });

        await queueNotification(tx, {
          organizationId: input.organizationId,
          storeId: appointment.storeId,
          customerId: appointment.customerId,
          appointmentId: appointment.id,
          event: "appointment_updated",
          channel: "email",
          recipient: appointment.customerId
            ? await customerEmail(tx, appointment.customerId)
            : null,
          variables: {
            reference: appointment.reference,
            storeName: appointment.store.name,
            startAt: slot.startAt.toISOString(),
            timeZone: appointment.store.timezone,
          },
        });

        return { id: appointment.id, startAt: slot.startAt, endAt: slot.endAt };
      },
      { timeout: 15_000 },
    ),
  );
}

/**
 * Block out staff time that is not an appointment — a break, a meeting, or a
 * manual "do not book" marker dragged onto the ledger.
 *
 * These rows go through the same exclusion constraint as bookings, so a block
 * genuinely prevents a booking rather than merely hinting at one.
 */
export async function createStaffBlock(input: {
  organizationId: string;
  storeId: string;
  staffId: string;
  startAt: Date;
  endAt: Date;
  kind: "break_time" | "block";
  note?: string | null;
}): Promise<{ id: string }> {
  try {
    const row = await prisma.appointmentStaff.create({
      data: {
        organizationId: input.organizationId,
        storeId: input.storeId,
        appointmentId: null,
        staffId: input.staffId,
        kind: input.kind,
        startAt: input.startAt,
        endAt: input.endAt,
        isActive: true,
        note: input.note ?? null,
      },
      select: { id: true },
    });
    return row;
  } catch (error) {
    if (isOverlapViolation(error)) throw new BookingConflictError();
    throw error;
  }
}
