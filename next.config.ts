import type { NextConfig } from "next";

/**
 * GitHub Pages へのプレビュー公開時のみ静的エクスポートに切り替えます。
 * （GitHub Actions 側で GITHUB_PAGES=true / PAGES_BASE_PATH を設定）
 *
 * 本番（Vercel）では通常の Next.js サーバーとしてビルドされ、
 * next/image の最適化・遅延読み込みがそのまま有効になります。
 */
const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGithubPages ? (process.env.PAGES_BASE_PATH ?? "") : "";

const nextConfig: NextConfig = {
  /**
   * サーバー配信のときだけ `*.node.ts` をルートとして認識させます。
   *
   * AI PORT のチャットAPI（POST の Route Handler）は静的エクスポートでは持てません。
   * ファイル名を `route.node.ts` にし、この拡張子を静的エクスポート時に外すことで、
   * 「サーバーならAPIあり／静的ならAPIなし」を1つのコードベースで両立させています。
   * APIが無い環境では、チャットUIがサイト内検索へ自動的に切り替わります。
   */
  pageExtensions: isGithubPages ? ["ts", "tsx"] : ["ts", "tsx", "node.ts"],

  ...(isGithubPages
    ? {
        // 静的エクスポート（サーバー不要）。画像最適化APIは使えないため unoptimized にします
        output: "export" as const,
        basePath,
        assetPrefix: basePath || undefined,
        images: { unoptimized: true },
        // 各ページを <path>/index.html として出力し、GitHub Pages で確実に解決させます
        trailingSlash: true,
      }
    : {
        images: {
          // 画像を差し替えても軽量に配信できるよう、AVIF / WebP を優先します
          formats: ["image/avif" as const, "image/webp" as const],
          deviceSizes: [375, 390, 640, 768, 1024, 1280, 1440, 1920],
          imageSizes: [96, 128, 256, 384],
          // AI PORT のYouTubeサムネイル（配信元のCDNをそのまま参照します）
          remotePatterns: [{ protocol: "https" as const, hostname: "i.ytimg.com" }],
        },
      }),
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
