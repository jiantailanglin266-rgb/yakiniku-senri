"use client";

/**
 * AIカードコンシェルジュ。
 *
 * ■ 何を答えるか
 *   掲載データ（カード・キャンペーン・記事・FAQ・ツール・Web3サービス・動画）を検索し、
 *   見つかった文をそのまま提示します。存在しない情報を作りません。
 *
 * ■ 禁止事項の担保
 *   - 審査通過・限度額を保証する文言は、そもそもデータ側に存在しません
 *   - カード番号らしき入力を検出したら、回答せずに警告します
 *   - 回答の最後に、必ず参照元と次の導線を出します
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import type { Dictionary } from "@/cardport/i18n";
import { formatDate } from "@/cardport/i18n/format";
import type { Locale } from "@/cardport/i18n/locales";
import { answer, type ChatAnswer } from "@/cardport/lib/rag";
import { routes } from "@/cardport/lib/routes";
import { Notice, cx } from "@/cardport/components/ui/primitives";

type Message = { role: "user"; text: string } | { role: "assistant"; result: ChatAnswer };

export function Concierge({
  locale,
  dictionary,
  variant = "floating",
}: {
  locale: Locale;
  dictionary: Dictionary;
  variant?: "floating" | "inline";
}) {
  const [open, setOpen] = useState(variant === "inline");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((current) => [
      ...current,
      { role: "user", text: trimmed },
      { role: "assistant", result: answer(trimmed, locale) },
    ]);
    setInput("");
  };

  const suggestions =
    locale === "ja"
      ? [
          "年会費無料で還元率が高いカードは？",
          "マイルが貯まるカードを教えて",
          "法人カードのおすすめは？",
          "暗号資産カードのリスクは？",
        ]
      : [
          "Which no-fee card has the best rate?",
          "Cards for earning miles",
          "Best business card?",
          "Risks of crypto cards",
        ];

  const panel = (
    <div
      className={cx(
        "glass-solid flex flex-col overflow-hidden rounded-2xl",
        variant === "floating"
          ? "h-[min(32rem,70vh)] w-[min(24rem,calc(100vw-2rem))]"
          : "h-[34rem] w-full",
      )}
    >
      <div className="border-cp-line/60 flex items-center justify-between border-b px-4 py-3">
        <div>
          <p className="text-cp-ink text-[0.86rem] font-semibold">{dictionary.chat.title}</p>
          <p className="text-cp-dim text-[0.68rem]">{dictionary.chat.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 ? (
            <button
              type="button"
              onClick={() => setMessages([])}
              className="text-cp-dim hover:text-cp-ink text-[0.7rem]"
            >
              {dictionary.chat.reset}
            </button>
          ) : null}
          {variant === "floating" ? (
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={dictionary.common.close}
              className="text-cp-dim hover:text-cp-ink"
            >
              <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
                <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <p className="text-cp-mist bg-cp-navy/60 border-cp-line rounded-xl border px-3 py-2.5 text-[0.78rem] leading-relaxed">
          {dictionary.chat.intro}
        </p>
        {/* 機密情報を入力させない注意は、会話の最初に必ず出します */}
        <Notice tone="warn">{dictionary.chat.guard}</Notice>

        {messages.map((message, index) =>
          message.role === "user" ? (
            <p
              key={index}
              className="bg-cp-cyan/12 text-cp-ink ms-auto max-w-[85%] rounded-xl px-3 py-2 text-[0.8rem]"
            >
              {message.text}
            </p>
          ) : (
            <div key={index} className="max-w-[92%]">
              {message.result.kind === "blocked" ? (
                <Notice tone="danger">{dictionary.chat.guard}</Notice>
              ) : message.result.kind === "empty" ? (
                <p className="text-cp-mist bg-cp-navy/60 border-cp-line rounded-xl border px-3 py-2.5 text-[0.78rem]">
                  {dictionary.chat.empty}
                </p>
              ) : (
                <div className="bg-cp-navy/60 border-cp-line rounded-xl border px-3 py-2.5">
                  <p className="text-cp-mist text-[0.78rem] leading-relaxed whitespace-pre-line">
                    {message.result.body}
                  </p>
                  <div className="border-cp-line/60 mt-3 border-t pt-2.5">
                    <p className="text-cp-dim mb-1.5 text-[0.68rem]">
                      {dictionary.chat.sourceLabel}
                    </p>
                    <ul className="space-y-1">
                      {message.result.sources.map((source) => (
                        <li key={source.href + source.title}>
                          <Link
                            href={source.href}
                            className="text-cp-cyan text-[0.74rem] hover:underline"
                          >
                            {source.title}
                          </Link>
                          {source.verifiedOn ? (
                            <span className="text-cp-dim ms-2 text-[0.66rem]">
                              {dictionary.common.verifiedAt}:{" "}
                              {formatDate(source.verifiedOn, locale)}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* 回答の最後に必ず次の導線を出します */}
                  <div className="border-cp-line/60 mt-3 flex flex-wrap gap-3 border-t pt-2.5">
                    <Link
                      href={routes.cards(locale)}
                      className="text-cp-dim hover:text-cp-cyan text-[0.7rem]"
                    >
                      {dictionary.nav.cards} →
                    </Link>
                    <Link
                      href={routes.compare(locale)}
                      className="text-cp-dim hover:text-cp-cyan text-[0.7rem]"
                    >
                      {dictionary.sections.comparison} →
                    </Link>
                    <Link
                      href={routes.diagnosisIndex(locale)}
                      className="text-cp-dim hover:text-cp-cyan text-[0.7rem]"
                    >
                      {dictionary.nav.diagnosis} →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ),
        )}

        {messages.length === 0 ? (
          <ul className="flex flex-wrap gap-1.5 pt-1">
            {suggestions.map((suggestion) => (
              <li key={suggestion}>
                <button
                  type="button"
                  onClick={() => send(suggestion)}
                  className="border-cp-line text-cp-mist hover:border-cp-cyan/50 hover:text-cp-ink rounded-full border px-2.5 py-1 text-[0.7rem] transition-colors"
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(input);
        }}
        className="border-cp-line/60 flex items-center gap-2 border-t px-3 py-3"
      >
        <label htmlFor="cardport-chat-input" className="sr-only">
          {dictionary.chat.placeholder}
        </label>
        <input
          id="cardport-chat-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={dictionary.chat.placeholder}
          autoComplete="off"
          className="border-cp-line bg-cp-navy/70 text-cp-ink placeholder:text-cp-dim focus:border-cp-cyan flex-1 rounded-full border px-3.5 py-2 text-[0.8rem] outline-none"
        />
        <button
          type="submit"
          className="from-cp-cyan to-cp-electric text-cp-void rounded-full bg-gradient-to-r px-4 py-2 text-[0.78rem] font-semibold"
        >
          {dictionary.chat.send}
        </button>
      </form>
    </div>
  );

  if (variant === "inline") return panel;

  return (
    <div className="fixed right-4 bottom-4 z-50 print:hidden">
      {open ? (
        panel
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="from-cp-cyan to-cp-violet text-cp-void flex items-center gap-2 rounded-full bg-gradient-to-r px-4 py-3 text-[0.8rem] font-semibold shadow-[0_12px_40px_-12px_rgba(34,211,238,0.9)]"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
            <path
              d="M3 5.5A2.5 2.5 0 0 1 5.5 3h9A2.5 2.5 0 0 1 17 5.5v6A2.5 2.5 0 0 1 14.5 14H8l-4 3v-3H5.5A2.5 2.5 0 0 1 3 11.5z"
              fill="currentColor"
            />
          </svg>
          {dictionary.chat.title}
        </button>
      )}
    </div>
  );
}
