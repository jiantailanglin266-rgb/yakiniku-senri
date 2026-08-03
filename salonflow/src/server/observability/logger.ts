import "server-only";

/**
 * Structured logging.
 *
 * Emits one JSON object per line so a log shipper can index it without
 * regex parsing. Deliberately tiny: swapping in pino or OpenTelemetry later
 * only requires replacing this module.
 */

type Level = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function threshold(): number {
  const configured = (process.env.LOG_LEVEL ?? "info") as Level;
  return LEVEL_ORDER[configured] ?? LEVEL_ORDER.info;
}

export interface LogFields {
  requestId?: string;
  organizationId?: string;
  storeId?: string;
  userId?: string;
  [key: string]: unknown;
}

function emit(level: Level, message: string, fields: LogFields = {}): void {
  if (LEVEL_ORDER[level] < threshold()) return;

  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...redactFields(fields),
  };

  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, fields?: LogFields) => emit("debug", message, fields),
  info: (message: string, fields?: LogFields) => emit("info", message, fields),
  warn: (message: string, fields?: LogFields) => emit("warn", message, fields),
  error: (message: string, fields?: LogFields) => emit("error", message, fields),
};

/**
 * Never let a secret reach the log stream, even if a caller passes a whole
 * request body by mistake.
 */
const SECRET_KEY_PATTERN =
  /pass(word)?|secret|token|api[-_]?key|authorization|cookie|card|cvv|pan|signature/i;

function redactFields(fields: LogFields): LogFields {
  const result: LogFields = {};
  for (const [key, value] of Object.entries(fields)) {
    result[key] = SECRET_KEY_PATTERN.test(key) ? "[redacted]" : value;
  }
  return result;
}
