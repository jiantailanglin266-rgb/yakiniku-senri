/**
 * 目的別カード特集。
 *
 * カードIDを直書きせず「条件」で選びます。
 * カードデータを更新したときに特集の中身が自動で追随し、
 * 「特集に載っているのに条件を満たしていない」というズレが起きないようにするためです。
 */
import type { FeatureCollection } from "./types";

export const featureCollections: FeatureCollection[] = [
  {
    id: "first-card",
    slug: "first-card",
    title: { ja: "初めてのクレジットカード", en: "Your first credit card" },
    lead: {
      ja: "年会費がかからず、仕組みがわかりやすいカードから選びます。",
      en: "Free to hold, with reward rules that are easy to follow.",
    },
    filter: { categories: ["beginner"], maxAnnualFee: 0 },
    accent: "emerald",
  },
  {
    id: "no-fee",
    slug: "no-fee",
    title: { ja: "年会費無料で選ぶ", en: "No annual fee" },
    lead: {
      ja: "持っているだけでは費用がかからないカードです。",
      en: "Cards that cost nothing to hold.",
    },
    filter: { maxAnnualFee: 0 },
    accent: "emerald",
  },
  {
    id: "earn-points",
    slug: "earn-points",
    title: { ja: "ポイントを貯めたい", en: "Maximise points" },
    lead: {
      ja: "基本還元率1.0%以上のカードに絞りました。",
      en: "Cards with a base rate of 1.0% or higher.",
    },
    filter: { minBaseRate: 1.0 },
    accent: "cyan",
  },
  {
    id: "earn-miles",
    slug: "earn-miles",
    title: { ja: "マイルを貯めたい", en: "Collect miles" },
    lead: {
      ja: "ポイントをマイルへ移行できるカードです。",
      en: "Cards whose points transfer to airline miles.",
    },
    filter: { minMileRate: 0.5 },
    accent: "electric",
  },
  {
    id: "overseas-travel",
    slug: "overseas-travel",
    title: { ja: "海外旅行に持っていく", en: "For overseas travel" },
    lead: {
      ja: "海外旅行保険と海外事務手数料で選びます。",
      en: "Chosen on overseas travel cover and transaction fees.",
    },
    filter: { categories: ["overseas", "travel"] },
    accent: "violet",
  },
  {
    id: "domestic-travel",
    slug: "domestic-travel",
    title: { ja: "国内旅行に持っていく", en: "For domestic travel" },
    lead: {
      ja: "国内旅行保険とラウンジで選びます。",
      en: "Chosen on domestic travel cover and lounge access.",
    },
    filter: { categories: ["travel"] },
    accent: "cyan",
  },
  {
    id: "airport-lounge",
    slug: "airport-lounge",
    title: { ja: "空港ラウンジを使いたい", en: "Airport lounge access" },
    lead: {
      ja: "空港ラウンジが使えるカードだけを並べています。",
      en: "Only cards that include lounge access.",
    },
    filter: { requiresLounge: true },
    accent: "gold",
  },
  {
    id: "premium-hotel",
    slug: "premium-hotel",
    title: { ja: "ホテルの優待で選ぶ", en: "Hotel perks" },
    lead: {
      ja: "上位ランクの優待が中心です。年会費との釣り合いを必ず確認してください。",
      en: "Perks concentrated in the higher tiers. Weigh them against the fee.",
    },
    filter: { ranks: ["platinum", "black", "gold"] },
    accent: "violet",
  },
  {
    id: "online-shop",
    slug: "online-shop",
    title: { ja: "ネット通販で使う", en: "For online shopping" },
    lead: {
      ja: "ネット利用の還元条件と、バーチャルカードの有無で選びます。",
      en: "Chosen on online reward conditions and virtual card support.",
    },
    filter: { categories: ["online-shopping", "virtual"] },
    accent: "magenta",
  },
  {
    id: "convenience",
    slug: "convenience",
    title: { ja: "コンビニで使う", en: "At convenience stores" },
    lead: {
      ja: "コンビニでの還元率が上がるカードです。",
      en: "Cards whose rate rises at convenience stores.",
    },
    filter: { categories: ["convenience-store"] },
    accent: "emerald",
  },
  {
    id: "fuel",
    slug: "fuel",
    title: { ja: "ガソリン代を抑える", en: "Cut fuel costs" },
    lead: {
      ja: "給油での還元と、ETCカードの年会費を確認します。",
      en: "Fuel rewards, with the ETC card fee checked too.",
    },
    filter: { categories: ["gas"] },
    accent: "gold",
  },
  {
    id: "dining",
    slug: "dining",
    title: { ja: "飲食店で使う", en: "At restaurants" },
    lead: {
      ja: "飲食店での還元・優待があるカードです。",
      en: "Cards with restaurant rewards or perks.",
    },
    filter: { categories: ["high-reward", "convenience-store"] },
    accent: "magenta",
  },
  {
    id: "subscriptions",
    slug: "subscriptions",
    title: { ja: "サブスクをまとめる", en: "Consolidate subscriptions" },
    lead: {
      ja: "定額サービスの支払いに向くカードです。",
      en: "Cards suited to recurring services.",
    },
    filter: { categories: ["subscription"] },
    accent: "violet",
  },
  {
    id: "tax-payment",
    slug: "tax-payment",
    title: { ja: "税金の支払いに使う", en: "Paying taxes" },
    lead: {
      ja: "税金のカード払いは決済手数料がかかることがあります。還元率が手数料を上回るか必ず確認してください。",
      en: "Paying tax by card often incurs a processing fee. Check that the reward rate exceeds it.",
    },
    filter: { minBaseRate: 1.0 },
    accent: "cyan",
  },
  {
    id: "utilities",
    slug: "utilities",
    title: { ja: "公共料金の支払いに使う", en: "Paying utilities" },
    lead: {
      ja: "毎月必ず発生する支払いを寄せると、還元が積み上がります。",
      en: "Routing unavoidable monthly bills through a card compounds the rewards.",
    },
    filter: { minBaseRate: 1.0 },
    accent: "emerald",
  },
  {
    id: "corporate-expense",
    slug: "corporate-expense",
    title: { ja: "法人経費をまとめる", en: "Corporate expenses" },
    lead: {
      ja: "追加カードと会計ソフト連携で選びます。",
      en: "Chosen on additional cards and accounting integrations.",
    },
    filter: { categories: ["business"] },
    accent: "cyan",
  },
  {
    id: "startup",
    slug: "startup",
    title: { ja: "スタートアップ向け", en: "For startups" },
    lead: {
      ja: "設立まもない法人でも申込みやすい条件のカードです。",
      en: "Cards that newly formed companies can realistically apply for.",
    },
    filter: { categories: ["business"], maxAnnualFee: 33000 },
    accent: "electric",
  },
  {
    id: "freelance",
    slug: "freelance",
    title: { ja: "個人事業主向け", en: "For sole proprietors" },
    lead: {
      ja: "決算書がなくても申込みできる条件のカードです。",
      en: "Cards that accept applications without financial statements.",
    },
    filter: { categories: ["sole-proprietor"] },
    accent: "emerald",
  },
  {
    id: "student-life",
    slug: "student-life",
    title: { ja: "学生向け", en: "For students" },
    lead: {
      ja: "在学中の特典と、卒業後の扱いを確認してください。",
      en: "Check the student perks and what happens after graduation.",
    },
    filter: { categories: ["student"] },
    accent: "cyan",
  },
];

const featureMap = new Map(featureCollections.map((feature) => [feature.slug, feature]));

export function getFeature(slug: string) {
  return featureMap.get(slug);
}
