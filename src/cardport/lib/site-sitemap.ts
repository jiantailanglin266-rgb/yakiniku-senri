/**
 * ルートの `src/app/sitemap.ts` へ差し込む CARD PORT のエントリ。
 *
 * このリポジトリはサイトマップをドメイン単位の1ファイルにまとめる方針です
 * （分けるとどれかの登録漏れに気づきにくくなります）。
 * ニュース・動画サイトマップと RSS だけは仕様上ファイルを分ける必要があるため、
 * `src/app/card-port/*.xml/route.ts` で別に配信しています。
 */
import type { MetadataRoute } from "next";

import { cardportAbsoluteUrl } from "@/cardport/config/site";
import { getLocaleDefinition, locales } from "@/cardport/i18n/locales";
import { sitemapEntries } from "./feeds";
import { path, stripLocale } from "./routes";
import { pageImageSitemapEntries } from "@/media/lib/structured-data";

export function cardPortSitemap(): MetadataRoute.Sitemap {
  const result: MetadataRoute.Sitemap = [];

  for (const entry of sitemapEntries()) {
    const entryLocales = entry.locales ?? locales;
    const tail = stripLocale(entry.build("ja")).split("/").filter(Boolean);

    const languages: Record<string, string> = {};
    for (const locale of entryLocales) {
      languages[getLocaleDefinition(locale).hreflang] = cardportAbsoluteUrl(path(locale, ...tail));
    }
    languages["x-default"] = cardportAbsoluteUrl(path("ja", ...tail));

    for (const locale of entryLocales) {
      /*
        画像サイトマップ。ライセンス確認済みの画像だけを載せます。
        確認前の画像は resolvePageImages() が返さないため、ここへ漏れません。
      */
      const images = entry.pageKey ? pageImageSitemapEntries(entry.pageKey, locale) : [];

      result.push({
        url: cardportAbsoluteUrl(entry.build(locale)),
        lastModified: entry.lastModified ? new Date(entry.lastModified) : undefined,
        changeFrequency: entry.changeFrequency,
        priority: entry.priority,
        alternates: { languages },
        ...(images.length > 0 ? { images: images.map((image) => image.loc) } : {}),
      });
    }
  }

  return result;
}
