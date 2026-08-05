"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles } from "lucide-react";
import { aiPortPath } from "@/data/ai-port/site";

const SUGGESTIONS = ["画像生成AI", "AIエージェント", "無料 チャットAI", "RAG 社内文書", "AI 副業"];

/**
 * ヒーローの検索窓。
 *
 * 送信すると /ai-port/search?q=... へ移動します。
 * 検索結果ページはサーバー側で描画されるため、共有・被リンクの対象になります
 * （モーダル内で完結させるとURLが残らず、SEO上の資産になりません）。
 */
export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const submit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    router.push(`${aiPortPath("/search")}?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="w-full max-w-xl">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          submit(query);
        }}
        className="ai-glass ai-glass-rim flex items-center gap-3 rounded-full py-2 pr-2 pl-5"
      >
        <Search aria-hidden="true" className="text-ai-haze size-4 shrink-0" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="AIツール・ニュース・解説を検索"
          aria-label="サイト内を検索"
          className="text-ai-white placeholder:text-ai-dim min-w-0 flex-1 bg-transparent py-2.5 text-[0.9rem] outline-none"
        />
        <button
          type="submit"
          className="from-ai-cyan to-ai-blue inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r px-4 py-2.5 text-[0.8rem] font-medium text-[#04060f] transition-transform duration-300 hover:scale-[1.03]"
        >
          <Sparkles aria-hidden="true" className="size-3.5" />
          検索
        </button>
      </form>

      <ul className="mt-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <li key={suggestion}>
            <button
              type="button"
              onClick={() => submit(suggestion)}
              className="text-ai-haze hover:text-ai-cyan rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[0.74rem] transition-colors duration-300 hover:border-white/25"
            >
              {suggestion}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
