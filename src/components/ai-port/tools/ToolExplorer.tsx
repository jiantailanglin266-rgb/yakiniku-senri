"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { toolCategories } from "@/data/ai-port/taxonomy";
import { tools, type AiTool } from "@/data/ai-port/tools";
import { Pill } from "@/components/ai-port/ui/Primitives";
import { ToolGrid } from "./ToolCard";

/**
 * AIツールの絞り込み。
 *
 * ■ クライアント側で絞り込む理由
 *   ツールデータはビルド時に確定しており、件数も数十件です。
 *   サーバーに問い合わせず手元で絞れば、押した瞬間に結果が変わります。
 *   ページ自体は静的配信のままなので、初期表示も速く保てます。
 *
 * ■ フィルターは「選定軸」だけ
 *   料金の金額での絞り込みは用意していません（金額を持っていないため）。
 */

type Filters = {
  categoryId: string | null;
  freeOnly: boolean;
  japaneseOnly: boolean;
  apiOnly: boolean;
  teamOnly: boolean;
};

const INITIAL: Filters = {
  categoryId: null,
  freeOnly: false,
  japaneseOnly: false,
  apiOnly: false,
  teamOnly: false,
};

export function ToolExplorer({ initialCategory }: { initialCategory?: string }) {
  const [filters, setFilters] = useState<Filters>({
    ...INITIAL,
    categoryId: initialCategory ?? null,
  });
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return tools.filter((tool: AiTool) => {
      if (filters.categoryId && !tool.categories.includes(filters.categoryId)) return false;
      if (filters.freeOnly && tool.pricing !== "free-tier") return false;
      // 「未確認（null）」は条件に一致したことにしません。推測で通さないためです。
      if (filters.japaneseOnly && tool.japaneseUi !== true) return false;
      if (filters.apiOnly && tool.api !== true) return false;
      if (filters.teamOnly && tool.team !== true) return false;

      if (keyword) {
        const haystack =
          `${tool.name} ${tool.maker} ${tool.summary} ${tool.bestFor} ${tool.strengths.join(" ")}`.toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }

      return true;
    });
  }, [filters, query]);

  const toggle = (key: keyof Omit<Filters, "categoryId">) =>
    setFilters((current) => ({ ...current, [key]: !current[key] }));

  return (
    <div>
      <div className="ai-glass rounded-2xl p-5">
        <div className="flex items-center gap-3 border-b border-white/8 pb-4">
          <Search aria-hidden="true" className="text-ai-haze size-4 shrink-0" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ツール名・用途で絞り込む"
            aria-label="ツールを絞り込む"
            className="text-ai-white placeholder:text-ai-dim min-w-0 flex-1 bg-transparent text-[0.9rem] outline-none"
          />
          <span className="text-ai-dim font-ai-mono shrink-0 text-[0.68rem]" translate="no">
            {results.length} / {tools.length}
          </span>
        </div>

        <div className="mt-4">
          <p className="text-ai-dim font-ai-mono text-[0.6rem] tracking-[0.2em] uppercase">
            カテゴリー
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            <li>
              <button
                type="button"
                onClick={() => setFilters((current) => ({ ...current, categoryId: null }))}
                aria-pressed={filters.categoryId === null}
              >
                <Pill active={filters.categoryId === null}>すべて</Pill>
              </button>
            </li>
            {toolCategories.map((category) => (
              <li key={category.id}>
                <button
                  type="button"
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      categoryId: current.categoryId === category.id ? null : category.id,
                    }))
                  }
                  aria-pressed={filters.categoryId === category.id}
                >
                  <Pill active={filters.categoryId === category.id}>{category.name}</Pill>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5">
          <p className="text-ai-dim font-ai-mono flex items-center gap-2 text-[0.6rem] tracking-[0.2em] uppercase">
            <SlidersHorizontal aria-hidden="true" className="size-3" />
            条件
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            <li>
              <button
                type="button"
                onClick={() => toggle("freeOnly")}
                aria-pressed={filters.freeOnly}
              >
                <Pill active={filters.freeOnly}>無料で試せる</Pill>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => toggle("japaneseOnly")}
                aria-pressed={filters.japaneseOnly}
              >
                <Pill active={filters.japaneseOnly}>日本語UIあり</Pill>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => toggle("apiOnly")}
                aria-pressed={filters.apiOnly}
              >
                <Pill active={filters.apiOnly}>APIあり</Pill>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => toggle("teamOnly")}
                aria-pressed={filters.teamOnly}
              >
                <Pill active={filters.teamOnly}>法人プランあり</Pill>
              </button>
            </li>
          </ul>
          <p className="text-ai-dim mt-3 text-[0.7rem] leading-[1.8]">
            条件で絞ると、その項目が「未確認」のツールは表示されません（推測で通さないためです）。
          </p>
        </div>
      </div>

      <div
        className="mt-8"
        // 絞り込み結果が変わったことを支援技術へ伝えます
        aria-live="polite"
        aria-atomic="false"
      >
        <ToolGrid tools={results} />
      </div>
    </div>
  );
}
