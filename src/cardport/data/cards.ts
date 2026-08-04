/**
 * カード（すべて架空）。
 *
 * ⚠ 実在するカードの名称・ロゴ・券面意匠は使用していません。
 *   券面は `art` の配色から CSS で描画するプレースホルダーです。
 *   本番データへ差し替えるときは、各社から提供された素材のみを使用してください。
 *
 * ⚠ 数値はすべてサンプルです。`verifiedOn` は「この値をいつ確認したか」を表す欄で、
 *   実データに差し替える際は必ず実際の確認日を入れてください。
 */
import type { Card } from "./types";

const VERIFIED = "2026-07-15";
const UPDATED = "2026-07-20";

/** 付帯なしの保険 */
const none = { amount: 0, condition: "none" as const };

/** 全カード共通の初期値。個別に上書きします */
const defaults = {
  firstYearFee: 0,
  familyCardFee: 0,
  etcFee: 0,
  mileRate: 0,
  mileTransfer: { ja: [], en: [] },
  travelInsuranceDomestic: none,
  travelInsuranceOverseas: none,
  shoppingInsurance: none,
  lounges: { ja: [], en: [] },
  touchPayment: true,
  mobilePayments: ["Apple Pay", "Google Pay"],
  electronicMoney: [],
  eligibility: ["general" as const],
  availableRegions: ["JP"],
  verifiedOn: VERIFIED,
  updatedOn: UPDATED,
};

export const cards: Card[] = [
  {
    ...defaults,
    id: "nova-zero",
    slug: "nova-zero",
    name: { ja: "ノヴァ ゼロ", en: "Nova Zero" },
    issuerId: "nova",
    brands: ["visa", "mastercard"],
    rank: "standard",
    categories: [
      "free-annual-fee",
      "beginner",
      "high-reward",
      "convenience-store",
      "online-shopping",
    ],
    art: { from: "#0ea5e9", via: "#3b82f6", to: "#1e1b4b", texture: "matte" },
    annualFee: 0,
    baseRate: 1.0,
    maxRate: 7.0,
    maxRateCondition: {
      ja: "対象のコンビニ・飲食店でスマートフォンのタッチ決済を使った場合（月間の付与上限あり）",
      en: "Contactless payments by phone at partner convenience stores and restaurants (monthly cap applies).",
    },
    pointName: { ja: "ノヴァポイント", en: "Nova Points" },
    pointExpiry: { ja: "獲得から2年", en: "2 years from earning" },
    shoppingInsurance: none,
    issueDays: 1,
    eligibilityNote: {
      ja: "満18歳以上（高校生を除く）で、本人または配偶者に安定した収入があること。詳しい条件は公式サイトをご確認ください。",
      en: "Age 18+ (excluding high-school students) with stable income for you or your spouse. Confirm the full criteria on the official site.",
    },
    limitNote: {
      ja: "審査結果により個別に設定されます。金額は保証されません。",
      en: "Set individually based on the issuer's review. No amount is guaranteed.",
    },
    fxFee: 2.2,
    electronicMoney: ["iD", "QUICPay"],
    summary: {
      ja: "年会費が永年無料で、対象店舗のタッチ決済なら還元率が大きく上がる1枚。まず1枚目として持つのに向きます。",
      en: "Free for life, with a big rate boost on contactless payments at partner stores. A sensible first card.",
    },
    pros: {
      ja: [
        "年会費が永年無料で、持っているだけの費用がかからない",
        "対象のコンビニ・飲食店のタッチ決済で還元率が最大7%",
        "申込みから最短1日で番号が発行され、すぐ使いはじめられる",
      ],
      en: [
        "Free for life, so holding it never costs you anything",
        "Up to 7% back on contactless at partner convenience stores and restaurants",
        "Card number issued in as little as one day",
      ],
    },
    cons: {
      ja: [
        "高還元は対象店舗に限られ、対象外の支払いは基本還元率のまま",
        "旅行保険が付帯しないため、旅行時は別のカードや保険が必要",
        "還元率アップには月間の付与上限がある",
      ],
      en: [
        "The boosted rate applies only at partner merchants",
        "No travel insurance, so you will need another card or a policy when travelling",
        "The boosted rate is capped each month",
      ],
    },
    notes: {
      ja: [
        "還元率アップの対象店舗は変更されることがあります。利用前に公式サイトで対象を確認してください。",
        "スマートフォンのタッチ決済が条件のため、カード実物を差し込む決済では対象外です。",
      ],
      en: [
        "Partner merchants change over time. Check the official list before you rely on the boost.",
        "The boost requires phone contactless; inserting the physical card does not qualify.",
      ],
    },
    recommendedFor: {
      ja: [
        "はじめてクレジットカードを持つ人",
        "コンビニ・カフェの利用が多い人",
        "年会費をかけたくない人",
      ],
      en: [
        "First-time cardholders",
        "Frequent convenience store and café users",
        "Anyone avoiding annual fees",
      ],
    },
    notRecommendedFor: {
      ja: ["旅行保険を1枚で完結させたい人", "海外での利用が中心の人"],
      en: [
        "People who want travel insurance from a single card",
        "People who mostly spend overseas",
      ],
    },
    officialUrl: "https://example.com/nova-zero",
    affiliateId: "nova-zero",
    scores: { reward: 4.4, fee: 5.0, benefit: 3.2, insurance: 1.0, usability: 4.6, trust: 4.0 },
  },
  {
    ...defaults,
    id: "nova-flux",
    slug: "nova-flux",
    name: { ja: "ノヴァ フラックス", en: "Nova Flux" },
    issuerId: "nova",
    brands: ["visa", "mastercard", "jcb"],
    rank: "standard",
    categories: ["high-reward", "online-shopping", "subscription", "free-annual-fee"],
    art: { from: "#8b5cf6", via: "#e548a8", to: "#111832", texture: "holo" },
    annualFee: 1650,
    firstYearFee: 0,
    feeWaiver: {
      ja: "年間30万円以上の利用で翌年度無料",
      en: "Waived the following year with ¥300,000 or more of annual spend",
    },
    baseRate: 1.2,
    maxRate: 5.0,
    maxRateCondition: {
      ja: "提携ネットショップ経由の買い物、および登録したサブスクリプションの支払い",
      en: "Purchases via partner online stores and payments for registered subscriptions.",
    },
    pointName: { ja: "ノヴァポイント", en: "Nova Points" },
    pointExpiry: { ja: "獲得から3年", en: "3 years from earning" },
    issueDays: 3,
    eligibilityNote: {
      ja: "満18歳以上（高校生を除く）で、安定した収入があること。詳細は公式サイトでご確認ください。",
      en: "Age 18+ (excluding high-school students) with stable income. Confirm details on the official site.",
    },
    limitNote: { ja: "審査結果により個別に設定されます。", en: "Set individually after review." },
    fxFee: 2.0,
    shoppingInsurance: { amount: 1000000, condition: "usage" },
    electronicMoney: ["iD", "QUICPay"],
    summary: {
      ja: "ネット通販とサブスクの支払いに寄せると還元率が伸びるカード。年間30万円使えば年会費も実質かかりません。",
      en: "Rates climb when you route online shopping and subscriptions through it, and ¥300k of annual spend clears the fee.",
    },
    pros: {
      ja: [
        "基本還元率1.2%と、無料カードより一段高い水準",
        "提携ネットショップ経由なら最大5.0%",
        "サブスク支払いを登録するとカード側で一覧管理できる",
      ],
      en: [
        "A 1.2% base rate, a notch above typical free cards",
        "Up to 5.0% through partner online stores",
        "Registered subscriptions are listed together in the app",
      ],
    },
    cons: {
      ja: [
        "年間30万円に届かないと年会費1,650円がかかる",
        "空港ラウンジは利用できない",
        "海外旅行保険は付帯しない",
      ],
      en: [
        "The ¥1,650 fee applies if you spend under ¥300,000 a year",
        "No airport lounge access",
        "No overseas travel insurance",
      ],
    },
    notes: {
      ja: [
        "年会費無料の条件は「年間利用額」であり、支払い回数ではありません。",
        "提携ネットショップは入れ替わることがあります。",
      ],
      en: [
        "The waiver depends on annual spend, not on the number of transactions.",
        "The partner store list changes from time to time.",
      ],
    },
    recommendedFor: {
      ja: ["ネット通販の利用が多い人", "サブスクをまとめたい人", "年間30万円以上カードを使う人"],
      en: [
        "Heavy online shoppers",
        "People consolidating subscriptions",
        "Anyone spending ¥300k+ a year",
      ],
    },
    notRecommendedFor: {
      ja: ["カードをほとんど使わない人", "旅行保険を重視する人"],
      en: ["Very light users", "People who prioritise travel insurance"],
    },
    officialUrl: "https://example.com/nova-flux",
    affiliateId: "nova-flux",
    scores: { reward: 4.6, fee: 3.8, benefit: 3.6, insurance: 2.0, usability: 4.2, trust: 4.0 },
  },
  {
    ...defaults,
    id: "meridian-gold",
    slug: "meridian-gold",
    name: { ja: "メリディアン ゴールド", en: "Meridian Gold" },
    issuerId: "meridian",
    brands: ["visa", "mastercard"],
    rank: "gold",
    categories: ["gold", "travel", "overseas", "high-reward"],
    art: { from: "#b98d3c", via: "#e3c37a", to: "#1b1405", texture: "metal" },
    annualFee: 11000,
    firstYearFee: 0,
    familyCardFee: 0,
    etcFee: 0,
    feeWaiver: {
      ja: "年間100万円以上の利用で翌年度以降無料",
      en: "Waived from the following year with ¥1,000,000 or more of annual spend",
    },
    baseRate: 1.0,
    maxRate: 3.0,
    maxRateCondition: {
      ja: "年間100万円の利用達成でボーナスポイント付与（達成月以降の利用分に加算）",
      en: "Bonus points once annual spend reaches ¥1,000,000.",
    },
    pointName: { ja: "メリディアンポイント", en: "Meridian Points" },
    pointExpiry: { ja: "獲得から3年", en: "3 years from earning" },
    mileTransfer: {
      ja: ["提携航空会社2社へ移行可（1,000ポイント単位）"],
      en: ["Transferable to two partner airlines in 1,000-point blocks"],
    },
    mileRate: 0.5,
    travelInsuranceDomestic: { amount: 50000000, condition: "usage" },
    travelInsuranceOverseas: { amount: 100000000, condition: "auto" },
    shoppingInsurance: { amount: 3000000, condition: "auto" },
    lounges: {
      ja: ["国内主要空港のカードラウンジ", "同伴者1名まで無料"],
      en: ["Domestic airport card lounges", "One guest included"],
    },
    issueDays: 5,
    eligibilityNote: {
      ja: "満20歳以上で安定した継続収入があること。審査基準は公開されていません。公式サイトで最新の条件をご確認ください。",
      en: "Age 20+ with stable ongoing income. The issuer does not publish its criteria — check the official site.",
    },
    limitNote: { ja: "審査結果により個別に設定されます。", en: "Set individually after review." },
    fxFee: 1.6,
    electronicMoney: ["iD", "QUICPay"],
    summary: {
      ja: "海外旅行保険が自動付帯で、年間100万円使えば年会費が無料になるゴールド。旅行と日常利用を1枚にまとめたい人向けです。",
      en: "Automatic overseas travel cover and a fee waived at ¥1m annual spend — a single card for travel and daily use.",
    },
    pros: {
      ja: [
        "海外旅行保険が自動付帯（カードで旅費を払わなくても対象）",
        "年間100万円の利用で翌年度以降の年会費が無料",
        "海外事務手数料が1.6%と一般的な水準より低い",
      ],
      en: [
        "Overseas travel insurance applies automatically, without paying for the trip on the card",
        "Fee waived from the next year once annual spend hits ¥1,000,000",
        "A 1.6% foreign transaction fee, below the common level",
      ],
    },
    cons: {
      ja: [
        "年間100万円に届かない年は11,000円の年会費がかかる",
        "基本還元率は1.0%で、無料の高還元カードと大きくは変わらない",
        "プライオリティ・パス相当の海外ラウンジは付帯しない",
      ],
      en: [
        "The ¥11,000 fee applies in any year you spend under ¥1,000,000",
        "The 1.0% base rate is not far above strong free cards",
        "No global lounge programme equivalent",
      ],
    },
    notes: {
      ja: [
        "自動付帯・利用付帯の区別は保険の適用条件に直結します。国内旅行保険は利用付帯です。",
        "年会費無料の判定期間は入会月起算です。暦年ではありません。",
      ],
      en: [
        "Automatic vs usage-based cover changes when the policy applies. Domestic cover here is usage-based.",
        "The waiver period runs from your enrolment month, not the calendar year.",
      ],
    },
    recommendedFor: {
      ja: [
        "年に数回、海外へ行く人",
        "年間100万円以上カードを使う人",
        "保険とラウンジを1枚で持ちたい人",
      ],
      en: [
        "People travelling abroad a few times a year",
        "Anyone spending ¥1m+ a year",
        "People wanting insurance and lounges in one card",
      ],
    },
    notRecommendedFor: {
      ja: ["年間利用額が少ない人", "還元率だけを重視する人"],
      en: ["Light spenders", "People optimising purely for reward rate"],
    },
    officialUrl: "https://example.com/meridian-gold",
    affiliateId: "meridian-gold",
    scores: { reward: 3.6, fee: 3.4, benefit: 4.2, insurance: 4.6, usability: 4.2, trust: 4.4 },
  },
  {
    ...defaults,
    id: "meridian-classic",
    slug: "meridian-classic",
    name: { ja: "メリディアン クラシック", en: "Meridian Classic" },
    issuerId: "meridian",
    brands: ["visa", "mastercard", "jcb"],
    rank: "standard",
    categories: ["free-annual-fee", "beginner", "gas"],
    art: { from: "#1e3a8a", via: "#3b82f6", to: "#0b1020", texture: "matte" },
    annualFee: 0,
    baseRate: 0.5,
    maxRate: 2.0,
    maxRateCondition: {
      ja: "提携ガソリンスタンドでの給油、および銀行口座の給与受取設定がある場合",
      en: "Fuel at partner stations, plus salary deposits into the linked bank account.",
    },
    pointName: { ja: "メリディアンポイント", en: "Meridian Points" },
    pointExpiry: { ja: "獲得から2年", en: "2 years from earning" },
    issueDays: 7,
    eligibilityNote: {
      ja: "満18歳以上（高校生を除く）。銀行口座の開設が必要です。",
      en: "Age 18+ (excluding high-school students). A bank account with the issuer is required.",
    },
    limitNote: { ja: "審査結果により個別に設定されます。", en: "Set individually after review." },
    fxFee: 2.2,
    electronicMoney: ["iD"],
    summary: {
      ja: "銀行口座とセットで持つ年会費無料カード。給油の還元と口座管理をまとめたい人向けです。",
      en: "A free card paired with a bank account, suited to combining fuel rewards with account management.",
    },
    pros: {
      ja: [
        "年会費が無料",
        "提携ガソリンスタンドで還元率が上がる",
        "銀行口座と同じアプリで残高と利用明細を見られる",
      ],
      en: [
        "No annual fee",
        "Boosted rate at partner fuel stations",
        "Balance and statements in the same app as the bank account",
      ],
    },
    cons: {
      ja: ["基本還元率が0.5%と低い", "旅行保険が付帯しない", "発行までに1週間程度かかる"],
      en: ["A low 0.5% base rate", "No travel insurance", "Takes about a week to issue"],
    },
    notes: {
      ja: ["還元率アップには口座条件の設定が必要です。カード単体では基本還元率のままです。"],
      en: [
        "The boost requires account conditions to be set; the card alone earns only the base rate.",
      ],
    },
    recommendedFor: {
      ja: ["車の利用が多い人", "銀行口座とカードをまとめたい人"],
      en: ["People who drive often", "People consolidating bank and card"],
    },
    notRecommendedFor: {
      ja: ["還元率を最優先する人", "すぐにカードが必要な人"],
      en: ["People optimising for reward rate", "People who need a card immediately"],
    },
    officialUrl: "https://example.com/meridian-classic",
    affiliateId: "meridian-classic",
    scores: { reward: 2.6, fee: 5.0, benefit: 2.8, insurance: 1.0, usability: 3.8, trust: 4.4 },
  },
  {
    ...defaults,
    id: "aurum-platinum",
    slug: "aurum-platinum",
    name: { ja: "オーラム プラチナ", en: "Aurum Platinum" },
    issuerId: "aurum",
    brands: ["amex", "mastercard"],
    rank: "platinum",
    categories: ["platinum", "travel", "overseas", "mile"],
    art: { from: "#4c1d95", via: "#8b5cf6", to: "#050710", texture: "metal" },
    annualFee: 55000,
    firstYearFee: 55000,
    familyCardFee: 0,
    baseRate: 1.0,
    maxRate: 3.0,
    maxRateCondition: {
      ja: "旅行関連（航空券・ホテル）の支払い",
      en: "Travel spending such as airfare and hotels.",
    },
    pointName: { ja: "オーラムリワード", en: "Aurum Rewards" },
    pointExpiry: { ja: "無期限", en: "No expiry" },
    mileTransfer: {
      ja: ["提携航空会社12社へ移行可", "移行単位は1,000ポイントから"],
      en: ["Transferable to 12 partner airlines", "From 1,000 points per transfer"],
    },
    mileRate: 1.0,
    travelInsuranceDomestic: { amount: 100000000, condition: "auto" },
    travelInsuranceOverseas: { amount: 100000000, condition: "auto" },
    shoppingInsurance: { amount: 5000000, condition: "auto" },
    lounges: {
      ja: ["世界の空港ラウンジプログラムに登録可", "国内カードラウンジ", "同伴者1名まで無料"],
      en: ["Enrolment in a global lounge programme", "Domestic card lounges", "One guest included"],
    },
    issueDays: 10,
    eligibilityNote: {
      ja: "満25歳以上で安定した継続収入があること。招待制ではありませんが、審査基準は公開されていません。",
      en: "Age 25+ with stable ongoing income. Not invitation-only, but the criteria are not published.",
    },
    limitNote: {
      ja: "一律の上限を設けない運用ですが、利用可能額は都度審査されます。無制限ではありません。",
      en: "No fixed ceiling is published, but each transaction is assessed. It is not unlimited.",
    },
    fxFee: 2.0,
    electronicMoney: ["QUICPay"],
    summary: {
      ja: "24時間対応のコンシェルジュと世界のラウンジが使えるプラチナ。年会費55,000円を旅行と会食で回収できる人向けです。",
      en: "A platinum tier with 24/7 concierge and global lounges — worth it if travel and dining recoup the ¥55,000 fee.",
    },
    pros: {
      ja: [
        "ポイントの有効期限がなく、マイル移行レートも1ポイント＝1マイル",
        "国内・海外の旅行保険がいずれも自動付帯",
        "コンシェルジュに旅程やレストランの手配を依頼できる",
      ],
      en: [
        "Points never expire and transfer at 1:1 to miles",
        "Domestic and overseas travel cover both apply automatically",
        "Concierge handles itineraries and restaurant bookings",
      ],
    },
    cons: {
      ja: [
        "年会費55,000円は初年度から必要で、無料条件がない",
        "American Express は加盟店が限られる場面がある",
        "特典を使わない年は費用だけが残る",
      ],
      en: [
        "The ¥55,000 fee applies from year one with no waiver",
        "American Express acceptance is narrower in some places",
        "In a year you skip the perks, only the cost remains",
      ],
    },
    notes: {
      ja: [
        "「上限なし」と表現される利用可能額は無制限を意味しません。高額利用の前に事前承認が必要な場合があります。",
        "ラウンジプログラムの登録は本会員が別途手続きする必要があります。",
      ],
      en: [
        "A 'no preset limit' policy does not mean unlimited. Large purchases may need pre-authorisation.",
        "The lounge programme requires a separate enrolment step by the primary cardholder.",
      ],
    },
    recommendedFor: {
      ja: ["年に5回以上飛行機に乗る人", "会食や出張の手配を任せたい人", "マイルを本格的に貯める人"],
      en: [
        "People flying five or more times a year",
        "People who want bookings handled for them",
        "Serious mileage collectors",
      ],
    },
    notRecommendedFor: {
      ja: ["年会費を負担に感じる人", "旅行の機会が少ない人", "還元率だけを見る人"],
      en: [
        "People for whom the fee is a burden",
        "Infrequent travellers",
        "People looking only at reward rate",
      ],
    },
    officialUrl: "https://example.com/aurum-platinum",
    affiliateId: "aurum-platinum",
    scores: { reward: 4.0, fee: 2.2, benefit: 5.0, insurance: 5.0, usability: 3.6, trust: 4.6 },
  },
  {
    ...defaults,
    id: "aurum-noir",
    slug: "aurum-noir",
    name: { ja: "オーラム ノワール", en: "Aurum Noir" },
    issuerId: "aurum",
    brands: ["amex"],
    rank: "black",
    categories: ["black", "travel", "mile", "platinum"],
    art: { from: "#111827", via: "#374151", to: "#000000", texture: "carbon" },
    annualFee: 165000,
    firstYearFee: 165000,
    familyCardFee: 0,
    baseRate: 1.0,
    maxRate: 3.0,
    maxRateCondition: { ja: "旅行関連の支払い", en: "Travel spending." },
    pointName: { ja: "オーラムリワード", en: "Aurum Rewards" },
    pointExpiry: { ja: "無期限", en: "No expiry" },
    mileTransfer: { ja: ["提携航空会社15社へ移行可"], en: ["Transferable to 15 partner airlines"] },
    mileRate: 1.25,
    travelInsuranceDomestic: { amount: 100000000, condition: "auto" },
    travelInsuranceOverseas: { amount: 100000000, condition: "auto" },
    shoppingInsurance: { amount: 10000000, condition: "auto" },
    lounges: {
      ja: ["世界のラウンジプログラムに同伴者含め登録可", "空港送迎サービス"],
      en: ["Global lounge programme including guests", "Airport transfer service"],
    },
    issueDays: 21,
    eligibilityNote: {
      ja: "原則として招待制です。申込みフォームは公開されておらず、当サイトから発行可否を判断することはできません。",
      en: "Invitation-only in principle. There is no public application form, and we cannot assess your eligibility.",
    },
    limitNote: {
      ja: "一律の上限を設けない運用です。無制限ではありません。",
      en: "No preset spending limit is published. This does not mean unlimited.",
    },
    fxFee: 2.0,
    summary: {
      ja: "招待制の最上位カード。年会費165,000円に見合うのは、旅行と会食の頻度が極めて高い人に限られます。",
      en: "An invitation-only top tier. The ¥165,000 fee only pays off for very frequent travellers and diners.",
    },
    pros: {
      ja: [
        "マイル移行レートが最も高い",
        "同伴者もラウンジを利用できる",
        "専任のコンシェルジュが付く",
      ],
      en: [
        "The highest mile transfer rate here",
        "Guests can use the lounges too",
        "A dedicated concierge",
      ],
    },
    cons: {
      ja: ["年会費165,000円", "原則として自分から申し込めない", "使いこなせないと費用だけが残る"],
      en: [
        "A ¥165,000 annual fee",
        "You generally cannot apply on your own",
        "Unused, it is pure cost",
      ],
    },
    notes: {
      ja: [
        "招待の基準は公開されていません。特定の使い方で招待されると断定する情報にはご注意ください。",
        "当サイトでは招待を受ける方法を案内していません。",
      ],
      en: [
        "The invitation criteria are not published. Treat claims about guaranteed routes to an invitation with caution.",
        "We do not publish methods for obtaining an invitation.",
      ],
    },
    recommendedFor: {
      ja: ["招待を受けており、旅行頻度が非常に高い人"],
      en: ["Invited holders who travel very frequently"],
    },
    notRecommendedFor: {
      ja: ["年会費の回収が見込めない人", "ステータスだけを目的とする人"],
      en: ["Anyone unlikely to recoup the fee", "People chasing status alone"],
    },
    officialUrl: "https://example.com/aurum-noir",
    scores: { reward: 4.2, fee: 1.4, benefit: 5.0, insurance: 5.0, usability: 3.0, trust: 4.6 },
  },
  {
    ...defaults,
    id: "orbit-business",
    slug: "orbit-business",
    name: { ja: "オービット ビジネス", en: "Orbit Business" },
    issuerId: "orbit",
    brands: ["visa", "mastercard"],
    rank: "business",
    categories: ["business", "sole-proprietor", "virtual", "online-shopping"],
    art: { from: "#0f766e", via: "#22d3ee", to: "#0b1020", texture: "matte" },
    annualFee: 0,
    baseRate: 1.0,
    maxRate: 1.5,
    maxRateCondition: {
      ja: "広告出稿・クラウドサービスなど対象カテゴリの支払い",
      en: "Spending in target categories such as advertising and cloud services.",
    },
    pointName: { ja: "オービットポイント", en: "Orbit Points" },
    pointExpiry: { ja: "獲得から2年", en: "2 years from earning" },
    issueDays: 3,
    eligibility: ["business", "sole-proprietor"],
    eligibilityNote: {
      ja: "法人または個人事業主。決算書・確定申告書の提出を求めない運用ですが、審査はあります。",
      en: "Companies and sole proprietors. Financial statements are not requested, but a review still applies.",
    },
    limitNote: {
      ja: "審査結果により個別に設定されます。事業実績に応じて見直されます。",
      en: "Set individually after review and revisited as the business grows.",
    },
    fxFee: 2.0,
    business: {
      additionalCards: 99,
      accountingIntegrations: ["freee", "マネーフォワード クラウド", "弥生会計"],
      paymentTerms: {
        ja: "締め日から最長56日後の支払い",
        en: "Up to 56 days from the closing date",
      },
      receiptManagement: true,
      virtualCards: true,
    },
    summary: {
      ja: "年会費無料で追加カードを99枚まで発行でき、会計ソフト連携と領収書管理まで含む法人カード。経費の一元管理に向きます。",
      en: "A free business card issuing up to 99 additional cards, with accounting integrations and receipt capture built in.",
    },
    pros: {
      ja: [
        "年会費が無料で、追加カードも無料で99枚まで発行できる",
        "用途ごとにバーチャルカードを即時発行でき、限度額を個別に設定できる",
        "主要な会計ソフトへ明細を自動連携できる",
      ],
      en: [
        "No annual fee, and up to 99 free additional cards",
        "Virtual cards issued instantly per use case, each with its own limit",
        "Statements sync automatically with the major accounting packages",
      ],
    },
    cons: {
      ja: [
        "還元率は最大1.5%と、個人向けの高還元カードには及ばない",
        "旅行保険・空港ラウンジが付帯しない",
        "限度額は事業実績に依存し、開業直後は低めに設定されやすい",
      ],
      en: [
        "A 1.5% ceiling, below the strongest consumer cards",
        "No travel insurance or lounge access",
        "Limits track business history and start low for new entities",
      ],
    },
    notes: {
      ja: [
        "決算書の提出が不要であることは、審査がないことを意味しません。",
        "会計ソフト連携は各ソフト側の契約プランによって利用可否が変わります。",
      ],
      en: [
        "Not requiring financial statements does not mean there is no review.",
        "Accounting integrations depend on your plan with each vendor.",
      ],
    },
    recommendedFor: {
      ja: [
        "開業まもない個人事業主",
        "従業員のカードを増やしたい法人",
        "経費精算を自動化したい事業者",
      ],
      en: [
        "Newly self-employed people",
        "Companies issuing many employee cards",
        "Businesses automating expense workflows",
      ],
    },
    notRecommendedFor: {
      ja: ["出張が多く保険とラウンジを求める事業者", "高還元率を最優先する事業者"],
      en: ["Businesses needing travel cover and lounges", "Businesses optimising purely for rate"],
    },
    officialUrl: "https://example.com/orbit-business",
    affiliateId: "orbit-business",
    scores: { reward: 3.4, fee: 5.0, benefit: 4.4, insurance: 1.0, usability: 4.8, trust: 4.2 },
  },
  {
    ...defaults,
    id: "orbit-business-gold",
    slug: "orbit-business-gold",
    name: { ja: "オービット ビジネス ゴールド", en: "Orbit Business Gold" },
    issuerId: "orbit",
    brands: ["visa", "mastercard"],
    rank: "business",
    categories: ["business", "gold", "travel", "overseas"],
    art: { from: "#78350f", via: "#e3c37a", to: "#0b1020", texture: "metal" },
    annualFee: 33000,
    firstYearFee: 0,
    baseRate: 1.0,
    maxRate: 2.0,
    maxRateCondition: {
      ja: "広告・出張・クラウドサービスなど対象カテゴリの支払い",
      en: "Advertising, travel and cloud spending.",
    },
    pointName: { ja: "オービットポイント", en: "Orbit Points" },
    pointExpiry: { ja: "獲得から3年", en: "3 years from earning" },
    mileTransfer: {
      ja: ["提携航空会社3社へ移行可"],
      en: ["Transferable to three partner airlines"],
    },
    mileRate: 0.5,
    travelInsuranceDomestic: { amount: 50000000, condition: "usage" },
    travelInsuranceOverseas: { amount: 100000000, condition: "auto" },
    shoppingInsurance: { amount: 5000000, condition: "auto" },
    lounges: { ja: ["国内主要空港のカードラウンジ"], en: ["Domestic airport card lounges"] },
    issueDays: 5,
    eligibility: ["business", "sole-proprietor"],
    eligibilityNote: {
      ja: "法人または個人事業主。設立・開業から1年以上の実績を求められる場合があります。",
      en: "Companies and sole proprietors. A year or more of trading history may be required.",
    },
    limitNote: { ja: "審査結果により個別に設定されます。", en: "Set individually after review." },
    fxFee: 1.8,
    business: {
      additionalCards: 99,
      accountingIntegrations: ["freee", "マネーフォワード クラウド", "弥生会計", "SAP Concur"],
      paymentTerms: {
        ja: "締め日から最長62日後の支払い",
        en: "Up to 62 days from the closing date",
      },
      receiptManagement: true,
      virtualCards: true,
    },
    summary: {
      ja: "支払いサイトが最長62日と長く、出張の保険とラウンジも付く法人ゴールド。キャッシュフローを重視する事業者向けです。",
      en: "A business gold with payment terms up to 62 days, plus travel cover and lounges — built for cash-flow management.",
    },
    pros: {
      ja: [
        "支払いサイトが最長62日でキャッシュフローに余裕が出る",
        "海外旅行保険が自動付帯",
        "経費精算ツールとの連携先が多い",
      ],
      en: [
        "Up to 62 days to pay, easing cash flow",
        "Automatic overseas travel cover",
        "Integrates with more expense tools",
      ],
    },
    cons: {
      ja: [
        "年会費33,000円は初年度無料のみで、2年目以降は必要",
        "還元率は最大2.0%にとどまる",
        "設立直後は審査が通りにくい場合がある",
      ],
      en: [
        "Only the first year is free; ¥33,000 applies from year two",
        "The rate tops out at 2.0%",
        "Newly formed entities may find approval harder",
      ],
    },
    notes: {
      ja: [
        "支払いサイトは締め日と支払日の組み合わせで決まります。最長日数は特定の締め日のみに当てはまります。",
      ],
      en: [
        "Payment terms depend on your closing and due dates; the maximum applies only to certain cycles.",
      ],
    },
    recommendedFor: {
      ja: ["仕入れ・広告費の立替が多い事業者", "出張の多い法人"],
      en: ["Businesses fronting inventory or ad spend", "Companies with frequent business travel"],
    },
    notRecommendedFor: {
      ja: ["経費額が少ない事業者", "年会費を避けたい事業者"],
      en: ["Businesses with modest expenses", "Businesses avoiding annual fees"],
    },
    officialUrl: "https://example.com/orbit-business-gold",
    affiliateId: "orbit-business-gold",
    scores: { reward: 3.6, fee: 3.2, benefit: 4.6, insurance: 4.4, usability: 4.6, trust: 4.2 },
  },
  {
    ...defaults,
    id: "hoshimart-plus",
    slug: "hoshimart-plus",
    name: { ja: "ホシマート プラス", en: "Hoshi Mart Plus" },
    issuerId: "hoshimart",
    brands: ["visa", "jcb"],
    rank: "standard",
    categories: ["free-annual-fee", "convenience-store", "beginner", "high-reward"],
    art: { from: "#065f46", via: "#34d399", to: "#0b1020", texture: "matte" },
    annualFee: 0,
    baseRate: 0.5,
    maxRate: 5.0,
    maxRateCondition: {
      ja: "グループのスーパー・コンビニでの利用（毎月の付与上限あり）",
      en: "Spending at the group's supermarkets and convenience stores (monthly cap applies).",
    },
    pointName: { ja: "ホシポイント", en: "Hoshi Points" },
    pointExpiry: { ja: "最終利用から1年", en: "1 year from last activity" },
    issueDays: 2,
    eligibilityNote: {
      ja: "満18歳以上（高校生を除く）。学生も申込みできます。",
      en: "Age 18+ (excluding high-school students). Students may apply.",
    },
    limitNote: { ja: "審査結果により個別に設定されます。", en: "Set individually after review." },
    fxFee: 2.2,
    electronicMoney: ["交通系IC", "QUICPay"],
    summary: {
      ja: "グループ店舗で還元率が5.0%になる年会費無料カード。週に何度も同じ店を使う人ほど効きます。",
      en: "A free card paying 5.0% inside the group's stores — strongest if you shop there several times a week.",
    },
    pros: {
      ja: ["グループ店舗で還元率5.0%", "年会費が無料", "ポイントがレジで1ポイント単位から使える"],
      en: [
        "5.0% inside the group's stores",
        "No annual fee",
        "Points redeemable at the till from one point",
      ],
    },
    cons: {
      ja: [
        "グループ外では0.5%と低い",
        "ポイントの有効期限が最終利用から1年と短い",
        "旅行保険が付帯しない",
      ],
      en: [
        "Only 0.5% outside the group",
        "Points expire a year after your last activity",
        "No travel insurance",
      ],
    },
    notes: {
      ja: ["高還元には毎月の付与上限があります。まとめ買いでは上限を超える場合があります。"],
      en: ["The boost is capped monthly; large single shops can exceed the cap."],
    },
    recommendedFor: {
      ja: ["同じスーパー・コンビニをよく使う人", "食費の支払いをまとめたい人"],
      en: ["Regulars at the same stores", "People consolidating grocery spend"],
    },
    notRecommendedFor: {
      ja: ["買い物先が分散している人", "旅行での利用が中心の人"],
      en: ["People who shop across many chains", "Travel-focused spenders"],
    },
    officialUrl: "https://example.com/hoshimart-plus",
    affiliateId: "hoshimart-plus",
    scores: { reward: 4.0, fee: 5.0, benefit: 3.0, insurance: 1.0, usability: 4.4, trust: 3.8 },
  },
  {
    ...defaults,
    id: "linkmobile-one",
    slug: "linkmobile-one",
    name: { ja: "リンクモバイル ワン", en: "Link Mobile One" },
    issuerId: "linkmobile",
    brands: ["visa", "mastercard"],
    rank: "standard",
    categories: ["free-annual-fee", "subscription", "high-reward", "online-shopping"],
    art: { from: "#7c3aed", via: "#22d3ee", to: "#0b1020", texture: "holo" },
    annualFee: 0,
    baseRate: 1.0,
    maxRate: 4.0,
    maxRateCondition: {
      ja: "同社の通信契約がある場合の、グループサービスでの利用",
      en: "Spending across the group's services while holding one of its mobile plans.",
    },
    pointName: { ja: "リンクポイント", en: "Link Points" },
    pointExpiry: { ja: "獲得から4年", en: "4 years from earning" },
    issueDays: 1,
    eligibilityNote: {
      ja: "満18歳以上（高校生を除く）。通信契約がなくても申込みできます。",
      en: "Age 18+ (excluding high-school students). A mobile plan is not required to apply.",
    },
    limitNote: { ja: "審査結果により個別に設定されます。", en: "Set individually after review." },
    fxFee: 2.2,
    electronicMoney: ["iD", "QUICPay"],
    summary: {
      ja: "通信契約とセットで還元率が上がる年会費無料カード。ポイントを通信料金に充当できます。",
      en: "A free card whose rate climbs when paired with the carrier's plan; points offset your phone bill.",
    },
    pros: {
      ja: ["ポイントを通信料金の支払いに充当できる", "年会費が無料", "有効期限が4年と長い"],
      en: [
        "Points can be applied to your phone bill",
        "No annual fee",
        "A long four-year point life",
      ],
    },
    cons: {
      ja: [
        "通信契約がないと還元率が伸びにくい",
        "旅行保険が付帯しない",
        "ポイントの使い道がグループ内に偏る",
      ],
      en: [
        "Rates stay modest without the carrier plan",
        "No travel insurance",
        "Redemption options are group-centric",
      ],
    },
    notes: {
      ja: ["通信契約を解約すると還元率の優遇も終了します。"],
      en: ["The boosted rate ends if you leave the mobile plan."],
    },
    recommendedFor: {
      ja: ["同社の通信契約がある人", "ポイントを通信料に充てたい人"],
      en: ["Existing carrier customers", "People offsetting phone bills with points"],
    },
    notRecommendedFor: {
      ja: ["他社の通信契約を使い続ける人"],
      en: ["People staying with another carrier"],
    },
    officialUrl: "https://example.com/linkmobile-one",
    affiliateId: "linkmobile-one",
    scores: { reward: 4.2, fee: 5.0, benefit: 3.4, insurance: 1.0, usability: 4.4, trust: 3.8 },
  },
  {
    ...defaults,
    id: "nova-student",
    slug: "nova-student",
    name: { ja: "ノヴァ スチューデント", en: "Nova Student" },
    issuerId: "nova",
    brands: ["visa", "jcb"],
    rank: "standard",
    categories: ["student", "free-annual-fee", "beginner", "subscription"],
    art: { from: "#0891b2", via: "#22d3ee", to: "#111832", texture: "matte" },
    annualFee: 0,
    baseRate: 0.5,
    maxRate: 10.0,
    maxRateCondition: {
      ja: "在学中の、対象サブスクリプションサービスの支払い（月間の付与上限あり）",
      en: "Payments to selected subscription services while enrolled (monthly cap applies).",
    },
    pointName: { ja: "ノヴァポイント", en: "Nova Points" },
    pointExpiry: { ja: "獲得から2年", en: "2 years from earning" },
    issueDays: 2,
    eligibility: ["student", "young"],
    eligibilityNote: {
      ja: "満18歳以上29歳以下の学生（高校生を除く）。卒業後は一般カードへ切り替わります。",
      en: "Students aged 18–29 (excluding high-school students). Converts to a standard card after graduation.",
    },
    limitNote: {
      ja: "学生向けのため低めに設定されます。審査結果により異なります。",
      en: "Set lower for students and varies with the issuer's review.",
    },
    fxFee: 2.2,
    travelInsuranceOverseas: { amount: 20000000, condition: "usage" },
    electronicMoney: ["iD", "QUICPay"],
    summary: {
      ja: "在学中はサブスクの還元率が最大10%になる学生カード。留学時の海外旅行保険（利用付帯）も付きます。",
      en: "A student card paying up to 10% on subscriptions while enrolled, with usage-based overseas cover for study trips.",
    },
    pros: {
      ja: ["対象サブスクの還元率が在学中は最大10%", "年会費無料", "海外旅行保険が利用付帯で付く"],
      en: [
        "Up to 10% on selected subscriptions while enrolled",
        "No annual fee",
        "Usage-based overseas travel cover",
      ],
    },
    cons: {
      ja: ["基本還元率は0.5%と低い", "卒業後は優遇が終了する", "利用限度額が低めに設定される"],
      en: ["A low 0.5% base rate", "Perks end after graduation", "Lower credit limits"],
    },
    notes: {
      ja: [
        "海外旅行保険は利用付帯です。渡航費をこのカードで支払わないと対象になりません。",
        "在学の確認が取れない場合、優遇が終了することがあります。",
      ],
      en: [
        "The travel cover is usage-based: pay for the trip with this card or it does not apply.",
        "Perks can end if student status cannot be confirmed.",
      ],
    },
    recommendedFor: {
      ja: ["学生でサブスクをよく使う人", "留学・海外旅行を予定している学生"],
      en: ["Students with many subscriptions", "Students planning study abroad"],
    },
    notRecommendedFor: {
      ja: ["卒業間近の人", "大きな買い物を予定している人"],
      en: ["People about to graduate", "People planning large purchases"],
    },
    officialUrl: "https://example.com/nova-student",
    affiliateId: "nova-student",
    scores: { reward: 4.0, fee: 5.0, benefit: 3.4, insurance: 2.4, usability: 4.2, trust: 4.0 },
  },
  {
    ...defaults,
    id: "meridian-sky",
    slug: "meridian-sky",
    name: { ja: "メリディアン スカイ", en: "Meridian Sky" },
    issuerId: "meridian",
    brands: ["visa", "amex"],
    rank: "gold",
    categories: ["mile", "travel", "gold", "overseas"],
    art: { from: "#1e40af", via: "#38bdf8", to: "#0b1020", texture: "metal" },
    annualFee: 22000,
    firstYearFee: 22000,
    familyCardFee: 11000,
    baseRate: 1.0,
    maxRate: 2.5,
    maxRateCondition: {
      ja: "提携航空会社の航空券・機内販売での利用",
      en: "Airfare and in-flight purchases with the partner airline.",
    },
    pointName: { ja: "スカイマイル相当ポイント", en: "Sky-linked Points" },
    pointExpiry: {
      ja: "獲得から3年（マイル移行後は各社規定）",
      en: "3 years (airline rules apply after transfer)",
    },
    mileTransfer: {
      ja: ["提携航空会社へ1ポイント＝1マイルで移行可", "移行手数料は年1回まで無料"],
      en: ["1 point = 1 mile with the partner airline", "One free transfer per year"],
    },
    mileRate: 1.0,
    travelInsuranceDomestic: { amount: 50000000, condition: "usage" },
    travelInsuranceOverseas: { amount: 100000000, condition: "auto" },
    shoppingInsurance: { amount: 3000000, condition: "auto" },
    lounges: {
      ja: ["国内主要空港のカードラウンジ", "提携航空会社の一部ラウンジ"],
      en: ["Domestic card lounges", "Selected partner airline lounges"],
    },
    issueDays: 7,
    eligibilityNote: {
      ja: "満20歳以上で安定した継続収入があること。詳細は公式サイトでご確認ください。",
      en: "Age 20+ with stable ongoing income. Confirm details on the official site.",
    },
    limitNote: { ja: "審査結果により個別に設定されます。", en: "Set individually after review." },
    fxFee: 1.6,
    summary: {
      ja: "1ポイント＝1マイルで移行でき、移行手数料が年1回無料のマイル特化ゴールド。年に1〜2回の特典航空券を狙う人向けです。",
      en: "A mile-focused gold transferring 1:1 with one free transfer a year — aimed at one or two award flights annually.",
    },
    pros: {
      ja: ["1ポイント＝1マイルの移行レート", "移行手数料が年1回無料", "海外旅行保険が自動付帯"],
      en: [
        "A 1:1 transfer rate",
        "One fee-free transfer each year",
        "Automatic overseas travel cover",
      ],
    },
    cons: {
      ja: [
        "年会費22,000円に無料条件がない",
        "移行先が提携航空会社に限られる",
        "2回目以降の移行には手数料がかかる",
      ],
      en: [
        "A ¥22,000 fee with no waiver",
        "Transfers limited to the partner airline",
        "Later transfers in the same year incur a fee",
      ],
    },
    notes: {
      ja: [
        "特典航空券の必要マイル数は航空会社の規定により変更されることがあります。",
        "マイルの有効期限は移行後、航空会社の規定に従います。",
      ],
      en: [
        "Award chart requirements are set by the airline and can change.",
        "After transfer, miles follow the airline's expiry rules.",
      ],
    },
    recommendedFor: {
      ja: ["特典航空券を狙う人", "同じ航空会社をよく使う人"],
      en: ["Award-flight collectors", "Loyal flyers of one airline"],
    },
    notRecommendedFor: {
      ja: ["航空会社を都度選ぶ人", "年会費を避けたい人"],
      en: ["People who pick airlines per trip", "People avoiding annual fees"],
    },
    officialUrl: "https://example.com/meridian-sky",
    affiliateId: "meridian-sky",
    scores: { reward: 4.2, fee: 2.8, benefit: 4.4, insurance: 4.4, usability: 3.8, trust: 4.4 },
  },
  {
    ...defaults,
    id: "chainbridge-flow",
    slug: "chainbridge-flow",
    name: { ja: "チェーンブリッジ フロー", en: "ChainBridge Flow" },
    issuerId: "chainbridge",
    brands: ["visa"],
    rank: "prepaid",
    categories: ["crypto", "prepaid", "virtual", "overseas"],
    art: { from: "#4338ca", via: "#e548a8", to: "#050710", texture: "holo" },
    annualFee: 0,
    baseRate: 1.0,
    maxRate: 2.0,
    maxRateCondition: {
      ja: "同社が定めるステーキング残高の条件を満たした場合",
      en: "When you meet the provider's staking balance tiers.",
    },
    pointName: { ja: "暗号資産による還元", en: "Crypto-denominated rewards" },
    pointExpiry: {
      ja: "還元は都度、暗号資産で付与（期限なし）",
      en: "Paid in crypto per transaction; no expiry",
    },
    issueDays: 1,
    eligibilityNote: {
      ja: "満18歳以上。本人確認（KYC）が必要です。審査ではなく本人確認である点にご注意ください。",
      en: "Age 18+. Identity verification (KYC) is required — this is verification, not a credit review.",
    },
    limitNote: {
      ja: "チャージした残高の範囲内でのみ利用できます。与信はありません。",
      en: "Spend is limited to the balance you load. No credit is extended.",
    },
    fxFee: 0.5,
    crypto: {
      supportedAssets: ["BTC", "ETH", "USDC", "USDT"],
      custodyNote: {
        ja: "資産はサービス提供会社が保管します。自己管理ウォレットではありません。",
        en: "Assets are held by the provider. This is not a self-custody wallet.",
      },
      stablecoin: true,
    },
    summary: {
      ja: "暗号資産の残高から決済でき、還元も暗号資産で受け取るプリペイドカード。価格変動と保管リスクを理解したうえで使うカードです。",
      en: "A prepaid card spending from crypto balances and rewarding in crypto — for users who understand volatility and custody risk.",
    },
    pros: {
      ja: [
        "海外事務手数料が0.5%と低い",
        "与信がないため年会費・利息がかからない",
        "用途ごとにバーチャルカードを発行できる",
      ],
      en: [
        "A low 0.5% foreign transaction fee",
        "No credit, so no annual fee or interest",
        "Virtual cards per use case",
      ],
    },
    cons: {
      ja: [
        "残高の価値が暗号資産の価格変動で上下する",
        "還元率アップにはステーキングが必要で、その資産にも価格変動リスクがある",
        "サービス停止・地域制限のリスクがある",
      ],
      en: [
        "Balance value moves with crypto prices",
        "The boosted rate requires staking, which carries its own price risk",
        "Service suspension and geo-restriction are real risks",
      ],
    },
    notes: {
      ja: [
        "暗号資産は元本が保証されません。決済直前の価格変動で、想定より多くの資産を消費する場合があります。",
        "資産はサービス提供会社が保管します。提供会社の破綻時に資産が返らない可能性があります。",
        "日本国内での取扱いは規制の変更により変わることがあります。",
      ],
      en: [
        "Crypto is not principal-protected. Price moves just before settlement can consume more of your holdings than expected.",
        "Assets are custodied by the provider; you may not recover them if the provider fails.",
        "Availability in Japan can change with regulation.",
      ],
    },
    recommendedFor: {
      ja: ["すでに暗号資産を保有し、リスクを理解している人", "海外での利用が多い人"],
      en: ["Existing crypto holders who understand the risks", "People spending heavily overseas"],
    },
    notRecommendedFor: {
      ja: ["元本割れを避けたい人", "暗号資産をこれから始める人", "生活費の決済に使いたい人"],
      en: [
        "People who cannot accept losses",
        "Crypto newcomers",
        "Anyone paying living costs with it",
      ],
    },
    officialUrl: "https://example.com/chainbridge-flow",
    affiliateId: "chainbridge-flow",
    scores: { reward: 3.8, fee: 4.6, benefit: 3.4, insurance: 1.0, usability: 3.6, trust: 3.0 },
  },
  {
    ...defaults,
    id: "meridian-debit",
    slug: "meridian-debit",
    name: { ja: "メリディアン デビット", en: "Meridian Debit" },
    issuerId: "meridian",
    brands: ["visa"],
    rank: "debit",
    categories: ["debit", "beginner", "free-annual-fee"],
    art: { from: "#0369a1", via: "#0ea5e9", to: "#0b1020", texture: "matte" },
    annualFee: 0,
    baseRate: 0.6,
    maxRate: 1.0,
    maxRateCondition: {
      ja: "給与受取口座に設定した場合",
      en: "When the account receives your salary.",
    },
    pointName: { ja: "キャッシュバック", en: "Cashback" },
    pointExpiry: {
      ja: "翌月の口座へ自動反映（期限なし）",
      en: "Credited to the account next month; no expiry",
    },
    issueDays: 5,
    eligibility: ["general", "student", "young"],
    eligibilityNote: {
      ja: "満15歳以上（中学生を除く）で口座を持っていること。与信審査はありません。",
      en: "Age 15+ (excluding junior-high students) with an account. No credit review.",
    },
    limitNote: {
      ja: "口座残高の範囲でのみ利用できます。",
      en: "Spending is limited to your account balance.",
    },
    fxFee: 3.0,
    electronicMoney: [],
    summary: {
      ja: "口座残高の範囲でしか使えないデビットカード。使いすぎを防ぎたい人と、与信審査を通さずに持ちたい人向けです。",
      en: "A debit card capped by your balance — for people avoiding overspend or a credit review.",
    },
    pros: {
      ja: [
        "残高以上に使えないため使いすぎを防げる",
        "与信審査がない",
        "還元は現金として口座へ戻る",
      ],
      en: [
        "You cannot overspend your balance",
        "No credit review",
        "Rewards return as cash to the account",
      ],
    },
    cons: {
      ja: ["還元率が0.6%と低い", "海外事務手数料が3.0%と高い", "分割払い・リボ払いは使えない"],
      en: ["A low 0.6% rate", "A high 3.0% foreign transaction fee", "No instalments or revolving"],
    },
    notes: {
      ja: [
        "一部の定期課金・高速道路料金など、デビットカードが使えない支払いがあります。",
        "海外ATMでの引き出しには別途手数料がかかります。",
      ],
      en: [
        "Some recurring charges and toll systems do not accept debit cards.",
        "Overseas ATM withdrawals carry separate fees.",
      ],
    },
    recommendedFor: {
      ja: ["使いすぎを避けたい人", "クレジットカードの審査を通したくない人", "高校生・大学生"],
      en: ["People avoiding overspend", "People who prefer no credit review", "Students"],
    },
    notRecommendedFor: {
      ja: ["還元率を重視する人", "海外利用が多い人"],
      en: ["Rate-focused users", "Frequent overseas spenders"],
    },
    officialUrl: "https://example.com/meridian-debit",
    scores: { reward: 2.4, fee: 5.0, benefit: 2.4, insurance: 1.0, usability: 3.6, trust: 4.4 },
  },
  {
    ...defaults,
    id: "orbit-virtual",
    slug: "orbit-virtual",
    name: { ja: "オービット バーチャル", en: "Orbit Virtual" },
    issuerId: "orbit",
    brands: ["mastercard"],
    rank: "virtual",
    categories: ["virtual", "online-shopping", "subscription", "free-annual-fee"],
    art: { from: "#5b21b6", via: "#8b5cf6", to: "#050710", texture: "holo" },
    annualFee: 0,
    baseRate: 0.8,
    maxRate: 0.8,
    maxRateCondition: {
      ja: "すべての利用が一律の還元率です。",
      en: "A single flat rate on all spending.",
    },
    pointName: { ja: "オービットポイント", en: "Orbit Points" },
    pointExpiry: { ja: "獲得から2年", en: "2 years from earning" },
    issueDays: 0,
    eligibilityNote: {
      ja: "満18歳以上（高校生を除く）。プラスチックカードの発行はありません。",
      en: "Age 18+ (excluding high-school students). No plastic card is issued.",
    },
    limitNote: {
      ja: "カードごとに上限を自分で設定できます。",
      en: "You set a limit per virtual card.",
    },
    fxFee: 2.0,
    touchPayment: false,
    mobilePayments: ["Apple Pay", "Google Pay"],
    summary: {
      ja: "番号を即時発行し、用途ごとに使い捨てできるバーチャルカード。サブスクの解約漏れや番号流出への備えになります。",
      en: "Instantly issued, disposable card numbers per use case — useful against forgotten subscriptions and number leaks.",
    },
    pros: {
      ja: [
        "申込み当日から使える",
        "カードごとに利用上限と有効期限を設定できる",
        "不要になった番号をその場で停止できる",
      ],
      en: [
        "Usable the same day you apply",
        "Per-card limits and expiry dates",
        "Kill a number the moment you no longer need it",
      ],
    },
    cons: {
      ja: ["実店舗では基本的に使えない", "還元率は0.8%で頭打ち", "本人確認書類の提出が必要"],
      en: [
        "Not generally usable in physical stores",
        "The rate is capped at 0.8%",
        "Identity documents are required",
      ],
    },
    notes: {
      ja: [
        "3Dセキュア非対応の加盟店では使えない場合があります。",
        "実店舗での利用はスマートフォン決済に対応した店舗に限られます。",
      ],
      en: [
        "May not work at merchants without 3-D Secure.",
        "In-store use is limited to merchants accepting phone wallets.",
      ],
    },
    recommendedFor: {
      ja: ["ネット通販でカード番号を出したくない人", "サブスクを管理したい人"],
      en: ["People wary of exposing card numbers online", "People managing subscriptions"],
    },
    notRecommendedFor: {
      ja: ["実店舗での利用が中心の人", "高還元を求める人"],
      en: ["Mostly in-store spenders", "People seeking high rates"],
    },
    officialUrl: "https://example.com/orbit-virtual",
    affiliateId: "orbit-virtual",
    scores: { reward: 3.0, fee: 5.0, benefit: 4.0, insurance: 1.0, usability: 3.4, trust: 4.0 },
  },
  {
    ...defaults,
    id: "nova-travel",
    slug: "nova-travel",
    name: { ja: "ノヴァ トラベル", en: "Nova Travel" },
    issuerId: "nova",
    brands: ["visa", "mastercard"],
    rank: "gold",
    categories: ["travel", "overseas", "gold", "mile"],
    art: { from: "#0e7490", via: "#22d3ee", to: "#111832", texture: "metal" },
    annualFee: 13200,
    firstYearFee: 0,
    familyCardFee: 3300,
    baseRate: 1.0,
    maxRate: 3.0,
    maxRateCondition: {
      ja: "旅行予約サイト経由の航空券・ホテル予約",
      en: "Flights and hotels booked through the partner travel portal.",
    },
    pointName: { ja: "ノヴァポイント", en: "Nova Points" },
    pointExpiry: { ja: "獲得から3年", en: "3 years from earning" },
    mileTransfer: {
      ja: ["提携航空会社5社へ移行可（2ポイント＝1マイル）"],
      en: ["Five partner airlines at 2 points = 1 mile"],
    },
    mileRate: 0.5,
    travelInsuranceDomestic: { amount: 30000000, condition: "usage" },
    travelInsuranceOverseas: { amount: 50000000, condition: "auto" },
    shoppingInsurance: { amount: 2000000, condition: "usage" },
    lounges: { ja: ["国内主要空港のカードラウンジ"], en: ["Domestic airport card lounges"] },
    issueDays: 4,
    eligibilityNote: {
      ja: "満18歳以上（高校生を除く）で安定した収入があること。",
      en: "Age 18+ (excluding high-school students) with stable income.",
    },
    limitNote: { ja: "審査結果により個別に設定されます。", en: "Set individually after review." },
    fxFee: 1.8,
    electronicMoney: ["QUICPay"],
    summary: {
      ja: "初年度無料で試せる旅行向けゴールド。海外旅行保険が自動付帯で、旅行予約サイト経由なら還元率3.0%です。",
      en: "A travel gold you can try free for a year: automatic overseas cover and 3.0% via the travel portal.",
    },
    pros: {
      ja: ["初年度年会費が無料", "海外旅行保険が自動付帯", "家族カードが3,300円と安い"],
      en: ["First year free", "Automatic overseas travel cover", "Family cards at just ¥3,300"],
    },
    cons: {
      ja: [
        "2年目以降は13,200円の年会費がかかる",
        "マイル移行レートが2ポイント＝1マイルと低い",
        "海外ラウンジは対象外",
      ],
      en: [
        "¥13,200 applies from year two",
        "A weak 2 points = 1 mile transfer",
        "No overseas lounge programme",
      ],
    },
    notes: {
      ja: ["初年度無料は入会月から1年間です。暦年ではありません。"],
      en: ["The free year runs from your enrolment month, not the calendar year."],
    },
    recommendedFor: {
      ja: ["年1〜3回旅行する人", "家族分もまとめたい人"],
      en: ["People travelling one to three times a year", "Households adding family cards"],
    },
    notRecommendedFor: {
      ja: ["マイルを本格的に貯めたい人", "旅行しない人"],
      en: ["Serious mileage collectors", "Non-travellers"],
    },
    officialUrl: "https://example.com/nova-travel",
    affiliateId: "nova-travel",
    scores: { reward: 3.8, fee: 3.6, benefit: 4.0, insurance: 4.0, usability: 4.0, trust: 4.0 },
  },
  {
    ...defaults,
    id: "hoshimart-gold",
    slug: "hoshimart-gold",
    name: { ja: "ホシマート ゴールド", en: "Hoshi Mart Gold" },
    issuerId: "hoshimart",
    brands: ["visa", "jcb"],
    rank: "gold",
    categories: ["gold", "convenience-store", "high-reward", "free-annual-fee"],
    art: { from: "#854d0e", via: "#facc15", to: "#0b1020", texture: "metal" },
    annualFee: 5500,
    firstYearFee: 5500,
    feeWaiver: {
      ja: "年間100万円以上の利用で翌年度以降無料",
      en: "Waived from the following year with ¥1,000,000 of annual spend",
    },
    baseRate: 1.0,
    maxRate: 6.0,
    maxRateCondition: {
      ja: "グループのスーパー・コンビニでの利用",
      en: "Spending at the group's supermarkets and convenience stores.",
    },
    pointName: { ja: "ホシポイント", en: "Hoshi Points" },
    pointExpiry: { ja: "獲得から2年", en: "2 years from earning" },
    travelInsuranceDomestic: { amount: 20000000, condition: "usage" },
    travelInsuranceOverseas: { amount: 20000000, condition: "usage" },
    shoppingInsurance: { amount: 3000000, condition: "usage" },
    lounges: { ja: ["国内主要空港のカードラウンジ"], en: ["Domestic airport card lounges"] },
    issueDays: 5,
    eligibilityNote: {
      ja: "満18歳以上（高校生を除く）で安定した収入があること。",
      en: "Age 18+ (excluding high-school students) with stable income.",
    },
    limitNote: { ja: "審査結果により個別に設定されます。", en: "Set individually after review." },
    fxFee: 2.2,
    electronicMoney: ["交通系IC", "QUICPay"],
    summary: {
      ja: "年間100万円使えば年会費が無料になり、グループ店舗では6.0%還元。買い物の中心が決まっている人ほど有利です。",
      en: "Free from year two at ¥1m spend, with 6.0% inside the group's stores — best when your shopping is concentrated.",
    },
    pros: {
      ja: ["グループ店舗で還元率6.0%", "年間100万円の利用で翌年度以降無料", "ラウンジと保険が付く"],
      en: [
        "6.0% inside the group's stores",
        "Free from year two at ¥1m annual spend",
        "Lounges and insurance included",
      ],
    },
    cons: {
      ja: [
        "旅行保険が国内・海外とも利用付帯",
        "グループ外の還元率は1.0%",
        "年間100万円に届かない年は5,500円がかかる",
      ],
      en: [
        "Both travel policies are usage-based",
        "1.0% outside the group",
        "¥5,500 applies in years under ¥1m",
      ],
    },
    notes: {
      ja: ["利用付帯の保険は、旅費をこのカードで支払わないと適用されません。"],
      en: ["Usage-based cover only applies if you pay for the trip with this card."],
    },
    recommendedFor: {
      ja: ["食費をこのグループでまとめている人", "年間100万円以上使う人"],
      en: ["Households concentrating grocery spend here", "People spending ¥1m+ a year"],
    },
    notRecommendedFor: {
      ja: ["買い物先が分散している人"],
      en: ["People shopping across many chains"],
    },
    officialUrl: "https://example.com/hoshimart-gold",
    affiliateId: "hoshimart-gold",
    scores: { reward: 4.4, fee: 3.8, benefit: 3.8, insurance: 3.0, usability: 4.2, trust: 3.8 },
  },
  {
    ...defaults,
    id: "orbit-solo",
    slug: "orbit-solo",
    name: { ja: "オービット ソロ", en: "Orbit Solo" },
    issuerId: "orbit",
    brands: ["visa"],
    rank: "business",
    categories: ["sole-proprietor", "business", "free-annual-fee", "virtual"],
    art: { from: "#047857", via: "#34d399", to: "#0b1020", texture: "matte" },
    annualFee: 0,
    baseRate: 1.0,
    maxRate: 1.0,
    maxRateCondition: {
      ja: "すべての利用が一律の還元率です。",
      en: "A single flat rate on all spending.",
    },
    pointName: { ja: "オービットポイント", en: "Orbit Points" },
    pointExpiry: { ja: "獲得から2年", en: "2 years from earning" },
    issueDays: 2,
    eligibility: ["sole-proprietor", "business"],
    eligibilityNote: {
      ja: "個人事業主・フリーランス。開業届の控えがなくても申込みできる運用ですが、審査はあります。",
      en: "Sole proprietors and freelancers. A filed business notification is not required, but a review still applies.",
    },
    limitNote: {
      ja: "開業直後は低めに設定されやすく、実績に応じて見直されます。",
      en: "Lower at first, revisited as trading history builds.",
    },
    fxFee: 2.0,
    business: {
      additionalCards: 3,
      accountingIntegrations: ["freee", "マネーフォワード クラウド"],
      paymentTerms: {
        ja: "締め日から最長40日後の支払い",
        en: "Up to 40 days from the closing date",
      },
      receiptManagement: true,
      virtualCards: true,
    },
    summary: {
      ja: "開業まもないフリーランスでも申込みやすい年会費無料カード。私費と事業費を分けるところから始められます。",
      en: "A free card that newly self-employed people can apply for — a first step to separating personal and business spend.",
    },
    pros: {
      ja: [
        "年会費が無料",
        "開業届の控えがなくても申込みできる",
        "会計ソフトへ明細を自動連携できる",
      ],
      en: [
        "No annual fee",
        "No filed business notification required",
        "Statements sync to accounting software",
      ],
    },
    cons: {
      ja: [
        "還元率が一律1.0%で上振れがない",
        "限度額が低めに設定されやすい",
        "旅行保険は付帯しない",
      ],
      en: ["A flat 1.0% with no upside", "Limits often start low", "No travel insurance"],
    },
    notes: {
      ja: ["書類の提出が不要であることは、審査がないことを意味しません。"],
      en: ["Not requiring documents does not mean there is no review."],
    },
    recommendedFor: {
      ja: ["開業まもないフリーランス", "私費と事業費を分けたい人"],
      en: ["Newly freelance workers", "People separating personal and business spend"],
    },
    notRecommendedFor: {
      ja: ["高額な仕入れがある事業者", "出張が多い事業者"],
      en: ["Businesses with large purchasing needs", "Businesses with frequent travel"],
    },
    officialUrl: "https://example.com/orbit-solo",
    affiliateId: "orbit-solo",
    scores: { reward: 3.2, fee: 5.0, benefit: 3.6, insurance: 1.0, usability: 4.4, trust: 4.2 },
  },
  {
    ...defaults,
    id: "chainbridge-nova",
    slug: "chainbridge-nova",
    name: { ja: "チェーンブリッジ ノヴァ", en: "ChainBridge Nova" },
    issuerId: "chainbridge",
    brands: ["mastercard"],
    rank: "standard",
    categories: ["crypto", "high-reward", "overseas", "online-shopping"],
    art: { from: "#be185d", via: "#e548a8", to: "#111832", texture: "holo" },
    annualFee: 3300,
    firstYearFee: 0,
    baseRate: 1.5,
    maxRate: 3.0,
    maxRateCondition: {
      ja: "同社の取引所で一定の取引量を満たした場合",
      en: "When you meet trading-volume tiers on the provider's exchange.",
    },
    pointName: { ja: "暗号資産による還元", en: "Crypto-denominated rewards" },
    pointExpiry: { ja: "都度付与（期限なし）", en: "Paid per transaction; no expiry" },
    issueDays: 3,
    eligibilityNote: {
      ja: "満18歳以上で、同社の口座を開設していること。本人確認が必要です。",
      en: "Age 18+ with an account at the provider. Identity verification is required.",
    },
    limitNote: { ja: "審査結果により個別に設定されます。", en: "Set individually after review." },
    fxFee: 1.5,
    crypto: {
      supportedAssets: ["BTC", "ETH", "SOL", "USDC"],
      custodyNote: {
        ja: "還元された暗号資産はサービス提供会社の口座で保管されます。",
        en: "Rewarded crypto is held in an account at the provider.",
      },
      stablecoin: true,
    },
    summary: {
      ja: "利用額の1.5%以上が暗号資産で還元されるクレジットカード。還元の価値が変動する点を許容できる人向けです。",
      en: "A credit card rewarding 1.5%+ in crypto — for people comfortable with a reward whose value moves.",
    },
    pros: {
      ja: ["基本還元率1.5%と高い", "海外事務手数料が1.5%と低い", "初年度年会費が無料"],
      en: ["A strong 1.5% base rate", "A low 1.5% foreign transaction fee", "First year free"],
    },
    cons: {
      ja: [
        "還元された暗号資産の価値は変動し、目減りすることがある",
        "還元率アップには取引量の条件があり、取引にも損失リスクがある",
        "2年目以降は3,300円の年会費がかかる",
      ],
      en: [
        "The value of rewarded crypto fluctuates and can fall",
        "Higher tiers require trading volume, which carries its own risk",
        "¥3,300 applies from year two",
      ],
    },
    notes: {
      ja: [
        "暗号資産による還元は、受け取り時点の価格で価値が決まります。円換算の還元率は保証されません。",
        "暗号資産の売却益は課税対象となる場合があります。税務の取扱いは税理士にご確認ください。",
      ],
      en: [
        "Crypto rewards are valued at the price when received; the yen-equivalent rate is not guaranteed.",
        "Gains on disposal may be taxable. Consult a tax professional.",
      ],
    },
    recommendedFor: {
      ja: ["暗号資産をすでに保有している人", "海外利用が多い人"],
      en: ["Existing crypto holders", "Frequent overseas spenders"],
    },
    notRecommendedFor: {
      ja: ["還元額を確定させたい人", "投資リスクを取りたくない人"],
      en: ["People who want a fixed reward value", "Risk-averse users"],
    },
    officialUrl: "https://example.com/chainbridge-nova",
    affiliateId: "chainbridge-nova",
    scores: { reward: 4.4, fee: 3.6, benefit: 3.2, insurance: 1.0, usability: 3.6, trust: 3.0 },
  },
  {
    ...defaults,
    id: "linkmobile-prepaid",
    slug: "linkmobile-prepaid",
    name: { ja: "リンクモバイル プリペイド", en: "Link Mobile Prepaid" },
    issuerId: "linkmobile",
    brands: ["mastercard"],
    rank: "prepaid",
    categories: ["prepaid", "beginner", "free-annual-fee", "convenience-store"],
    art: { from: "#312e81", via: "#6366f1", to: "#0b1020", texture: "matte" },
    annualFee: 0,
    baseRate: 0.5,
    maxRate: 1.5,
    maxRateCondition: {
      ja: "同社アプリからのチャージ・支払い",
      en: "Top-ups and payments made in the provider's app.",
    },
    pointName: { ja: "リンクポイント", en: "Link Points" },
    pointExpiry: { ja: "獲得から4年", en: "4 years from earning" },
    issueDays: 0,
    eligibility: ["general", "student", "young"],
    eligibilityNote: {
      ja: "年齢制限は緩やかですが、本人確認が必要です。与信審査はありません。",
      en: "Few age restrictions, but identity verification is required. No credit review.",
    },
    limitNote: {
      ja: "チャージ残高の範囲でのみ利用できます。",
      en: "Spending is limited to the balance you load.",
    },
    fxFee: 3.0,
    electronicMoney: ["交通系IC"],
    summary: {
      ja: "アプリから即時発行できるプリペイドカード。チャージした分しか使えないため、支出の上限を自分で決められます。",
      en: "A prepaid card issued instantly in the app — you can only spend what you load, so you set your own ceiling.",
    },
    pros: {
      ja: ["申込み後すぐ使える", "審査がない", "使いすぎを防げる"],
      en: ["Usable right after signup", "No credit review", "Hard ceiling on spending"],
    },
    cons: {
      ja: ["還元率が低い", "海外手数料が3.0%と高い", "月額課金の一部に使えない"],
      en: [
        "A low reward rate",
        "A high 3.0% foreign fee",
        "Not accepted for some recurring charges",
      ],
    },
    notes: {
      ja: ["残高不足で決済が通らない場合があります。定期的な支払いには向きません。"],
      en: ["Payments fail if the balance runs out; not ideal for recurring bills."],
    },
    recommendedFor: {
      ja: ["予算管理をしたい人", "子どものカードを探している保護者"],
      en: ["People budgeting tightly", "Parents looking for a card for a child"],
    },
    notRecommendedFor: {
      ja: ["還元率を求める人", "定期課金に使いたい人"],
      en: ["Rate-focused users", "People paying recurring bills"],
    },
    officialUrl: "https://example.com/linkmobile-prepaid",
    scores: { reward: 2.2, fee: 5.0, benefit: 2.6, insurance: 1.0, usability: 3.8, trust: 3.8 },
  },
];

const cardMap = new Map(cards.map((card) => [card.slug, card]));
const cardIdMap = new Map(cards.map((card) => [card.id, card]));

export function getCardBySlug(slug: string): Card | undefined {
  return cardMap.get(slug);
}

export function getCardById(id: string): Card | undefined {
  return cardIdMap.get(id);
}

export function getCardsByIds(ids: string[]): Card[] {
  return ids.map((id) => cardIdMap.get(id)).filter((card): card is Card => card !== undefined);
}

export function getCardsByCategory(categoryId: string): Card[] {
  return cards.filter((card) => (card.categories as string[]).includes(categoryId));
}
