"use client";

import { useState } from "react";
import { AreaChart } from "./charts";
import type { ChartPeriod, PricePoint } from "@/portal/lib/types";
import type { Dictionary } from "@/portal/i18n/dictionaries";
import { formatDate, formatPrice } from "@/portal/lib/format";
import { cx } from "@/portal/components/ui/primitives";

/**
 * 期間切り替え付きの価格チャート。
 *
 * ■ なぜ全期間分をサーバーから渡すのか
 *   切り替えのたびに取得すると、無料APIのレート制限にすぐ当たります。
 *   6期間ぶんでも数KBなので、まとめて渡してクライアントで切り替えるほうが
 *   速く、外部APIへの負荷もかかりません。
 */
export function PriceChartPanel({
  series,
  color,
  locale,
  dict,
  coinName,
}: {
  series: Record<ChartPeriod, PricePoint[]>;
  color: string;
  locale: string;
  dict: Dictionary;
  coinName: string;
}) {
  const [period, setPeriod] = useState<ChartPeriod>("d7");
  const points = series[period] ?? [];

  const periods: ChartPeriod[] = ["d1", "d7", "m1", "m3", "y1", "all"];
  const first = points[0];
  const last = points[points.length - 1];
  const change = first && last ? ((last.p - first.p) / first.p) * 100 : 0;

  return (
    <div className="glass rounded-2xl p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{dict.market.chart}</h2>
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

      <div className="h-56 w-full sm:h-72">
        {points.length > 1 ? (
          <AreaChart
            key={period}
            points={points}
            color={color}
            ariaLabel={`${coinName} — ${dict.market.period[period]} (${change.toFixed(2)}%)`}
          />
        ) : (
          <p className="grid h-full place-items-center text-sm text-(--color-ink-dim)">
            {dict.common.error}
          </p>
        )}
      </div>

      {first && last ? (
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-(--color-hairline) pt-3 text-xs">
          <div className="flex gap-2">
            <dt className="text-(--color-ink-dim)">
              {formatDate(new Date(first.t).toISOString(), locale)}
            </dt>
            <dd className="tabular font-mono">{formatPrice(first.p, locale)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-(--color-ink-dim)">
              {formatDate(new Date(last.t).toISOString(), locale)}
            </dt>
            <dd className="tabular font-mono">{formatPrice(last.p, locale)}</dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}
