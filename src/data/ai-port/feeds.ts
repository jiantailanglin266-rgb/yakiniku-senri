/**
 * AI PORT — ニュースの取得元。
 *
 * ■ 設計の考え方
 *   1. 一次情報（各社の公式ブログRSS）を最優先で並べる
 *   2. 網羅性は Google ニュースの検索RSSで補う（キーワードごとに1本）
 *   3. どれか1本が落ちても全体が壊れないよう、取得は必ず個別に失敗させる
 *
 * ■ 追加のしかた
 *   `officialFeeds` か `vendors` に1行足すだけです。
 *   ベンダーを足すとニュースのカテゴリータブとカテゴリーページが自動で増えます。
 */

import type { Accent } from "./taxonomy";

export type FeedSource = {
  id: string;
  /** 表示名 */
  label: string;
  url: string;
  /** 一次情報（公式）か、二次情報（ニュース検索）か */
  kind: "official" | "aggregator" | "community";
  /** 主に紐づくベンダーID（あれば） */
  vendorId?: string;
  /** 言語 */
  lang: "ja" | "en";
};

/** Google ニュースの検索RSS。キーワードから1本のフィードを作ります。 */
export function googleNewsFeed(query: string, lang: "ja" | "en" = "ja"): string {
  const locale = lang === "ja" ? "hl=ja&gl=JP&ceid=JP:ja" : "hl=en-US&gl=US&ceid=US:en";
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&${locale}`;
}

/* ------------------------------------------------------------
   ベンダー — ニュースのカテゴリータブになります
   ------------------------------------------------------------ */

export type Vendor = {
  id: string;
  name: string;
  /** ニュース検索に使う語（OR で連結します） */
  terms: string[];
  accent: Accent;
  /** 公式サイト。カテゴリーページから一次情報へ導きます。 */
  site: string;
  /** 一次情報のRSS（判明しているものだけ） */
  officialFeed?: string;
};

export const vendors: Vendor[] = [
  {
    id: "openai",
    name: "OpenAI",
    terms: ["OpenAI", "ChatGPT"],
    accent: "mint",
    site: "https://openai.com/",
    officialFeed: "https://openai.com/news/rss.xml",
  },
  {
    id: "anthropic",
    name: "Claude",
    terms: ["Anthropic", "Claude AI"],
    accent: "amber",
    site: "https://www.anthropic.com/",
  },
  {
    id: "google",
    name: "Gemini",
    terms: ["Google Gemini", "Google DeepMind"],
    accent: "blue",
    site: "https://deepmind.google/",
    officialFeed: "https://deepmind.google/blog/rss.xml",
  },
  {
    id: "meta",
    name: "Meta",
    terms: ["Meta AI", "Llama モデル"],
    accent: "blue",
    site: "https://ai.meta.com/",
  },
  {
    id: "xai",
    name: "xAI",
    terms: ["xAI", "Grok"],
    accent: "violet",
    site: "https://x.ai/",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    terms: ["Perplexity AI"],
    accent: "cyan",
    site: "https://www.perplexity.ai/",
  },
  {
    id: "microsoft",
    name: "Microsoft",
    terms: ["Microsoft Copilot", "Azure OpenAI"],
    accent: "blue",
    site: "https://blogs.microsoft.com/ai/",
    officialFeed: "https://blogs.microsoft.com/ai/feed/",
  },
  {
    id: "nvidia",
    name: "NVIDIA",
    terms: ["NVIDIA AI", "NVIDIA GPU"],
    accent: "mint",
    site: "https://blogs.nvidia.com/",
    officialFeed: "https://blogs.nvidia.com/feed/",
  },
  {
    id: "adobe",
    name: "Adobe",
    terms: ["Adobe Firefly", "Adobe AI"],
    accent: "pink",
    site: "https://www.adobe.com/jp/",
  },
  {
    id: "canva",
    name: "Canva",
    terms: ["Canva AI"],
    accent: "cyan",
    site: "https://www.canva.com/ja_jp/",
  },
  {
    id: "runway",
    name: "Runway",
    terms: ["Runway Gen", "Runway AI"],
    accent: "violet",
    site: "https://runwayml.com/",
  },
  {
    id: "midjourney",
    name: "Midjourney",
    terms: ["Midjourney"],
    accent: "pink",
    site: "https://www.midjourney.com/",
  },
  {
    id: "stability",
    name: "Stable Diffusion",
    terms: ["Stable Diffusion", "Stability AI"],
    accent: "pink",
    site: "https://stability.ai/",
  },
  {
    id: "flux",
    name: "FLUX",
    terms: ["FLUX 画像生成", "Black Forest Labs"],
    accent: "violet",
    site: "https://blackforestlabs.ai/",
  },
  {
    id: "suno",
    name: "Suno",
    terms: ["Suno AI 音楽"],
    accent: "mint",
    site: "https://suno.com/",
  },
  {
    id: "veo",
    name: "Veo",
    terms: ["Google Veo 動画"],
    accent: "blue",
    site: "https://deepmind.google/technologies/veo/",
  },
  {
    id: "luma",
    name: "Luma",
    terms: ["Luma AI Dream Machine"],
    accent: "violet",
    site: "https://lumalabs.ai/",
  },
  {
    id: "kling",
    name: "Kling",
    terms: ["Kling AI 動画"],
    accent: "cyan",
    site: "https://klingai.com/",
  },
  {
    id: "pika",
    name: "Pika",
    terms: ["Pika Labs 動画"],
    accent: "pink",
    site: "https://pika.art/",
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    terms: ["ElevenLabs 音声"],
    accent: "mint",
    site: "https://elevenlabs.io/",
  },
  {
    id: "cursor",
    name: "Cursor",
    terms: ["Cursor エディタ AI"],
    accent: "blue",
    site: "https://cursor.com/",
  },
  {
    id: "windsurf",
    name: "Windsurf",
    terms: ["Windsurf AI エディタ"],
    accent: "mint",
    site: "https://windsurf.com/",
  },
  {
    id: "lovable",
    name: "Lovable",
    terms: ["Lovable AI アプリ開発"],
    accent: "pink",
    site: "https://lovable.dev/",
  },
  {
    id: "bolt",
    name: "Bolt",
    terms: ["Bolt.new AI"],
    accent: "amber",
    site: "https://bolt.new/",
  },
];

export function findVendor(id: string): Vendor | undefined {
  return vendors.find((vendor) => vendor.id === id);
}

/** ベンダー1社ぶんの検索クエリ。語を OR で束ねます。 */
export function vendorQuery(vendor: Vendor): string {
  return vendor.terms.map((term) => `"${term}"`).join(" OR ");
}

/* ------------------------------------------------------------
   フィード一覧
   ------------------------------------------------------------ */

/** 一次情報・専門メディア。ここは「その媒体を読みに行く」フィードです。 */
export const officialFeeds: FeedSource[] = [
  {
    id: "openai-news",
    label: "OpenAI News",
    url: "https://openai.com/news/rss.xml",
    kind: "official",
    vendorId: "openai",
    lang: "en",
  },
  {
    id: "deepmind-blog",
    label: "Google DeepMind Blog",
    url: "https://deepmind.google/blog/rss.xml",
    kind: "official",
    vendorId: "google",
    lang: "en",
  },
  {
    id: "nvidia-blog",
    label: "NVIDIA Blog",
    url: "https://blogs.nvidia.com/feed/",
    kind: "official",
    vendorId: "nvidia",
    lang: "en",
  },
  {
    id: "microsoft-ai",
    label: "Microsoft AI Blog",
    url: "https://blogs.microsoft.com/ai/feed/",
    kind: "official",
    vendorId: "microsoft",
    lang: "en",
  },
  {
    id: "hacker-news",
    label: "Hacker News",
    url: "https://hnrss.org/frontpage?points=150",
    kind: "community",
    lang: "en",
  },
];

/** 日本語の総合フィード。トップページの主役です。 */
export const generalFeeds: FeedSource[] = [
  {
    id: "gn-generative-ai",
    label: "生成AI",
    url: googleNewsFeed("生成AI OR ChatGPT OR Gemini OR Claude"),
    kind: "aggregator",
    lang: "ja",
  },
  {
    id: "gn-ai-agent",
    label: "AIエージェント",
    url: googleNewsFeed('AIエージェント OR "AI agent"'),
    kind: "aggregator",
    lang: "ja",
  },
  {
    id: "gn-ai-business",
    label: "AIとビジネス",
    url: googleNewsFeed("AI 導入 企業 OR AI 業務効率化"),
    kind: "aggregator",
    lang: "ja",
  },
  {
    id: "gn-web3",
    label: "Web3",
    url: googleNewsFeed("Web3 OR ブロックチェーン OR DAO"),
    kind: "aggregator",
    lang: "ja",
  },
];

/** ベンダー別フィード（Google ニュース検索）。カテゴリータブの中身になります。 */
export const vendorFeeds: FeedSource[] = vendors.map((vendor) => ({
  id: `gn-${vendor.id}`,
  label: vendor.name,
  url: googleNewsFeed(vendorQuery(vendor)),
  kind: "aggregator" as const,
  vendorId: vendor.id,
  lang: "ja" as const,
}));

/** トピック別フィード。ハブページで使います。 */
export function topicFeedUrl(queries: string[]): string {
  return googleNewsFeed(queries.map((query) => `"${query}"`).join(" OR "));
}
