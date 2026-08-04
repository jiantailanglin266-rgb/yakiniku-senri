/**
 * AI PORT のサイトマップ項目。
 *
 * ルートの `src/app/sitemap.ts` から呼び出して、
 * 焼肉 千里 のURLと同じ1つの sitemap.xml にまとめます。
 * （サイトマップを分けると、どちらかの登録漏れに気づきにくくなります）
 *
 * ⚠ 検索結果ページ（/search）とチャットAPIは含めません。
 *   前者は無限にURLが生えるため noindex、後者はページではないためです。
 */

import type { MetadataRoute } from "next";
import { getArticles } from "@/data/ai-port/articles";
import { diagnoses } from "@/data/ai-port/diagnosis";
import { vendors } from "@/data/ai-port/feeds";
import { aiPortUrl } from "@/data/ai-port/site";
import { topics } from "@/data/ai-port/taxonomy";
import { tools } from "@/data/ai-port/tools";

type Entry = MetadataRoute.Sitemap[number];

export function aiPortSitemapEntries(): MetadataRoute.Sitemap {
  // 最新記事の更新日を基準にします。ビルド時刻を使うと、
  // 中身が変わっていないURLまで「更新された」と申告してしまいます。
  const latestArticle = getArticles()[0];
  const lastModified = latestArticle ? new Date(latestArticle.updated) : new Date(0);

  const staticPages: {
    path: string;
    priority: number;
    changeFrequency: Entry["changeFrequency"];
  }[] = [
    { path: "/", priority: 0.9, changeFrequency: "daily" },
    { path: "/news", priority: 0.85, changeFrequency: "hourly" },
    { path: "/tools", priority: 0.85, changeFrequency: "weekly" },
    { path: "/ranking", priority: 0.8, changeFrequency: "daily" },
    { path: "/compare", priority: 0.8, changeFrequency: "weekly" },
    { path: "/guides", priority: 0.8, changeFrequency: "weekly" },
    { path: "/diagnosis", priority: 0.75, changeFrequency: "monthly" },
    { path: "/chat", priority: 0.7, changeFrequency: "monthly" },
    { path: "/topics", priority: 0.7, changeFrequency: "monthly" },
    { path: "/youtube", priority: 0.6, changeFrequency: "daily" },
    { path: "/events", priority: 0.6, changeFrequency: "monthly" },
    { path: "/jobs", priority: 0.6, changeFrequency: "monthly" },
    { path: "/schools", priority: 0.6, changeFrequency: "monthly" },
    { path: "/about", priority: 0.5, changeFrequency: "yearly" },
    { path: "/disclosure", priority: 0.4, changeFrequency: "yearly" },
  ];

  return [
    ...staticPages.map((page) => ({
      url: aiPortUrl(page.path),
      lastModified,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),

    ...vendors.map((vendor) => ({
      url: aiPortUrl(`/news/${vendor.id}`),
      lastModified,
      changeFrequency: "hourly" as const,
      priority: 0.6,
    })),

    ...tools.map((tool) => ({
      url: aiPortUrl(`/tools/${tool.slug}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),

    ...topics.map((topic) => ({
      url: aiPortUrl(`/topics/${topic.slug}`),
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),

    ...getArticles().map((article) => ({
      url: aiPortUrl(`/guides/${article.slug}`),
      lastModified: new Date(article.updated),
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),

    ...diagnoses.map((diagnosis) => ({
      url: aiPortUrl(`/diagnosis/${diagnosis.slug}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
  ];
}
