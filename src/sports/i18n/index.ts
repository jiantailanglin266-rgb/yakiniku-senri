import type { LocalizedText } from "../types";
import { en, ja, type Dictionary } from "./dictionary";
import { partials } from "./partials";
import { defaultLocaleCode, getLocale, type Locale } from "./locales";

export {
  locales,
  localeCodes,
  defaultLocaleCode,
  findLocale,
  getLocale,
  isLocaleCode,
} from "./locales";
export type { Locale } from "./locales";
export type { Dictionary } from "./dictionary";

const cache = new Map<string, Dictionary>();

/**
 * ロケールの辞書を返します。
 * ja は日本語、それ以外は「英語 + 部分翻訳」で構成します。
 * 未翻訳キーが英語で出るのは意図した挙動です（キー名や空欄を見せない）。
 */
export function getDictionary(code: string): Dictionary {
  const key = code.toLowerCase();
  const cached = cache.get(key);
  if (cached) return cached;

  const dictionary: Dictionary =
    key === "ja" ? ja : key === "en" ? en : { ...en, ...(partials[key] ?? {}) };

  cache.set(key, dictionary);
  return dictionary;
}

/**
 * 多言語テキストから表示言語を選びます。
 * その言語の訳が無ければ英語 → 日本語の順にフォールバックします。
 */
export function text(value: LocalizedText | undefined, locale: string): string {
  if (!value) return "";
  return value[locale.toLowerCase()] ?? value.en ?? value.ja ?? "";
}

/** ページ側で使う「ロケール + 辞書」のまとまり */
export type LocaleContext = {
  locale: Locale;
  code: string;
  dict: Dictionary;
  t: (value: LocalizedText | undefined) => string;
};

export function localeContext(code: string): LocaleContext {
  const locale = getLocale(code || defaultLocaleCode);
  const dict = getDictionary(locale.code);
  return {
    locale,
    code: locale.code,
    dict,
    t: (value) => text(value, locale.code),
  };
}
