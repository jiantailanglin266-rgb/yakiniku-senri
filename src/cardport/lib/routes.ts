/**
 * CARD PORT の URL 生成。
 *
 * 言語プレフィックスの付け忘れ・二重付与を防ぐため、
 * 内部リンクは必ずここを経由してください。
 */
import type { Locale } from "@/cardport/i18n/locales";

/** `/ja/cards/xxx` のような言語つきパスを作ります */
export function path(locale: Locale, ...segments: (string | number)[]): string {
  const tail = segments
    .filter((segment) => segment !== "" && segment !== undefined && segment !== null)
    .map((segment) => String(segment).replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
  return tail ? `/${locale}/${tail}` : `/${locale}`;
}

export const routes = {
  home: (locale: Locale) => path(locale),
  cards: (locale: Locale) => path(locale, "cards"),
  /**
   * カテゴリとカード詳細は同じ階層（`/ja/cards/<slug>`）です。
   * スラッグが衝突しないことは `tests/cardport-data.test.ts` で検証しています。
   */
  cardCategory: (locale: Locale, category: string) => path(locale, "cards", category),
  card: (locale: Locale, slug: string) => path(locale, "cards", slug),
  compare: (locale: Locale) => path(locale, "compare"),
  rankings: (locale: Locale) => path(locale, "rankings"),
  ranking: (locale: Locale, category: string) => path(locale, "rankings", category),
  diagnosisIndex: (locale: Locale) => path(locale, "diagnosis"),
  diagnosis: (locale: Locale, slug: string) => path(locale, "diagnosis", slug),
  simulatorIndex: (locale: Locale) => path(locale, "simulators"),
  simulator: (locale: Locale, slug: string) => path(locale, "simulators", slug),
  campaigns: (locale: Locale) => path(locale, "campaigns"),
  business: (locale: Locale) => path(locale, "business"),
  payments: (locale: Locale) => path(locale, "payments"),
  web3: (locale: Locale) => path(locale, "web3"),
  web3Service: (locale: Locale, slug: string) => path(locale, "web3", slug),
  tools: (locale: Locale) => path(locale, "tools"),
  news: (locale: Locale) => path(locale, "news"),
  newsArticle: (locale: Locale, slug: string) => path(locale, "news", slug),
  videos: (locale: Locale) => path(locale, "videos"),
  video: (locale: Locale, slug: string) => path(locale, "videos", slug),
  guides: (locale: Locale) => path(locale, "guides"),
  guide: (locale: Locale, slug: string) => path(locale, "guides", slug),
  features: (locale: Locale) => path(locale, "features"),
  feature: (locale: Locale, slug: string) => path(locale, "features", slug),
  faq: (locale: Locale) => path(locale, "faq"),
  policy: (locale: Locale, slug: string) => path(locale, "policies", slug),
  policies: (locale: Locale) => path(locale, "policies"),
  admin: (locale: Locale) => path(locale, "admin"),
  sitemap: (locale: Locale) => path(locale, "sitemap"),
} as const;

/**
 * いま表示しているパスを、別の言語のパスへ置き換えます。
 * 言語切り替えでトップに戻されないようにするためのものです。
 */
export function swapLocale(pathname: string, nextLocale: Locale, basePath = ""): string {
  const withoutBase =
    basePath && pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname;
  const segments = withoutBase.split("/").filter(Boolean);
  if (segments.length === 0) return `${basePath}/${nextLocale}`;
  segments[0] = nextLocale;
  return `${basePath}/${segments.join("/")}`;
}
