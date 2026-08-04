import type { MetadataRoute } from "next";
import { mainNav, utilityNav } from "@/data/navigation";
import { getNews } from "@/data/news";
import { siteUrl } from "@/data/site";

export const dynamic = "force-static";

/**
 * 焼肉 千里のサイトマップ。
 *
 * 4つのポータル（CRYPTO PORT / AI PORT / CARD PORT / SPORTS PORT）は
 * 別リポジトリへ分離したため、ここには含めません。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // ビルドのたびに現在時刻を入れると全URLが「毎回更新された」ことになり、
  // クロールの優先度判断を誤らせます。最新のお知らせの日付を基準にします。
  const latestNews = getNews(1)[0];
  const lastModified = latestNews ? new Date(latestNews.date) : new Date(0);

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    ...mainNav.map((item) => ({
      url: `${siteUrl}${item.href}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...utilityNav.map((item) => ({
      url: `${siteUrl}${item.href}`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];

  const newsPages: MetadataRoute.Sitemap = getNews().map((post) => ({
    url: `${siteUrl}/news/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "yearly",
    priority: 0.5,
  }));

  return [...staticPages, ...newsPages];
}
