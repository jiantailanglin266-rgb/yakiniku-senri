import type { MetadataRoute } from "next";
import { aiPortUrl } from "@/data/ai-port/site";

export const dynamic = "force-static";

/**
 * robots.txt。
 *
 * ⚠ 検索結果ページ（/search）とチャットAPIはクロールさせません。
 *   前者はキーワードごとに無限にURLが生えるため（ページ側でも noindex）、
 *   後者はページではないためです。
 *
 * パスはベースパス込みで書きます。robots.txt は Next.js のルーティングを
 * 通らない静的ファイルなので、`/search` とだけ書くと
 * GitHub Pages のサブディレクトリ配信で別の場所を指してしまいます。
 */
export default function robots(): MetadataRoute.Robots {
  const root = new URL(aiPortUrl("/"));
  const prefix = root.pathname.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: `${prefix}/`,
        disallow: [`${prefix}/search`, `${prefix}/api/`],
      },
    ],
    sitemap: aiPortUrl("/sitemap.xml"),
    host: root.origin,
  };
}
