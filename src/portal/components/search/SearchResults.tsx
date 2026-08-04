"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { localePath } from "@/portal/i18n/config";
import { search } from "@/portal/lib/search-index";
import { t } from "@/portal/lib/format";
import type { Dictionary } from "@/portal/i18n/dictionaries";
import { Badge, EmptyState, GlassCard } from "@/portal/components/ui/primitives";

/**
 * 検索結果ページ。
 *
 * `?q=` はクライアントで読みます。サーバー側で `searchParams` を読むと
 * ページが動的扱いになり、静的書き出しができなくなるためです。
 */
export function SearchResults({ locale, dict }: { locale: string; dict: Dictionary }) {
  // `?q=` は URL から読み、入力後はローカル状態を優先します。
  // （effect で state へ写すと、初回描画のあとに余計な再レンダーが挟まります）
  const initialQuery = useSearchParams().get("q") ?? "";
  const [typed, setTyped] = useState<string | null>(null);
  const query = typed ?? initialQuery;

  const hits = useMemo(() => (query.trim() ? search(query, locale, 40) : []), [query, locale]);

  return (
    <div>
      <label htmlFor="search-input" className="mb-2 block text-sm">
        {dict.search.title}
      </label>
      <input
        id="search-input"
        type="search"
        value={query}
        onChange={(event) => setTyped(event.target.value)}
        placeholder={dict.search.placeholder}
        className="glass w-full rounded-full px-5 py-3 text-base outline-none placeholder:text-(--color-ink-dim)"
      />
      <p className="mt-2 text-xs text-(--color-ink-dim)">{dict.search.hint}</p>

      {query.trim() ? (
        <>
          <p className="mt-8 mb-4 text-sm text-(--color-ink-soft)">
            {hits.length} {dict.search.results}
          </p>
          {hits.length === 0 ? (
            <EmptyState message={dict.search.noResults} />
          ) : (
            <ul className="grid gap-3">
              {hits.map((hit) => (
                <li key={hit.doc.id}>
                  <GlassCard className="p-4">
                    <Link href={localePath(locale, hit.doc.path)}>
                      <div className="flex items-center gap-2">
                        <Badge tone="cyan">{dict.search.types[hit.doc.type]}</Badge>
                        <h2 className="font-medium">{t(hit.doc.title, locale)}</h2>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-sm text-(--color-ink-soft)">
                        {t(hit.doc.summary, locale)}
                      </p>
                    </Link>
                  </GlassCard>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </div>
  );
}
