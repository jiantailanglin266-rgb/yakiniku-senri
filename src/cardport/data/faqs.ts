/**
 * よくある質問。
 *
 * 構造化データ（FAQPage）として出力するため、
 * 画面に表示している質問・回答とまったく同じ内容だけをここに置きます。
 */
import type { Faq } from "./types";

export const faqs: Faq[] = [
  {
    id: "faq-ranking",
    scope: "site",
    question: {
      ja: "ランキングの順位はどう決めていますか？",
      en: "How are your rankings decided?",
    },
    answer: {
      ja: "還元率・年会費の負担・特典・保険・使いやすさ・発行会社の信頼性の6項目を採点し、カテゴリごとに重みを変えて合計しています。重みと採点基準はランキング評価基準のページで公開しています。広告の報酬額は順位の計算に一切使用していません。",
      en: "We score six axes — reward rate, cost of holding, benefits, insurance, ease of use and issuer trust — and weight them differently per category. The weights and definitions are published on our ranking criteria page. Commission is never an input.",
    },
  },
  {
    id: "faq-ad",
    scope: "site",
    question: {
      ja: "広告リンクはどこに含まれていますか？",
      en: "Where are the advertising links?",
    },
    answer: {
      ja: '広告リンクには「PR」のラベルを付け、リンクに rel="sponsored nofollow" を設定しています。提携していないカードの公式サイトへのリンクは、広告ではないため PR ラベルを付けていません。',
      en: "Advertising links carry an 'AD' label and use rel=\"sponsored nofollow\". Links to the official sites of cards we have no partnership with are not advertising and carry no label.",
    },
  },
  {
    id: "faq-approval",
    scope: "card",
    question: {
      ja: "診断結果のカードなら審査に通りますか？",
      en: "Will I be approved for the card the finder suggests?",
    },
    answer: {
      ja: "いいえ。診断は入力条件と当サイト掲載データの一致度を計算しているだけで、審査の通過・発行・利用限度額を保証するものではありません。審査基準はカード会社が公開しておらず、当サイトでも把握していません。",
      en: "No. The finder only measures how closely your answers match the data we publish. It does not guarantee approval, issuance or any credit limit. Issuers do not publish their criteria and we do not know them.",
    },
  },
  {
    id: "faq-data",
    scope: "site",
    question: {
      ja: "掲載している数値はいつの情報ですか？",
      en: "When was the data on this site checked?",
    },
    answer: {
      ja: "各カードのページに「情報確認日」を表示しています。年会費・還元率・特典・保険・キャンペーンは変更されることがあるため、申込み前に必ず公式サイトで最新の条件をご確認ください。",
      en: "Each card page shows the date we last verified the figures. Fees, rates, benefits, insurance and campaigns change, so always confirm the current terms on the official site before applying.",
    },
  },
  {
    id: "faq-mock",
    scope: "site",
    question: { ja: "掲載カードは実在しますか？", en: "Are the cards listed here real?" },
    answer: {
      ja: "現在はサンプルデータで表示しています。カード名・券面デザイン・数値はすべて架空のもので、実在するカードの商標・意匠は使用していません。",
      en: "The site currently shows sample data. Card names, artwork and figures are fictional, and no real trademarks or card designs are used.",
    },
  },
  {
    id: "faq-region",
    scope: "site",
    question: { ja: "日本国外からでも申し込めますか？", en: "Can I apply from outside Japan?" },
    answer: {
      ja: "掲載しているカードは日本国内在住者向けの商品です。お住まいの国・地域によっては申込みできません。申込み条件は各カード会社の公式サイトでご確認ください。",
      en: "The cards listed are products for residents of Japan. Depending on your country or region you may not be eligible. Check each issuer's official site for the criteria.",
    },
  },
  {
    id: "faq-annual-fee",
    scope: "card",
    question: {
      ja: "「初年度無料」と「永年無料」は何が違いますか？",
      en: "What is the difference between 'free the first year' and 'free for life'?",
    },
    answer: {
      ja: "初年度無料は入会から1年間だけ年会費がかからず、2年目以降は所定の年会費が発生します。永年無料は条件なしでずっと無料です。「条件付き無料」は、年間の利用額などの条件を満たした場合にのみ無料になります。",
      en: "'Free the first year' waives the fee for twelve months only; the standard fee applies from year two. 'Free for life' has no fee ever. 'Free with conditions' waives it only when you meet a requirement such as an annual spend threshold.",
    },
  },
  {
    id: "faq-insurance",
    scope: "card",
    question: {
      ja: "旅行保険の「自動付帯」と「利用付帯」の違いは？",
      en: "What is the difference between automatic and usage-based travel insurance?",
    },
    answer: {
      ja: "自動付帯はカードを持っているだけで補償の対象になります。利用付帯は、旅行代金の一部または全部をそのカードで支払った場合にのみ対象になります。どの費用の支払いが条件になるかはカード会社によって異なるため、公式サイトでご確認ください。",
      en: "Automatic cover applies simply because you hold the card. Usage-based cover applies only if you paid for part or all of the trip with that card. Exactly which costs count varies by issuer — check the official terms.",
    },
  },
  {
    id: "faq-point-value",
    scope: "point",
    question: { ja: "1ポイントはいくらの価値がありますか？", en: "What is a point worth?" },
    answer: {
      ja: "交換先によって変わります。現金・ギフト券への交換は1ポイント＝1円が基準ですが、景品交換では1ポイントあたり0.6円程度になることもあります。カードを選ぶ前に、使いたい交換先のレートを確認してください。",
      en: "It depends on how you redeem. Cash and gift cards set the ¥1-per-point baseline, while merchandise can fall to around ¥0.6. Check the rate for the redemption you actually plan to use before choosing a card.",
    },
  },
  {
    id: "faq-business-doc",
    scope: "business",
    question: {
      ja: "法人カードは決算書がないと作れませんか？",
      en: "Do I need financial statements for a business card?",
    },
    answer: {
      ja: "カードによります。決算書や確定申告書の提出を求めないカードもありますが、書類が不要であることは審査がないことを意味しません。開業直後は利用限度額が低めに設定されることが一般的です。",
      en: "It varies. Some cards do not ask for statements or tax returns, but that does not mean there is no review. Newly formed businesses are typically given lower limits.",
    },
  },
  {
    id: "faq-business-personal",
    scope: "business",
    question: {
      ja: "個人カードを事業に使ってはいけませんか？",
      en: "Can I use a personal card for business?",
    },
    answer: {
      ja: "カード会社の会員規約により、事業目的での利用が制限されている場合があります。また、私費と事業費が混在すると経理処理の手間が増えます。事業用のカードを分けることをおすすめします。",
      en: "Some issuers' terms restrict business use of a personal card. Mixing personal and business spending also makes bookkeeping harder. Keeping a separate business card is the cleaner approach.",
    },
  },
  {
    id: "faq-crypto-risk",
    scope: "web3",
    question: { ja: "暗号資産カードは安全ですか？", en: "Are crypto cards safe?" },
    answer: {
      ja: "決済の仕組み自体は通常のカードと同じですが、還元や残高が暗号資産である場合、その価値は変動し、元本は保証されません。多くのサービスは資産をサービス提供会社が保管するため、提供会社の破綻時に資産が戻らない可能性があります。地域制限やサービス停止のリスクもあります。",
      en: "The payment mechanics are the same as any card, but when rewards or balances are held in crypto their value fluctuates and is not principal-protected. Most services custody assets on your behalf, so a provider failure can mean you do not get them back. Geo-restrictions and suspensions are also real risks.",
    },
  },
  {
    id: "faq-chat-safety",
    scope: "site",
    question: {
      ja: "AIチャットボットにカード番号を入力してもいいですか？",
      en: "Can I enter my card number in the AI concierge?",
    },
    answer: {
      ja: "入力しないでください。当サイトのチャットボットは、カード番号・セキュリティコード・暗証番号・本人確認書類の内容を一切必要としません。これらを求める画面が表示された場合は、偽サイトの可能性があります。",
      en: "No. Our concierge never needs a card number, security code, PIN or identity document details. If any page asks for them, treat it as a possible fake site.",
    },
  },
  {
    id: "faq-multiple",
    scope: "diagnosis",
    question: {
      ja: "複数のカードに同時に申し込んでもいいですか？",
      en: "Should I apply for several cards at once?",
    },
    answer: {
      ja: "短期間に多数の申込みを行うと、審査に影響する場合があると一般に言われています。当サイトでは、必要な枚数を絞ってから申し込むことをおすすめしています。特定の申込み方法が審査に有利になると保証することはできません。",
      en: "Making many applications in a short period is generally said to affect assessments. We suggest narrowing to the cards you actually need first. We cannot guarantee that any application strategy improves your odds.",
    },
  },
];

export function getFaqs(scope: Faq["scope"] | "all" = "all"): Faq[] {
  return scope === "all" ? faqs : faqs.filter((faq) => faq.scope === scope);
}
