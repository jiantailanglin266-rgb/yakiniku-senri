import "server-only";

import { PrismaClient } from "@prisma/client";

import { env } from "@/config/env";

/**
 * Prisma client singleton.
 *
 * Next.js hot-reloads server modules in development, which would otherwise
 * open a new pool on every edit until PostgreSQL refuses connections.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env().LOG_LEVEL === "debug" ? ["query", "warn", "error"] : ["warn", "error"],
  });

if (env().NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export type { Prisma } from "@prisma/client";

/** PostgreSQL error code for an exclusion-constraint violation. */
export const PG_EXCLUSION_VIOLATION = "23P01";
/** PostgreSQL error code for a unique-constraint violation. */
export const PG_UNIQUE_VIOLATION = "23505";
/** PostgreSQL error code for a serialization failure worth retrying. */
export const PG_SERIALIZATION_FAILURE = "40001";

interface DatabaseErrorLike {
  code?: string;
  meta?: { code?: string; constraint?: string; cause?: string };
  message?: string;
}

/**
 * Detect the double-booking case.
 *
 * Prisma surfaces exclusion violations as a generic `P2010`/`P2034`-ish raw
 * error rather than a typed one, so both the driver code and the constraint
 * name are checked.
 */
export function isOverlapViolation(error: unknown): boolean {
  const candidate = error as DatabaseErrorLike;
  if (!candidate) return false;

  const constraint = candidate.meta?.constraint ?? candidate.meta?.cause ?? candidate.message ?? "";

  return (
    candidate.meta?.code === PG_EXCLUSION_VIOLATION ||
    candidate.code === PG_EXCLUSION_VIOLATION ||
    /appointment_(staff|resource)_no_overlap/.test(String(constraint))
  );
}

export function isSerializationFailure(error: unknown): boolean {
  const candidate = error as DatabaseErrorLike;
  return (
    candidate?.meta?.code === PG_SERIALIZATION_FAILURE ||
    candidate?.code === PG_SERIALIZATION_FAILURE
  );
}
