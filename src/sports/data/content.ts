/**
 * FAQ・用語集・アフィリエイトリンク・チャットボットの参照文書・管理画面の指標。
 *
 * チャットボットは、この配列と data/*.ts を参照して回答します（RAG の参照先）。
 * 生成AIに自由回答させず、サイト内に根拠のある内容だけを返す設計です。
 */
import type { AffiliateLink, ChatDocument, Faq, LocalizedText } from "../types";

/* ------------------------------------------------------------------
   FAQ
   ------------------------------------------------------------------ */

export const faqs: Faq[] = [
  {
    id: "faq-update",
    question: {
      ja: "ライブスコアはどのくらいの間隔で更新されますか？",
      en: "How often do live scores update?",
    },
    answer: {
      ja: "競技によって異なります。各スコアカードに更新間隔と最終更新時刻を表示しているので、その値をご確認ください。データ取得に失敗した場合は、古い情報を最新として表示せず、取得できなかったことを明示します。",
      en: "It varies by sport. Each scorecard shows its refresh interval and last-updated time. If a fetch fails we say so rather than presenting stale numbers as current.",
    },
    scopes: ["home", "live"],
  },
  {
    id: "faq-timezone",
    question: {
      ja: "試合開始時刻はどのタイムゾーンで表示されますか？",
      en: "Which time zone are kick-off times shown in?",
    },
    answer: {
      ja: "お使いの端末のタイムゾーンへ自動変換して表示します。サーバー側で生成した時点では標準時で表示され、ページを開いた直後にお使いの環境の時刻へ切り替わります。",
      en: "They convert to your device's time zone. The server renders a standard time first, then the page switches to your local time once it loads.",
    },
    scopes: ["home", "matches"],
  },
  {
    id: "faq-mock",
    question: {
      ja: "掲載されているスコアや順位は実際のものですか？",
      en: "Are the scores and tables real?",
    },
    answer: {
      ja: "いいえ。現在はデモデータを表示しています。各データに「デモ」の表示と取得時刻を添えています。外部APIのキーを設定すると実データに切り替わります。",
      en: "No. The site is currently running on demo data, labelled as such on every panel. Configure an API key and it switches to live data.",
    },
    scopes: [],
  },
  {
    id: "faq-players",
    question: {
      ja: "選手名が聞いたことのない名前なのはなぜですか？",
      en: "Why don't I recognise any of the player names?",
    },
    answer: {
      ja: "デモデータの選手はすべて架空です。実在の選手に架空の成績・移籍・負傷情報を結び付けないための措置です。",
      en: "All demo players are fictional. We will not attach invented stats, transfers or injuries to real people.",
    },
    scopes: ["players"],
  },
  {
    id: "faq-streaming",
    question: { ja: "配信サービスの料金は最新ですか？", en: "Is the streaming pricing current?" },
    answer: {
      ja: "比較表の各サービスに「情報確認日」を表示しています。料金・放映権・配信対象は変更されるため、申込前に必ず公式サイトで最新情報をご確認ください。",
      en: "Each row shows the date we last verified it. Rights and prices change — always confirm on the official site before subscribing.",
    },
    scopes: ["streaming"],
  },
  {
    id: "faq-affiliate",
    question: { ja: "広告やアフィリエイトリンクはありますか？", en: "Do you use affiliate links?" },
    answer: {
      ja: 'あります。広告リンクには「PR」表記と rel="sponsored nofollow" を付与し、通常のリンクと区別できるようにしています。掲載順位が報酬額で決まることはありません。',
      en: 'Yes. Ad links carry an "Ad" label and rel="sponsored nofollow". Commission never determines ranking order.',
    },
    scopes: [],
  },
  {
    id: "faq-betting",
    question: {
      ja: "ベッティング情報を掲載しているのはなぜですか？",
      en: "Why do you cover betting at all?",
    },
    answer: {
      ja: "情報提供のみを目的として、法令・年齢制限・地域制限の解説を中心に掲載しています。賭博行為を勧誘するものではなく、「必ず勝てる」といった表現も使用しません。日本国内から海外のベッティングサービスを利用する行為は、法令に抵触するおそれがあります。",
      en: "Purely informationally, focused on the legal, age and regional limits. We do not solicit gambling and never claim guaranteed wins. Using offshore services from Japan may breach local law.",
    },
    scopes: ["betting"],
  },
  {
    id: "faq-video",
    question: { ja: "試合映像は見られますか？", en: "Can I watch match footage here?" },
    answer: {
      ja: "当サイトは映像の配信・転載を行いません。権利者が公開している動画の埋め込みと、正規の配信サービスへの案内のみを行います。違法配信サイトへのリンクは掲載しません。",
      en: "We do not host or redistribute footage. We embed rights-holder videos and point you at legitimate services. We never link to pirate streams.",
    },
    scopes: ["videos"],
  },
  {
    id: "faq-web3",
    question: {
      ja: "ファントークンやNFTの購入を勧めていますか？",
      en: "Are you recommending I buy fan tokens or NFTs?",
    },
    answer: {
      ja: "いいえ。仕組みとリスクの説明のみを行い、購入・投資は推奨しません。価格の上昇を示唆する表現も使用しません。",
      en: "No. We explain how they work and what can go wrong. We do not recommend buying and make no claims about prices.",
    },
    scopes: ["web3"],
  },
  {
    id: "faq-correction",
    question: { ja: "情報の誤りを見つけたときは？", en: "What if I find an error?" },
    answer: {
      ja: "「情報修正依頼」ページからご連絡ください。確認のうえ、必要な場合は更新日を明記して修正します。",
      en: "Use the correction request page. We check, fix and stamp the update date.",
    },
    scopes: [],
  },
];

export function faqsFor(scope: string): Faq[] {
  return faqs.filter((faq) => faq.scopes.length === 0 || faq.scopes.includes(scope));
}

/* ------------------------------------------------------------------
   用語集（検索の対象にも入ります）
   ------------------------------------------------------------------ */

export type GlossaryTerm = {
  id: string;
  term: LocalizedText;
  aliases: string[];
  description: LocalizedText;
  sportId?: string;
};

export const glossary: GlossaryTerm[] = [
  {
    id: "g-xg",
    term: { ja: "期待得点（xG）", en: "Expected goals (xG)" },
    aliases: ["xG", "期待得点", "expected goals"],
    sportId: "football",
    description: {
      ja: "シュート1本ごとに、そこから得点が生まれる確率を推定して足し合わせた指標です。実際の得点との差から、決定力や運の要素を読み取ります。",
      en: "The summed probability that each shot becomes a goal. The gap to actual goals hints at finishing quality or luck.",
    },
  },
  {
    id: "g-possession",
    term: { ja: "ボール支配率", en: "Possession" },
    aliases: ["支配率", "possession", "ポゼッション"],
    sportId: "football",
    description: {
      ja: "試合中にボールを保持していた時間の割合です。高いほど有利とは限らず、意図的に相手へ渡す戦術もあります。",
      en: "The share of the match a side held the ball. More is not automatically better — some sides give it away deliberately.",
    },
  },
  {
    id: "g-tripledouble",
    term: { ja: "トリプルダブル", en: "Triple-double" },
    aliases: ["トリプルダブル", "triple double"],
    sportId: "basketball",
    description: {
      ja: "得点・リバウンド・アシストなどの主要5項目のうち3つで、2桁を記録することです。",
      en: "Double figures in three of the five main statistical categories in one game.",
    },
  },
  {
    id: "g-clean-sheet",
    term: { ja: "クリーンシート", en: "Clean sheet" },
    aliases: ["完封", "clean sheet"],
    sportId: "football",
    description: {
      ja: "1試合を通じて無失点に抑えることです。",
      en: "Keeping the opposition scoreless for a whole match.",
    },
  },
  {
    id: "g-era",
    term: { ja: "防御率（ERA）", en: "Earned run average (ERA)" },
    aliases: ["防御率", "ERA"],
    sportId: "baseball",
    description: {
      ja: "投手が9イニングあたりに許した自責点の平均です。低いほど優秀とされます。",
      en: "Earned runs allowed per nine innings. Lower is better.",
    },
  },
  {
    id: "g-drs",
    term: { ja: "DRS", en: "DRS" },
    aliases: ["DRS", "ドラッグリダクションシステム"],
    sportId: "f1",
    description: {
      ja: "追い越しを促すために、条件を満たしたときリアウイングを開いて空気抵抗を減らす仕組みです。",
      en: "A movable rear wing that reduces drag under set conditions to aid overtaking.",
    },
  },
  {
    id: "g-ppv",
    term: { ja: "PPV（ペイ・パー・ビュー）", en: "Pay-per-view (PPV)" },
    aliases: ["PPV", "ペイパービュー"],
    description: {
      ja: "月額とは別に、1つの興行・試合ごとに視聴料を支払う方式です。",
      en: "Paying per event on top of any monthly subscription.",
    },
  },
  {
    id: "g-blackout",
    term: { ja: "ブラックアウト", en: "Blackout" },
    aliases: ["ブラックアウト", "blackout"],
    description: {
      ja: "放映権の都合で、特定の地域からは特定の試合が視聴できなくなることです。",
      en: "When rights arrangements make specific games unavailable in specific regions.",
    },
  },
  {
    id: "g-fan-token",
    term: { ja: "ファントークン", en: "Fan token" },
    aliases: ["ファントークン", "fan token"],
    description: {
      ja: "クラブや団体が発行し、投票参加権や特典へのアクセスを伴うトークンです。株式や出資ではありません。",
      en: "A club-issued token granting voting participation and perks. It is not equity.",
    },
  },
  {
    id: "g-rag",
    term: { ja: "RAG", en: "RAG" },
    aliases: ["RAG", "検索拡張生成"],
    description: {
      ja: "AIが回答する前に、信頼できる文書を検索して根拠にする仕組みです。当サイトのチャットボットもこの方式です。",
      en: "Retrieval-augmented generation: the assistant looks up trusted documents before answering. Ours works this way.",
    },
  },
];

/* ------------------------------------------------------------------
   アフィリエイトリンク管理
   ------------------------------------------------------------------ */

export const affiliateLinks: AffiliateLink[] = [
  {
    id: "aff-global-football",
    campaign: "streaming-compare",
    label: { ja: "公式サイトで確認する", en: "Check the official site" },
    url: "https://example.com/global-football-pass",
    overrides: [{ locale: "en", url: "https://example.com/global-football-pass?lang=en" }],
    variants: [
      { id: "a", label: { ja: "公式サイトで確認する", en: "Check the official site" } },
      { id: "b", label: { ja: "無料体験を確認する", en: "Check the free trial" } },
    ],
    disclosure: true,
    active: true,
  },
  {
    id: "aff-allsports",
    campaign: "streaming-compare",
    label: { ja: "公式サイトで確認する", en: "Check the official site" },
    url: "https://example.com/allsports-terminal",
    disclosure: true,
    active: true,
  },
  {
    id: "aff-nippon-sports",
    campaign: "streaming-compare",
    label: { ja: "配信予定を見る", en: "See the schedule" },
    url: "https://example.com/nippon-sports-plus",
    disclosure: true,
    active: true,
  },
  {
    id: "aff-hoops",
    campaign: "streaming-compare",
    label: { ja: "無料体験を確認する", en: "Check the free trial" },
    url: "https://example.com/hoops-pass",
    disclosure: true,
    active: true,
  },
  {
    id: "aff-diamond",
    campaign: "streaming-compare",
    label: { ja: "公式サイトで確認する", en: "Check the official site" },
    url: "https://example.com/diamond-tv",
    disclosure: true,
    active: true,
  },
  {
    id: "aff-gridiron",
    campaign: "streaming-compare",
    label: { ja: "公式サイトで確認する", en: "Check the official site" },
    url: "https://example.com/gridiron-now",
    disclosure: true,
    active: true,
  },
  {
    id: "aff-velocity",
    campaign: "streaming-compare",
    label: { ja: "公式サイトで確認する", en: "Check the official site" },
    url: "https://example.com/velocity-tv",
    disclosure: true,
    active: true,
  },
  {
    id: "aff-cage",
    campaign: "streaming-compare",
    label: { ja: "公式サイトで確認する", en: "Check the official site" },
    url: "https://example.com/cage-live",
    disclosure: true,
    active: true,
  },
  {
    id: "aff-fanvote",
    campaign: "web3",
    label: { ja: "公式サイトで確認する", en: "Check the official site" },
    url: "https://example.com/fanvote-arena",
    disclosure: true,
    active: true,
  },
  {
    id: "aff-moment",
    campaign: "web3",
    label: { ja: "公式サイトで確認する", en: "Check the official site" },
    url: "https://example.com/moment-vault",
    disclosure: true,
    active: true,
  },
  {
    id: "aff-tickets",
    campaign: "ticket",
    label: { ja: "チケットを確認する", en: "Check tickets" },
    url: "https://example.com/tickets",
    disclosure: true,
    active: true,
  },
  {
    id: "aff-goods",
    campaign: "goods",
    label: { ja: "関連グッズを見る", en: "Browse merchandise" },
    url: "https://example.com/goods",
    disclosure: true,
    active: true,
  },
];

export const affiliateById = new Map(affiliateLinks.map((link) => [link.id, link]));

/**
 * 言語・地域に応じたリンク先を返します。
 * 該当が無ければ既定のURLを返すため、リンク切れにはなりません。
 */
export function resolveAffiliateUrl(
  id: string | undefined,
  locale: string,
  region?: string,
): string | undefined {
  if (!id) return undefined;
  const link = affiliateById.get(id);
  if (!link || !link.active) return undefined;
  const override = link.overrides?.find(
    (item) =>
      (item.locale ? item.locale === locale : true) &&
      (item.region ? item.region === region : true),
  );
  return override?.url ?? link.url;
}

/* ------------------------------------------------------------------
   チャットボットの参照文書
   ------------------------------------------------------------------ */

export const chatDocuments: ChatDocument[] = [
  {
    id: "c-today",
    kind: "match",
    realtime: true,
    question: { ja: "今日の試合を教えて", en: "What's on today?" },
    answer: {
      ja: "本日開催の試合は「今日の試合日程」にまとめています。試合中のものはライブスコアページで確認できます。各カードに最終更新時刻を表示しているので、必ずあわせてご確認ください。",
      en: "Today's fixtures are on the schedule page, and anything in progress is on the live scores page. Check the last-updated stamp on each card.",
    },
    keywords: ["今日", "試合", "日程", "today", "match", "fixture", "schedule", "きょう"],
    links: [
      { label: { ja: "今日の試合日程", en: "Today's schedule" }, href: "/matches" },
      { label: { ja: "ライブスコア", en: "Live scores" }, href: "/live" },
    ],
  },
  {
    id: "c-live",
    kind: "match",
    realtime: true,
    question: { ja: "ライブスコアはどこで見られますか", en: "Where are the live scores?" },
    answer: {
      ja: "ライブスコアページで、進行中の全試合を競技別に確認できます。更新間隔は競技ごとに異なり、各カードに表示しています。",
      en: "The live page lists every match in progress by sport, with each card showing its own refresh interval.",
    },
    keywords: ["ライブ", "速報", "スコア", "live", "score", "リアルタイム"],
    links: [{ label: { ja: "ライブスコア", en: "Live scores" }, href: "/live" }],
  },
  {
    id: "c-standings",
    kind: "league",
    realtime: true,
    question: { ja: "順位表を見たい", en: "Show me the standings" },
    answer: {
      ja: "各リーグページに順位表があります。スマートフォンでは表とカードの表示を切り替えられます。",
      en: "Every league page has a table. On a phone you can switch between table and card views.",
    },
    keywords: ["順位", "順位表", "standing", "table", "ランキング"],
    links: [{ label: { ja: "リーグ一覧", en: "All leagues" }, href: "/leagues" }],
  },
  {
    id: "c-streaming",
    kind: "streaming",
    realtime: false,
    question: {
      ja: "どの配信サービスを選べばいい？",
      en: "Which streaming service should I pick?",
    },
    answer: {
      ja: "見たい競技・予算・視聴環境で変わります。比較表で対象大会・料金・無料期間・同時視聴を横並びで確認できます。迷う場合は配信サービス診断が早いです。料金と対象大会は変更されるため、申込前に必ず公式サイトをご確認ください。",
      en: "It depends on your sport, budget and setup. The comparison table lines up competitions, price, trial and simultaneous streams. The quiz is quicker if you're unsure. Always confirm on the official site before subscribing.",
    },
    keywords: ["配信", "サービス", "視聴", "streaming", "watch", "見る", "料金", "比較"],
    links: [
      { label: { ja: "配信サービス比較", en: "Streaming comparison" }, href: "/streaming" },
      {
        label: { ja: "配信サービス診断", en: "Streaming quiz" },
        href: "/diagnosis/streaming-service",
      },
    ],
  },
  {
    id: "c-beginner",
    kind: "guide",
    realtime: false,
    question: { ja: "スポーツ観戦をはじめたい", en: "I want to start watching sport" },
    answer: {
      ja: "まず「あなたに合うスポーツ診断」で競技を絞り、初心者ガイドでルールの要点を押さえるのが最短です。生活時間に合う競技を選ぶのが、続けるいちばんのコツです。",
      en: "Take the sport quiz, then read the beginner's guide. Picking something that fits your schedule is what makes it stick.",
    },
    keywords: ["初心者", "はじめて", "ルール", "beginner", "start", "how to", "入門"],
    links: [
      {
        label: { ja: "あなたに合うスポーツ診断", en: "Find your sport" },
        href: "/diagnosis/your-sport",
      },
      { label: { ja: "初心者ガイド", en: "Beginner's guide" }, href: "/guide" },
    ],
  },
  {
    id: "c-web3",
    kind: "web3",
    realtime: false,
    question: { ja: "ファントークンとは？", en: "What is a fan token?" },
    answer: {
      ja: "クラブが発行し、投票参加権や特典へのアクセスを伴うトークンです。株式や出資ではありません。価格変動・サービス終了・規制変更・詐欺のリスクがあります。当サイトは購入を推奨しません。",
      en: "A club-issued token that grants voting participation and perks. It is not equity. Risks include volatility, shutdown, regulation and fraud. We do not recommend buying.",
    },
    keywords: ["ファントークン", "トークン", "nft", "web3", "fan token", "暗号資産"],
    links: [
      { label: { ja: "Web3.0 スポーツサービス", en: "Web3 sports services" }, href: "/web3" },
      { label: { ja: "ファントークン", en: "Fan tokens" }, href: "/fan-tokens" },
    ],
  },
  {
    id: "c-betting",
    kind: "faq",
    realtime: false,
    question: { ja: "ベッティングについて教えて", en: "Tell me about betting" },
    answer: {
      ja: "当サイトは情報提供のみを目的としており、賭博行為を勧誘しません。試合結果の予言や利益の保証も行いません。日本国内から海外のベッティングサービスを利用する行為は、法令に抵触するおそれがあります。年齢制限・地域制限・責任ある利用については掲載方針をご確認ください。",
      en: "We publish information only. We do not solicit gambling, predict results or promise returns. Using offshore services from Japan may breach local law — see our betting content policy.",
    },
    keywords: ["ベッティング", "賭け", "betting", "オッズ", "予想"],
    links: [
      {
        label: { ja: "ベッティング情報掲載方針", en: "Betting content policy" },
        href: "/legal/betting-policy",
      },
      {
        label: { ja: "責任ある利用に関する方針", en: "Responsible use policy" },
        href: "/legal/responsible-use",
      },
    ],
  },
  {
    id: "c-prediction",
    kind: "faq",
    realtime: false,
    question: { ja: "この試合はどっちが勝ちますか？", en: "Who's going to win?" },
    answer: {
      ja: "試合結果を予言することはできません。当サイトの分析は過去データの集計であり、将来の結果を保証するものではありません。試合ページのチーム比較・直近成績・対戦成績をご確認ください。",
      en: "I can't predict results. Our analysis aggregates past data and guarantees nothing about the future. The match page has team comparisons, recent form and head-to-head records.",
    },
    keywords: [
      "どっちが勝",
      "どちらが勝",
      "勝ちますか",
      "勝敗",
      "勝つ",
      "予想",
      "予測",
      "prediction",
      "who will win",
      "going to win",
    ],
    links: [{ label: { ja: "試合一覧", en: "All matches" }, href: "/matches" }],
  },
  {
    id: "c-video",
    kind: "video",
    realtime: false,
    question: { ja: "ハイライト動画はありますか", en: "Do you have highlights?" },
    answer: {
      ja: "動画ページに、試合ハイライト・分析・インタビューをまとめています。当サイトは映像の配信・転載を行わず、権利者が公開している動画のみを扱います。",
      en: "The videos page collects highlights, analysis and interviews. We only surface footage published by the rights holder.",
    },
    keywords: ["動画", "ハイライト", "video", "highlight", "youtube", "映像"],
    links: [{ label: { ja: "スポーツ動画", en: "Videos" }, href: "/videos" }],
  },
  {
    id: "c-search",
    kind: "faq",
    realtime: false,
    question: { ja: "チームや選手を探したい", en: "I want to find a team or player" },
    answer: {
      ja: "検索ページから、競技・リーグ・チーム・選手・ニュース・動画・配信サービス・用語を横断して検索できます。「マンU」「Man United」のような表記ゆれにも対応しています。",
      en: 'Search covers sports, leagues, teams, players, news, videos, services and glossary terms — including nicknames like "Man United".',
    },
    keywords: ["検索", "探す", "search", "find", "チーム", "選手"],
    links: [{ label: { ja: "検索", en: "Search" }, href: "/search" }],
  },
];

/* ------------------------------------------------------------------
   管理画面ダッシュボードの指標（デモ）
   ------------------------------------------------------------------ */

export const adminMetrics = {
  /** すべてデモ値です。実運用では計測基盤の集計値が入ります。 */
  summary: [
    {
      key: "pv",
      label: { ja: "PV（7日）", en: "Page views (7d)" },
      value: "128,430",
      change: 12.4,
    },
    {
      key: "users",
      label: { ja: "ユーザー数（7日）", en: "Users (7d)" },
      value: "41,206",
      change: 8.1,
    },
    {
      key: "live",
      label: { ja: "ライブ試合閲覧数", en: "Live match views" },
      value: "36,912",
      change: 24.7,
    },
    {
      key: "affiliate",
      label: { ja: "アフィリエイトクリック", en: "Affiliate clicks" },
      value: "2,184",
      change: -3.2,
    },
    {
      key: "diagnosis",
      label: { ja: "診断完了数", en: "Quiz completions" },
      value: "5,341",
      change: 18.9,
    },
    {
      key: "apiErrors",
      label: { ja: "APIエラー（24h）", en: "API errors (24h)" },
      value: "7",
      change: -41.0,
    },
  ],
  topSports: [
    { id: "football", value: 42 },
    { id: "basketball", value: 21 },
    { id: "baseball", value: 16 },
    { id: "esports", value: 11 },
    { id: "f1", value: 6 },
    { id: "mma", value: 4 },
  ],
  topLocales: [
    { code: "ja", value: 54 },
    { code: "en", value: 21 },
    { code: "ko", value: 7 },
    { code: "zh-cn", value: 6 },
    { code: "es", value: 5 },
    { code: "id", value: 4 },
    { code: "pt", value: 3 },
  ],
  issues: [
    {
      id: "i-1",
      label: { ja: "リンク切れ検知", en: "Broken links" },
      value: "0 件",
      severity: "ok" as const,
    },
    {
      id: "i-2",
      label: { ja: "情報確認日が90日以上前のサービス", en: "Services unverified for 90+ days" },
      value: "0 件",
      severity: "ok" as const,
    },
    {
      id: "i-3",
      label: { ja: "データ取得失敗（24h）", en: "Fetch failures (24h)" },
      value: "7 件",
      severity: "warn" as const,
    },
  ],
};
