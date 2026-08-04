/**
 * AI PORT — 構造化データ（JSON-LD）。
 *
 * ============================================================
 * ⚠ 出力してよいのは「画面に表示している内容」だけです。
 *   - AggregateRating / Review は出しません（実データがないため）
 *   - award / 受賞歴 は出しません
 *   - offers の価格は出しません（金額を掲載していないため）
 *   これらを出すとGoogleのポリシー違反になり、リッチリザルトが
 *   剥奪されるだけでなく、優良誤認にもあたります。
 * ============================================================
 */

import type { Article } from "@/data/ai-port/articles";
import type { AiTool } from "@/data/ai-port/tools";
import type { Diagnosis } from "@/data/ai-port/diagnosis";
import type { Faq } from "@/data/ai-port/faq";
import type { Topic } from "@/data/ai-port/taxonomy";
import type { NewsItem } from "./news";
import {
  aiPortDescription,
  aiPortName,
  aiPortOrigin,
  aiPortSocials,
  aiPortUrl,
} from "@/data/ai-port/site";
import { pricingLabel } from "@/data/ai-port/tools";
import { withBasePath } from "@/lib/base-path";

const organizationId = `${aiPortUrl("/")}#organization`;
const websiteId = `${aiPortUrl("/")}#website`;

const logoUrl = `${aiPortOrigin}${withBasePath("/images/ai-port/logo.svg")}`;

export const aiPortOrganizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": organizationId,
  name: aiPortName,
  url: aiPortUrl("/"),
  description: aiPortDescription,
  logo: { "@type": "ImageObject", url: logoUrl },
  ...(aiPortSocials.length > 0 ? { sameAs: aiPortSocials.map((social) => social.href) } : {}),
};

export const aiPortWebsiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": websiteId,
  name: aiPortName,
  url: aiPortUrl("/"),
  description: aiPortDescription,
  inLanguage: "ja",
  publisher: { "@id": organizationId },
  // サイト内検索。Googleの検索結果にサイトリンク検索ボックスが出る可能性があります。
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${aiPortUrl("/search")}?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export function aiPortBreadcrumbJsonLd(
  trail: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: aiPortUrl(entry.path),
    })),
  };
}

export function aiPortFaqJsonLd(faqs: { q: string; a: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
}

export function siteFaqJsonLd(faqs: Faq[]): Record<string, unknown> {
  return aiPortFaqJsonLd(faqs.map((faq) => ({ q: faq.q, a: faq.a })));
}

/**
 * ツール詳細。
 * ⚠ `offers` は出しません（金額を掲載していないため、価格を持つ構造化データは出せません）。
 */
export function softwareApplicationJsonLd(tool: AiTool): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${aiPortUrl(`/tools/${tool.slug}`)}#software`,
    name: tool.name,
    applicationCategory: "BusinessApplication",
    description: tool.summary,
    url: tool.url,
    author: { "@type": "Organization", name: tool.maker },
    // 提供形態は文字列で正直に。金額は含めません。
    ...(tool.pricing === "free-tier" ? { isAccessibleForFree: true } : {}),
    additionalProperty: [
      { "@type": "PropertyValue", name: "料金体系", value: pricingLabel[tool.pricing] },
      ...(tool.japaneseUi !== null
        ? [{ "@type": "PropertyValue", name: "日本語UI", value: tool.japaneseUi ? "あり" : "なし" }]
        : []),
      ...(tool.api !== null
        ? [{ "@type": "PropertyValue", name: "API", value: tool.api ? "あり" : "なし" }]
        : []),
    ],
    isPartOf: { "@id": websiteId },
  };
}

/** 解説記事。著者は組織（編集部）です。実在しない個人名は出しません。 */
export function articleJsonLd(article: Article): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${aiPortUrl(`/guides/${article.slug}`)}#article`,
    headline: article.title,
    description: article.description,
    datePublished: article.published,
    dateModified: article.updated,
    inLanguage: "ja",
    author: { "@id": organizationId },
    publisher: { "@id": organizationId },
    mainEntityOfPage: { "@type": "WebPage", "@id": aiPortUrl(`/guides/${article.slug}`) },
    isPartOf: { "@id": websiteId },
  };
}

/** 手順を持つ記事セクションから HowTo を作ります。手順がなければ null。 */
export function howToJsonLd(article: Article): Record<string, unknown> | null {
  const section = article.sections.find((entry) => entry.steps && entry.steps.length > 0);
  if (!section?.steps) return null;

  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `${article.title} — ${section.heading}`,
    description: article.description,
    inLanguage: "ja",
    step: section.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };
}

/**
 * 外部ニュースの一覧。
 * ⚠ NewsArticle は「自社が書いた記事」に使うものです。
 *   外部記事の見出しを集めた一覧には ItemList を使い、
 *   各項目は配信元のURLを指します（自社コンテンツだと誤認させないため）。
 */
export function newsItemListJsonLd(
  items: NewsItem[],
  name: string,
  path: string,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url: aiPortUrl(path),
    numberOfItems: items.length,
    itemListElement: items.slice(0, 20).map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.title,
      url: item.link,
    })),
  };
}

/** ツール一覧・ランキングの ItemList。 */
export function toolItemListJsonLd(
  tools: AiTool[],
  name: string,
  path: string,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url: aiPortUrl(path),
    numberOfItems: tools.length,
    itemListElement: tools.slice(0, 30).map((tool, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: tool.name,
      url: aiPortUrl(`/tools/${tool.slug}`),
    })),
  };
}

/** 診断ページ。Quizではなく WebApplication として扱います（採点は自前ロジックのため）。 */
export function diagnosisJsonLd(diagnosis: Diagnosis): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${aiPortUrl(`/diagnosis/${diagnosis.slug}`)}#app`,
    name: diagnosis.title,
    description: diagnosis.description,
    url: aiPortUrl(`/diagnosis/${diagnosis.slug}`),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    isAccessibleForFree: true,
    inLanguage: "ja",
    publisher: { "@id": organizationId },
  };
}

/** トピックハブ。CollectionPage + そのトピックの想定質問（FAQ）。 */
export function topicJsonLd(topic: Topic): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${aiPortUrl(`/topics/${topic.slug}`)}#collection`,
    name: topic.name,
    description: topic.summary,
    url: aiPortUrl(`/topics/${topic.slug}`),
    inLanguage: "ja",
    isPartOf: { "@id": websiteId },
  };
}
