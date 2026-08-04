import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import "../sports.css";

import { brand, features } from "@/sports/config/site";
import { getDictionary, localeCodes, findLocale } from "@/sports/i18n";
import { alternateUrls, absoluteUrl } from "@/sports/lib/url";
import { defaultOgImage } from "@/sports/lib/seo";
import { Header } from "@/sports/components/layout/Header";
import { Footer } from "@/sports/components/layout/Footer";
import { SportsChat } from "@/sports/components/chat/SportsChat";
import { JsonLd } from "@/sports/components/ui/primitives";
import { organizationJsonLd, websiteJsonLd } from "@/sports/lib/structured-data";
import { usingMockData } from "@/sports/lib/api";
import { withBasePath } from "@/lib/base-path";

const display = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-sports-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sports-mono",
  display: "swap",
});

/** 15言語すべてを事前生成します（静的書き出しでも全ロケールが動くように） */
export function generateStaticParams() {
  return localeCodes.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const info = findLocale(locale);
  if (!info) return {};
  const dict = getDictionary(info.code);

  return {
    metadataBase: new URL(brand.origin),
    title: {
      default: `${brand.name} | ${dict.siteTagline}`,
      template: `%s | ${brand.name}`,
    },
    description: dict.siteSubCopy,
    applicationName: brand.name,
    alternates: {
      canonical: absoluteUrl(info.code, "/"),
      languages: alternateUrls("/"),
      types: { "application/rss+xml": `${brand.origin}/sports-rss.xml` },
    },
    robots: { index: true, follow: true },
    icons: {
      icon: [{ url: withBasePath("/favicon.ico"), sizes: "any" }],
    },
    openGraph: {
      type: "website",
      siteName: brand.name,
      title: `${brand.name} | ${dict.siteTagline}`,
      description: dict.siteSubCopy,
      images: [{ url: withBasePath(defaultOgImage), width: 1200, height: 630, alt: brand.name }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = {
  themeColor: "#04060f",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function SportsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const info = findLocale(locale);
  if (!info) notFound();

  const dict = getDictionary(info.code);

  return (
    /*
     * `<html>` / `<body>` はルートレイアウト（src/app/layout.tsx）が持っています。
     * このリポジトリには他サイトが同居しており、ルートレイアウトは1つだけなので、
     * lang / dir はこのラッパーに付けます。
     * CSS も `.sports-root` 配下に閉じており、他サイトへは影響しません。
     */
    <div
      lang={info.hreflang}
      dir={info.rtl ? "rtl" : "ltr"}
      className={`sports-root antialiased ${display.variable} ${mono.variable}`}
    >
      <a
        href="#main"
        className="focus:bg-cyan focus:text-void sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-100 focus:rounded-lg focus:px-4 focus:py-2"
      >
        {dict.skipToContent}
      </a>

      {/* 背景レイヤー（全ページ共通の1枚。セクションごとに背景を持たせません） */}
      <div className="sp-aurora sp-aurora-drift fixed" aria-hidden="true" />
      <div className="sp-grid fixed" aria-hidden="true" />
      <div className="sp-noise fixed" aria-hidden="true" />

      <Header locale={info} />

      {usingMockData ? (
        <p
          className="border-caution/30 bg-caution/10 text-caution border-b px-4 py-1.5 text-center text-[0.6875rem]"
          role="status"
        >
          {info.code === "ja"
            ? "デモデータを表示しています。スコア・順位・料金は実際の値ではありません。"
            : "Showing demo data. Scores, tables and prices are not real values."}
        </p>
      ) : null}

      <main id="main" className="mx-auto max-w-[110rem] px-4 pt-6 pb-16 sm:px-6">
        {children}
      </main>

      <Footer locale={info} />

      {features.chatbot ? <SportsChat locale={info.code} /> : null}

      <JsonLd data={[websiteJsonLd(info.code), organizationJsonLd(info.code)]} />
    </div>
  );
}
