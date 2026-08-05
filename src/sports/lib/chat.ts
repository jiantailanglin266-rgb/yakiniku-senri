/**
 * チャットボットの回答選択（RAG の検索部分）。
 *
 * 生成AIに自由回答させず、サイト内に根拠のある文書からのみ返します。
 * 該当が無いときは「答えられない」と明示し、関連ページを案内します。
 * リアルタイム情報を含む回答には、必ずデータ取得時刻を添えて表示します。
 */
import type { ChatDocument } from "../types";
import { chatDocuments } from "../data/content";
import { searchDocs } from "./search";

export type ChatAnswer = {
  /** 該当文書。無ければ undefined（回答を作らない） */
  document?: ChatDocument;
  /** 検索索引から拾った関連ページ */
  related: { label: string; href: string }[];
  /** リアルタイム情報を含むか */
  realtime: boolean;
};

function normalise(value: string): string {
  return value.toLowerCase().replace(/[・　\s.,!?。、？！]/g, "");
}

export function answerQuestion(question: string, locale: string): ChatAnswer {
  const q = normalise(question);

  let best: ChatDocument | undefined;
  let bestScore = 0;

  for (const doc of chatDocuments) {
    let score = 0;
    for (const keyword of doc.keywords) {
      // 長いキーワードほど具体的なので、一致した文字数をそのまま得点にします。
      // （「試合」だけで今日の日程を返してしまい、より具体的な質問を取りこぼさないため）
      if (q.includes(normalise(keyword))) score += normalise(keyword).length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = doc;
    }
  }

  // 検索索引からの関連ページ（回答が見つからないときの受け皿にもなります）
  const related = searchDocs(question, locale, 4).map((hit) => ({
    label: hit.title,
    href: hit.href,
  }));

  return {
    document: bestScore >= 2 ? best : undefined,
    related,
    realtime: Boolean(bestScore >= 2 && best?.realtime),
  };
}
