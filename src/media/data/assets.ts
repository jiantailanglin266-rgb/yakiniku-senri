/**
 * 取得済みの Wikimedia Commons 画像。
 *
 * ■ このファイルは手で書きません
 *   `assets.generated.json` を `scripts/wikimedia-sync.mjs` が生成し、
 *   ここはそれを読み込んで型をつけるだけです。
 *   ファイル名・作者・ライセンスを手で推測して書き足すことは、
 *   `docs/media/image-guidelines.md` で明確に禁止しています。
 *
 * ■ 取り込み時にも検証します
 *   生成物が壊れている可能性があるため、`load-generated.ts` が
 *   必須項目の欠けた行を落とします。欠損を推測で埋めることはしません。
 *
 * ■ 生成物が空のとき
 *   各ページはフォールバックの装飾表現を表示します（レイアウトは崩れません）。
 *   Wikimedia へ到達できない環境では取得できないため、その状態が既定です。
 */
import generated from "./assets.generated.json";
import { mapValid, toAsset, toLocalization } from "./load-generated";
import type { AssetLocalization, AssetRejection, WikimediaAsset } from "../types";

export const wikimediaAssets: WikimediaAsset[] = mapValid(generated.assets, toAsset);

export const assetLocalizations: AssetLocalization[] = mapValid(
  generated.localizations,
  toLocalization,
);

/** 生成日時。管理画面で「いつ取得したものか」を出すために使います */
export const assetsGeneratedAt: string | null = generated.generatedAt;

/** 一度却下した画像。同じものを再び候補に挙げないために残します */
export const assetRejections: AssetRejection[] = [];

const assetById = new Map(wikimediaAssets.map((asset) => [asset.id, asset]));
const assetByFileName = new Map(wikimediaAssets.map((asset) => [asset.fileName, asset]));

export function getAsset(id: string): WikimediaAsset | undefined {
  return assetById.get(id);
}

export function getAssetByFileName(fileName: string): WikimediaAsset | undefined {
  return assetByFileName.get(fileName);
}

export function getLocalization(assetId: string, locale: string): AssetLocalization | undefined {
  return (
    assetLocalizations.find((entry) => entry.assetId === assetId && entry.locale === locale) ??
    assetLocalizations.find((entry) => entry.assetId === assetId && entry.locale === "en") ??
    assetLocalizations.find((entry) => entry.assetId === assetId && entry.locale === "ja")
  );
}
