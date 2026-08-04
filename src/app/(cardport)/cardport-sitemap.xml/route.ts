/**
 * CARD PORT の言語別サイトマップ。
 *
 * `/sitemap.xml` は既存の焼肉店サイト用のままなので、別パスで提供します。
 * 静的エクスポートでも生成できるよう `force-static` にしています。
 */
import { buildSitemapXml } from "@/cardport/lib/feeds";

export const dynamic = "force-static";

export function GET() {
  return new Response(buildSitemapXml(), {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
