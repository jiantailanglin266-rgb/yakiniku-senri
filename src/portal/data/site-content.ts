/**
 * ナビゲーション・FAQ・キャンペーン・固定ページなど、サイト共通のコンテンツ。
 */

import type { Campaign, FaqItem, LocalizedText } from "@/portal/lib/types";

export type NavItem = {
  /** 言語プレフィックスを除いたパス */
  href: string;
  label: LocalizedText;
  /** 子メニュー（デスクトップのメガメニュー用） */
  children?: NavItem[];
};

export const mainNav: NavItem[] = [
  {
    href: "/coins",
    label: { ja: "マーケット", en: "Market" },
    children: [
      { href: "/coins", label: { ja: "仮想通貨一覧", en: "All coins" } },
      { href: "/coins/bitcoin", label: { ja: "ビットコイン", en: "Bitcoin" } },
      { href: "/coins/ethereum", label: { ja: "イーサリアム", en: "Ethereum" } },
    ],
  },
  { href: "/news", label: { ja: "ニュース", en: "News" } },
  {
    href: "/exchanges",
    label: { ja: "取引所", en: "Exchanges" },
    children: [
      { href: "/exchanges", label: { ja: "国内取引所比較", en: "Japanese exchanges" } },
      { href: "/exchanges/overseas", label: { ja: "海外取引所比較", en: "Global exchanges" } },
      { href: "/campaigns", label: { ja: "キャンペーン", en: "Campaigns" } },
    ],
  },
  { href: "/wallets", label: { ja: "ウォレット", en: "Wallets" } },
  { href: "/tools", label: { ja: "Web3ツール", en: "Web3 tools" } },
  { href: "/videos", label: { ja: "動画", en: "Videos" } },
  { href: "/learn", label: { ja: "学ぶ", en: "Learn" } },
  { href: "/diagnosis", label: { ja: "診断", en: "Quiz" } },
];

export const footerNav: { title: LocalizedText; items: NavItem[] }[] = [
  {
    title: { ja: "マーケット", en: "Market" },
    items: [
      { href: "/coins", label: { ja: "仮想通貨一覧", en: "All coins" } },
      { href: "/news", label: { ja: "ニュース", en: "News" } },
      { href: "/campaigns", label: { ja: "キャンペーン", en: "Campaigns" } },
      { href: "/search", label: { ja: "サイト内検索", en: "Search" } },
    ],
  },
  {
    title: { ja: "比較する", en: "Compare" },
    items: [
      { href: "/exchanges", label: { ja: "国内取引所", en: "Japanese exchanges" } },
      { href: "/exchanges/overseas", label: { ja: "海外取引所", en: "Global exchanges" } },
      { href: "/wallets", label: { ja: "ウォレット", en: "Wallets" } },
      { href: "/tools", label: { ja: "Web3ツール", en: "Web3 tools" } },
    ],
  },
  {
    title: { ja: "学ぶ", en: "Learn" },
    items: [
      { href: "/learn", label: { ja: "学習コンテンツ", en: "Guides" } },
      { href: "/videos", label: { ja: "動画", en: "Videos" } },
      { href: "/diagnosis", label: { ja: "診断ツール", en: "Quizzes" } },
      { href: "/faq", label: { ja: "よくある質問", en: "FAQ" } },
    ],
  },
  {
    title: { ja: "サイトについて", en: "About" },
    items: [
      { href: "/legal/about", label: { ja: "運営者情報", en: "About us" } },
      { href: "/legal/editorial-policy", label: { ja: "編集方針", en: "Editorial policy" } },
      {
        href: "/legal/advertising-policy",
        label: { ja: "広告掲載ポリシー", en: "Advertising policy" },
      },
      {
        href: "/legal/affiliate-policy",
        label: { ja: "アフィリエイトポリシー", en: "Affiliate policy" },
      },
      { href: "/legal/disclaimer", label: { ja: "免責事項", en: "Disclaimer" } },
      { href: "/legal/privacy", label: { ja: "プライバシーポリシー", en: "Privacy policy" } },
      { href: "/legal/terms", label: { ja: "利用規約", en: "Terms of use" } },
      { href: "/legal/cookie", label: { ja: "Cookieポリシー", en: "Cookie policy" } },
      { href: "/legal/sources", label: { ja: "情報提供元", en: "Data sources" } },
      {
        href: "/legal/corrections",
        label: { ja: "コンテンツ修正依頼", en: "Request a correction" },
      },
      { href: "/legal/copyright", label: { ja: "著作権ポリシー", en: "Copyright policy" } },
      { href: "/legal/contact", label: { ja: "お問い合わせ", en: "Contact" } },
    ],
  },
];

export const siteFaq: FaqItem[] = [
  {
    q: { ja: "仮想通貨はいくらから買えますか？", en: "What is the smallest amount I can buy?" },
    a: {
      ja: "取引所によって異なりますが、国内取引所では数百円から購入できる場合が多くあります。最低金額は銘柄と取引形式（販売所か板取引か）でも変わるため、各社の公式サイトでご確認ください。",
      en: "It varies by exchange, but purchases of a few hundred yen are common in Japan. The minimum also depends on the asset and whether you use the brokerage or the order book — check each operator's official site.",
    },
  },
  {
    q: {
      ja: "取引所とウォレットは何が違いますか？",
      en: "What is the difference between an exchange and a wallet?",
    },
    a: {
      ja: "取引所は売買を仲介する事業者で、預けた資産の鍵は事業者が管理します。ウォレットは秘密鍵を自分で管理する道具です。取引所に置いたままの状態は、鍵を他人に預けている状態にあたります。",
      en: "An exchange intermediates trades and holds the keys to what you deposit. A wallet is a tool for holding your own keys. Leaving assets on an exchange means someone else holds the key.",
    },
  },
  {
    q: {
      ja: "海外取引所は使っても問題ありませんか？",
      en: "Is it a problem to use a global exchange?",
    },
    a: {
      ja: "海外取引所は日本の暗号資産交換業者として登録されていない場合があります。日本語サポートや税務書類が用意されないことや、トラブル時に日本の法律で保護されない可能性があります。利用の可否と条件は必ずご自身でご確認ください。",
      en: "Global exchanges may not be registered as crypto-asset exchange providers in Japan. Japanese-language support and tax documents may be unavailable, and you may not be protected under Japanese law in a dispute. Confirm the terms and your eligibility yourself.",
    },
  },
  {
    q: { ja: "価格はリアルタイムですか？", en: "Are the prices real time?" },
    a: {
      ja: "いいえ。当サイトの価格はキャッシュを挟んで定期的に更新しています。各画面に取得日時と更新間隔を表示していますので、そちらをご確認ください。取引の際は必ず取引所の表示価格をご確認ください。",
      en: "No. Prices are cached and refreshed periodically. Every screen shows the fetch time and the refresh interval. Always confirm the price on the exchange before trading.",
    },
  },
  {
    q: {
      ja: "掲載されている取引所の順位はどう決めていますか？",
      en: "How are the exchange rankings decided?",
    },
    a: {
      ja: "編集部が定めた基準（手数料・取扱銘柄・セキュリティ・使いやすさ）にもとづく評価です。アフィリエイト報酬の額のみで順位を決めることはありません。評価の内訳は各取引所のページに表示しています。",
      en: "They reflect editorial scores across fees, listed assets, security and usability. Commission alone never determines the ranking, and the score breakdown is published on each exchange page.",
    },
  },
  {
    q: {
      ja: "AIチャットボットは投資助言をしてくれますか？",
      en: "Can the AI assistant give investment advice?",
    },
    a: {
      ja: "いいえ。用語の説明、サイト内の記事検索、比較情報の案内までを行います。特定の銘柄の購入を勧めることや、価格の予想を断定することはありません。",
      en: "No. It explains terms, finds articles on this site and points to comparisons. It will not recommend buying any asset or state price predictions as fact.",
    },
  },
  {
    q: {
      ja: "秘密鍵やシードフレーズを入力する画面はありますか？",
      en: "Will this site ever ask for my private key or seed phrase?",
    },
    a: {
      ja: "ありません。当サイトは秘密鍵・シードフレーズを一切扱いません。入力を求める画面が表示された場合、それは当サイトを装った偽サイトです。",
      en: "Never. This site does not handle private keys or seed phrases at all. If you see a screen asking for one, it is a fake site impersonating us.",
    },
  },
  {
    q: { ja: "情報が古い・誤っている場合は？", en: "What if information is out of date or wrong?" },
    a: {
      ja: "各ページの「コンテンツ修正依頼」からご連絡ください。確認のうえ、修正または削除し、修正日を明示します。",
      en: "Use the correction request link on any page. We verify, then correct or remove the content and publish the date of the change.",
    },
  },
];

/**
 * キャンペーン。
 * ⚠ 実在の条件を確認できていないため、既定では空にしています。
 *   実データを入れるまで、キャンペーンセクションは「掲載なし」と表示されます。
 *   （終了済み・存在しない特典を掲載すると景品表示法上の問題になります）
 */
export const campaigns: Campaign[] = [];

export function activeCampaigns(now = Date.now()): Campaign[] {
  return campaigns.filter((campaign) => {
    const started = Date.parse(campaign.startsAt) <= now;
    const notEnded = !campaign.endsAt || Date.parse(campaign.endsAt) >= now;
    return started && notEnded;
  });
}
