/**
 * メタデータ生成。
 *
 * hreflang / canonical / OGP を言語ごとに正しく出すため、
 * ページ側で個別に組み立てず必ずこの関数を使ってください。
 */
import type { Metadata } from "next";
import { brand, cardportAbsoluteUrl, cardportAsset } from "@/cardport/config/site";
import { getDictionary } from "@/cardport/i18n";
import { getLocaleDefinition, locales, type Locale } from "@/cardport/i18n/locales";

export type PageMetaInput = {
  title: string;
  description: string;
  /** 言語プレフィックスを含むパス（例: /ja/cards） */
  path: string;
  locale: Locale;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
  /**
   * hreflang に載せる言語。
   * 詳細ページは静的エクスポート時に主要言語だけを生成するため、
   * 生成しない言語を代替URLとして宣言しないようにします。
   */
  localeSet?: Locale[];
};

/** 言語ごとの代替URL（hreflang）。x-default は日本語を指します */
export function alternateLanguages(
  path: string,
  locale: Locale,
  localeSet: Locale[] = locales,
): Record<string, string> {
  const segments = path.split("/").filter(Boolean);
  const tail = segments.slice(1).join("/");
  const entries: Record<string, string> = {};
  for (const candidate of localeSet) {
    entries[getLocaleDefinition(candidate).hreflang] = cardportAbsoluteUrl(
      tail ? `/${candidate}/${tail}` : `/${candidate}`,
    );
  }
  entries["x-default"] = cardportAbsoluteUrl(tail ? `/ja/${tail}` : "/ja");
  // 自分自身の言語も含めるのが正しい実装です（自己参照 hreflang）
  void locale;
  return entries;
}

export function cardportMetadata({
  title,
  description,
  path,
  locale,
  image = "/images/cardport/ogp-default.png",
  type = "website",
  publishedTime,
  modifiedTime,
  noindex = false,
  localeSet,
}: PageMetaInput): Metadata {
  const url = cardportAbsoluteUrl(path);
  const definition = getLocaleDefinition(locale);
  const fullTitle = `${title} | ${brand.name}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: alternateLanguages(path, locale, localeSet),
    },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      type,
      url,
      siteName: brand.name,
      title: fullTitle,
      description,
      locale: definition.intl.replace("-", "_"),
      images: [{ url: cardportAsset(image), width: 1200, height: 630, alt: brand.name }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [cardportAsset(image)],
    },
  };
}

/** サイト全体の既定説明文 */
export function defaultDescription(locale: Locale): string {
  const dictionary = getDictionary(locale);
  return dictionary.hero.subtitle;
}
