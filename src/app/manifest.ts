import type { MetadataRoute } from "next";
import { withBasePath } from "@/lib/base-path";
import { brand } from "@/portal/lib/site";

export const dynamic = "force-static";

/**
 * Web App Manifest。
 * スマートフォンでのホーム画面追加や、検索結果でのブランド表示に使われます。
 *
 * `description` はブランド設定に無いため、ここでは書きません。
 * 推測で書くとサイトの説明として配信されてしまいます（AGENTS.md 事実性）。
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.name,
    short_name: brand.shortName,
    lang: "ja",
    start_url: withBasePath("/") || "/",
    display: "standalone",
    background_color: "#05070f",
    theme_color: "#05070f",
    icons: [
      { src: withBasePath("/icon.png"), sizes: "512x512", type: "image/png" },
      { src: withBasePath("/apple-touch-icon.png"), sizes: "180x180", type: "image/png" },
    ],
  };
}
