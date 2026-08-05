/**
 * ルートレイアウト。
 *
 * ■ 分離前の経緯（2026-08-05）
 *   もともと焼肉 千里 のリポジトリに同居し、`/card-port/<言語>/` で
 *   配信していました。`<html>` / `<body>` は千里側のルートレイアウトが
 *   持っていたため、ここは `<div class="cardport-root">` から
 *   始まっていました。単独リポジトリになったので、ここで持ちます。
 *
 * ■ `lang` を "ja" で固定している理由
 *   言語は `[locale]` セグメントに入っているため、ここでは分かりません。
 *   実際の言語は `[locale]/layout.tsx` が包むラッパーで宣言しています。
 *   検索エンジンへは hreflang で伝えています。
 */
import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "@/cardport/styles/cardport.css";
// 画像モジュールの配色トークン（クレジット表示に使います）
import "@/media/styles/media.css";

import { brand, cardportUrl, palette } from "@/cardport/config/site";
import { Backdrop } from "@/cardport/components/visual/Backdrop";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cardport-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cardport-body",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-cardport-mono",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(cardportUrl),
  title: { default: brand.name, template: `%s | ${brand.name}` },
  applicationName: brand.name,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <div
          className={`cardport-root ${display.variable} ${body.variable} ${mono.variable}`}
          style={
            {
              // config/site.ts の palette を CSS 変数へ流し込みます。
              // ブランドカラーの差し替えが config だけで完結します。
              "--port-base": palette.base,
              "--port-surface": palette.surface,
              "--port-cyan": palette.cyan,
              "--port-electric": palette.electric,
              "--port-violet": palette.violet,
              "--port-magenta": palette.magenta,
              "--port-emerald": palette.emerald,
              "--port-gold": palette.gold,
            } as React.CSSProperties
          }
        >
          <Backdrop />
          {children}
        </div>
      </body>
    </html>
  );
}
