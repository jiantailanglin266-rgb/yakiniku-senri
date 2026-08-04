import type { MetadataRoute } from "next";
import { siteUrl } from "@/data/site";
import { AI_PORT_BASE } from "@/data/ai-port/site";
import { brand as sportsBrand } from "@/sports/config/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // 検索結果ページはキーワードごとに無限にURLが生えるため、クロールさせません
        // （ページ側でも noindex を返しています）。APIも同様に除外します。
        disallow: [
          `${AI_PORT_BASE}/search`,
          `${AI_PORT_BASE}/api/`,
          // SPORTS PORT の検索結果と管理画面（クロールしても価値がありません）
          `${sportsBrand.routePrefix}/*/search`,
          `${sportsBrand.routePrefix}/*/admin`,
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
