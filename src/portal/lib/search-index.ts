/**
 * サイト内検索。
 *
 * ■ 表記ゆれへの対応
 *   「Bitcoin」「ビットコイン」「BTC」を同じ結果に寄せる必要があります。
 *   外部の検索サービスを入れずに済ませたいので、
 *   - 全角→半角、カタカナ→ひらがな、大文字→小文字を正規化
 *   - 通貨には別名（aliases）とティッカーを持たせる
 *   の2点で吸収します。
 *
 * ■ なぜ静的インデックスか
 *   件数が数百のうちは、クライアントで全件を持ってフィルタするほうが
 *   ネットワーク往復ゼロで速く、サーバー費用もかかりません。
 *   件数が増えたら、このモジュールの `searchDocs` の中身だけを
 *   サーバー検索へ差し替えれば、UI 側は変更不要です。
 */

import { coins } from "@/portal/data/coins";
import { exchanges } from "@/portal/data/exchanges";
import { learnArticles } from "@/portal/data/learn";
import { news } from "@/portal/data/news";
import { siteFaq } from "@/portal/data/site-content";
import { tools } from "@/portal/data/tools";
import { videos } from "@/portal/data/videos";
import { wallets } from "@/portal/data/wallets";
import type { SearchDoc } from "./types";

/**
 * 検索用の正規化。
 * 全角英数を半角に、カタカナをひらがなに、大文字を小文字に寄せます。
 */
export function normalize(input: string): string {
  return input
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60))
    .replace(/[\s　_-]+/g, "");
}

let cached: SearchDoc[] | null = null;

export function searchDocs(): SearchDoc[] {
  if (cached) return cached;

  const docs: SearchDoc[] = [];

  for (const coin of coins) {
    docs.push({
      id: `coin:${coin.id}`,
      type: "coin",
      path: `/coins/${coin.slug}`,
      title: coin.name,
      summary: coin.summary,
      keywords: [coin.symbol, coin.slug, coin.id, ...coin.aliases, ...coin.categories],
      weight: 100,
    });
  }

  for (const exchange of exchanges) {
    docs.push({
      id: `exchange:${exchange.id}`,
      type: "exchange",
      path: `/exchanges/${exchange.slug}`,
      title: { ja: exchange.name, en: exchange.name },
      summary: exchange.summary,
      keywords: [exchange.slug, exchange.region, "取引所", "exchange"],
      weight: 90,
    });
  }

  for (const wallet of wallets) {
    docs.push({
      id: `wallet:${wallet.id}`,
      type: "wallet",
      path: `/wallets/${wallet.slug}`,
      title: { ja: wallet.name, en: wallet.name },
      summary: wallet.summary,
      keywords: [wallet.slug, wallet.type, "ウォレット", "wallet", ...wallet.chains],
      weight: 80,
    });
  }

  for (const tool of tools) {
    docs.push({
      id: `tool:${tool.id}`,
      type: "tool",
      path: `/tools/${tool.slug}`,
      title: { ja: tool.name, en: tool.name },
      summary: tool.summary,
      keywords: [tool.slug, tool.category, ...tool.chains],
      weight: 70,
    });
  }

  for (const article of news) {
    docs.push({
      id: `news:${article.id}`,
      type: "news",
      path: `/news/${article.slug}`,
      title: article.title,
      summary: article.summary,
      keywords: [article.category, ...article.tags],
      weight: 60,
    });
  }

  for (const article of learnArticles) {
    docs.push({
      id: `learn:${article.id}`,
      type: "learn",
      path: `/learn/${article.slug}`,
      title: article.title,
      summary: article.conclusion,
      keywords: [article.level, article.slug],
      weight: 85,
    });
  }

  for (const video of videos) {
    docs.push({
      id: `video:${video.id}`,
      type: "video",
      path: `/videos/${video.slug}`,
      title: video.title,
      summary: video.summary,
      keywords: [video.slug, video.shorts ? "shorts" : "video", video.channel],
      weight: 50,
    });
  }

  siteFaq.forEach((item, index) => {
    docs.push({
      id: `faq:${index}`,
      type: "faq",
      path: "/faq",
      title: item.q,
      summary: item.a,
      keywords: ["faq", "よくある質問"],
      weight: 40,
    });
  });

  cached = docs;
  return docs;
}

export type SearchHit = { doc: SearchDoc; score: number };

/**
 * 検索。
 * 完全一致 > 前方一致 > 部分一致 の順に重み付けし、同点は `weight` で並べます。
 */
export function search(query: string, locale: string, limit = 20): SearchHit[] {
  const needle = normalize(query);
  if (needle.length === 0) return [];

  const hits: SearchHit[] = [];

  for (const doc of searchDocs()) {
    const title = normalize(doc.title[locale] ?? doc.title.en ?? doc.title.ja);
    const summary = normalize(doc.summary[locale] ?? doc.summary.en ?? doc.summary.ja);
    const keywords = doc.keywords.map(normalize);

    let score = 0;
    if (title === needle || keywords.includes(needle)) score = 1000;
    else if (title.startsWith(needle)) score = 700;
    else if (keywords.some((keyword) => keyword.startsWith(needle))) score = 600;
    else if (title.includes(needle)) score = 400;
    else if (keywords.some((keyword) => keyword.includes(needle))) score = 300;
    else if (summary.includes(needle)) score = 150;

    if (score > 0) hits.push({ doc, score: score + doc.weight });
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** 入力補完の候補（タイトルのみ） */
export function suggest(query: string, locale: string, limit = 6): SearchDoc[] {
  return search(query, locale, limit).map((hit) => hit.doc);
}
