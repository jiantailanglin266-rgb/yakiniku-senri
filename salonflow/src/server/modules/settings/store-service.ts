import "server-only";

import { prisma } from "@/server/db/client";
import { requirePermission, requireStoreAccess, type RequestContext } from "@/server/auth/context";
import { PERMISSIONS } from "@/server/permissions/catalog";
import { assertTenant } from "@/server/db/tenant";
import { AUDIT_ACTIONS, writeAuditLog } from "@/server/observability/audit";
import {
  isPermanentlyClosed,
  validateBookingPolicy,
  validateBusinessHours,
  type BookingPolicyInput,
  type BusinessHourInput,
} from "./validation";

/**
 * Store settings.
 *
 * These are the first screens an operator touches after `bootstrap`, which
 * deliberately leaves every day closed. Until opening hours exist the public
 * booking page has nothing to offer, so this module is what turns a freshly
 * provisioned tenant into a working salon.
 */

export class SettingsValidationError extends Error {
  readonly problems: string[];

  constructor(problems: string[]) {
    super(`入力内容を確認してください: ${problems.join(", ")}`);
    this.name = "SettingsValidationError";
    this.problems = problems;
  }
}

export interface UpdateBusinessHoursResult {
  /** True when every day is closed — the booking page will show no slots. */
  permanentlyClosed: boolean;
}

/**
 * Replace a store's weekly opening hours.
 *
 * Written as a full replacement of the seven rows rather than per-day patches:
 * a partial save that leaves Wednesday holding last week's values is worse
 * than an obvious all-or-nothing write, and the operator edits the week as one
 * form anyway.
 */
export async function updateBusinessHours(
  context: RequestContext,
  storeId: string,
  hours: BusinessHourInput[],
): Promise<UpdateBusinessHoursResult> {
  // Order matters: refuse an inaccessible store before revealing whether the
  // caller holds the permission, so probing ids cannot map out the tenant.
  requireStoreAccess(context, storeId);
  requirePermission(context, PERMISSIONS.STORE_MANAGE, storeId);

  assertTenant(
    context,
    await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, organizationId: true, name: true },
    }),
  );

  if (hours.length !== 7) throw new SettingsValidationError(["hours.incomplete_week"]);

  const validation = validateBusinessHours(hours);
  if (!validation.ok) throw new SettingsValidationError(validation.problems);

  const before = await prisma.storeBusinessHour.findMany({
    where: { storeId },
    orderBy: { dayOfWeek: "asc" },
    select: {
      dayOfWeek: true,
      isClosed: true,
      openMinute: true,
      closeMinute: true,
      breakStartMinute: true,
      breakEndMinute: true,
    },
  });

  await prisma.$transaction(async (tx) => {
    for (const hour of hours) {
      await tx.storeBusinessHour.upsert({
        where: { storeId_dayOfWeek: { storeId, dayOfWeek: hour.dayOfWeek } },
        create: {
          storeId,
          dayOfWeek: hour.dayOfWeek,
          isClosed: hour.isClosed,
          openMinute: hour.openMinute,
          closeMinute: hour.closeMinute,
          breakStartMinute: hour.breakStartMinute,
          breakEndMinute: hour.breakEndMinute,
        },
        update: {
          isClosed: hour.isClosed,
          openMinute: hour.openMinute,
          closeMinute: hour.closeMinute,
          breakStartMinute: hour.breakStartMinute,
          breakEndMinute: hour.breakEndMinute,
        },
      });
    }
  });

  await writeAuditLog(context, {
    action: AUDIT_ACTIONS.SETTINGS_CHANGED,
    entityType: "StoreBusinessHour",
    entityId: storeId,
    storeId,
    before,
    after: hours,
    meta: { setting: "business_hours" },
  });

  return { permanentlyClosed: isPermanentlyClosed(hours) };
}

export interface StoreProfileInput {
  name: string;
  phone: string | null;
  postalCode: string | null;
  prefecture: string | null;
  city: string | null;
  addressLine: string | null;
}

export interface UpdateStoreSettingsInput extends StoreProfileInput, BookingPolicyInput {
  approvalMode: "instant" | "request";
}

/**
 * Update the store profile and its booking policy.
 *
 * The slug is deliberately not editable here: it is the public booking URL,
 * and changing it silently breaks every link the salon has already handed out
 * on cards, posters and social profiles.
 */
export async function updateStoreSettings(
  context: RequestContext,
  storeId: string,
  input: UpdateStoreSettingsInput,
): Promise<void> {
  requireStoreAccess(context, storeId);
  requirePermission(context, PERMISSIONS.STORE_MANAGE, storeId);

  const store = assertTenant(
    context,
    await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        organizationId: true,
        name: true,
        phone: true,
        postalCode: true,
        prefecture: true,
        city: true,
        addressLine: true,
        approvalMode: true,
        slotIntervalMinutes: true,
        bookingCutoffMinutes: true,
        minAdvanceMinutes: true,
        maxAdvanceDays: true,
        bufferMinutes: true,
        cancelDeadlineHours: true,
      },
    }),
  );

  const problems: string[] = [];
  if (input.name.trim().length === 0) problems.push("store.name_required");
  if (input.name.trim().length > 120) problems.push("store.name_too_long");
  problems.push(...validateBookingPolicy(input).problems);

  if (problems.length > 0) throw new SettingsValidationError([...new Set(problems)]);

  const { id: _id, organizationId: _organizationId, ...before } = store;

  await prisma.store.update({
    where: { id: storeId },
    data: {
      name: input.name.trim(),
      phone: emptyToNull(input.phone),
      postalCode: emptyToNull(input.postalCode),
      prefecture: emptyToNull(input.prefecture),
      city: emptyToNull(input.city),
      addressLine: emptyToNull(input.addressLine),
      approvalMode: input.approvalMode,
      slotIntervalMinutes: input.slotIntervalMinutes,
      bookingCutoffMinutes: input.bookingCutoffMinutes,
      minAdvanceMinutes: input.minAdvanceMinutes,
      maxAdvanceDays: input.maxAdvanceDays,
      bufferMinutes: input.bufferMinutes,
      cancelDeadlineHours: input.cancelDeadlineHours,
    },
  });

  await writeAuditLog(context, {
    action: AUDIT_ACTIONS.SETTINGS_CHANGED,
    entityType: "Store",
    entityId: storeId,
    storeId,
    before,
    after: input,
    meta: { setting: "store_settings" },
  });
}

function emptyToNull(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
