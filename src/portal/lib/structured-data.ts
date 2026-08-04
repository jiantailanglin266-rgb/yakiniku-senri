/**
 * 構造化データ。
 *
 * ⚠ ルール
 *   - 画面に表示している内容とだけ一致させます。
 *   - `Review` / `AggregateRating` は **出力しません**。
 *     利用者レビューの実データが無いためです（Googleのポリシー違反・優良誤認の回避）。
 *     取引所の点数は編集部評価であり、集約レビューではありません。
 *   - 著者・監修者は `src/portal/data/authors.ts` の内容と一致させます。
 */

import { getLocaleConfig, localePath, locales } from "@/portal/i18n/config";
import { brand, portalBase, socialEntries } from "./site";
import { absoluteUrl, localeUrl } from "./seo";
import { t } from "./format";
import type { FaqItem, LearnArticle, NewsArticle, Video } from "./types";

type Json = Record<string, unknown>;

export function organizationJsonLd(): Json {
  const sameAs = socialEntries.map(([, url]) => url);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${portalBase}/#organization`,
    name: brand.name,
    url: portalBase,
    ...(brand.logo ? { logo: absoluteUrl(brand.logo) } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(brand.contactEmail ? { email: brand.contactEmail } : {}),
  };
}

export function websiteJsonLd(locale: string): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${portalBase}/#website`,
    name: brand.name,
    url: localeUrl(locale),
    inLanguage: getLocaleConfig(locale).hreflang,
    publisher: { "@id": `${portalBase}/#organization` },
    // サイト内検索。検索結果ページのクエリ名と一致させます
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${localeUrl(locale, "/search")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(locale: string, trail: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: localeUrl(locale, item.path),
    })),
  };
}

export function faqJsonLd(locale: string, items: FaqItem[]): Json | null {
  if (items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: t(item.q, locale),
      acceptedAnswer: { "@type": "Answer", text: t(item.a, locale) },
    })),
  };
}

export function newsArticleJsonLd(locale: string, article: NewsArticle, authorName: string): Json {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: t(article.title, locale),
    description: t(article.summary, locale),
    inLanguage: getLocaleConfig(locale).hreflang,
    datePublished: article.publishedAt,
    ...(article.updatedAt ? { dateModified: article.updatedAt } : {}),
    author: { "@type": "Organization", name: authorName },
    publisher: { "@id": `${portalBase}/#organization` },
    mainEntityOfPage: localeUrl(locale, `/news/${article.slug}`),
    articleSection: article.category,
    ...(article.sourceUrl ? { isBasedOn: article.sourceUrl } : {}),
  };
}

export function learnArticleJsonLd(
  locale: string,
  article: LearnArticle,
  authorName: string,
): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: t(article.title, locale),
    description: t(article.conclusion, locale),
    inLanguage: getLocaleConfig(locale).hreflang,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: { "@type": "Organization", name: authorName },
    publisher: { "@id": `${portalBase}/#organization` },
    mainEntityOfPage: localeUrl(locale, `/learn/${article.slug}`),
    // 難易度は画面にも表示しているので出します
    educationalLevel: article.level,
  };
}

/**
 * 動画。
 * `youtubeId` が未設定の動画では VideoObject を出しません。
 * 実際に再生できない動画を構造化データで宣言することになるためです。
 */
export function videoJsonLd(locale: string, video: Video): Json | null {
  if (!video.youtubeId) return null;
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: t(video.title, locale),
    description: t(video.summary, locale),
    inLanguage: getLocaleConfig(locale).hreflang,
    uploadDate: video.publishedAt,
    duration: `PT${Math.floor(video.durationSec / 60)}M${video.durationSec % 60}S`,
    thumbnailUrl: `https://i.ytimg.com/vi/${video.youtubeId}/maxresdefault.jpg`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${video.youtubeId}`,
    publisher: { "@id": `${portalBase}/#organization` },
  };
}

/** 比較表・ランキング。表示している順序と一致させます。 */
export function itemListJsonLd(
  locale: string,
  name: string,
  items: { name: string; path: string }[],
): Json {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: localeUrl(locale, item.path),
    })),
  };
}

/**
 * ツール（SoftwareApplication）。
 * 評価は持たせません（実レビューが無いため）。
 */
export function softwareJsonLd(
  name: string,
  description: string,
  category: string,
  url: string,
): Json {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    applicationCategory: category,
    operatingSystem: "Web",
    url,
  };
}

/** HowTo（口座開設の流れなど） */
export function howToJsonLd(name: string, steps: string[]): Json | null {
  if (steps.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    step: steps.map((text, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      text,
    })),
  };
}

/** 全言語版の一覧（WebSite の alternate として使うことがあります） */
export function localeAlternates(path = ""): { hreflang: string; href: string }[] {
  return locales.map((locale) => ({
    hreflang: locale.hreflang,
    href: `${portalBase}${localePath(locale.code, path)}`,
  }));
}
