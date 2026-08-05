import type { MetadataRoute } from "next";
import { portalSitemap } from "@/portal/lib/sitemap";

export const dynamic = "force-static";

/**
 * CRYPTO PORT のサイトマップ（`/<言語>/` 以下。言語別 alternates つき）。
 *
 * 中身は `@/portal/lib/sitemap` が組み立てます。分割前は
 * 同居していた4サイトぶんをここでまとめて出力していました。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return portalSitemap();
}
