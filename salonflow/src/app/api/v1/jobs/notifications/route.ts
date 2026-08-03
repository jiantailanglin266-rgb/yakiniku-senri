import { createHash, timingSafeEqual } from "node:crypto";

import { env } from "@/config/env";
import { dispatchPendingNotifications } from "@/server/notifications/outbox";
import { jsonError, jsonOk } from "@/server/api/response";

/**
 * POST /api/v1/jobs/notifications
 *
 * Drains the notification outbox.
 *
 * Phase 1 has no queue worker (see ADR-0004), so delivery is driven by a
 * scheduler calling this endpoint — a cron job, a platform scheduler, or a
 * developer with curl. It is authenticated with a shared secret derived from
 * `SESSION_SECRET` rather than a session, because a scheduler has no user.
 *
 * The endpoint is idempotent: notifications are claimed with a conditional
 * update, so two schedulers firing at once cannot send the same email twice.
 */

function expectedToken(): string {
  return createHash("sha256").update(`jobs:notifications:${env().SESSION_SECRET}`).digest("hex");
}

export async function POST(request: Request): Promise<Response> {
  const provided = request.headers.get("x-job-token") ?? "";
  const expected = expectedToken();

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return jsonError("UNAUTHORIZED", "ジョブトークンが不正です", request, { status: 401 });
  }

  const result = await dispatchPendingNotifications(100);
  return jsonOk(result, request);
}

/**
 * GET returns the token, but only in development.
 *
 * This saves a developer from computing a SHA-256 by hand to test the job. In
 * production it 404s — the secret must come from the deployment configuration,
 * never from the running service.
 */
export async function GET(request: Request): Promise<Response> {
  if (env().NODE_ENV === "production") {
    return jsonError("NOT_FOUND", "not found", request, { status: 404 });
  }
  return jsonOk({ token: expectedToken() }, request);
}
