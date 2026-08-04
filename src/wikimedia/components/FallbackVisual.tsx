/**
 * 画像が無いときの生成ビジュアル。
 *
 * ライセンスの心配がまったく無い、自前生成の SVG + CSS です。
 * 画像が承認されるまでのあいだ、ここがサイトの見た目を支えます。
 */
import { derivedPalette, fallbackGeometry, fallbackVisual } from "../fallback";

type Props = {
  /** 決定的に絵柄を決める種（スラッグなど） */
  seed: string;
  /** アクセント色（競技・カテゴリの色） */
  accent: string;
  /** 中央に置く記号（絵文字・イニシャル） */
  glyph?: string;
  /** 表示比率 */
  ratio?: "16/9" | "1/1" | "4/5" | "21/9";
  className?: string;
};

export function FallbackVisual({ seed, accent, glyph, ratio = "16/9", className = "" }: Props) {
  const visual = fallbackVisual(seed, accent, glyph);
  const geometry = fallbackGeometry(seed);
  const [c1, c2, c3] = derivedPalette(accent, seed);
  const id = `fb-${seedSafe(seed)}`;

  return (
    <div
      className={`sp-holo relative isolate overflow-hidden ${className}`}
      style={{ aspectRatio: ratio.replace("/", " / ") }}
      // 装飾なので読み上げ対象から外します
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 160 90"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full"
      >
        <defs>
          <radialGradient
            id={`${id}-glow`}
            cx={`${geometry.focus.x}%`}
            cy={`${geometry.focus.y}%`}
            r="75%"
          >
            <stop offset="0%" stopColor={c1} stopOpacity="0.42" />
            <stop offset="55%" stopColor={c2} stopOpacity="0.16" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={c3} stopOpacity="0.3" />
            <stop offset="60%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>
          <pattern id={`${id}-grid`} width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M8 0H0V8" fill="none" stroke={c1} strokeOpacity="0.14" strokeWidth="0.3" />
          </pattern>
        </defs>

        <rect width="160" height="90" fill="var(--color-abyss, #070b1a)" />
        <rect width="160" height="90" fill={`url(#${id}-grid)`} />
        <rect width="160" height="90" fill={`url(#${id}-glow)`} />

        {/* パターンごとの主図形 */}
        {visual.pattern === "orbit" || visual.pattern === "mesh" ? (
          <g transform="translate(80 45)" opacity="0.55">
            {geometry.rings.map((radius, index) => (
              <ellipse
                key={radius}
                rx={radius * 0.55}
                ry={radius * 0.3}
                fill="none"
                stroke={index === 0 ? c1 : index === 1 ? c2 : c3}
                strokeOpacity={0.5 - index * 0.12}
                strokeWidth="0.4"
              />
            ))}
          </g>
        ) : null}

        {visual.pattern === "wave" ? (
          <g opacity="0.5">
            {[0, 1, 2].map((index) => (
              <path
                key={index}
                d={`M0 ${52 + index * 8} Q 40 ${40 + index * 6}, 80 ${52 + index * 8} T 160 ${52 + index * 8}`}
                fill="none"
                stroke={index === 0 ? c1 : index === 1 ? c2 : c3}
                strokeOpacity={0.45 - index * 0.1}
                strokeWidth="0.5"
              />
            ))}
          </g>
        ) : null}

        {visual.pattern === "burst" ? (
          <g transform="translate(80 45)" opacity="0.5">
            {geometry.dots.map((dot, index) => (
              <line
                key={index}
                x1="0"
                y1="0"
                x2={Math.cos((dot.angle * Math.PI) / 180) * dot.radius}
                y2={Math.sin((dot.angle * Math.PI) / 180) * dot.radius * 0.55}
                stroke={index % 2 === 0 ? c1 : c3}
                strokeOpacity="0.4"
                strokeWidth="0.35"
              />
            ))}
          </g>
        ) : null}

        {/* 光の粒子 */}
        <g transform="translate(80 45)">
          {geometry.dots.map((dot, index) => (
            <circle
              key={index}
              cx={Math.cos((dot.angle * Math.PI) / 180) * dot.radius}
              cy={Math.sin((dot.angle * Math.PI) / 180) * dot.radius * 0.55}
              r={dot.size * 0.35}
              fill={index % 3 === 0 ? c1 : "#cbd5e1"}
              opacity={0.65}
            />
          ))}
        </g>

        {/* 斜めの光帯 */}
        <rect
          width="160"
          height="90"
          fill={`url(#${id}-beam)`}
          transform={`rotate(${geometry.beamAngle} 80 45)`}
        />
      </svg>

      {glyph ? (
        <span
          className="absolute inset-0 grid place-items-center text-4xl sm:text-5xl"
          style={{ filter: `drop-shadow(0 0 1.5rem ${accent}66)` }}
        >
          {glyph}
        </span>
      ) : null}

      {/* 下端を暗く落として、上に載る文字を読めるようにします */}
      <span className="from-void/85 absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t to-transparent" />
    </div>
  );
}

function seedSafe(seed: string): string {
  return seed.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24) || "x";
}
