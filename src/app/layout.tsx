import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
import "./globals.css";

import { withBasePath } from "@/lib/base-path";

/**
 * ルートレイアウト。
 *
 * `<html>` / `<body>` と共通フォントだけを持ちます。
 * 各ポータルの外枠（ヘッダー・フッター・背景・配色）は、それぞれのレイアウトにあります。
 *   - `(portal)/[locale]/layout.tsx` … CRYPTO PORT
 *   - `ai-port/layout.tsx`           … AI PORT
 *   - `card-port/layout.tsx`         … CARD PORT
 *   - `sports-port/[locale]/layout.tsx` … SPORTS PORT
 *
 * ここにサイト固有のメタデータを置かないでください。
 * 4サイトが同居しているため、1つの説明文を全体の既定にすると必ず嘘になります。
 * タイトル・説明・OGPは各サイトの generateMetadata が持ちます。
 */

const notoSerifJp = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-noto-serif-jp",
  display: "swap",
  preload: false,
});

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-noto-sans-jp",
  display: "swap",
  preload: false,
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  icons: {
    // ファビコンは metadataBase の解決対象外のため、ベースパスを明示的に付与します
    icon: [
      { url: withBasePath("/favicon.ico"), sizes: "any" },
      { url: withBasePath("/icon.png"), type: "image/png" },
    ],
    apple: [{ url: withBasePath("/apple-touch-icon.png"), sizes: "180x180" }],
  },
  formatDetection: { telephone: true },
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
    <html
      lang="ja"
      className={`${notoSerifJp.variable} ${notoSansJp.variable} ${cormorant.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
