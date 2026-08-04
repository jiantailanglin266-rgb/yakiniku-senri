/**
 * ナビゲーション定義。
 * ラベルは辞書のキーで持ち、表示時に解決します（言語ごとに定義を分けないため）。
 */
import type { Dictionary } from "@/cardport/i18n";
import { routes } from "@/cardport/lib/routes";
import type { Locale } from "@/cardport/i18n/locales";

export type NavKey = keyof Dictionary["nav"];

export type NavItem = {
  key: NavKey;
  href: (locale: Locale) => string;
  /** メガメニューに出す下位リンク */
  children?: { key: NavKey; href: (locale: Locale) => string }[];
};

export const primaryNav: NavItem[] = [
  { key: "cards", href: routes.cards },
  { key: "rankings", href: routes.rankings },
  { key: "diagnosis", href: routes.diagnosisIndex },
  { key: "simulators", href: routes.simulatorIndex },
  { key: "campaigns", href: routes.campaigns },
  { key: "business", href: routes.business },
  { key: "news", href: routes.news },
];

export const secondaryNav: NavItem[] = [
  { key: "payments", href: routes.payments },
  { key: "web3", href: routes.web3 },
  { key: "tools", href: routes.tools },
  { key: "videos", href: routes.videos },
  { key: "guides", href: routes.guides },
  { key: "faq", href: routes.faq },
];

/** フッターの法務リンク。policies.ts のスラッグと一致させます */
export const footerPolicyLinks: { key: keyof Dictionary["footer"]; slug: string }[] = [
  { key: "operator", slug: "about" },
  { key: "editorial", slug: "editorial-policy" },
  { key: "rankingCriteria", slug: "ranking-criteria" },
  { key: "adPolicy", slug: "advertising-policy" },
  { key: "affiliatePolicy", slug: "affiliate-policy" },
  { key: "financialPolicy", slug: "financial-policy" },
  { key: "disclaimer", slug: "disclaimer" },
  { key: "privacy", slug: "privacy" },
  { key: "terms", slug: "terms" },
  { key: "cookie", slug: "cookie" },
  { key: "copyright", slug: "copyright" },
  { key: "correction", slug: "correction" },
  { key: "contact", slug: "contact" },
];
