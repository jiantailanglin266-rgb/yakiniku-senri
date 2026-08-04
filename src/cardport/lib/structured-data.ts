/**
 * 構造化データ。
 *
 * ■ 原則
 *   画面に表示している内容とだけ一致させます。
 *   実データのない AggregateRating / Review / Award は出力しません。
 *   （Google のポリシー違反であり、優良誤認にもあたるため）
 */
import { brand, cardportAbsoluteUrl, company } from "@/cardport/config/site";
import type { Card, Faq, Guide, NewsArticle, Video } from "@/cardport/data/types";
import { getIssuer } from "@/cardport/data/issuers";
import { getAuthor } from "@/cardport/data/authors";
import { pick, pickList } from "@/cardport/i18n/localized";
import type { Locale } from "@/cardport/i18n/locales";
import { routes } from "./routes";

type Json = Record<string, unknown>;

export function organizationJsonLd(locale: Locale): Json {
  const node: Json = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name,
    url: cardportAbsoluteUrl(routes.home(locale)),
    description: brand.tagline[locale === "ja" ? "ja" : "en"],
  };
  // 未設定の運営会社情報は出力しません（推測を構造化データに載せないため）
  if (company.address) node.address = company.address;
  if (company.email) node.email = company.email;
  return node;
}

export function websiteJsonLd(locale: Locale): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.name,
    url: cardportAbsoluteUrl(routes.home(locale)),
    inLanguage: locale,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${cardportAbsoluteUrl(routes.cards(locale))}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: cardportAbsoluteUrl(item.path),
    })),
  };
}

/**
 * カードの構造化データ。
 *
 * FinancialProduct のみを出力し、AggregateRating は付けません。
 * 当サイトのスコアは編集部の評価であり、利用者レビューの集計ではないためです。
 */
export function cardJsonLd(card: Card, locale: Locale): Json {
  const issuer = getIssuer(card.issuerId);
  return {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    name: pick(card.name, locale),
    description: pick(card.summary, locale),
    url: cardportAbsoluteUrl(routes.card(locale, card.slug)),
    category: card.rank,
    ...(issuer ? { provider: { "@type": "Organization", name: pick(issuer.name, locale) } } : {}),
    feesAndCommissionsSpecification: `${card.annualFee.toLocaleString("ja-JP")} JPY / year`,
    areaServed: card.availableRegions,
    offers: {
      "@type": "Offer",
      priceCurrency: "JPY",
      price: card.annualFee,
      priceValidUntil: card.verifiedOn,
      url: card.officialUrl,
    },
  };
}

export function itemListJsonLd(items: { name: string; path: string }[], name: string): Json {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: cardportAbsoluteUrl(item.path),
    })),
  };
}

export function newsArticleJsonLd(article: NewsArticle, locale: Locale): Json {
  const author = getAuthor(article.authorId);
  const supervisor = article.supervisorId ? getAuthor(article.supervisorId) : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: pick(article.title, locale),
    description: pick(article.summary, locale),
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    inLanguage: locale,
    mainEntityOfPage: cardportAbsoluteUrl(routes.newsArticle(locale, article.slug)),
    ...(author ? { author: { "@type": "Person", name: pick(author.name, locale) } } : {}),
    ...(supervisor
      ? { reviewedBy: { "@type": "Person", name: pick(supervisor.name, locale) } }
      : {}),
    publisher: { "@type": "Organization", name: brand.name },
  };
}

export function guideJsonLd(guide: Guide, locale: Locale): Json {
  const author = getAuthor(guide.authorId);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: pick(guide.title, locale),
    description: pick(guide.lead, locale),
    dateModified: guide.updatedOn,
    inLanguage: locale,
    mainEntityOfPage: cardportAbsoluteUrl(routes.guide(locale, guide.slug)),
    ...(author ? { author: { "@type": "Person", name: pick(author.name, locale) } } : {}),
    publisher: { "@type": "Organization", name: brand.name },
  };
}

/**
 * HowTo。手順を画面に表示しているガイドにのみ付けます。
 */
export function howToJsonLd(guide: Guide, locale: Locale): Json {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: pick(guide.title, locale),
    description: pick(guide.lead, locale),
    inLanguage: locale,
    step: guide.sections.map((section, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: pick(section.heading, locale),
      text: pickList(section.body, locale).join(" "),
    })),
  };
}

export function videoJsonLd(video: Video, locale: Locale): Json {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: pick(video.title, locale),
    description: pick(video.description, locale),
    uploadDate: video.publishedAt,
    duration: `PT${Math.floor(video.durationSeconds / 60)}M${video.durationSeconds % 60}S`,
    inLanguage: locale,
    url: cardportAbsoluteUrl(routes.video(locale, video.slug)),
    ...(video.youtubeId
      ? {
          embedUrl: `https://www.youtube.com/embed/${video.youtubeId}`,
          thumbnailUrl: [`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`],
        }
      : {}),
  };
}

export function faqJsonLd(list: Faq[], locale: Locale): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: list.map((faq) => ({
      "@type": "Question",
      name: pick(faq.question, locale),
      acceptedAnswer: { "@type": "Answer", text: pick(faq.answer, locale) },
    })),
  };
}

export function softwareApplicationJsonLd(
  name: string,
  description: string,
  path: string,
  locale: Locale,
): Json {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    inLanguage: locale,
    url: cardportAbsoluteUrl(path),
    offers: { "@type": "Offer", price: 0, priceCurrency: "JPY" },
  };
}
