/**
 * クレジット表記の組み立て。
 *
 * ■ 原文を改変しない
 *   作者名・作品名・ライセンス正式名称・ファイル名は、どの言語でも翻訳しません。
 *   翻訳するのは「写真：」「提供：」などの補助文だけです。
 *
 * ■ Commons が推奨クレジットを提示している場合はそれを優先
 *   独自に組み立てた文より、権利者が指定した文が優先されます。
 */
import type { WikimediaAsset } from "./types";
import { licensePolicies } from "./licenses";

/** 補助文だけを言語別に持ちます（固有名詞は入れません） */
const labels: Record<
  string,
  {
    photo: string;
    author: string;
    source: string;
    license: string;
    modified: string;
    retrieved: string;
    via: string;
  }
> = {
  ja: {
    photo: "写真",
    author: "作者",
    source: "出典",
    license: "ライセンス",
    modified: "加工あり",
    retrieved: "取得日",
    via: "経由",
  },
  en: {
    photo: "Photo",
    author: "Author",
    source: "Source",
    license: "License",
    modified: "Modified",
    retrieved: "Retrieved",
    via: "via",
  },
};

export function creditLabels(locale: string) {
  return labels[locale] ?? labels.en;
}

/**
 * 1行のクレジット文を組み立てます。
 *
 * 例: 写真：Jane Doe / Wikimedia Commons / CC BY-SA 4.0
 * 作者名とライセンス名は原文のままです。
 */
export function attributionLine(asset: WikimediaAsset, locale: string): string {
  if (asset.attributionText) return asset.attributionText;

  const label = creditLabels(locale);
  const parts: string[] = [];

  if (asset.authorName) parts.push(asset.authorName);
  parts.push("Wikimedia Commons");
  parts.push(asset.licenseName);

  const line = `${label.photo}：${parts.join(" / ")}`;
  return asset.isModified ? `${line}（${label.modified}）` : line;
}

/**
 * クレジットの各要素とリンク先。
 * 表示側はこれをそのまま描画します（要素ごとにリンクを張るため）。
 */
export type CreditParts = {
  authorName?: string;
  authorUrl?: string;
  sourceName: string;
  sourceUrl: string;
  licenseName: string;
  licenseUrl?: string;
  isModified: boolean;
  modificationDescription?: string;
  publicDomainBasis?: string;
  retrievedAt: string;
};

export function creditParts(asset: WikimediaAsset): CreditParts {
  const policy = licensePolicies[asset.licenseCode];
  return {
    authorName: asset.authorName,
    authorUrl: asset.authorUrl,
    sourceName: asset.sourceName ?? "Wikimedia Commons",
    sourceUrl: asset.sourceUrl ?? asset.commonsPageUrl,
    licenseName: asset.licenseName,
    licenseUrl: asset.licenseUrl ?? policy?.url,
    isModified: asset.isModified,
    modificationDescription: asset.modificationDescription,
    publicDomainBasis: asset.publicDomainBasis,
    retrievedAt: asset.retrievedAt,
  };
}

/**
 * 代替テキスト。
 *
 * 装飾用途は空文字を返し、スクリーンリーダーに読ませません。
 * クレジットを alt に詰め込むことはしません（作者名は別要素で読み上げます）。
 */
export function altFor(asset: WikimediaAsset, locale: string, decorative = false): string {
  if (decorative) return "";
  return asset.altText[locale] ?? asset.altText.en ?? asset.altText.ja ?? asset.title;
}

export function captionFor(asset: WikimediaAsset, locale: string): string | undefined {
  if (!asset.caption) return undefined;
  return asset.caption[locale] ?? asset.caption.en ?? asset.caption.ja;
}
