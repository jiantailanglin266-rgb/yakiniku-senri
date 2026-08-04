/**
 * チャットボットの意図判定。
 *
 * 日本語は単語が空白で区切られないため、形態素解析なしで正確に分割はできません。
 * ここでは「登録したキーワードが入力に含まれるか」で判定し、
 * **長いキーワードほど高く評価**します（「予約」より「予約したい」のほうが具体的なため）。
 *
 * 追加の依存を増やさず、確実に動くことを優先した設計です。
 */

import type { ChatIntent } from "@/data/chatbot";

/**
 * 表記ゆれを吸収します。
 * - 全角英数・半角カナを統一（NFKC）
 * - 大文字小文字を統一
 * - 空白と句読点・記号を除去
 */
export function normalize(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s　]+/g, "")
    .replace(/[、。，．！？!?,.・:：;；「」『』（）()[\]【】〜~ー-]/g, "");
}

/** 一致とみなす最低スコア。1文字だけの偶然の一致を弾きます。 */
const MIN_SCORE = 2;

export type MatchResult = {
  intent: ChatIntent;
  score: number;
};

/**
 * 入力にもっとも合う意図を返します。該当がなければ null。
 * 同点のときは、先に定義された意図を優先します（データ側の並び順が優先度になります）。
 */
export function matchIntent(input: string, intents: ChatIntent[]): MatchResult | null {
  const query = normalize(input);
  if (!query) return null;

  let best: MatchResult | null = null;

  for (const intent of intents) {
    let score = 0;
    for (const keyword of intent.keywords) {
      const normalized = normalize(keyword);
      if (normalized && query.includes(normalized)) {
        // 長いキーワードほど具体的なので高く評価します
        score += normalized.length;
      }
    }
    if (score > (best?.score ?? 0)) {
      best = { intent, score };
    }
  }

  return best && best.score >= MIN_SCORE ? best : null;
}
