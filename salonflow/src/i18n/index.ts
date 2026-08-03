import adminEn from "~/messages/admin/en.json";
import adminJa from "~/messages/admin/ja.json";
import bookingEn from "~/messages/booking/en.json";
import bookingJa from "~/messages/booking/ja.json";

/**
 * Localisation.
 *
 * Admin and booking dictionaries are kept separate, as the spec requires: the
 * two surfaces have different audiences and different translators, and a
 * booking page should never ship the admin vocabulary to a customer's browser.
 *
 * Deliberately small. The public API (`getTranslator`, `t("a.b")`) matches
 * next-intl's shape, so migrating to it later is a swap of this file rather
 * than a rewrite of every component (ADR-0005).
 */

export const LOCALES = ["ja", "en", "zh_Hans", "zh_Hant", "ko"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ja";

export type Namespace = "admin" | "booking";

type Dictionary = Record<string, unknown>;

const DICTIONARIES: Record<Namespace, Partial<Record<Locale, Dictionary>>> = {
  admin: { ja: adminJa, en: adminEn },
  booking: { ja: bookingJa, en: bookingEn },
};

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

export function resolveLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/**
 * Read a dotted key out of a dictionary.
 * Returns undefined rather than throwing so the caller can fall back.
 */
function lookup(dictionary: Dictionary | undefined, key: string): string | undefined {
  if (!dictionary) return undefined;

  let current: unknown = dictionary;
  for (const part of key.split(".")) {
    if (typeof current !== "object" || current === null) return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === "string" ? current : undefined;
}

export type Translator = (key: string, values?: Record<string, string | number>) => string;

/**
 * Build a translator for a namespace and locale.
 *
 * Missing keys resolve through the default locale and, failing that, render as
 * the key itself. A visible `booking.step.confirm` in the UI is a bug report;
 * a blank space is a mystery.
 */
export function getTranslator(namespace: Namespace, locale: Locale): Translator {
  const primary = DICTIONARIES[namespace][locale];
  const fallback = DICTIONARIES[namespace][DEFAULT_LOCALE];

  return (key, values) => {
    const template = lookup(primary, key) ?? lookup(fallback, key) ?? key;
    if (!values) return template;

    return template.replace(/\{(\w+)\}/g, (match, name: string) => {
      const value = values[name];
      return value === undefined ? match : String(value);
    });
  };
}

/** Locale tag suitable for `Intl` APIs. */
export function intlLocale(locale: Locale): string {
  switch (locale) {
    case "ja":
      return "ja-JP";
    case "en":
      return "en-US";
    case "zh_Hans":
      return "zh-Hans-CN";
    case "zh_Hant":
      return "zh-Hant-TW";
    case "ko":
      return "ko-KR";
    default:
      return "ja-JP";
  }
}

export const LOCALE_LABELS: Record<Locale, string> = {
  ja: "日本語",
  en: "English",
  zh_Hans: "简体中文",
  zh_Hant: "繁體中文",
  ko: "한국어",
};
