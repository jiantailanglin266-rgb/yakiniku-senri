import type { MetadataRoute } from "next";
import { siteUrl } from "@/data/site";
import { AI_PORT_BASE } from "@/data/ai-port/site";
import { brand as sportsBrand } from "@/sports/config/site";
import { staticLocales } from "@/portal/i18n/config";
import { localeUrl } from "@/portal/lib/seo";
import { portalOrigin } from "@/portal/lib/site";

export const dynamic = "force-static";

/**
 * CRYPTO PORT の言語別ニュース／動画サイトマップ。
 *
 * 種類の違うサイトマップ（news / video）は主サイトマップに束ねられないため、
 * robots.txt から個別に示します。
 *
 * ただし **同じオリジンで配信しているときだけ** 申告します。
 * robots.txt は自ホストのサイトマップしか有効に申告できず、
 * 別ドメイン（環境変数が未設定のときの既定値を含む）を書くと
 * 存在しないURLを指し続けることになるためです。
 */
function portalSitemaps(): string[] {
  if (portalOrigin !== siteUrl) return [];
  return staticLocales().flatMap((locale) => [
    localeUrl(locale, "/news-sitemap.xml"),
    localeUrl(locale, "/video-sitemap.xml"),
  ]);
}

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
    sitemap: [`${siteUrl}/sitemap.xml`, ...portalSitemaps()],
    host: siteUrl,
  };
}
