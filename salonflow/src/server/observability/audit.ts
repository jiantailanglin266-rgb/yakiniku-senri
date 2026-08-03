import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";
import type { RequestContext } from "@/server/auth/context";
import { logger } from "./logger";

/**
 * Audit logging.
 *
 * Records who did what to which record, with a before/after snapshot. Two
 * rules govern this module:
 *
 *   1. Secrets never enter the log. The redaction pass below strips them
 *      regardless of what the caller passed.
 *   2. A failure to write an audit entry must not roll back the business
 *      operation it describes — except where the caller explicitly opts into
 *      transactional auditing by passing a `tx`.
 */

export const AUDIT_ACTIONS = {
  LOGIN_SUCCEEDED: "auth.login.succeeded",
  LOGIN_FAILED: "auth.login.failed",
  LOGOUT: "auth.logout",
  ACCOUNT_LOCKED: "auth.account.locked",
  SESSION_REVOKED: "auth.session.revoked",

  APPOINTMENT_CREATED: "appointment.created",
  APPOINTMENT_UPDATED: "appointment.updated",
  APPOINTMENT_CANCELLED: "appointment.cancelled",
  APPOINTMENT_STATUS_CHANGED: "appointment.status_changed",

  CUSTOMER_VIEWED: "customer.viewed",
  CUSTOMER_CREATED: "customer.created",
  CUSTOMER_UPDATED: "customer.updated",
  CUSTOMER_DELETED: "customer.deleted",
  CUSTOMER_MERGED: "customer.merged",
  CUSTOMER_EXPORTED: "customer.exported",

  MEDICAL_RECORD_VIEWED: "medical_record.viewed",
  MEDICAL_RECORD_CREATED: "medical_record.created",
  MEDICAL_RECORD_UPDATED: "medical_record.updated",
  MEDICAL_PHOTO_VIEWED: "medical_record.photo_viewed",

  SALE_CREATED: "sale.created",
  SALE_VOIDED: "sale.voided",
  REFUND_CREATED: "refund.created",

  ROLE_CHANGED: "permission.role_changed",
  SETTINGS_CHANGED: "settings.changed",
  API_KEY_CREATED: "api_key.created",
  DATA_IMPORTED: "data.imported",
  DATA_EXPORTED: "data.exported",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export interface AuditInput {
  action: AuditAction | string;
  entityType: string;
  entityId?: string | null;
  storeId?: string | null;
  before?: unknown;
  after?: unknown;
  /** Extra context merged into `after` under a `_meta` key. */
  meta?: Record<string, unknown>;
}

/**
 * Field names whose values are stripped before storage.
 *
 * The spec is explicit that passwords, card numbers and access tokens must
 * never be recorded. This list is the enforcement point; it errs on the side
 * of over-redaction.
 */
const REDACTED_KEYS =
  /^(password|passwordHash|newPassword|currentPassword|secret|previousSecret|token|tokenHash|keyHash|accessToken|refreshToken|apiKey|authorization|cookie|cardNumber|pan|cvv|cvc|securityCode|providerToken|signatureData)$/i;

const MAX_STRING_LENGTH = 2_000;

export function redact(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (depth > 6) return "[truncated]";

  if (typeof value === "string") {
    return value.length > MAX_STRING_LENGTH
      ? `${value.slice(0, MAX_STRING_LENGTH)}…[truncated]`
      : value;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) {
    return value.slice(0, 200).map((entry) => redact(entry, depth + 1));
  }

  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      result[key] = REDACTED_KEYS.test(key) ? "[redacted]" : redact(entry, depth + 1);
    }
    return result;
  }

  return String(value);
}

/**
 * Write an audit entry.
 *
 * Pass `tx` when the entry must share the caller's transaction — for example
 * an appointment creation, where an audit row without the appointment (or
 * vice versa) would be misleading.
 */
export async function writeAuditLog(
  context: Pick<
    RequestContext,
    "organizationId" | "user" | "requestId" | "ipAddress" | "userAgent"
  >,
  input: AuditInput,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const data = {
    organizationId: context.organizationId,
    storeId: input.storeId ?? null,
    actorId: context.user.id,
    actorLabel: `${context.user.name} <${context.user.email}>`,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    before: (redact(input.before) ?? undefined) as Prisma.InputJsonValue | undefined,
    after: mergeMeta(input.after, input.meta) as Prisma.InputJsonValue | undefined,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    requestId: context.requestId,
  };

  if (tx) {
    await tx.auditLog.create({ data });
    return;
  }

  try {
    await prisma.auditLog.create({ data });
  } catch (error) {
    // Losing an audit row is serious but must not fail the user's operation;
    // the failure itself is surfaced through the application log.
    logger.error("audit_log_write_failed", {
      requestId: context.requestId,
      organizationId: context.organizationId,
      action: input.action,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Record an authentication event, which happens before a context exists.
 */
export async function writeAuthAuditLog(input: {
  action: AuditAction | string;
  userId?: string | null;
  actorLabel?: string | null;
  organizationId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: input.organizationId ?? null,
        actorId: input.userId ?? null,
        actorLabel: input.actorLabel ?? null,
        action: input.action,
        entityType: "User",
        entityId: input.userId ?? null,
        after: (redact(input.meta) ?? undefined) as Prisma.InputJsonValue | undefined,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        requestId: input.requestId ?? null,
      },
    });
  } catch (error) {
    logger.error("auth_audit_log_write_failed", {
      action: input.action,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function mergeMeta(after: unknown, meta: Record<string, unknown> | undefined): unknown {
  if (!meta) return redact(after) ?? undefined;
  const base = redact(after);
  if (base && typeof base === "object" && !Array.isArray(base)) {
    return { ...(base as Record<string, unknown>), _meta: redact(meta) };
  }
  return { value: base, _meta: redact(meta) };
}
