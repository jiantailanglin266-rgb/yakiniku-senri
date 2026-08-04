import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
import "./globals.css";

import { defaultDescription } from "@/lib/seo";
import { withBasePath } from "@/lib/base-path";
import { siteName, siteUrl } from "@/data/site";
import { store } from "@/data/store";

/**
 * ルートレイアウト。
 *
 * `<html>` / `<body>` と共通フォントだけを持ちます。
 * ヘッダー・フッター・背景は `(senri)/layout.tsx` にあります。
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
  metadataBase: new URL(siteUrl),
  title: {
    default: `${store.name} | 世田谷・上馬の老舗焼肉店（${store.founded}年創業）`,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  applicationName: siteName,
  keywords: [
    "焼肉 千里",
    "世田谷 焼肉",
    "上馬 焼肉",
    "駒沢大学 焼肉",
    "若林 焼肉",
    "世田谷 老舗焼肉",
    "もみ焼肉",
    "秘伝のタレ",
    "テイクアウト 焼肉",
  ],
  alternates: { canonical: siteUrl },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: siteUrl,
    siteName,
    title: `${store.name} | 世田谷・上馬の老舗焼肉店`,
    description: defaultDescription,
    images: [{ url: "/images/common/ogp.png", width: 1200, height: 630, alt: siteName }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${store.name} | 世田谷・上馬の老舗焼肉店`,
    description: defaultDescription,
    images: ["/images/common/ogp.png"],
  },
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
  themeColor: "#080808",
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
