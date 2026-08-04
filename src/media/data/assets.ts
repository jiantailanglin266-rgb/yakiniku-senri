/**
 * 取得済みの Wikimedia Commons 画像。
 *
 * ■ このファイルは手で書きません
 *   `npm run media:sync` が Wikimedia のAPIから取得して生成します。
 *   ファイル名・作者・ライセンスを手で推測して書き足すことは、
 *   `docs/media/image-guidelines.md` で明確に禁止しています。
 *
 * ■ 現在の状態：0件
 *   実装時点の実行環境では Wikimedia のホストが組織のegressポリシーで遮断されており、
 *   1件も取得・検証できませんでした（commons.wikimedia.org / www.wikidata.org /
 *   upload.wikimedia.org / en.wikipedia.org / api.wikimedia.org / query.wikidata.org）。
 *   取得できていない画像を「それらしいモックデータ」で埋めると、
 *   検証済みの画像と区別がつかなくなるため、あえて空のままにしています。
 *
 *   ネットワークの通る環境で同期スクリプトを実行すると、ここが埋まります。
 *   それまでの間、各ページはフォールバックの装飾表現を表示します（レイアウトは崩れません）。
 */
import type { AssetLocalization, AssetRejection, WikimediaAsset } from "../types";

export const wikimediaAssets: WikimediaAsset[] = [];

export const assetLocalizations: AssetLocalization[] = [];

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
