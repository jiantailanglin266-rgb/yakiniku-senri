/**
 * 画像の構造化データとサイトマップ用の情報。
 *
 * ■ 画面に出していない画像は出力しません
 *   構造化データは「画面に表示している内容とだけ一致させる」のが本リポジトリの方針です。
 *   `resolvePageImages()` は掲載可能な画像しか返さないため、
 *   確認が済んでいない画像が構造化データやサイトマップへ漏れることはありません。
 *
 * ■ 作者・ライセンスも一緒に出します
 *   `ImageObject` に `creditText` / `creator` / `license` / `acquireLicensePage` を含めます。
 *   構造化データ側だけクレジットを省くと、機械可読な出典が失われます。
 */
import { getLicense } from "./license";
import { resolvePageImages } from "./resolve";
import { buildAttributionText } from "./attribution";
import { getMediaLabels } from "../i18n/labels";
import type { WikimediaAsset } from "../types";

export type ImageObjectJson = Record<string, unknown>;

export function imageObjectJsonLd(
  asset: WikimediaAsset,
  locale: string,
  altText: string,
  caption: string | null,
): ImageObjectJson {
  const license = getLicense(asset.licenseCode);
  const labels = getMediaLabels(locale);

  return {
    "@type": "ImageObject",
    contentUrl: asset.originalUrl,
    url: asset.commonsPageUrl,
    width: asset.width,
    height: asset.height,
    name: altText,
    ...(caption ? { caption } : {}),
    // 作者名・ライセンス名は原文のまま
    creditText: buildAttributionText(asset, labels),
    ...(asset.authorName
      ? {
          creator: {
            "@type": "Person",
            name: asset.authorName,
            ...(asset.authorUrl ? { url: asset.authorUrl } : {}),
          },
        }
      : {}),
    ...(asset.licenseUrl || license.url ? { license: asset.licenseUrl ?? license.url } : {}),
    acquireLicensePage: asset.commonsPageUrl,
    copyrightNotice: buildAttributionText(asset, labels),
  };
}

/**
 * ページで使っている画像の構造化データ。
 * 掲載可能な画像が無ければ `null` を返し、呼び出し側は何も出力しません。
 */
export function pageImagesJsonLd(pageKey: string, locale: string): ImageObjectJson[] | null {
  const images = resolvePageImages(pageKey, locale);
  if (images.length === 0) return null;

  return images.map((image) =>
    imageObjectJsonLd(image.asset, locale, image.altText, image.caption),
  );
}

/** 画像サイトマップに載せる情報。掲載可能な画像だけを返します */
export function pageImageSitemapEntries(
  pageKey: string,
  locale: string,
): { loc: string; title: string; caption: string | null }[] {
  return resolvePageImages(pageKey, locale).map((image) => ({
    loc: image.asset.originalUrl,
    title: image.altText,
    caption: image.caption,
  }));
}
