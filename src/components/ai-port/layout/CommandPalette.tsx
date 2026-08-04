"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search, X } from "lucide-react";
import { searchDocs, searchKindLabel, type SearchHit } from "@/lib/ai-port/search";
import { cn } from "@/lib/utils";

/**
 * コマンドパレット（⌘K / Ctrl+K）。
 *
 * ■ なぜクライアント側で検索するのか
 *   対象はサイト内の静的コンテンツ（数百件）です。
 *   インデックスはビルド時のデータから作られるので、サーバーへ問い合わせる必要がありません。
 *   結果が即座に出るぶん、体感がはっきり速くなります。
 *
 * ■ 開くまでインデックスを作らない
 *   `getSearchIndex()` は初回呼び出しで組み立てて以降キャッシュします。
 *   パレットを開くまで呼ばないので、初期表示には影響しません。
 */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const hits: SearchHit[] = useMemo(
    () => (open && query.trim().length > 0 ? searchDocs(query, 8) : []),
    [open, query],
  );

  const close = useCallback(() => {
    onOpenChange(false);
    setQuery("");
    setActiveIndex(0);
  }, [onOpenChange]);

  const go = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router],
  );

  // 開いたら入力欄へフォーカスし、背面のスクロールを止めます
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const onQueryChange = (value: string) => {
    setQuery(value);
    // 検索語が変われば候補も変わるので、選択位置は先頭に戻します
    setActiveIndex(0);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (hits.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % hits.length);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + hits.length) % hits.length);
    }
    if (event.key === "Enter") {
      event.preventDefault();
      go(hits[activeIndex].doc.href);
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="サイト内検索"
      className="fixed inset-0 z-[120] flex items-start justify-center px-4 pt-[12vh]"
      onKeyDown={onKeyDown}
    >
      <button
        type="button"
        aria-label="検索を閉じる"
        onClick={close}
        className="bg-ai-void/80 absolute inset-0 backdrop-blur-md"
      />

      <div className="ai-glass relative w-full max-w-xl overflow-hidden rounded-2xl">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <Search aria-hidden="true" className="text-ai-haze size-4 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="AIツール・記事・診断を検索"
            aria-label="検索キーワード"
            className="text-ai-white placeholder:text-ai-dim min-w-0 flex-1 bg-transparent text-[0.95rem] outline-none"
          />
          <button
            type="button"
            onClick={close}
            aria-label="閉じる"
            className="text-ai-dim hover:text-ai-mist transition-colors"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>

        <div className="max-h-[52vh] overflow-y-auto">
          {query.trim().length === 0 ? (
            <p className="text-ai-dim px-5 py-8 text-center text-[0.82rem]">
              キーワードを入力してください（例：画像生成、RAG、副業）
            </p>
          ) : hits.length === 0 ? (
            <p className="text-ai-dim px-5 py-8 text-center text-[0.82rem]">
              一致する情報が見つかりませんでした。
            </p>
          ) : (
            <ul>
              {hits.map((hit, index) => (
                <li key={hit.doc.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => go(hit.doc.href)}
                    className={cn(
                      "flex w-full items-start gap-3 px-5 py-3 text-left transition-colors",
                      index === activeIndex ? "bg-white/[0.07]" : "hover:bg-white/[0.04]",
                    )}
                  >
                    <span className="font-ai-mono text-ai-dim mt-0.5 w-16 shrink-0 text-[0.6rem] tracking-[0.1em]">
                      {searchKindLabel[hit.doc.kind]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="text-ai-white block truncate text-[0.88rem]">
                        {hit.doc.title}
                      </span>
                      <span className="text-ai-haze mt-0.5 line-clamp-1 block text-[0.75rem]">
                        {hit.doc.description}
                      </span>
                    </span>
                    {index === activeIndex ? (
                      <CornerDownLeft aria-hidden="true" className="text-ai-dim mt-1 size-3.5" />
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-ai-dim font-ai-mono flex items-center justify-between border-t border-white/8 px-5 py-2.5 text-[0.62rem] tracking-[0.1em]">
          <span>↑↓ 選択 / ENTER 移動 / ESC 閉じる</span>
          <span>AI PORT SEARCH</span>
        </p>
      </div>
    </div>
  );
}

/** ⌘K / Ctrl+K でパレットを開くためのフック。 */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return { open, setOpen };
}
