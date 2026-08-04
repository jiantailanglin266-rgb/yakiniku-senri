/**
 * 辞書の解決。
 *
 * 言語別辞書 → 英語 → 日本語 の順にフォールバックします。
 * 翻訳が欠けていても画面が空欄にならないことを最優先しています。
 */
import { ja, type Dictionary } from "./dictionaries/ja";
import { en } from "./dictionaries/en";
import { partialDictionaries } from "./dictionaries/partials";
import { DEFAULT_LOCALE, type Locale } from "./locales";

const cache = new Map<Locale, Dictionary>();

function mergeDictionary(base: Dictionary, overrides: unknown): Dictionary {
  if (!overrides || typeof overrides !== "object") return base;
  const source = overrides as Record<string, Record<string, string>>;
  const merged = {} as Record<string, Record<string, string>>;
  for (const [section, values] of Object.entries(
    base as unknown as Record<string, Record<string, string>>,
  )) {
    merged[section] = { ...values, ...(source[section] ?? {}) };
  }
  return merged as unknown as Dictionary;
}

export function getDictionary(locale: Locale): Dictionary {
  const cached = cache.get(locale);
  if (cached) return cached;

  let dictionary: Dictionary;
  if (locale === DEFAULT_LOCALE) {
    dictionary = ja;
  } else if (locale === "en") {
    dictionary = en;
  } else {
    // 英語を土台にすることで、未訳キーが日本語のまま混ざるのを避けます
    dictionary = mergeDictionary(en, partialDictionaries[locale]);
  }

  cache.set(locale, dictionary);
  return dictionary;
}

export type { Dictionary };
export { ja, en };
