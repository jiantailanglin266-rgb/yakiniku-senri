/**
 * ニュース（すべて架空）。
 *
 * ■ 種別を必ず区別する
 *   公式発表・報道・キャンペーン・編集部解説・比較記事・広告記事を `kind` で分けます。
 *   読者が「誰の言葉か」を判断できないメディアは、金融情報を扱えません。
 *
 * ■ 重複の統合
 *   同じ発表を扱う記事には同じ `storyKey` を付けます。
 *   一覧では代表記事だけを出し、残りを関連記事として畳めます。
 */
import type { NewsArticle } from "./types";

export const news: NewsArticle[] = [
  {
    id: "news-001",
    slug: "nova-zero-contactless-boost",
    title: {
      ja: "ノヴァ ゼロ、対象コンビニのタッチ決済還元を7%へ引き上げ",
      en: "Nova Zero raises contactless rewards at partner convenience stores to 7%",
    },
    summary: {
      ja: "対象店舗でのスマートフォンのタッチ決済に限り、還元率が最大7%へ。付与上限は月間2,000ポイントで据え置き。",
      en: "The rate rises to 7% for phone contactless at partner stores, with the monthly cap unchanged at 2,000 points.",
    },
    body: {
      ja: [
        "ノヴァ・フィナンシャルは、ノヴァ ゼロの対象店舗におけるスマートフォンのタッチ決済の還元率を、従来の5%から最大7%へ引き上げると発表しました。",
        "対象は同社が指定するコンビニエンスストアと飲食チェーンでの利用です。カード実物を使った決済や、магストライプでの決済は対象外です。",
        "付与上限は月間2,000ポイントで据え置かれます。上限に達したあとの利用は基本還元率1.0%となるため、月間の対象利用額が約28,600円を超える分は還元率が下がる計算です。",
        "編集部の見方：上限があるため「常に7%」ではありません。対象店舗での月間利用が3万円を下回る人にとっては効果が大きい一方、それ以上使う人は他のカードとの併用を検討したほうが有利になります。",
      ],
      en: [
        "Nova Financial has raised the rate for phone contactless at partner merchants from 5% to a maximum of 7%.",
        "This covers designated convenience store and restaurant chains. Paying with the physical card does not qualify.",
        "The monthly cap stays at 2,000 points. Once you hit it, spending reverts to the 1.0% base rate — so anything above roughly ¥28,600 of qualifying spend a month earns less.",
        "Our take: this is not '7% always'. It matters most if you spend under ¥30,000 a month at these merchants; above that, pairing with a second card works out better.",
      ],
    },
    category: "card",
    kind: "official",
    tags: ["ノヴァ ゼロ", "タッチ決済", "還元率"],
    sourceName: { ja: "ノヴァ・フィナンシャル（架空）", en: "Nova Financial (fictional)" },
    sourceUrl: "https://example.com/nova-zero/news",
    publishedAt: "2026-07-18",
    updatedAt: "2026-07-18",
    readingMinutes: 3,
    authorId: "author-hayama",
    supervisorId: "supervisor-kanzaki",
    storyKey: "nova-zero-rate-2026-07",
    relatedCardIds: ["nova-zero", "hoshimart-plus"],
    accent: "cyan",
  },
  {
    id: "news-002",
    slug: "nova-zero-rate-analysis",
    title: {
      ja: "【解説】ノヴァ ゼロの7%還元は結局いくら得なのか",
      en: "Analysis: what Nova Zero's 7% is actually worth",
    },
    summary: {
      ja: "付与上限を踏まえて、月間の対象利用額ごとに実質還元率を計算しました。",
      en: "We work out the effective rate at each level of qualifying monthly spend, cap included.",
    },
    body: {
      ja: [
        "結論から書きます。対象店舗での月間利用が28,600円までなら実質7%、それを超えると実質還元率は下がっていきます。",
        "月10,000円なら700ポイント、月28,600円なら2,002ポイントで上限に達します。月50,000円だと、上限2,000ポイント＋超過分21,400円の1.0%で214ポイント、合計2,214ポイント（実質4.4%）です。",
        "つまり「対象店舗で月3万円まで」がこのカードの適正な使い方です。それ以上は、基本還元率の高いカードへ回したほうが合計の還元は増えます。",
      ],
      en: [
        "The short answer: you get a true 7% up to ¥28,600 of qualifying spend a month, and the effective rate falls above that.",
        "At ¥10,000 you earn 700 points; at ¥28,600 you hit the 2,000-point cap. At ¥50,000 you get 2,000 plus 1.0% on the ¥21,400 excess — 2,214 points, an effective 4.4%.",
        "So the card's sweet spot is up to about ¥30,000 a month at these merchants. Beyond that, moving spend to a higher base-rate card earns more overall.",
      ],
    },
    category: "point",
    kind: "editorial",
    tags: ["還元率", "計算", "ノヴァ ゼロ"],
    sourceName: { ja: "CARD PORT 編集部", en: "CARD PORT editorial team" },
    sourceUrl: "",
    publishedAt: "2026-07-19",
    updatedAt: "2026-07-19",
    readingMinutes: 4,
    authorId: "author-hayama",
    storyKey: "nova-zero-rate-2026-07",
    relatedCardIds: ["nova-zero", "nova-flux"],
    accent: "violet",
  },
  {
    id: "news-003",
    slug: "meridian-gold-waiver-change",
    title: {
      ja: "メリディアン ゴールド、年会費無料条件を年間100万円に変更",
      en: "Meridian Gold changes its fee waiver threshold to ¥1m of annual spend",
    },
    summary: {
      ja: "従来の年間80万円から100万円へ。すでに保有している会員も次回更新分から新条件が適用されます。",
      en: "Up from ¥800,000. Existing holders move to the new threshold at their next renewal.",
    },
    body: {
      ja: [
        "メリディアン銀行は、メリディアン ゴールドの年会費無料条件を、年間80万円以上の利用から100万円以上の利用へ変更すると発表しました。",
        "適用は2026年10月以降の更新分からです。既存会員も対象で、経過措置は設けられていません。",
        "編集部の見方：年間80万〜100万円の利用でぎりぎり無料にしていた人は、11,000円の年会費が発生します。同社の下位カードへの切替、または他社の無料ゴールドへの乗り換えを検討する余地があります。",
      ],
      en: [
        "Meridian Bank is raising the spend needed to waive the Meridian Gold annual fee from ¥800,000 to ¥1,000,000.",
        "It applies from renewals in October 2026 onward, including existing holders, with no transition period.",
        "Our take: if you were clearing the old bar with ¥800k–1m of spend, you now face the ¥11,000 fee. Downgrading, or moving to another issuer's waivable gold, is worth considering.",
      ],
    },
    category: "card",
    kind: "official",
    tags: ["メリディアン ゴールド", "年会費", "改定"],
    sourceName: { ja: "メリディアン銀行（架空）", en: "Meridian Bank (fictional)" },
    sourceUrl: "https://example.com/meridian-gold/news",
    publishedAt: "2026-07-12",
    updatedAt: "2026-07-16",
    readingMinutes: 3,
    authorId: "editorial",
    supervisorId: "supervisor-kanzaki",
    relatedCardIds: ["meridian-gold", "nova-travel", "hoshimart-gold"],
    accent: "gold",
  },
  {
    id: "news-004",
    slug: "orbit-business-accounting-integration",
    title: {
      ja: "オービット ビジネス、会計ソフト3社との自動連携に対応",
      en: "Orbit Business adds automatic sync with three accounting packages",
    },
    summary: {
      ja: "利用明細の自動取り込みに加え、領収書画像の紐付けにも対応。追加費用はかかりません。",
      en: "Statements sync automatically and receipt images attach to transactions, at no extra cost.",
    },
    body: {
      ja: [
        "オービット・ペイメンツは、法人カードの利用明細を会計ソフト3社へ自動連携する機能を追加しました。",
        "アプリで撮影した領収書を、対応する取引明細へ自動で紐付けます。連携そのものに追加費用はかかりませんが、会計ソフト側の契約プランによっては利用できない場合があります。",
        "編集部の見方：経費精算の手作業を減らす効果は大きい一方、連携できるかは会計ソフト側のプラン次第です。導入前に自社のプランを確認してください。",
      ],
      en: [
        "Orbit Payments now syncs business card statements automatically with three accounting packages.",
        "Receipts photographed in the app attach to the matching transaction. The integration itself is free, though your accounting plan may not support it.",
        "Our take: a real reduction in manual work, but availability depends on your accounting plan. Check yours before switching.",
      ],
    },
    category: "business",
    kind: "official",
    tags: ["法人カード", "会計ソフト", "経費精算"],
    sourceName: { ja: "オービット・ペイメンツ（架空）", en: "Orbit Payments (fictional)" },
    sourceUrl: "https://example.com/orbit-business/news",
    publishedAt: "2026-07-08",
    updatedAt: "2026-07-08",
    readingMinutes: 3,
    authorId: "author-mizuki",
    relatedCardIds: ["orbit-business", "orbit-business-gold", "orbit-solo"],
    accent: "emerald",
  },
  {
    id: "news-005",
    slug: "cashless-ratio-report",
    title: {
      ja: "国内キャッシュレス比率、統計の読み方に注意が必要",
      en: "Reading Japan's cashless ratio statistics with care",
    },
    summary: {
      ja: "公表値は分母の取り方で大きく変わります。比率だけを見て決済手段を選ばないでください。",
      en: "Published figures shift a lot depending on the denominator. Don't pick a payment method on the ratio alone.",
    },
    body: {
      ja: [
        "キャッシュレス比率は、分母に何を含めるか（民間最終消費支出か、家計調査かなど）で数値が変わります。",
        "同じ年の比率が資料によって数ポイント違うのは、この定義の差によるものです。数字を引用するときは、必ず出典と定義を併記してください。",
        "編集部の見方：比率の高低は個人の決済手段の選択とは直接関係しません。自分の支出構成に対して、どのカード・決済が有利かで判断してください。",
      ],
      en: [
        "The cashless ratio moves depending on what sits in the denominator — private final consumption, household survey data, and so on.",
        "That is why the same year's ratio differs by several points between sources. Always cite the definition alongside the number.",
        "Our take: the national ratio has little to do with your own choice. Decide from your own spending mix.",
      ],
    },
    category: "cashless",
    kind: "editorial",
    tags: ["キャッシュレス", "統計"],
    sourceName: { ja: "CARD PORT 編集部", en: "CARD PORT editorial team" },
    sourceUrl: "",
    publishedAt: "2026-07-05",
    updatedAt: "2026-07-05",
    readingMinutes: 4,
    authorId: "editorial",
    relatedCardIds: [],
    accent: "cyan",
  },
  {
    id: "news-006",
    slug: "chainbridge-region-restriction",
    title: {
      ja: "チェーンブリッジ、一部地域でのカード発行を停止",
      en: "ChainBridge suspends card issuance in some regions",
    },
    summary: {
      ja: "規制対応のため、対象地域の新規発行を停止。既存カードの利用可否は地域により異なります。",
      en: "New issuance is suspended in affected regions for regulatory reasons; existing cards vary by region.",
    },
    body: {
      ja: [
        "チェーンブリッジは、規制対応のため一部地域での新規カード発行を停止したと発表しました。",
        "既存カードの利用可否は地域により異なります。対象地域の会員には個別に案内があるとしています。",
        "編集部の見方：暗号資産関連サービスは規制の影響を受けやすく、地域制限が突然変わることがあります。生活費の決済を1枚に依存させないことをおすすめします。",
      ],
      en: [
        "ChainBridge has suspended new card issuance in certain regions for regulatory reasons.",
        "Whether existing cards keep working depends on the region; affected members are being contacted individually.",
        "Our take: crypto-linked services are exposed to regulatory change, and geo-restrictions can shift suddenly. Do not make one such card your only way to pay for essentials.",
      ],
    },
    category: "regulation",
    kind: "official",
    tags: ["暗号資産", "規制", "地域制限"],
    sourceName: { ja: "チェーンブリッジ（架空）", en: "ChainBridge (fictional)" },
    sourceUrl: "https://example.com/chainbridge/news",
    publishedAt: "2026-07-02",
    updatedAt: "2026-07-10",
    readingMinutes: 3,
    authorId: "editorial",
    supervisorId: "supervisor-kanzaki",
    relatedCardIds: ["chainbridge-flow", "chainbridge-nova"],
    accent: "magenta",
  },
  {
    id: "news-007",
    slug: "phishing-alert-card-brands",
    title: {
      ja: "カード会社を装うフィッシングに注意",
      en: "Watch out for phishing that impersonates card issuers",
    },
    summary: {
      ja: "「利用確認」を装ってカード番号とセキュリティコードを入力させる手口が確認されています。",
      en: "Messages posing as 'usage confirmation' are being used to harvest card numbers and security codes.",
    },
    body: {
      ja: [
        "カード会社を名乗るメールやSMSから偽サイトへ誘導し、カード番号・有効期限・セキュリティコードを入力させる手口が報告されています。",
        "カード会社が、メールやSMSのリンクからセキュリティコードの入力を求めることはありません。",
        "身に覚えのない連絡を受け取ったら、リンクを開かず、カード裏面に記載された電話番号か公式アプリから確認してください。",
        "当サイトのAIチャットボットも、カード番号やセキュリティコードの入力を求めることはありません。入力しないでください。",
      ],
      en: [
        "Emails and SMS posing as issuers are directing people to fake sites that ask for the card number, expiry and security code.",
        "Issuers do not ask for a security code via a link in an email or SMS.",
        "If you get an unexpected message, do not open the link — call the number on the back of your card or use the official app.",
        "Our AI concierge will never ask for a card number or security code either. Do not enter them.",
      ],
    },
    category: "security",
    kind: "editorial",
    tags: ["セキュリティ", "フィッシング", "不正利用"],
    sourceName: { ja: "CARD PORT 編集部", en: "CARD PORT editorial team" },
    sourceUrl: "",
    publishedAt: "2026-06-28",
    updatedAt: "2026-07-14",
    readingMinutes: 3,
    authorId: "editorial",
    supervisorId: "supervisor-kanzaki",
    relatedCardIds: [],
    accent: "magenta",
  },
  {
    id: "news-008",
    slug: "mile-award-chart-change",
    title: {
      ja: "提携航空会社、特典航空券の必要マイル数を改定",
      en: "Partner airline revises its award chart",
    },
    summary: {
      ja: "一部路線で必要マイル数が増加。マイルを貯める前に、目的の路線の必要数を確認してください。",
      en: "Some routes now cost more miles. Check the requirement for your route before you start collecting.",
    },
    body: {
      ja: [
        "提携航空会社が特典航空券の必要マイル数を改定し、一部路線で必要数が増えました。",
        "マイルは「貯めた時点の価値」で固定されるものではありません。航空会社の規定変更により、同じマイル数で交換できる範囲は変わります。",
        "編集部の見方：マイル目的でカードを選ぶ場合は、貯める前に目的の路線の必要マイル数を確認し、必要数の変更がありうる前提で計画してください。",
      ],
      en: [
        "A partner airline has revised its award chart, raising the miles needed on some routes.",
        "Miles are not locked to the value they had when you earned them; what a given balance buys changes with the airline's rules.",
        "Our take: if you are picking a card for miles, check your target route first and plan on the assumption that requirements can change.",
      ],
    },
    category: "mile",
    kind: "press",
    tags: ["マイル", "特典航空券"],
    sourceName: { ja: "航空業界向け報道（架空）", en: "Aviation trade press (fictional)" },
    sourceUrl: "",
    publishedAt: "2026-06-22",
    updatedAt: "2026-06-22",
    readingMinutes: 3,
    authorId: "author-hayama",
    relatedCardIds: ["meridian-sky", "aurum-platinum", "nova-travel"],
    accent: "electric",
  },
  {
    id: "news-009",
    slug: "hoshimart-plus-campaign",
    title: {
      ja: "ホシマート プラス、グループ店舗の還元率+2%キャンペーン",
      en: "Hoshi Mart Plus runs a 2% uplift at group stores",
    },
    summary: {
      ja: "3か月間の期間限定。上乗せ分の上限は6,000ポイントです。",
      en: "A three-month promotion, with the uplift capped at 6,000 points.",
    },
    body: {
      ja: [
        "ホシマートは、ホシマート プラスの新規入会者を対象に、グループ店舗での還元率を3か月間+2%とするキャンペーンを開始しました。",
        "上乗せ分の上限は合計6,000ポイントです。上限に達したあとは通常の還元率に戻ります。",
        "対象は新規入会者のみで、すでにカードを保有している方は対象外です。",
      ],
      en: [
        "Hoshi Mart is offering new Hoshi Mart Plus members a 2% uplift at group stores for three months.",
        "The uplift is capped at 6,000 points in total, after which the normal rate applies.",
        "New members only; existing cardholders are excluded.",
      ],
    },
    category: "campaign",
    kind: "campaign",
    tags: ["キャンペーン", "ホシマート"],
    sourceName: { ja: "ホシマート（架空）", en: "Hoshi Mart (fictional)" },
    sourceUrl: "https://example.com/hoshimart-plus/campaign",
    publishedAt: "2026-06-15",
    updatedAt: "2026-06-15",
    readingMinutes: 2,
    authorId: "editorial",
    relatedCardIds: ["hoshimart-plus", "hoshimart-gold"],
    accent: "emerald",
  },
  {
    id: "news-010",
    slug: "virtual-card-fraud-prevention",
    title: {
      ja: "バーチャルカードで不正利用の被害を抑える",
      en: "Using virtual cards to limit fraud exposure",
    },
    summary: {
      ja: "用途ごとに番号を分けると、番号が漏れたときの影響範囲を限定できます。",
      en: "Separate numbers per use case contain the damage when one leaks.",
    },
    body: {
      ja: [
        "結論：ネット通販や海外サイトの支払いは、用途ごとにバーチャルカード番号を分けると、漏えい時の影響を1つの番号に限定できます。",
        "本カードの番号を直接入力すると、漏えい時にカード自体を止める必要があり、他の定期課金も止まります。",
        "バーチャルカードは1枚ごとに利用上限と有効期限を設定できるため、定期課金の解約漏れ対策にもなります。",
        "注意点：3Dセキュアに対応していない加盟店では使えない場合があります。",
      ],
      en: [
        "The point: issuing a separate virtual number per use case confines a leak to that one number.",
        "Enter your real card number and a leak forces you to cancel the card, taking every recurring charge with it.",
        "Each virtual card can carry its own limit and expiry, which also helps with subscriptions you forget to cancel.",
        "Caveat: merchants without 3-D Secure may not accept them.",
      ],
    },
    category: "fraud",
    kind: "editorial",
    tags: ["バーチャルカード", "不正利用", "セキュリティ"],
    sourceName: { ja: "CARD PORT 編集部", en: "CARD PORT editorial team" },
    sourceUrl: "",
    publishedAt: "2026-06-10",
    updatedAt: "2026-07-01",
    readingMinutes: 4,
    authorId: "author-hayama",
    supervisorId: "supervisor-kanzaki",
    relatedCardIds: ["orbit-virtual", "orbit-business"],
    accent: "violet",
  },
  {
    id: "news-011",
    slug: "stablecoin-settlement-pilot",
    title: {
      ja: "ステーブルコイン決済の実証、加盟店側の会計処理が課題に",
      en: "Stablecoin settlement pilots run into merchant accounting questions",
    },
    summary: {
      ja: "決済自体は成立しても、受領時の会計・税務の扱いが実務上の障壁になっています。",
      en: "Settlement works; how merchants book and tax the receipt is the harder problem.",
    },
    body: {
      ja: [
        "ステーブルコインによる決済の実証では、決済処理そのものより、加盟店側の会計・税務処理が課題として挙がっています。",
        "受領した資産をいつ、いくらで計上するかは、価格の参照時点によって変わります。",
        "編集部の見方：利用者側から見ると、支払い手段としての利便性より、加盟店の対応状況のほうが普及の律速になります。",
      ],
      en: [
        "In stablecoin settlement pilots, the sticking point is less the payment itself than how merchants account for and tax the receipt.",
        "When and at what price the received asset is booked depends on which price reference is used.",
        "Our take: from a consumer's side, merchant readiness — not convenience — is what gates adoption.",
      ],
    },
    category: "web3",
    kind: "press",
    tags: ["ステーブルコイン", "Web3", "決済"],
    sourceName: { ja: "決済業界向け報道（架空）", en: "Payments trade press (fictional)" },
    sourceUrl: "",
    publishedAt: "2026-06-05",
    updatedAt: "2026-06-05",
    readingMinutes: 4,
    authorId: "editorial",
    relatedCardIds: ["chainbridge-flow"],
    accent: "magenta",
  },
  {
    id: "news-012",
    slug: "annual-fee-vs-benefit",
    title: {
      ja: "【比較】年会費11,000円のゴールドは、いくら使えば元が取れるか",
      en: "Comparison: how much must you spend for an ¥11,000 gold card to pay off?",
    },
    summary: {
      ja: "還元だけで回収する場合と、保険・ラウンジを含めた場合の2通りで計算しました。",
      en: "We calculate two ways: rewards alone, and rewards plus insurance and lounge value.",
    },
    body: {
      ja: [
        "結論：還元だけで年会費11,000円を回収するには、基本還元率1.0%なら年間110万円の利用が必要です。",
        "保険とラウンジを金額に換算すると回収ラインは下がりますが、その価値は「実際に使ったかどうか」でしか決まりません。年3回ラウンジを使い、年2回旅行するなら、およそ9,300円分に相当します。",
        "この場合、還元で残り1,700円を賄えばよく、必要な年間利用額は17万円まで下がります。",
        "注意点：ラウンジも保険も使わない年は、回収ラインは110万円のままです。前年の実績で判断してください。",
      ],
      en: [
        "The short answer: on rewards alone at a 1.0% base rate, you need ¥1,100,000 of annual spend to clear an ¥11,000 fee.",
        "Counting insurance and lounges lowers the bar, but only if you actually use them. Three lounge visits and two trips a year comes to roughly ¥9,300 of value.",
        "That leaves ¥1,700 for rewards to cover — about ¥170,000 of annual spend.",
        "Caveat: in a year you use neither, the bar is back at ¥1,100,000. Judge from last year's actual behaviour.",
      ],
    },
    category: "card",
    kind: "comparison",
    tags: ["ゴールドカード", "年会費", "比較"],
    sourceName: { ja: "CARD PORT 編集部", en: "CARD PORT editorial team" },
    sourceUrl: "",
    publishedAt: "2026-05-30",
    updatedAt: "2026-07-11",
    readingMinutes: 5,
    authorId: "author-hayama",
    supervisorId: "supervisor-kanzaki",
    relatedCardIds: ["meridian-gold", "hoshimart-gold", "nova-travel"],
    accent: "gold",
  },
];

const newsMap = new Map(news.map((article) => [article.slug, article]));
const newsIdMap = new Map(news.map((article) => [article.id, article]));

export function getNewsBySlug(slug: string) {
  return newsMap.get(slug);
}

export function getNewsByIds(ids: string[]) {
  return ids
    .map((id) => newsIdMap.get(id))
    .filter((article): article is NewsArticle => Boolean(article));
}

/** 新しい順 */
export function getNews(limit?: number): NewsArticle[] {
  const sorted = [...news].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export function getNewsByCategory(
  categories: NewsArticle["category"][],
  limit?: number,
): NewsArticle[] {
  const filtered = getNews().filter((article) => categories.includes(article.category));
  return typeof limit === "number" ? filtered.slice(0, limit) : filtered;
}

/**
 * 同じ発表を扱う記事をまとめます。
 * 代表記事は「公式発表 → 公開が新しい順」で選びます。
 */
export function groupByStory(list: NewsArticle[]): { lead: NewsArticle; others: NewsArticle[] }[] {
  const groups = new Map<string, NewsArticle[]>();
  for (const article of list) {
    const key = article.storyKey ?? article.id;
    groups.set(key, [...(groups.get(key) ?? []), article]);
  }
  return [...groups.values()]
    .map((articles) => {
      const sorted = [...articles].sort((a, b) => {
        if (a.kind === "official" && b.kind !== "official") return -1;
        if (b.kind === "official" && a.kind !== "official") return 1;
        return b.publishedAt.localeCompare(a.publishedAt);
      });
      return { lead: sorted[0], others: sorted.slice(1) };
    })
    .sort((a, b) => b.lead.publishedAt.localeCompare(a.lead.publishedAt));
}
