/**
 * ページと画像の結びつき。
 *
 * 同じ画像を複数ページで使っても、画像情報（`WikimediaAsset`）は1件だけです。
 * ここでは「どのページのどの枠で使うか」だけを持ちます。
 *
 * `pageKey` の書式: `<サイト>:<種別>:<スラッグ>`
 *   例: `cardport:guide:points-basics`
 *       `cardport:news:mile-award-chart-change`
 *       `cardport:category:travel`
 */
import type { AssetUsage, ImageSlot } from "../types";

export const assetUsages: AssetUsage[] = [];

/** 掲載先の指定から、優先度順の画像IDを返します */
export function getUsageAssetIds(pageKey: string, slot: ImageSlot): string[] {
  return assetUsages
    .filter((usage) => usage.pageKey === pageKey && usage.slot === slot)
    .sort((a, b) => a.priority - b.priority)
    .map((usage) => usage.assetId);
}

/** 1つの画像がどのページで使われているか（画像出典一覧ページ用） */
export function getPagesUsingAsset(assetId: string): AssetUsage[] {
  return assetUsages.filter((usage) => usage.assetId === assetId);
}

/** ページキーの組み立て。書式のばらつきを防ぐため必ずこれを使ってください */
export function pageKey(site: string, kind: string, slug: string): string {
  return `${site}:${kind}:${slug}`;
}
