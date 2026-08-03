import "server-only";

import { createHash } from "node:crypto";
import type { NotificationChannel, NotificationEvent, Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";
import { logger } from "@/server/observability/logger";
import { renderTemplate, type TemplateVariables } from "./templates";
import { sendViaChannel } from "./transports";

/**
 * Transactional outbox for notifications.
 *
 * Queuing happens inside the caller's transaction; delivery happens after the
 * commit. This is what prevents the two failure modes a naive
 * "send the email right here" implementation has:
 *
 *   - the booking rolls back but the confirmation email has already gone out;
 *   - the booking commits but the process dies before the email is sent.
 *
 * Every row carries an idempotency key derived from (event, appointment,
 * channel, recipient), so a retried request cannot produce a second email.
 */

export interface QueueNotificationInput {
  organizationId: string;
  storeId?: string | null;
  customerId?: string | null;
  appointmentId?: string | null;
  event: NotificationEvent;
  channel: NotificationChannel;
  recipient: string | null;
  locale?: "ja" | "en" | "zh_Hans" | "zh_Hant" | "ko";
  variables: TemplateVariables;
  /** Delay delivery — used for reminders. */
  scheduledAt?: Date;
  /** Overrides the derived key when the caller needs a narrower scope. */
  idempotencyKey?: string;
}

export function buildIdempotencyKey(input: QueueNotificationInput): string {
  const parts = [
    input.event,
    input.channel,
    input.appointmentId ?? input.customerId ?? "none",
    input.recipient ?? "none",
    input.scheduledAt?.toISOString() ?? "immediate",
  ].join("|");
  return createHash("sha256").update(parts).digest("hex").slice(0, 48);
}

/**
 * Add a notification to the outbox.
 *
 * Returns null — rather than throwing — when there is nobody to notify. A
 * walk-in customer with no email address is a normal situation, not an error
 * that should abort their booking.
 */
export async function queueNotification(
  tx: Prisma.TransactionClient,
  input: QueueNotificationInput,
): Promise<{ id: string } | null> {
  if (!input.recipient) return null;

  const locale = input.locale ?? "ja";
  const rendered = await renderTemplate(tx, {
    organizationId: input.organizationId,
    storeId: input.storeId ?? null,
    event: input.event,
    channel: input.channel,
    locale,
    variables: input.variables,
  });

  const idempotencyKey = input.idempotencyKey ?? buildIdempotencyKey(input);

  // `createMany` with skipDuplicates makes re-queuing a no-op instead of a
  // unique-constraint error that would abort the caller's transaction.
  const result = await tx.notification.createMany({
    data: [
      {
        organizationId: input.organizationId,
        storeId: input.storeId ?? null,
        customerId: input.customerId ?? null,
        appointmentId: input.appointmentId ?? null,
        event: input.event,
        channel: input.channel,
        locale,
        idempotencyKey,
        recipient: input.recipient,
        subject: rendered.subject,
        body: rendered.body,
        status: "pending",
        scheduledAt: input.scheduledAt ?? new Date(),
      },
    ],
    skipDuplicates: true,
  });

  if (result.count === 0) return null;

  const created = await tx.notification.findUnique({
    where: { idempotencyKey },
    select: { id: true },
  });
  return created;
}

export interface DispatchResult {
  processed: number;
  sent: number;
  failed: number;
}

/**
 * Deliver pending notifications.
 *
 * Called by the inline job runner after a request completes, and by the
 * `/api/v1/jobs/notifications` endpoint that a scheduler can poll. Attempts
 * are bounded and backed off exponentially; after the cap the row is left in
 * `failed` for an operator to inspect rather than retried forever.
 */
const MAX_ATTEMPTS = 5;

export async function dispatchPendingNotifications(limit = 50): Promise<DispatchResult> {
  const now = new Date();

  const pending = await prisma.notification.findMany({
    where: {
      status: "pending",
      scheduledAt: { lte: now },
    },
    orderBy: { scheduledAt: "asc" },
    take: limit,
    select: {
      id: true,
      organizationId: true,
      channel: true,
      recipient: true,
      subject: true,
      body: true,
      deliveries: {
        select: { attempt: true, nextRetryAt: true },
        orderBy: { attempt: "desc" },
        take: 1,
      },
    },
  });

  let sent = 0;
  let failed = 0;

  for (const notification of pending) {
    const lastAttempt = notification.deliveries[0]?.attempt ?? 0;
    const nextRetryAt = notification.deliveries[0]?.nextRetryAt;

    if (nextRetryAt && nextRetryAt > now) continue;
    if (lastAttempt >= MAX_ATTEMPTS) {
      await prisma.notification.update({
        where: { id: notification.id },
        data: { status: "failed" },
      });
      failed += 1;
      continue;
    }

    const attempt = lastAttempt + 1;

    // Claim the row so a second worker does not send the same message.
    const claimed = await prisma.notification.updateMany({
      where: { id: notification.id, status: "pending" },
      data: { status: "sending" },
    });
    if (claimed.count === 0) continue;

    const delivery = await prisma.notificationDelivery.create({
      data: { notificationId: notification.id, attempt, status: "sending" },
      select: { id: true },
    });

    try {
      const outcome = await sendViaChannel({
        channel: notification.channel,
        recipient: notification.recipient,
        subject: notification.subject,
        body: notification.body,
      });

      await prisma.$transaction([
        prisma.notificationDelivery.update({
          where: { id: delivery.id },
          data: {
            status: "sent",
            providerName: outcome.provider,
            providerMessageId: outcome.messageId ?? null,
            finishedAt: new Date(),
          },
        }),
        prisma.notification.update({
          where: { id: notification.id },
          data: { status: "sent" },
        }),
      ]);
      sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // 1m, 2m, 4m, 8m … capped by MAX_ATTEMPTS.
      const backoffMs = Math.min(2 ** (attempt - 1), 60) * 60_000;

      await prisma.$transaction([
        prisma.notificationDelivery.update({
          where: { id: delivery.id },
          data: {
            status: "failed",
            errorMessage: message.slice(0, 500),
            finishedAt: new Date(),
            nextRetryAt: new Date(Date.now() + backoffMs),
          },
        }),
        prisma.notification.update({
          where: { id: notification.id },
          data: { status: attempt >= MAX_ATTEMPTS ? "failed" : "pending" },
        }),
      ]);

      logger.warn("notification_delivery_failed", {
        organizationId: notification.organizationId,
        notificationId: notification.id,
        attempt,
        error: message,
      });
      failed += 1;
    }
  }

  return { processed: pending.length, sent, failed };
}
