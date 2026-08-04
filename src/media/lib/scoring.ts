/**
 * 画像候補のスコアリング。
 *
 * ■ 「装飾のために関連の薄い画像を貼る」ことをしないための仕組み
 *   関連性スコアが閾値に届かない候補は、そもそも採用しません。
 *   採用できる画像が無い場合は、フォールバックの装飾表現を使います。
 */
import { slotSizes, type ImageSlot, type WikimediaAsset } from "../types";
import { getLicense } from "./license";

export type ScoreInput = {
  /** ページのタイトル・カテゴリ・キーワード */
  pageTitle: string;
  pageKeywords: string[];
  /** 掲載枠 */
  slot: ImageSlot;
  /** ページの Wikidata エンティティ（分かる場合） */
  wikidataEntityId?: string | null;
};

export type ScoredCandidate = {
  asset: WikimediaAsset;
  score: number;
  /** 内訳。管理画面で採用理由を説明するために保持します */
  breakdown: Record<string, number>;
};

/** これを下回る候補は採用しません */
export const RELEVANCE_THRESHOLD = 45;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9぀-ヿ一-鿿]+/)
    .filter((token) => token.length >= 2);
}

function overlap(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const set = new Set(b);
  const hits = a.filter((token) => set.has(token)).length;
  return hits / a.length;
}

/**
 * 候補を採点します（0〜100）。
 *
 * 優先順位（仕様どおり）:
 *   1. ページタイトルと完全一致
 *   2. Wikidata エンティティ一致
 *   3. Wikipedia 代表画像
 *   4. 高解像度
 *   5. カテゴリとの関連
 *   6. 汎用的な関連
 */
export function scoreCandidate(asset: WikimediaAsset, input: ScoreInput): ScoredCandidate {
  const breakdown: Record<string, number> = {};

  const assetTokens = tokenize(`${asset.title} ${asset.fileName} ${asset.description ?? ""}`);
  const titleTokens = tokenize(input.pageTitle);
  const keywordTokens = input.pageKeywords.flatMap(tokenize);

  // 1. タイトル一致（最大 40）
  const titleMatch = overlap(titleTokens, assetTokens);
  breakdown.title = Math.round(titleMatch * 40);

  // 2. Wikidata 一致（30）
  breakdown.wikidata =
    input.wikidataEntityId && asset.wikidataEntityId === input.wikidataEntityId ? 30 : 0;

  // 3. キーワード一致（最大 20）
  breakdown.keywords = Math.round(overlap(keywordTokens, assetTokens) * 20);

  // 4. 解像度（最大 15）。必要幅の2倍で満点、下回ると0
  const required = slotSizes[input.slot].minWidth;
  breakdown.resolution =
    asset.width >= required
      ? Math.min(15, Math.round(((asset.width - required) / required) * 15) + 5)
      : 0;

  // 5. 縦横比の相性（最大 10）
  const targetRatio = slotSizes[input.slot].width / slotSizes[input.slot].height;
  const ratioGap = Math.abs(asset.aspectRatio - targetRatio) / targetRatio;
  breakdown.aspect = Math.max(0, Math.round((1 - Math.min(1, ratioGap)) * 10));

  // 6. ライセンスの扱いやすさ（最大 10）。PD/CC0 を優先します
  const license = getLicense(asset.licenseCode);
  breakdown.license = license.isPublicDomain ? 10 : license.shareAlikeRequired ? 4 : 7;

  // 7. メタデータの完全性（最大 5）
  breakdown.metadata =
    (asset.authorName ? 2 : 0) + (asset.sourceUrl ? 1 : 0) + (asset.description ? 2 : 0);

  // 追加権利のリスクは減点（最大 -25）
  breakdown.riskPenalty = -Math.min(25, asset.rightsRisks.length * 12);

  const score = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  return { asset, score: Math.max(0, Math.min(100, score)), breakdown };
}

/**
 * 最適な1枚を選びます。
 * 閾値に届く候補が無ければ null を返し、呼び出し側はフォールバックを使います。
 */
export function pickBestCandidate(
  assets: WikimediaAsset[],
  input: ScoreInput,
): ScoredCandidate | null {
  const scored = assets
    .map((asset) => scoreCandidate(asset, input))
    .filter((candidate) => candidate.score >= RELEVANCE_THRESHOLD)
    .sort((a, b) => b.score - a.score || a.asset.fileName.localeCompare(b.asset.fileName));

  return scored[0] ?? null;
}
