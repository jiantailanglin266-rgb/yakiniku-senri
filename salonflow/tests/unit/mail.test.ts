import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  deliversForReal,
  mailConfigFromEnv,
  resetMailTransporter,
  sendMail,
  smtpSecurity,
  verifyMail,
  type MailConfig,
} from "@/server/notifications/mail";

/**
 * Mail configuration and dispatch.
 *
 * The SMTP wire protocol itself is nodemailer's responsibility. What is tested
 * here is what this codebase decides: which transports actually deliver, how
 * TLS is chosen from the port, and that the non-delivering transports really
 * do not deliver — that last one is a safety property, not a nicety.
 */

function config(overrides: Partial<MailConfig> = {}): MailConfig {
  return {
    transport: "console",
    from: "SalonFlow <no-reply@example.invalid>",
    outboxDir: ".mailbox",
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    ...overrides,
  };
}

beforeEach(() => {
  resetMailTransporter();
});

describe("deliversForReal", () => {
  it("is true only for smtp", () => {
    expect(deliversForReal(config({ transport: "smtp" }))).toBe(true);
    expect(deliversForReal(config({ transport: "console" }))).toBe(false);
    expect(deliversForReal(config({ transport: "file" }))).toBe(false);
  });
});

describe("smtpSecurity", () => {
  it("uses implicit TLS on 465", () => {
    expect(smtpSecurity(465)).toEqual({ secure: true, requireTLS: false });
  });

  it("requires STARTTLS on submission and plain ports", () => {
    // `requireTLS` rather than opportunistic: an upgrade that can be stripped
    // would send credentials in the clear.
    expect(smtpSecurity(587)).toEqual({ secure: false, requireTLS: true });
    expect(smtpSecurity(25)).toEqual({ secure: false, requireTLS: true });
    expect(smtpSecurity(2525)).toEqual({ secure: false, requireTLS: true });
  });
});

describe("mailConfigFromEnv", () => {
  it("defaults to the non-delivering transport", () => {
    // A fresh checkout must not be able to mail a real customer.
    expect(mailConfigFromEnv({}).transport).toBe("console");
  });

  it("falls back to console for an unknown transport name", () => {
    expect(mailConfigFromEnv({ MAIL_TRANSPORT: "sendgrid" }).transport).toBe("console");
  });

  it("reads smtp settings", () => {
    const parsed = mailConfigFromEnv({
      MAIL_TRANSPORT: "smtp",
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "465",
      SMTP_USER: "apikey",
      SMTP_PASSWORD: "secret",
      MAIL_FROM: "Salon <no-reply@example.com>",
    });

    expect(parsed).toMatchObject({
      transport: "smtp",
      smtpHost: "smtp.example.com",
      smtpPort: 465,
      smtpUser: "apikey",
      from: "Salon <no-reply@example.com>",
    });
  });

  it("falls back to 587 for a malformed port", () => {
    expect(mailConfigFromEnv({ SMTP_PORT: "not-a-number" }).smtpPort).toBe(587);
    expect(mailConfigFromEnv({ SMTP_PORT: "-1" }).smtpPort).toBe(587);
  });
});

describe("console transport", () => {
  it("writes to the log and does not throw", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    const outcome = await sendMail(config({ transport: "console" }), {
      recipient: "someone@example.invalid",
      subject: "件名",
      body: "本文",
    });

    expect(outcome.provider).toBe("console");
    expect(spy).toHaveBeenCalledOnce();

    // The log line must say plainly that nothing was sent.
    const logged = String(spy.mock.calls[0]?.[0]);
    expect(logged).toContain("実際には送信されていません");

    spy.mockRestore();
  });
});

describe("file transport", () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(path.join(tmpdir(), "salonflow-mail-"));
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it("writes the message to a file with the delivery notice", async () => {
    const outcome = await sendMail(config({ transport: "file", outboxDir: directory }), {
      recipient: "hanako@example.invalid",
      subject: "【デモサロン】ご予約が確定しました",
      body: "予約番号: A-20260807-ABCDEF",
    });

    expect(outcome.provider).toBe("file");

    const files = await readdir(directory);
    expect(files).toHaveLength(1);

    const content = await readFile(path.join(directory, files[0]!), "utf8");
    expect(content).toContain("To: hanako@example.invalid");
    expect(content).toContain("ご予約が確定しました");
    expect(content).toContain("A-20260807-ABCDEF");
    expect(content).toContain("not delivered to a real mailbox");
  });
});

describe("verifyMail", () => {
  it("reports the non-delivering transports as configured but not delivering", async () => {
    const result = await verifyMail(config({ transport: "console" }));
    expect(result).toEqual({ ok: true, transport: "console", delivers: false });
  });

  it("fails when smtp is selected without a host", async () => {
    const result = await verifyMail(config({ transport: "smtp", smtpHost: "" }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("SMTP_HOST");
    }
  });
});
