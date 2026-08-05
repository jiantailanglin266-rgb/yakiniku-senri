import type { MetadataRoute } from "next";
import { staticLocales } from "@/portal/i18n/config";
import { localeUrl } from "@/portal/lib/seo";
import { portalOrigin, portalBase } from "@/portal/lib/site";

export const dynamic = "force-static";

/**
 * 言語別のニュース／動画サイトマップ。
 *
 * 種類の違うサイトマップ（news / video）は主サイトマップに束ねられないため、
 * robots.txt から個別に示します。
 */
function extraSitemaps(): string[] {
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
        // APIはクロールしても価値がありません
        disallow: ["/api/"],
      },
    ],
    sitemap: [`${portalBase}/sitemap.xml`, ...extraSitemaps()],
    host: portalOrigin,
  };
}
