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
 * ■ 元素材と、切り取った理由（AGENTS.md §3 事実性）
 *   素材は生成画像です。下部に「サイトの画面らしきUI」が描き込まれており、
 *   そこに**実在しない数字と固有名詞**が入っていました。
 *   実データの一覧のすぐ上に並ぶと、読者が実データと読み違えます。
 *   そのため、次の5枚は下部を切り落としています。
 *
 *     youtube   架空の再生数（「12万 回視聴」等）と架空の動画名を、
 *               OpenAI / Google DeepMind / Microsoft / NVIDIA に帰属させていた
 *     guides    架空の記事名と架空の更新日（2025-05-20 等）
 *     events    サイトが扱っていないイベント（AAAI / CVPR / ICML / SIGGRAPH）
 *     faq       実在しない質問（「法人での利用や導入相談は可能ですか？」等）
 *     topics    実在しない「詳しく見る」ボタン付きのカード
 *
 *   見出しと説明文は全て残っています。切ったのは作り物のUI部分だけです。
 *
 * ■ 追加のしかた
 *   1. public/images/ai-port/sections/<キー>.jpg を置く
 *   2. 下の SECTION_BANNERS に <キー> と実寸を足す
 *
 *   ファイルの有無を実行時に見に行くことはできません
 *   （このモジュールはクライアント側にも取り込まれるため、
 *     node:fs を使うとビルドが通りません）。
 *   かわりに `tests/ai-port-section-banners.test.ts` が、
 *   一覧のキーに実ファイルがあり、実寸が一致することを確かめます。
 *   キーだけ足して置き忘れると、テストが落ちます。
 */

/** 画像の置き場所（public/ からの相対パス） */
const DIR = "/images/ai-port/sections";

export type SectionBanner = {
  /** 画像のパス（public/ からの絶対パス） */
  src: string;
  /** 実寸。ここと実ファイルがずれると、読み込み中に高さが動きます（CLS） */
  width: number;
  height: number;
};

/**
 * 画像を用意できているセクション。
 *
 * 高さがまちまちなのは、上記のとおり作り物のUIを切り落としたためです。
 * 比率を揃えるために引き伸ばすと、焼き込まれた文字が歪みます。
 */
const SECTION_BANNERS: Record<string, SectionBanner> = {
  news: { src: `${DIR}/news.jpg`, width: 1693, height: 929 },
  ranking: { src: `${DIR}/ranking.jpg`, width: 1692, height: 929 },
  compare: { src: `${DIR}/compare.jpg`, width: 1693, height: 929 },
  diagnosis: { src: `${DIR}/diagnosis.jpg`, width: 1692, height: 930 },
  youtube: { src: `${DIR}/youtube.jpg`, width: 1693, height: 511 },
  events: { src: `${DIR}/events.jpg`, width: 1692, height: 632 },
  guides: { src: `${DIR}/guides.jpg`, width: 1692, height: 539 },
  topics: { src: `${DIR}/topics.jpg`, width: 1692, height: 530 },
  faq: { src: `${DIR}/faq.jpg`, width: 1692, height: 409 },
};

/** テスト用。実ファイルと実寸の突き合わせに使います。 */
export const SECTION_BANNER_KEYS = Object.keys(SECTION_BANNERS);

/** 見出し画像（用意できていなければ null）。 */
export function sectionBanner(key: string): SectionBanner | null {
  return SECTION_BANNERS[key] ?? null;
}
