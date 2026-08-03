"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { env } from "@/config/env";
import { normalizeEmail } from "@/lib/normalize";
import { prisma } from "@/server/db/client";
import { AUDIT_ACTIONS, writeAuthAuditLog } from "@/server/observability/audit";
import { hit, rateLimitKey } from "@/server/security/rate-limit";
import { getRequestContext } from "./context";
import { verifyPassword } from "./password";
import {
  clearSessionCookie,
  createSession,
  readSessionToken,
  resolveSession,
  revokeSession,
  setSessionCookie,
  switchActiveStore,
} from "./session";

const signInSchema = z.object({
  email: z.string().min(1, "auth.email_required").max(320),
  password: z.string().min(1, "auth.password_required").max(200),
});

export interface SignInState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Credential sign-in.
 *
 * Failure responses are deliberately uniform: an unknown address, a wrong
 * password and a locked account all return `auth.invalid_credentials`, so the
 * form cannot be used to enumerate which emails have accounts. The lock state
 * is the one exception — telling a legitimate user *why* they are blocked is
 * worth more than the small amount of information it reveals about an address
 * that already failed several times.
 */
export async function signInAction(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "auth.invalid_input" };
  }

  const headerList = await headers();
  const ipAddress = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = headerList.get("user-agent");

  const limit = hit(rateLimitKey("auth:signin", ipAddress), env().RATE_LIMIT_AUTH_PER_MINUTE);
  if (!limit.allowed) {
    return { error: "auth.rate_limited" };
  }

  const emailNormalized = normalizeEmail(parsed.data.email);
  if (!emailNormalized) return { error: "auth.invalid_credentials" };

  const user = await prisma.user.findUnique({
    where: { emailNormalized },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      deletedAt: true,
      failedLoginCount: true,
      lockedUntil: true,
    },
  });

  const now = new Date();

  if (!user || user.deletedAt || !user.passwordHash) {
    // Still spend time hashing so the response duration does not reveal
    // whether the address exists.
    await verifyPassword(parsed.data.password, "scrypt$65536$8$1$00$00");
    await writeAuthAuditLog({
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      actorLabel: emailNormalized,
      ipAddress,
      userAgent,
      meta: { reason: "unknown_user" },
    });
    return { error: "auth.invalid_credentials" };
  }

  if (user.lockedUntil && user.lockedUntil > now) {
    await writeAuthAuditLog({
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      userId: user.id,
      actorLabel: user.email,
      ipAddress,
      userAgent,
      meta: { reason: "locked", lockedUntil: user.lockedUntil.toISOString() },
    });
    return { error: "auth.account_locked" };
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);

  if (!valid) {
    const failedCount = user.failedLoginCount + 1;
    const shouldLock = failedCount >= env().AUTH_MAX_FAILED_ATTEMPTS;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: shouldLock ? 0 : failedCount,
        lockedUntil: shouldLock ? new Date(now.getTime() + env().AUTH_LOCK_MINUTES * 60_000) : null,
      },
    });

    await writeAuthAuditLog({
      action: shouldLock ? AUDIT_ACTIONS.ACCOUNT_LOCKED : AUDIT_ACTIONS.LOGIN_FAILED,
      userId: user.id,
      actorLabel: user.email,
      ipAddress,
      userAgent,
      meta: { reason: "bad_password", attempt: failedCount },
    });

    return { error: shouldLock ? "auth.account_locked" : "auth.invalid_credentials" };
  }

  // Pick the organization this login belongs to. A user with roles in several
  // organizations lands in the first; switching is a separate action.
  const membership = await prisma.userRole.findFirst({
    where: { userId: user.id },
    select: { organizationId: true, storeId: true },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    await writeAuthAuditLog({
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      userId: user.id,
      actorLabel: user.email,
      ipAddress,
      userAgent,
      meta: { reason: "no_membership" },
    });
    return { error: "auth.no_organization" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: now },
  });

  const session = await createSession({
    userId: user.id,
    organizationId: membership.organizationId,
    activeStoreId: membership.storeId,
    ipAddress,
    userAgent,
  });

  await setSessionCookie(session.token, session.expiresAt);

  await writeAuthAuditLog({
    action: AUDIT_ACTIONS.LOGIN_SUCCEEDED,
    userId: user.id,
    actorLabel: user.email,
    organizationId: membership.organizationId,
    ipAddress,
    userAgent,
    meta: { sessionId: session.sessionId },
  });

  redirect("/admin");
}

export async function signOutAction(): Promise<void> {
  const token = await readSessionToken();
  const session = await resolveSession(token);

  if (session) {
    await revokeSession(session.sessionId, "user_logout");
    await writeAuthAuditLog({
      action: AUDIT_ACTIONS.LOGOUT,
      userId: session.userId,
      organizationId: session.organizationId,
      meta: { sessionId: session.sessionId },
    });
  }

  await clearSessionCookie();
  redirect("/signin");
}

/** Change the store the admin UI is currently scoped to. */
export async function switchStoreAction(formData: FormData): Promise<void> {
  const context = await getRequestContext();
  if (!context) redirect("/signin");

  const storeId = String(formData.get("storeId") ?? "");
  const allowed = context.accessibleStores.some((store) => store.id === storeId);

  await switchActiveStore(context.sessionId, allowed ? storeId : null);
  redirect(String(formData.get("redirectTo") ?? "/admin"));
}
