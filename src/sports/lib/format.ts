/**
 * 日時・数値の整形。
 *
 * ■ サーバー側ではロケール既定のタイムゾーンで描画し、
 *   クライアント側で利用者の端末タイムゾーンへ切り替えます（components/ui/LocalTime.tsx）。
 *   サーバーとクライアントで同じ文字列を出せない以上、片方に寄せるしかないため、
 *   「まず読める時刻を出し、開いた直後に自分の時刻へ揃う」方式を選んでいます。
 * ■ Intl は環境差が出るため、必ずタイムゾーンを明示して呼び出します。
 */
import { getLocale } from "../i18n/locales";

export function formatDateTime(iso: string, localeCode: string, timeZone?: string): string {
  const locale = getLocale(localeCode);
  try {
    return new Intl.DateTimeFormat(locale.intl, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timeZone ?? locale.timeZone,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatTime(iso: string, localeCode: string, timeZone?: string): string {
  const locale = getLocale(localeCode);
  try {
    return new Intl.DateTimeFormat(locale.intl, {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timeZone ?? locale.timeZone,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatDate(iso: string, localeCode: string, timeZone?: string): string {
  const locale = getLocale(localeCode);
  try {
    return new Intl.DateTimeFormat(locale.intl, {
      dateStyle: "medium",
      timeZone: timeZone ?? locale.timeZone,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** 「10秒更新」「5分更新」のような表示。0 は静的データ。 */
export function formatRefreshInterval(seconds: number, localeCode: string): string {
  if (seconds <= 0) return localeCode === "ja" ? "自動更新なし" : "No auto refresh";
  if (seconds < 60) {
    return localeCode === "ja" ? `${seconds}秒更新` : `Every ${seconds}s`;
  }
  const minutes = Math.round(seconds / 60);
  return localeCode === "ja" ? `${minutes}分更新` : `Every ${minutes} min`;
}

export function formatNumber(value: number, localeCode: string): string {
  const locale = getLocale(localeCode);
  try {
    return new Intl.NumberFormat(locale.intl).format(value);
  } catch {
    return String(value);
  }
}

/** 日本円の表示。0 は「無料」と読み替えます。 */
export function formatPriceJpy(value: number | undefined, localeCode: string): string {
  if (value === undefined) return "—";
  if (value === 0) return localeCode === "ja" ? "無料" : "Free";
  try {
    return new Intl.NumberFormat(getLocale(localeCode).intl, {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `¥${value}`;
  }
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

/** 順位変動の表示（+2 / -1 / —） */
export function formatChange(change: number): string {
  if (change === 0) return "—";
  return change > 0 ? `+${change}` : String(change);
}
