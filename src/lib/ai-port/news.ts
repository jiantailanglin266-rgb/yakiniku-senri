/**
 * AI PORT — ニュースの収集。
 *
 * ■ 壊れない収集
 *   フィードは外部サービスです。落ちること・遅いことを前提に組んでいます。
 *     - 1本ずつ独立して取得し、失敗は握りつぶす（Promise.allSettled）
 *     - タイムアウトを必ず付ける（AbortSignal.timeout）
 *     - すべて失敗しても空配列を返す。ページはエラーにしない
 *
 * ■ キャッシュ
 *   `next: { revalidate }` でNext.jsのデータキャッシュに載せます。
 *   ネットワークが使えない環境でビルドしても、ビルドは通り、
 *   公開後の再検証で中身が入ります。
 *
 * ■ 事実性
 *   本文は保存せず、見出し・要約・配信元・日時と「元記事へのリンク」だけを扱います。
 *   ここで独自に要約を書き足すと、配信元が言っていないことを言うことになるためです。
 */

import { parseFeed, splitGoogleNewsTitle, type FeedItem } from "./rss";
import {
  generalFeeds,
  officialFeeds,
  topicFeedUrl,
  vendorFeeds,
  vendors,
  type FeedSource,
} from "@/data/ai-port/feeds";

export type NewsItem = FeedItem & {
  /** 取得元のフィードID */
  feedId: string;
  /** 紐づくベンダーID（推定を含む） */
  vendorIds: string[];
};

/** 30分。ニュースの鮮度と、外部への負荷のバランス。 */
export const NEWS_REVALIDATE_SECONDS = 1800;

const FETCH_TIMEOUT_MS = 6000;

/**
 * フィードを1本取得します。失敗したら空配列を返します（例外は投げません）。
 */
async function fetchFeed(source: FeedSource, revalidate: number): Promise<NewsItem[]> {
  try {
    const response = await fetch(source.url, {
      headers: {
        // User-Agent を付けないと弾く配信元があります
        "User-Agent": "AIPortBot/1.0 (+https://github.com/; RSS reader)",
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      next: { revalidate, tags: ["ai-port-news"] },
    });

    if (!response.ok) return [];

    const xml = await response.text();
    return parseFeed(xml).map((item) => ({
      ...item,
      title: splitGoogleNewsTitle(item.title, item.source),
      feedId: source.id,
      vendorIds: detectVendors(`${item.title} ${item.summary}`, source.vendorId),
    }));
  } catch {
    // タイムアウト・DNS失敗・XML破損 — いずれも「このフィードは今回なし」で扱います
    return [];
  }
}

/** 見出しからベンダーを推定します。フィード由来のIDは必ず含めます。 */
function detectVendors(text: string, feedVendorId?: string): string[] {
  const found = new Set<string>();
  if (feedVendorId) found.add(feedVendorId);

  const haystack = text.toLowerCase();
  for (const vendor of vendors) {
    for (const term of vendor.terms) {
      // 用語は複数語のことがあるため、単語境界ではなく部分一致で見ます
      if (haystack.includes(term.toLowerCase())) {
        found.add(vendor.id);
        break;
      }
    }
  }
  return [...found];
}

/** 同じ記事が複数のフィードから届くため、リンクと見出しで重複を落とします。 */
export function dedupe(items: NewsItem[]): NewsItem[] {
  const byKey = new Map<string, NewsItem>();

  for (const item of items) {
    // Googleニュースは中継URLを返すため、リンクだけでは同一判定できません。
    // 見出しの正規化（記号・空白除去）を併用します。
    const titleKey = item.title
      .toLowerCase()
      .replace(/[\s\p{P}\p{S}]/gu, "")
      .slice(0, 60);
    const existing = byKey.get(titleKey);

    if (!existing) {
      byKey.set(titleKey, item);
      continue;
    }

    // 重複したら、ベンダー情報が多いほうを残します
    if (item.vendorIds.length > existing.vendorIds.length) {
      byKey.set(titleKey, {
        ...item,
        vendorIds: [...new Set([...item.vendorIds, ...existing.vendorIds])],
      });
    } else {
      existing.vendorIds = [...new Set([...existing.vendorIds, ...item.vendorIds])];
    }
  }

  return [...byKey.values()];
}

export function sortByDate(items: NewsItem[]): NewsItem[] {
  return items.slice().sort((a, b) => (a.isoDate < b.isoDate ? 1 : a.isoDate > b.isoDate ? -1 : 0));
}

async function collect(sources: FeedSource[], revalidate: number): Promise<NewsItem[]> {
  const results = await Promise.allSettled(sources.map((source) => fetchFeed(source, revalidate)));

  const items = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));

  return sortByDate(dedupe(items));
}

/** トップページ・ニュース一覧の主フィード。 */
export async function getLatestNews(limit = 24): Promise<NewsItem[]> {
  const items = await collect([...generalFeeds, ...officialFeeds], NEWS_REVALIDATE_SECONDS);
  return items.slice(0, limit);
}

/** ベンダー別（OpenAI / Claude / Gemini …）。 */
export async function getVendorNews(vendorId: string, limit = 24): Promise<NewsItem[]> {
  const sources = [
    ...vendorFeeds.filter((feed) => feed.vendorId === vendorId),
    ...officialFeeds.filter((feed) => feed.vendorId === vendorId),
  ];
  if (sources.length === 0) return [];

  const items = await collect(sources, NEWS_REVALIDATE_SECONDS);
  return items.slice(0, limit);
}

/** トピックハブ用（AI動画・Web3 など）。 */
export async function getTopicNews(
  topicSlug: string,
  queries: string[],
  limit = 12,
): Promise<NewsItem[]> {
  if (queries.length === 0) return [];

  const items = await collect(
    [
      {
        id: `topic-${topicSlug}`,
        label: topicSlug,
        url: topicFeedUrl(queries),
        kind: "aggregator",
        lang: "ja",
      },
    ],
    NEWS_REVALIDATE_SECONDS,
  );

  return items.slice(0, limit);
}

/**
 * ベンダーごとの言及数。ランキングの「注目度」の材料になります。
 * 実際に取得できたニュースの件数なので、推測値ではありません。
 */
export function countVendorMentions(items: NewsItem[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    for (const vendorId of item.vendorIds) {
      counts[vendorId] = (counts[vendorId] ?? 0) + 1;
    }
  }
  return counts;
}

/** 相対時刻（3時間前 / 2日前）。日本語のみ。 */
export function relativeTime(isoDate: string, now = Date.now()): string {
  const diffMs = now - Date.parse(isoDate);
  if (!Number.isFinite(diffMs)) return "";

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}日前`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}か月前`;

  return `${Math.floor(months / 12)}年前`;
}
