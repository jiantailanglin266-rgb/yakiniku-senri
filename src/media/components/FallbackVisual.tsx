/**
 * 画像が無いときの装飾表現。
 *
 * ■ 役割
 *   「関連の薄い画像を装飾目的で貼らない」ための受け皿です。
 *   ライセンス確認済みの画像が無い枠は、必ずここへ落とします。
 *   外部素材を使わないので、権利上の懸念がありません。
 *
 * ■ 実装
 *   CSS のグラデーションと SVG パターンだけで描きます。
 *   画像を読み込まないため、レイアウトのずれ（CLS）も起きません。
 */
import type { ReactNode } from "react";

export type FallbackTheme =
  | "card"
  | "point"
  | "mile"
  | "travel"
  | "business"
  | "crypto"
  | "security"
  | "news"
  | "video"
  | "guide"
  | "tool"
  | "payment"
  | "neutral";

const palettes: Record<FallbackTheme, { from: string; via: string; to: string; glyph: Glyph }> = {
  card: { from: "#0ea5e9", via: "#3b82f6", to: "#111832", glyph: "card" },
  point: { from: "#22d3ee", via: "#0ea5e9", to: "#0b1020", glyph: "spark" },
  mile: { from: "#3b82f6", via: "#6366f1", to: "#0b1020", glyph: "route" },
  travel: { from: "#8b5cf6", via: "#6366f1", to: "#0b1020", glyph: "globe" },
  business: { from: "#0f766e", via: "#22d3ee", to: "#0b1020", glyph: "grid" },
  crypto: { from: "#be185d", via: "#e548a8", to: "#111832", glyph: "node" },
  security: { from: "#7c3aed", via: "#a855f7", to: "#0b1020", glyph: "shield" },
  news: { from: "#0891b2", via: "#3b82f6", to: "#0b1020", glyph: "stream" },
  video: { from: "#9333ea", via: "#e548a8", to: "#0b1020", glyph: "play" },
  guide: { from: "#059669", via: "#34d399", to: "#0b1020", glyph: "grid" },
  tool: { from: "#0284c7", via: "#38bdf8", to: "#0b1020", glyph: "grid" },
  payment: { from: "#065f46", via: "#34d399", to: "#0b1020", glyph: "wave" },
  neutral: { from: "#1e3a8a", via: "#3b82f6", to: "#05070f", glyph: "grid" },
};

type Glyph =
  "card" | "spark" | "route" | "globe" | "grid" | "node" | "shield" | "stream" | "play" | "wave";

/**
 * 装飾なので、支援技術には読ませません（`aria-hidden`）。
 * 意味のある情報は必ず本文側に置いてください。
 */
export function FallbackVisual({
  theme = "neutral",
  className,
  children,
  seed = 0,
}: {
  theme?: FallbackTheme;
  className?: string;
  /** 上に重ねる要素（見出しなど） */
  children?: ReactNode;
  /** 同じテーマでも見た目を変えるための種 */
  seed?: number;
}) {
  const palette = palettes[theme];
  const angle = 120 + ((seed * 37) % 90);

  return (
    <div
      className={["relative overflow-hidden", className ?? ""].join(" ")}
      style={{
        background: `linear-gradient(${angle}deg, ${palette.from} 0%, ${palette.via} 48%, ${palette.to} 100%)`,
      }}
    >
      <GlyphLayer glyph={palette.glyph} seed={seed} />
      {/* 上に文字を載せても読めるよう、暗いグラデーションを重ねます */}
      <span
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(5,7,15,0.05) 0%, rgba(5,7,15,0.35) 55%, rgba(5,7,15,0.72) 100%)",
        }}
      />
      {children ? <div className="relative z-10 h-full">{children}</div> : null}
    </div>
  );
}

function GlyphLayer({ glyph, seed }: { glyph: Glyph; seed: number }) {
  const offset = (seed * 13) % 40;

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 225"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full opacity-[0.32]"
    >
      <defs>
        <linearGradient id={`fv-line-${glyph}-${seed}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
        </linearGradient>
        <pattern
          id={`fv-grid-${glyph}-${seed}`}
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <path d="M24 0H0V24" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1" />
        </pattern>
      </defs>

      <rect width="400" height="225" fill={`url(#fv-grid-${glyph}-${seed})`} />

      <g
        fill="none"
        stroke={`url(#fv-line-${glyph}-${seed})`}
        strokeWidth="2"
        strokeLinecap="round"
        transform={`translate(${offset - 20} 0)`}
      >
        {glyph === "card" ? (
          <>
            <rect x="120" y="62" width="170" height="106" rx="14" />
            <rect x="140" y="104" width="30" height="22" rx="4" />
            <path d="M140 148h96" />
          </>
        ) : null}
        {glyph === "spark" ? (
          <>
            <circle cx="200" cy="112" r="46" />
            <path d="M200 46v-22M200 200v-22M132 112h-24M292 112h24" />
            <path d="M154 66l-16-16M246 66l16-16M154 158l-16 16M246 158l16 16" />
          </>
        ) : null}
        {glyph === "route" ? (
          <>
            <path d="M40 180C120 180 140 60 220 60s90 90 150 90" strokeDasharray="8 10" />
            <circle cx="40" cy="180" r="6" />
            <circle cx="370" cy="150" r="6" />
            <path d="M198 74l30-14-6 30z" />
          </>
        ) : null}
        {glyph === "globe" ? (
          <>
            <circle cx="200" cy="112" r="72" />
            <ellipse cx="200" cy="112" rx="30" ry="72" />
            <path d="M128 112h144M146 74h108M146 150h108" />
          </>
        ) : null}
        {glyph === "node" ? (
          <>
            <circle cx="120" cy="80" r="8" />
            <circle cx="280" cy="70" r="8" />
            <circle cx="200" cy="150" r="8" />
            <circle cx="320" cy="160" r="8" />
            <path d="M120 80l80 70M280 70l-80 80M200 150l120 10M120 80l160-10" />
          </>
        ) : null}
        {glyph === "shield" ? (
          <>
            <path d="M200 48l68 26v54c0 40-30 68-68 82-38-14-68-42-68-82V74z" />
            <path d="M172 116l22 22 40-42" />
          </>
        ) : null}
        {glyph === "stream" ? (
          <>
            <path d="M30 70h150M30 100h110M30 130h170M30 160h90" strokeDasharray="6 12" />
            <rect x="240" y="60" width="120" height="110" rx="10" />
          </>
        ) : null}
        {glyph === "play" ? (
          <>
            <rect x="110" y="58" width="180" height="110" rx="16" />
            <path d="M186 96l44 22-44 22z" />
          </>
        ) : null}
        {glyph === "wave" ? (
          <>
            <path d="M20 140c40-40 80 40 120 0s80 40 120 0 80 40 120 0" />
            <path d="M20 100c40-40 80 40 120 0s80 40 120 0 80 40 120 0" strokeOpacity="0.5" />
          </>
        ) : null}
        {glyph === "grid" ? (
          <>
            <rect x="110" y="55" width="80" height="60" rx="8" />
            <rect x="210" y="55" width="80" height="60" rx="8" />
            <rect x="110" y="130" width="80" height="60" rx="8" />
            <rect x="210" y="130" width="80" height="60" rx="8" />
          </>
        ) : null}
      </g>
    </svg>
  );
}
