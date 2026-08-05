/**
 * メタデータ生成。
 *
 * canonical / hreflang / OGP / X Card をロケール別に組み立てます。
 * hreflang は全ロケール分 + x-default を必ず出力します（1言語でも欠けると評価が割れます）。
 */
import type { Metadata } from "next";
import { brand } from "../config/site";
import { getLocale } from "../i18n/locales";
import { absoluteUrl, alternateUrls } from "./url";
import { withBasePath } from "@/lib/base-path";

/** OGP 画像（自前生成の静的画像。権利物は使いません） */
export const defaultOgImage = "/images/sports/ogp.png";

type MetaInput = {
  locale: string;
  /** ロケールを含まないパス（例: /matches/arsenal-vs-liverpool） */
  path: string;
  title: string;
  description: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  /** 検索結果に出したくないページ（診断の途中結果など） */
  noindex?: boolean;
};

export function sportsMetadata({
  locale,
  path,
  title,
  description,
  image = defaultOgImage,
  type = "website",
  publishedTime,
  modifiedTime,
  noindex = false,
}: MetaInput): Metadata {
  const url = absoluteUrl(locale, path);
  const localeInfo = getLocale(locale);
  const fullTitle = path === "/" ? `${brand.name} | ${title}` : `${title} | ${brand.name}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: alternateUrls(path),
    },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      type,
      url,
      siteName: brand.name,
      title: fullTitle,
      description,
      locale: localeInfo.intl.replace("-", "_"),
      images: [{ url: withBasePath(image), width: 1200, height: 630, alt: brand.name }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [withBasePath(image)],
    },
  };
}
