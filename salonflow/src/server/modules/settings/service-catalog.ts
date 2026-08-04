import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";
import { requirePermission, requireStoreAccess, type RequestContext } from "@/server/auth/context";
import { PERMISSIONS } from "@/server/permissions/catalog";
import { assertTenant, orgScope } from "@/server/db/tenant";
import { AUDIT_ACTIONS, writeAuditLog } from "@/server/observability/audit";
import { SettingsValidationError } from "./store-service";
import { validateService, type ServiceInput } from "./validation";

/**
 * The menu.
 *
 * A service carries both what the customer buys (name, price) and what the
 * schedule must reserve (duration, prep, cleanup, the unattended window). The
 * second group feeds the booking engine directly, which is why the validation
 * here is stricter than a catalogue screen would suggest: a service whose
 * processing gap runs past its own end would make the availability calculation
 * hand out slots that cannot be worked.
 */

export interface ServiceWriteInput extends ServiceInput {
  categoryId: string;
  /** null = offered at every store in the organization. */
  storeId: string | null;
  description: string | null;
  isOnlineBookable: boolean;
  allowsDesignation: boolean;
  isActive: boolean;
  displayOrder: number;
  /** Staff permitted to perform it. Empty = anyone. */
  staffIds: string[];
}

export interface ServiceDetail {
  id: string;
  categoryId: string;
  storeId: string | null;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number;
  prepMinutes: number;
  cleanupMinutes: number;
  unattendedStartMinute: number | null;
  unattendedMinutes: number | null;
  isOnlineBookable: boolean;
  allowsDesignation: boolean;
  isActive: boolean;
  displayOrder: number;
  staffIds: string[];
}

export async function getService(
  context: RequestContext,
  serviceId: string,
): Promise<ServiceDetail> {
  requirePermission(context, PERMISSIONS.STORE_MANAGE);

  const service = assertTenant(
    context,
    await prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        organizationId: true,
        categoryId: true,
        storeId: true,
        name: true,
        description: true,
        price: true,
        durationMinutes: true,
        prepMinutes: true,
        cleanupMinutes: true,
        unattendedStartMinute: true,
        unattendedMinutes: true,
        isOnlineBookable: true,
        allowsDesignation: true,
        isActive: true,
        displayOrder: true,
        deletedAt: true,
        serviceStaff: { select: { staffId: true } },
      },
    }),
  );

  if (service.deletedAt) throw new SettingsValidationError(["service.deleted"]);
  if (service.storeId) requireStoreAccess(context, service.storeId);

  const { organizationId: _org, deletedAt: _deleted, serviceStaff, ...rest } = service;
  return { ...rest, staffIds: serviceStaff.map((row) => row.staffId) };
}

export async function createService(
  context: RequestContext,
  input: ServiceWriteInput,
): Promise<string> {
  requirePermission(context, PERMISSIONS.STORE_MANAGE, input.storeId);

  const data = await prepare(context, input);

  const service = await prisma.$transaction(async (tx) => {
    const created = await tx.service.create({
      data: {
        organizationId: context.organizationId,
        createdBy: context.user.id,
        updatedBy: context.user.id,
        ...data,
      },
      select: { id: true },
    });

    if (input.staffIds.length > 0) {
      await tx.serviceStaff.createMany({
        data: input.staffIds.map((staffId) => ({ serviceId: created.id, staffId })),
      });
    }

    return created;
  });

  await writeAuditLog(context, {
    action: AUDIT_ACTIONS.SETTINGS_CHANGED,
    entityType: "Service",
    entityId: service.id,
    storeId: input.storeId,
    after: { ...data, staffIds: input.staffIds },
    meta: { setting: "service_created" },
  });

  return service.id;
}

export async function updateService(
  context: RequestContext,
  serviceId: string,
  input: ServiceWriteInput,
): Promise<void> {
  requirePermission(context, PERMISSIONS.STORE_MANAGE, input.storeId);

  const before = await getService(context, serviceId);
  const data = await prepare(context, input);

  await prisma.$transaction(async (tx) => {
    await tx.service.update({
      where: { id: serviceId },
      data: { ...data, updatedBy: context.user.id, version: { increment: 1 } },
    });

    // Replace the assignment set rather than diffing it: the form submits the
    // complete list, and a diff would silently keep a staff member the
    // operator just unticked.
    await tx.serviceStaff.deleteMany({ where: { serviceId } });
    if (input.staffIds.length > 0) {
      await tx.serviceStaff.createMany({
        data: input.staffIds.map((staffId) => ({ serviceId, staffId })),
      });
    }
  });

  await writeAuditLog(context, {
    action: AUDIT_ACTIONS.SETTINGS_CHANGED,
    entityType: "Service",
    entityId: serviceId,
    storeId: input.storeId,
    before,
    after: { ...data, staffIds: input.staffIds },
    meta: { setting: "service_updated" },
  });
}

/**
 * Retire a menu item.
 *
 * Soft delete, never a row removal: past appointments and sale lines reference
 * this service, and a hard delete would either fail on the foreign key or
 * destroy the history behind last year's revenue figures.
 */
export async function archiveService(context: RequestContext, serviceId: string): Promise<void> {
  requirePermission(context, PERMISSIONS.STORE_MANAGE);

  const before = await getService(context, serviceId);

  await prisma.service.update({
    where: { id: serviceId },
    data: { deletedAt: new Date(), isActive: false, updatedBy: context.user.id },
  });

  await writeAuditLog(context, {
    action: AUDIT_ACTIONS.SETTINGS_CHANGED,
    entityType: "Service",
    entityId: serviceId,
    storeId: before.storeId,
    before,
    meta: { setting: "service_archived" },
  });
}

/**
 * Shared validation and reference checking for create and update.
 *
 * The category and every referenced staff member are re-read under the tenant
 * filter. Ids arrive from a form the client controls, so being valid CUIDs
 * says nothing about who they belong to.
 */
async function prepare(
  context: RequestContext,
  input: ServiceWriteInput,
): Promise<Prisma.ServiceUncheckedCreateWithoutOrganizationInput> {
  const validation = validateService(input);
  if (!validation.ok) throw new SettingsValidationError(validation.problems);

  if (input.storeId) requireStoreAccess(context, input.storeId);

  const category = await prisma.serviceCategory.findFirst({
    where: { id: input.categoryId, ...orgScope(context) },
    select: { id: true },
  });
  if (!category) throw new SettingsValidationError(["service.category_not_found"]);

  if (input.staffIds.length > 0) {
    const found = await prisma.staff.count({
      where: { id: { in: input.staffIds }, ...orgScope(context) },
    });
    if (found !== new Set(input.staffIds).size) {
      throw new SettingsValidationError(["service.staff_not_found"]);
    }
  }

  return {
    categoryId: input.categoryId,
    storeId: input.storeId,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    price: input.price,
    durationMinutes: input.durationMinutes,
    prepMinutes: input.prepMinutes,
    cleanupMinutes: input.cleanupMinutes,
    unattendedStartMinute: input.unattendedStartMinute,
    unattendedMinutes: input.unattendedMinutes,
    isOnlineBookable: input.isOnlineBookable,
    allowsDesignation: input.allowsDesignation,
    isActive: input.isActive,
    displayOrder: input.displayOrder,
  };
}

export async function createServiceCategory(
  context: RequestContext,
  name: string,
  displayOrder: number,
): Promise<string> {
  requirePermission(context, PERMISSIONS.STORE_MANAGE);

  const trimmed = name.trim();
  if (trimmed.length === 0) throw new SettingsValidationError(["category.name_required"]);
  if (trimmed.length > 120) throw new SettingsValidationError(["category.name_too_long"]);

  const category = await prisma.serviceCategory.create({
    data: { organizationId: context.organizationId, name: trimmed, displayOrder },
    select: { id: true },
  });

  await writeAuditLog(context, {
    action: AUDIT_ACTIONS.SETTINGS_CHANGED,
    entityType: "ServiceCategory",
    entityId: category.id,
    after: { name: trimmed, displayOrder },
    meta: { setting: "category_created" },
  });

  return category.id;
}
