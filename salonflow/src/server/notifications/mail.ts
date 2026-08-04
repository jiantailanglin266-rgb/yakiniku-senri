import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Email delivery.
 *
 * Configuration is passed in rather than read from a global. Two reasons:
 * the CLI check (`npm run mail:check`) runs outside the React Server
 * Components boundary where `src/config/env.ts` cannot be imported, and an
 * explicit config makes the port/TLS logic unit-testable without setting
 * environment variables.
 *
 * `src/server/notifications/transports.ts` is the server-only wrapper that
 * supplies the config from the environment.
 */

export type MailTransportKind = "console" | "file" | "smtp";

export interface MailConfig {
  transport: MailTransportKind;
  from: string;
  /** Only used by the `file` transport. */
  outboxDir: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
}

export interface MailMessage {
  recipient: string;
  subject: string | null;
  body: string;
}

export interface MailOutcome {
  provider: string;
  messageId?: string;
}

export class MailNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MailNotConfiguredError";
  }
}

/**
 * Does this configuration deliver to real mailboxes?
 *
 * Used to warn an operator whose salon is live but whose reminders are going
 * to a log file.
 */
export function deliversForReal(config: MailConfig): boolean {
  return config.transport === "smtp";
}

/**
 * Port 465 is implicit TLS ("SMTPS"). 587 and 25 begin in plaintext and
 * upgrade through STARTTLS, which must be *required* rather than merely
 * attempted — an opportunistic upgrade can be stripped, sending credentials
 * in the clear.
 */
export function smtpSecurity(port: number): { secure: boolean; requireTLS: boolean } {
  return port === 465 ? { secure: true, requireTLS: false } : { secure: false, requireTLS: true };
}

let cachedTransporter: Transporter | null = null;
let cachedKey = "";

function getTransporter(config: MailConfig): Transporter {
  if (!config.smtpHost) {
    throw new MailNotConfiguredError("MAIL_TRANSPORT=smtp ですが SMTP_HOST が未設定です");
  }

  // Reuse the pooled transporter across messages: providers rate-limit
  // connection churn harder than they rate-limit messages.
  const key = `${config.smtpHost}:${config.smtpPort}:${config.smtpUser}`;
  if (cachedTransporter && cachedKey === key) return cachedTransporter;

  const { secure, requireTLS } = smtpSecurity(config.smtpPort);

  cachedTransporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure,
    requireTLS,
    auth: config.smtpUser
      ? { user: config.smtpUser, pass: config.smtpPassword }
      : undefined,
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
  });
  cachedKey = key;

  return cachedTransporter;
}

export async function sendMail(
  config: MailConfig,
  message: MailMessage,
): Promise<MailOutcome> {
  switch (config.transport) {
    case "console":
      return sendToConsole(message);
    case "file":
      return sendToFile(config, message);
    case "smtp":
      return sendOverSmtp(config, message);
    default:
      throw new MailNotConfiguredError(`未知のトランスポート: ${String(config.transport)}`);
  }
}

function sendToConsole(message: MailMessage): MailOutcome {
  const messageId = randomUUID();
  console.log(
    JSON.stringify({
      transport: "console",
      notice: "DEV TRANSPORT — メールは実際には送信されていません",
      to: message.recipient,
      subject: message.subject,
      preview: message.body.slice(0, 200),
      messageId,
    }),
  );
  return { provider: "console", messageId };
}

async function sendToFile(config: MailConfig, message: MailMessage): Promise<MailOutcome> {
  const directory = path.resolve(process.cwd(), config.outboxDir);
  await mkdir(directory, { recursive: true });

  const messageId = randomUUID();
  const filename = `${new Date().toISOString().replace(/[:.]/g, "-")}-${messageId}.txt`;
  const content = [
    `To: ${message.recipient}`,
    `From: ${config.from}`,
    `Subject: ${message.subject ?? ""}`,
    "X-SalonFlow-Notice: development transport, not delivered to a real mailbox",
    "",
    message.body,
  ].join("\n");

  await writeFile(path.join(directory, filename), content, "utf8");
  return { provider: "file", messageId };
}

async function sendOverSmtp(config: MailConfig, message: MailMessage): Promise<MailOutcome> {
  const result = await getTransporter(config).sendMail({
    from: config.from,
    to: message.recipient,
    subject: message.subject ?? "",
    text: message.body,
  });

  // A server can accept a message for some recipients and reject others.
  // Treating partial acceptance as success would mark the outbox row sent for
  // someone who never received anything.
  if (result.rejected.length > 0) {
    throw new Error(`SMTP はこの宛先を拒否しました: ${result.rejected.map(String).join(", ")}`);
  }

  return { provider: "smtp", messageId: result.messageId };
}

export type MailVerifyResult =
  | { ok: true; transport: MailTransportKind; delivers: boolean }
  | { ok: false; transport: MailTransportKind; error: string };

/** Check the settings without sending anything. */
export async function verifyMail(config: MailConfig): Promise<MailVerifyResult> {
  if (config.transport !== "smtp") {
    return { ok: true, transport: config.transport, delivers: false };
  }

  try {
    await getTransporter(config).verify();
    return { ok: true, transport: "smtp", delivers: true };
  } catch (error) {
    return {
      ok: false,
      transport: "smtp",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Build a config from a plain environment object.
 *
 * Typed as a loose record rather than `NodeJS.ProcessEnv`: Next.js augments
 * that type with a required `NODE_ENV`, which would force every caller —
 * including tests that only care about two SMTP keys — to supply it.
 */
export function mailConfigFromEnv(
  source: Readonly<Record<string, string | undefined>> = process.env,
): MailConfig {
  const transport = source.MAIL_TRANSPORT;
  const port = Number(source.SMTP_PORT ?? 587);

  return {
    transport:
      transport === "smtp" || transport === "file" ? transport : "console",
    from: source.MAIL_FROM ?? "SalonFlow <no-reply@example.invalid>",
    outboxDir: source.MAIL_OUTBOX_DIR ?? ".mailbox",
    smtpHost: source.SMTP_HOST ?? "",
    smtpPort: Number.isFinite(port) && port > 0 ? port : 587,
    smtpUser: source.SMTP_USER ?? "",
    smtpPassword: source.SMTP_PASSWORD ?? "",
  };
}

/** Test helper — drops the pooled transporter. */
export function resetMailTransporter(): void {
  cachedTransporter = null;
  cachedKey = "";
}
