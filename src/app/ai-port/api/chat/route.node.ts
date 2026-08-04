/**
 * AI PORT — AIチャットのAPI。
 *
 * ■ ファイル名が `route.node.ts` である理由
 *   このリポジトリは GitHub Pages への静的エクスポート（`output: "export"`）でも
 *   ビルドできる必要があります。静的エクスポートでは POST の Route Handler を
 *   持てないため、`next.config.ts` の `pageExtensions` を使って
 *   「サーバー配信のときだけ」このファイルをルートとして認識させています。
 *   静的配信のときは存在しないことになり、チャットUIはサイト内検索へ自動的に切り替わります。
 *
 * ■ 応答はストリーミング
 *   最初の文字が出るまでの待ち時間を短くするため、
 *   text/plain のチャンクをそのまま流します（SSEの入れ子は不要なので使いません）。
 */

import { resolveProvider, streamCompletion, type ChatMessage } from "@/lib/ai-port/chat-providers";
import { buildFallbackAnswer, buildGrounding, buildSystemPrompt } from "@/lib/ai-port/rag";

/** 会話履歴を持たない設計なので、キャッシュはしません。 */
export const dynamic = "force-dynamic";

const MAX_MESSAGES = 12;
const MAX_CHARS = 2000;

type ChatRequest = {
  messages?: { role?: string; content?: string }[];
  provider?: string;
};

function sanitize(input: ChatRequest): ChatMessage[] {
  const messages = Array.isArray(input.messages) ? input.messages : [];

  return messages
    .filter(
      (message): message is { role: "user" | "assistant"; content: string } =>
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0,
    )
    .slice(-MAX_MESSAGES)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, MAX_CHARS),
    }));
}

function textStream(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

export async function POST(request: Request): Promise<Response> {
  let payload: ChatRequest;
  try {
    payload = (await request.json()) as ChatRequest;
  } catch {
    return Response.json({ error: "リクエストの形式が正しくありません。" }, { status: 400 });
  }

  const messages = sanitize(payload);
  const question = [...messages].reverse().find((message) => message.role === "user")?.content;

  if (!question) {
    return Response.json({ error: "質問が空です。" }, { status: 400 });
  }

  // サイト内の根拠を先に集めます。モデルが使えなくても、これだけで回答できます。
  const { docs, context } = buildGrounding(question);
  const provider = resolveProvider(payload.provider);

  const headers = {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Accel-Buffering": "no",
    "X-AI-Port-Provider": provider ?? "site-search",
  };

  if (!provider) {
    // APIキーが1つも設定されていない場合。検索結果をそのまま返します。
    return new Response(textStream(buildFallbackAnswer(question, docs)), { headers });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of streamCompletion({
          provider,
          system: buildSystemPrompt(context),
          messages,
          signal: request.signal,
        })) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (error) {
        // 途中で落ちても、無言で終わらせません。
        // 検索結果に切り替えて、利用者が目的のページへ行けるようにします。
        const reason = error instanceof Error ? error.message : "不明なエラー";
        controller.enqueue(
          encoder.encode(
            `\n\n（AIへの接続でエラーが発生しました：${reason}）\n\n` +
              buildFallbackAnswer(question, docs),
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers });
}
