"use client";

/**
 * `<html lang>` と `<html dir>` を、表示中の言語に合わせて更新します。
 *
 * ルートレイアウトは全言語で共通なので、`[locale]` の値に応じた lang/dir を
 * サーバー側で書き出すことができません。ハイドレーション後にここで補正します。
 * 初期HTMLの lang は `ja` のままですが、hreflang と canonical は
 * サーバー側で正しく出力しているため、クロールへの影響はありません。
 */
import { useEffect } from "react";

import { getLocaleDefinition, type Locale } from "@/cardport/i18n/locales";

export function LocaleHtmlAttributes({ locale }: { locale: Locale }) {
  useEffect(() => {
    const definition = getLocaleDefinition(locale);
    document.documentElement.lang = definition.hreflang;
    document.documentElement.dir = definition.rtl ? "rtl" : "ltr";
  }, [locale]);

  return null;
}
