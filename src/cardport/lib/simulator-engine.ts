/**
 * シミュレーターの計算。
 *
 * すべて純関数です。テストで数値を固定できるようにしています。
 * 条件付きの最大還元率は使わず、基本還元率で計算します（過大な期待値を出さないため）。
 */
import type { Card } from "@/cardport/data/types";

export type SpendInput = Record<string, number>;

/** 月額の合計 */
export function totalMonthlySpend(spend: SpendInput): number {
  return Object.values(spend).reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
}

export type AnnualResult = {
  annualSpend: number;
  annualPoints: number;
  /** 1ポイント＝1円換算の還元額 */
  annualValue: number;
  annualFee: number;
  /** 年会費を差し引いた実質メリット */
  netValue: number;
};

export function simulateAnnual(card: Card, spend: SpendInput, effectiveFee?: number): AnnualResult {
  const annualSpend = totalMonthlySpend(spend) * 12;
  const annualPoints = Math.round((annualSpend * card.baseRate) / 100);
  const annualFee = effectiveFee ?? card.annualFee;
  return {
    annualSpend,
    annualPoints,
    annualValue: annualPoints,
    annualFee,
    netValue: annualPoints - annualFee,
  };
}

/** 年会費を還元だけで取り戻すのに必要な年間利用額。無料カードは 0 */
export function breakEvenSpend(card: Card): number {
  if (card.annualFee === 0) return 0;
  if (card.baseRate <= 0) return Infinity;
  return Math.ceil(card.annualFee / (card.baseRate / 100));
}

/** 年間マイル。移行に対応しないカードは 0 */
export function simulateMiles(card: Card, annualSpend: number): number {
  if (card.mileRate <= 0) return 0;
  return Math.round(((annualSpend * card.baseRate) / 100) * card.mileRate);
}

/** ラウンジ1回あたりの想定価値（円）。前提として画面に明示します */
export const LOUNGE_VALUE_PER_VISIT = 1100;
/** 旅行1回あたりの想定保険料（円）。個別に旅行保険を契約した場合の概算です */
export const TRAVEL_INSURANCE_VALUE_PER_TRIP = 3000;

export type TravelBenefitResult = {
  loungeValue: number;
  insuranceValue: number;
  annualFee: number;
  netValue: number;
};

export function simulateTravelBenefit(
  card: Card,
  loungeVisits: number,
  trips: number,
): TravelBenefitResult {
  const loungeValue = card.lounges.ja.length > 0 ? loungeVisits * LOUNGE_VALUE_PER_VISIT : 0;
  const insuranceValue =
    card.travelInsuranceOverseas.amount > 0 ? trips * TRAVEL_INSURANCE_VALUE_PER_TRIP : 0;
  return {
    loungeValue,
    insuranceValue,
    annualFee: card.annualFee,
    netValue: loungeValue + insuranceValue - card.annualFee,
  };
}

/** 海外事務手数料（円） */
export function simulateFxFee(card: Card, overseasSpend: number): number {
  return Math.round((overseasSpend * card.fxFee) / 100);
}

export type MultiCardAssignment = {
  categoryId: string;
  card: Card;
  monthlySpend: number;
  annualPoints: number;
};

/**
 * 項目ごとに最も還元率の高いカードを割り当てます。
 * カテゴリ特化の還元率は条件が複雑なため、ここでは基本還元率のみで判定します。
 */
export function simulateMultiCard(
  candidates: Card[],
  spend: SpendInput,
): { assignments: MultiCardAssignment[]; totalPoints: number; totalFee: number; netValue: number } {
  if (candidates.length === 0) {
    return { assignments: [], totalPoints: 0, totalFee: 0, netValue: 0 };
  }

  const assignments: MultiCardAssignment[] = [];
  const usedCards = new Set<string>();

  for (const [categoryId, monthlySpend] of Object.entries(spend)) {
    if (!monthlySpend) continue;
    const best = [...candidates].sort((a, b) => {
      if (b.baseRate !== a.baseRate) return b.baseRate - a.baseRate;
      if (a.annualFee !== b.annualFee) return a.annualFee - b.annualFee;
      return a.slug.localeCompare(b.slug);
    })[0];
    usedCards.add(best.id);
    assignments.push({
      categoryId,
      card: best,
      monthlySpend,
      annualPoints: Math.round((monthlySpend * 12 * best.baseRate) / 100),
    });
  }

  const totalPoints = assignments.reduce((sum, entry) => sum + entry.annualPoints, 0);
  const totalFee = candidates
    .filter((card) => usedCards.has(card.id))
    .reduce((sum, card) => sum + card.annualFee, 0);

  return { assignments, totalPoints, totalFee, netValue: totalPoints - totalFee };
}

/** ポイント交換先。1ポイントあたりの円換算価値 */
export const exchangeOptions = [
  { id: "cash", label: { ja: "現金・キャッシュバック", en: "Cash / statement credit" }, rate: 1.0 },
  { id: "gift", label: { ja: "ギフト券", en: "Gift cards" }, rate: 1.0 },
  {
    id: "shopping",
    label: { ja: "提携ショップでの利用", en: "Spend at partner stores" },
    rate: 1.0,
  },
  {
    id: "partner-point",
    label: { ja: "他社ポイントへ移行", en: "Transfer to another points programme" },
    rate: 0.9,
  },
  {
    id: "mile-low",
    label: { ja: "マイルへ移行（2ポイント＝1マイル）", en: "Miles at 2 points = 1 mile" },
    rate: 0.5,
  },
  {
    id: "mile-high",
    label: { ja: "マイルへ移行（1ポイント＝1マイル）", en: "Miles at 1 point = 1 mile" },
    rate: 1.0,
  },
  { id: "goods", label: { ja: "景品との交換", en: "Merchandise" }, rate: 0.6 },
] as const;

export function simulateExchange(points: number, rate: number): number {
  return Math.round(points * rate);
}
