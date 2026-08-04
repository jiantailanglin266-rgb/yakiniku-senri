/**
 * キャッシュレス決済サービス（すべて架空）。
 *
 * クレジットカードとの「組み合わせ」で還元が決まるため、
 * 相性のよいカード（bestCardIds）を必ず併記します。
 */
import type { PaymentService } from "./types";

export const paymentServices: PaymentService[] = [
  {
    id: "pay-hoshipay",
    slug: "hoshi-pay",
    name: { ja: "ホシペイ", en: "Hoshi Pay" },
    type: "qr",
    summary: {
      ja: "QRコード決済。グループ店舗での還元が高く設定されています。",
      en: "A QR payment service with elevated rewards inside its retail group.",
    },
    baseRate: 0.5,
    chargeSources: {
      ja: [
        "銀行口座からのチャージ",
        "クレジットカードからのチャージ（対象カードのみ）",
        "残高からの支払い",
      ],
      en: [
        "Top up from a bank account",
        "Top up from selected credit cards",
        "Pay from the balance",
      ],
    },
    bestCardIds: ["hoshimart-plus", "hoshimart-gold"],
    pros: {
      ja: ["グループ店舗での還元が高い", "小額決済でも使いやすい"],
      en: ["Strong rewards inside the group", "Convenient for small purchases"],
    },
    cons: {
      ja: [
        "クレジットカードからのチャージは対象カードが限られる",
        "カードチャージ分のポイントが付かない場合がある",
      ],
      en: ["Only some cards can top it up", "Card top-ups may not earn card points"],
    },
    officialUrl: "https://example.com/hoshi-pay",
  },
  {
    id: "pay-linkpay",
    slug: "link-pay",
    name: { ja: "リンクペイ", en: "Link Pay" },
    type: "qr",
    summary: {
      ja: "通信契約と連動するQRコード決済です。",
      en: "A QR payment service tied to the carrier's mobile plans.",
    },
    baseRate: 0.5,
    chargeSources: {
      ja: ["通信料金との合算払い", "銀行口座", "対象クレジットカード"],
      en: ["Charged to your phone bill", "Bank account", "Selected credit cards"],
    },
    bestCardIds: ["linkmobile-one"],
    pros: {
      ja: ["通信料金と合算して支払える", "ポイントを通信料に充当できる"],
      en: ["Bill it with your phone plan", "Points can offset the phone bill"],
    },
    cons: { ja: ["通信契約がないと還元率が下がる"], en: ["Rates drop without the carrier plan"] },
    officialUrl: "https://example.com/link-pay",
  },
  {
    id: "pay-novawallet",
    slug: "nova-wallet",
    name: { ja: "ノヴァウォレット", en: "Nova Wallet" },
    type: "wallet",
    summary: {
      ja: "カードを登録して使うスマートフォンウォレットです。",
      en: "A phone wallet you load your cards into.",
    },
    baseRate: 0,
    chargeSources: {
      ja: ["登録したクレジットカード", "デビットカード"],
      en: ["Registered credit cards", "Debit cards"],
    },
    bestCardIds: ["nova-zero", "nova-flux"],
    pros: {
      ja: ["登録したカードの還元率がそのまま適用される", "タッチ決済の還元率アップ条件を満たせる"],
      en: [
        "The underlying card's rate applies unchanged",
        "Satisfies phone-contactless boost conditions",
      ],
    },
    cons: { ja: ["ウォレット自体の還元はない"], en: ["The wallet itself adds no rewards"] },
    officialUrl: "https://example.com/nova-wallet-pay",
  },
  {
    id: "pay-laterflow",
    slug: "later-flow",
    name: { ja: "レイターフロー", en: "Later Flow" },
    type: "bnpl",
    summary: {
      ja: "後払いサービス。分割手数料がかかる場合があります。",
      en: "A buy-now-pay-later service; instalments may carry a fee.",
    },
    baseRate: 0,
    chargeSources: {
      ja: ["翌月一括払い", "分割払い（手数料あり）"],
      en: ["Pay in full next month", "Instalments, with a fee"],
    },
    bestCardIds: [],
    pros: {
      ja: ["クレジットカードを持たなくても後払いができる"],
      en: ["Deferred payment without a credit card"],
    },
    cons: {
      ja: [
        "分割払いには手数料がかかります",
        "支払いが遅れると遅延損害金が発生し、信用情報に影響する場合があります",
        "利用限度額は与信により決まります",
      ],
      en: [
        "Instalments carry a fee",
        "Late payment triggers charges and can affect your credit record",
        "Limits are set by a credit assessment",
      ],
    },
    officialUrl: "https://example.com/later-flow",
  },
  {
    id: "pay-transit",
    slug: "transit-tap",
    name: { ja: "トランジットタップ", en: "Transit Tap" },
    type: "transit",
    summary: {
      ja: "交通系ICカード。チャージ元のカード選びで還元率が変わります。",
      en: "A transit IC card; the card you top up from determines your rewards.",
    },
    baseRate: 0,
    chargeSources: {
      ja: ["対象クレジットカードからのオートチャージ", "駅の券売機"],
      en: ["Auto top-up from selected credit cards", "Station machines"],
    },
    bestCardIds: ["hoshimart-plus", "linkmobile-prepaid"],
    pros: {
      ja: ["改札での処理が速い", "オートチャージで残高不足を防げる"],
      en: ["Fast at the gate", "Auto top-up avoids running dry"],
    },
    cons: {
      ja: ["オートチャージ対象のカードが限られる"],
      en: ["Only some cards support auto top-up"],
    },
    officialUrl: "https://example.com/transit-tap",
  },
  {
    id: "pay-bankdirect",
    slug: "bank-direct",
    name: { ja: "バンクダイレクト", en: "Bank Direct" },
    type: "bank-pay",
    summary: {
      ja: "銀行口座から直接支払う決済です。与信を使いません。",
      en: "Pays straight from your bank account, with no credit involved.",
    },
    baseRate: 0.2,
    chargeSources: {
      ja: ["銀行口座から即時引き落とし"],
      en: ["Immediate debit from your bank account"],
    },
    bestCardIds: ["meridian-debit"],
    pros: {
      ja: ["残高以上は使えない", "審査が不要"],
      en: ["You cannot exceed your balance", "No credit review"],
    },
    cons: {
      ja: ["還元率が低い", "対応加盟店が限られる"],
      en: ["A low reward rate", "Limited merchant coverage"],
    },
    officialUrl: "https://example.com/bank-direct",
  },
];

const paymentMap = new Map(paymentServices.map((service) => [service.slug, service]));

export function getPaymentService(slug: string) {
  return paymentMap.get(slug);
}
