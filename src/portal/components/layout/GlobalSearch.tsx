"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { localePath } from "@/portal/i18n/config";
import { search } from "@/portal/lib/search-index";
import { t } from "@/portal/lib/format";
import type { Dictionary } from "@/portal/i18n/dictionaries";

/**
 * ヘッダーの検索。
 *
 * ■ 表記ゆれ
 *   「Bitcoin」「ビットコイン」「BTC」のいずれでも同じ結果に着地します
 *   （正規化とエイリアスは lib/search-index.ts）。
 *
 * ■ なぜクライアント検索か
 *   索引は数百件でサイズも小さいため、往復ゼロで返すほうが速く、
 *   サーバー費用もかかりません。件数が増えたら search() の中身だけ
 *   サーバー検索に差し替えれば、この画面は変更不要です。
 */
export function GlobalSearch({
  locale,
  dict,
  compact = false,
}: {
  locale: string;
  dict: Dictionary;
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const hits = useMemo(
    () => (query.trim().length === 0 ? [] : search(query, locale, 7)),
    [query, locale],
  );

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function submit(path?: string) {
    setOpen(false);
    if (path) {
      router.push(localePath(locale, path));
      return;
    }
    if (query.trim().length > 0) {
      router.push(`${localePath(locale, "/search")}?q=${encodeURIComponent(query.trim())}`);
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, hits.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, -1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      submit(activeIndex >= 0 ? hits[activeIndex].doc.path : undefined);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className={compact ? "relative w-full" : "relative w-full max-w-md"}>
      <div className="glass edge-glow flex items-center gap-2 rounded-full px-4 py-2">
        <svg viewBox="0 0 20 20" className="size-4 shrink-0 opacity-60" aria-hidden="true">
          <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M13.5 13.5 17 17"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        <input
          type="search"
          role="combobox"
          aria-expanded={open && hits.length > 0}
          aria-controls="global-search-results"
          aria-label={dict.common.search}
          placeholder={dict.common.searchPlaceholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            // 候補が入れ替わるので、キーボード選択位置も同時に戻します。
            // （effect で戻すと、1フレーム前の候補を選んだ状態が残ります）
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="w-full bg-transparent text-sm outline-none placeholder:text-(--color-ink-dim)"
        />
      </div>

      {open && query.trim().length > 0 ? (
        <div
          id="global-search-results"
          role="listbox"
          className="glass-strong absolute inset-x-0 z-50 mt-2 overflow-hidden rounded-xl shadow-2xl"
        >
          {hits.length === 0 ? (
            <p className="px-4 py-4 text-sm text-(--color-ink-dim)">{dict.search.noResults}</p>
          ) : (
            <ul>
              {hits.map((hit, index) => (
                <li key={hit.doc.id}>
                  <Link
                    href={localePath(locale, hit.doc.path)}
                    role="option"
                    aria-selected={index === activeIndex}
                    onClick={() => setOpen(false)}
                    className={[
                      "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                      index === activeIndex ? "bg-white/8" : "hover:bg-white/5",
                    ].join(" ")}
                  >
                    <span className="rounded border border-(--color-hairline) px-1.5 py-0.5 text-[0.625rem] text-(--color-ink-dim)">
                      {dict.search.types[hit.doc.type]}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{t(hit.doc.title, locale)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => submit()}
            className="w-full border-t border-(--color-hairline) px-4 py-2.5 text-start text-xs text-(--color-cyan-soft) hover:bg-white/5"
          >
            {dict.search.title}: {query}
          </button>
        </div>
      ) : null}
    </div>
  );
}
