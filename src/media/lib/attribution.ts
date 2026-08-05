/**
 * クレジット文字列の組み立て。
 *
 * ■ 画像とクレジットは切り離しません
 *   ライセンス上、作者表示が必要な画像は、画像の近くにクレジットが必要です。
 *   記事末尾の一覧だけで済ませないため、コンポーネント側では
 *   画像とクレジットを同じ要素の中で描画します。
 *
 * ■ 原文を保持する項目
 *   作者名・作品名・ライセンス正式名称・ファイル名・Commons URL は
 *   どの言語でも翻訳・改変しません。
 */
import { getLicense } from "./license";
import type { WikimediaAsset } from "../types";

export type AttributionPart = {
  text: string;
  href?: string;
  /** 原文を保持すべき項目か（翻訳しない） */
  verbatim: boolean;
};

/**
 * 表示用のクレジット要素。
 * 例: 写真：作者名 / Wikimedia Commons / CC BY-SA 4.0
 */
export function buildAttributionParts(
  asset: WikimediaAsset,
  labels: { photo: string; modified: string },
): AttributionPart[] {
  const license = getLicense(asset.licenseCode);
  const parts: AttributionPart[] = [];

  parts.push({ text: labels.photo, verbatim: false });

  if (asset.authorName) {
    parts.push({
      text: asset.authorName,
      href: asset.authorUrl ?? undefined,
      verbatim: true,
    });
  }

  parts.push({ text: "Wikimedia Commons", href: asset.commonsPageUrl, verbatim: true });

  parts.push({
    text: license.name,
    href: (asset.licenseUrl ?? license.url) || undefined,
    verbatim: true,
  });

  if (asset.isModified) {
    parts.push({ text: labels.modified, verbatim: false });
  }

  return parts;
}

/** 1行のテキスト（構造化データ・alt の補助・出典一覧の書き出し用） */
export function buildAttributionText(
  asset: WikimediaAsset,
  labels: { photo: string; modified: string },
): string {
  return buildAttributionParts(asset, labels)
    .map((part) => part.text)
    .join(" / ");
}

/**
 * 継承（ShareAlike）が必要な画像を加工した場合、
 * 生成物にも同じライセンスが要ります。OGP生成時の判定に使います。
 */
export function requiresShareAlikeOnDerivative(asset: WikimediaAsset): boolean {
  return getLicense(asset.licenseCode).shareAlikeRequired && asset.isModified;
}

/** 画像の近くにクレジットを出す義務があるか */
export function requiresNearbyAttribution(asset: WikimediaAsset): boolean {
  return getLicense(asset.licenseCode).attributionRequired;
}
