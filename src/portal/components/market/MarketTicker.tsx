"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPercent, formatPrice, priceDirection } from "@/portal/lib/format";
import { localePath } from "@/portal/i18n/config";
import type { CoinMarket } from "@/portal/lib/types";
import { withBasePath } from "@/lib/base-path";

export type TickerCoin = {
  id: string;
  slug: string;
  symbol: string;
  name: string;
  color: string;
};

/**
 * 相場ティッカー。
 *
 * ■ 継ぎ目のない横スクロール
 *   同じ内容を2組並べ、-50% まで動かして巻き戻します。
 *   1組だけだと末尾で空白が見えます。
 *   複製側は `aria-hidden` にして、読み上げが二重にならないようにします。
 *
 * ■ 更新
 *   既定ではサーバーが描いた値をそのまま表示します（＝JSでの再取得なし）。
 *   `NEXT_PUBLIC_MARKET_POLLING=true` のときだけ、サーバー側APIを
 *   定期的に叩いて更新し、変化した銘柄をフラッシュさせます。
 *   外部APIを直接叩くことはありません。
 */
export function MarketTicker({
  coins,
  markets: initialMarkets,
  locale,
  refreshIntervalSec,
  labels,
}: {
  coins: TickerCoin[];
  markets: CoinMarket[];
  locale: string;
  refreshIntervalSec: number;
  labels: { up: string; down: string; flat: string };
}) {
  const [markets, setMarkets] = useState(initialMarkets);
  const [flashes, setFlashes] = useState<Record<string, "up" | "down">>({});

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_MARKET_POLLING !== "true") return;

    const intervalMs = Math.max(15, refreshIntervalSec) * 1000;
    let cancelled = false;
    let flashTimer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      try {
        const response = await fetch(withBasePath("/api/market"), { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { coins?: CoinMarket[] };
        if (cancelled || !data.coins) return;
        const next = data.coins;

        // 値が届いたその場で差分を取り、変化した銘柄だけを光らせます。
        // 「markets を監視する effect」にすると、初回描画でも一度走ってしまいます。
        setMarkets((current) => {
          const before = new Map(current.map((entry) => [entry.id, entry.price]));
          const changed: Record<string, "up" | "down"> = {};
          for (const market of next) {
            const previous = before.get(market.id);
            if (previous !== undefined && previous !== market.price) {
              changed[market.id] = market.price > previous ? "up" : "down";
            }
          }
          if (Object.keys(changed).length > 0) {
            setFlashes(changed);
            clearTimeout(flashTimer);
            flashTimer = setTimeout(() => setFlashes({}), 900);
          }
          return next;
        });
      } catch {
        // 取得に失敗しても、直前の値を出したままにします。
        // ここでエラー表示に切り替えると、一時的な失敗で画面が壊れて見えます。
      }
    }

    const timer = setInterval(poll, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
      clearTimeout(flashTimer);
    };
  }, [refreshIntervalSec]);

  const marketById = new Map(markets.map((market) => [market.id, market]));
  const items = coins
    .map((coin) => ({ coin, market: marketById.get(coin.id) }))
    .filter((entry): entry is { coin: TickerCoin; market: CoinMarket } => Boolean(entry.market));

  if (items.length === 0) return null;

  function renderRow(duplicate: boolean) {
    return items.map(({ coin, market }) => {
      const direction = priceDirection(market.change24h);
      const flash = flashes[coin.id];
      return (
        <Link
          key={`${duplicate ? "dup" : "src"}-${coin.id}`}
          href={localePath(locale, `/coins/${coin.slug}`)}
          tabIndex={duplicate ? -1 : undefined}
          className={[
            "group flex shrink-0 items-center gap-2.5 border-r border-(--color-hairline) px-5 py-2.5 transition-colors hover:bg-white/4",
            flash === "up" ? "flash-up" : flash === "down" ? "flash-down" : "",
          ].join(" ")}
        >
          <span
            aria-hidden="true"
            className="size-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: coin.color, boxShadow: `0 0 8px ${coin.color}` }}
          />
          <span className="font-mono text-xs font-semibold tracking-wide">{coin.symbol}</span>
          <span className="tabular font-mono text-xs text-(--color-ink-soft)">
            {formatPrice(market.price, locale)}
          </span>
          <span
            className={[
              "tabular font-mono text-xs",
              direction === "up" ? "trend-up" : direction === "down" ? "trend-down" : "trend-flat",
            ].join(" ")}
          >
            <span aria-hidden="true">
              {direction === "up" ? "▲" : direction === "down" ? "▼" : "—"}
            </span>
            {formatPercent(market.change24h, locale)}
            <span className="sr-only"> {labels[direction]}</span>
          </span>
        </Link>
      );
    });
  }

  // 銘柄数に応じて速度を変えます。件数が増えても体感速度が一定になります
  const duration = Math.max(30, items.length * 4.5);

  return (
    <div
      className="glass-strong relative overflow-hidden border-x-0"
      style={{ ["--marquee-duration" as string]: `${duration}s` }}
    >
      <div className="marquee">
        <div className="flex">{renderRow(false)}</div>
        <div className="flex" aria-hidden="true">
          {renderRow(true)}
        </div>
      </div>
    </div>
  );
}
