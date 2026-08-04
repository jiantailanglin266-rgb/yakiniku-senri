"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { getDictionary, text } from "../../i18n";
import { answerQuestion } from "../../lib/chat";
import { href } from "../../lib/url";
import { formatDateTime } from "../../lib/format";
import { chatDocuments } from "../../data/content";
import { demoNowIso } from "../../data/clock";

type Message = {
  id: number;
  role: "user" | "bot";
  text: string;
  links: { label: string; href: string }[];
  /** リアルタイム情報を含む回答には取得時刻を添えます */
  realtime: boolean;
};

/**
 * スポーツAIアシスタント。
 *
 * ■ 生成AIに自由回答させない設計
 *   サイト内の文書（data/content.ts の chatDocuments）と検索索引だけを参照します。
 *   該当が無ければ「答えられない」と明示し、関連ページを案内します。
 *   スポーツの試合情報は誤りが直接損害になり得るため、推測で埋めません。
 *
 * ■ 必ず守ること
 *   - 試合結果を予言しない
 *   - 利益を保証しない
 *   - 年齢制限・地域制限の回避を案内しない
 *   これらは chatDocuments 側の回答文面として固定しています。
 */
export function SportsChat({ locale }: { locale: string }) {
  const dict = getDictionary(locale);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const counter = useRef(0);

  const suggestions = chatDocuments.slice(0, 4);

  const ask = (question: string) => {
    const trimmed = question.trim();
    if (!trimmed) return;

    const result = answerQuestion(trimmed, locale);
    counter.current += 2;

    const botText = result.document ? text(result.document.answer, locale) : `${dict.chatFallback}`;

    const links = result.document
      ? result.document.links.map((link) => ({ label: text(link.label, locale), href: link.href }))
      : result.related;

    setMessages((previous) => [
      ...previous,
      { id: counter.current - 1, role: "user", text: trimmed, links: [], realtime: false },
      { id: counter.current, role: "bot", text: botText, links, realtime: result.realtime },
    ]);
    setInput("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? dict.chatClose : dict.chatOpen}
        className="text-void fixed right-4 bottom-4 z-85 grid size-12 place-items-center rounded-full shadow-lg transition-transform hover:scale-105"
        style={{ background: "linear-gradient(135deg, var(--color-cyan), var(--color-indigo))" }}
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          {open ? (
            <path d="m5 5 14 14M19 5 5 19" strokeLinecap="round" />
          ) : (
            <path
              d="M21 12a8 8 0 0 1-8 8H7l-4 3v-5a8 8 0 0 1 8-8h2a8 8 0 0 1 8 2Z"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={dict.chatTitle}
          className="border-edge bg-abyss/98 fixed right-4 bottom-20 z-85 flex max-h-[70vh] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl"
        >
          <div className="border-edge border-b px-4 py-3">
            <p className="text-ink text-sm font-bold">{dict.chatTitle}</p>
            <p className="text-ink-faint mt-1 text-[0.6875rem] leading-relaxed">{dict.chatIntro}</p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 ? (
              <ul className="space-y-1.5">
                {suggestions.map((doc) => (
                  <li key={doc.id}>
                    <button
                      type="button"
                      onClick={() => ask(text(doc.question, locale))}
                      className="border-edge text-ink-soft hover:border-cyan/60 hover:text-cyan w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors"
                    >
                      {text(doc.question, locale)}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {messages.map((message) => (
              <div
                key={message.id}
                className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    message.role === "user"
                      ? "bg-cyan/15 text-ink"
                      : "border-edge bg-panel text-ink-soft border"
                  }`}
                >
                  <p>{message.text}</p>

                  {message.realtime ? (
                    <p className="sp-mono text-caution mt-2 text-[0.5625rem]">
                      {dict.fetchedAt}: {formatDateTime(demoNowIso, locale)} /{" "}
                      {dict.chatRealtimeNote}
                    </p>
                  ) : null}

                  {message.links.length > 0 ? (
                    <ul className="border-edge mt-2 space-y-1 border-t pt-2">
                      {message.links.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={href(locale, link.href)}
                            className="text-cyan text-[0.6875rem] transition-colors hover:underline"
                          >
                            → {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              ask(input);
            }}
            className="border-edge flex gap-2 border-t p-3"
          >
            <label className="sr-only" htmlFor="sports-chat-input">
              {dict.chatPlaceholder}
            </label>
            <input
              id="sports-chat-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={dict.chatPlaceholder}
              className="border-edge bg-void text-ink placeholder:text-ink-faint focus:border-cyan min-w-0 flex-1 rounded-lg border px-3 py-2 text-xs focus:outline-none"
            />
            <button
              type="submit"
              className="bg-cyan text-void shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-90"
            >
              {dict.chatSend}
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
