/**
 * ロケール付きURLの組み立て。
 *
 * すべての内部リンクはこの関数を通します。
 * `next.config.ts` の basePath は next/link 側で自動付与されるため、ここでは付けません。
 * （/public 配下の画像は withBasePath を使ってください）
 */
import { basePath } from "@/lib/base-path";
import { brand } from "../config/site";
import { defaultLocaleCode, locales } from "../i18n/locales";

/** 例: href("ja", "/matches/arsenal-vs-liverpool") → "/ja/matches/arsenal-vs-liverpool" */
export function href(locale: string, path = "/"): string {
  const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `${brand.routePrefix}/${locale}${clean}`;
}

/**
 * 絶対URL（canonical・OGP・構造化データ用）。
 *
 * `href()` と違い、ここではベースパスを**自分で**付けます。
 * こちらは Next.js のルーティングを通らない、ただの文字列連結だからです。
 * （`href()` の側は next/link が basePath を付けるため、付けると二重になります）
 */
export function absoluteUrl(locale: string, path = "/"): string {
  return `${brand.origin}${basePath}${href(locale, path)}`;
}

/** 同一ページの全ロケール版URL（hreflang 用） */
export function alternateUrls(path = "/"): Record<string, string> {
  const map: Record<string, string> = {};
  for (const locale of locales) {
    map[locale.hreflang] = absoluteUrl(locale.code, path);
  }
  map["x-default"] = absoluteUrl(defaultLocaleCode, path);
  return map;
}

/** 現在のパスからロケール部分を差し替えます（言語切り替え用） */
export function swapLocale(pathname: string, nextLocale: string): string {
  const prefix = brand.routePrefix;
  const withoutPrefix =
    prefix && pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname;
  const segments = withoutPrefix.split("/").filter(Boolean);
  if (segments.length === 0) return href(nextLocale, "/");
  const isLocale = locales.some((locale) => locale.code === segments[0].toLowerCase());
  const rest = isLocale ? segments.slice(1) : segments;
  return href(nextLocale, rest.length ? `/${rest.join("/")}` : "/");
}
