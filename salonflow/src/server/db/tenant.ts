import "server-only";

import { AuthorizationError, type RequestContext } from "@/server/auth/context";

/**
 * Tenant scoping.
 *
 * Cross-tenant leakage is the single worst failure this product can have
 * (risk R-01), so scoping is not left to each query author remembering a
 * `where` clause. Callers build filters through this module, which always
 * emits the organization predicate, and verify every loaded row on the way
 * back out.
 */

export interface TenantFilter {
  organizationId: string;
  deletedAt: null;
}

/** Base filter for any organization-scoped model. */
export function orgScope(context: RequestContext): TenantFilter {
  return { organizationId: context.organizationId, deletedAt: null };
}

/** Base filter including the soft-deleted rows (for restore screens). */
export function orgScopeWithDeleted(context: RequestContext): { organizationId: string } {
  return { organizationId: context.organizationId };
}

/**
 * Filter for a store-scoped model.
 *
 * Passing an explicit `storeId` narrows to that store *after* checking the
 * user may see it. Passing nothing widens to every store the user can access —
 * never to every store in the organization.
 */
export function storeScope(
  context: RequestContext,
  storeId?: string | null,
): { organizationId: string; storeId: { in: string[] } | string; deletedAt: null } {
  if (storeId) {
    if (!context.accessibleStores.some((store) => store.id === storeId)) {
      throw new AuthorizationError("この店舗へアクセスする権限がありません");
    }
    return { organizationId: context.organizationId, storeId, deletedAt: null };
  }

  return {
    organizationId: context.organizationId,
    storeId: { in: context.accessibleStores.map((store) => store.id) },
    deletedAt: null,
  };
}

/** Same as `storeScope` but for models without a `deletedAt` column. */
export function storeScopeHard(
  context: RequestContext,
  storeId?: string | null,
): { organizationId: string; storeId: { in: string[] } | string } {
  const scope = storeScope(context, storeId);
  return { organizationId: scope.organizationId, storeId: scope.storeId };
}

/**
 * Verify a row that was loaded by primary key really belongs to this tenant.
 *
 * `findUnique({ where: { id } })` cannot carry a tenant predicate, so this is
 * the guard for that pattern. Returning the narrowed row lets it be used
 * inline: `const store = assertTenant(ctx, await prisma.store.findUnique(...))`.
 */
export function assertTenant<T extends { organizationId: string } | null>(
  context: RequestContext,
  row: T,
): NonNullable<T> {
  if (!row) {
    // Deliberately identical to the cross-tenant message: revealing "this id
    // exists but is not yours" is itself an information leak.
    throw new AuthorizationError("対象が見つからないか、アクセス権がありません");
  }
  if (row.organizationId !== context.organizationId) {
    throw new AuthorizationError("対象が見つからないか、アクセス権がありません");
  }
  return row as NonNullable<T>;
}

/** As `assertTenant`, additionally checking the store is visible to the user. */
export function assertTenantStore<T extends { organizationId: string; storeId: string } | null>(
  context: RequestContext,
  row: T,
): NonNullable<T> {
  const checked = assertTenant(context, row);
  if (!context.accessibleStores.some((store) => store.id === checked.storeId)) {
    throw new AuthorizationError("対象が見つからないか、アクセス権がありません");
  }
  return checked;
}

/**
 * Extra predicate applied for roles limited to their own records.
 *
 * Returns an empty object for unrestricted users so it can always be spread
 * into a `where` clause.
 */
export function ownRecordScope(
  context: RequestContext,
): { staffSlots: { some: { staffId: string } } } | Record<string, never> {
  if (!context.restrictToOwnRecords || !context.staffId) return {};
  return { staffSlots: { some: { staffId: context.staffId } } };
}
