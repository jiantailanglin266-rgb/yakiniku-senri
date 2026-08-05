import type { Metadata, Viewport } from "next";
import "./globals.css";

import { brand, portalOrigin } from "@/portal/lib/site";

/**
 * ルートレイアウト。
 *
 * `<html>` / `<body>` だけを持ちます。
 * 書体・配色・ヘッダー・フッターは `[locale]/layout.tsx` にあります。
 *
 * ■ `lang` を "ja" で固定している理由
 *   言語は `[locale]` セグメントに入っているため、ここでは分かりません。
 *   実際の言語は `[locale]/layout.tsx` が包む `<div lang dir>` で宣言していて、
 *   支援技術はそちらを見ます。検索エンジンへは hreflang で伝えています。
 *
 *   分割前は焼肉 千里 と同居していたため、この形にせざるを得ませんでした。
 *   単独リポジトリになったので、`[locale]` をルートグループへ移して
 *   `<html lang={locale}>` にすることが可能になっています（未実施）。
 *   URLは変わりませんが、レイアウトの入れ替えになるため分割とは分けています。
 */

export const metadata: Metadata = {
  metadataBase: new URL(portalOrigin),
  title: {
    default: brand.name,
    template: `%s | ${brand.name}`,
  },
  applicationName: brand.name,
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#05070f",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
