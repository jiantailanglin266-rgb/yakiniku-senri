/**
 * AI PORT — メタデータ生成。
 *
 * ■ hreflang について
 *   このサイトは翻訳版のURLを持たず、1つのURLをブラウザ上で機械翻訳します。
 *   実体のないURL（/en/... など）を hreflang に書くと、
 *   存在しないページを申告することになり、かえって評価を落とします。
 *   そのため `x-default` と `ja` だけを正直に出し、
 *   対応言語は `<html lang>` と画面上の言語切り替えで示します。
 *   翻訳版を静的に持つようになったら、`languageAlternates` を実URLで埋めてください。
 */

import type { Metadata } from "next";
import { aiPortName, aiPortOrigin, aiPortUrl } from "@/data/ai-port/site";
import { withBasePath } from "@/lib/base-path";

const DEFAULT_OG = "/images/ai-port/ogp.svg";

type AiPortMetaInput = {
  title: string;
  description: string;
  /** /tools のような AI PORT 内のパス */
  path: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  keywords?: string[];
  /** 検索結果に出したくないページ（診断結果など）で true */
  noindex?: boolean;
};

export function aiPortMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG,
  type = "website",
  publishedTime,
  modifiedTime,
  keywords,
  noindex = false,
}: AiPortMetaInput): Metadata {
  const url = aiPortUrl(path);
  const fullTitle = path === "/" ? title : `${title} | ${aiPortName}`;
  const imageUrl = image.startsWith("http") ? image : `${aiPortOrigin}${withBasePath(image)}`;

  return {
    title,
    description,
    ...(keywords && keywords.length > 0 ? { keywords } : {}),
    alternates: {
      canonical: url,
      languages: {
        ja: url,
        "x-default": url,
      },
      types: {
        "application/rss+xml": aiPortUrl("/rss.xml"),
      },
    },
    robots: noindex
      ? { index: false, follow: true }
      : { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    openGraph: {
      type,
      url,
      siteName: aiPortName,
      title: fullTitle,
      description,
      locale: "ja_JP",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: aiPortName }],
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
