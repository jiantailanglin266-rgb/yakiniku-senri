import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";
import { can, requirePermission, type RequestContext } from "@/server/auth/context";
import { PERMISSIONS } from "@/server/permissions/catalog";
import { maskCustomerContact } from "@/server/permissions/mask";
import { orgScope } from "@/server/db/tenant";
import { AUDIT_ACTIONS, writeAuditLog } from "@/server/observability/audit";
import {
  DUPLICATE_SUGGEST_THRESHOLD,
  duplicateScore,
  normalizeEmail,
  normalizeKana,
  normalizePhone,
} from "@/lib/normalize";

/**
 * Customer directory.
 *
 * Customers belong to the *organization*, not to a store, so a chain can see
 * the same person across branches. Which stores a given operator may reach is
 * enforced separately by the request context.
 */

export interface CustomerListQuery {
  search?: string;
  storeId?: string | null;
  tagId?: string | null;
  /** Customers whose last visit is older than this many days. */
  dormantDays?: number | null;
  page?: number;
  pageSize?: number;
  sort?: "name" | "lastVisit" | "visitCount" | "totalSpent";
}

export interface CustomerListItem {
  id: string;
  code: string | null;
  name: string;
  nameKana: string | null;
  phone: string | null;
  email: string | null;
  visitCount: number;
  totalSpent: number;
  lastVisitAt: Date | null;
  noShowCount: number;
  tags: Array<{ id: string; name: string; color: string | null }>;
}

export interface CustomerListResult {
  items: CustomerListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listCustomers(
  context: RequestContext,
  query: CustomerListQuery = {},
): Promise<CustomerListResult> {
  requirePermission(context, PERMISSIONS.CUSTOMER_READ);

  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 25));

  const where: Prisma.CustomerWhereInput = {
    ...orgScope(context),
    mergedIntoId: null,
    ...(query.storeId ? { homeStoreId: query.storeId } : {}),
    ...(query.tagId ? { tagAssignments: { some: { tagId: query.tagId } } } : {}),
    ...(query.dormantDays
      ? {
          lastVisitAt: {
            lt: new Date(Date.now() - query.dormantDays * 24 * 3600_000),
          },
        }
      : {}),
    ...buildSearchFilter(query.search),
  };

  // Staff restricted to their own records only see customers they have served.
  if (context.restrictToOwnRecords && context.staffId) {
    where.appointments = {
      some: { staffSlots: { some: { staffId: context.staffId } } },
    };
  }

  const [rows, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: sortOrder(query.sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        code: true,
        name: true,
        nameKana: true,
        phone: true,
        email: true,
        visitCount: true,
        totalSpent: true,
        lastVisitAt: true,
        noShowCount: true,
        tagAssignments: {
          select: { tag: { select: { id: true, name: true, color: true } } },
        },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  const items = rows.map((row) =>
    maskCustomerContact(context, {
      id: row.id,
      code: row.code,
      name: row.name,
      nameKana: row.nameKana,
      phone: row.phone,
      email: row.email,
      visitCount: row.visitCount,
      totalSpent: row.totalSpent,
      lastVisitAt: row.lastVisitAt,
      noShowCount: row.noShowCount,
      tags: row.tagAssignments.map((assignment) => assignment.tag),
    }),
  );

  return { items, total, page, pageSize };
}

/**
 * Search across name, reading, phone and email.
 *
 * The phone term is normalised before matching so `090-1234-5678` finds a
 * record stored as `+819012345678`.
 */
function buildSearchFilter(search: string | undefined): Prisma.CustomerWhereInput {
  const term = search?.trim();
  if (!term) return {};

  const phone = normalizePhone(term);
  const email = normalizeEmail(term);
  const kana = normalizeKana(term);

  const conditions: Prisma.CustomerWhereInput[] = [
    { name: { contains: term, mode: "insensitive" } },
    { nameKana: { contains: term, mode: "insensitive" } },
    { code: { contains: term, mode: "insensitive" } },
  ];

  if (kana) conditions.push({ nameKana: { contains: kana } });
  if (phone) conditions.push({ phoneNormalized: { contains: phone } });
  if (email) conditions.push({ emailNormalized: { contains: email } });

  return { OR: conditions };
}

function sortOrder(sort: CustomerListQuery["sort"]): Prisma.CustomerOrderByWithRelationInput {
  switch (sort) {
    case "visitCount":
      return { visitCount: "desc" };
    case "totalSpent":
      return { totalSpent: "desc" };
    case "name":
      return { nameKana: "asc" };
    case "lastVisit":
    default:
      return { lastVisitAt: { sort: "desc", nulls: "last" } };
  }
}

/**
 * Load one customer.
 *
 * Reading a customer record is itself audited: knowing who looked at whose
 * contact details is a requirement of the spec and a practical control against
 * casual browsing of personal data.
 */
export async function getCustomer(context: RequestContext, customerId: string) {
  requirePermission(context, PERMISSIONS.CUSTOMER_READ);

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, ...orgScope(context) },
    select: {
      id: true,
      code: true,
      name: true,
      nameKana: true,
      phone: true,
      email: true,
      birthDate: true,
      gender: true,
      postalCode: true,
      occupation: true,
      acquisitionSource: true,
      note: true,
      allergyNote: true,
      cautionNote: true,
      firstVisitAt: true,
      lastVisitAt: true,
      visitCount: true,
      totalSpent: true,
      cancelCount: true,
      noShowCount: true,
      homeStoreId: true,
      primaryStaffId: true,
      createdAt: true,
      homeStore: { select: { id: true, name: true } },
      primaryStaff: { select: { id: true, displayName: true } },
      tagAssignments: { select: { tag: { select: { id: true, name: true, color: true } } } },
      consents: { select: { type: true, status: true, grantedAt: true, withdrawnAt: true } },
      pointAccount: { select: { balance: true } },
    },
  });

  if (!customer) return null;

  await writeAuditLog(context, {
    action: AUDIT_ACTIONS.CUSTOMER_VIEWED,
    entityType: "Customer",
    entityId: customer.id,
  });

  const averageSpend =
    customer.visitCount > 0 ? Math.round(customer.totalSpent / customer.visitCount) : 0;

  return {
    ...maskCustomerContact(context, customer),
    averageSpend,
    tags: customer.tagAssignments.map((assignment) => assignment.tag),
  };
}

export interface UpsertCustomerInput {
  id?: string;
  name: string;
  nameKana?: string | null;
  phone?: string | null;
  email?: string | null;
  birthDate?: Date | null;
  gender?: "female" | "male" | "other" | "undisclosed";
  postalCode?: string | null;
  occupation?: string | null;
  acquisitionSource?: string | null;
  note?: string | null;
  allergyNote?: string | null;
  cautionNote?: string | null;
  homeStoreId?: string | null;
  primaryStaffId?: string | null;
}

export async function createCustomer(
  context: RequestContext,
  input: UpsertCustomerInput,
): Promise<{ id: string }> {
  requirePermission(context, PERMISSIONS.CUSTOMER_WRITE);

  const customer = await prisma.customer.create({
    data: {
      organizationId: context.organizationId,
      name: input.name,
      nameKana: input.nameKana ?? null,
      phone: input.phone ?? null,
      phoneNormalized: normalizePhone(input.phone),
      email: input.email ?? null,
      emailNormalized: normalizeEmail(input.email),
      birthDate: input.birthDate ?? null,
      gender: input.gender ?? "undisclosed",
      postalCode: input.postalCode ?? null,
      occupation: input.occupation ?? null,
      acquisitionSource: input.acquisitionSource ?? null,
      note: input.note ?? null,
      allergyNote: input.allergyNote ?? null,
      cautionNote: input.cautionNote ?? null,
      homeStoreId: input.homeStoreId ?? context.activeStoreId,
      primaryStaffId: input.primaryStaffId ?? null,
      createdBy: context.user.id,
    },
    select: { id: true },
  });

  await writeAuditLog(context, {
    action: AUDIT_ACTIONS.CUSTOMER_CREATED,
    entityType: "Customer",
    entityId: customer.id,
    after: { name: input.name, homeStoreId: input.homeStoreId },
  });

  return customer;
}

export async function updateCustomer(
  context: RequestContext,
  customerId: string,
  input: UpsertCustomerInput,
): Promise<void> {
  requirePermission(context, PERMISSIONS.CUSTOMER_WRITE);

  const before = await prisma.customer.findFirst({
    where: { id: customerId, ...orgScope(context) },
    select: { id: true, name: true, nameKana: true, phone: true, email: true, note: true },
  });
  if (!before) throw new Error("顧客が見つかりません");

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      name: input.name,
      nameKana: input.nameKana ?? null,
      phone: input.phone ?? null,
      phoneNormalized: normalizePhone(input.phone),
      email: input.email ?? null,
      emailNormalized: normalizeEmail(input.email),
      birthDate: input.birthDate ?? null,
      gender: input.gender ?? "undisclosed",
      postalCode: input.postalCode ?? null,
      occupation: input.occupation ?? null,
      acquisitionSource: input.acquisitionSource ?? null,
      note: input.note ?? null,
      allergyNote: input.allergyNote ?? null,
      cautionNote: input.cautionNote ?? null,
      homeStoreId: input.homeStoreId ?? null,
      primaryStaffId: input.primaryStaffId ?? null,
      updatedBy: context.user.id,
      version: { increment: 1 },
    },
  });

  await writeAuditLog(context, {
    action: AUDIT_ACTIONS.CUSTOMER_UPDATED,
    entityType: "Customer",
    entityId: customerId,
    before,
    after: { name: input.name, nameKana: input.nameKana, note: input.note },
  });
}

export interface DuplicateSuggestion {
  id: string;
  name: string;
  nameKana: string | null;
  phone: string | null;
  email: string | null;
  lastVisitAt: Date | null;
  score: number;
}

/**
 * Suggest records that may be the same person.
 *
 * Candidates are narrowed in SQL by an exact phone/email/kana match, then
 * scored in application code. Scoring in SQL would need a trigram index and a
 * lot of tuning for a screen a receptionist opens a few times a week.
 */
export async function findDuplicateCandidates(
  context: RequestContext,
  customerId: string,
): Promise<DuplicateSuggestion[]> {
  requirePermission(context, PERMISSIONS.CUSTOMER_READ);

  const target = await prisma.customer.findFirst({
    where: { id: customerId, ...orgScope(context) },
    select: {
      id: true,
      name: true,
      nameKana: true,
      phoneNormalized: true,
      emailNormalized: true,
      birthDate: true,
    },
  });
  if (!target) return [];

  const filters: Prisma.CustomerWhereInput[] = [];
  if (target.phoneNormalized) filters.push({ phoneNormalized: target.phoneNormalized });
  if (target.emailNormalized) filters.push({ emailNormalized: target.emailNormalized });
  if (target.nameKana) filters.push({ nameKana: target.nameKana });
  if (target.name) filters.push({ name: target.name });
  if (filters.length === 0) return [];

  const candidates = await prisma.customer.findMany({
    where: {
      ...orgScope(context),
      id: { not: customerId },
      mergedIntoId: null,
      OR: filters,
    },
    take: 25,
    select: {
      id: true,
      name: true,
      nameKana: true,
      phone: true,
      email: true,
      phoneNormalized: true,
      emailNormalized: true,
      birthDate: true,
      lastVisitAt: true,
    },
  });

  return candidates
    .map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      nameKana: candidate.nameKana,
      phone: candidate.phone,
      email: candidate.email,
      lastVisitAt: candidate.lastVisitAt,
      score: duplicateScore(target, candidate),
    }))
    .filter((candidate) => candidate.score >= DUPLICATE_SUGGEST_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .map((candidate) => maskCustomerContact(context, candidate) as DuplicateSuggestion);
}

/**
 * Merge two customer records.
 *
 * The source record is kept (flagged `mergedIntoId`) rather than deleted, and
 * a full snapshot is stored, so an incorrect merge can be investigated. All
 * history — appointments, charts, sales, tickets — is repointed at the target.
 */
export async function mergeCustomers(
  context: RequestContext,
  targetId: string,
  sourceId: string,
): Promise<void> {
  requirePermission(context, PERMISSIONS.CUSTOMER_WRITE);

  if (targetId === sourceId) throw new Error("同じ顧客は統合できません");

  await prisma.$transaction(async (tx) => {
    const [target, source] = await Promise.all([
      tx.customer.findFirst({
        where: { id: targetId, organizationId: context.organizationId, deletedAt: null },
      }),
      tx.customer.findFirst({
        where: { id: sourceId, organizationId: context.organizationId, deletedAt: null },
      }),
    ]);

    if (!target || !source) throw new Error("顧客が見つかりません");
    if (source.mergedIntoId) throw new Error("すでに統合済みの顧客です");

    await tx.appointment.updateMany({
      where: { customerId: sourceId },
      data: { customerId: targetId },
    });
    await tx.medicalRecord.updateMany({
      where: { customerId: sourceId },
      data: { customerId: targetId },
    });
    await tx.sale.updateMany({
      where: { customerId: sourceId },
      data: { customerId: targetId },
    });
    await tx.ticket.updateMany({
      where: { customerId: sourceId },
      data: { customerId: targetId },
    });
    await tx.review.updateMany({
      where: { customerId: sourceId },
      data: { customerId: targetId },
    });

    // Merge aggregates rather than recomputing: the source's history is now
    // the target's history.
    await tx.customer.update({
      where: { id: targetId },
      data: {
        visitCount: target.visitCount + source.visitCount,
        totalSpent: target.totalSpent + source.totalSpent,
        cancelCount: target.cancelCount + source.cancelCount,
        noShowCount: target.noShowCount + source.noShowCount,
        firstVisitAt: earliest(target.firstVisitAt, source.firstVisitAt),
        lastVisitAt: latest(target.lastVisitAt, source.lastVisitAt),
        phone: target.phone ?? source.phone,
        phoneNormalized: target.phoneNormalized ?? source.phoneNormalized,
        email: target.email ?? source.email,
        emailNormalized: target.emailNormalized ?? source.emailNormalized,
        birthDate: target.birthDate ?? source.birthDate,
        updatedBy: context.user.id,
        version: { increment: 1 },
      },
    });

    await tx.customer.update({
      where: { id: sourceId },
      data: {
        mergedIntoId: targetId,
        deletedAt: new Date(),
        updatedBy: context.user.id,
      },
    });

    await tx.customerMergeHistory.create({
      data: {
        organizationId: context.organizationId,
        targetCustomerId: targetId,
        sourceCustomerId: sourceId,
        sourceSnapshot: JSON.parse(JSON.stringify(source)) as Prisma.InputJsonValue,
        mergedBy: context.user.id,
      },
    });

    await writeAuditLog(
      context,
      {
        action: AUDIT_ACTIONS.CUSTOMER_MERGED,
        entityType: "Customer",
        entityId: targetId,
        meta: { sourceCustomerId: sourceId },
      },
      tx,
    );
  });
}

/**
 * Honour an erasure request.
 *
 * Identifying fields are overwritten in place and the row is flagged, but
 * accounting-linked rows survive: Japanese bookkeeping rules require sales
 * records to be retained, and deleting them to satisfy a privacy request
 * would breach a different obligation. The tension is documented in
 * docs/legal/LEGAL_REVIEW.md and needs professional confirmation.
 */
export async function anonymizeCustomer(
  context: RequestContext,
  customerId: string,
  reason: string,
): Promise<void> {
  requirePermission(context, PERMISSIONS.CUSTOMER_WRITE);

  const before = await prisma.customer.findFirst({
    where: { id: customerId, ...orgScope(context) },
    select: { id: true, name: true },
  });
  if (!before) throw new Error("顧客が見つかりません");

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.customer.update({
      where: { id: customerId },
      data: {
        name: "（削除済み顧客）",
        nameKana: null,
        phone: null,
        phoneNormalized: null,
        email: null,
        emailNormalized: null,
        birthDate: null,
        postalCode: null,
        occupation: null,
        note: null,
        allergyNote: null,
        cautionNote: null,
        anonymizedAt: now,
        deletedAt: now,
        updatedBy: context.user.id,
        version: { increment: 1 },
      },
    });

    await tx.customerAddress.deleteMany({ where: { customerId } });

    await writeAuditLog(
      context,
      {
        action: AUDIT_ACTIONS.CUSTOMER_DELETED,
        entityType: "Customer",
        entityId: customerId,
        before,
        meta: { reason },
      },
      tx,
    );
  });
}

/** Can this viewer export the customer list? Drives the button's presence. */
export function canExportCustomers(context: RequestContext): boolean {
  return can(context, PERMISSIONS.CUSTOMER_EXPORT);
}

function earliest(a: Date | null, b: Date | null): Date | null {
  if (!a) return b;
  if (!b) return a;
  return a < b ? a : b;
}

function latest(a: Date | null, b: Date | null): Date | null {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}
