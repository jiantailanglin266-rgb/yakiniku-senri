"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Send, Sparkles } from "lucide-react";
import { aiPortPath } from "@/data/ai-port/site";
import { buildFallbackAnswer } from "@/lib/ai-port/rag";
import { searchDocs, searchKindLabel } from "@/lib/ai-port/search";
import { GlassCard, Pill } from "@/components/ai-port/ui/Primitives";
import { cn } from "@/lib/utils";

/**
 * AIチャットの画面。
 *
 * ■ APIが無い環境でも動きます
 *   静的配信（GitHub Pages など）ではチャットAPIが存在しません。
 *   その場合は fetch が失敗するので、同じ検索インデックスを使って
 *   ブラウザ内で回答を組み立てます。「使えません」で終わらせない設計です。
 *
 * ■ ストリーミング
 *   サーバーは text/plain のチャンクを流します。
 *   届いた分から表示していくので、最初の文字が出るまでが短くなります。
 */

type Provider = { id: string; label: string; available: boolean };

type Message = { role: "user" | "assistant"; content: string };

const SAMPLE_QUESTIONS = [
  "無料で使える画像生成AIは？",
  "AIエージェントとチャットAIの違いは？",
  "社内文書に答えるAIはどう作りますか？",
  "生成AIに引用されるにはどうすればいいですか？",
];

export function ChatConsole({ providers }: { providers: Provider[] }) {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  // トピックハブなどから ?q= で飛んできたときは、その質問を最初から入力欄に入れておきます。
  // effect で後から入れるとカーソル位置が飛ぶため、初期値として一度だけ読みます。
  const [input, setInput] = useState(() => searchParams.get("q") ?? "");
  const [busy, setBusy] = useState(false);
  const [provider, setProvider] = useState(
    () => providers.find((entry) => entry.available)?.id ?? "",
  );
  const [notice, setNotice] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const available = providers.filter((entry) => entry.available);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || busy) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: question }];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    setNotice(null);

    try {
      const response = await fetch(`${aiPortPath("/api/chat")}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, provider }),
      });

      if (!response.ok || !response.body) throw new Error(String(response.status));

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";

      // 届いたチャンクから順に表示します
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setMessages([...nextMessages, { role: "assistant", content: answer }]);
      }
    } catch {
      // APIへ到達できない環境（静的配信など）。サイト内検索で回答します。
      const docs = searchDocs(question, 6).map((hit) => hit.doc);
      setMessages([
        ...nextMessages,
        { role: "assistant", content: buildFallbackAnswer(question, docs) },
      ]);
      setNotice(
        "対話AIへ接続できないため、サイト内検索の結果をお返ししています（この環境ではチャットAPIが動作していません）。",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <div className="min-w-0">
        <GlassCard className="flex min-h-[26rem] flex-col overflow-hidden rounded-2xl">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6" aria-live="polite" aria-atomic="false">
            {messages.length === 0 ? (
              <div className="grid h-full place-items-center py-12 text-center">
                <div>
                  <Sparkles aria-hidden="true" className="text-ai-cyan mx-auto size-7" />
                  <p className="text-ai-mist mt-4 text-[0.9rem]">
                    AI PORT に掲載している情報から回答します。
                  </p>
                  <p className="text-ai-dim mt-2 text-[0.78rem] leading-[1.9]">
                    サイト内に情報がない質問には、その旨をお答えします。
                  </p>

                  <ul className="mt-6 flex flex-wrap justify-center gap-2">
                    {SAMPLE_QUESTIONS.map((question) => (
                      <li key={question}>
                        <button type="button" onClick={() => send(question)}>
                          <Pill>{question}</Pill>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <ul className="grid gap-4">
                {messages.map((message, index) => (
                  <li
                    key={index}
                    className={cn(
                      "max-w-[88%] text-[0.86rem] leading-[1.95] whitespace-pre-wrap",
                      message.role === "user"
                        ? "text-ai-white ml-auto rounded-2xl rounded-br-sm bg-white/10 px-4 py-3"
                        : "text-ai-mist border-ai-cyan/20 rounded-2xl rounded-bl-sm border bg-white/[0.04] px-4 py-3",
                    )}
                  >
                    {message.content ||
                      (busy && index === messages.length - 1 ? (
                        <span className="text-ai-dim inline-flex items-center gap-2">
                          <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                          回答を作成しています…
                        </span>
                      ) : null)}
                  </li>
                ))}
              </ul>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              send(input);
            }}
            className="flex items-end gap-3 border-t border-white/10 p-4"
          >
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                // Enterで送信、Shift+Enterで改行
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="AIツールや使い方について質問してください"
              aria-label="質問を入力"
              className="text-ai-white placeholder:text-ai-dim max-h-32 min-h-[2.75rem] min-w-0 flex-1 resize-none bg-transparent py-2.5 text-[0.88rem] outline-none"
            />
            <button
              type="submit"
              disabled={busy || input.trim().length === 0}
              aria-label="送信"
              className="from-ai-cyan to-ai-blue grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br text-[#04060f] transition-transform duration-300 enabled:hover:scale-105 disabled:opacity-40"
            >
              {busy ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Send aria-hidden="true" className="size-4" />
              )}
            </button>
          </form>
        </GlassCard>

        {notice ? (
          <p
            role="status"
            className="text-ai-amber mt-4 rounded-lg border border-amber-400/25 bg-amber-400/[0.06] px-4 py-3 text-[0.76rem] leading-[1.9]"
          >
            {notice}
          </p>
        ) : null}

        <p className="text-ai-dim mt-4 text-[0.74rem] leading-[1.9]">
          生成AIの回答には誤りが含まれることがあります。重要な判断の前に、
          <Link
            href={aiPortPath("/tools")}
            className="text-ai-mist mx-1 underline underline-offset-4"
          >
            各ツールの公式サイト
          </Link>
          など一次情報を必ずご確認ください。料金の金額についてはお答えできません。
        </p>
      </div>

      <aside className="min-w-0">
        <GlassCard className="p-5 lg:sticky lg:top-24">
          <h2 className="font-ai-mono text-ai-dim text-[0.62rem] tracking-[0.24em] uppercase">
            モデル
          </h2>

          {available.length === 0 ? (
            <p className="text-ai-haze mt-4 text-[0.78rem] leading-[1.9]">
              APIキーが設定されていないため、サイト内検索で回答します。
              <br />
              <span className="text-ai-dim">
                （ANTHROPIC_API_KEY / OPENAI_API_KEY / GOOGLE_API_KEY / OPENROUTER_API_KEY
                のいずれかを設定すると、対話AIが有効になります）
              </span>
            </p>
          ) : (
            <ul className="mt-4 grid gap-2">
              {available.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => setProvider(entry.id)}
                    aria-pressed={provider === entry.id}
                    className="w-full"
                  >
                    <span
                      className={cn(
                        "block rounded-lg border px-4 py-2.5 text-left text-[0.82rem] transition-colors",
                        provider === entry.id
                          ? "border-ai-cyan/50 bg-ai-cyan/10 text-ai-cyan"
                          : "text-ai-mist hover:text-ai-white border-white/10 bg-white/[0.03]",
                      )}
                    >
                      {entry.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <h2 className="font-ai-mono text-ai-dim mt-7 text-[0.62rem] tracking-[0.24em] uppercase">
            回答の根拠
          </h2>
          <p className="text-ai-haze mt-3 text-[0.76rem] leading-[1.9]">
            サイト内の
            {[...new Set(Object.values(searchKindLabel))].join("・")}
            を検索し、その内容だけを根拠に回答します。
          </p>

          <button
            type="button"
            onClick={() => {
              setMessages([]);
              setNotice(null);
            }}
            className="text-ai-dim hover:text-ai-mist mt-6 text-[0.76rem] underline underline-offset-4 transition-colors"
          >
            会話をリセットする
          </button>
        </GlassCard>
      </aside>
    </div>
  );
}
