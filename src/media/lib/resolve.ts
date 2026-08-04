/**
 * 掲載枠に対して、実際に表示する画像を解決します。
 *
 * ここが唯一の入口です。ページ側は `resolveImage()` の結果だけを見て、
 * 画像があればWikimedia画像、無ければフォールバック装飾を出します。
 */
import { getAsset, getLocalization } from "../data/assets";
import { getUsageAssetIds } from "../data/usages";
import { isPublishable } from "./eligibility";
import type { ImageSlot, WikimediaAsset } from "../types";

export type ResolvedImage = {
  asset: WikimediaAsset;
  altText: string;
  caption: string | null;
  description: string | null;
};

/**
 * 掲載枠に表示できる画像を返します。
 *
 * 次の場合はすべて null（＝フォールバック表示）になります。
 *   - 画像が割り当てられていない
 *   - 承認されていない（pending / needs_review / license_unknown / rights_risk / rejected）
 *   - 使用停止中
 *   - 作者表示が必要なのに作者情報が無い
 *   - その言語の代替テキストが用意されていない
 */
export function resolveImage(
  pageKey: string,
  slot: ImageSlot,
  locale: string,
): ResolvedImage | null {
  for (const assetId of getUsageAssetIds(pageKey, slot)) {
    const asset = getAsset(assetId);
    if (!asset || !isPublishable(asset)) continue;

    const localization = getLocalization(assetId, locale);
    // alt が無い画像は表示しません。読み上げ環境で意味が伝わらないためです
    if (!localization) continue;

    return {
      asset,
      altText: localization.altText,
      caption: localization.caption,
      description: localization.description,
    };
  }
  return null;
}

/** 記事末尾・出典一覧に出すため、1ページで使ったすべての画像を集めます */
export function resolvePageImages(pageKey: string, locale: string): ResolvedImage[] {
  const slots: ImageSlot[] = [
    "hero",
    "card",
    "thumbnail",
    "inline",
    "gallery",
    "comparison",
    "related",
    "background",
    "ogp",
    "avatar",
  ];
  const seen = new Set<string>();
  const results: ResolvedImage[] = [];

  for (const slot of slots) {
    const resolved = resolveImage(pageKey, slot, locale);
    if (resolved && !seen.has(resolved.asset.id)) {
      seen.add(resolved.asset.id);
      results.push(resolved);
    }
  }
  return results;
}
