import type { Metadata, Viewport } from "next";
import "./sports.css";

import { brand } from "@/sports/config/site";

/**
 * ルートレイアウト。
 *
 * ■ 分離前の経緯（2026-08-05）
 *   もともと焼肉 千里 のリポジトリに同居し、`/sports-port/<言語>/` で
 *   配信していました。`<html>` / `<body>` は千里側のルートレイアウトが
 *   持っていたため、SPORTS PORT 側は `<div class="sports-root">` から
 *   始まっていました。単独リポジトリになったので、ここで持ちます。
 *
 * ■ `lang` を "ja" で固定している理由
 *   言語は `[locale]` セグメントに入っているため、ここでは分かりません。
 *   実際の言語は `[locale]/layout.tsx` が包む `<div lang dir>` で宣言していて、
 *   支援技術と RTL レイアウトはそちらを見ます。
 *   検索エンジンへは hreflang で伝えています。
 *
 * ■ 書体
 *   Inter / JetBrains Mono は `[locale]/layout.tsx` が読み込みます
 *   （`sports.css` のトークンがそこで定義した CSS 変数を参照するため）。
 */

export const metadata: Metadata = {
  title: { default: brand.name, template: `%s | ${brand.name}` },
  applicationName: brand.name,
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#04060f",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
