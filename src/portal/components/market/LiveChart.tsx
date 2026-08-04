"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AreaChart, PriceChange } from "./charts";
import { cx } from "@/portal/components/ui/primitives";
import { formatDateTime, formatPrice, t } from "@/portal/lib/format";
import {
  backoffSec,
  clearLiveCache,
  fetchLiveQuotes,
  fetchLiveSeries,
  LIVE_REFRESH_SEC,
  LIVE_SOURCE,
  RateLimitedError,
  type LiveStatus,
} from "@/portal/lib/live-market";
import type { Dictionary } from "@/portal/i18n/dictionaries";
import type { ChartPeriod, Coin, PricePoint } from "@/portal/lib/types";

/**
 * ブラウザ側で更新する価格チャート。
 *
 * ■ 「リアルタイム」と書かない理由
 *   無料の公開APIはIPあたり毎分数回で制限されます。実際の更新は約60秒に1回です。
 *   秒単位で動いているように見せると、その差が誤認になります。
 *   ここでは常に「取得日時」と「約◯秒ごとに更新」を並べて出します。
 *
 * ■ 取得できないときに古い値を隠しません
 *   通信断・レート制限・提供元の障害では、直前に取得できた値を残したまま
 *   状態バッジを出します。金融情報なので、
 *   古い値を黙って新しい値のように見せることはしません。
 *
 * ■ タブが見えていない間は取れに行きません
 *   放置されたタブが制限枠を食い潰すと、実際に見ている人が更新できなくなります。
 */
export function LiveChart({
  coins,
  locale,
  dict,
  initialSeries,
  initialCoinId,
  compact = false,
}: {
  /** 選べる銘柄。`id` は CoinGecko の coin id と一致させます */
  coins: Coin[];
  locale: string;
  dict: Dictionary;
  /** ビルド時に埋め込んだ系列。取得できるまでの表示と、失敗時の受け皿になります */
  initialSeries: Record<string, PricePoint[]>;
  initialCoinId?: string;
  /** トップページ用の小さい表示 */
  compact?: boolean;
}) {
  const periods: ChartPeriod[] = compact ? ["d1", "d7", "m1"] : ["d1", "d7", "m1", "m3", "y1"];

  const [coinId, setCoinId] = useState(initialCoinId ?? coins[0]?.id ?? "");
  const [period, setPeriod] = useState<ChartPeriod>("d1");
  const [series, setSeries] = useState<PricePoint[]>(initialSeries[coinId] ?? []);
  const [price, setPrice] = useState<number | null>(null);
  const [change24h, setChange24h] = useState<number | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [status, setStatus] = useState<LiveStatus>("idle");

  /**
   * 連続してレート制限に当たった回数。
   *
   * ref と state の両方に持ちます。ref は次回の予約を組むタイミング計算に、
   * state は画面に出す待ち時間に使います。ref をレンダー中に読むと、
   * 表示と実際の待ち時間がずれることがあります。
   */
  const rateLimits = useRef(0);
  const [waitSec, setWaitSec] = useState(LIVE_REFRESH_SEC);
  const timer = useRef<number | null>(null);

  const coin = useMemo(() => coins.find((entry) => entry.id === coinId), [coins, coinId]);
  const ids = useMemo(() => coins.map((entry) => entry.id), [coins]);

  const load = useCallback(async () => {
    setStatus((current) => (current === "live" ? current : "loading"));
    try {
      const [quotes, points] = await Promise.all([
        fetchLiveQuotes(ids),
        fetchLiveSeries(coinId, period),
      ]);
      const quote = quotes.find((entry) => entry.id === coinId);
      if (quote) {
        setPrice(quote.usd);
        setChange24h(quote.change24h);
      }
      if (points.length > 1) setSeries(points);
      setFetchedAt(new Date().toISOString());
      rateLimits.current = 0;
      setWaitSec(LIVE_REFRESH_SEC);
      setStatus("live");
    } catch (error) {
      if (error instanceof RateLimitedError) {
        rateLimits.current += 1;
        setWaitSec(backoffSec(rateLimits.current));
        setStatus("throttled");
        return;
      }
      setStatus("error");
    }
  }, [coinId, ids, period]);

  /*
   * 銘柄・期間を変えたら、まず埋め込みの系列へ戻します。
   * 前の銘柄の線を残したまま新しい価格を出すと、別物が並んで見えます。
   *
   * effect ではなくレンダー中に戻しているのは、
   * 「描いてから消して描き直す」を挟まないためです（1フレーム前の線が見えます）。
   */
  const [shownFor, setShownFor] = useState(`${coinId}:${period}`);
  if (shownFor !== `${coinId}:${period}`) {
    setShownFor(`${coinId}:${period}`);
    setSeries(initialSeries[coinId] ?? []);
  }

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        schedule(LIVE_REFRESH_SEC);
        return;
      }
      await load();
      if (!cancelled) schedule(backoffSec(rateLimits.current));
    };

    const schedule = (seconds: number) => {
      if (cancelled) return;
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void tick(), seconds * 1000);
    };

    void tick();

    // タブへ戻ってきたら、待たずに取り直します
    const onVisible = () => {
      if (document.visibilityState === "visible") void tick();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      if (timer.current !== null) window.clearTimeout(timer.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  // ページを離れるときにキャッシュを残しても、次に開いたときには古すぎます
  useEffect(() => () => clearLiveCache(), []);

  const live = dict.market.live;
  const coinName = coin ? t(coin.name, locale) : "";
  const shown = price ?? series[series.length - 1]?.p ?? null;

  return (
    <div className="glass rounded-2xl p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-3">
            <h2 className={cx("font-semibold", compact ? "text-base" : "text-lg")}>
              <span translate="no">{coin?.symbol}</span>{" "}
              <span className="text-(--color-ink-dim)">{coinName}</span>
            </h2>
            {change24h !== null ? (
              <PriceChange
                value={change24h}
                locale={locale}
                labels={{
                  up: dict.a11y.priceUp,
                  down: dict.a11y.priceDown,
                  flat: dict.a11y.priceFlat,
                }}
              />
            ) : null}
          </div>
          {shown !== null ? (
            <p className="mt-1 font-mono text-2xl font-semibold sm:text-3xl" translate="no">
              {formatPrice(shown, locale)}
            </p>
          ) : null}
        </div>

        <div role="tablist" aria-label={dict.market.chart} className="flex flex-wrap gap-1">
          {periods.map((entry) => (
            <button
              key={entry}
              type="button"
              role="tab"
              aria-selected={period === entry}
              onClick={() => setPeriod(entry)}
              className={cx(
                "rounded-full px-3 py-1.5 font-mono text-xs transition-colors",
                period === entry
                  ? "bg-white/12 text-white"
                  : "text-(--color-ink-dim) hover:text-(--color-ink)",
              )}
            >
              {dict.market.period[entry]}
            </button>
          ))}
        </div>
      </div>

      <div className={cx("w-full", compact ? "h-48" : "h-64 sm:h-80")}>
        {series.length > 1 ? (
          <AreaChart
            key={`${coinId}-${period}-${series.length}`}
            points={series}
            color={coin?.color ?? "var(--color-cyan)"}
            ariaLabel={`${coinName} — ${dict.market.period[period]}`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-(--color-ink-dim)">
            {dict.common.loading}
          </div>
        )}
      </div>

      {/* 銘柄の切り替え */}
      <div className="mt-4 flex flex-wrap gap-1.5" role="tablist" aria-label={dict.nav.coins}>
        {coins.map((entry) => (
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

      <LiveStatusLine
        status={status}
        fetchedAt={fetchedAt}
        locale={locale}
        dict={dict}
        waitSec={waitSec}
      />

      <p className="mt-2 text-xs text-(--color-ink-dim)">
        {live.source}:{" "}
        <a
          href={LIVE_SOURCE.url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-(--color-ink)"
          translate="no"
        >
          {LIVE_SOURCE.name}
        </a>
      </p>
    </div>
  );
}

/** 取得できているか、いつの値かを常に出します。 */
function LiveStatusLine({
  status,
  fetchedAt,
  locale,
  dict,
  waitSec,
}: {
  status: LiveStatus;
  fetchedAt: string | null;
  locale: string;
  dict: Dictionary;
  waitSec: number;
}) {
  const live = dict.market.live;

  const tone =
    status === "live"
      ? "text-(--color-emerald)"
      : status === "error"
        ? "text-(--color-rose)"
        : "text-(--color-amber)";

  const label =
    status === "live"
      ? live.connected
      : status === "loading" || status === "idle"
        ? dict.common.loading
        : status === "throttled"
          ? live.throttled.replace("{sec}", String(waitSec))
          : live.failed;

  return (
    <p
      className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-(--color-ink-dim)"
      // 状態の変化は読み上げますが、割り込ませません
      aria-live="polite"
    >
      <span className={cx("inline-flex items-center gap-1.5", tone)}>
        <span aria-hidden="true" className="inline-block size-1.5 rounded-full bg-current" />
        {label}
      </span>
      {fetchedAt ? (
        <>
          <span aria-hidden="true">·</span>
          <span>
            {dict.common.updatedAt}:{" "}
            <time dateTime={fetchedAt}>{formatDateTime(fetchedAt, locale)}</time>
          </span>
        </>
      ) : null}
      <span aria-hidden="true">·</span>
      <span>{live.interval.replace("{sec}", String(LIVE_REFRESH_SEC))}</span>
    </p>
  );
}
