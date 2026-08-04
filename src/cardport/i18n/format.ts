/**
 * 数値・通貨・日付のローカライズ。
 *
 * 金額は日本発行のカードの実額なので、必ず円建てで表示します。
 * 言語だけを切り替えて通貨額を勝手に換算すると、実際の請求額と食い違い、
 * 「いくら払うのか」を誤認させるためです（換算値は補助表示にとどめます）。
 */
import { getLocaleDefinition, type Locale } from "./locales";

export function formatNumber(value: number, locale: Locale, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(getLocaleDefinition(locale).intl, options).format(value);
}

/** 円建て金額。0 は「無料」として扱わず、呼び出し側で判定します */
export function formatYen(value: number, locale: Locale): string {
  return new Intl.NumberFormat(getLocaleDefinition(locale).intl, {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number, locale: Locale, digits = 2): string {
  return new Intl.NumberFormat(getLocaleDefinition(locale).intl, {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value / 100);
}

/** ISO 8601（YYYY-MM-DD）を言語別の表記に変換します */
export function formatDate(iso: string, locale: Locale): string {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(getLocaleDefinition(locale).intl, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** 年会費の表示（0円は「無料」表記へ） */
export function formatAnnualFee(value: number, locale: Locale, freeLabel: string): string {
  return value === 0 ? freeLabel : formatYen(value, locale);
}
