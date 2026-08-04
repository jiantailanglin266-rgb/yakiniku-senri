/**
 * カードカテゴリ。
 *
 * `/ja/cards/<id>` としてページになり、`ranking: true` のものは
 * `/ja/rankings/<id>` のランキングにもなります。
 * ⚠ id はカードスラッグと衝突させないでください（tests で検証しています）。
 */
import type { CardCategory } from "./types";

export const cardCategories: CardCategory[] = [
  {
    id: "free-annual-fee",
    title: { ja: "年会費無料カード", en: "No annual fee cards" },
    lead: {
      ja: "持っているだけでは費用がかからないカードです。使わない月があっても損をしません。",
      en: "Cards that cost nothing to hold, so an idle month never costs you anything.",
    },
    ranking: true,
    accent: "emerald",
  },
  {
    id: "high-reward",
    title: { ja: "ポイント還元率で選ぶ", en: "High reward rate cards" },
    lead: {
      ja: "基本還元率が高い、または特定の使い方で還元率が跳ね上がるカードです。",
      en: "Cards with a high base rate, or a rate that jumps for specific spending.",
    },
    ranking: true,
    accent: "cyan",
  },
  {
    id: "mile",
    title: { ja: "マイルが貯まるカード", en: "Cards for earning miles" },
    lead: {
      ja: "ポイントを航空マイルへ移行できるカードです。移行レートと手数料で実質価値が変わります。",
      en: "Cards whose points transfer to airline miles. Transfer rates and fees drive real value.",
    },
    ranking: true,
    accent: "electric",
  },
  {
    id: "travel",
    title: { ja: "旅行向けカード", en: "Travel cards" },
    lead: {
      ja: "旅行保険・空港ラウンジ・海外手数料など、移動が多い人向けの条件で選びます。",
      en: "Chosen on travel insurance, lounge access and foreign transaction fees.",
    },
    ranking: true,
    accent: "violet",
  },
  {
    id: "gold",
    title: { ja: "ゴールドカード", en: "Gold cards" },
    lead: {
      ja: "保険とラウンジが付く中位ランク。年会費に見合うかは利用額しだいです。",
      en: "A mid tier with insurance and lounges. Whether the fee pays off depends on your spend.",
    },
    ranking: true,
    accent: "gold",
  },
  {
    id: "platinum",
    title: { ja: "プラチナカード", en: "Platinum cards" },
    lead: {
      ja: "コンシェルジュや上位ラウンジが中心。年会費は高く、使いこなす前提のランクです。",
      en: "Concierge and premium lounges. High fees that assume you will use the benefits.",
    },
    ranking: true,
    accent: "violet",
  },
  {
    id: "black",
    title: { ja: "ブラックカード", en: "Black cards" },
    lead: {
      ja: "招待制が中心の最上位ランクです。申込み可否は発行会社の基準によります。",
      en: "The top tier, usually invitation-only. Eligibility is at the issuer's discretion.",
    },
    ranking: true,
    accent: "magenta",
  },
  {
    id: "business",
    title: { ja: "法人カード", en: "Business cards" },
    lead: {
      ja: "追加カード・限度額・会計ソフト連携など、経費管理の条件で選びます。",
      en: "Chosen on additional cards, limits and accounting integrations.",
    },
    ranking: true,
    accent: "cyan",
  },
  {
    id: "sole-proprietor",
    title: { ja: "個人事業主向けカード", en: "Cards for sole proprietors" },
    lead: {
      ja: "決算書不要など、開業まもない事業者でも申込みやすい条件のカードです。",
      en: "Cards that accept applications without financial statements, useful when newly self-employed.",
    },
    ranking: true,
    accent: "emerald",
  },
  {
    id: "student",
    title: { ja: "学生向けカード", en: "Student cards" },
    lead: {
      ja: "在学中の年会費が無料、または在学期間中の特典があるカードです。",
      en: "Cards with no fee while studying, or perks tied to student status.",
    },
    ranking: true,
    accent: "cyan",
  },
  {
    id: "beginner",
    title: { ja: "初めての1枚", en: "First card" },
    lead: {
      ja: "年会費がかからず、使い方がわかりやすいカードから選びます。",
      en: "No-fee cards with reward programmes that are easy to understand.",
    },
    ranking: true,
    accent: "emerald",
  },
  {
    id: "overseas",
    title: { ja: "海外利用に強いカード", en: "Cards for overseas spending" },
    lead: {
      ja: "海外事務手数料と、海外旅行保険の条件で比較します。",
      en: "Compared on foreign transaction fees and overseas travel insurance.",
    },
    ranking: true,
    accent: "electric",
  },
  {
    id: "online-shopping",
    title: { ja: "ネットショッピング向け", en: "Online shopping cards" },
    lead: {
      ja: "ネット通販で還元率が上がるカードや、バーチャルカードを発行できるカードです。",
      en: "Cards with boosted online rates, or the ability to issue virtual card numbers.",
    },
    ranking: true,
    accent: "magenta",
  },
  {
    id: "convenience-store",
    title: { ja: "コンビニ利用向け", en: "Convenience store cards" },
    lead: {
      ja: "コンビニでのタッチ決済で還元率が上がるカードです。",
      en: "Cards that boost the rate for contactless payments at convenience stores.",
    },
    ranking: true,
    accent: "emerald",
  },
  {
    id: "gas",
    title: { ja: "ガソリン・車向け", en: "Fuel & driving cards" },
    lead: {
      ja: "給油や高速道路の利用で還元があるカードです。ETCカードの年会費も要確認です。",
      en: "Cards rewarding fuel and toll spending. Check the ETC card fee as well.",
    },
    ranking: true,
    accent: "gold",
  },
  {
    id: "subscription",
    title: { ja: "サブスク支払い向け", en: "Subscription cards" },
    lead: {
      ja: "定額サービスの支払いで還元率が上がる、または管理機能があるカードです。",
      en: "Cards that boost rates on recurring services, or help you track them.",
    },
    ranking: true,
    accent: "violet",
  },
  {
    id: "crypto",
    title: { ja: "暗号資産関連カード", en: "Crypto-linked cards" },
    lead: {
      ja: "利用額に応じて暗号資産が還元される、または暗号資産から決済できるカードです。",
      en: "Cards that reward in crypto, or let you spend from crypto balances.",
    },
    ranking: true,
    accent: "magenta",
  },
  {
    id: "debit",
    title: { ja: "デビットカード", en: "Debit cards" },
    lead: {
      ja: "口座残高の範囲で使えるカードです。審査が不要な代わりに還元率は控えめです。",
      en: "Spend only what is in your account. No credit check, but rates are modest.",
    },
    ranking: false,
    accent: "cyan",
  },
  {
    id: "prepaid",
    title: { ja: "プリペイドカード", en: "Prepaid cards" },
    lead: {
      ja: "チャージした分だけ使えるカードです。使いすぎの防止に向きます。",
      en: "Spend only what you load. Useful for keeping spending in check.",
    },
    ranking: false,
    accent: "emerald",
  },
  {
    id: "virtual",
    title: { ja: "バーチャルカード", en: "Virtual cards" },
    lead: {
      ja: "番号だけを即時発行できるカードです。用途ごとに使い捨てられます。",
      en: "Instantly issued card numbers you can throw away per use case.",
    },
    ranking: false,
    accent: "violet",
  },
];

const categoryMap = new Map(cardCategories.map((category) => [category.id, category]));

export function getCategory(id: string) {
  return categoryMap.get(id as CardCategory["id"]);
}

export const rankingCategories = cardCategories.filter((category) => category.ranking);
