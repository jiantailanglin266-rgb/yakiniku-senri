import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Noto_Sans_JP, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "@/styles/ai-port.css";

import { NeuralField } from "@/components/ai-port/effects/NeuralField";
import { ScrollProgress } from "@/components/ai-port/effects/ScrollProgress";
import { MobileTabBar } from "@/components/ai-port/layout/MobileTabBar";
import { PortalFooter } from "@/components/ai-port/layout/PortalFooter";
import { PortalHeader } from "@/components/ai-port/layout/PortalHeader";
import { GoogleTranslate } from "@/components/i18n/GoogleTranslate";
import { JsonLd } from "@/components/ui/JsonLd";
import {
  aiPortBaseUrl,
  aiPortDescription,
  aiPortName,
  aiPortOrigin,
  aiPortUrl,
} from "@/data/ai-port/site";
import { aiPortOrganizationJsonLd, aiPortWebsiteJsonLd } from "@/lib/ai-port/structured-data";
import { withBasePath } from "@/lib/base-path";

/**
 * ルートレイアウト。
 *
 * ■ 分離前の経緯（2026-08-04）
 *   もともと焼肉 千里 のリポジトリに同居し、`/ai-port` 配下のレイアウトでした。
 *   `<html>` / `<body>` は千里側のルートレイアウトが持っていたため、
 *   ここでは `<div class="ai-root">` から始まっていました。
 *   単独リポジトリになったので、`<html>` / `<body>` もここで持ちます。
 *
 * ■ 日本語フォント
 *   `--font-ai-sans` は `--font-noto-sans-jp` を参照しています。
 *   同居時代は千里のルートレイアウトが読み込んでいたため、
 *   ここで読み込まないと本文が既定のゴシックになります。
 */

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-noto-sans-jp",
  display: "swap",
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  // 等幅はラベル程度にしか使わないので、先読みはしません
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(aiPortBaseUrl),
  title: {
    default: `${aiPortName} | AIニュース・AIツール・AIエージェントのポータル`,
    template: `%s | ${aiPortName}`,
  },
  description: aiPortDescription,
  applicationName: aiPortName,
  keywords: [
    "AI ポータル",
    "AIニュース",
    "AIツール 比較",
    "生成AI 最新",
    "AIエージェント",
    "AI診断",
    "Web3",
    "LLMO",
  ],
  alternates: {
    canonical: aiPortUrl("/"),
    languages: { ja: aiPortUrl("/"), "x-default": aiPortUrl("/") },
    types: { "application/rss+xml": aiPortUrl("/rss.xml") },
  },
  robots: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: aiPortUrl("/"),
    siteName: aiPortName,
    title: `${aiPortName} | AIニュース・AIツール・AIエージェントのポータル`,
    description: aiPortDescription,
    images: [
      {
        url: `${aiPortOrigin}${withBasePath("/images/ai-port/ogp.svg")}`,
        width: 1200,
        height: 630,
        alt: aiPortName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${aiPortName} | AIニュース・AIツール・AIエージェントのポータル`,
    description: aiPortDescription,
    images: [`${aiPortOrigin}${withBasePath("/images/ai-port/ogp.svg")}`],
  },
};

export const viewport: Viewport = {
  themeColor: "#04060f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ja"
      className={`${notoSansJp.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased">
        <div className="ai-root">
          {/* 背景 — 1枚の連続した宇宙。セクション個別の背景色は持たせません */}
          <div className="ai-backdrop" aria-hidden="true" />
          <div className="ai-aurora" aria-hidden="true" />
          <NeuralField className="pointer-events-none fixed inset-0 -z-[2] h-full w-full opacity-70" />
          <div className="ai-grid" aria-hidden="true" />
          <div className="ai-noise" aria-hidden="true" />

          <ScrollProgress />

          <a
            href="#ai-main"
            className="focus:bg-ai-cyan sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:rounded-full focus:px-5 focus:py-2.5 focus:text-[0.85rem] focus:text-[#04060f]"
          >
            本文へスキップ
          </a>

          <PortalHeader />

          <main id="ai-main" className="pt-[4.25rem]">
            {children}
          </main>

          <PortalFooter />
          <MobileTabBar />

          {/* 自動翻訳エンジン。日本語のままの訪問者には読み込みません（固定要件） */}
          <GoogleTranslate />

          <JsonLd data={[aiPortWebsiteJsonLd, aiPortOrganizationJsonLd]} />
        </div>
      </body>
    </html>
  );
}
