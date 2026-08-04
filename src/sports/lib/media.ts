/**
 * 競技と、画像が無いときの装飾テーマの対応。
 *
 * ■ なぜ必要か
 *   `src/media` の装飾（FallbackVisual）はサイト共通の部品なので、
 *   競技ごとの色を持ちません。全カードが同じ配色になると、
 *   一覧で記事を見分けにくくなります。
 *   ここで競技ごとにテーマを割り当て、色の差を作ります。
 *
 * ■ 装飾なので、意味は持たせません
 *   色は見分けのためのもので、内容を示すものではありません。
 *   支援技術には読ませていません（FallbackVisual は aria-hidden）。
 */
import type { FallbackTheme } from "@/media/components";

const themeBySport: Record<string, FallbackTheme> = {
  // 芝・グラウンドの競技は緑系
  football: "guide",
  rugby: "guide",
  cricket: "guide",
  golf: "payment",
  baseball: "payment",

  // コート競技は水色系
  tennis: "point",
  badminton: "point",
  "table-tennis": "point",
  volleyball: "business",

  // 屋内・板張りの競技は青系
  basketball: "card",
  "american-football": "card",
  "ice-hockey": "tool",

  // モータースポーツ・格闘技は赤紫系
  f1: "crypto",
  motogp: "crypto",
  boxing: "crypto",
  mma: "crypto",
  "pro-wrestling": "crypto",

  // その他
  esports: "security",
  olympics: "travel",
  "horse-racing": "travel",
  "winter-sports": "mile",
};

export function sportTheme(sportId: string | undefined, fallback: FallbackTheme): FallbackTheme {
  if (!sportId) return fallback;
  return themeBySport[sportId] ?? fallback;
}

/**
 * スラッグから決まる種。
 *
 * 乱数を使うと再ビルドのたびに絵柄が変わり、
 * サーバー描画とクライアント描画でも食い違います。
 */
export function mediaSeed(slug: string): number {
  let hash = 0;
  for (let index = 0; index < slug.length; index += 1) {
    hash = (hash * 31 + slug.charCodeAt(index)) % 1000;
  }
  return hash;
}
