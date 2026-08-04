import "server-only";

import { z } from "zod";

/**
 * Environment configuration.
 *
 * Parsed once, lazily, on first access from server code. Validation failures
 * surface as a single readable error instead of an `undefined` propagating
 * into a query string.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(43_200),
  SESSION_IDLE_DAYS: z.coerce.number().int().positive().default(7),

  PRODUCT_NAME: z.string().min(1).default("SalonFlow"),
  PRODUCT_SUPPORT_EMAIL: z.string().default("support@example.invalid"),
  APP_URL: z.string().default("http://localhost:3100"),

  DEFAULT_LOCALE: z.enum(["ja", "en", "zh_Hans", "zh_Hant", "ko"]).default("ja"),
  DEFAULT_TIMEZONE: z.string().default("Asia/Tokyo"),
  DEFAULT_CURRENCY: z.string().default("JPY"),

  // `console` and `file` do not send anything. Only `smtp` delivers for real.
  MAIL_TRANSPORT: z.enum(["console", "file", "smtp"]).default("console"),
  MAIL_FROM: z.string().default("SalonFlow <no-reply@example.invalid>"),
  MAIL_OUTBOX_DIR: z.string().default(".mailbox"),
  SMTP_HOST: z.string().default(""),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().default(""),
  SMTP_PASSWORD: z.string().default(""),

  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  STORAGE_LOCAL_DIR: z.string().default("storage"),
  STORAGE_SIGNED_URL_TTL: z.coerce.number().int().positive().default(300),

  JOB_DRIVER: z.enum(["inline", "bullmq"]).default("inline"),

  AUTH_MAX_FAILED_ATTEMPTS: z.coerce.number().int().positive().default(5),
  AUTH_LOCK_MINUTES: z.coerce.number().int().positive().default(15),
  RATE_LIMIT_PUBLIC_PER_MINUTE: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_AUTH_PER_MINUTE: z.coerce.number().int().positive().default(10),

  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  DEMO_MODE: z
    .string()
    .default("false")
    .transform((value) => value === "true"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment configuration.\n${issues}\n\nSee .env.example for the full list.`,
    );
  }

  cached = parsed.data;
  return cached;
}

/** Test helper: forget the parsed configuration so the next call re-reads it. */
export function resetEnvCache(): void {
  cached = null;
}
