import type { MetadataRoute } from "next";
import { siteUrl } from "@/data/site";
import { cardportUrl } from "@/cardport/config/site";

export const dynamic = "force-static";

/**
 * 同じホストで配信されているかを判定します。
 *
 * 焼肉店サイトと CARD PORT は別ドメインで運用できる構成ですが、
 * プレビュー環境では同じホストに同居します。
 * 同居しているときだけ、CARD PORT のサイトマップも robots.txt に載せます。
 */
function sameHost(a: string, b: string): boolean {
  try {
    return new URL(a).host === new URL(b).host;
  } catch {
    return false;
  }
}

export default function robots(): MetadataRoute.Robots {
  const sitemaps = [`${siteUrl}/sitemap.xml`];
  if (sameHost(siteUrl, cardportUrl)) {
    sitemaps.push(
      `${siteUrl}/cardport-sitemap.xml`,
      `${siteUrl}/cardport-news-sitemap.xml`,
      `${siteUrl}/cardport-video-sitemap.xml`,
    );
  }

  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: sitemaps,
    host: siteUrl,
  };
}
