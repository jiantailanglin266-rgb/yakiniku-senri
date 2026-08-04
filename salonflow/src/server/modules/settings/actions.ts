"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireContext } from "@/server/auth/context";
import { SettingsValidationError, updateBusinessHours, updateStoreSettings } from "./store-service";
import {
  archiveService,
  createService,
  createServiceCategory,
  updateService,
} from "./service-catalog";
import { archiveStaff, createStaff, deleteShift, saveShift, updateStaff } from "./staff-service";

/**
 * Server actions for the master-data screens.
 *
 * Each returns a result object instead of throwing. A form that loses the
 * operator's twenty minutes of typing to an error boundary is worse than one
 * that shows a red message under the field, and these screens are exactly
 * where a new tenant does its longest data entry.
 *
 * The `problems` array carries validation codes so the client can render every
 * failure at once rather than one per round-trip.
 */

export interface SettingsActionResult {
  ok: boolean;
  /** Validation codes, e.g. `hours.close_before_open`. */
  problems?: string[];
  error?: string;
  /** Non-blocking notices the operator should still see. */
  warnings?: string[];
  /** Id of the row a create action produced. */
  id?: string;
}

function fail(error: unknown): SettingsActionResult {
  if (error instanceof SettingsValidationError) {
    return { ok: false, problems: error.problems };
  }
  return {
    ok: false,
    error: error instanceof Error ? error.message : "errors.unexpected",
  };
}

const minute = z
  .number()
  .int()
  .min(0)
  .max(36 * 60);
const optionalMinute = minute.nullable();

const businessHoursSchema = z.object({
  storeId: z.string().min(1),
  hours: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        isClosed: z.boolean(),
        openMinute: minute,
        closeMinute: minute,
        breakStartMinute: optionalMinute,
        breakEndMinute: optionalMinute,
      }),
    )
    .length(7),
});

export async function updateBusinessHoursAction(
  input: z.input<typeof businessHoursSchema>,
): Promise<SettingsActionResult> {
  const context = await requireContext();

  const parsed = businessHoursSchema.safeParse(input);
  if (!parsed.success) return { ok: false, problems: ["errors.validation"] };

  try {
    const result = await updateBusinessHours(context, parsed.data.storeId, parsed.data.hours);
    revalidatePath("/admin/stores");
    revalidatePath("/admin/schedule");

    return {
      ok: true,
      // Saving "closed every day" is legitimate but leaves the public booking
      // page permanently empty. Say so rather than let the operator conclude
      // the site is broken.
      warnings: result.permanentlyClosed ? ["hours.all_days_closed"] : undefined,
    };
  } catch (error) {
    return fail(error);
  }
}

const storeSettingsSchema = z.object({
  storeId: z.string().min(1),
  name: z.string().min(1).max(120),
  phone: z.string().max(40).nullable(),
  postalCode: z.string().max(20).nullable(),
  prefecture: z.string().max(40).nullable(),
  city: z.string().max(80).nullable(),
  addressLine: z.string().max(200).nullable(),
  approvalMode: z.enum(["instant", "request"]),
  slotIntervalMinutes: z.number().int(),
  bookingCutoffMinutes: z.number().int(),
  minAdvanceMinutes: z.number().int(),
  maxAdvanceDays: z.number().int(),
  bufferMinutes: z.number().int(),
  cancelDeadlineHours: z.number().int(),
});

export async function updateStoreSettingsAction(
  input: z.input<typeof storeSettingsSchema>,
): Promise<SettingsActionResult> {
  const context = await requireContext();

  const parsed = storeSettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, problems: ["errors.validation"] };

  const { storeId, ...rest } = parsed.data;

  try {
    await updateStoreSettings(context, storeId, rest);
    revalidatePath("/admin/stores");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

const serviceSchema = z.object({
  categoryId: z.string().min(1),
  storeId: z.string().min(1).nullable(),
  name: z.string().min(1).max(120),
  description: z.string().max(2000).nullable(),
  price: z.number().int(),
  durationMinutes: z.number().int(),
  prepMinutes: z.number().int(),
  cleanupMinutes: z.number().int(),
  unattendedStartMinute: z.number().int().nullable(),
  unattendedMinutes: z.number().int().nullable(),
  isOnlineBookable: z.boolean(),
  allowsDesignation: z.boolean(),
  isActive: z.boolean(),
  displayOrder: z.number().int(),
  staffIds: z.array(z.string().min(1)),
});

export async function createServiceAction(
  input: z.input<typeof serviceSchema>,
): Promise<SettingsActionResult> {
  const context = await requireContext();

  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, problems: ["errors.validation"] };

  try {
    const id = await createService(context, parsed.data);
    revalidatePath("/admin/services");
    return { ok: true, id };
  } catch (error) {
    return fail(error);
  }
}

const serviceUpdateSchema = serviceSchema.extend({ serviceId: z.string().min(1) });

export async function updateServiceAction(
  input: z.input<typeof serviceUpdateSchema>,
): Promise<SettingsActionResult> {
  const context = await requireContext();

  const parsed = serviceUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, problems: ["errors.validation"] };

  const { serviceId, ...rest } = parsed.data;

  try {
    await updateService(context, serviceId, rest);
    revalidatePath("/admin/services");
    return { ok: true, id: serviceId };
  } catch (error) {
    return fail(error);
  }
}

export async function archiveServiceAction(serviceId: string): Promise<SettingsActionResult> {
  const context = await requireContext();

  if (typeof serviceId !== "string" || serviceId.length === 0) {
    return { ok: false, problems: ["errors.validation"] };
  }

  try {
    await archiveService(context, serviceId);
    revalidatePath("/admin/services");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

const categorySchema = z.object({
  name: z.string().min(1).max(120),
  displayOrder: z.number().int().min(0).default(0),
});

export async function createServiceCategoryAction(
  input: z.input<typeof categorySchema>,
): Promise<SettingsActionResult> {
  const context = await requireContext();

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, problems: ["errors.validation"] };

  try {
    const id = await createServiceCategory(context, parsed.data.name, parsed.data.displayOrder);
    revalidatePath("/admin/services");
    return { ok: true, id };
  } catch (error) {
    return fail(error);
  }
}

const staffSchema = z.object({
  name: z.string().min(1).max(120),
  nameKana: z.string().max(120).nullable(),
  displayName: z.string().min(1).max(120),
  title: z.string().max(80).nullable(),
  employmentType: z.enum(["full_time", "part_time", "contract", "freelance", "trainee"]),
  designationFee: z.number().int(),
  commissionBps: z.number().int().nullable(),
  maxConcurrent: z.number().int(),
  maxDailyAppointments: z.number().int().nullable(),
  isBookable: z.boolean(),
  isPubliclyVisible: z.boolean(),
  displayOrder: z.number().int(),
  storeIds: z.array(z.string().min(1)).min(1),
});

export async function createStaffAction(
  input: z.input<typeof staffSchema>,
): Promise<SettingsActionResult> {
  const context = await requireContext();

  const parsed = staffSchema.safeParse(input);
  if (!parsed.success) return { ok: false, problems: ["errors.validation"] };

  try {
    const id = await createStaff(context, parsed.data);
    revalidatePath("/admin/staff");
    return { ok: true, id };
  } catch (error) {
    return fail(error);
  }
}

const staffUpdateSchema = staffSchema.extend({ staffId: z.string().min(1) });

export async function updateStaffAction(
  input: z.input<typeof staffUpdateSchema>,
): Promise<SettingsActionResult> {
  const context = await requireContext();

  const parsed = staffUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, problems: ["errors.validation"] };

  const { staffId, ...rest } = parsed.data;

  try {
    await updateStaff(context, staffId, rest);
    revalidatePath("/admin/staff");
    return { ok: true, id: staffId };
  } catch (error) {
    return fail(error);
  }
}

export async function archiveStaffAction(staffId: string): Promise<SettingsActionResult> {
  const context = await requireContext();

  if (typeof staffId !== "string" || staffId.length === 0) {
    return { ok: false, problems: ["errors.validation"] };
  }

  try {
    const result = await archiveStaff(context, staffId);
    revalidatePath("/admin/staff");
    revalidatePath("/admin/schedule");

    return {
      ok: true,
      warnings:
        result.upcomingAppointments > 0
          ? [`staff.has_upcoming:${result.upcomingAppointments}`]
          : undefined,
    };
  } catch (error) {
    return fail(error);
  }
}

const shiftSchema = z.object({
  staffId: z.string().min(1),
  storeId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startMinute: z.number().int(),
  endMinute: z.number().int(),
  breakStartMinute: z.number().int().nullable(),
  breakEndMinute: z.number().int().nullable(),
  note: z.string().max(500).nullable(),
});

export async function saveShiftAction(
  input: z.input<typeof shiftSchema>,
): Promise<SettingsActionResult> {
  const context = await requireContext();

  const parsed = shiftSchema.safeParse(input);
  if (!parsed.success) return { ok: false, problems: ["errors.validation"] };

  try {
    const result = await saveShift(context, parsed.data);
    revalidatePath("/admin/staff");
    revalidatePath("/admin/schedule");

    return {
      ok: true,
      // A roster entry outside opening hours produces no bookable time. It is
      // allowed — early prep happens — but it is almost always a typo.
      warnings: result.outsideBusinessHours ? ["shift.outside_business_hours"] : undefined,
    };
  } catch (error) {
    return fail(error);
  }
}

const shiftDeleteSchema = z.object({
  staffId: z.string().min(1),
  storeId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function deleteShiftAction(
  input: z.input<typeof shiftDeleteSchema>,
): Promise<SettingsActionResult> {
  const context = await requireContext();

  const parsed = shiftDeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, problems: ["errors.validation"] };

  try {
    await deleteShift(context, parsed.data.staffId, parsed.data.storeId, parsed.data.date);
    revalidatePath("/admin/staff");
    revalidatePath("/admin/schedule");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}
