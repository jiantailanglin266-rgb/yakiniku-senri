import "server-only";

import type { NotificationChannel } from "@prisma/client";

import { env } from "@/config/env";
import {
  MailNotConfiguredError,
  deliversForReal,
  mailConfigFromEnv,
  sendMail,
  verifyMail,
  type MailConfig,
  type MailVerifyResult,
} from "./mail";

/**
 * Notification transports.
 *
 * Email delivery itself lives in `./mail.ts`, which takes its configuration
 * as an argument so the CLI check can use it outside the server boundary.
 * This module is the server-side entry point: it supplies the configuration
 * from the validated environment and routes by channel.
 *
 * Email transports:
 *   - `console` / `file` send NOTHING. They write the message where a
 *     developer can read it. These are the defaults, so a fresh checkout
 *     cannot accidentally mail a real person.
 *   - `smtp` delivers for real, using the operator's own contracted provider.
 *
 * SMS, LINE and Web Push are not implemented. Their entries exist so the
 * shape of the interface is fixed, and they fail loudly rather than
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

function currentMailConfig(): MailConfig {
  const config = env();
  return {
    transport: config.MAIL_TRANSPORT,
    from: config.MAIL_FROM,
    outboxDir: config.MAIL_OUTBOX_DIR,
    smtpHost: config.SMTP_HOST,
    smtpPort: config.SMTP_PORT,
    smtpUser: config.SMTP_USER,
    smtpPassword: config.SMTP_PASSWORD,
  };
}

export async function sendViaChannel(message: OutgoingMessage): Promise<DeliveryOutcome> {
  switch (message.channel) {
    case "email":
      try {
        return await sendMail(currentMailConfig(), {
          recipient: message.recipient,
          subject: message.subject,
          body: message.body,
        });
      } catch (error) {
        // Surface a misconfiguration as a transport problem, so the outbox
        // records a delivery failure rather than crashing the dispatcher.
        if (error instanceof MailNotConfiguredError) {
          throw new TransportNotConfiguredError(`email (${error.message})`);
        }
        throw error;
      }

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

/** Whether the current configuration actually reaches customers' mailboxes. */
export function mailDeliversForReal(): boolean {
  return deliversForReal(currentMailConfig());
}

/** Verify the mail settings without sending. */
export async function verifyMailTransport(): Promise<MailVerifyResult> {
  return verifyMail(currentMailConfig());
}

export { mailConfigFromEnv };
