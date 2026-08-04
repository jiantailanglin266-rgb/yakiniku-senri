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
import { getLocaleConfig, locales } from "@/portal/i18n/config";
import { coins } from "@/portal/data/coins";
import { exchanges } from "@/portal/data/exchanges";
import { learnArticles } from "@/portal/data/learn";
import { news, sortedNews } from "@/portal/data/news";
import { tools } from "@/portal/data/tools";
import { videos } from "@/portal/data/videos";
import { portalPhoto } from "./photos";
import { wallets } from "@/portal/data/wallets";
import { diagnoses } from "@/portal/data/diagnoses";
import { legalPages } from "@/portal/data/legal";
import { pageImageSitemapEntries } from "@/media/lib/structured-data";
import { portalPageKey } from "./media";
import { absolutePortalUrl, alternateLanguages, localeUrl } from "./seo";
import { brand } from "./site";
import { t } from "./format";

type Entry = {
  path: string;
  lastModified: Date;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
  /** 画像サイトマップ用。掲載可能な画像がある枠だけ結果に載ります */
  pageKey?: string;
  /** 一括クレジット方式の写真（取得済みのものだけ結果に載ります） */
  photo?: { kind: "coin" | "learn" | "news"; slug: string };
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
      photo: { kind: "coin" as const, slug: coin.slug },
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
      photo: { kind: "learn" as const, slug: article.slug },
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
      const verified = entry.pageKey ? pageImageSitemapEntries(entry.pageKey, locale.code) : [];
      // 一括クレジット方式の写真（public/images/portal/）も画像サイトマップに載せます
      const photo = entry.photo ? portalPhoto(entry.photo.kind, entry.photo.slug) : null;
      const images = [
        ...verified.map((image) => image.loc),
        ...(photo ? [absolutePortalUrl(photo.src)] : []),
      ];
      return {
        url: localeUrl(locale.code, entry.path),
        lastModified: entry.lastModified,
        changeFrequency: entry.changeFrequency,
        priority: entry.priority,
        alternates: { languages: alternateLanguages(entry.path) },
        ...(images.length > 0 ? { images } : {}),
      };
    }),
  );
}

/**
 * ニュース専用サイトマップ用のURL一覧。
 * Google News のサイトマップは2日以内の記事のみが対象のため、
 * 実運用ではここで期間の絞り込みを行います。
 */
/**
 * Google ニュース向けサイトマップの項目。
 *
 * 公開から2日以内の記事だけを返します。Google ニュースのサイトマップは
 * それより古い記事を受け付けないため、載せても無効な項目になります。
 *
 * 静的書き出しでは「2日」の基準がビルド時刻に固定されます。
 * 運用ではサーバー実行か定期ビルドが必要です（docs/portal/04-status.md）。
 */
export const NEWS_SITEMAP_MAX_AGE_HOURS = 48;

export function portalNewsSitemapUrls(
  locale: string,
  now: Date = new Date(),
): {
  url: string;
  title: string;
  publishedAt: string;
  publicationName: string;
  language: string;
}[] {
  const cutoff = now.getTime() - NEWS_SITEMAP_MAX_AGE_HOURS * 3_600_000;
  const language = getLocaleConfig(locale).hreflang;

  return sortedNews()
    .filter((article) => Date.parse(article.publishedAt) >= cutoff)
    .map((article) => ({
      url: localeUrl(locale, `/news/${article.slug}`),
      title: t(article.title, locale),
      publishedAt: article.publishedAt,
      publicationName: brand.name,
      language,
    }));
}

/**
 * 動画サイトマップの項目。
 *
 * `youtubeId` が設定されている動画だけを返します。
 * 動画サイトマップは再生場所（player_loc）が必須で、
 * 指定できない動画は載せても無効な項目になるためです。
 */
export function portalVideoSitemapEntries(locale: string): {
  pageUrl: string;
  playerUrl: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  durationSec: number;
  publishedAt: string;
}[] {
  return videos
    .filter((video) => video.youtubeId.length > 0)
    .map((video) => ({
      pageUrl: localeUrl(locale, `/videos/${video.slug}`),
      playerUrl: `https://www.youtube.com/embed/${video.youtubeId}`,
      thumbnailUrl: `https://i.ytimg.com/vi/${video.youtubeId}/maxresdefault.jpg`,
      title: t(video.title, locale),
      description: t(video.summary, locale),
      durationSec: video.durationSec,
      publishedAt: video.publishedAt,
    }));
}

export function portalNewsUrls(
  locale: string,
): { url: string; publishedAt: string; title: string }[] {
  return sortedNews().map((article) => ({
    url: localeUrl(locale, `/news/${article.slug}`),
    publishedAt: article.publishedAt,
    title: article.title[locale] ?? article.title.en,
  }));
}
