/**
 * ランキングの算出。
 *
 * ■ 方針
 *   順位は「公開している評価基準」から機械的に計算します。
 *   広告単価は一切入力に使いません（`affiliate.ts` とこのモジュールは分離しています）。
 *   カテゴリごとに重みを変え、その重みも画面に表示します。
 */
import type { Card, CardCategoryId } from "@/cardport/data/types";
import type { LocalizedText } from "@/cardport/i18n/localized";

export type ScoreAxis = keyof Card["scores"];

export const scoreAxes: ScoreAxis[] = [
  "reward",
  "fee",
  "benefit",
  "insurance",
  "usability",
  "trust",
];

export const axisLabels: Record<ScoreAxis, LocalizedText> = {
  reward: { ja: "還元率", en: "Reward rate" },
  fee: { ja: "年会費の負担", en: "Cost of holding" },
  benefit: { ja: "特典・優待", en: "Benefits" },
  insurance: { ja: "保険・補償", en: "Insurance" },
  usability: { ja: "使いやすさ", en: "Ease of use" },
  trust: { ja: "発行会社の信頼性", en: "Issuer trust" },
};

export const axisDefinitions: Record<ScoreAxis, LocalizedText> = {
  reward: {
    ja: "基本還元率と、条件付きで到達できる最大還元率の両方を見ます。到達条件が厳しいほど加点を抑えます。",
    en: "We look at both the base rate and the achievable maximum, discounting rates that are hard to reach.",
  },
  fee: {
    ja: "年会費の金額と、無料条件の達成しやすさを見ます。無条件で無料のカードがもっとも高くなります。",
    en: "The fee itself plus how attainable any waiver is. Unconditionally free cards score highest.",
  },
  benefit: {
    ja: "ラウンジ・優待・付帯サービスの範囲を見ます。使う機会が限られる特典は加点を抑えます。",
    en: "Breadth of lounges, perks and services, discounting benefits few people can use.",
  },
  insurance: {
    ja: "旅行保険・ショッピング保険の補償額と、自動付帯か利用付帯かを見ます。",
    en: "Cover amounts for travel and purchase protection, and whether cover is automatic or usage-based.",
  },
  usability: {
    ja: "発行スピード、対応する決済手段、アプリの機能を見ます。",
    en: "Issuing speed, supported payment methods and app capability.",
  },
  trust: {
    ja: "発行会社の事業基盤と、情報開示の明確さを見ます。",
    en: "The issuer's operating base and how clearly it discloses terms.",
  },
};

/** カテゴリ別の重み。合計が 1 になるよう正規化して使います */
const categoryWeights: Partial<
  Record<CardCategoryId | "overall", Partial<Record<ScoreAxis, number>>>
> = {
  overall: { reward: 3, fee: 2.5, benefit: 2, insurance: 1.5, usability: 2, trust: 2 },
  "free-annual-fee": { fee: 4, reward: 3, usability: 2, trust: 1.5, benefit: 1, insurance: 0.5 },
  "high-reward": { reward: 5, fee: 2, usability: 1.5, trust: 1.5, benefit: 1, insurance: 0.5 },
  mile: { reward: 3, benefit: 3, insurance: 2, fee: 1.5, usability: 1.5, trust: 1.5 },
  travel: { insurance: 4, benefit: 3, reward: 1.5, fee: 1.5, usability: 1.5, trust: 1.5 },
  gold: { benefit: 3, insurance: 3, reward: 2, fee: 2, usability: 1.5, trust: 1.5 },
  platinum: { benefit: 4, insurance: 3, trust: 2, reward: 1.5, usability: 1, fee: 0.5 },
  black: { benefit: 4.5, insurance: 3, trust: 2.5, reward: 1, usability: 1, fee: 0.2 },
  business: { usability: 3.5, benefit: 2.5, fee: 2.5, reward: 2, trust: 2, insurance: 1 },
  "sole-proprietor": { fee: 3.5, usability: 3, reward: 2, trust: 2, benefit: 1.5, insurance: 0.5 },
  student: { fee: 4, reward: 3, usability: 2, trust: 1.5, benefit: 1, insurance: 0.5 },
  beginner: { fee: 4, usability: 3, reward: 2.5, trust: 2, benefit: 1, insurance: 0.5 },
  overseas: { insurance: 3, reward: 2.5, benefit: 2, usability: 2, trust: 1.5, fee: 1 },
  "online-shopping": { reward: 4, usability: 3, fee: 2, trust: 1.5, benefit: 1, insurance: 0.5 },
  "convenience-store": {
    reward: 4.5,
    fee: 3,
    usability: 2,
    trust: 1,
    benefit: 0.5,
    insurance: 0.2,
  },
  gas: { reward: 4, fee: 3, usability: 2, benefit: 1, trust: 1, insurance: 0.5 },
  subscription: { reward: 4, usability: 3, fee: 2.5, benefit: 1, trust: 1, insurance: 0.3 },
  crypto: { reward: 3.5, fee: 2.5, usability: 2, trust: 3, benefit: 1, insurance: 0.3 },
};

export function getWeights(category: CardCategoryId | "overall"): Record<ScoreAxis, number> {
  const raw = categoryWeights[category] ?? categoryWeights.overall!;
  const total = scoreAxes.reduce((sum, axis) => sum + (raw[axis] ?? 0), 0) || 1;
  return scoreAxes.reduce(
    (acc, axis) => {
      acc[axis] = (raw[axis] ?? 0) / total;
      return acc;
    },
    {} as Record<ScoreAxis, number>,
  );
}

/** 0〜5 の総合スコア。小数第2位で丸めます */
export function computeScore(card: Card, category: CardCategoryId | "overall" = "overall"): number {
  const weights = getWeights(category);
  const raw = scoreAxes.reduce((sum, axis) => sum + card.scores[axis] * weights[axis], 0);
  return Math.round(raw * 100) / 100;
}

export type RankedCard = { card: Card; score: number; rank: number };

/**
 * カテゴリ内のランキング。
 * 同点は「年会費が安い順 → スラッグ順」で決めます（毎回同じ順序になるようにするため）。
 */
export function rankCards(
  list: Card[],
  category: CardCategoryId | "overall" = "overall",
  limit?: number,
): RankedCard[] {
  const scored = list
    .map((card) => ({ card, score: computeScore(card, category) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.card.annualFee !== b.card.annualFee) return a.card.annualFee - b.card.annualFee;
      return a.card.slug.localeCompare(b.card.slug);
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return typeof limit === "number" ? scored.slice(0, limit) : scored;
}
