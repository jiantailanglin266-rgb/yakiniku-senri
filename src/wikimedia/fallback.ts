/**
 * 画像が無いときの代替ビジュアル。
 *
 * ■ 例外処理ではなく、正規の表示手段
 *   「適切な画像が見つからないなら無理に載せない」という方針を採る以上、
 *   画像が無い状態が常態です。フォールバックの品質がサイトの品質を決めます。
 *
 * ■ 決定的であること
 *   同じスラッグからは必ず同じ絵が出ます。
 *   乱数を使うと、再ビルドのたびにカードの見た目が変わり、
 *   サーバー描画とクライアント描画でも食い違います。
 */
import type { FallbackVisual } from "./types";

/** 文字列から安定したハッシュを作ります（決定的な配色・配置に使います） */
export function seedHash(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

const patterns: FallbackVisual["pattern"][] = ["orbit", "grid", "wave", "burst", "mesh"];

export function fallbackVisual(seed: string, accent: string, glyph?: string): FallbackVisual {
  return {
    seed,
    accent,
    glyph,
    pattern: patterns[seedHash(seed) % patterns.length],
  };
}

/** アクセント色から、2色目・3色目を決めます（色相をずらすだけ） */
export function derivedPalette(accent: string, seed: string): [string, string, string] {
  const hash = seedHash(seed);
  const shift = 40 + (hash % 60);
  return [
    accent,
    `color-mix(in oklab, ${accent} 55%, var(--color-indigo))`,
    `color-mix(in oklab, ${accent} ${shift}%, var(--color-magenta))`,
  ];
}

/**
 * SVG のパスや座標を決定的に生成します。
 * コンポーネント側はこの値を描画するだけです。
 */
export type FallbackGeometry = {
  /** 同心円・軌道の半径（％） */
  rings: number[];
  /** 光点の角度（度） */
  dots: { angle: number; radius: number; size: number }[];
  /** グラデーションの中心（％） */
  focus: { x: number; y: number };
  /** 斜めの光帯の角度 */
  beamAngle: number;
};

export function fallbackGeometry(seed: string): FallbackGeometry {
  const hash = seedHash(seed);

  const rings = [0.34, 0.52, 0.72].map((base) =>
    Math.round((base + ((hash >> 3) % 9) / 100) * 100),
  );

  const dotCount = 5 + (hash % 4);
  const dots = Array.from({ length: dotCount }, (_, index) => {
    const step = (hash >> (index + 1)) % 360;
    return {
      angle: (index * (360 / dotCount) + step) % 360,
      radius: 28 + ((hash >> (index + 2)) % 40),
      size: 1 + ((hash >> index) % 3),
    };
  });

  return {
    rings,
    dots,
    focus: { x: 20 + (hash % 60), y: 10 + ((hash >> 5) % 50) },
    beamAngle: (hash % 40) - 20,
  };
}
