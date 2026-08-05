"use client";

import { useState } from "react";
import { t } from "@/portal/lib/format";
import type { Dictionary } from "@/portal/i18n/dictionaries";
import type { FaqItem } from "@/portal/lib/types";
import { NeonButton } from "./primitives";

/**
 * FAQ。
 * `<details>` を使うため、JavaScript が動かなくても開閉できます。
 */
export function FaqList({
  items,
  locale,
  className,
}: {
  items: FaqItem[];
  locale: string;
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <ul className={`grid gap-2.5 ${className ?? ""}`}>
      {items.map((item, index) => (
        <li key={index}>
          <details className="glass group rounded-xl px-4 py-3 sm:px-5 sm:py-4">
            <summary className="flex cursor-pointer list-none items-start gap-3 text-sm font-medium marker:hidden sm:text-base">
              <span
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-(--color-cyan) transition-transform duration-300 group-open:rotate-90"
              >
                ▸
              </span>
              <span>{t(item.q, locale)}</span>
            </summary>
            <p className="mt-3 ps-6 text-sm text-(--color-ink-soft)">{t(item.a, locale)}</p>
          </details>
        </li>
      ))}
    </ul>
  );
}

/**
 * メール登録。
 *
 * ⚠ 送信先が未設定のあいだは、送信せず「準備中」を返します。
 *   登録できたように見せて実際には届いていない、という状態を避けるためです。
 *   `NEXT_PUBLIC_NEWSLETTER_ENDPOINT` を設定すると、そのURLへPOSTします。
 */
export function SubscribeForm({ dict }: { dict: Dictionary }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "invalid" | "done" | "unavailable">("idle");

  const endpoint = process.env.NEXT_PUBLIC_NEWSLETTER_ENDPOINT ?? "";

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    // 形式チェックはブラウザ任せにせず、こちらでも見ます
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setState("invalid");
      return;
    }
    if (!endpoint) {
      setState("unavailable");
      return;
    }
    try {
      await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setState("done");
      setEmail("");
    } catch {
      setState("unavailable");
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md">
      <label htmlFor="subscribe-email" className="mb-2 block text-sm">
        {dict.subscribe.emailLabel}
      </label>
      <div className="flex gap-2">
        <input
          id="subscribe-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setState("idle");
          }}
          aria-invalid={state === "invalid"}
          aria-describedby="subscribe-status"
          className="glass w-full rounded-full px-4 py-2.5 text-sm outline-none placeholder:text-(--color-ink-dim)"
          placeholder="you@example.com"
        />
        <NeonButton type="submit" className="shrink-0">
          {dict.subscribe.submit}
        </NeonButton>
      </div>
      <p id="subscribe-status" className="mt-2 text-xs text-(--color-ink-dim)" role="status">
        {state === "invalid"
          ? dict.subscribe.invalid
          : state === "done"
            ? dict.subscribe.done
            : state === "unavailable"
              ? dict.common.error
              : dict.subscribe.consent}
      </p>
    </form>
  );
}
