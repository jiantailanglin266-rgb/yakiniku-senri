import type { NextConfig } from "next";

/**
 * GitHub Pages へ公開するときだけ静的エクスポートに切り替えます。
 * （GitHub Actions 側で GITHUB_PAGES=true / PAGES_BASE_PATH を設定）
 *
 * サーバー配信（Vercel など）では通常の Next.js としてビルドされ、
 * next/image の最適化・遅延読み込みがそのまま有効になります。
 */
const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGithubPages ? (process.env.PAGES_BASE_PATH ?? "") : "";

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
};

export default nextConfig;
