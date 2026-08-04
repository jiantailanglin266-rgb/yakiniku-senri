import type { MetadataRoute } from "next";
import { siteUrl } from "@/data/site";
import { AI_PORT_BASE } from "@/data/ai-port/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // 検索結果ページはキーワードごとに無限にURLが生えるため、クロールさせません
        // （ページ側でも noindex を返しています）。APIも同様に除外します。
        disallow: [`${AI_PORT_BASE}/search`, `${AI_PORT_BASE}/api/`],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
