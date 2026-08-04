"use client";

import { formatDate, formatDateTime, formatTime } from "../../lib/format";
import { useTimeZone } from "../../lib/client-hooks";

type Props = {
  iso: string;
  locale: string;
  /** 表示形式 */
  kind?: "datetime" | "time" | "date";
  className?: string;
};

/**
 * 閲覧者のタイムゾーンで時刻を表示します。
 *
 * サーバー側ではロケール既定のタイムゾーンで描画し、
 * ハイドレーション後に端末のタイムゾーンへ切り替えます。
 * サーバーとクライアントで同じ文字列を出せない以上どちらかに寄せるしかないため、
 * 「まず読める時刻を出し、開いた直後に自分の時刻へ揃う」方式を選んでいます。
 * （空欄にしてから埋める方式だと、レイアウトが揺れて読み取りづらくなります）
 */
export function LocalTime({ iso, locale, kind = "datetime", className }: Props) {
  const timeZone = useTimeZone();
  const format = kind === "time" ? formatTime : kind === "date" ? formatDate : formatDateTime;

  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {format(iso, locale, timeZone)}
    </time>
  );
}
