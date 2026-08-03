import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names, letting later classes win over earlier ones. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Stable, URL-safe slug from arbitrary text. Falls back to a random suffix. */
export function slugify(value: string): string {
  const base = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base.length > 0 ? base : `s${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Escape a value destined for a CSV cell.
 *
 * Beyond quoting, a leading `=`, `+`, `-`, `@`, tab or CR is prefixed with a
 * single quote. Without this, a customer whose "name" is `=cmd|'/c calc'!A1`
 * becomes a formula the moment a staff member opens the export in Excel.
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text = String(value);

  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(rows: readonly (readonly unknown[])[]): string {
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
}

/** Mask all but the last `visible` characters. */
export function maskTail(value: string | null | undefined, visible = 2): string | null {
  if (!value) return null;
  if (value.length <= visible) return "*".repeat(value.length);
  return `${"*".repeat(value.length - visible)}${value.slice(-visible)}`;
}

/** Mask an email as `a***@example.com`. */
export function maskEmail(value: string | null | undefined): string | null {
  if (!value) return null;
  const at = value.indexOf("@");
  if (at <= 0) return "***";
  const local = value.slice(0, at);
  const domain = value.slice(at);
  const head = local.slice(0, 1);
  return `${head}${"*".repeat(Math.max(2, local.length - 1))}${domain}`;
}

/** Group an array by a derived key, preserving insertion order. */
export function groupBy<T, K extends string | number>(
  items: readonly T[],
  keyOf: (item: T) => K,
): Map<K, T[]> {
  const result = new Map<K, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const bucket = result.get(key);
    if (bucket) bucket.push(item);
    else result.set(key, [item]);
  }
  return result;
}
