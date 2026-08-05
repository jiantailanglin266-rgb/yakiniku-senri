import type { MetadataRoute } from "next";
import { cardPortSitemap } from "@/cardport/lib/site-sitemap";

export const dynamic = "force-static";

/**
 * CARD PORT のサイトマップ。
 *
 * 分離前は焼肉 千里 のサイトマップに相乗りしていました
 * （`cardPortSitemap()` を千里の `src/app/sitemap.ts` が呼ぶ形）。
 * 単独リポジトリになったので、そのまま自分のサイトマップになります。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return cardPortSitemap();
}
