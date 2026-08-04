/**
 * 発行会社（架空）。
 *
 * 実在のカード会社の商標・ロゴ・券面意匠は使用しません。
 * 本番データへ差し替えるときは、この配列を実在の発行会社へ置き換えてください。
 */
import type { CardBrand, Issuer } from "./types";
import type { LocalizedText } from "@/cardport/i18n/localized";

export const issuers: Issuer[] = [
  {
    id: "nova",
    name: { ja: "ノヴァ・フィナンシャル", en: "Nova Financial" },
    type: "credit",
    description: {
      ja: "オンライン完結の審査フローを主軸に据えた、架空のカード発行会社です。",
      en: "A fictional issuer built around a fully online application flow.",
    },
  },
  {
    id: "meridian",
    name: { ja: "メリディアン銀行", en: "Meridian Bank" },
    type: "bank",
    description: {
      ja: "銀行口座との連携を強みにする、架空のリテールバンクです。",
      en: "A fictional retail bank whose strength is deep account integration.",
    },
  },
  {
    id: "orbit",
    name: { ja: "オービット・ペイメンツ", en: "Orbit Payments" },
    type: "fintech",
    description: {
      ja: "バーチャルカードと経費管理を組み合わせた、架空のフィンテック企業です。",
      en: "A fictional fintech combining virtual cards with expense management.",
    },
  },
  {
    id: "aurum",
    name: { ja: "オーラム・クラブ", en: "Aurum Club" },
    type: "credit",
    description: {
      ja: "招待制の上位カードを中心に据えた、架空のプレミアムカード会社です。",
      en: "A fictional premium issuer centred on invitation-only tiers.",
    },
  },
  {
    id: "hoshimart",
    name: { ja: "ホシマート", en: "Hoshi Mart" },
    type: "distribution",
    description: {
      ja: "全国のスーパー・コンビニを展開する、架空の流通グループです。",
      en: "A fictional retail group operating supermarkets and convenience stores.",
    },
  },
  {
    id: "linkmobile",
    name: { ja: "リンクモバイル", en: "Link Mobile" },
    type: "telecom",
    description: {
      ja: "通信契約とポイント経済圏を結ぶ、架空の通信会社です。",
      en: "A fictional carrier linking mobile plans with a points ecosystem.",
    },
  },
  {
    id: "chainbridge",
    name: { ja: "チェーンブリッジ", en: "ChainBridge" },
    type: "crypto",
    description: {
      ja: "暗号資産の決済連携を手がける、架空のサービス事業者です。",
      en: "A fictional provider bridging crypto assets and card payments.",
    },
  },
];

const issuerMap = new Map(issuers.map((issuer) => [issuer.id, issuer]));

export function getIssuer(id: string): Issuer | undefined {
  return issuerMap.get(id);
}

/** 国際ブランドの表示名。ブランド名は固有名詞なので翻訳しません */
export const brandLabels: Record<CardBrand, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  jcb: "JCB",
  amex: "American Express",
  diners: "Diners Club",
  unionpay: "UnionPay",
};

export const brandOrder: CardBrand[] = ["visa", "mastercard", "jcb", "amex", "diners", "unionpay"];

/** ブランドの解説（比較表のツールチップ用） */
export const brandNotes: Record<CardBrand, LocalizedText> = {
  visa: {
    ja: "世界的に加盟店数が多く、海外でも使える場面が広いブランドです。",
    en: "The widest merchant coverage worldwide, including most overseas destinations.",
  },
  mastercard: {
    ja: "Visa と並ぶ加盟店網を持ち、欧州で強いとされるブランドです。",
    en: "Coverage on par with Visa, traditionally strong in Europe.",
  },
  jcb: {
    ja: "国内加盟店とハワイ・アジアの優待に強みがあるブランドです。",
    en: "Strong domestic coverage in Japan plus perks in Hawaii and Asia.",
  },
  amex: {
    ja: "旅行・エンターテインメントの優待が手厚い一方、加盟店は限定されます。",
    en: "Rich travel and entertainment perks, though merchant coverage is narrower.",
  },
  diners: {
    ja: "会員数を絞った上位ブランド。グルメ・ラウンジ優待が中心です。",
    en: "A selective premium network focused on dining and lounge access.",
  },
  unionpay: {
    ja: "中国圏での利用に強いブランドです。国内加盟店は限られます。",
    en: "Strong across Greater China; domestic coverage in Japan is limited.",
  },
};
