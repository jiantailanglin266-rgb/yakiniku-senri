/**
 * 画像候補のスコアリングと選定。
 *
 * ■ 装飾目的で無関係な画像を載せない
 *   関連性のしきい値を下回った候補は、点数が高くても採用しません。
 *   「何も出さない」ほうが、無関係な画像を出すより品質が高いという判断です。
 */
import type { WikimediaAsset } from "./types";
import { evaluateAsset } from "./licenses";

/** 用途ごとの必要解像度。元画像を引き伸ばさないための下限です。 */
export const slotRequirements = {
  hero: { minWidth: 1600, minHeight: 900, preferredRatio: 16 / 9 },
  card: { minWidth: 1000, minHeight: 560, preferredRatio: 16 / 9 },
  square: { minWidth: 700, minHeight: 700, preferredRatio: 1 },
  portrait: { minWidth: 700, minHeight: 875, preferredRatio: 4 / 5 },
  ogp: { minWidth: 1200, minHeight: 630, preferredRatio: 1200 / 630 },
  thumbnail: { minWidth: 480, minHeight: 270, preferredRatio: 16 / 9 },
} as const;

export type SlotKind = keyof typeof slotRequirements;

export type Candidate = {
  asset: WikimediaAsset;
  /** 関連性の根拠 */
  relevance: RelevanceSource;
};

/** 関連性の出どころ。上ほど強い根拠です。 */
export type RelevanceSource =
  | "exact_title" // ページタイトルと完全一致
  | "wikidata_entity" // Wikidata エンティティの代表画像
  | "wikipedia_lead" // Wikipedia 記事の代表画像
  | "commons_high_res" // Commons の高解像度画像
  | "category" // カテゴリ一致
  | "generic"; // 汎用

const relevanceScore: Record<RelevanceSource, number> = {
  exact_title: 100,
  wikidata_entity: 90,
  wikipedia_lead: 70,
  commons_high_res: 45,
  category: 35,
  generic: 10,
};

/** これを下回る候補は採用しません（無関係な画像の自動掲載を防ぐため） */
export const RELEVANCE_THRESHOLD = 35;

export type ScoredCandidate = Candidate & {
  score: number;
  /** 不採用の理由。管理画面に出します */
  rejections: string[];
};

/**
 * 候補を採点します。
 *
 * 関連性を最も重く、次に解像度と構図、最後にメタデータの完全性を見ます。
 * ライセンス不適合は加点対象ではなく即座に失格です。
 */
export function scoreCandidate(candidate: Candidate, slot: SlotKind): ScoredCandidate {
  const { asset } = candidate;
  const requirement = slotRequirements[slot];
  const rejections: string[] = [];

  // --- 失格判定 ---
  const decision = evaluateAsset(asset);
  if (!decision.allowed && asset.verificationStatus !== "approved") {
    // 未承認は「不採用」ではなく「未承認」。理由はそのまま持ち回ります
    rejections.push(...decision.reasons);
  }

  const base = relevanceScore[candidate.relevance];
  if (base < RELEVANCE_THRESHOLD) {
    rejections.push("ページ内容との関連性が低すぎます");
  }

  if (asset.width < requirement.minWidth || asset.height < requirement.minHeight) {
    rejections.push(
      `解像度が不足しています（${asset.width}×${asset.height} < ${requirement.minWidth}×${requirement.minHeight}）`,
    );
  }

  // --- 加点 ---
  let score = base;

  // 解像度（必要量を超えるほど加点。ただし上限あり）
  const pixels = asset.width * asset.height;
  const required = requirement.minWidth * requirement.minHeight;
  if (required > 0) {
    score += Math.min(25, Math.round((pixels / required) * 8));
  }

  // 縦横比が用途に近いほど加点（トリミングで被写体が切れにくい）
  const ratioGap = Math.abs(asset.aspectRatio - requirement.preferredRatio);
  score += Math.max(0, 20 - Math.round(ratioGap * 20));

  // メタデータの完全性
  if (asset.authorName) score += 8;
  if (asset.sourceUrl) score += 4;
  if (asset.description) score += 4;
  if (asset.licenseUrl) score += 4;

  // 追加権利のリスクは減点（0点にはせず、人間の確認へ回す）
  score -= asset.rightsRisks.length * 12;

  // パブリックドメインは運用が軽いので優遇
  if (asset.isPublicDomain) score += 10;

  return { ...candidate, score: Math.max(0, score), rejections };
}

/**
 * 最適な候補を1つ選びます。
 *
 * 採用できる候補が無ければ null を返します。
 * 呼び出し側はフォールバック表示に切り替えてください（無理に画像を出さない）。
 */
export function selectBest(candidates: Candidate[], slot: SlotKind): ScoredCandidate | null {
  const scored = candidates
    .map((candidate) => scoreCandidate(candidate, slot))
    .filter((candidate) => candidate.rejections.length === 0)
    .sort((a, b) => b.score - a.score);

  return scored[0] ?? null;
}

/** 承認済みで、かつこのスロットに使える画像だけを返します */
export function publishable(assets: WikimediaAsset[], slot: SlotKind): WikimediaAsset[] {
  const requirement = slotRequirements[slot];
  return assets.filter((asset) => {
    if (!evaluateAsset(asset).allowed) return false;
    return asset.width >= requirement.minWidth && asset.height >= requirement.minHeight;
  });
}
