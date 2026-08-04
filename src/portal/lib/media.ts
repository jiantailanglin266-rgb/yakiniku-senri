/**
 * CRYPTO PORT と共通メディア基盤（`src/media`）のつなぎ。
 *
 * ■ ここに置くもの
 *   - 掲載枠のキー（`pageKey`）の組み立て
 *   - 画像が無いときの装飾テーマの割り当て
 *
 * ■ ここに置かないもの
 *   ライセンス判定・掲載可否の判定は `src/media` にしかありません。
 *   サイトごとに判定を持つと、片方だけ緩い基準になる余地が生まれます。
 */
import { pageKey } from "@/media/data/usages";
import type { FallbackTheme } from "@/media/components";
import type { NewsCategory } from "@/portal/lib/types";

/** 掲載枠キーのサイト識別子。`cryptoport:news:<slug>` の形になります */
export const MEDIA_SITE = "cryptoport";

export type PortalPageKind = "news" | "coin" | "learn" | "video" | "exchange" | "wallet" | "tool";

export function portalPageKey(kind: PortalPageKind, slug: string): string {
  return pageKey(MEDIA_SITE, kind, slug);
}

/**
 * カテゴリごとの装飾テーマ。
 * 一覧に同じ絵柄が並ばないよう、近い意味のカテゴリでも色味を分けています。
 */
const newsThemes: Record<NewsCategory, FallbackTheme> = {
  bitcoin: "crypto",
  ethereum: "business",
  altcoin: "point",
  defi: "payment",
  nft: "travel",
  gamefi: "video",
  web3: "mile",
  exchange: "card",
  regulation: "security",
  tax: "guide",
  security: "security",
  ai: "tool",
  metaverse: "travel",
  stablecoin: "payment",
};

export function newsFallbackTheme(category: NewsCategory): FallbackTheme {
  return newsThemes[category] ?? "news";
}

/**
 * 同じテーマの枠が並んだときに、装飾の角度を変えるための種。
 * ランダムではなく文字列から決めます。サーバーとクライアントで
 * 結果が変わると、ハイドレーション時に表示がずれるためです。
 */
export function mediaSeed(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 997;
  }
  return hash;
}
