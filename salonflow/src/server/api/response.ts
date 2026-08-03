import "server-only";

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Shared API response shape.
 *
 * Every endpoint returns the same envelope so a client can handle errors
 * uniformly, and every response carries a `requestId` that also appears in the
 * audit log and the application log — which is what makes a support ticket
 * traceable.
 */

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    /** Field-level detail for validation failures. */
    details?: Array<{ path: string; message: string }>;
  };
  requestId: string;
}

export function requestId(request: Request): string {
  return request.headers.get("x-request-id") ?? randomUUID();
}

export function jsonOk<T>(
  data: T,
  request: Request,
  init?: { status?: number; headers?: HeadersInit },
): NextResponse {
  const id = requestId(request);
  return NextResponse.json(
    { data, requestId: id },
    {
      status: init?.status ?? 200,
      headers: { "x-request-id": id, ...(init?.headers ?? {}) },
    },
  );
}

export function jsonError(
  code: string,
  message: string,
  request: Request,
  init?: { status?: number; details?: ApiErrorBody["error"]["details"]; headers?: HeadersInit },
): NextResponse {
  const id = requestId(request);
  return NextResponse.json(
    {
      error: { code, message, ...(init?.details ? { details: init.details } : {}) },
      requestId: id,
    } satisfies ApiErrorBody,
    {
      status: init?.status ?? 400,
      headers: { "x-request-id": id, ...(init?.headers ?? {}) },
    },
  );
}

export function validationError(error: ZodError, request: Request): NextResponse {
  return jsonError("VALIDATION_FAILED", "入力内容を確認してください", request, {
    status: 422,
    details: error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  });
}

export function rateLimited(request: Request, retryAfterSeconds: number): NextResponse {
  return jsonError("RATE_LIMITED", "リクエストが多すぎます", request, {
    status: 429,
    headers: { "retry-after": String(retryAfterSeconds) },
  });
}

/** Parse and clamp a pagination parameter. */
export function parsePage(value: string | null, fallback = 1): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : fallback;
}

export function parsePageSize(value: string | null, fallback = 25, max = 100): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(max, Math.floor(parsed));
}
