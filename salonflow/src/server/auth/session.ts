import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

import { env } from "@/config/env";
import { prisma } from "@/server/db/client";

export const SESSION_COOKIE = "sf_session";

/**
 * Session tokens.
 *
 * The raw token lives only in the user's cookie. The database stores its
 * SHA-256, so a dump of `UserSession` yields nothing an attacker can present.
 * SHA-256 (rather than a slow KDF) is appropriate here because the token is
 * 256 bits of CSPRNG output — there is no low-entropy secret to protect.
 */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export interface CreateSessionInput {
  userId: string;
  organizationId: string | null;
  activeStoreId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface CreatedSession {
  sessionId: string;
  token: string;
  expiresAt: Date;
}

export async function createSession(input: CreateSessionInput): Promise<CreatedSession> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + env().SESSION_TTL_SECONDS * 1000);

  const session = await prisma.userSession.create({
    data: {
      userId: input.userId,
      tokenHash: hashSessionToken(token),
      organizationId: input.organizationId,
      activeStoreId: input.activeStoreId ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      deviceLabel: describeDevice(input.userAgent),
      expiresAt,
    },
    select: { id: true },
  });

  return { sessionId: session.id, token, expiresAt };
}

/** Write the session cookie. Must be called from a Server Action or handler. */
export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    // Lax rather than Strict: the booking confirmation links customers follow
    // from email must not land them on a logged-out page.
    sameSite: "lax",
    secure: env().NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function readSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export async function revokeSession(sessionId: string, reason: string): Promise<void> {
  await prisma.userSession.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: reason },
  });
}

/** Revoke every other session for the user — used after a password change. */
export async function revokeOtherSessions(
  userId: string,
  keepSessionId: string,
  reason: string,
): Promise<number> {
  const result = await prisma.userSession.updateMany({
    where: { userId, revokedAt: null, id: { not: keepSessionId } },
    data: { revokedAt: new Date(), revokedReason: reason },
  });
  return result.count;
}

export interface ResolvedSession {
  sessionId: string;
  userId: string;
  organizationId: string | null;
  activeStoreId: string | null;
}

/**
 * Resolve the cookie into a live session.
 *
 * Returns null — never throws — for an absent, unknown, revoked, expired or
 * idle-timed-out session, so callers treat all of those identically.
 */
export async function resolveSession(token: string | null): Promise<ResolvedSession | null> {
  if (!token) return null;

  const session = await prisma.userSession.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    select: {
      id: true,
      userId: true,
      organizationId: true,
      activeStoreId: true,
      expiresAt: true,
      revokedAt: true,
      lastSeenAt: true,
      user: { select: { deletedAt: true, lockedUntil: true } },
    },
  });

  if (!session) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt.getTime() <= Date.now()) return null;
  if (session.user.deletedAt) return null;

  const idleLimitMs = env().SESSION_IDLE_DAYS * 24 * 60 * 60 * 1000;
  if (Date.now() - session.lastSeenAt.getTime() > idleLimitMs) {
    await revokeSession(session.id, "idle_timeout");
    return null;
  }

  return {
    sessionId: session.id,
    userId: session.userId,
    organizationId: session.organizationId,
    activeStoreId: session.activeStoreId,
  };
}

/**
 * Refresh `lastSeenAt`, but at most once a minute.
 *
 * Without the throttle every page render would issue a write, turning a
 * read-heavy dashboard into a write-heavy one.
 */
export async function touchSession(sessionId: string): Promise<void> {
  const cutoff = new Date(Date.now() - 60_000);
  await prisma.userSession.updateMany({
    where: { id: sessionId, lastSeenAt: { lt: cutoff } },
    data: { lastSeenAt: new Date() },
  });
}

export async function switchActiveStore(sessionId: string, storeId: string | null): Promise<void> {
  await prisma.userSession.update({
    where: { id: sessionId },
    data: { activeStoreId: storeId },
  });
}

/** Coarse device description for the "active sessions" screen. */
function describeDevice(userAgent: string | null | undefined): string | null {
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();
  if (ua.includes("ipad")) return "iPad";
  if (ua.includes("iphone")) return "iPhone";
  if (ua.includes("android")) return "Android";
  if (ua.includes("macintosh")) return "Mac";
  if (ua.includes("windows")) return "Windows";
  if (ua.includes("linux")) return "Linux";
  return "Unknown device";
}
