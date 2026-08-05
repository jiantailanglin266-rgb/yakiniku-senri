import type { NextConfig } from "next";

/**
 * GitHub Pages はリポジトリ名のサブディレクトリで配信するため、
 * ベースパスが要ります。ローカル開発では付けません
 * （`npm run dev` は http://localhost:3000/ で開きます）。
 *
 * ⚠ PAGES_BASE_PATH と NEXT_PUBLIC_BASE_PATH は必ず両方を渡してください。
 *   前者は Next.js の basePath（`_next/` 配下とリンクに効きます）。
 *   後者は withBasePath() が使う値です。
 *   next/image は `unoptimized` のとき basePath を自動で付けないため、
 *   /public 配下を直接参照する画像・動画はこちらで前置しています。
 *   片方だけだと、ページは開けるのに画像だけ 404 になります。
 */
const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGithubPages ? (process.env.PAGES_BASE_PATH ?? "") : "";

const nextConfig: NextConfig = {
  /**
   * サーバー配信のときだけ `*.node.ts` をルートとして認識させます。
   *
   * チャットAPI（POST の Route Handler）は静的エクスポートでは持てません。
   * ファイル名を `route.node.ts` にし、静的エクスポート時にこの拡張子を外すことで、
   * 「サーバーならAPIあり／静的ならAPIなし」を1つのコードベースで両立させています。
   * APIが無い環境では、チャットUIがサイト内検索へ自動的に切り替わります。
   */
  pageExtensions: isGithubPages ? ["ts", "tsx"] : ["ts", "tsx", "node.ts"],

  ...(isGithubPages
    ? {
        output: "export" as const,
        basePath,
        assetPrefix: basePath || undefined,
        images: { unoptimized: true },
        // 各ページを <path>/index.html として出力し、GitHub Pages で確実に解決させます
        trailingSlash: true,
      }
    : {
        images: {
          formats: ["image/avif" as const, "image/webp" as const],
          deviceSizes: [375, 390, 640, 768, 1024, 1280, 1440, 1920],
          imageSizes: [96, 128, 256, 384],
          remotePatterns: [
            // YouTube のサムネイル（配信元のCDNをそのまま参照します）
            { protocol: "https" as const, hostname: "i.ytimg.com" },
            /**
             * Wikimedia Commons の画像。
             * ライセンス確認済みの画像だけがここへ到達します
             * （src/media/lib/eligibility.ts の isPublishable を通らないと描画されません）。
             */
            { protocol: "https" as const, hostname: "upload.wikimedia.org" },
          ],
        },
      }),
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
