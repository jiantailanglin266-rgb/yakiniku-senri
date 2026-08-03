import "server-only";

import { randomUUID } from "node:crypto";
import { cache } from "react";
import { headers } from "next/headers";

import { prisma } from "@/server/db/client";
import type { PermissionKey } from "@/server/permissions/catalog";
import { readSessionToken, resolveSession, touchSession } from "./session";

/**
 * The authenticated request context.
 *
 * Every application-layer function takes one of these. It is built exclusively
 * from the session cookie — an `organizationId` or `storeId` arriving in a
 * request body is treated as user input to be validated against this, never as
 * a source of truth.
 */
export interface RequestContext {
  requestId: string;
  user: {
    id: string;
    name: string;
    email: string;
    locale: string;
    isPlatformAdmin: boolean;
  };
  sessionId: string;
  organizationId: string;
  organization: {
    id: string;
    name: string;
    timezone: string;
    currency: string;
  };
  /** Staff record linked to this login, when there is one. */
  staffId: string | null;
  /** Stores this user may touch. Ordered for display. */
  accessibleStores: Array<{ id: string; name: string; slug: string; timezone: string }>;
  activeStoreId: string | null;
  /** Permissions granted across every store. */
  globalPermissions: ReadonlySet<string>;
  /** Permissions granted for one specific store only. */
  storePermissions: ReadonlyMap<string, ReadonlySet<string>>;
  masks: {
    customerPhone: boolean;
    customerEmail: boolean;
    salesAmount: boolean;
    medicalPhoto: boolean;
    staffCompensation: boolean;
  };
  /** True when the user may only see records they are assigned to. */
  restrictToOwnRecords: boolean;
  ipAddress: string | null;
  userAgent: string | null;
}

export class AuthenticationError extends Error {
  constructor(message = "認証が必要です") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  readonly permission?: string;
  constructor(message = "この操作を行う権限がありません", permission?: string) {
    super(message);
    this.name = "AuthorizationError";
    this.permission = permission;
  }
}

/**
 * Load the context for the current request.
 *
 * Wrapped in React's `cache` so a page that calls it from a layout, the page
 * itself and three components performs one set of queries, not five.
 */
export const getRequestContext = cache(async (): Promise<RequestContext | null> => {
  const token = await readSessionToken();
  const session = await resolveSession(token);
  if (!session) return null;

  const headerList = await headers();
  const requestId = headerList.get("x-request-id") ?? randomUUID();
  const ipAddress = extractClientIp(headerList);
  const userAgent = headerList.get("user-agent");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      locale: true,
      isPlatformAdmin: true,
      deletedAt: true,
    },
  });
  if (!user || user.deletedAt) return null;

  // A session without an organization has not finished onboarding; the caller
  // routes it to the setup wizard.
  if (!session.organizationId) return null;

  const organization = await prisma.organization.findFirst({
    where: { id: session.organizationId, deletedAt: null },
    select: { id: true, name: true, timezone: true, currency: true },
  });
  if (!organization) return null;

  const userRoles = await prisma.userRole.findMany({
    where: { userId: user.id, organizationId: organization.id },
    select: {
      storeId: true,
      role: {
        select: {
          key: true,
          maskCustomerPhone: true,
          maskCustomerEmail: true,
          maskSalesAmount: true,
          maskMedicalPhoto: true,
          maskStaffCompensation: true,
          restrictToOwnRecords: true,
          rolePermissions: { select: { permissionKey: true } },
        },
      },
    },
  });

  if (userRoles.length === 0) return null;

  const globalPermissions = new Set<string>();
  const storePermissions = new Map<string, Set<string>>();

  // Masks are intersected across roles: holding any role that can see a field
  // reveals it. Restrictions are likewise relaxed by the most permissive role.
  let maskCustomerPhone = true;
  let maskCustomerEmail = true;
  let maskSalesAmount = true;
  let maskMedicalPhoto = true;
  let maskStaffCompensation = true;
  let restrictToOwnRecords = true;

  for (const assignment of userRoles) {
    const keys = assignment.role.rolePermissions.map((entry) => entry.permissionKey);

    if (assignment.storeId === null) {
      for (const key of keys) globalPermissions.add(key);
    } else {
      const bucket = storePermissions.get(assignment.storeId) ?? new Set<string>();
      for (const key of keys) bucket.add(key);
      storePermissions.set(assignment.storeId, bucket);
    }

    maskCustomerPhone &&= assignment.role.maskCustomerPhone;
    maskCustomerEmail &&= assignment.role.maskCustomerEmail;
    maskSalesAmount &&= assignment.role.maskSalesAmount;
    maskMedicalPhoto &&= assignment.role.maskMedicalPhoto;
    maskStaffCompensation &&= assignment.role.maskStaffCompensation;
    restrictToOwnRecords &&= assignment.role.restrictToOwnRecords;
  }

  const hasOrgWideRole = userRoles.some((assignment) => assignment.storeId === null);
  const scopedStoreIds = userRoles
    .map((assignment) => assignment.storeId)
    .filter((storeId): storeId is string => storeId !== null);

  const accessibleStores = await prisma.store.findMany({
    where: {
      organizationId: organization.id,
      deletedAt: null,
      ...(hasOrgWideRole ? {} : { id: { in: scopedStoreIds } }),
    },
    select: { id: true, name: true, slug: true, timezone: true },
    orderBy: { name: "asc" },
  });

  const staff = await prisma.staff.findFirst({
    where: { userId: user.id, organizationId: organization.id, deletedAt: null },
    select: { id: true },
  });

  const activeStoreId =
    session.activeStoreId && accessibleStores.some((store) => store.id === session.activeStoreId)
      ? session.activeStoreId
      : (accessibleStores[0]?.id ?? null);

  // Fire-and-forget: a failed heartbeat must not break the page render.
  void touchSession(session.sessionId).catch(() => undefined);

  return {
    requestId,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      locale: user.locale,
      isPlatformAdmin: user.isPlatformAdmin,
    },
    sessionId: session.sessionId,
    organizationId: organization.id,
    organization,
    staffId: staff?.id ?? null,
    accessibleStores,
    activeStoreId,
    globalPermissions,
    storePermissions,
    masks: {
      customerPhone: maskCustomerPhone,
      customerEmail: maskCustomerEmail,
      salesAmount: maskSalesAmount,
      medicalPhoto: maskMedicalPhoto,
      staffCompensation: maskStaffCompensation,
    },
    restrictToOwnRecords,
    ipAddress,
    userAgent,
  };
});

export async function requireContext(): Promise<RequestContext> {
  const context = await getRequestContext();
  if (!context) throw new AuthenticationError();
  return context;
}

/**
 * Does the context hold `permission`?
 *
 * When `storeId` is supplied the check also passes if the permission was
 * granted for that store specifically. Omitting `storeId` asks "anywhere",
 * which is only appropriate for deciding whether to render a nav item.
 */
export function can(
  context: RequestContext,
  permission: PermissionKey,
  storeId?: string | null,
): boolean {
  if (context.globalPermissions.has(permission)) return true;

  if (storeId) {
    return context.storePermissions.get(storeId)?.has(permission) ?? false;
  }

  for (const permissions of context.storePermissions.values()) {
    if (permissions.has(permission)) return true;
  }
  return false;
}

export function requirePermission(
  context: RequestContext,
  permission: PermissionKey,
  storeId?: string | null,
): void {
  if (!can(context, permission, storeId)) {
    throw new AuthorizationError(`この操作には ${permission} 権限が必要です`, permission);
  }
}

/** Throws unless the store belongs to the session's organization and is visible. */
export function requireStoreAccess(context: RequestContext, storeId: string): void {
  if (!context.accessibleStores.some((store) => store.id === storeId)) {
    throw new AuthorizationError("この店舗へアクセスする権限がありません");
  }
}

/** The set of store ids a query should be limited to. */
export function scopedStoreIds(context: RequestContext, storeId?: string | null): string[] {
  if (storeId) {
    requireStoreAccess(context, storeId);
    return [storeId];
  }
  return context.accessibleStores.map((store) => store.id);
}

function extractClientIp(headerList: Headers): string | null {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    // Left-most entry is the original client; the rest are proxies.
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headerList.get("x-real-ip");
}
