/**
 * サイト全体の設定・外部リンク。
 * 環境変数があればそちらを優先します（.env.example 参照）。
 *
 * ⚠ 外部リンクURLは公開前に必ず実際のアカウント・ページをご確認ください。
 */
import { store } from "./store";

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://yakinikusenri.com").replace(
  /\/$/,
  "",
);

export const siteName = process.env.NEXT_PUBLIC_SITE_NAME || store.name;

export const phoneNumber = process.env.NEXT_PUBLIC_PHONE_NUMBER || store.phone;

export const googleMapsUrl =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_URL ||
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${store.name} ${store.address}`,
  )}`;

/** 埋め込み地図（APIキー不要の埋め込みURL） */
export const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
  `${store.address} ${store.name}`,
)}&output=embed`;

export type SocialLink = {
  id: string;
  label: string;
  /** aria-label / title 用の説明 */
  description: string;
  href: string;
  icon: "instagram" | "facebook" | "twitter" | "utensils" | "map" | "music";
};

export const socialLinks: SocialLink[] = [
  {
    id: "instagram",
    label: "Instagram",
    description: `${store.name}のInstagram（外部サイト）`,
    href: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/senri1965/",
    icon: "instagram",
  },
  {
    id: "facebook",
    label: "Facebook",
    description: `${store.name}のFacebook（外部サイト）`,
    href: "https://www.facebook.com/senri1965",
    icon: "facebook",
  },
  {
    id: "twitter",
    label: "X（旧Twitter）",
    description: `${store.name}のX（外部サイト）`,
    href: "https://twitter.com/cholli1965",
    icon: "twitter",
  },
  {
    id: "tabelog",
    label: "食べログ",
    description: `${store.name}の食べログページ（外部サイト）`,
    href:
      process.env.NEXT_PUBLIC_TABELOG_URL || "https://tabelog.com/tokyo/A1317/A131709/13013081/",
    icon: "utensils",
  },
];

export const ownerSiteUrl = "https://sohegum.com/";

export const contactEmail = process.env.CONTACT_EMAIL || "";

export const gaId = process.env.NEXT_PUBLIC_GA_ID || "";
