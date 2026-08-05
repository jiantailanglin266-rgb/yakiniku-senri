/**
 * デモデータの基準時刻。
 *
 * 静的書き出し（GitHub Pages）でも「今日の試合」が今日として表示されるよう、
 * ビルド日の UTC 0時を基準にして各試合の開始時刻を組み立てます。
 *
 * next.config.ts で `NEXT_PUBLIC_SPORTS_REFERENCE_DAY` をビルド時に埋め込んでいます。
 * サーバー用・クライアント用のバンドルで同じ値になるよう「日」単位に丸めてあり、
 * ハイドレーション時に時刻がずれることはありません。
 */

const fallback = "2026-08-04T00:00:00.000Z";

export const referenceDayIso = process.env.NEXT_PUBLIC_SPORTS_REFERENCE_DAY || fallback;

export const referenceDay = new Date(referenceDayIso);

/** 基準日から days 日ずらし、hours:minutes（UTC）の時刻を ISO 文字列で返します */
export function at(days: number, hours: number, minutes = 0): string {
  const date = new Date(referenceDay);
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hours, minutes, 0, 0);
  return date.toISOString();
}

/** 基準日から minutes 分だけ進めた時刻（データ取得時刻の演出に使います） */
export function minutesAfterReference(minutes: number): string {
  return new Date(referenceDay.getTime() + minutes * 60_000).toISOString();
}

/** 「デモ上の現在時刻」。ライブ試合の経過時間などの計算に使います */
export const demoNowIso = minutesAfterReference(12 * 60 + 40);

/** 同じ日か（UTC 基準ではなく表示タイムゾーン非依存の粗い判定） */
export function isSameDayUtc(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}
