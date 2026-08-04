/**
 * CARD PORT のルートレイアウト。
 *
 * このアプリはルートレイアウトを2つ持ちます。
 *   - `(senri)` … 既存の焼肉店サイト（従来どおり）
 *   - `(cardport)` … このフィンテックポータル
 * ルートグループはURLに現れないため、既存サイトのURLは一切変わりません。
 *
 * `<html>` の lang / dir は `[locale]/layout.tsx` からは変えられないため、
 * ここでは既定値のみを置き、各言語ページで `LocaleHtmlAttributes` が実際の値へ更新します。
 */
import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "@/cardport/styles/cardport.css";

import { brand, cardportAsset, cardportUrl, palette } from "@/cardport/config/site";
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
  icons: {
    icon: [{ url: cardportAsset("/favicon.ico"), sizes: "any" }],
  },
};

export const viewport: Viewport = {
  themeColor: palette.base,
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function CardPortRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body
        className="antialiased"
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
      </body>
    </html>
  );
}
