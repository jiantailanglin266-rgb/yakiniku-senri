/**
 * 表示整形。
 *
 * 数値と日付は必ずここを通します。
 * 言語ごとに桁区切りや通貨記号が変わるため、コンポーネント側で `toLocaleString`
 * を直接呼ぶと表記が揺れます。
 */

import { getLocaleConfig } from "@/portal/i18n/config";
import type { LocalizedList, LocalizedText } from "./types";

/** 表示通貨。日本語圏は円、それ以外はドルを既定にします。 */
export function displayCurrency(locale: string): "JPY" | "USD" {
  return locale === "ja" ? "JPY" : "USD";
}

/**
 * 為替レート。
 * 実運用では市場データと同じ経路（サーバー側API）で取得します。
 * 未取得のあいだ推測値を出すと誤情報になるため、既定は 1（＝USD表示）です。
 */
export const USD_JPY = Number(process.env.NEXT_PUBLIC_USD_JPY ?? "0") || 0;

export function convertFromUsd(usd: number, currency: "JPY" | "USD"): number {
  if (currency === "USD" || USD_JPY <= 0) return usd;
  return usd * USD_JPY;
}

/** 為替レートが未設定なら、円表示に切り替えず素直にドルで出します */
export function effectiveCurrency(locale: string): "JPY" | "USD" {
  const preferred = displayCurrency(locale);
  return preferred === "JPY" && USD_JPY <= 0 ? "USD" : preferred;
}

export function formatPrice(usd: number, locale: string): string {
  const currency = effectiveCurrency(locale);
  const value = convertFromUsd(usd, currency);
  const { intl } = getLocaleConfig(locale);
  // 単価が小さいコインは有効数字を確保します（0.00 と潰れないように）
  const fractionDigits =
    value >= 1000 ? 0 : value >= 1 ? 2 : value >= 0.01 ? 4 : value >= 0.0001 ? 6 : 8;
  return new Intl.NumberFormat(intl, {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "JPY" && value >= 1000 ? 0 : fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/** 時価総額・出来高のような大きい数を、桁を落とさず読める形にします */
export function formatCompact(usd: number, locale: string): string {
  const currency = effectiveCurrency(locale);
  const value = convertFromUsd(usd, currency);
  const { intl } = getLocaleConfig(locale);
  return new Intl.NumberFormat(intl, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number, locale: string, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat(getLocaleConfig(locale).intl, { maximumFractionDigits }).format(
    value,
  );
}

export function formatCompactNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(getLocaleConfig(locale).intl, {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number, locale: string): string {
  const formatted = new Intl.NumberFormat(getLocaleConfig(locale).intl, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: "exceptZero",
  }).format(value);
  return `${formatted}%`;
}

export function priceDirection(value: number): "up" | "down" | "flat" {
  if (value > 0.005) return "up";
  if (value < -0.005) return "down";
  return "flat";
}

export function formatDate(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(getLocaleConfig(locale).intl, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(getLocaleConfig(locale).intl, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date);
}

/** 動画の長さ（秒 → m:ss / h:mm:ss） */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = hours > 0 ? String(minutes).padStart(2, "0") : String(minutes);
  return hours > 0
    ? `${hours}:${mm}:${String(seconds).padStart(2, "0")}`
    : `${mm}:${String(seconds).padStart(2, "0")}`;
}

/**
 * 言語別テキストの取り出し。
 * その言語 → 英語 → 日本語 の順にフォールバックします。
 */
export function t(text: LocalizedText | undefined, locale: string): string {
  if (!text) return "";
  return text[locale] ?? text.en ?? text.ja ?? "";
}

export function tList(list: LocalizedList | undefined, locale: string): string[] {
  if (!list) return [];
  return list[locale] ?? list.en ?? list.ja ?? [];
}

/**
 * ナビゲーション項目の表示名。
 *
 * `dictKey`（例: `nav.news`）があれば13言語ぶんの辞書を引き、
 * 無ければ `label`（ja / en のみ）に落とします。
 * 固有名詞（Bitcoin など）には `dictKey` を付けないため、そのまま出ます。
 */
export function navLabel(
  item: { label: LocalizedText; dictKey?: string },
  locale: string,
  dict: unknown,
): string {
  if (item.dictKey) {
    const [group, key] = item.dictKey.split(".");
    const groups = dict as Record<string, Record<string, unknown>> | undefined;
    const value = groups?.[group]?.[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return t(item.label, locale);
}
