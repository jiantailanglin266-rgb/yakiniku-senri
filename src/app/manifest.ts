import type { MetadataRoute } from "next";
import { withBasePath } from "@/lib/base-path";
import { aiPortDescription, aiPortName, aiPortNameJa } from "@/data/ai-port/site";

export const dynamic = "force-static";

/** ホーム画面追加・検索結果でのブランド表示に使われます。 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${aiPortName}（${aiPortNameJa}）`,
    short_name: aiPortName,
    description: aiPortDescription,
    lang: "ja",
    start_url: withBasePath("/") || "/",
    display: "standalone",
    background_color: "#04060f",
    theme_color: "#04060f",
    icons: [
      { src: withBasePath("/icon.png"), sizes: "512x512", type: "image/png" },
      { src: withBasePath("/apple-touch-icon.png"), sizes: "180x180", type: "image/png" },
    ],
  };
}
