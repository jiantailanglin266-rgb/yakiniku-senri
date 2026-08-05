/**
 * 立体的な仮想通貨コイン。
 *
 * ■ CSS 3D で描く理由
 *   Three.js / React Three Fiber を使うと初期JSが大きく増え、
 *   ファーストビューの表示が遅くなります。ここで欲しいのは
 *   「回転する円盤の質感」だけなので、transform-style: preserve-3d と
 *   グラデーションで十分に成立します。追加バンドルはゼロです。
 *   （prefers-reduced-motion では回転が止まります。CSS 側で制御）
 *
 * ■ サーバーコンポーネント
 *   状態を持たないため、クライアントJSは一切出ません。
 */
export function Coin3D({
  symbol,
  color,
  size = 220,
  className,
  delay = 0,
}: {
  symbol: string;
  color: string;
  size?: number;
  className?: string;
  /** 複数枚並べるときに回転位相をずらします */
  delay?: number;
}) {
  return (
    <div
      className={className}
      style={{ width: size, height: size, perspective: `${size * 5}px` }}
      aria-hidden="true"
    >
      <div className="coin3d relative size-full" style={{ animationDelay: `${delay}s` }}>
        {/* 表面 */}
        <div
          className="absolute inset-0 grid place-items-center rounded-full"
          style={{
            background: `
              radial-gradient(circle at 32% 26%, #ffffff55 0%, transparent 38%),
              conic-gradient(from 210deg, ${color}, #ffffff88 22%, ${color} 42%, ${color}88 62%, #ffffff66 78%, ${color})
            `,
            boxShadow: `
              inset 0 0 ${size * 0.16}px ${color}aa,
              0 0 ${size * 0.28}px -${size * 0.06}px ${color},
              0 ${size * 0.08}px ${size * 0.3}px -${size * 0.1}px #000
            `,
            border: `${Math.max(2, size * 0.014)}px solid ${color}`,
          }}
        >
          <span
            className="font-mono font-bold"
            style={{
              fontSize: size * 0.28,
              color: "#05070f",
              textShadow: `0 1px 0 ${color}, 0 0 ${size * 0.06}px #ffffff88`,
            }}
          >
            {symbol.slice(0, 3)}
          </span>
        </div>

        {/* 縁の厚み。奥に少しずらした円を重ねて厚みに見せます */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            transform: `translateZ(-${size * 0.045}px)`,
            background: `linear-gradient(180deg, ${color}dd, ${color}55)`,
          }}
        />
      </div>
    </div>
  );
}
