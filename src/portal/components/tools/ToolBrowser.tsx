"use client";

import { useState } from "react";
import Link from "next/link";
import { localePath } from "@/portal/i18n/config";
import { categoryFields, toolCategories } from "@/portal/data/tools";
import { t } from "@/portal/lib/format";
import type { Dictionary } from "@/portal/i18n/dictionaries";
import type { Tool, ToolCategory } from "@/portal/lib/types";
import { Badge, cx, EmptyState, GlassCard, SupportMark } from "@/portal/components/ui/primitives";

/**
 * Web3.0ツール一覧。
 *
 * カテゴリごとに見るべき項目が違うため（DEXに「無料プラン」は要らない、
 * 税金ツールに「対応チェーン」は要らない等）、`categoryFields` を見て
 * 表示する属性を出し分けます。
 */
export function ToolBrowser({
  tools,
  locale,
  dict,
  initialCategory,
}: {
  tools: Tool[];
  locale: string;
  dict: Dictionary;
  initialCategory?: ToolCategory;
}) {
  const [category, setCategory] = useState<ToolCategory | "all">(initialCategory ?? "all");

  const filtered = category === "all" ? tools : tools.filter((tool) => tool.category === category);
  const available = toolCategories.filter((entry) =>
    tools.some((tool) => tool.category === entry.id),
  );

  const supportLabels = {
    yes: dict.common.yes,
    no: dict.common.no,
    partial: dict.common.partial,
    unknown: dict.common.unknown,
  };

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
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((tool) => {
            const fields = categoryFields[tool.category];
            return (
              <li key={tool.id}>
                <GlassCard as="article" className="flex h-full flex-col p-5">
                  <Link href={localePath(locale, `/tools/${tool.slug}`)} className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold" style={{ color: tool.color }}>
                        {tool.name}
                      </h2>
                      <Badge tone="violet">
                        {t(
                          toolCategories.find((entry) => entry.id === tool.category)?.label ?? {
                            ja: tool.category,
                            en: tool.category,
                          },
                          locale,
                        )}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-(--color-ink-soft)">
                      {t(tool.summary, locale)}
                    </p>
                  </Link>

                  <dl className="mt-4 grid gap-1.5 border-t border-(--color-hairline) pt-3 text-xs">
                    {fields.includes("chains") && tool.chains.length > 0 ? (
                      <div className="flex items-start justify-between gap-3">
                        <dt className="text-(--color-ink-dim)">{dict.tools.supportedChains}</dt>
                        <dd className="text-end">{tool.chains.slice(0, 3).join(" / ")}</dd>
                      </div>
                    ) : null}
                    {fields.includes("freePlan") ? (
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-(--color-ink-dim)">{dict.tools.freePlan}</dt>
                        <dd>
                          <SupportMark value={tool.freePlan} labels={supportLabels} />
                        </dd>
                      </div>
                    ) : null}
                    {fields.includes("walletConnect") ? (
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-(--color-ink-dim)">{dict.tools.walletConnect}</dt>
                        <dd>
                          <SupportMark value={tool.walletConnect} labels={supportLabels} />
                        </dd>
                      </div>
                    ) : null}
                    {fields.includes("mobile") ? (
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-(--color-ink-dim)">{dict.wallets.mobile}</dt>
                        <dd>
                          <SupportMark value={tool.mobile} labels={supportLabels} />
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </GlassCard>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
