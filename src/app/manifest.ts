import type { MetadataRoute } from "next";
import { withBasePath } from "@/lib/base-path";
import { siteName } from "@/data/site";
import { store } from "@/data/store";

export const dynamic = "force-static";

/**
 * Web App Manifest。
 * スマートフォンでのホーム画面追加や、検索結果でのブランド表示に使われます。
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteName} | 世田谷・上馬の老舗焼肉店`,
    short_name: siteName,
    description: `${store.founded}年創業、東京都世田谷区上馬の老舗焼肉店。秘伝のタレをもみ込んだ名物「もみシリーズ」をご用意しています。`,
    lang: "ja",
    start_url: withBasePath("/") || "/",
    display: "standalone",
    background_color: "#080808",
    theme_color: "#080808",
    icons: [
      { src: withBasePath("/icon.png"), sizes: "512x512", type: "image/png" },
      {
        src: withBasePath("/apple-touch-icon.png"),
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
