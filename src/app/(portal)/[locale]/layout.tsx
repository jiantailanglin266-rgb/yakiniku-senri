import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "../portal.css";

import {
  getLocaleConfig,
  isLocale,
  localeDir,
  localePath,
  staticLocales,
} from "@/portal/i18n/config";
import { getDictionary } from "@/portal/i18n/dictionaries";
import { brand } from "@/portal/lib/site";
import { alternateLanguages, localeUrl } from "@/portal/lib/seo";
import { organizationJsonLd, websiteJsonLd } from "@/portal/lib/structured-data";
import { withBasePath } from "@/lib/base-path";

import { PortalHeader } from "@/portal/components/layout/PortalHeader";
import { PortalFooter } from "@/portal/components/layout/PortalFooter";
import { VideoBand } from "@/portal/components/layout/VideoBand";
import { CryptoChat } from "@/portal/components/chat/CryptoChat";
import { JsonLd } from "@/portal/components/ui/JsonLd";

/**
 * ポータルのルートレイアウト。
 *
 * ■ なぜルートレイアウトが2つあるのか
 *   このリポジトリには既存サイト（`src/app/(senri)`）が同居しています。
 *   デザインシステムもフォントも `<html lang>` も別物なので、
 *   Next.js のルートグループによる「複数ルートレイアウト」で分離しています。
 *   2つのサイト間を移動すると全ページ再読み込みになりますが、
 *   相互リンクを張らない構成なので実害はありません。
 *
 * ■ 言語
 *   `<html lang>` と `dir` を言語ごとに切り替えます。
 *   アラビア語などの右横書きは `dir="rtl"` になり、
 *   レイアウトは論理プロパティ（ms-/me-/start/end）で自動的に反転します。
 */

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-portal-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-portal-body",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-portal-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#04050a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export function generateStaticParams() {
  return staticLocales().map((locale) => ({ locale }));
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);

  return {
    metadataBase: new URL(localeUrl(locale).replace(/\/[^/]*$/, "") || localeUrl(locale)),
    title: {
      default: `${brand.name} | ${dict.hero.title}`,
      template: `%s | ${brand.name}`,
    },
    description: dict.hero.subtitle,
    applicationName: brand.name,
    alternates: {
      canonical: localeUrl(locale),
      languages: alternateLanguages(),
    },
    icons: {
      icon: [{ url: withBasePath("/icon.png"), type: "image/png" }],
    },
    // ルートの `app/manifest.ts` は既存サイト（焼肉 千里）のものです。
    // 明示的に上書きしないと、ポータルのページでも店舗名の manifest が読み込まれます。
    manifest: withBasePath("/portal.webmanifest"),
    robots: { index: true, follow: true },
    formatDetection: { telephone: false },
  };
}

export default async function PortalLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();

  const config = getLocaleConfig(locale);
  const dict = getDictionary(locale);

  return (
    /*
     * `lang` / `dir` をこの要素に置いています。
     *
     * `<html>` はルートレイアウト（`src/app/layout.tsx`）が持っており、
     * 同居している焼肉 千里 / AI PORT はどちらも日本語のみのため `lang="ja"` で固定です。
     * この要素がポータルの全コンテンツを包むので、支援技術は中身をこの言語として読み、
     * `dir="rtl"` もレイアウト全体に効きます。
     * 検索エンジンへの言語指定は hreflang（head の link）で行っています。
     */
    <div
      lang={config.hreflang}
      dir={localeDir(locale)}
      className={`portal-root ${display.variable} ${body.variable} ${mono.variable}`}
    >
      {/* 背景レイヤー。ページ全体で1枚の連続した空間を作ります */}
      <div className="bg-deep" aria-hidden="true" />
      <div className="bg-aurora" aria-hidden="true" />
      <div className="bg-grid" aria-hidden="true" />
      <div className="bg-noise" aria-hidden="true" />

      <a
        href="#portal-main"
        className="glass-strong sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-full focus:px-4 focus:py-2 focus:text-sm"
      >
        {dict.common.skipToContent}
      </a>

      <PortalHeader locale={locale} dict={dict} />

      {/* ヘッダー直下の映像帯。固定ヘッダーのぶん、上に余白を取ります */}
      <VideoBand className="pt-16 sm:pt-18" priority />

      <main id="portal-main">{props.children}</main>

      {/* フッター直上の映像帯 */}
      <VideoBand />

      <PortalFooter locale={locale} dict={dict} />
      <CryptoChat locale={locale} dict={dict} />

      <JsonLd data={[websiteJsonLd(locale), organizationJsonLd()]} />

      {/*
        言語別のフィード。各言語版のRSSを購読できるようにします。
        サブディレクトリ配信でも解決できるよう、ベースパスを明示的に付与します。
      */}
      <link
        rel="alternate"
        type="application/rss+xml"
        title={`${brand.name} — ${dict.news.title}`}
        href={withBasePath(localePath(locale, "/rss.xml"))}
      />
    </div>
  );
}
