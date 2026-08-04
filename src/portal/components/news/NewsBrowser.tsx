"use client";

import { useState } from "react";
import { newsCategories } from "@/portal/data/news";
import { t } from "@/portal/lib/format";
import type { Dictionary } from "@/portal/i18n/dictionaries";
import type { NewsArticle, NewsCategory } from "@/portal/lib/types";
import { cx, EmptyState } from "@/portal/components/ui/primitives";
import { NewsCard } from "./NewsCard";

/**
 * カテゴリ絞り込み付きのニュース一覧。
 *
 * 絞り込みをクエリパラメータではなくクライアント状態で持っているのは、
 * 記事数が数十件で全件を最初から渡しているためです。
 * サーバー往復なしで切り替わるので、体感が速くなります。
 */
export function NewsBrowser({
  groups,
  locale,
  dict,
}: {
  groups: { article: NewsArticle; duplicates: NewsArticle[] }[];
  locale: string;
  dict: Dictionary;
}) {
  const [category, setCategory] = useState<NewsCategory | "all">("all");

  const filtered =
    category === "all" ? groups : groups.filter((entry) => entry.article.category === category);

  // 記事が1件も無いカテゴリはボタンごと出しません（押しても空になるだけのため）
  const available = newsCategories.filter((entry) =>
    groups.some((group) => group.article.category === entry.id),
  );

  return (
    <div>
      <ul className="mb-6 flex flex-wrap gap-2">
        <li>
          <button
            type="button"
            onClick={() => setCategory("all")}
            aria-pressed={category === "all"}
            className={cx(
              "rounded-full px-3.5 py-1.5 text-xs transition-colors",
              category === "all" ? "bg-white/12 text-white" : "glass text-(--color-ink-soft)",
            )}
          >
            {dict.news.allCategories}
          </button>
        </li>
        {available.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => setCategory(entry.id)}
              aria-pressed={category === entry.id}
              className={cx(
                "rounded-full px-3.5 py-1.5 text-xs transition-colors",
                category === entry.id ? "bg-white/12 text-white" : "glass text-(--color-ink-soft)",
              )}
            >
              {t(entry.label, locale)}
            </button>
          </li>
        ))}
      </ul>

      {filtered.length === 0 ? (
        <EmptyState message={dict.news.empty} />
      ) : (
        <ul className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(({ article, duplicates }) => (
            <li key={article.id}>
              <NewsCard
                article={article}
                duplicates={duplicates.length}
                locale={locale}
                dict={dict}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
