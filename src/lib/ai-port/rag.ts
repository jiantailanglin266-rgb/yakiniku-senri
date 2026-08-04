/**
 * AI PORT — AIチャットの根拠づくり（RAG）。
 *
 * サイト内検索インデックス（lib/ai-port/search.ts）から関連文書を取り出し、
 * モデルへ渡す「根拠」と、鍵がないときの「検索だけで返す回答」を作ります。
 *
 * ■ 設計の芯
 *   モデルには「渡した根拠の中だけで答える」ことを守らせます。
 *   サイトに書いていないことを答えさせると、
 *   このサイトが保証していない情報を、このサイトの言葉として出すことになります。
 */

import { searchDocs, searchKindLabel, type SearchDoc } from "./search";
import { aiPortDisclaimer, aiPortName, aiPortUrl } from "@/data/ai-port/site";

export type Grounding = {
  docs: SearchDoc[];
  /** モデルへ渡す根拠テキスト */
  context: string;
};

const MAX_DOCS = 6;
const MAX_BODY_CHARS = 700;

export function buildGrounding(question: string): Grounding {
  const docs = searchDocs(question, MAX_DOCS).map((hit) => hit.doc);

  const context = docs
    .map((doc, index) => {
      const body =
        doc.body.length > MAX_BODY_CHARS ? `${doc.body.slice(0, MAX_BODY_CHARS)}…` : doc.body;
      return [
        `[${index + 1}] ${doc.title}（${searchKindLabel[doc.kind]}）`,
        `URL: ${aiPortUrl(doc.href.replace(/^\/ai-port/, "") || "/")}`,
        `内容: ${doc.description} ${body}`,
      ].join("\n");
    })
    .join("\n\n");

  return { docs, context };
}

/**
 * システムプロンプト。
 * 「根拠にないことは答えない」「価格は断定しない」を最優先の制約にしています。
 */
export function buildSystemPrompt(context: string): string {
  return [
    `あなたは AIポータルメディア「${aiPortName}」のサイト内アシスタントです。`,
    "利用者は日本語で質問します。日本語で、簡潔に、事実だけを答えてください。",
    "",
    "## 守ること",
    "1. 以下の【サイト内の根拠】に書かれている内容だけを使って答えます。",
    "2. 根拠にない質問には「サイト内に該当する情報が見つかりませんでした」と正直に伝え、",
    "   関連しそうなページがあれば案内してください。推測で補わないでください。",
    "3. AIツールの料金の金額は答えません。料金は変動するため、公式サイトの確認を促してください。",
    "4. 参照したページがあれば、回答の最後に「参考: <ページ名> <URL>」の形式で最大3件挙げてください。",
    "5. 回答は300文字程度まで。長くなる場合は要点を箇条書きにしてください。",
    "",
    `## 注意事項として必ず踏まえること`,
    aiPortDisclaimer,
    "",
    "## サイト内の根拠",
    context || "（該当する情報はありませんでした）",
  ].join("\n");
}

/**
 * APIキーが1つも設定されていないときの回答。
 *
 * 「使えません」で終わらせず、サイト内検索の結果をそのまま返します。
 * 外部サービスが落ちていても、利用者は目的のページに辿り着けます。
 */
export function buildFallbackAnswer(question: string, docs: SearchDoc[]): string {
  if (docs.length === 0) {
    return [
      "サイト内に該当する情報が見つかりませんでした。",
      "",
      "AIツールを探す場合は「AIツール一覧」、最新の動向は「AIニュース」からご覧いただけます。",
    ].join("\n");
  }

  const lines = docs
    .slice(0, 5)
    .map((doc) => `・${doc.title}（${searchKindLabel[doc.kind]}）— ${doc.description}`);

  return [
    `「${question}」に関連するページが ${docs.length} 件見つかりました。`,
    "",
    ...lines,
    "",
    "※ 現在、対話AIへの接続が設定されていないため、サイト内検索の結果をお返ししています。",
  ].join("\n");
}
