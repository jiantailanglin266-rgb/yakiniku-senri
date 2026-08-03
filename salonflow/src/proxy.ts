import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Request proxy (formerly `middleware`; renamed in Next.js 16).
 *
 * Two jobs, both deliberately narrow:
 *
 *   1. Stamp every request with an `x-request-id`, which flows into the audit
 *      log, the application log and the API response envelope. Without it,
 *      correlating "the customer says booking failed at 14:32" with a log line
 *      is guesswork.
 *   2. Reject cross-origin state-changing requests. Server Actions and the
 *      JSON API both rely on a cookie, so an `Origin` that is not this site is
 *      a CSRF attempt regardless of what the body contains.
 *
 * Authentication is NOT done here. The proxy runs before the route resolves
 * and cannot see the tenant; every page and handler resolves the session
 * itself, so there is no gap between "the proxy let it through" and "the
 * handler assumed it was checked".
 */
export function proxy(request: NextRequest): NextResponse {
  const requestId = request.headers.get("x-request-id") ?? randomUUID();

  const isStateChanging = !["GET", "HEAD", "OPTIONS"].includes(request.method);
  if (isStateChanging) {
    const origin = request.headers.get("origin");

    // A same-origin fetch from a modern browser always sends `Origin` on an
    // unsafe method. A missing header means a non-browser client, which the
    // cookie-based session does not apply to anyway.
    if (origin) {
      const requestOrigin = new URL(request.url).origin;
      const allowed = process.env.APP_URL ?? requestOrigin;

      if (origin !== requestOrigin && origin !== allowed) {
        return NextResponse.json(
          {
            error: { code: "CROSS_ORIGIN_BLOCKED", message: "不正なリクエスト元です" },
            requestId,
          },
          { status: 403, headers: { "x-request-id": requestId } },
        );
      }
    }
  }

  const headers = new Headers(request.headers);
  headers.set("x-request-id", requestId);

  const response = NextResponse.next({ request: { headers } });
  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  // Skip static assets: they neither need a request id nor a CSRF check.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
