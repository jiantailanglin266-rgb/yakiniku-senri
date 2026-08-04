"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import {
  chatFallback,
  chatGreeting,
  chatIntents,
  suggestedIntents,
  type ChatLink,
} from "@/data/chatbot";
import { googleMapsUrl } from "@/data/site";
import { store } from "@/data/store";
import { matchIntent } from "@/lib/chat-match";
import { cn } from "@/lib/utils";

/**
 * FAQ応答型のチャットボット。
 *
 * ■ AIは使っていません
 *   営業時間・価格・定休日を誤って答えると来店後のトラブルに直結するため、
 *   確認済みの事実を決まった文面で返す方式にしています。
 *   回答は `src/data/chatbot.ts` にあります。
 *
 * ■ 外部通信をしません
 *   すべてクライアント内で完結します。APIキーも月額費用も不要で、
 *   静的ホスティング（GitHub Pages）でもそのまま動きます。
 *
 * ■ 多言語について
 *   表示文はDOM上のテキストなので、自動翻訳の対象になります。
 *   ただし**利用者の入力は翻訳されない**ため、日本語以外の入力は
 *   候補ボタンで拾う設計にしています（主要な意図には英語の語も登録済み）。
 */

type Message = {
  id: number;
  role: "bot" | "user";
  text: string;
  links?: ChatLink[];
};

/** データ側の `__MAP__` を実際の地図URLへ置き換えます */
function resolveHref(link: ChatLink): string {
  return link.href === "__MAP__" ? googleMapsUrl : link.href;
}

/**
 * 本文中の電話番号を翻訳対象から外します。
 * 機械翻訳が数字を書き換えると、予約に直結する情報が壊れるためです。
 */
function AnswerText({ text }: { text: string }) {
  const parts = text.split(store.phone);
  return (
    <>
      {parts.map((part, index) => (
        <span key={index}>
          {part}
          {index < parts.length - 1 ? (
            <a
              href={store.phoneHref}
              translate="no"
              className="text-gold-light hover:text-gold underline underline-offset-4"
            >
              {store.phone}
            </a>
          ) : null}
        </span>
      ))}
    </>
  );
}

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([{ id: 0, role: "bot", text: chatGreeting }]);

  const nextId = useRef(1);
  const panelRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  // Escape で閉じ、閉じたら起動ボタンへフォーカスを戻します
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        launcherRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // 開いたら入力欄へフォーカス
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // 新しい発言までスクロール
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages]);

  const answer = (question: string) => {
    const trimmed = question.trim();
    if (!trimmed) return;

    const match = matchIntent(trimmed, chatIntents);
    const reply = match
      ? { text: match.intent.answer, links: match.intent.links }
      : { text: chatFallback.answer, links: chatFallback.links };

    setMessages((current) => [
      ...current,
      { id: nextId.current++, role: "user", text: trimmed },
      { id: nextId.current++, role: "bot", text: reply.text, links: reply.links },
    ]);
    setInput("");
  };

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="chatbot-panel"
        aria-label={open ? "チャットを閉じる" : "チャットで質問する"}
        className={cn(
          "no-print border-gold/40 bg-black-soft/95 text-gold hover:border-gold hover:text-gold-light",
          "fixed right-4 bottom-20 z-[86] grid size-14 place-items-center rounded-full border shadow-2xl",
          "backdrop-blur-md transition-colors duration-500 md:right-6 md:bottom-6",
        )}
      >
        {open ? (
          <X aria-hidden="true" className="size-5" />
        ) : (
          <MessageCircle aria-hidden="true" className="size-5" />
        )}
      </button>

      {open ? (
        <div
          ref={panelRef}
          id="chatbot-panel"
          role="dialog"
          aria-modal="false"
          aria-label="よくあるご質問チャット"
          className={cn(
            "no-print border-gold/30 bg-black-soft/97 fixed z-[94] flex flex-col rounded-lg border shadow-2xl backdrop-blur-md",
            "inset-x-3 bottom-36 max-h-[min(30rem,60vh)]",
            "md:inset-x-auto md:right-6 md:bottom-24 md:max-h-[32rem] md:w-[22rem]",
          )}
        >
          <div className="border-ivory/10 flex items-center justify-between border-b px-4 py-3">
            <p className="font-display text-gold text-[0.68rem] tracking-[0.3em] uppercase">
              Q &amp; A
            </p>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                launcherRef.current?.focus();
              }}
              aria-label="チャットを閉じる"
              className="text-gray hover:text-gold -mr-2 grid size-9 place-items-center transition-colors"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>

          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            aria-label="やりとり"
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3.5 py-2.5 text-[0.82rem] leading-[1.9] whitespace-pre-line",
                    message.role === "user"
                      ? "bg-gold/90 text-black"
                      : "text-ivory/90 border-ivory/10 border bg-white/6",
                  )}
                >
                  <AnswerText text={message.text} />

                  {message.links?.length ? (
                    <span className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5">
                      {message.links.map((link) => (
                        <a
                          key={link.label + link.href}
                          href={resolveHref(link)}
                          {...(link.external && link.href !== store.phoneHref
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                          className="text-gold hover:text-gold-light text-[0.76rem] underline underline-offset-4 transition-colors"
                        >
                          {link.label}
                        </a>
                      ))}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="border-ivory/10 border-t px-4 py-3">
            <div className="flex flex-wrap gap-1.5">
              {suggestedIntents.map((intent) => (
                <button
                  key={intent.id}
                  type="button"
                  onClick={() => answer(intent.label)}
                  className="border-gold/25 text-ivory/80 hover:border-gold hover:text-gold rounded-full border px-3 py-1.5 text-[0.72rem] transition-colors duration-300"
                >
                  {intent.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                answer(input);
              }}
              className="mt-3 flex gap-2"
            >
              <label htmlFor="chatbot-input" className="sr-only">
                ご質問を入力
              </label>
              <input
                ref={inputRef}
                id="chatbot-input"
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="ご質問をどうぞ"
                autoComplete="off"
                className="border-ivory/15 text-ivory placeholder:text-gray-dark focus:border-gold min-w-0 flex-1 rounded border bg-black/40 px-3 py-2 text-[0.82rem] outline-none"
              />
              <button
                type="submit"
                aria-label="送信"
                className="border-gold/30 text-gold hover:border-gold hover:text-gold-light grid size-10 shrink-0 place-items-center rounded border transition-colors"
              >
                <Send aria-hidden="true" className="size-4" />
              </button>
            </form>

            <p className="text-gray-dark mt-2.5 text-[0.64rem] leading-[1.7]">
              よくあるご質問へ自動でお答えします。詳しいご相談はお電話にて承ります。
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
