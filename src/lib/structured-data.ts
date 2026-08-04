/**
 * 構造化データ（JSON-LD）。
 * ⚠ 画面上に表示していない情報・未確認の情報は含めないでください。
 */
import { faqs } from "@/data/content";
import { getPopulatedCategories } from "@/data/menu";
import { brandMovie, hasBrandMovie, media } from "@/data/media";
import { siteName, siteUrl, socialLinks, googleMapsUrl } from "@/data/site";
import { store } from "@/data/store";

const restaurantId = `${siteUrl}/#restaurant`;

const postalAddress = {
  "@type": "PostalAddress",
  streetAddress: store.addressParts.street,
  addressLocality: store.addressParts.locality,
  addressRegion: store.addressParts.region,
  postalCode: store.postalCode,
  addressCountry: store.addressParts.country,
};

const openingHoursSpecification = store.businessHours.map((hour) => ({
  "@type": "OpeningHoursSpecification",
  dayOfWeek: hour.days.map((d) => `https://schema.org/${d}`),
  opens: hour.opens,
  closes: hour.closes,
}));

/**
 * お品書きの構造化データ（Menu / MenuSection / MenuItem / Offer）。
 * 画面に表示している品目・価格をそのまま出力します。
 * 表示していないものは含めません（表示と構造化データの食い違いを防ぐため）。
 */
export const menuJsonLd = {
  "@context": "https://schema.org",
  "@type": "Menu",
  "@id": `${siteUrl}/menu#menu`,
  name: `${store.name} お品書き`,
  url: `${siteUrl}/menu`,
  inLanguage: "ja",
  hasMenuSection: getPopulatedCategories()
    // 「おすすめ」は他カテゴリーの再掲なので、重複を避けて除外します
    .filter((category) => category.id !== "recommended")
    .map((category) => ({
      "@type": "MenuSection",
      name: category.name,
      ...(category.description ? { description: category.description } : {}),
      hasMenuItem: category.items.map((item) => ({
        "@type": "MenuItem",
        name: item.name,
        ...(item.description ? { description: item.description } : {}),
        offers: {
          "@type": "Offer",
          price: item.price,
          priceCurrency: "JPY",
          availability: "https://schema.org/InStock",
          // 表示価格が税込か税別かを明示します
          valueAddedTaxIncluded: item.taxIncluded,
        },
      })),
    })),
};

/** LocalBusiness / Restaurant（Restaurant は LocalBusiness のサブタイプ） */
export const restaurantJsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "@id": restaurantId,
  name: store.name,
  alternateName: store.nameEn,
  description: `${store.founded}年創業、東京都世田谷区上馬の老舗焼肉店。秘伝のタレをもみ込んだ名物「もみシリーズ」が看板です。`,
  url: siteUrl,
  telephone: store.phone,
  address: postalAddress,
  image: media.hero.map((panel) => `${siteUrl}${panel.src}`),
  logo: `${siteUrl}${media.logo.src}`,
  servesCuisine: ["焼肉", "韓国料理"],
  foundingDate: String(store.founded),
  openingHoursSpecification,
  hasMap: googleMapsUrl,
  acceptsReservations: "https://schema.org/True",
  hasMenu: { "@id": `${siteUrl}/menu#menu` },
  currenciesAccepted: "JPY",
  sameAs: socialLinks.map((link) => link.href),
  // 以下は store.ts に値が入っているときだけ出力します（推測値は出しません）
  ...(store.geo
    ? {
        geo: {
          "@type": "GeoCoordinates",
          latitude: store.geo.latitude,
          longitude: store.geo.longitude,
        },
      }
    : {}),
  ...(store.priceRange ? { priceRange: store.priceRange } : {}),
  ...(store.seats > 0 ? { maximumAttendeeCapacity: store.seats } : {}),
  ...(store.paymentAccepted.length > 0
    ? { paymentAccepted: store.paymentAccepted.join(", ") }
    : {}),
};

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${siteUrl}/#organization`,
  name: store.name,
  alternateName: store.nameEn,
  url: siteUrl,
  telephone: store.phone,
  address: postalAddress,
  sameAs: socialLinks.map((link) => link.href),
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  name: siteName,
  url: siteUrl,
  inLanguage: "ja",
  publisher: { "@id": `${siteUrl}/#organization` },
};

export const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  // 音声アシスタント・AI検索が読み上げる範囲を明示します
  speakable: {
    "@type": "SpeakableSpecification",
    cssSelector: [".faq-question", ".faq-answer"],
  },
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export type Crumb = { label: string; href: string };

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      item: `${siteUrl}${crumb.href === "/" ? "" : crumb.href}`,
    })),
  };
}

export function articleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  datePublished: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    datePublished: input.datePublished,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${siteUrl}${input.path}` },
    author: { "@id": `${siteUrl}/#organization` },
    publisher: { "@id": `${siteUrl}/#organization` },
    inLanguage: "ja",
  };
}

/**
 * ブランドムービー（VideoObject）。
 * 動画が設定されていないときは null を返し、何も出力しません。
 */
export const videoJsonLd = hasBrandMovie
  ? {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "@id": `${siteUrl}/#brand-movie`,
      name: brandMovie.title,
      description: brandMovie.description,
      thumbnailUrl: [`${siteUrl}${brandMovie.poster.src}`],
      uploadDate: brandMovie.uploadDate,
      duration: `PT${brandMovie.durationSeconds}S`,
      ...(brandMovie.mp4 ? { contentUrl: `${siteUrl}${brandMovie.mp4}` } : {}),
      ...(brandMovie.youtubeId
        ? { embedUrl: `https://www.youtube-nocookie.com/embed/${brandMovie.youtubeId}` }
        : {}),
      publisher: { "@id": `${siteUrl}/#organization` },
      inLanguage: "ja",
    }
  : null;
