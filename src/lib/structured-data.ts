/**
 * 構造化データ（JSON-LD）。
 * ⚠ 画面上に表示していない情報・未確認の情報は含めないでください。
 */
import { faqs } from "@/data/content";
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

/** LocalBusiness / Restaurant（Restaurant は LocalBusiness のサブタイプ） */
export const restaurantJsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "@id": restaurantId,
  name: store.name,
  alternateName: store.nameEn,
  url: siteUrl,
  telephone: store.phone,
  address: postalAddress,
  servesCuisine: ["焼肉", "韓国料理"],
  foundingDate: String(store.founded),
  openingHoursSpecification,
  hasMap: googleMapsUrl,
  acceptsReservations: "https://schema.org/True",
  sameAs: socialLinks.map((link) => link.href),
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
