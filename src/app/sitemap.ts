import type { MetadataRoute } from "next";
import { aiPortSitemapEntries } from "@/lib/ai-port/sitemap";
import { portalSitemap } from "@/portal/lib/sitemap";
import { cardPortSitemap } from "@/cardport/lib/site-sitemap";

export const dynamic = "force-static";

/**
 * このリポジトリには4つのポータルが同居しています。
 * サイトマップはドメイン単位のファイルなので、すべてのURLをここでまとめて出力します。
 * 分けると、どれかの登録漏れに気づきにくくなります。
 *   - CRYPTO PORT（/<言語>/ 以下。言語別 alternates つき）
 *   - AI PORT（/ai-port 配下）
 *   - CARD PORT（/card-port/<言語>/ 以下。言語別 alternates つき）
 *
 * SPORTS PORT は独自ドメイン想定のため、別ファイル（app/sports-sitemap.xml）に
 * 分けています。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [...aiPortSitemapEntries(), ...portalSitemap(), ...cardPortSitemap()];
}
