import { z } from "zod";

import { env } from "@/config/env";
import { getPublicAvailability, getPublicStore } from "@/server/modules/booking/public-service";
import { jsonError, jsonOk, rateLimited, validationError } from "@/server/api/response";
import { hit, rateLimitKey } from "@/server/security/rate-limit";

/**
 * GET /api/v1/public/stores/:storeSlug/availability
 *
 * Unauthenticated slot lookup for the booking page.
 *
 * The result is advisory only. A slot returned here can be taken by someone
 * else a second later; the booking endpoint re-validates and the database
 * exclusion constraints have the final say.
 */

const querySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 形式で指定してください"),
  days: z.coerce.number().int().min(1).max(14).default(7),
  serviceIds: z.array(z.string().min(1)).min(1).max(10),
  optionIds: z.array(z.string().min(1)).max(20).optional(),
  staffId: z.string().min(1).nullable().optional(),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ storeSlug: string }> },
): Promise<Response> {
  const { storeSlug } = await context.params;
  const url = new URL(request.url);

  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip");

  const limit = hit(
    rateLimitKey("public:availability", clientIp),
    env().RATE_LIMIT_PUBLIC_PER_MINUTE,
  );
  if (!limit.allowed) return rateLimited(request, limit.retryAfterSeconds);

  const parsed = querySchema.safeParse({
    from: url.searchParams.get("from") ?? undefined,
    days: url.searchParams.get("days") ?? undefined,
    serviceIds: url.searchParams.getAll("serviceId"),
    optionIds: url.searchParams.getAll("optionId"),
    staffId: url.searchParams.get("staffId"),
  });
  if (!parsed.success) return validationError(parsed.error, request);

  const store = await getPublicStore(storeSlug);
  if (!store) {
    return jsonError("STORE_NOT_FOUND", "店舗が見つかりません", request, { status: 404 });
  }

  const availability = await getPublicAvailability(store, {
    fromDateISO: parsed.data.from,
    days: parsed.data.days,
    serviceIds: parsed.data.serviceIds,
    optionIds: parsed.data.optionIds,
    staffId: parsed.data.staffId ?? null,
  });

  return jsonOk(
    { timeZone: store.timeZone, days: availability },
    request,
    // Availability goes stale immediately; caching it would show taken slots.
    { headers: { "cache-control": "no-store" } },
  );
}
