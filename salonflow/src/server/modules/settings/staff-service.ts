import "server-only";

import type { EmploymentType } from "@prisma/client";

import { prisma } from "@/server/db/client";
import { requirePermission, requireStoreAccess, type RequestContext } from "@/server/auth/context";
import { PERMISSIONS } from "@/server/permissions/catalog";
import { assertTenant, orgScope } from "@/server/db/tenant";
import { AUDIT_ACTIONS, writeAuditLog } from "@/server/observability/audit";
import { SettingsValidationError } from "./store-service";
import { shiftOverlapsHours, validateShift, validateStaff, type StaffInput } from "./validation";

/**
 * Staff and rosters.
 *
 * A staff member is not a login. Most of a salon's stylists never sign in —
 * they exist so appointments can be assigned and so the booking page can offer
 * a designation. Linking a `User` is optional and handled elsewhere.
 */

export interface StaffWriteInput extends StaffInput {
  nameKana: string | null;
  title: string | null;
  employmentType: EmploymentType;
  isBookable: boolean;
  isPubliclyVisible: boolean;
  displayOrder: number;
  /** Stores this person works at. The first is treated as their home store. */
  storeIds: string[];
}

export interface StaffDetail extends StaffWriteInput {
  id: string;
}

export async function getStaff(context: RequestContext, staffId: string): Promise<StaffDetail> {
  requirePermission(context, PERMISSIONS.STAFF_MANAGE);

  const staff = assertTenant(
    context,
    await prisma.staff.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        organizationId: true,
        name: true,
        nameKana: true,
        displayName: true,
        title: true,
        employmentType: true,
        designationFee: true,
        commissionBps: true,
        maxConcurrent: true,
        maxDailyAppointments: true,
        isBookable: true,
        isPubliclyVisible: true,
        displayOrder: true,
        deletedAt: true,
        stores: { select: { storeId: true, isPrimary: true } },
      },
    }),
  );

  if (staff.deletedAt) throw new SettingsValidationError(["staff.deleted"]);

  // A staff member assigned only to stores this user cannot see is, for this
  // user, not visible at all.
  const visible = staff.stores.filter((row) =>
    context.accessibleStores.some((store) => store.id === row.storeId),
  );
  if (staff.stores.length > 0 && visible.length === 0) {
    throw new SettingsValidationError(["staff.not_accessible"]);
  }

  const { organizationId: _org, deletedAt: _deleted, stores, ...rest } = staff;

  return {
    ...rest,
    storeIds: [...stores]
      .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
      .map((row) => row.storeId),
  };
}

export async function createStaff(
  context: RequestContext,
  input: StaffWriteInput,
): Promise<string> {
  requirePermission(context, PERMISSIONS.STAFF_MANAGE);

  const data = prepare(context, input);

  const staff = await prisma.$transaction(async (tx) => {
    const created = await tx.staff.create({
      data: {
        organizationId: context.organizationId,
        createdBy: context.user.id,
        updatedBy: context.user.id,
        ...data,
      },
      select: { id: true },
    });

    await tx.staffStore.createMany({
      data: input.storeIds.map((storeId, index) => ({
        staffId: created.id,
        storeId,
        isPrimary: index === 0,
      })),
    });

    return created;
  });

  await writeAuditLog(context, {
    action: AUDIT_ACTIONS.SETTINGS_CHANGED,
    entityType: "Staff",
    entityId: staff.id,
    storeId: input.storeIds[0] ?? null,
    after: { ...data, storeIds: input.storeIds },
    meta: { setting: "staff_created" },
  });

  return staff.id;
}

export async function updateStaff(
  context: RequestContext,
  staffId: string,
  input: StaffWriteInput,
): Promise<void> {
  requirePermission(context, PERMISSIONS.STAFF_MANAGE);

  const before = await getStaff(context, staffId);
  const data = prepare(context, input);

  await prisma.$transaction(async (tx) => {
    await tx.staff.update({
      where: { id: staffId },
      data: { ...data, updatedBy: context.user.id, version: { increment: 1 } },
    });

    // Only the assignments this user can see are replaced. Dropping rows for
    // stores outside their scope would let a branch manager quietly remove a
    // stylist from a sibling branch's roster.
    await tx.staffStore.deleteMany({
      where: {
        staffId,
        storeId: { in: context.accessibleStores.map((store) => store.id) },
      },
    });
    await tx.staffStore.createMany({
      data: input.storeIds.map((storeId, index) => ({
        staffId,
        storeId,
        isPrimary: index === 0,
      })),
      skipDuplicates: true,
    });
  });

  await writeAuditLog(context, {
    action: AUDIT_ACTIONS.SETTINGS_CHANGED,
    entityType: "Staff",
    entityId: staffId,
    storeId: input.storeIds[0] ?? null,
    before,
    after: { ...data, storeIds: input.storeIds },
    meta: { setting: "staff_updated" },
  });
}

export interface ArchiveStaffResult {
  /**
   * Appointments still assigned to this person in the future.
   *
   * Reported rather than cancelled. Cancelling here would silently drop
   * customers who are expecting to be seen; reassigning them is a decision for
   * a human at the ledger. Non-zero means the operator has follow-up work.
   */
  upcomingAppointments: number;
}

export async function archiveStaff(
  context: RequestContext,
  staffId: string,
): Promise<ArchiveStaffResult> {
  requirePermission(context, PERMISSIONS.STAFF_MANAGE);

  const before = await getStaff(context, staffId);

  const upcoming = await prisma.appointmentStaff.count({
    where: { staffId, isActive: true, startAt: { gte: new Date() } },
  });

  await prisma.staff.update({
    where: { id: staffId },
    data: {
      deletedAt: new Date(),
      isBookable: false,
      isPubliclyVisible: false,
      updatedBy: context.user.id,
    },
  });

  await writeAuditLog(context, {
    action: AUDIT_ACTIONS.SETTINGS_CHANGED,
    entityType: "Staff",
    entityId: staffId,
    before,
    meta: { setting: "staff_archived", upcomingAppointments: upcoming },
  });

  return { upcomingAppointments: upcoming };
}

function prepare(context: RequestContext, input: StaffWriteInput) {
  const validation = validateStaff(input);
  if (!validation.ok) throw new SettingsValidationError(validation.problems);

  if (input.storeIds.length === 0) throw new SettingsValidationError(["staff.store_required"]);
  for (const storeId of input.storeIds) requireStoreAccess(context, storeId);

  return {
    name: input.name.trim(),
    nameKana: input.nameKana?.trim() || null,
    displayName: input.displayName.trim(),
    title: input.title?.trim() || null,
    employmentType: input.employmentType,
    designationFee: input.designationFee,
    commissionBps: input.commissionBps,
    maxConcurrent: input.maxConcurrent,
    maxDailyAppointments: input.maxDailyAppointments,
    isBookable: input.isBookable,
    isPubliclyVisible: input.isPubliclyVisible,
    displayOrder: input.displayOrder,
  };
}

// --- Shifts ----------------------------------------------------------------

export interface ShiftWriteInput {
  staffId: string;
  storeId: string;
  /** Local calendar date, `YYYY-MM-DD` in the store's timezone. */
  date: string;
  startMinute: number;
  endMinute: number;
  breakStartMinute: number | null;
  breakEndMinute: number | null;
  note: string | null;
}

export interface SaveShiftResult {
  /** True when the shift falls entirely outside the store's opening hours. */
  outsideBusinessHours: boolean;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function saveShift(
  context: RequestContext,
  input: ShiftWriteInput,
): Promise<SaveShiftResult> {
  requireStoreAccess(context, input.storeId);
  requirePermission(context, PERMISSIONS.STAFF_MANAGE, input.storeId);

  if (!DATE_PATTERN.test(input.date)) throw new SettingsValidationError(["shift.date_invalid"]);

  const validation = validateShift(input);
  if (!validation.ok) throw new SettingsValidationError(validation.problems);

  const staff = assertTenant(
    context,
    await prisma.staff.findUnique({
      where: { id: input.staffId },
      select: { id: true, organizationId: true, deletedAt: true },
    }),
  );
  if (staff.deletedAt) throw new SettingsValidationError(["staff.deleted"]);

  const assigned = await prisma.staffStore.findUnique({
    where: { staffId_storeId: { staffId: input.staffId, storeId: input.storeId } },
    select: { staffId: true },
  });
  if (!assigned) throw new SettingsValidationError(["shift.staff_not_at_store"]);

  // `@db.Date` stores a calendar date; anchoring at UTC midnight keeps the
  // stored day equal to the day the operator typed, whatever the server's zone.
  const date = new Date(`${input.date}T00:00:00.000Z`);

  await prisma.staffShift.upsert({
    where: {
      staffId_storeId_date: { staffId: input.staffId, storeId: input.storeId, date },
    },
    create: {
      staffId: input.staffId,
      storeId: input.storeId,
      date,
      startMinute: input.startMinute,
      endMinute: input.endMinute,
      breakStartMinute: input.breakStartMinute,
      breakEndMinute: input.breakEndMinute,
      note: input.note?.trim() || null,
      createdBy: context.user.id,
      updatedBy: context.user.id,
    },
    update: {
      startMinute: input.startMinute,
      endMinute: input.endMinute,
      breakStartMinute: input.breakStartMinute,
      breakEndMinute: input.breakEndMinute,
      note: input.note?.trim() || null,
      updatedBy: context.user.id,
    },
  });

  await writeAuditLog(context, {
    action: AUDIT_ACTIONS.SETTINGS_CHANGED,
    entityType: "StaffShift",
    entityId: input.staffId,
    storeId: input.storeId,
    after: input,
    meta: { setting: "shift_saved" },
  });

  const hours = await prisma.storeBusinessHour.findUnique({
    where: { storeId_dayOfWeek: { storeId: input.storeId, dayOfWeek: date.getUTCDay() } },
    select: { isClosed: true, openMinute: true, closeMinute: true },
  });

  return { outsideBusinessHours: !shiftOverlapsHours(input, hours) };
}

export async function deleteShift(
  context: RequestContext,
  staffId: string,
  storeId: string,
  date: string,
): Promise<void> {
  requireStoreAccess(context, storeId);
  requirePermission(context, PERMISSIONS.STAFF_MANAGE, storeId);

  if (!DATE_PATTERN.test(date)) throw new SettingsValidationError(["shift.date_invalid"]);

  assertTenant(
    context,
    await prisma.staff.findUnique({
      where: { id: staffId },
      select: { id: true, organizationId: true },
    }),
  );

  await prisma.staffShift.deleteMany({
    where: { staffId, storeId, date: new Date(`${date}T00:00:00.000Z`) },
  });

  await writeAuditLog(context, {
    action: AUDIT_ACTIONS.SETTINGS_CHANGED,
    entityType: "StaffShift",
    entityId: staffId,
    storeId,
    before: { staffId, storeId, date },
    meta: { setting: "shift_deleted" },
  });
}

export interface StaffOption {
  id: string;
  displayName: string;
}

/** Staff selectable in the settings screens, scoped to what this user can see. */
export async function listAssignableStaff(
  context: RequestContext,
  storeId?: string | null,
): Promise<StaffOption[]> {
  const storeIds = storeId ? [storeId] : context.accessibleStores.map((store) => store.id);

  if (storeId) requireStoreAccess(context, storeId);

  return prisma.staff.findMany({
    where: {
      ...orgScope(context),
      stores: { some: { storeId: { in: storeIds } } },
    },
    orderBy: [{ displayOrder: "asc" }, { displayName: "asc" }],
    select: { id: true, displayName: true },
  });
}
