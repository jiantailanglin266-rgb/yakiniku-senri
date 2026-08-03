import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";
import { requirePermission, type RequestContext } from "@/server/auth/context";
import { PERMISSIONS } from "@/server/permissions/catalog";
import { canViewMedicalPhoto } from "@/server/permissions/mask";
import { orgScope } from "@/server/db/tenant";
import { AUDIT_ACTIONS, writeAuditLog } from "@/server/observability/audit";
import { createSignedUrl } from "@/server/storage/signed-url";

/**
 * Electronic charts (電子カルテ).
 *
 * Charts hold the most sensitive data in the product — skin condition,
 * allergies, before/after photographs. Two rules follow from that:
 *
 *   1. Every read is audited, including each photo URL issued.
 *   2. Photos are never addressable by a stable public URL. A short-lived
 *      signed token is minted per view, only for viewers entitled to it.
 */

export interface RecordListItem {
  id: string;
  visitedAt: Date;
  storeName: string;
  staffName: string | null;
  serviceSummary: string | null;
  templateName: string;
  photoCount: number;
}

export async function listCustomerRecords(
  context: RequestContext,
  customerId: string,
): Promise<RecordListItem[]> {
  requirePermission(context, PERMISSIONS.MEDICAL_RECORD_READ);

  const records = await prisma.medicalRecord.findMany({
    where: {
      customerId,
      ...orgScope(context),
      storeId: { in: context.accessibleStores.map((store) => store.id) },
      ...(context.restrictToOwnRecords && context.staffId ? { staffId: context.staffId } : {}),
    },
    orderBy: { visitedAt: "desc" },
    select: {
      id: true,
      visitedAt: true,
      serviceSummary: true,
      store: { select: { name: true } },
      staff: { select: { displayName: true } },
      template: { select: { name: true } },
      _count: { select: { photos: true } },
    },
  });

  return records.map((record) => ({
    id: record.id,
    visitedAt: record.visitedAt,
    storeName: record.store.name,
    staffName: record.staff?.displayName ?? null,
    serviceSummary: record.serviceSummary,
    templateName: record.template.name,
    photoCount: record._count.photos,
  }));
}

export interface RecordDetail {
  id: string;
  visitedAt: Date;
  customerId: string;
  customerName: string;
  storeId: string;
  storeName: string;
  staffName: string | null;
  templateId: string;
  templateName: string;
  serviceSummary: string | null;
  productsUsed: string | null;
  cautionNote: string | null;
  customerRequest: string | null;
  result: string | null;
  nextProposal: string | null;
  staffNote: string | null;
  fields: Array<{
    id: string;
    key: string;
    label: string;
    type: string;
    section: string | null;
    options: unknown;
    isRequired: boolean;
    value: unknown;
  }>;
  photos: Array<{
    id: string;
    caption: string | null;
    slot: string | null;
    /** null when the viewer is not entitled to see chart photos. */
    url: string | null;
  }>;
}

export async function getRecord(
  context: RequestContext,
  recordId: string,
): Promise<RecordDetail | null> {
  requirePermission(context, PERMISSIONS.MEDICAL_RECORD_READ);

  const record = await prisma.medicalRecord.findFirst({
    where: {
      id: recordId,
      ...orgScope(context),
      storeId: { in: context.accessibleStores.map((store) => store.id) },
    },
    select: {
      id: true,
      visitedAt: true,
      customerId: true,
      storeId: true,
      serviceSummary: true,
      productsUsed: true,
      cautionNote: true,
      customerRequest: true,
      result: true,
      nextProposal: true,
      staffNote: true,
      customer: { select: { name: true } },
      store: { select: { name: true } },
      staff: { select: { displayName: true } },
      template: {
        select: {
          id: true,
          name: true,
          fields: {
            orderBy: { displayOrder: "asc" },
            select: {
              id: true,
              key: true,
              label: true,
              type: true,
              section: true,
              options: true,
              isRequired: true,
              isSensitive: true,
            },
          },
        },
      },
      responses: { select: { fieldId: true, value: true } },
      photos: {
        where: { deletedAt: null },
        orderBy: { displayOrder: "asc" },
        select: { id: true, storageKey: true, caption: true, slot: true },
      },
    },
  });

  if (!record) return null;

  await writeAuditLog(context, {
    action: AUDIT_ACTIONS.MEDICAL_RECORD_VIEWED,
    entityType: "MedicalRecord",
    entityId: record.id,
    storeId: record.storeId,
    meta: { customerId: record.customerId },
  });

  const responseByField = new Map(
    record.responses.map((response) => [response.fieldId, response.value]),
  );

  const photosVisible = canViewMedicalPhoto(context);
  if (photosVisible && record.photos.length > 0) {
    await writeAuditLog(context, {
      action: AUDIT_ACTIONS.MEDICAL_PHOTO_VIEWED,
      entityType: "MedicalRecord",
      entityId: record.id,
      storeId: record.storeId,
      meta: { photoCount: record.photos.length },
    });
  }

  return {
    id: record.id,
    visitedAt: record.visitedAt,
    customerId: record.customerId,
    customerName: record.customer.name,
    storeId: record.storeId,
    storeName: record.store.name,
    staffName: record.staff?.displayName ?? null,
    templateId: record.template.id,
    templateName: record.template.name,
    serviceSummary: record.serviceSummary,
    productsUsed: record.productsUsed,
    cautionNote: record.cautionNote,
    customerRequest: record.customerRequest,
    result: record.result,
    nextProposal: record.nextProposal,
    staffNote: record.staffNote,
    fields: record.template.fields.map((field) => ({
      id: field.id,
      key: field.key,
      label: field.label,
      type: field.type,
      section: field.section,
      options: field.options,
      isRequired: field.isRequired,
      // A sensitive field behaves like a photo: withheld rather than blurred.
      value: field.isSensitive && !photosVisible ? null : (responseByField.get(field.id) ?? null),
    })),
    photos: record.photos.map((photo) => ({
      id: photo.id,
      caption: photo.caption,
      slot: photo.slot,
      url: photosVisible ? createSignedUrl(photo.storageKey) : null,
    })),
  };
}

export interface SaveRecordInput {
  recordId?: string;
  customerId: string;
  storeId: string;
  appointmentId?: string | null;
  templateId: string;
  staffId?: string | null;
  visitedAt: Date;
  serviceSummary?: string | null;
  productsUsed?: string | null;
  cautionNote?: string | null;
  customerRequest?: string | null;
  result?: string | null;
  nextProposal?: string | null;
  staffNote?: string | null;
  /** Keyed by MedicalRecordField.id */
  responses: Record<string, unknown>;
}

export async function saveRecord(
  context: RequestContext,
  input: SaveRecordInput,
): Promise<{ id: string }> {
  requirePermission(context, PERMISSIONS.MEDICAL_RECORD_WRITE, input.storeId);

  return prisma.$transaction(async (tx) => {
    // The template must belong to this tenant, otherwise a crafted id could
    // attach another organization's field definitions to this chart.
    const template = await tx.medicalRecordTemplate.findFirst({
      where: { id: input.templateId, organizationId: context.organizationId },
      select: { id: true, fields: { select: { id: true } } },
    });
    if (!template) throw new Error("カルテテンプレートが見つかりません");

    const validFieldIds = new Set(template.fields.map((field) => field.id));

    const data = {
      organizationId: context.organizationId,
      storeId: input.storeId,
      customerId: input.customerId,
      appointmentId: input.appointmentId ?? null,
      templateId: input.templateId,
      staffId: input.staffId ?? context.staffId,
      visitedAt: input.visitedAt,
      serviceSummary: input.serviceSummary ?? null,
      productsUsed: input.productsUsed ?? null,
      cautionNote: input.cautionNote ?? null,
      customerRequest: input.customerRequest ?? null,
      result: input.result ?? null,
      nextProposal: input.nextProposal ?? null,
      staffNote: input.staffNote ?? null,
    };

    let recordId: string;
    let isUpdate = false;

    if (input.recordId) {
      const existing = await tx.medicalRecord.findFirst({
        where: { id: input.recordId, organizationId: context.organizationId },
        select: { id: true },
      });
      if (!existing) throw new Error("カルテが見つかりません");

      await tx.medicalRecord.update({
        where: { id: existing.id },
        data: { ...data, updatedBy: context.user.id, version: { increment: 1 } },
      });
      recordId = existing.id;
      isUpdate = true;
    } else {
      const created = await tx.medicalRecord.create({
        data: { ...data, createdBy: context.user.id },
        select: { id: true },
      });
      recordId = created.id;
    }

    for (const [fieldId, value] of Object.entries(input.responses)) {
      if (!validFieldIds.has(fieldId)) continue;
      await tx.medicalRecordResponse.upsert({
        where: { recordId_fieldId: { recordId, fieldId } },
        create: { recordId, fieldId, value: value as Prisma.InputJsonValue },
        update: { value: value as Prisma.InputJsonValue },
      });
    }

    await writeAuditLog(
      context,
      {
        action: isUpdate
          ? AUDIT_ACTIONS.MEDICAL_RECORD_UPDATED
          : AUDIT_ACTIONS.MEDICAL_RECORD_CREATED,
        entityType: "MedicalRecord",
        entityId: recordId,
        storeId: input.storeId,
        meta: { customerId: input.customerId, fieldCount: Object.keys(input.responses).length },
      },
      tx,
    );

    return { id: recordId };
  });
}

/** Templates a store may use, most specific first. */
export async function listTemplates(context: RequestContext, storeId: string) {
  return prisma.medicalRecordTemplate.findMany({
    where: {
      organizationId: context.organizationId,
      deletedAt: null,
      isActive: true,
      OR: [{ storeId }, { storeId: null }],
    },
    orderBy: [{ storeId: "desc" }, { isDefault: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      industry: true,
      isDefault: true,
      fields: {
        orderBy: { displayOrder: "asc" },
        select: {
          id: true,
          key: true,
          label: true,
          type: true,
          section: true,
          options: true,
          isRequired: true,
          helpText: true,
          placeholder: true,
        },
      },
    },
  });
}
