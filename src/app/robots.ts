import type { MetadataRoute } from "next";
import { brand } from "@/sports/config/site";
import { absoluteUrl } from "@/sports/lib/url";
import { defaultLocaleCode } from "@/sports/i18n/locales";

export const dynamic = "force-static";

/**
 * robots.txt。
 *
 * ⚠ 検索結果ページと管理画面はクロールさせません。
 *   前者はキーワードごとに無限にURLが生えるため、後者は価値が無いためです。
 *
 * パスはベースパス込みで書きます。robots.txt は Next.js のルーティングを
 * 通らない静的ファイルなので、`/search` とだけ書くと
 * GitHub Pages のサブディレクトリ配信で別の場所を指してしまいます。
 */
export default function robots(): MetadataRoute.Robots {
  const root = new URL(absoluteUrl(defaultLocaleCode, "/"));
  const prefix = root.pathname.replace(new RegExp(`/${defaultLocaleCode}/?$`), "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: `${prefix}/`,
        disallow: [`${prefix}/*/search`, `${prefix}/*/admin`, `${prefix}/api/`],
      },
    ],
    sitemap: `${brand.origin}${prefix}/sports-sitemap.xml`,
    host: root.origin,
  };
}
