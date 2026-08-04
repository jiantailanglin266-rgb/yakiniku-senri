/**
 * 取得済みの写真の一覧（自動生成）。
 *
 * ⚠ このファイルは手で編集しないでください。
 *   `node scripts/wikipedia-photos.mjs` が public/images/ai-port/photos/ を
 *   走査して書き出します。
 *
 * ⚠⚠ ここに並ぶ画像はライセンス確認をしていません。
 *   Wikipedia の記事代表画像をそのまま取得したもので、作者・ライセンス・出典を
 *   保持していません。詳細は docs/ai-port/wikipedia-photos.md を読んでください。
 */

/*
 * ■ 現在0件です
 *   取得を実行していないか、Wikipedia のホストへ到達できていません。
 *   0件のあいだ、各枠は外部素材を使わない装飾表現を表示します。
 */

const PHOTO_SLUGS = new Set<string>([]);

/** 掲載枠に対応する写真があるか。 */
export function hasPhoto(slug: string): boolean {
  return PHOTO_SLUGS.has(slug);
}

/** 写真のパス（存在しない場合は null）。 */
export function photoPath(slug: string): string | null {
  return PHOTO_SLUGS.has(slug) ? `/images/ai-port/photos/${slug}.jpg` : null;
}

/** 取得済みの点数（画面の注記に使います）。 */
export const photoCount = 0;
