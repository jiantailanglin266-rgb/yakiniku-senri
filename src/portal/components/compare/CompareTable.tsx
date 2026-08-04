"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { cx, NeonButton } from "@/portal/components/ui/primitives";

/**
 * 比較表。
 *
 * ■ スマートフォンでの読み方
 *   横スクロールだけに頼ると、指を離した瞬間にどの行を見ていたか分からなくなります。
 *   そのため「表」と「カード」を切り替えられるようにし、
 *   狭い画面では既定でカードにしています。
 *
 * ■ 先頭列の固定
 *   横スクロール時に取引所名が消えると比較できないため、
 *   先頭列は sticky で残します。
 */

export type CompareColumn<T> = {
  key: string;
  label: string;
  /** カード表示で省略する列（詳細ページで見れば足りるもの） */
  secondary?: boolean;
  render: (row: T) => ReactNode;
  align?: "start" | "center" | "end";
};

export function CompareTable<T extends { id: string }>({
  rows,
  columns,
  rowHeader,
  labels,
  caption,
}: {
  rows: T[];
  columns: CompareColumn<T>[];
  /** 先頭列（固定表示） */
  rowHeader: (row: T) => ReactNode;
  labels: { table: string; cards: string };
  caption: string;
}) {
  const [mode, setMode] = useState<"auto" | "table" | "cards">("auto");

  const showTable = mode === "table";
  const showCards = mode === "cards";

  return (
    <div>
      <div className="mb-3 flex justify-end gap-2">
        <NeonButton
          tone={showTable ? "primary" : "outline"}
          className="px-3 py-1.5 text-xs"
          onClick={() => setMode("table")}
          aria-pressed={showTable}
        >
          {labels.table}
        </NeonButton>
        <NeonButton
          tone={showCards ? "primary" : "outline"}
          className="px-3 py-1.5 text-xs"
          onClick={() => setMode("cards")}
          aria-pressed={showCards}
        >
          {labels.cards}
        </NeonButton>
      </div>

      {/* 表。auto のときは lg 以上でのみ表示します */}
      <div
        className={cx(
          "scroll-fade -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0",
          mode === "auto" && "hidden lg:block",
          showCards && "hidden",
        )}
      >
        <table className="w-full min-w-[52rem] border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-(--color-hairline-strong)">
              <th
                scope="col"
                className="glass-strong sticky start-0 z-10 px-4 py-3 text-start text-xs font-semibold tracking-wide text-(--color-ink-dim) uppercase"
              >
                &nbsp;
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cx(
                    "px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap text-(--color-ink-dim) uppercase",
                    column.align === "end"
                      ? "text-end"
                      : column.align === "center"
                        ? "text-center"
                        : "text-start",
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-(--color-hairline) transition-colors hover:bg-white/4"
              >
                <th
                  scope="row"
                  className="glass-strong sticky start-0 z-10 px-4 py-4 text-start font-normal"
                >
                  {rowHeader(row)}
                </th>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cx(
                      "tabular px-4 py-4 align-middle",
                      column.align === "end"
                        ? "text-end"
                        : column.align === "center"
                          ? "text-center"
                          : "text-start",
                    )}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* カード */}
      <ul
        className={cx(
          "grid gap-4 sm:grid-cols-2",
          mode === "auto" && "lg:hidden",
          showTable && "hidden",
        )}
      >
        {rows.map((row) => (
          <li key={row.id} className="glass rounded-2xl p-4">
            <div className="mb-3 border-b border-(--color-hairline) pb-3">{rowHeader(row)}</div>
            <dl className="grid gap-2 text-sm">
              {columns
                .filter((column) => !column.secondary)
                .map((column) => (
                  <div key={column.key} className="flex items-start justify-between gap-4">
                    <dt className="text-xs text-(--color-ink-dim)">{column.label}</dt>
                    <dd className="tabular text-end">{column.render(row)}</dd>
                  </div>
                ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
