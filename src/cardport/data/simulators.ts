/**
 * シミュレーターの定義。
 *
 * 計算そのものは `lib/simulator-engine.ts` にあります。
 * ここには「前提条件」と「計算方法」を必ず書きます。
 * 数字だけを出して前提を書かないと、読者が自分の状況に当てはめられません。
 */
import type { Simulator } from "./types";

export const simulators: Simulator[] = [
  {
    id: "annual-points",
    slug: "annual-points",
    title: { ja: "年間ポイント還元シミュレーター", en: "Annual rewards simulator" },
    lead: {
      ja: "毎月の支出を項目ごとに入力すると、年間で貯まるポイントの目安を計算します。",
      en: "Enter your monthly spending by category to estimate the points you would earn in a year.",
    },
    assumptions: {
      ja: [
        "還元率は当サイト掲載の基本還元率を使います（条件付きの最大還元率は使いません）",
        "1ポイント＝1円として換算します",
        "キャンペーンによる上乗せは含みません",
        "ポイントの有効期限内にすべて使い切る前提です",
      ],
      en: [
        "We use the base rate published on this site, not the conditional maximum",
        "One point is treated as ¥1",
        "Campaign bonuses are excluded",
        "We assume you redeem all points before they expire",
      ],
    },
    method: {
      ja: "年間ポイント ＝ 各項目の月額 × 12 × 基本還元率 ÷ 100 の合計",
      en: "Annual points = sum over categories of (monthly amount × 12 × base rate ÷ 100)",
    },
    accent: "cyan",
  },
  {
    id: "card-compare",
    slug: "card-compare",
    title: { ja: "カード別獲得ポイント比較", en: "Points by card" },
    lead: {
      ja: "同じ支出を複数のカードで比べ、獲得ポイントの差を確認します。",
      en: "Compare what the same spending earns across several cards.",
    },
    assumptions: {
      ja: ["すべてのカードで同じ支出額を前提とします", "年会費は差し引いた実質額も併記します"],
      en: [
        "Assumes identical spending on every card",
        "Shows the net figure after the annual fee as well",
      ],
    },
    method: {
      ja: "実質メリット ＝ 年間ポイント － 年会費",
      en: "Net value = annual points − annual fee",
    },
    accent: "violet",
  },
  {
    id: "fee-breakeven",
    slug: "fee-breakeven",
    title: { ja: "年会費回収シミュレーター", en: "Annual fee break-even" },
    lead: {
      ja: "年会費を還元だけで取り戻すには、年間いくら使う必要があるかを計算します。",
      en: "How much you must spend a year for rewards alone to cover the fee.",
    },
    assumptions: {
      ja: [
        "還元のみで回収する前提です（保険・ラウンジの価値は含みません）",
        "基本還元率で計算します",
      ],
      en: ["Rewards only — insurance and lounge value are excluded", "Calculated at the base rate"],
    },
    method: {
      ja: "必要年間利用額 ＝ 年会費 ÷（基本還元率 ÷ 100）",
      en: "Required annual spend = annual fee ÷ (base rate ÷ 100)",
    },
    accent: "gold",
  },
  {
    id: "mile",
    slug: "mile",
    title: { ja: "マイル獲得シミュレーター", en: "Miles simulator" },
    lead: {
      ja: "支出額から、年間で貯まるマイル数の目安を計算します。",
      en: "Estimate the miles your spending would earn in a year.",
    },
    assumptions: {
      ja: [
        "掲載している移行レートで計算します",
        "移行手数料は含みません（カードによっては別途かかります）",
        "特典航空券の必要マイル数は航空会社の規定により変わります",
      ],
      en: [
        "Uses the transfer rate published here",
        "Transfer fees are excluded and may apply on some cards",
        "Award chart requirements are set by the airline and can change",
      ],
    },
    method: {
      ja: "年間マイル ＝ 年間利用額 × 基本還元率 ÷ 100 × 移行レート",
      en: "Annual miles = annual spend × base rate ÷ 100 × transfer rate",
    },
    accent: "electric",
  },
  {
    id: "travel-benefit",
    slug: "travel-benefit",
    title: { ja: "旅行特典価値シミュレーター", en: "Travel benefit value" },
    lead: {
      ja: "ラウンジ利用と保険を金額に換算し、年会費と比べます。",
      en: "Converts lounge use and insurance into a figure you can weigh against the fee.",
    },
    assumptions: {
      ja: [
        "ラウンジ1回の価値を1,100円として換算します（有料ラウンジの一般的な料金水準を仮置きした数値です）",
        "保険の価値は、同等の旅行保険を個別契約した場合の概算です",
        "実際の価値は利用状況によって大きく変わります",
      ],
      en: [
        "One lounge visit is valued at ¥1,100 as a placeholder based on typical paid-lounge pricing",
        "Insurance value approximates buying an equivalent standalone travel policy",
        "Real-world value varies widely with how you travel",
      ],
    },
    method: {
      ja: "特典価値 ＝ ラウンジ回数 × 1,100円 ＋ 旅行回数 × 想定保険料 － 年会費",
      en: "Benefit value = lounge visits × ¥1,100 + trips × assumed premium − annual fee",
    },
    accent: "violet",
  },
  {
    id: "business-expense",
    slug: "business-expense",
    title: { ja: "法人経費ポイントシミュレーター", en: "Business expense rewards" },
    lead: {
      ja: "年間経費をカード払いに寄せた場合の還元額を計算します。",
      en: "What routing your annual expenses through a card would return.",
    },
    assumptions: {
      ja: [
        "すべての経費がカード決済可能である前提です（実際には振込のみの支払先があります）",
        "還元されたポイントの会計・税務上の扱いは税理士にご確認ください",
      ],
      en: [
        "Assumes every expense can be paid by card, which is rarely true in practice",
        "Consult a tax professional on how rewards are treated for accounting and tax",
      ],
    },
    method: {
      ja: "年間還元額 ＝ 年間経費 × 基本還元率 ÷ 100 － 年会費",
      en: "Annual value = annual expenses × base rate ÷ 100 − annual fee",
    },
    accent: "emerald",
  },
  {
    id: "switch-benefit",
    slug: "switch-benefit",
    title: { ja: "カード切替メリットシミュレーター", en: "Switching benefit" },
    lead: {
      ja: "いま使っているカードから乗り換えた場合の差額を計算します。",
      en: "The yearly difference if you moved from your current card.",
    },
    assumptions: {
      ja: ["支出額は変わらない前提です", "解約による特典の失効は考慮していません"],
      en: [
        "Assumes your spending stays the same",
        "Does not account for perks lost when closing the old card",
      ],
    },
    method: {
      ja: "差額 ＝（新カードの実質メリット）－（現カードの実質メリット）",
      en: "Difference = new card net value − current card net value",
    },
    accent: "cyan",
  },
  {
    id: "multi-card",
    slug: "multi-card",
    title: { ja: "複数カード使い分けシミュレーター", en: "Multi-card strategy" },
    lead: {
      ja: "支出項目ごとに最適なカードを割り当てた場合の合計還元を計算します。",
      en: "Assigns the best card per spending category and totals the rewards.",
    },
    assumptions: {
      ja: [
        "項目ごとに最も還元率の高いカードを機械的に選びます",
        "複数枚の年会費はすべて合算します",
      ],
      en: [
        "Mechanically picks the highest-rate card per category",
        "All annual fees are added together",
      ],
    },
    method: {
      ja: "合計還元 ＝ Σ（項目別支出 × 最良カードの還元率）－ Σ 年会費",
      en: "Total = Σ(category spend × best card rate) − Σ annual fees",
    },
    accent: "magenta",
  },
  {
    id: "fx-fee",
    slug: "fx-fee",
    title: { ja: "外貨決済手数料比較", en: "Foreign transaction fee comparison" },
    lead: {
      ja: "海外での利用額から、カードごとの手数料差を計算します。",
      en: "The fee difference between cards on your overseas spending.",
    },
    assumptions: {
      ja: [
        "海外事務手数料のみを比較します（為替レート自体の差は含みません）",
        "ATM引き出し手数料は含みません",
      ],
      en: [
        "Compares the stated transaction fee only, not differences in the exchange rate itself",
        "ATM withdrawal fees are excluded",
      ],
    },
    method: {
      ja: "手数料 ＝ 海外利用額 × 海外事務手数料 ÷ 100",
      en: "Fee = overseas spend × foreign transaction fee ÷ 100",
    },
    accent: "electric",
  },
  {
    id: "point-exchange",
    slug: "point-exchange",
    title: { ja: "ポイント交換シミュレーター", en: "Point redemption simulator" },
    lead: {
      ja: "交換先によって1ポイントの価値がどう変わるかを比べます。",
      en: "How the value of a point changes depending on what you redeem it for.",
    },
    assumptions: {
      ja: [
        "交換レートは当サイト掲載の値です。実際のレートは各社の規定によります",
        "マイルの価値は交換する特典航空券によって大きく変わります",
      ],
      en: [
        "Uses the rates published here; actual rates are set by each provider",
        "The value of a mile varies widely with the award ticket you book",
      ],
    },
    method: {
      ja: "交換後の価値 ＝ ポイント数 × 交換レート",
      en: "Redeemed value = points × redemption rate",
    },
    accent: "gold",
  },
];

const simulatorMap = new Map(simulators.map((simulator) => [simulator.slug, simulator]));

export function getSimulator(slug: string) {
  return simulatorMap.get(slug);
}

/** 支出の入力項目。全シミュレーターで共通です */
export const spendCategories = [
  {
    id: "daily",
    label: { ja: "食費・日用品", en: "Groceries and daily goods" },
    defaultValue: 45000,
  },
  { id: "convenience", label: { ja: "コンビニ", en: "Convenience stores" }, defaultValue: 12000 },
  { id: "online", label: { ja: "ネット通販", en: "Online shopping" }, defaultValue: 20000 },
  { id: "transport", label: { ja: "交通費", en: "Transport" }, defaultValue: 10000 },
  { id: "travel", label: { ja: "旅行", en: "Travel" }, defaultValue: 8000 },
  { id: "dining", label: { ja: "飲食店", en: "Restaurants" }, defaultValue: 15000 },
  { id: "fuel", label: { ja: "ガソリン", en: "Fuel" }, defaultValue: 6000 },
  { id: "telecom", label: { ja: "通信費", en: "Phone and internet" }, defaultValue: 9000 },
  { id: "utilities", label: { ja: "公共料金", en: "Utilities" }, defaultValue: 14000 },
  { id: "tax", label: { ja: "税金", en: "Taxes" }, defaultValue: 0 },
  { id: "subscription", label: { ja: "サブスク", en: "Subscriptions" }, defaultValue: 4000 },
] as const;

export type SpendCategoryId = (typeof spendCategories)[number]["id"];
