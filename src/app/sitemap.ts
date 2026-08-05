import type { MetadataRoute } from "next";
import { aiPortSitemapEntries } from "@/lib/ai-port/sitemap";

export const dynamic = "force-static";

/**
 * AI PORT のサイトマップ。
 *
 * 分離前は焼肉 千里 のサイトマップに相乗りしていました
 * （`src/lib/ai-port/sitemap.ts` を千里の `src/app/sitemap.ts` が呼ぶ形）。
 * 単独リポジトリになったので、そのまま自分のサイトマップになります。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return aiPortSitemapEntries();
}
