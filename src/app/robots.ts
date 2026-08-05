import type { MetadataRoute } from "next";
import { cardportAbsoluteUrl, cardportBasePath, cardportUrl } from "@/cardport/config/site";

export const dynamic = "force-static";

/**
 * robots.txt。
 *
 * パスはベースパス込みで書きます。robots.txt は Next.js のルーティングを
 * 通らない静的ファイルなので、`/` とだけ書くと GitHub Pages の
 * サブディレクトリ配信で別の場所を指してしまいます。
 */
export default function robots(): MetadataRoute.Robots {
  const prefix = cardportBasePath;

  return {
    rules: [
      {
        userAgent: "*",
        allow: `${prefix}/`,
        // 検索結果ページはキーワードごとに無限にURLが生えるため、クロールさせません
        disallow: [`${prefix}/*/search`],
      },
    ],
    sitemap: cardportAbsoluteUrl("/sitemap.xml"),
    host: new URL(cardportUrl).origin,
  };
}
