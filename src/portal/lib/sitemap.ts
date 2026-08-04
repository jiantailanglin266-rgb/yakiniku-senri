/**
 * ポータルのサイトマップ生成。
 *
 * ■ 言語別 alternates
 *   同じページの各言語版を `alternates.languages` に入れます。
 *   hreflang をHTMLとサイトマップの両方で示すことで、
 *   クローラーが言語版の対応関係を取り違えにくくなります。
 *
 * ■ lastModified
 *   ビルド時刻を入れると全URLが「毎回更新された」ことになり、
 *   クロールの優先度判断を誤らせます。コンテンツ側の日付を使います。
 */

import type { MetadataRoute } from "next";
import { locales } from "@/portal/i18n/config";
import { coins } from "@/portal/data/coins";
import { exchanges } from "@/portal/data/exchanges";
import { learnArticles } from "@/portal/data/learn";
import { news, sortedNews } from "@/portal/data/news";
import { tools } from "@/portal/data/tools";
import { videos } from "@/portal/data/videos";
import { wallets } from "@/portal/data/wallets";
import { diagnoses } from "@/portal/data/diagnoses";
import { legalPages } from "@/portal/data/legal";
import { pageImageSitemapEntries } from "@/media/lib/structured-data";
import { portalPageKey } from "./media";
import { alternateLanguages, localeUrl } from "./seo";

type Entry = {
  path: string;
  lastModified: Date;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
  /** 画像サイトマップ用。掲載可能な画像がある枠だけ結果に載ります */
  pageKey?: string;
};

function contentEntries(): Entry[] {
  const latestNews = sortedNews()[0];
  const newsDate = latestNews ? new Date(latestNews.publishedAt) : new Date(0);
  const learnDate = learnArticles.reduce(
    (latest, article) =>
      Date.parse(article.updatedAt) > latest.getTime() ? new Date(article.updatedAt) : latest,
    new Date(0),
  );

  return [
    { path: "", lastModified: newsDate, changeFrequency: "hourly", priority: 1 },
    { path: "/coins", lastModified: newsDate, changeFrequency: "hourly", priority: 0.9 },
    { path: "/news", lastModified: newsDate, changeFrequency: "hourly", priority: 0.9 },
    { path: "/exchanges", lastModified: learnDate, changeFrequency: "weekly", priority: 0.9 },
    {
      path: "/exchanges/overseas",
      lastModified: learnDate,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    { path: "/wallets", lastModified: learnDate, changeFrequency: "weekly", priority: 0.8 },
    { path: "/tools", lastModified: learnDate, changeFrequency: "weekly", priority: 0.8 },
    { path: "/videos", lastModified: learnDate, changeFrequency: "weekly", priority: 0.7 },
    { path: "/learn", lastModified: learnDate, changeFrequency: "weekly", priority: 0.8 },
    { path: "/diagnosis", lastModified: learnDate, changeFrequency: "monthly", priority: 0.7 },
    { path: "/campaigns", lastModified: learnDate, changeFrequency: "weekly", priority: 0.5 },
    { path: "/faq", lastModified: learnDate, changeFrequency: "monthly", priority: 0.5 },
    { path: "/image-credits", lastModified: learnDate, changeFrequency: "monthly", priority: 0.3 },

    ...coins.map((coin) => ({
      path: `/coins/${coin.slug}`,
      pageKey: portalPageKey("coin", coin.slug),
      lastModified: newsDate,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...news.map((article) => ({
      path: `/news/${article.slug}`,
      pageKey: portalPageKey("news", article.slug),
      lastModified: new Date(article.updatedAt ?? article.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...exchanges.map((exchange) => ({
      path: `/exchanges/${exchange.slug}`,
      lastModified: learnDate,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...wallets.map((wallet) => ({
      path: `/wallets/${wallet.slug}`,
      lastModified: learnDate,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...tools.map((tool) => ({
      path: `/tools/${tool.slug}`,
      lastModified: learnDate,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...videos.map((video) => ({
      path: `/videos/${video.slug}`,
      pageKey: portalPageKey("video", video.slug),
      lastModified: new Date(video.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...learnArticles.map((article) => ({
      path: `/learn/${article.slug}`,
      pageKey: portalPageKey("learn", article.slug),
      lastModified: new Date(article.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...diagnoses.map((diagnosis) => ({
      path: `/diagnosis/${diagnosis.slug}`,
      lastModified: learnDate,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...legalPages.map((page) => ({
      path: `/legal/${page.slug}`,
      lastModified: learnDate,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}

export function portalSitemap(): MetadataRoute.Sitemap {
  const entries = contentEntries();

  return locales.flatMap((locale) =>
    entries.map((entry) => {
      // 掲載可否の確認が済んでいない画像は `pageImageSitemapEntries` が返しません
      const images = entry.pageKey ? pageImageSitemapEntries(entry.pageKey, locale.code) : [];
      return {
        url: localeUrl(locale.code, entry.path),
        lastModified: entry.lastModified,
        changeFrequency: entry.changeFrequency,
        priority: entry.priority,
        alternates: { languages: alternateLanguages(entry.path) },
        ...(images.length > 0 ? { images: images.map((image) => image.loc) } : {}),
      };
    }),
  );
}

/**
 * ニュース専用サイトマップ用のURL一覧。
 * Google News のサイトマップは2日以内の記事のみが対象のため、
 * 実運用ではここで期間の絞り込みを行います。
 */
export function portalNewsUrls(
  locale: string,
): { url: string; publishedAt: string; title: string }[] {
  return sortedNews().map((article) => ({
    url: localeUrl(locale, `/news/${article.slug}`),
    publishedAt: article.publishedAt,
    title: article.title[locale] ?? article.title.en,
  }));
}
