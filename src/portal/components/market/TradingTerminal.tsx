"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CandleChart } from "./CandleChart";
import { OrderBookPanel, TradeTape } from "./OrderBookPanel";
import { cx } from "@/portal/components/ui/primitives";
import { t } from "@/portal/lib/format";
import {
  fetchCandles,
  INTERVALS,
  mergeCandle,
  subscribeTrading,
  symbolFor,
  TRADING_VENUE,
  type Candle,
  type ConnectionState,
  type Interval,
  type OrderBook,
  type Trade,
} from "@/portal/lib/live-trading";
import type { Dictionary } from "@/portal/i18n/dictionaries";
import type { Coin } from "@/portal/lib/types";

/**
 * ローソク足・板情報・約定をまとめた取引画面。
 *
 * ■ ここが「リアルタイム」です
 *   WebSocket で接続したまま受け取るので、板と約定は届いた瞬間に更新されます。
 *   同じページにある `LiveChart`（CoinGecko・約60秒間隔）とは別系統です。
 *   更新の速さが違うので、どちらの数字なのかが分かるよう見出しを分けています。
 *
 * ■ 出どころを隠しません
 *   板は取引所ごとに別物で、価格は USDT 建てです。
 *   取引所名・通貨ペア・建て通貨を必ず画面に出します。
 *
 * ■ つながらないときに数字を作りません
 *   Binance は国・地域によって利用できません。接続できない場合は
 *   「この環境からは接続できません」と出し、空のまま置きます。
 */
export function TradingTerminal({
  coins,
  locale,
  dict,
  initialCoinId,
}: {
  coins: Coin[];
  locale: string;
  dict: Dictionary;
  initialCoinId?: string;
}) {
  // 通貨ペアのある銘柄だけを扱います
  const tradable = useMemo(() => coins.filter((coin) => symbolFor(coin.id) !== null), [coins]);

  const [coinId, setCoinId] = useState(initialCoinId ?? tradable[0]?.id ?? "");
  const [interval, setInterval] = useState<Interval>("15m");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [book, setBook] = useState<OrderBook>({ bids: [], asks: [] });
  const [trades, setTrades] = useState<Trade[]>([]);
  const [state, setState] = useState<ConnectionState>("connecting");
  const [restFailed, setRestFailed] = useState(false);

  const coin = tradable.find((entry) => entry.id === coinId);
  const symbol = symbolFor(coinId);

  /*
   * 銘柄・期間を変えたら、表示を空に戻します。
   *
   * effect ではなくレンダー中に戻すのは、前の銘柄の板と新しい価格が
   * 並んで見える瞬間を作らないためです。板は数字が近いので、
   * 1フレームでも混ざると読み違えます。
   */
  const [shownFor, setShownFor] = useState(`${coinId}:${interval}`);
  if (shownFor !== `${coinId}:${interval}`) {
    setShownFor(`${coinId}:${interval}`);
    setCandles([]);
    setBook({ bids: [], asks: [] });
    setTrades([]);
    setRestFailed(false);
    setState("connecting");
  }

  /* 過去の足は一度だけ REST で取ります。WebSocket は未来しか流しません */
  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    fetchCandles(symbol, interval)
      .then((rows) => {
        if (!cancelled) setCandles(rows);
      })
      .catch(() => {
        if (!cancelled) setRestFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [symbol, interval]);

  /* 板・約定・進行中の足を購読します */
  useEffect(() => {
    if (!symbol) return;

    const stop = subscribeTrading(symbol, interval, {
      onState: setState,
      onBook: setBook,
      onCandle: (candle) => setCandles((current) => mergeCandle(current, candle)),
      onTrade: (trade) =>
        // 増え続けないよう、直近だけを残します
        setTrades((current) => [trade, ...current].slice(0, 24)),
    });
    return stop;
  }, [symbol, interval]);

  const term = dict.market.terminal;

  const stateLabel = useCallback(
    (value: ConnectionState) =>
      ({
        connecting: dict.common.loading,
        open: term.connected,
        reconnecting: term.reconnecting,
        unavailable: term.unavailable,
      })[value],
    [dict.common.loading, term],
  );

  if (!coin || !symbol) return null;

  const last = candles[candles.length - 1];
  const first = candles[0];
  const change = first && last ? ((last.c - first.o) / first.o) * 100 : null;

  return (
    <div className="glass rounded-2xl p-4 sm:p-6">
      {/* 銘柄・期間 */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex flex-wrap items-baseline gap-2 text-lg font-semibold">
            <span translate="no">{symbol}</span>
            <span className="text-sm text-(--color-ink-dim)">{t(coin.name, locale)}</span>
          </h3>
          {last ? (
            <p className="mt-1 flex items-baseline gap-3">
              <span className="font-mono text-2xl font-semibold sm:text-3xl" translate="no">
                {new Intl.NumberFormat(locale === "ja" ? "ja-JP" : locale, {
                  maximumFractionDigits: last.c < 1 ? 6 : last.c < 100 ? 4 : 2,
                }).format(last.c)}
              </span>
              {change !== null ? (
                <span
                  className={cx(
                    "font-mono text-sm",
                    change >= 0 ? "text-(--color-emerald)" : "text-(--color-rose)",
                  )}
                  translate="no"
                >
                  {change >= 0 ? "+" : ""}
                  {change.toFixed(2)}%
                </span>
              ) : null}
            </p>
          ) : null}
        </div>

        <div role="tablist" aria-label={term.interval} className="flex flex-wrap gap-1">
          {INTERVALS.map((entry) => (
            <button
              key={entry}
              type="button"
              role="tab"
              aria-selected={interval === entry}
              onClick={() => setInterval(entry)}
              className={cx(
                "rounded-full px-3 py-1.5 font-mono text-xs transition-colors",
                interval === entry
                  ? "bg-white/12 text-white"
                  : "text-(--color-ink-dim) hover:text-(--color-ink)",
              )}
            >
              {entry}
            </button>
          ))}
        </div>
      </div>

      {/*
        チャートと板を横に並べます。
        狭い画面では縦に積み、板は折りたたまずそのまま続けます
        （開閉にすると、板があること自体に気づかれません）。
      */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="min-w-0">
          <div className="h-64 w-full sm:h-80">
            {candles.length > 0 ? (
              <CandleChart
                candles={candles}
                locale={locale}
                labels={{
                  open: term.open,
                  high: term.high,
                  low: term.low,
                  close: term.close,
                  volume: term.volume,
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-(--color-ink-dim)">
                {restFailed || state === "unavailable" ? term.unavailable : dict.common.loading}
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <h4 className="mb-2 text-sm font-semibold">{term.orderBook}</h4>
          <OrderBookPanel
            book={book}
            locale={locale}
            labels={{
              asks: term.asks,
              bids: term.bids,
              price: term.price,
              size: term.size,
              spread: term.spread,
              empty: state === "unavailable" ? term.unavailable : dict.common.loading,
            }}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem]">
        {/* 銘柄の切り替え */}
        <div role="tablist" aria-label={dict.nav.coins} className="flex flex-wrap gap-1.5">
          {tradable.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={entry.id === coinId}
              onClick={() => setCoinId(entry.id)}
              className={cx(
                "rounded-full px-3 py-1.5 font-mono text-xs transition-colors",
                entry.id === coinId
                  ? "bg-white/12 text-white"
                  : "text-(--color-ink-dim) hover:text-(--color-ink)",
              )}
            >
              <span translate="no">{entry.symbol}</span>
            </button>
          ))}
        </div>

        <div className="min-w-0">
          <h4 className="mb-2 text-sm font-semibold">{term.trades}</h4>
          <TradeTape
            trades={trades}
            locale={locale}
            labels={{
              price: term.price,
              size: term.size,
              time: term.time,
              buy: term.buy,
              sell: term.sell,
              empty: state === "unavailable" ? term.unavailable : dict.common.loading,
            }}
          />
        </div>
      </div>

      {/* 接続状態と出どころ。板は取引所ごとに別物なので、必ず併記します */}
      <p
        className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-(--color-ink-dim)"
        aria-live="polite"
      >
        <span
          className={cx(
            "inline-flex items-center gap-1.5",
            state === "open"
              ? "text-(--color-emerald)"
              : state === "unavailable"
                ? "text-(--color-rose)"
                : "text-(--color-amber)",
          )}
        >
          <span aria-hidden="true" className="inline-block size-1.5 rounded-full bg-current" />
          {stateLabel(state)}
        </span>
        <span aria-hidden="true">·</span>
        <span>
          {term.venue}:{" "}
          <a
            href={TRADING_VENUE.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-(--color-ink)"
            translate="no"
          >
            {TRADING_VENUE.name}
          </a>{" "}
          <span translate="no">({symbol})</span>
        </span>
      </p>
      <p className="mt-1 text-xs text-(--color-ink-dim)">{term.note}</p>
    </div>
  );
}
