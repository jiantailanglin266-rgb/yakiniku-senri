"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { href } from "../../lib/url";
import { formatRefreshInterval, formatDateTime } from "../../lib/format";
import { getDictionary } from "../../i18n";

export type TickerItem = {
  id: string;
  slug: string;
  status: string;
  clock: string | null;
  league: string;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  accent: string;
  fetchedAt: string;
  refreshIntervalSec: number;
};

type LivePayload = {
  source: string;
  generatedAt: string | null;
  matches: {
    id: string;
    homeScore: number | null;
    awayScore: number | null;
    clock: string | null;
    status: string;
    fetchedAt: string;
  }[];
};

/**
 * ライブスコアの横スクロールティッカー。
 *
 * ■ 更新の実装
 *   サーバー側のエンドポイント（/api/sports/live）を一定間隔で取得し、
 *   前回と得点が変わった試合だけをフラッシュさせます。
 *   「表示上の更新間隔」と「実際のポーリング間隔」は必ず同じ値を使います。
 *   （見かけだけ速い数字を出すと、古い情報を新しいものとして見せることになります）
 *
 * ■ 取得に失敗したとき
 *   古い値をそのまま「最新」として出さず、最終更新時刻を据え置いたうえで
 *   「更新できていない」ことが分かる表示に切り替えます。
 */
export function LiveTicker({
  items,
  locale,
  basePath = "",
}: {
  items: TickerItem[];
  locale: string;
  basePath?: string;
}) {
  const dict = getDictionary(locale);
  const [scores, setScores] = useState(items);
  const [stale, setStale] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(items[0]?.fetchedAt ?? "");
  /** 直前の取得で得点が変わった試合。フラッシュ演出の対象です */
  const [flashed, setFlashed] = useState<string[]>([]);

  const interval = items[0]?.refreshIntervalSec ?? 30;

  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const response = await fetch(`${basePath}/api/sports/live`, { cache: "no-store" });
        if (!response.ok) throw new Error(String(response.status));
        const payload = (await response.json()) as LivePayload;
        if (cancelled) return;

        const changed = new Set<string>();
        setScores((previous) =>
          previous.map((item) => {
            const next = payload.matches.find((match) => match.id === item.id);
            if (!next) return item;
            if (next.homeScore !== item.homeScore || next.awayScore !== item.awayScore) {
              changed.add(item.id);
            }
            return {
              ...item,
              homeScore: next.homeScore,
              awayScore: next.awayScore,
              clock: next.clock,
              status: next.status,
            };
          }),
        );
        setFlashed(Array.from(changed));
        setStale(false);
        if (payload.generatedAt) setUpdatedAt(payload.generatedAt);
      } catch {
        // 失敗時は前回の値を保持したまま「更新できていない」ことを示します
        if (!cancelled) setStale(true);
      }
    };

    const timer = setInterval(poll, Math.max(interval, 10) * 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [items, interval, basePath]);

  if (items.length === 0) {
    return (
      <div className="sp-solid text-ink-dim px-5 py-4 text-sm" role="status">
        {dict.noMatchesToday}
      </div>
    );
  }

  // マーキーは同じ内容を2組並べて途切れなく流します
  const strip = [...scores, ...scores];

  return (
    <div className="relative">
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="sp-eyebrow text-live flex items-center gap-1.5">
          <span
            className="sp-anim-live bg-live inline-block size-1.5 rounded-full"
            aria-hidden="true"
          />
          {dict.liveNow}
        </span>
        <span className="sp-mono text-ink-faint text-[0.6875rem]">
          {dict.refreshInterval}: {formatRefreshInterval(interval, locale)}
        </span>
        {updatedAt ? (
          <span className="sp-mono text-ink-faint text-[0.6875rem]" suppressHydrationWarning>
            {dict.lastUpdated}: {formatDateTime(updatedAt, locale)}
          </span>
        ) : null}
        {stale ? (
          <span className="sp-mono text-caution text-[0.6875rem]" role="status">
            {locale === "ja"
              ? "更新できていません（表示は前回取得時点）"
              : "Update failed — showing the previous fetch"}
          </span>
        ) : null}
      </div>

      <div
        className="sp-solid group relative overflow-hidden py-2"
        // 読みたいときに止められるようにします
        aria-label={dict.sectionLiveTicker}
      >
        <div className="sp-anim-marquee flex w-max gap-2 group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused]">
          {strip.map((item, index) => (
            <Link
              key={`${item.id}-${index}`}
              href={href(locale, `/matches/${item.slug}`)}
              className={`border-edge hover:border-cyan/60 flex shrink-0 items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                flashed.includes(item.id) ? "sp-anim-flash" : ""
              }`}
            >
              <span
                className="sp-mono text-[0.625rem] tracking-wider uppercase"
                style={{ color: item.accent }}
              >
                {item.league}
              </span>
              <span className="text-ink text-sm whitespace-nowrap">{item.home}</span>
              <span className="sp-mono text-ink text-base font-bold" data-score>
                {item.homeScore ?? "-"}
                <span className="text-ink-faint mx-1">:</span>
                {item.awayScore ?? "-"}
              </span>
              <span className="text-ink text-sm whitespace-nowrap">{item.away}</span>
              {item.clock ? (
                <span className="sp-mono text-live text-[0.625rem]" data-clock>
                  {item.clock}
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
