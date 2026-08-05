"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { getDictionary } from "../../i18n";
import { searchDocs } from "../../lib/search";
import { href } from "../../lib/url";

const typeLabel: Record<string, { ja: string; en: string }> = {
  sport: { ja: "競技", en: "Sport" },
  league: { ja: "リーグ", en: "League" },
  match: { ja: "試合", en: "Match" },
  team: { ja: "チーム", en: "Team" },
  player: { ja: "選手", en: "Player" },
  news: { ja: "ニュース", en: "News" },
  video: { ja: "動画", en: "Video" },
  streaming: { ja: "配信", en: "Streaming" },
  web3: { ja: "Web3.0", en: "Web3" },
  faq: { ja: "FAQ", en: "FAQ" },
  glossary: { ja: "用語", en: "Glossary" },
};

/**
 * サイト内検索。
 *
 * 索引はビルド時に組み立てた静的データなので、サーバーへの問い合わせなしに動きます。
 * 表記ゆれ（「マンU」「Man United」）は各エンティティの aliases で吸収します。
 */
export function SearchPanel({
  locale,
  initialQuery = "",
}: {
  locale: string;
  initialQuery?: string;
}) {
  const dict = getDictionary(locale);
  // 静的書き出しでは searchParams をサーバー側で読めません。
  // ?q= はハイドレーション後に useSearchParams から反映されます
  // （入力があればそちらを優先するため、状態の同期処理は不要です）。
  const searchParams = useSearchParams();
  const [typed, setTyped] = useState<string | null>(null);
  const query = typed ?? searchParams.get("q") ?? initialQuery;
  const [filter, setFilter] = useState<string>("all");

  const hits = useMemo(() => searchDocs(query, locale, 60), [query, locale]);
  const filtered = filter === "all" ? hits : hits.filter((hit) => hit.type === filter);

  const availableTypes = useMemo(() => {
    const set = new Set(hits.map((hit) => hit.type));
    return Array.from(set);
  }, [hits]);

  return (
    <div>
      <label htmlFor="sports-search" className="sr-only">
        {dict.search}
      </label>
      <div className="sp-solid flex items-center gap-3 px-4 py-3">
        <svg
          viewBox="0 0 20 20"
          className="text-ink-faint size-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <circle cx="9" cy="9" r="6" />
          <path d="m13.5 13.5 4 4" strokeLinecap="round" />
        </svg>
        <input
          id="sports-search"
          type="search"
          value={query}
          onChange={(event) => setTyped(event.target.value)}
          placeholder={dict.searchPlaceholder}
          autoComplete="off"
          className="text-ink placeholder:text-ink-faint min-w-0 flex-1 bg-transparent text-sm focus:outline-none"
        />
        {query ? (
          <span className="sp-mono text-ink-faint shrink-0 text-[0.6875rem]">{hits.length}</span>
        ) : null}
      </div>

      {availableTypes.length > 1 ? (
        <div className="sp-scroll-x mt-3 flex gap-1.5 pb-1">
          {["all", ...availableTypes].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilter(type)}
              aria-pressed={filter === type}
              className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                filter === type
                  ? "border-cyan/60 text-cyan"
                  : "border-edge text-ink-faint hover:text-ink"
              }`}
            >
              {type === "all"
                ? locale === "ja"
                  ? "すべて"
                  : "All"
                : (typeLabel[type]?.[locale === "ja" ? "ja" : "en"] ?? type)}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-4">
        {query && filtered.length === 0 ? (
          <p className="sp-solid text-ink-dim p-6 text-sm" role="status">
            {dict.noResults}
          </p>
        ) : null}

        <ul className="space-y-1.5">
          {filtered.map((hit) => (
            <li key={hit.id}>
              <Link
                href={href(locale, hit.href)}
                className="border-edge hover:border-cyan/60 flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors"
              >
                <span
                  className="sp-mono shrink-0 rounded-sm px-1.5 py-0.5 text-[0.5625rem] tracking-wider uppercase"
                  style={{ background: `${hit.accent}22`, color: hit.accent }}
                >
                  {typeLabel[hit.type]?.[locale === "ja" ? "ja" : "en"] ?? hit.type}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-ink block truncate text-sm">{hit.title}</span>
                  {hit.subtitle ? (
                    <span className="text-ink-faint block truncate text-[0.6875rem]">
                      {hit.subtitle}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
