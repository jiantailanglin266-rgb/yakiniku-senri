import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { normalizeEmail, normalizePhone } from "@/lib/normalize";
import { prisma } from "@/server/db/client";
import {
  BookingConflictError,
  BookingRejectedError,
  createAppointment,
} from "@/server/modules/appointments/booking-service";
import { getPublicStore } from "@/server/modules/booking/public-service";
import { jsonError, jsonOk, rateLimited, validationError } from "@/server/api/response";
import { hit, rateLimitKey } from "@/server/security/rate-limit";
import { logger } from "@/server/observability/logger";

/**
 * POST /api/v1/public/appointments
 *
 * Creates a booking from the public page.
 *
 * Three protections layered here, beyond what the booking service does:
 *
 *   - Rate limiting, so the endpoint cannot be used to enumerate availability
 *     or to flood a salon with junk bookings.
 *   - An idempotency record, so a double-tapped "confirm" button or a network
 *     retry produces one booking rather than two.
 *   - Guest contact details are normalised and a matching customer is reused,
 *     so a returning guest does not create a fresh duplicate every visit.
 */

const bodySchema = z.object({
  storeSlug: z.string().min(1),
  serviceIds: z.array(z.string().min(1)).min(1).max(10),
  optionIds: z.array(z.string().min(1)).max(20).optional(),
  staffId: z.string().min(1),
  startAt: z.string().min(1),
  isDesignated: z.boolean().optional(),
  customer: z.object({
    name: z.string().min(1).max(100),
    nameKana: z.string().max(100).optional(),
    phone: z.string().max(40).optional(),
    email: z.string().email("メールアドレスの形式を確認してください").max(320).optional(),
    note: z.string().max(1000).optional(),
  }),
  consent: z.object({
    terms: z.literal(true, { message: "利用規約への同意が必要です" }),
    cancellation: z.literal(true, { message: "キャンセルポリシーへの同意が必要です" }),
    privacy: z.literal(true, { message: "個人情報の取り扱いへの同意が必要です" }),
  }),
});

const IDEMPOTENCY_TTL_MS = 24 * 3600_000;

/**
 * Deliberately tighter than the availability browse limit: creating bookings
 * is a write, and no genuine customer needs more than a handful a minute.
 */
const BOOKING_LIMIT_PER_MINUTE = 10;

export async function POST(request: Request): Promise<Response> {
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip");

  const limit = hit(rateLimitKey("public:booking", clientIp), BOOKING_LIMIT_PER_MINUTE);
  if (!limit.allowed) return rateLimited(request, limit.retryAfterSeconds);

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError("INVALID_JSON", "リクエストの形式が不正です", request, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return validationError(parsed.error, request);

  const store = await getPublicStore(parsed.data.storeSlug);
  if (!store) {
    return jsonError("STORE_NOT_FOUND", "店舗が見つかりません", request, { status: 404 });
  }

  const startAt = new Date(parsed.data.startAt);
  if (Number.isNaN(startAt.getTime())) {
    return jsonError("INVALID_START_TIME", "日時の形式が不正です", request, { status: 422 });
  }

  const email = normalizeEmail(parsed.data.customer.email);
  const phone = normalizePhone(parsed.data.customer.phone);

  if (!email && !phone) {
    return jsonError(
      "CONTACT_REQUIRED",
      "メールアドレスまたは電話番号のいずれかが必要です",
      request,
      { status: 422 },
    );
  }

  // --- Idempotency ---------------------------------------------------------
  const requestHash = createHash("sha256").update(JSON.stringify(parsed.data)).digest("hex");

  const idempotencyKey = request.headers.get("idempotency-key") ?? requestHash.slice(0, 32);

  const existing = await prisma.idempotencyRecord.findUnique({
    where: { scope_key: { scope: "public.appointments.create", key: idempotencyKey } },
    select: { status: true, responseStatus: true, responseBody: true, requestHash: true },
  });

  if (existing) {
    if (existing.requestHash !== requestHash) {
      return jsonError(
        "IDEMPOTENCY_KEY_REUSED",
        "同じキーで異なる内容のリクエストが送信されました",
        request,
        { status: 409 },
      );
    }
    if (existing.status === "completed" && existing.responseBody) {
      return jsonOk(existing.responseBody, request, {
        status: existing.responseStatus ?? 200,
      });
    }
    return jsonError("REQUEST_IN_FLIGHT", "処理中です。しばらくお待ちください", request, {
      status: 409,
    });
  }

  try {
    await prisma.idempotencyRecord.create({
      data: {
        organizationId: store.organizationId,
        scope: "public.appointments.create",
        key: idempotencyKey,
        requestHash,
        status: "in_flight",
        expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
      },
    });
  } catch {
    // Lost the race with a concurrent identical request; it will produce the
    // booking, so this one steps aside rather than creating a second.
    return jsonError("REQUEST_IN_FLIGHT", "処理中です。しばらくお待ちください", request, {
      status: 409,
    });
  }

  try {
    // Reuse a matching customer rather than accumulating duplicates.
    const customerId = await findOrCreateCustomer({
      organizationId: store.organizationId,
      storeId: store.id,
      name: parsed.data.customer.name,
      nameKana: parsed.data.customer.nameKana ?? null,
      phone: parsed.data.customer.phone ?? null,
      phoneNormalized: phone,
      email: parsed.data.customer.email ?? null,
      emailNormalized: email,
      ipAddress: clientIp,
      userAgent: request.headers.get("user-agent"),
    });

    const appointment = await createAppointment({
      organizationId: store.organizationId,
      storeId: store.id,
      customerId,
      serviceIds: parsed.data.serviceIds,
      optionIds: parsed.data.optionIds ?? [],
      staffId: parsed.data.staffId,
      startAt,
      source: "public_web",
      isDesignated: parsed.data.isDesignated ?? false,
      customerNote: parsed.data.customer.note ?? null,
    });

    const body = {
      reference: appointment.reference,
      status: appointment.status,
      startAt: appointment.startAt.toISOString(),
      endAt: appointment.endAt.toISOString(),
      totalAmount: appointment.totalAmount,
      requiresApproval: appointment.status === "pending",
      notificationSent: Boolean(email),
    };

    await prisma.idempotencyRecord.update({
      where: { scope_key: { scope: "public.appointments.create", key: idempotencyKey } },
      data: { status: "completed", responseStatus: 201, responseBody: body },
    });

    return jsonOk(body, request, { status: 201 });
  } catch (error) {
    // A failed attempt must not lock the key: the customer should be able to
    // pick another slot and try again immediately.
    await prisma.idempotencyRecord
      .delete({
        where: { scope_key: { scope: "public.appointments.create", key: idempotencyKey } },
      })
      .catch(() => undefined);

    if (error instanceof BookingConflictError) {
      return jsonError("SLOT_TAKEN", error.message, request, { status: 409 });
    }
    if (error instanceof BookingRejectedError) {
      return jsonError(error.reason, error.message, request, { status: 422 });
    }

    logger.error("public_booking_failed", {
      storeId: store.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return jsonError("UNEXPECTED", "予約処理に失敗しました", request, { status: 500 });
  }
}

interface CustomerInput {
  organizationId: string;
  storeId: string;
  name: string;
  nameKana: string | null;
  phone: string | null;
  phoneNormalized: string | null;
  email: string | null;
  emailNormalized: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}

/**
 * Match an existing customer by normalised phone or email, or create one.
 *
 * Matching only on a normalised contact value — never on name alone — so two
 * different people who share a common name are never merged by the public
 * endpoint.
 */
async function findOrCreateCustomer(input: CustomerInput): Promise<string> {
  const matchers: Prisma.CustomerWhereInput[] = [];
  if (input.phoneNormalized) matchers.push({ phoneNormalized: input.phoneNormalized });
  if (input.emailNormalized) matchers.push({ emailNormalized: input.emailNormalized });

  if (matchers.length > 0) {
    const existing = await prisma.customer.findFirst({
      where: {
        organizationId: input.organizationId,
        deletedAt: null,
        mergedIntoId: null,
        OR: matchers,
      },
      select: { id: true },
    });
    if (existing) return existing.id;
  }

  const customer = await prisma.customer.create({
    data: {
      organizationId: input.organizationId,
      homeStoreId: input.storeId,
      name: input.name,
      nameKana: input.nameKana,
      phone: input.phone,
      phoneNormalized: input.phoneNormalized,
      email: input.email,
      emailNormalized: input.emailNormalized,
      acquisitionSource: "オンライン予約",
      consents: {
        create: [
          {
            type: "terms_of_service",
            status: "granted",
            grantedAt: new Date(),
            sourceIp: input.ipAddress,
            sourceUserAgent: input.userAgent,
          },
          {
            type: "privacy_policy",
            status: "granted",
            grantedAt: new Date(),
            sourceIp: input.ipAddress,
            sourceUserAgent: input.userAgent,
          },
        ],
      },
    },
    select: { id: true },
  });

  return customer.id;
}
