/**
 * ニュース。
 *
 * ⚠ 掲載しているのはレイアウト確認用のサンプル記事です。
 *   実在のメディアの記事を装った見出しや、起きていない出来事は書きません。
 *   （誤情報の拡散と、他媒体の信用の不正利用になるため）
 *   本番では RSS / API から取得したものに差し替わります。取得層は
 *   `src/portal/lib/news-source.ts` にあり、ここと同じ `NewsArticle` 型を返します。
 *
 * ■ 重複記事のまとめ
 *   `storyKey` が同じ記事は「同じ出来事を報じたもの」として束ねます。
 *   実運用では見出しの正規化＋公開時刻の近さから自動生成します。
 */

import type { NewsArticle, NewsCategory } from "@/portal/lib/types";
import type { LocalizedText } from "@/portal/lib/types";

/** "sample" のあいだ、一覧に注意バナーを表示します */
export const NEWS_DATASET_STATUS: "sample" | "live" = "sample";

export const newsCategories: { id: NewsCategory; label: LocalizedText }[] = [
  { id: "bitcoin", label: { ja: "Bitcoin", en: "Bitcoin" } },
  { id: "ethereum", label: { ja: "Ethereum", en: "Ethereum" } },
  { id: "altcoin", label: { ja: "アルトコイン", en: "Altcoins" } },
  { id: "defi", label: { ja: "DeFi", en: "DeFi" } },
  { id: "nft", label: { ja: "NFT", en: "NFT" } },
  { id: "gamefi", label: { ja: "GameFi", en: "GameFi" } },
  { id: "web3", label: { ja: "Web3", en: "Web3" } },
  { id: "exchange", label: { ja: "取引所", en: "Exchanges" } },
  { id: "regulation", label: { ja: "規制", en: "Regulation" } },
  { id: "tax", label: { ja: "税金", en: "Tax" } },
  { id: "security", label: { ja: "セキュリティ", en: "Security" } },
  { id: "ai", label: { ja: "AI × Crypto", en: "AI × Crypto" } },
  { id: "metaverse", label: { ja: "メタバース", en: "Metaverse" } },
  { id: "stablecoin", label: { ja: "ステーブルコイン", en: "Stablecoins" } },
];

/** サンプルの発行元。実在メディア名は使いません。 */
const OUTLET = "CRYPTO PORT（サンプル）";

/**
 * 日付の基準。
 * ビルドのたびに現在時刻を入れると「毎回更新された」ことになり、
 * サイトマップの lastmod が意味を失います。固定日からの相対で組み立てます。
 */
const BASE = Date.parse("2026-08-01T09:00:00Z");
const hoursAgo = (hours: number) => new Date(BASE - hours * 3_600_000).toISOString();

export const news: NewsArticle[] = [
  {
    id: "n-001",
    slug: "sample-btc-market-structure",
    title: {
      ja: "【サンプル】ビットコインの現物ETF流入が市場構造に与えた変化を整理する",
      en: "[Sample] How spot Bitcoin ETF flows changed market structure",
    },
    summary: {
      ja: "デモ用のサンプル記事です。ニュース一覧・詳細のレイアウトと、情報元・公開日時の表示を確認するために置いています。",
      en: "A sample article used to check the news list and detail layout, including how source and timestamp are displayed.",
    },
    body: {
      ja: [
        "これはレイアウト確認用のサンプル記事です。実際の出来事を報じるものではありません。",
        "本番環境では、複数のRSSフィードおよびニュースAPIから取得した記事がここに入ります。取得元のメディア名・公開日時・一次情報へのリンクは、記事ごとに必ず表示します。",
        "同じ出来事を扱う複数の記事は `storyKey` で束ね、一覧では代表記事のみを出したうえで「同じ話題の記事」として関連付けます。",
      ],
      en: [
        "This is a sample article for layout verification. It does not report a real event.",
        "In production, articles fetched from several RSS feeds and news APIs appear here. The outlet, publication time and a link to the primary source are always shown per article.",
        "Articles covering the same event are grouped by `storyKey`; the list shows one representative item and links the rest as related coverage.",
      ],
    },
    category: "bitcoin",
    labels: ["important", "impact"],
    tags: ["ETF", "市場構造", "機関投資家"],
    outlet: OUTLET,
    publishedAt: hoursAgo(3),
    checkedAt: hoursAgo(3),
    readingMinutes: 4,
    authorId: "editorial",
    relatedCoins: ["bitcoin"],
    storyKey: "sample-etf-flows",
    metrics: { views: 18_400, clicks: 2_130, shares: 340 },
  },
  {
    id: "n-002",
    slug: "sample-eth-l2-fees",
    title: {
      ja: "【サンプル】Layer 2 の手数料はどこまで下がったのか、比較の考え方",
      en: "[Sample] How far have Layer 2 fees actually fallen?",
    },
    summary: {
      ja: "デモ用のサンプル記事です。カテゴリ絞り込みとタグ表示の確認に使用しています。",
      en: "A sample article used to verify category filtering and tag display.",
    },
    body: {
      ja: [
        "これはレイアウト確認用のサンプル記事です。",
        "手数料の比較は、送金・スワップ・NFTのミントなど「何をするか」で結論が変わります。単一の数値で比較しないことが重要です。",
      ],
      en: [
        "This is a sample article for layout verification.",
        "Fee comparisons change depending on what you do — a transfer, a swap, an NFT mint. A single headline number is rarely meaningful.",
      ],
    },
    category: "ethereum",
    labels: [],
    tags: ["Layer2", "ガス代"],
    outlet: OUTLET,
    publishedAt: hoursAgo(7),
    readingMinutes: 5,
    authorId: "editorial",
    relatedCoins: ["ethereum"],
    metrics: { views: 12_900, clicks: 1_480, shares: 210 },
  },
  {
    id: "n-003",
    slug: "sample-regulation-overview",
    title: {
      ja: "【サンプル】暗号資産に関する規制動向の読み方",
      en: "[Sample] How to read crypto regulatory news",
    },
    summary: {
      ja: "デモ用のサンプル記事です。「規制」ラベルの表示確認に使用しています。",
      en: "A sample article used to verify the regulation label.",
    },
    body: {
      ja: [
        "これはレイアウト確認用のサンプル記事です。",
        "規制のニュースは、法律・政令・ガイドライン・パブリックコメントのどの段階かによって重みが変わります。当サイトでは一次情報（官公庁の公表資料）へのリンクを必ず添えます。",
      ],
      en: [
        "This is a sample article for layout verification.",
        "Regulatory news carries different weight depending on whether it is a statute, an ordinance, a guideline or a consultation. We always link to the primary government source.",
      ],
    },
    category: "regulation",
    labels: ["regulation", "important"],
    tags: ["規制", "金融庁"],
    outlet: OUTLET,
    publishedAt: hoursAgo(11),
    readingMinutes: 6,
    authorId: "editorial",
    relatedCoins: [],
    metrics: { views: 9_600, clicks: 980, shares: 175 },
  },
  {
    id: "n-004",
    slug: "sample-exchange-listing",
    title: {
      ja: "【サンプル】新規上場のニュースを見るときに確認したいこと",
      en: "[Sample] What to check when a new listing is announced",
    },
    summary: {
      ja: "デモ用のサンプル記事です。「上場」ラベルの表示確認に使用しています。",
      en: "A sample article used to verify the listing label.",
    },
    body: {
      ja: [
        "これはレイアウト確認用のサンプル記事です。",
        "上場の発表は短期的な値動きを伴うことがありますが、上場そのものは価値を保証しません。取扱開始日、対象の取引形式（販売所か板か）、入出金の可否を確認してください。",
      ],
      en: [
        "This is a sample article for layout verification.",
        "Listing announcements often move prices, but a listing does not validate a project. Check the start date, whether it is brokerage or order book, and whether deposits and withdrawals are enabled.",
      ],
    },
    category: "exchange",
    labels: ["listing"],
    tags: ["上場", "取引所"],
    outlet: OUTLET,
    publishedAt: hoursAgo(16),
    readingMinutes: 3,
    authorId: "editorial",
    relatedCoins: ["solana", "sui"],
    metrics: { views: 15_200, clicks: 3_010, shares: 260 },
  },
  {
    id: "n-005",
    slug: "sample-security-incident",
    title: {
      ja: "【サンプル】ハッキング報道が出たときに、利用者がまず取るべき行動",
      en: "[Sample] What to do first when a hack is reported",
    },
    summary: {
      ja: "デモ用のサンプル記事です。「ハッキング」ラベルと注意喚起の表示確認に使用しています。",
      en: "A sample article used to verify the security-incident label and warning styling.",
    },
    body: {
      ja: [
        "これはレイアウト確認用のサンプル記事です。",
        "被害が報じられたプロトコルに承認（approve）を与えていないか確認し、不要な承認を取り消してください。当サイトを含め、いかなるサービスもシードフレーズの入力を求めることはありません。",
      ],
      en: [
        "This is a sample article for layout verification.",
        "Check whether you have granted approvals to the affected protocol and revoke anything you no longer need. No service — including this site — will ever ask for your seed phrase.",
      ],
    },
    category: "security",
    labels: ["hack", "breaking"],
    tags: ["セキュリティ", "approve"],
    outlet: OUTLET,
    publishedAt: hoursAgo(20),
    readingMinutes: 4,
    authorId: "editorial",
    relatedCoins: ["ethereum"],
    metrics: { views: 22_800, clicks: 4_120, shares: 610 },
  },
  {
    id: "n-006",
    slug: "sample-defi-tvl",
    title: {
      ja: "【サンプル】TVL が増えることの意味と、増えない意味",
      en: "[Sample] What rising TVL does and does not tell you",
    },
    summary: { ja: "デモ用のサンプル記事です。", en: "A sample article." },
    body: {
      ja: [
        "これはレイアウト確認用のサンプル記事です。",
        "TVLは預けられた資産の時価総額であるため、価格が上がるだけでも増えます。利用者数や取引件数と併せて見る必要があります。",
      ],
      en: [
        "This is a sample article for layout verification.",
        "TVL is the market value of deposits, so it rises when prices rise even if usage is flat. Read it alongside user and transaction counts.",
      ],
    },
    category: "defi",
    labels: [],
    tags: ["DeFi", "TVL"],
    outlet: OUTLET,
    publishedAt: hoursAgo(26),
    readingMinutes: 4,
    authorId: "editorial",
    relatedCoins: ["ethereum"],
    metrics: { views: 7_400, clicks: 690, shares: 88 },
  },
  {
    id: "n-007",
    slug: "sample-nft-market",
    title: {
      ja: "【サンプル】NFT市場の取引量をどう読むか",
      en: "[Sample] Reading NFT trading volume",
    },
    summary: { ja: "デモ用のサンプル記事です。", en: "A sample article." },
    body: {
      ja: [
        "これはレイアウト確認用のサンプル記事です。",
        "同一人物による売買（ウォッシュトレード）が混ざるため、取引量だけでは市場の実態を測れません。",
      ],
      en: [
        "This is a sample article for layout verification.",
        "Wash trading inflates the numbers, so volume alone does not measure real demand.",
      ],
    },
    category: "nft",
    labels: [],
    tags: ["NFT"],
    outlet: OUTLET,
    publishedAt: hoursAgo(32),
    readingMinutes: 3,
    authorId: "editorial",
    relatedCoins: ["ethereum", "solana"],
    metrics: { views: 6_100, clicks: 520, shares: 74 },
  },
  {
    id: "n-008",
    slug: "sample-stablecoin-basics",
    title: {
      ja: "【サンプル】ステーブルコインの裏付け資産を確認する方法",
      en: "[Sample] How to check what backs a stablecoin",
    },
    summary: { ja: "デモ用のサンプル記事です。", en: "A sample article." },
    body: {
      ja: [
        "これはレイアウト確認用のサンプル記事です。",
        "発行体が公表する準備金報告と、その監査主体を確認します。裏付けの種類（現金・国債・他の暗号資産）でリスクが変わります。",
      ],
      en: [
        "This is a sample article for layout verification.",
        "Look at the issuer's reserve report and who attests to it. The kind of backing — cash, treasuries, other crypto — changes the risk.",
      ],
    },
    category: "stablecoin",
    labels: [],
    tags: ["ステーブルコイン"],
    outlet: OUTLET,
    publishedAt: hoursAgo(40),
    readingMinutes: 5,
    authorId: "editorial",
    relatedCoins: ["tron", "ethereum"],
    metrics: { views: 5_800, clicks: 430, shares: 62 },
  },
  {
    id: "n-009",
    slug: "sample-tax-season",
    title: {
      ja: "【サンプル】確定申告前に用意しておく取引履歴",
      en: "[Sample] The trade history to gather before filing",
    },
    summary: { ja: "デモ用のサンプル記事です。", en: "A sample article." },
    body: {
      ja: [
        "これはレイアウト確認用のサンプル記事です。",
        "取引所ごとの年間取引報告書、ウォレットの送受信履歴、DeFiの取引履歴をそろえます。具体的な税務判断は税理士にご確認ください。",
      ],
      en: [
        "This is a sample article for layout verification.",
        "Collect annual statements from each exchange, wallet transfer history and DeFi activity. Consult a tax professional for the actual treatment.",
      ],
    },
    category: "tax",
    labels: ["important"],
    tags: ["税金", "確定申告"],
    outlet: OUTLET,
    publishedAt: hoursAgo(52),
    readingMinutes: 6,
    authorId: "editorial",
    relatedCoins: [],
    metrics: { views: 11_300, clicks: 2_450, shares: 190 },
  },
  {
    id: "n-010",
    slug: "sample-ai-crypto",
    title: {
      ja: "【サンプル】AI関連トークンを見るときの視点",
      en: "[Sample] A lens for AI-themed tokens",
    },
    summary: { ja: "デモ用のサンプル記事です。", en: "A sample article." },
    body: {
      ja: [
        "これはレイアウト確認用のサンプル記事です。",
        "テーマ性で価格が動くトークンは、実際のプロダクトの稼働状況と切り離して評価しないことが重要です。",
      ],
      en: [
        "This is a sample article for layout verification.",
        "Theme-driven tokens should never be assessed apart from whether the product actually runs.",
      ],
    },
    category: "ai",
    labels: [],
    tags: ["AI", "トークン"],
    outlet: OUTLET,
    publishedAt: hoursAgo(64),
    readingMinutes: 4,
    authorId: "editorial",
    relatedCoins: [],
    metrics: { views: 8_900, clicks: 1_020, shares: 143 },
  },
  {
    id: "n-011",
    slug: "sample-gamefi-economy",
    title: {
      ja: "【サンプル】GameFi のトークン設計を読み解く",
      en: "[Sample] Reading GameFi token design",
    },
    summary: { ja: "デモ用のサンプル記事です。", en: "A sample article." },
    body: {
      ja: [
        "これはレイアウト確認用のサンプル記事です。",
        "新規参加者の流入に依存する設計は、流入が止まった時点で崩れます。トークンの発行量と消費先の設計を確認します。",
      ],
      en: [
        "This is a sample article for layout verification.",
        "Designs that depend on new entrants collapse when inflow stops. Look at issuance and at what actually burns the token.",
      ],
    },
    category: "gamefi",
    labels: [],
    tags: ["GameFi"],
    outlet: OUTLET,
    publishedAt: hoursAgo(78),
    readingMinutes: 5,
    authorId: "editorial",
    relatedCoins: ["solana"],
    metrics: { views: 4_700, clicks: 380, shares: 51 },
  },
  {
    id: "n-012",
    slug: "sample-etf-flows-secondary",
    title: {
      ja: "【サンプル】同じ話題を扱った別記事（重複検出の確認用）",
      en: "[Sample] A second article on the same story (duplicate detection)",
    },
    summary: {
      ja: "n-001 と同じ storyKey を持つサンプルです。重複記事のまとめ表示を確認するために置いています。",
      en: "Shares a storyKey with n-001. Used to verify duplicate grouping in the list.",
    },
    body: {
      ja: [
        "これはレイアウト確認用のサンプル記事です。",
        "同じ出来事を報じた記事は、一覧では1件にまとめ、詳細ページで「同じ話題の記事」として並べます。",
      ],
      en: [
        "This is a sample article for layout verification.",
        "Articles about the same event collapse to one row in the list and appear as related coverage on the detail page.",
      ],
    },
    category: "bitcoin",
    labels: ["impact"],
    tags: ["ETF"],
    outlet: OUTLET,
    publishedAt: hoursAgo(5),
    readingMinutes: 3,
    authorId: "editorial",
    relatedCoins: ["bitcoin"],
    storyKey: "sample-etf-flows",
    metrics: { views: 3_200, clicks: 260, shares: 34 },
  },
];

export const newsBySlug = new Map(news.map((article) => [article.slug, article]));

export function getNewsArticle(slug: string): NewsArticle | undefined {
  return newsBySlug.get(slug);
}

/** 新しい順 */
export function sortedNews(): NewsArticle[] {
  return news.slice().sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

/**
 * 一覧用に重複を畳んだ記事。
 * 同じ `storyKey` のうち最も新しい1件を代表とし、残りは `duplicates` に入れます。
 */
export function groupedNews(): Array<{ article: NewsArticle; duplicates: NewsArticle[] }> {
  const seen = new Map<string, { article: NewsArticle; duplicates: NewsArticle[] }>();
  const out: Array<{ article: NewsArticle; duplicates: NewsArticle[] }> = [];

  for (const article of sortedNews()) {
    const key = article.storyKey;
    if (!key) {
      out.push({ article, duplicates: [] });
      continue;
    }
    const existing = seen.get(key);
    if (existing) {
      existing.duplicates.push(article);
      continue;
    }
    const entry = { article, duplicates: [] as NewsArticle[] };
    seen.set(key, entry);
    out.push(entry);
  }
  return out;
}

/** 同じ話題の他の記事 */
export function relatedByStory(article: NewsArticle): NewsArticle[] {
  if (!article.storyKey) return [];
  return sortedNews().filter(
    (other) => other.storyKey === article.storyKey && other.id !== article.id,
  );
}

/**
 * 急上昇。
 * 閲覧数だけだと古い記事が居座るため、経過時間で割り引きます。
 */
export function trendingNews(limit = 5): NewsArticle[] {
  const now = BASE;
  return sortedNews()
    .map((article) => {
      const ageHours = Math.max(1, (now - Date.parse(article.publishedAt)) / 3_600_000);
      const engagement =
        article.metrics.views + article.metrics.clicks * 4 + article.metrics.shares * 12;
      return { article, score: engagement / Math.pow(ageHours, 0.8) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.article);
}

export function newsByCategory(category: NewsCategory | "all"): NewsArticle[] {
  const all = sortedNews();
  return category === "all" ? all : all.filter((article) => article.category === category);
}

export function newsForCoin(coinId: string, limit = 4): NewsArticle[] {
  return sortedNews()
    .filter((article) => article.relatedCoins.includes(coinId))
    .slice(0, limit);
}
