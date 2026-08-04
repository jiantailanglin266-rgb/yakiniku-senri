/**
 * ポータルのメタデータ生成。
 *
 * ■ 必ず出すもの
 *   - canonical（言語別の自分自身）
 *   - hreflang（全対応言語 + x-default）
 *   - OGP / X Card（言語別）
 *
 * ■ x-default
 *   言語が判定できない訪問者向けの既定を英語にしています。
 *   日本語話者以外が最初に着地する可能性を考えると、英語のほうが読める人が多いためです。
 */

import type { Metadata } from "next";
import { getLocaleConfig, localePath, locales } from "@/portal/i18n/config";
import { brand, portalBase } from "./site";

export function absoluteUrl(path: string): string {
  return `${portalBase}${path}`;
}

/** 言語別の絶対URL */
export function localeUrl(locale: string, path = ""): string {
  return absoluteUrl(localePath(locale, path));
}

/** hreflang の一覧（x-default 付き） */
export function alternateLanguages(path = ""): Record<string, string> {
  const map: Record<string, string> = {};
  for (const locale of locales) {
    map[locale.hreflang] = localeUrl(locale.code, path);
  }
  map["x-default"] = localeUrl("en", path);
  return map;
}

type PortalMetaInput = {
  locale: string;
  /** 言語プレフィックスを除いたパス（例: /coins/bitcoin） */
  path?: string;
  title: string;
  description: string;
  /** OGP画像。未指定なら共通のものを使います */
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  /** 検索結果に出したくないページ（診断結果の共有URLなど） */
  noindex?: boolean;
};

export function portalMetadata({
  locale,
  path = "",
  title,
  description,
  image = "/images/portal/ogp-default.svg",
  type = "website",
  publishedTime,
  modifiedTime,
  noindex,
}: PortalMetaInput): Metadata {
  const config = getLocaleConfig(locale);
  const url = localeUrl(locale, path);
  const imageUrl = image.startsWith("http") ? image : absoluteUrl(image);

  /*
   * タイトルは `absolute` で組み立てます。
   *
   * `title.template` は「同じルートセグメントの page には効かない」ため、
   * ポータルのトップページ（`[locale]/layout.tsx` と `[locale]/page.tsx` が同じ階層）
   * だけがルートレイアウト側のテンプレート（焼肉 千里）を拾ってしまいます。
   * 自前で組み立ててしまえば、どの階層に置いても表示が変わりません。
   */
  const fullTitle = title === brand.name ? title : `${title} | ${brand.name}`;

  return {
    title: { absolute: fullTitle },
    description,
    alternates: {
      canonical: url,
      languages: alternateLanguages(path),
    },
    robots: noindex
      ? { index: false, follow: true }
      : { index: true, follow: true, "max-image-preview": "large" },
    openGraph: {
      type,
      url,
      siteName: brand.name,
      title: fullTitle,
      description,
      locale: config.ogLocale,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [imageUrl],
    },
  };
}
