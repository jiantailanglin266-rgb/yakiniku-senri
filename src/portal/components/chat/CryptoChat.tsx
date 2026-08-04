"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { localePath } from "@/portal/i18n/config";
import { answer, suggestions, type ChatPassage } from "@/portal/lib/chat";
import type { Dictionary } from "@/portal/i18n/dictionaries";
import { NeonButton } from "@/portal/components/ui/primitives";

/**
 * AIチャットボット。
 *
 * ■ 既定は「抽出型」
 *   サイト内のコンテンツから該当箇所を取り出して提示します。
 *   生成モデルを通さないため、事実の捏造が構造的に起きません。
 *   APIキーが無くても完全に動作します。
 *
 * ■ 生成モデルを使う場合
 *   サーバー実行（Vercel等）へデプロイするときに `/api/chat` を追加し、
 *   `retrieve()` の結果を文脈として生成モデルへ渡します。実装例はREADME参照。
 *   静的書き出し（GitHub Pages）では POST の Route Handler を持てないため、
 *   このリポジトリには API ルートを置いていません。
 *   いずれの構成でもAPIキーはサーバーに留まり、クライアントへは出ません。
 *
 * ■ 守っている境界
 *   - 特定銘柄の購入を勧めない / 利益を保証しない / 価格を断定しない
 *   - 秘密鍵・シードフレーズを尋ねない（尋ねられたら警告を返す）
 *   - 回答の最後に必ず関連ページを出す
 */

type Message = {
  id: string;
  role: "user" | "assistant";
  paragraphs: string[];
  sources: ChatPassage[];
  /** 事実の裏付けの種類。UIで「サイト内の情報にもとづく回答」と示します */
  basis?: "site-content" | "guardrail" | "none";
};

export function CryptoChat({ locale, dict }: { locale: string; dict: Dictionary }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function ask(question: string) {
    const trimmed = question.trim();
    if (trimmed.length === 0 || pending) return;

    const userMessage: Message = {
      id: `u-${messages.length}`,
      role: "user",
      paragraphs: [trimmed],
      sources: [],
    };
    setMessages((previous) => [...previous, userMessage]);
    setInput("");
    setPending(true);

    // 既定はローカルの抽出型。生成モデルはサーバー側API経由でのみ使います
    const local = answer(trimmed, locale);
    const reply: Message = {
      id: `a-${messages.length}`,
      role: "assistant",
      paragraphs: local.basis === "none" ? [dict.chat.fallback] : local.paragraphs,
      sources: local.sources,
      basis: local.basis,
    };

    setMessages((previous) => [...previous, reply]);
    setPending(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="glass-strong edge-flow fixed end-4 bottom-4 z-50 flex size-13 items-center justify-center rounded-full sm:end-6 sm:bottom-6"
        aria-label={dict.chat.open}
      >
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
          <path
            d="M20 12a8 8 0 1 1-3.2-6.4M20 4v5h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={dict.chat.title}
          className="glass-strong fixed end-2 bottom-20 z-50 flex max-h-[min(34rem,calc(100dvh-7rem))] w-[min(24rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-2xl shadow-2xl sm:end-6 sm:bottom-24"
        >
          <header className="flex items-center justify-between border-b border-(--color-hairline) px-4 py-3">
            <div>
              <p className="text-sm font-semibold">{dict.chat.title}</p>
              <p className="text-[0.6875rem] text-(--color-ink-dim)">{dict.chat.sourceNote}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={dict.common.close}
              className="rounded-full p-1.5 text-(--color-ink-dim) transition-colors hover:text-white"
            >
              <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
                <path
                  d="M3 3l10 10M13 3L3 13"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4 text-sm">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-(--color-ink-soft)">{dict.chat.intro}</p>
                <p className="rounded-lg border border-(--color-down)/35 bg-(--color-down)/6 px-3 py-2 text-xs">
                  {dict.chat.securityNotice}
                </p>
                <p className="text-xs text-(--color-ink-dim)">{dict.chat.suggestions}</p>
                <ul className="grid gap-1.5">
                  {suggestions(locale).map((suggestion) => (
                    <li key={suggestion}>
                      <button
                        type="button"
                        onClick={() => ask(suggestion)}
                        className="glass w-full rounded-lg px-3 py-2 text-start text-xs transition-colors hover:text-white"
                      >
                        {suggestion}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {messages.map((message) => (
              <div
                key={message.id}
                className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={[
                    "max-w-[92%] rounded-xl px-3 py-2",
                    message.role === "user"
                      ? "bg-(--color-blue)/20 text-(--color-ink)"
                      : "glass text-(--color-ink-soft)",
                  ].join(" ")}
                >
                  {message.paragraphs.map((paragraph, index) => (
                    <p key={index} className={index > 0 ? "mt-2" : undefined}>
                      {paragraph}
                    </p>
                  ))}

                  {message.role === "assistant" && message.sources.length > 0 ? (
                    <div className="mt-3 border-t border-(--color-hairline) pt-2">
                      <p className="mb-1 text-[0.6875rem] text-(--color-ink-dim)">
                        {dict.chat.related}
                      </p>
                      <ul className="grid gap-1">
                        {message.sources.map((source) => (
                          <li key={source.id}>
                            <Link
                              href={localePath(locale, source.path)}
                              onClick={() => setOpen(false)}
                              className="text-xs text-(--color-cyan-soft) underline-offset-2 hover:underline"
                            >
                              {source.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
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
            className="flex items-center gap-2 border-t border-(--color-hairline) px-3 py-3"
          >
            <label htmlFor={`${panelId}-input`} className="sr-only">
              {dict.chat.placeholder}
            </label>
            <input
              id={`${panelId}-input`}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={dict.chat.placeholder}
              autoComplete="off"
              className="glass w-full rounded-full px-4 py-2 text-sm outline-none placeholder:text-(--color-ink-dim)"
            />
            <NeonButton
              type="submit"
              disabled={pending || input.trim().length === 0}
              className="px-4 py-2"
            >
              {dict.chat.send}
            </NeonButton>
          </form>
        </div>
      ) : null}
    </>
  );
}
