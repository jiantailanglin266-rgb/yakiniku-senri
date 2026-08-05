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

/**
 * SPORTS PORT のデモデータ基準日。
 *
 * 静的書き出しでも「今日の試合」が今日として並ぶよう、ビルド日を埋め込みます。
 * サーバー用・クライアント用でコンパイラが2回評価されても同じ値になるよう、
 * UTC の日単位に丸めています（丸めないとハイドレーションで時刻がずれます）。
 */
const referenceDay = new Date(Math.floor(Date.now() / 86_400_000) * 86_400_000).toISOString();

const nextConfig: NextConfig = {
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
          remotePatterns: [
            // YouTube のサムネイル（配信元のCDNをそのまま参照します）
            { protocol: "https" as const, hostname: "i.ytimg.com" },
            /**
             * Wikimedia Commons の画像。
             *
             * ライセンス確認済みの画像だけがここへ到達します
             * （src/media/lib/eligibility.ts の isPublishable を通らないと描画されません）。
             * 自社ストレージへ複製する運用に切り替える場合も、
             * 元画像URL・ファイルページ・作者・ライセンスの保持は必須です。
             */
            { protocol: "https" as const, hostname: "upload.wikimedia.org" },
          ],
        },
      }),
  poweredByHeader: false,
  compress: true,
  env: {
    NEXT_PUBLIC_SPORTS_REFERENCE_DAY: process.env.NEXT_PUBLIC_SPORTS_REFERENCE_DAY ?? referenceDay,
  },
};

export default nextConfig;
