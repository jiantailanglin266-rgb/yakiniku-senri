"use client";

import { useMemo, useState } from "react";
import type { Candle } from "@/portal/lib/live-trading";

/**
 * ローソク足チャート。
 *
 * ■ ライブラリを入れていません
 *   チャートライブラリは軽いものでも数十KB、機能の多いものは百KB超です。
 *   ここで必要なのは「ローソク・出来高・十字線」だけなので、SVGで描きます。
 *   追加バンドルはゼロです。
 *
 * ■ 価格軸は対数ではなく線形です
 *   短い期間を見る用途なので線形で足ります。
 *   年単位を対数で見たい場合は軸の取り方から変える必要があります。
 *
 * ■ 十字線はポインタ操作のみ
 *   触れる端末では指で隠れるため、値は上部のヘッダーにも出します。
 *   読み上げ向けには、末尾の値と期間を `aria-label` にまとめています。
 */
export function CandleChart({
  candles,
  locale,
  labels,
  height = 320,
}: {
  candles: Candle[];
  locale: string;
  labels: { open: string; high: string; low: string; close: string; volume: string };
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const width = 1000;
  const padTop = 12;
  const padBottom = 26;
  const volumeHeight = Math.round(height * 0.18);
  const priceHeight = height - padTop - padBottom - volumeHeight - 8;

  const view = useMemo(() => {
    if (candles.length === 0) return null;
    const highs = candles.map((c) => c.h);
    const lows = candles.map((c) => c.l);
    const max = Math.max(...highs);
    const min = Math.min(...lows);
    // 上下に少し余白を取らないと、最高値と最安値が枠に貼り付きます
    const pad = (max - min) * 0.06 || max * 0.01 || 1;
    return { max: max + pad, min: min - pad, maxVolume: Math.max(...candles.map((c) => c.v)) || 1 };
  }, [candles]);

  if (!view || candles.length === 0) return null;

  const slot = width / candles.length;
  const bodyWidth = Math.max(1, Math.min(slot * 0.68, 14));
  const y = (price: number) => padTop + ((view.max - price) / (view.max - view.min)) * priceHeight;
  const volumeTop = padTop + priceHeight + 8;
  const vy = (volume: number) =>
    volumeTop + volumeHeight - (volume / view.maxVolume) * volumeHeight;

  const active = hover !== null ? candles[hover] : candles[candles.length - 1];
  const rising = (c: Candle) => c.c >= c.o;

  const fmt = (value: number) =>
    new Intl.NumberFormat(locale === "ja" ? "ja-JP" : locale, {
      maximumFractionDigits: value < 1 ? 6 : value < 100 ? 4 : 2,
    }).format(value);

  return (
    <figure className="m-0">
      {/* 十字線で選んでいる足の値。触れる端末では指で隠れるため、ここに出します */}
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-(--color-ink-dim)">
        {(
          [
            [labels.open, active.o],
            [labels.high, active.h],
            [labels.low, active.l],
            [labels.close, active.c],
          ] as const
        ).map(([label, value]) => (
          <span key={label}>
            {label}{" "}
            <span className={rising(active) ? "text-(--color-emerald)" : "text-(--color-rose)"}>
              {fmt(value)}
            </span>
          </span>
        ))}
        <span>
          {labels.volume} {fmt(active.v)}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full touch-pan-y"
        preserveAspectRatio="none"
        role="img"
        aria-label={`${labels.close} ${fmt(candles[candles.length - 1].c)}`}
        onPointerMove={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          const ratio = (event.clientX - box.left) / box.width;
          const index = Math.floor(ratio * candles.length);
          setHover(index >= 0 && index < candles.length ? index : null);
        }}
        onPointerLeave={() => setHover(null)}
      >
        {/* 価格の目盛り。4本に留めます。多いと格子が主張してローソクが読めません */}
        {[0, 1, 2, 3, 4].map((i) => {
          const gy = padTop + (priceHeight / 4) * i;
          return (
            <g key={i}>
              <line
                x1={0}
                x2={width}
                y1={gy}
                y2={gy}
                stroke="currentColor"
                strokeOpacity={0.08}
                strokeWidth={1}
              />
              <text
                x={width - 4}
                y={gy - 3}
                textAnchor="end"
                fontSize={11}
                fill="currentColor"
                fillOpacity={0.45}
              >
                {fmt(view.max - ((view.max - view.min) / 4) * i)}
              </text>
            </g>
          );
        })}

        {/* 出来高 */}
        {candles.map((candle, index) => (
          <rect
            key={`v-${candle.t}`}
            x={index * slot + (slot - bodyWidth) / 2}
            y={vy(candle.v)}
            width={bodyWidth}
            height={Math.max(1, volumeTop + volumeHeight - vy(candle.v))}
            fill={rising(candle) ? "var(--color-emerald)" : "var(--color-rose)"}
            fillOpacity={0.32}
          />
        ))}

        {/* ローソク */}
        {candles.map((candle, index) => {
          const cx = index * slot + slot / 2;
          const color = rising(candle) ? "var(--color-emerald)" : "var(--color-rose)";
          const top = y(Math.max(candle.o, candle.c));
          const bottom = y(Math.min(candle.o, candle.c));
          return (
            <g key={candle.t}>
              {/* ひげ */}
              <line
                x1={cx}
                x2={cx}
                y1={y(candle.h)}
                y2={y(candle.l)}
                stroke={color}
                strokeWidth={1}
              />
              {/* 実体。始値と終値が同じ足も線として見えるよう、最低1pxを確保します */}
              <rect
                x={cx - bodyWidth / 2}
                y={top}
                width={bodyWidth}
                height={Math.max(1, bottom - top)}
                fill={color}
              />
            </g>
          );
        })}

        {/* 十字線 */}
        {hover !== null && candles[hover] ? (
          <g pointerEvents="none">
            <line
              x1={hover * slot + slot / 2}
              x2={hover * slot + slot / 2}
              y1={padTop}
              y2={volumeTop + volumeHeight}
              stroke="currentColor"
              strokeOpacity={0.35}
              strokeDasharray="3 3"
            />
            <line
              x1={0}
              x2={width}
              y1={y(candles[hover].c)}
              y2={y(candles[hover].c)}
              stroke="currentColor"
              strokeOpacity={0.35}
              strokeDasharray="3 3"
            />
          </g>
        ) : null}
      </svg>
    </figure>
  );
}
