import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { NotificationChannel } from "@prisma/client";

import { env } from "@/config/env";
import { logger } from "@/server/observability/logger";

/**
 * Notification transports.
 *
 * PLACEHOLDER BOUNDARY — read this before deploying.
 *
 * The `console` and `file` transports do NOT send anything. They write the
 * message where a developer can read it. That is deliberate: this project
 * must never appear to be integrated with a real messaging provider it has no
 * contract with.
 *
 * Enabling real delivery requires a contracted provider, its credentials in
 * the environment, and an adapter implemented against that provider's public,
 * documented API.
 *
 * SMS, LINE and Web Push are not implemented in Phase 1. Their entries exist
 * so the shape of the interface is fixed, and they fail loudly rather than
 * pretending to succeed.
 */

export interface OutgoingMessage {
  channel: NotificationChannel;
  recipient: string;
  subject: string | null;
  body: string;
}

export interface DeliveryOutcome {
  provider: string;
  messageId?: string;
}

export class TransportNotConfiguredError extends Error {
  constructor(channel: string) {
    super(`${channel} 通知は未実装です。正式な事業者契約と専用アダプタの実装が必要です。`);
    this.name = "TransportNotConfiguredError";
  }
}

export async function sendViaChannel(message: OutgoingMessage): Promise<DeliveryOutcome> {
  switch (message.channel) {
    case "email":
      return sendEmail(message);
    case "in_app":
      // In-app notifications are the Notification row itself; nothing to send.
      return { provider: "in_app" };
    case "sms":
    case "line":
    case "web_push":
      throw new TransportNotConfiguredError(message.channel);
    default:
      throw new TransportNotConfiguredError(String(message.channel));
  }
}

async function sendEmail(message: OutgoingMessage): Promise<DeliveryOutcome> {
  const transport = env().MAIL_TRANSPORT;

  if (transport === "console") {
    logger.info("mail_console_transport", {
      to: message.recipient,
      subject: message.subject,
      preview: message.body.slice(0, 200),
      notice: "DEV TRANSPORT — no mail was actually sent",
    });
    return { provider: "console", messageId: randomUUID() };
  }

  if (transport === "file") {
    const directory = path.resolve(process.cwd(), env().MAIL_OUTBOX_DIR);
    await mkdir(directory, { recursive: true });

    const messageId = randomUUID();
    const filename = `${new Date().toISOString().replace(/[:.]/g, "-")}-${messageId}.txt`;
    const content = [
      `To: ${message.recipient}`,
      `From: ${process.env.MAIL_FROM ?? "no-reply@example.invalid"}`,
      `Subject: ${message.subject ?? ""}`,
      "X-SalonFlow-Notice: development transport, not delivered to a real mailbox",
      "",
      message.body,
    ].join("\n");

    await writeFile(path.join(directory, filename), content, "utf8");
    return { provider: "file", messageId };
  }

  // transport === "smtp"
  throw new TransportNotConfiguredError(
    "SMTP transport is selected but no SMTP client is bundled in Phase 1. " +
      "Add a mail client dependency and implement the adapter before enabling it.",
  );
}
