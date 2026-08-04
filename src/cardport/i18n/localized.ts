/**
 * コンテンツ（カード名・特典説明・記事本文など）の多言語表現。
 *
 * すべての言語を人手で用意するのは現実的ではないため、
 * `ja` を必須、`en` を推奨とし、未定義の言語は `en` → `ja` の順にフォールバックします。
 * 「翻訳が無いから空欄」よりも「原文のまま読める」ほうが利用者の損失が小さいためです。
 */

import { DEFAULT_LOCALE, type Locale } from "./locales";

// `ja` を必須にするため、任意側からは `ja` を除きます。
// （`Partial<Record<Locale, ...>>` と交差させると `ja` まで optional 扱いになります）
export type LocalizedText = { ja: string } & Partial<Record<Exclude<Locale, "ja">, string>>;

export type LocalizedList = { ja: string[] } & Partial<Record<Exclude<Locale, "ja">, string[]>>;

export function pick(text: LocalizedText | undefined, locale: Locale): string {
  if (!text) return "";
  return text[locale] ?? text.en ?? text.ja;
}

export function pickList(list: LocalizedList | undefined, locale: Locale): string[] {
  if (!list) return [];
  return list[locale] ?? list.en ?? list.ja;
}

/** 翻訳が原文（日本語）のままかどうか。UI で注記を出すために使います */
export function isFallback(text: LocalizedText | undefined, locale: Locale): boolean {
  if (!text || locale === DEFAULT_LOCALE) return false;
  return text[locale] === undefined;
}
