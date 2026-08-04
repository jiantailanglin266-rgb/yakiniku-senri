import { formatPercent, priceDirection } from "@/portal/lib/format";
import { cx } from "@/portal/components/ui/primitives";

/**
 * チャート類。
 *
 * ■ なぜ自前のSVGか
 *   チャートライブラリはバンドルが数十〜百KB単位で増え、
 *   ここで必要なのは折れ線とエリア塗りだけです。
 *   自前のSVGならサーバーコンポーネントのまま描け、
 *   クライアントJSがゼロで済みます（＝LCP/TBTに効きます）。
 */

/* -------------------------------------------------------- 変動率の表示 */

export function PriceChange({
  value,
  locale,
  labels,
  className,
  size = "sm",
}: {
  value: number;
  locale: string;
  labels: { up: string; down: string; flat: string };
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const direction = priceDirection(value);
  const symbol = direction === "up" ? "▲" : direction === "down" ? "▼" : "—";
  const label = labels[direction];

  return (
    <span
      className={cx(
        "tabular inline-flex items-center gap-1 font-mono font-medium",
        direction === "up" && "trend-up",
        direction === "down" && "trend-down",
        direction === "flat" && "trend-flat",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        size === "lg" && "text-base",
        className,
      )}
    >
      {/* 色だけで方向を示すと、色覚特性のある利用者に伝わりません */}
      <span aria-hidden="true">{symbol}</span>
      {formatPercent(value, locale)}
      <span className="sr-only">{label}</span>
    </span>
  );
}

/* ------------------------------------------------------------ スパーク */

function toPath(values: number[], width: number, height: number, padding = 2): string {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = (width - padding * 2) / (values.length - 1);

  return values
    .map((value, index) => {
      const x = padding + index * stepX;
      const y = padding + (1 - (value - min) / span) * (height - padding * 2);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export function Sparkline({
  values,
  width = 120,
  height = 36,
  className,
  ariaLabel,
}: {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
  /** 数値そのものは表の別セルに出しているため、通常は装飾扱いにします */
  ariaLabel?: string;
}) {
  if (values.length < 2) return null;

  const rising = values[values.length - 1] >= values[0];
  const stroke = rising ? "var(--color-up)" : "var(--color-down)";
  const path = toPath(values, width, height);
  const areaPath = `${path} L${width - 2},${height} L2,${height} Z`;
  const gradientId = `spark-${rising ? "up" : "down"}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      role={ariaLabel ? "img" : "presentation"}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/* -------------------------------------------------------- 大きいチャート */

export function AreaChart({
  points,
  color = "var(--color-cyan)",
  width = 960,
  height = 300,
  ariaLabel,
  animate = true,
}: {
  points: { t: number; p: number }[];
  color?: string;
  width?: number;
  height?: number;
  ariaLabel: string;
  animate?: boolean;
}) {
  if (points.length < 2) return null;

  const values = points.map((point) => point.p);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = 8;
  const path = toPath(values, width, height, padding);
  const areaPath = `${path} L${width - padding},${height} L${padding},${height} Z`;

  // 目盛りは4本。多いと格子が主張しすぎて線が読みにくくなります
  const gridLines = [0, 1, 2, 3, 4].map((index) => padding + ((height - padding * 2) / 4) * index);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-full w-full"
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id="area-glow" x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {gridLines.map((y) => (
        <line
          key={y}
          x1={padding}
          x2={width - padding}
          y1={y}
          y2={y}
          stroke="rgba(148,163,184,0.14)"
          strokeWidth="1"
        />
      ))}

      <path d={areaPath} fill="url(#area-fill)" />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        filter="url(#area-glow)"
        className={animate ? "chart-draw" : undefined}
        style={animate ? ({ "--chart-length": 4000 } as React.CSSProperties) : undefined}
      />

      {/* 高値・安値の目安。数値そのものは表側に出します */}
      <title>{ariaLabel}</title>
      <desc>
        min {min} / max {max}
      </desc>
    </svg>
  );
}

/* ----------------------------------------------------- Fear & Greed */

export function FearGreedGauge({
  value,
  label,
  caption,
}: {
  /** 0–100 */
  value: number;
  label: string;
  caption: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  // 半円ゲージ。半径70、中心(80,80)
  const radius = 62;
  const circumference = Math.PI * radius;
  const progress = (clamped / 100) * circumference;

  return (
    <figure className="flex flex-col items-center">
      <svg viewBox="0 0 160 92" className="w-40" role="img" aria-label={`${label}: ${clamped}`}>
        <defs>
          <linearGradient id="fng-track" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-down)" />
            <stop offset="50%" stopColor="var(--color-amber)" />
            <stop offset="100%" stopColor="var(--color-up)" />
          </linearGradient>
        </defs>
        <path
          d="M18 80 A62 62 0 0 1 142 80"
          fill="none"
          stroke="rgba(148,163,184,0.18)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M18 80 A62 62 0 0 1 142 80"
          fill="none"
          stroke="url(#fng-track)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
        />
        <text
          x="80"
          y="72"
          textAnchor="middle"
          className="fill-(--color-ink) font-mono text-2xl font-semibold"
        >
          {clamped}
        </text>
      </svg>
      <figcaption className="mt-1 text-center">
        <span className="block text-xs tracking-wide text-(--color-ink-dim) uppercase">
          {label}
        </span>
        <span className="text-sm text-(--color-ink-soft)">{caption}</span>
      </figcaption>
    </figure>
  );
}
