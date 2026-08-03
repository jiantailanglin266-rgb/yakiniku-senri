/**
 * 木槿（ムクゲ）降下アニメーションの設定。
 *
 * ■ 設計方針
 *   - 乱数はレンダー時に呼ばず、固定シードの疑似乱数でビルド時に確定させます。
 *     これによりサーバー / クライアントで同じ結果になり、Hydration Error が起きません。
 *   - 花ごとの挙動（位置・速度・回転・揺れ・ぼかし）はすべてこのファイルで決まります。
 *     見た目を調整したいときは、まずこのファイルの定数を触ってください。
 *
 * ■ 配色について
 *   木槿は韓国の国花ですが、本サイトは黒・金を基調とした焼肉店のブランドサイトです。
 *   そのため花の色は既存トークン（金 / アイボリー / 炭火の赤）へ読み替えています。
 *   国旗・国家機関のマークなど、政治的な意味を持つ意匠は一切使用しません。
 */

export type FlowerLayer = "back" | "middle" | "front";
export type FlowerType = "flower" | "petal" | "sparkle";
export type FlowerVariant = "ivory" | "gold" | "ember" | "crimson";
export type FlowerPose = "open" | "half" | "side";
export type FlowerDensity = "low" | "medium" | "high";
export type RainVariant = "hero" | "section" | "cta";
export type DeviceTier = "desktop" | "tablet" | "mobile";

export type FallingFlowerConfig = {
  id: string;
  /** レイヤー幅に対する開始位置（%） */
  startX: number;
  /** 花の一辺（px） */
  size: number;
  /** 1ループの秒数 */
  duration: number;
  /** 開始までの秒数 */
  delay: number;
  /** 左右の揺れ幅（vw） */
  swayDistance: number;
  /** 落下しきるまでの総回転角（度） */
  rotation: number;
  opacity: number;
  /** 奥行き表現のぼかし（px）。0 のときはフィルタを付けません */
  blur: number;
  layer: FlowerLayer;
  type: FlowerType;
  variant: FlowerVariant;
  pose: FlowerPose;
  /** type が petal のときの花びら枚数 */
  petalCount: 1 | 2 | 3;
  /** 途中で風に持ち上げられる演出を入れるか */
  hasLift: boolean;
};

/* ------------------------------------------------------------------
   配色 — 既存の @theme トークンに対応
   ------------------------------------------------------------------ */
export const FLOWER_PALETTE: Record<
  FlowerVariant,
  { outer: string; inner: string; center: string; rim: string; glow: string }
> = {
  // --color-ivory / --color-gold
  ivory: {
    outer: "#f7f3e8",
    inner: "#e6d8bb",
    center: "#c7a253",
    rim: "#ffffff",
    glow: "rgba(247, 243, 232, 0.45)",
  },
  // --color-gold-light / --color-gold / --color-gold-dark
  gold: {
    outer: "#e5ca83",
    inner: "#c7a253",
    center: "#8f6b28",
    rim: "#f2e0ae",
    glow: "rgba(199, 162, 83, 0.5)",
  },
  // --color-ember（炭火）
  ember: {
    outer: "#e8cba4",
    inner: "#cf8a5f",
    center: "#b9381e",
    rim: "#e5ca83",
    glow: "rgba(185, 56, 30, 0.45)",
  },
  // --color-red-dark（熾火の底）
  crimson: {
    outer: "#d8b7a2",
    inner: "#a55a45",
    center: "#5f0b0b",
    rim: "#c7a253",
    glow: "rgba(95, 11, 11, 0.45)",
  },
};

/**
 * 色の出現比率。
 * 背景に金の七宝地紋があるため、金の花を増やすと地紋と競合します。
 * アイボリーを主役にし、金は差し色として抑えています。
 */
const VARIANT_WEIGHTS: [FlowerVariant, number][] = [
  ["ivory", 0.42],
  ["ember", 0.24],
  ["crimson", 0.19],
  ["gold", 0.15],
];

/* ------------------------------------------------------------------
   表示数 — 画面幅ごとに明示的に定義（計算による端数ぶれを避ける）
   ------------------------------------------------------------------ */
type CountSet = { flower: number; petal: number; sparkle: number };

export const FLOWER_COUNTS: Record<DeviceTier, Record<FlowerDensity, CountSet>> = {
  desktop: {
    low: { flower: 8, petal: 8, sparkle: 10 },
    medium: { flower: 11, petal: 12, sparkle: 15 },
    high: { flower: 14, petal: 16, sparkle: 20 },
  },
  tablet: {
    low: { flower: 5, petal: 5, sparkle: 6 },
    medium: { flower: 7, petal: 7, sparkle: 9 },
    high: { flower: 9, petal: 10, sparkle: 12 },
  },
  mobile: {
    low: { flower: 3, petal: 3, sparkle: 4 },
    medium: { flower: 4, petal: 5, sparkle: 6 },
    high: { flower: 6, petal: 7, sparkle: 8 },
  },
};

/** レイヤーの割り当て比率。モバイルは手前レイヤーを持ちません。 */
const LAYER_WEIGHTS: Record<DeviceTier, [FlowerLayer, number][]> = {
  desktop: [
    ["back", 0.45],
    ["middle", 0.4],
    ["front", 0.15],
  ],
  tablet: [
    ["back", 0.5],
    ["middle", 0.42],
    ["front", 0.08],
  ],
  mobile: [
    ["back", 0.6],
    ["middle", 0.4],
    ["front", 0],
  ],
};

/** レイヤーごとの見た目と速度。手前ほど大きく速く、奥ほど小さく遅い（パララックス）。 */
const LAYER_SPEC: Record<
  FlowerLayer,
  {
    size: [number, number];
    opacity: [number, number];
    blur: [number, number];
    sway: [number, number];
    duration: [number, number];
  }
> = {
  back: {
    size: [14, 26],
    opacity: [0.12, 0.24],
    blur: [1.6, 2.6],
    sway: [2, 4],
    duration: [20, 30],
  },
  middle: {
    size: [24, 44],
    opacity: [0.2, 0.38],
    blur: [0, 0.8],
    sway: [4, 7],
    duration: [15, 23],
  },
  front: {
    size: [44, 70],
    opacity: [0.28, 0.46],
    blur: [1.2, 2.2],
    sway: [6, 10],
    duration: [11, 16],
  },
};

/** モバイルは全体を小さくして負荷とうるささを抑えます。 */
const TIER_SIZE_SCALE: Record<DeviceTier, number> = {
  desktop: 1,
  tablet: 0.85,
  mobile: 0.68,
};

/* ------------------------------------------------------------------
   疑似乱数（mulberry32）— 同じシードなら常に同じ結果
   ------------------------------------------------------------------ */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, weights: [T, number][]): T {
  const total = weights.reduce((sum, [, w]) => sum + w, 0);
  let threshold = rand() * total;
  for (const [value, weight] of weights) {
    threshold -= weight;
    if (threshold <= 0) return value;
  }
  return weights[weights.length - 1][0];
}

function between(rand: () => number, [min, max]: [number, number]): number {
  return min + rand() * (max - min);
}

/** 文字列から安定したシードを作ります（同じ引数なら常に同じ配置）。 */
function seedFrom(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * 開始X座標。
 * cta では主要ボタンの真上を避けるため、外側の帯へ寄せます。
 * front レイヤーも同様に外側へ寄せ、視線の中心を邪魔しません。
 */
function startXFor(
  rand: () => number,
  rainVariant: RainVariant,
  layer: FlowerLayer,
  index: number,
): number {
  const pushOutside = rainVariant === "cta" || layer === "front";
  if (!pushOutside) return rand() * 100;
  // 左右どちらかの外側 0–28% / 72–100% に配置
  const left = index % 2 === 0;
  return left ? rand() * 28 : 72 + rand() * 28;
}

export type BuildOptions = {
  tier: DeviceTier;
  density: FlowerDensity;
  rainVariant: RainVariant;
  showFlowers: boolean;
  showPetals: boolean;
  showSparkles: boolean;
};

/**
 * 花の設定を生成します。
 * 引数が同じなら結果も必ず同じです（サーバー / クライアントで一致）。
 */
export function buildFallingFlowers({
  tier,
  density,
  rainVariant,
  showFlowers,
  showPetals,
  showSparkles,
}: BuildOptions): FallingFlowerConfig[] {
  const counts = FLOWER_COUNTS[tier][density];
  const rand = mulberry32(seedFrom(`${tier}-${density}-${rainVariant}`));
  const sizeScale = TIER_SIZE_SCALE[tier];
  const result: FallingFlowerConfig[] = [];

  const plan: [FlowerType, number][] = [
    ["flower", showFlowers ? counts.flower : 0],
    ["petal", showPetals ? counts.petal : 0],
    ["sparkle", showSparkles ? counts.sparkle : 0],
  ];

  // モバイルは「大きな花は1〜2個まで」。大きめに割り当てた花の数を数えて抑制します。
  let largeOnMobile = 0;

  for (const [type, count] of plan) {
    for (let i = 0; i < count; i += 1) {
      // 光粒は常に奥〜中間。手前に置くと目に刺さるため。
      const layer: FlowerLayer =
        type === "sparkle"
          ? pick(rand, [
              ["back", 0.6],
              ["middle", 0.4],
            ])
          : pick(rand, LAYER_WEIGHTS[tier]);

      const spec = LAYER_SPEC[layer];
      let size = between(rand, spec.size) * sizeScale;

      // 光粒と花びらは花より小さく
      if (type === "sparkle") size *= 0.22;
      if (type === "petal") size *= 0.55;

      if (tier === "mobile" && type === "flower") {
        if (size > 26) {
          if (largeOnMobile >= 2) size = 18 + rand() * 6;
          else largeOnMobile += 1;
        }
      }

      const blurBase = between(rand, spec.blur);
      const duration = between(rand, spec.duration);

      result.push({
        id: `${type}-${layer}-${i}`,
        startX: startXFor(rand, rainVariant, layer, i),
        size: Math.round(size * 10) / 10,
        duration,
        // 負の delay で「すでに降っている途中」から始めます。
        // 正の遅延にすると、読み込み直後の数十秒が空になってしまうためです。
        delay: -rand() * duration,
        swayDistance: between(rand, spec.sway),
        rotation: (120 + rand() * 240) * (rand() > 0.5 ? 1 : -1),
        opacity: between(rand, spec.opacity),
        // 光粒はぼかさない（フィルタ数を減らす）
        blur: type === "sparkle" ? 0 : Math.round(blurBase * 10) / 10,
        layer,
        type,
        variant: pick(rand, VARIANT_WEIGHTS),
        pose: pick(rand, [
          ["open", 0.55],
          ["half", 0.25],
          ["side", 0.2],
        ]),
        petalCount: pick(rand, [
          [1, 0.6],
          [2, 0.25],
          [3, 0.15],
        ]) as 1 | 2 | 3,
        hasLift: rand() < 0.32,
      });
    }
  }

  return result;
}

/* ------------------------------------------------------------------
   キーフレーム — 直線落下にせず、風にあおられる軌跡を作ります
   ------------------------------------------------------------------ */
export type FlowerKeyframes = {
  x: string[];
  y: string[];
  rotate: number[];
  opacity: number[];
  times: number[];
};

export function buildKeyframes(config: FallingFlowerConfig): FlowerKeyframes {
  const s = config.swayDistance;
  const r = config.rotation;
  const o = config.opacity;

  if (config.hasLift) {
    // 途中で一度風に持ち上げられてから、また落ちていく
    return {
      x: [`0vw`, `${s}vw`, `${-s * 0.55}vw`, `${s * 0.5}vw`, `${-s * 0.25}vw`],
      y: ["-15%", "22%", "36%", "72%", "118%"],
      rotate: [0, r * 0.22, r * 0.38, r * 0.72, r],
      opacity: [0, o, o, o * 0.92, 0],
      times: [0, 0.1, 0.42, 0.78, 1],
    };
  }

  return {
    x: [`0vw`, `${s * 0.85}vw`, `${-s * 0.7}vw`, `${s * 0.4}vw`],
    y: ["-15%", "28%", "64%", "118%"],
    rotate: [0, r * 0.35, r * 0.68, r],
    opacity: [0, o, o, 0],
    times: [0, 0.1, 0.84, 1],
  };
}

/**
 * prefers-reduced-motion 時に表示する静止装飾。
 * 動きは止めますが、デザインが寂しくならないよう数輪だけ残します。
 */
export function buildStaticFlowers(tier: DeviceTier): FallingFlowerConfig[] {
  const all = buildFallingFlowers({
    tier,
    density: "low",
    rainVariant: "section",
    showFlowers: true,
    showPetals: true,
    showSparkles: false,
  });
  return all.filter((f) => f.type === "flower").slice(0, tier === "mobile" ? 2 : 4);
}
