/**
 * 診断エンジン。
 *
 * ■ 決定的であること
 *   同じ回答からは必ず同じ結果が出ます。乱数もA/Bも入れません。
 *   「なぜこのカードなのか」を結果画面で説明できる必要があるためです。
 *
 * ■ 保証しないこと
 *   審査の通過・発行・限度額は一切保証しません。
 *   ここで計算しているのは「入力条件と掲載データの一致度」だけです。
 */
import { cards } from "@/cardport/data/cards";
import type { Card, Diagnosis, DiagnosisAxis, DiagnosisOption } from "@/cardport/data/types";
import type { LocalizedText } from "@/cardport/i18n/localized";

export type Answers = Record<string, string>;

export type DiagnosisMatch = {
  card: Card;
  /** 0〜100 の一致度 */
  match: number;
  /** 加点の理由（表示用のキー） */
  reasons: LocalizedText[];
};

/** カードが各軸でどれだけ強いかを 0〜1 で表します */
function axisStrength(card: Card): Record<DiagnosisAxis, number> {
  const hasLounge = card.lounges.ja.length > 0;
  const insuranceTotal =
    card.travelInsuranceOverseas.amount +
    card.travelInsuranceDomestic.amount +
    card.shoppingInsurance.amount;

  return {
    reward: clamp(card.maxRate / 7),
    fee: card.annualFee === 0 ? 1 : clamp(1 - card.annualFee / 55000),
    mile: clamp(card.mileRate),
    travel: clamp((hasLounge ? 0.5 : 0) + (card.travelInsuranceOverseas.amount > 0 ? 0.5 : 0)),
    status: clamp(rankWeight(card.rank)),
    insurance: clamp(insuranceTotal / 250000000),
    online: clamp((card.categories.includes("online-shopping") ? 0.6 : 0) + card.baseRate / 3),
    daily: clamp(
      (card.categories.includes("convenience-store") ? 0.6 : 0) +
        (card.annualFee === 0 ? 0.3 : 0) +
        card.baseRate / 5,
    ),
    business: clamp(
      card.business ? 0.6 + Math.min(card.business.accountingIntegrations.length, 4) / 10 : 0,
    ),
    beginner: clamp((card.annualFee === 0 ? 0.6 : 0) + (card.issueDays <= 3 ? 0.3 : 0)),
  };
}

function rankWeight(rank: Card["rank"]): number {
  switch (rank) {
    case "black":
      return 1;
    case "platinum":
      return 0.85;
    case "gold":
      return 0.6;
    case "business":
      return 0.5;
    default:
      return 0.25;
  }
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function poolFor(diagnosis: Diagnosis): Card[] {
  const { categories, ranks } = diagnosis.pool;
  return cards.filter((card) => {
    if (categories && !categories.some((category) => card.categories.includes(category)))
      return false;
    if (ranks && !ranks.includes(card.rank)) return false;
    return true;
  });
}

function passesRequirements(card: Card, option: DiagnosisOption): boolean {
  const requires = option.requires;
  if (!requires) return true;
  if (requires.maxAnnualFee !== undefined && card.annualFee > requires.maxAnnualFee) return false;
  if (requires.minMileRate !== undefined && card.mileRate < requires.minMileRate) return false;
  if (requires.lounge === true && card.lounges.ja.length === 0) return false;
  if (requires.ranks && !requires.ranks.includes(card.rank)) return false;
  if (
    requires.categories &&
    !requires.categories.some((category) => card.categories.includes(category))
  ) {
    return false;
  }
  if (
    requires.eligibility &&
    !requires.eligibility.some((value) => card.eligibility.includes(value))
  ) {
    return false;
  }
  return true;
}

/**
 * 診断を実行します。
 *
 * 必須条件（`requires`）を満たさないカードは減点で扱い、除外しきりません。
 * すべて除外して「該当なし」になるより、条件のずれを明示して提示するほうが役に立つためです。
 */
export function runDiagnosis(diagnosis: Diagnosis, answers: Answers, limit = 3): DiagnosisMatch[] {
  const pool = poolFor(diagnosis);
  if (pool.length === 0) return [];

  const weights: Partial<Record<DiagnosisAxis, number>> = {};
  const selected: DiagnosisOption[] = [];

  for (const question of diagnosis.questions) {
    const answer = answers[question.id];
    if (!answer) continue;
    const option = question.options.find((candidate) => candidate.id === answer);
    if (!option) continue;
    selected.push(option);
    for (const [axis, value] of Object.entries(option.weights)) {
      const key = axis as DiagnosisAxis;
      weights[key] = (weights[key] ?? 0) + (value ?? 0);
    }
  }

  const totalWeight = Object.values(weights).reduce((sum, value) => sum + value, 0);
  if (totalWeight === 0) {
    return pool.slice(0, limit).map((card) => ({ card, match: 0, reasons: [] }));
  }

  const scored = pool.map((card) => {
    const strength = axisStrength(card);
    let raw = 0;
    const reasons: LocalizedText[] = [];

    for (const [axis, weight] of Object.entries(weights)) {
      const key = axis as DiagnosisAxis;
      const contribution = (strength[key] ?? 0) * (weight ?? 0);
      raw += contribution;
      if ((weight ?? 0) >= 3 && (strength[key] ?? 0) >= 0.6) {
        reasons.push(axisReason[key]);
      }
    }

    // 必須条件を外したぶんだけ減点します（0 にはしません）
    const misses = selected.filter((option) => !passesRequirements(card, option)).length;
    const penalty = Math.min(0.45, misses * 0.15);
    const match = Math.round(clamp((raw / totalWeight) * (1 - penalty)) * 100);

    return { card, match, reasons: dedupe(reasons).slice(0, 3) };
  });

  return scored
    .sort((a, b) => {
      if (b.match !== a.match) return b.match - a.match;
      if (a.card.annualFee !== b.card.annualFee) return a.card.annualFee - b.card.annualFee;
      return a.card.slug.localeCompare(b.card.slug);
    })
    .slice(0, limit);
}

function dedupe(list: LocalizedText[]): LocalizedText[] {
  const seen = new Set<string>();
  return list.filter((item) => {
    if (seen.has(item.ja)) return false;
    seen.add(item.ja);
    return true;
  });
}

const axisReason: Record<DiagnosisAxis, LocalizedText> = {
  reward: {
    ja: "回答で重視した「還元率」が高い水準にあります",
    en: "It scores highly on the reward rate you prioritised",
  },
  fee: {
    ja: "年会費の負担が小さく、条件に合っています",
    en: "The cost of holding it fits the budget you chose",
  },
  mile: {
    ja: "マイル移行のレートが条件に合っています",
    en: "The mile transfer rate matches what you asked for",
  },
  travel: {
    ja: "旅行時の保険とラウンジが条件を満たします",
    en: "Travel insurance and lounge access meet your conditions",
  },
  status: {
    ja: "上位ランクで、優待の範囲が広いカードです",
    en: "A higher tier with a broad set of perks",
  },
  insurance: {
    ja: "補償額が大きく、保険重視の回答に合います",
    en: "Large cover amounts, matching your focus on insurance",
  },
  online: {
    ja: "ネット利用での還元条件が整っています",
    en: "Well set up for rewards on online spending",
  },
  daily: {
    ja: "日常の買い物で還元率が上がる条件があります",
    en: "Its rate rises on everyday shopping",
  },
  business: {
    ja: "経費管理・会計連携の条件を満たします",
    en: "Meets your expense management and accounting needs",
  },
  beginner: {
    ja: "はじめての1枚として扱いやすい条件です",
    en: "Straightforward enough for a first card",
  },
};

/**
 * 年間獲得ポイントの概算。
 * 基本還元率だけで計算し、条件付きの最大還元率は使いません（過大表示を避けるため）。
 */
export function estimateAnnualPoints(card: Card, monthlySpend: number): number {
  return Math.round(((monthlySpend * 12 * card.baseRate) / 100) * 10) / 10;
}

/** 回答をURLに載せるための短い文字列。共有リンクとOGPに使います */
export function encodeAnswers(diagnosis: Diagnosis, answers: Answers): string {
  return diagnosis.questions
    .map((question) => {
      const answer = answers[question.id];
      const index = question.options.findIndex((option) => option.id === answer);
      return index >= 0 ? String(index) : "-";
    })
    .join("");
}

export function decodeAnswers(diagnosis: Diagnosis, code: string): Answers {
  const answers: Answers = {};
  diagnosis.questions.forEach((question, position) => {
    const char = code[position];
    if (!char || char === "-") return;
    const option = question.options[Number(char)];
    if (option) answers[question.id] = option.id;
  });
  return answers;
}
