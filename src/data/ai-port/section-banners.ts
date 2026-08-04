/**
 * セクション見出しの画像（バナー）。
 *
 * ============================================================
 * ⚠ この画像には、見出しと説明文が焼き込まれています。
 *   そのため画像に差し替えると、次が失われます。
 *     - 14言語の翻訳（AGENTS.md §1）… 画像内の文字は翻訳されません
 *     - クローラー・生成AIからの可読性（LLMO / AEO / GEO）
 *     - 読み上げ環境での可読性
 *
 *   これを避けるため、画像を出すときも見出しと説明文は
 *   `sr-only` で残します（画面には出ませんが、機械には読めます）。
 *   画像側は装飾扱い（alt=""）なので、読み上げが二重になりません。
 *
 * ⚠ ここに載っていないキーは、従来どおりの文字の見出しになります。
 *   画像を置き忘れたまま公開しても、表示は壊れません。
 * ============================================================
 *
 * ■ 追加のしかた
 *   1. public/images/ai-port/sections/<キー>.jpg を置く
 *   2. 下の AVAILABLE に <キー> を足す
 *
 *   ファイルの有無を実行時に見に行くことはできません
 *   （このモジュールはクライアント側にも取り込まれるため、
 *     node:fs を使うとビルドが通りません）。
 *   かわりに `tests/ai-port-section-banners.test.ts` が、
 *   一覧のキーに実ファイルがあることを確かめます。
 *   キーだけ足して置き忘れると、テストが落ちます。
 */

/** 画像の置き場所（public/ からの相対パス） */
const DIR = "/images/ai-port/sections";

/**
 * 画像を用意できているセクション。
 *
 * 素材が届いていないため、いまは空です。
 * 置いたキーだけが画像に切り替わります。
 */
export const SECTION_BANNER_KEYS: readonly string[] = [
  // "news",
  // "ranking",
  // "compare",
  // "youtube",
];

const AVAILABLE = new Set(SECTION_BANNER_KEYS);

/** 画像のパス（用意できていなければ null）。 */
export function sectionBanner(key: string): string | null {
  return AVAILABLE.has(key) ? `${DIR}/${key}.jpg` : null;
}

/**
 * 画像の比率。ここと実ファイルがずれると、読み込み中に高さが動きます（CLS）。
 * 受け取った素材は 1706×924 でした。
 */
export const SECTION_BANNER_ASPECT = "aspect-[1706/924]";

/** 画像の実寸（next/image に渡します）。 */
export const SECTION_BANNER_SIZE = { width: 1706, height: 924 } as const;
