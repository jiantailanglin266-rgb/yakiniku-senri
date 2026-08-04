/**
 * ページ側の定型処理。
 *
 * すべてのページが「ロケールを解決し、辞書と翻訳関数を得る」ところから始まるため、
 * その分岐を1か所にまとめています。
 */
import { notFound } from "next/navigation";
import type { LocalizedText } from "../types";
import { getDictionary, findLocale, text } from "../i18n";
import type { Dictionary } from "../i18n/dictionary";
import type { Locale } from "../i18n/locales";

export type PageContext = {
  info: Locale;
  locale: string;
  dict: Dictionary;
  t: (value: LocalizedText | undefined) => string;
};

export async function resolveLocale(params: Promise<{ locale: string }>): Promise<PageContext> {
  const { locale } = await params;
  const info = findLocale(locale);
  if (!info) notFound();
  return {
    info,
    locale: info.code,
    dict: getDictionary(info.code),
    t: (value) => text(value, info.code),
  };
}
