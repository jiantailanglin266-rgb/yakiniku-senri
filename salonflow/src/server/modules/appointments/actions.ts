"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireContext, requirePermission } from "@/server/auth/context";
import { PERMISSIONS } from "@/server/permissions/catalog";
import { AUDIT_ACTIONS, writeAuditLog } from "@/server/observability/audit";
import { prisma } from "@/server/db/client";
import {
  BookingConflictError,
  BookingRejectedError,
  changeAppointmentStatus,
  createAppointment,
  createStaffBlock,
  rescheduleAppointment,
} from "./booking-service";
import { InvalidTransitionError, type AppointmentStatus } from "./state-machine";

/**
 * Server actions for the appointment ledger.
 *
 * Each one re-derives the tenant from the session and re-checks the permission
 * server-side. The UI hiding a button is a convenience; this is the control.
 */

export interface ActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

const statusSchema = z.object({
  appointmentId: z.string().min(1),
  toStatus: z.enum([
    "pending",
    "confirmed",
    "checked_in",
    "in_service",
    "completed",
    "cancelled",
    "no_show",
  ]),
  reason: z.string().max(500).optional(),
});

export async function changeStatusAction(formData: FormData): Promise<ActionResult> {
  const context = await requireContext();

  const parsed = statusSchema.safeParse({
    appointmentId: formData.get("appointmentId"),
    toStatus: formData.get("toStatus"),
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) return { ok: false, error: "errors.validation" };

  const appointment = await prisma.appointment.findFirst({
    where: { id: parsed.data.appointmentId, organizationId: context.organizationId },
    select: { id: true, storeId: true, status: true },
  });
  if (!appointment) return { ok: false, error: "errors.notFound" };

  requirePermission(context, PERMISSIONS.RESERVATION_WRITE, appointment.storeId);

  try {
    await changeAppointmentStatus({
      appointmentId: appointment.id,
      organizationId: context.organizationId,
      toStatus: parsed.data.toStatus as AppointmentStatus,
      reason: parsed.data.reason ?? null,
      actor: { id: context.user.id, label: context.user.name },
    });

    await writeAuditLog(context, {
      action: AUDIT_ACTIONS.APPOINTMENT_STATUS_CHANGED,
      entityType: "Appointment",
      entityId: appointment.id,
      storeId: appointment.storeId,
      before: { status: appointment.status },
      after: { status: parsed.data.toStatus },
      meta: { reason: parsed.data.reason },
    });

    revalidatePath("/admin/schedule");
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    if (error instanceof InvalidTransitionError) {
      return { ok: false, error: error.message };
    }
    if (error instanceof BookingRejectedError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

const createSchema = z.object({
  storeId: z.string().min(1),
  customerId: z.string().min(1).optional(),
  guestName: z.string().max(100).optional(),
  guestPhone: z.string().max(40).optional(),
  guestEmail: z.string().max(320).optional(),
  serviceIds: z.array(z.string().min(1)).min(1),
  optionIds: z.array(z.string().min(1)).optional(),
  staffId: z.string().min(1),
  startAt: z.string().min(1),
  isDesignated: z.boolean().optional(),
  customerNote: z.string().max(2000).optional(),
});

export async function createAppointmentAction(
  input: z.input<typeof createSchema>,
): Promise<ActionResult & { appointmentId?: string }> {
  const context = await requireContext();

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "errors.validation" };

  requirePermission(context, PERMISSIONS.RESERVATION_WRITE, parsed.data.storeId);

  const startAt = new Date(parsed.data.startAt);
  if (Number.isNaN(startAt.getTime())) return { ok: false, error: "errors.validation" };

  try {
    const appointment = await createAppointment({
      organizationId: context.organizationId,
      storeId: parsed.data.storeId,
      customerId: parsed.data.customerId ?? null,
      guest: parsed.data.guestName
        ? {
            name: parsed.data.guestName,
            phone: parsed.data.guestPhone ?? null,
            email: parsed.data.guestEmail ?? null,
          }
        : null,
      serviceIds: parsed.data.serviceIds,
      optionIds: parsed.data.optionIds ?? [],
      staffId: parsed.data.staffId,
      startAt,
      source: "staff_entry",
      isDesignated: parsed.data.isDesignated ?? false,
      customerNote: parsed.data.customerNote ?? null,
      // Staff-entered bookings are confirmed immediately even at a store that
      // otherwise operates on request-and-approve: the staff member is the
      // approver, and asking them to approve their own entry is busywork.
      forceStatus: "confirmed",
      actor: { id: context.user.id, label: context.user.name },
    });

    await writeAuditLog(context, {
      action: AUDIT_ACTIONS.APPOINTMENT_CREATED,
      entityType: "Appointment",
      entityId: appointment.id,
      storeId: parsed.data.storeId,
      after: {
        reference: appointment.reference,
        startAt: appointment.startAt,
        staffId: parsed.data.staffId,
      },
    });

    revalidatePath("/admin/schedule");
    return { ok: true, appointmentId: appointment.id };
  } catch (error) {
    if (error instanceof BookingConflictError) return { ok: false, error: "errors.slotTaken" };
    if (error instanceof BookingRejectedError) return { ok: false, error: error.message };
    throw error;
  }
}

const rescheduleSchema = z.object({
  appointmentId: z.string().min(1),
  startAt: z.string().min(1),
  staffId: z.string().min(1).optional(),
});

export async function rescheduleAction(
  input: z.input<typeof rescheduleSchema>,
): Promise<ActionResult> {
  const context = await requireContext();

  const parsed = rescheduleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "errors.validation" };

  const appointment = await prisma.appointment.findFirst({
    where: { id: parsed.data.appointmentId, organizationId: context.organizationId },
    select: { id: true, storeId: true, startAt: true },
  });
  if (!appointment) return { ok: false, error: "errors.notFound" };

  requirePermission(context, PERMISSIONS.RESERVATION_WRITE, appointment.storeId);

  const startAt = new Date(parsed.data.startAt);
  if (Number.isNaN(startAt.getTime())) return { ok: false, error: "errors.validation" };

  try {
    const updated = await rescheduleAppointment({
      appointmentId: appointment.id,
      organizationId: context.organizationId,
      startAt,
      staffId: parsed.data.staffId ?? null,
      actor: { id: context.user.id, label: context.user.name },
    });

    await writeAuditLog(context, {
      action: AUDIT_ACTIONS.APPOINTMENT_UPDATED,
      entityType: "Appointment",
      entityId: appointment.id,
      storeId: appointment.storeId,
      before: { startAt: appointment.startAt },
      after: { startAt: updated.startAt, staffId: parsed.data.staffId },
    });

    revalidatePath("/admin/schedule");
    return { ok: true };
  } catch (error) {
    if (error instanceof BookingConflictError) return { ok: false, error: "errors.slotTaken" };
    if (error instanceof BookingRejectedError) return { ok: false, error: error.message };
    throw error;
  }
}

const blockSchema = z.object({
  storeId: z.string().min(1),
  staffId: z.string().min(1),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  kind: z.enum(["break_time", "block"]),
  note: z.string().max(200).optional(),
});

export async function createBlockAction(input: z.input<typeof blockSchema>): Promise<ActionResult> {
  const context = await requireContext();

  const parsed = blockSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "errors.validation" };

  requirePermission(context, PERMISSIONS.RESERVATION_WRITE, parsed.data.storeId);

  const startAt = new Date(parsed.data.startAt);
  const endAt = new Date(parsed.data.endAt);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return { ok: false, error: "errors.validation" };
  }
  if (endAt <= startAt) return { ok: false, error: "errors.validation" };

  try {
    await createStaffBlock({
      organizationId: context.organizationId,
      storeId: parsed.data.storeId,
      staffId: parsed.data.staffId,
      startAt,
      endAt,
      kind: parsed.data.kind,
      note: parsed.data.note ?? null,
    });

    revalidatePath("/admin/schedule");
    return { ok: true };
  } catch (error) {
    if (error instanceof BookingConflictError) return { ok: false, error: "errors.slotTaken" };
    throw error;
  }
}
