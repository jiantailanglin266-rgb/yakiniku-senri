/**
 * CARD PORT の外枠。
 *
 * ■ ルートレイアウトではありません
 *   `<html>` / `<body>` は `src/app/layout.tsx` が持ちます（同居する4サイト共通）。
 *   ここではブランド固有のフォント変数と背景レイヤーだけを足し、
 *   スタイルは `.cardport-root` の配下に閉じ込めます。
 *
 * ■ CSS の読み込み範囲
 *   `cardport.css` は `/card-port` 配下からのみ読み込みます。
 *   全ページで読むと、焼肉 千里・AI PORT・CRYPTO PORT の訪問者にも
 *   不要なCSSを配信することになります。
 */
import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
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

export default function CardPortLayout({ children }: { children: React.ReactNode }) {
  return (
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
  );
}
