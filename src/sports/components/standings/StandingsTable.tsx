"use client";

import Link from "next/link";
import { useState } from "react";
import type { Sport, Standing } from "../../types";
import { getTeam } from "../../data/teams";
import { getDictionary, text } from "../../i18n";
import { href } from "../../lib/url";
import { formatChange } from "../../lib/format";
import { Crest } from "../ui/primitives";
import { FormStrip } from "../match/MatchParts";

const zoneColor: Record<string, string> = {
  champions: "var(--color-cyan)",
  playoff: "var(--color-indigo)",
  europa: "var(--color-neon)",
  relegation: "var(--color-live)",
};

/**
 * 順位表。
 *
 * 列の定義は Sport 側（standingsColumns）から読むため、競技を追加しても改修は不要です。
 * スマートフォンでは横スクロールとカード表示を切り替えられるようにしています。
 * 「横スクロールだけ」だと、列が多い競技で順位と勝ち点が同時に見えなくなるためです。
 */
export function StandingsTable({
  standing,
  sport,
  locale,
}: {
  standing: Standing;
  sport: Sport;
  locale: string;
}) {
  const dict = getDictionary(locale);
  const [mode, setMode] = useState<"table" | "cards">("table");
  const columns = sport.standingsColumns;
  const primaryColumns = columns.filter((column) => column.primary);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        {standing.group ? <h3 className="sp-eyebrow text-ink-dim">{standing.group}</h3> : <span />}
        <div className="flex gap-1 sm:hidden" role="group" aria-label={dict.viewAsTable}>
          {(["table", "cards"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              aria-pressed={mode === value}
              className={`rounded-md border px-2.5 py-1 text-[0.6875rem] transition-colors ${
                mode === value ? "border-cyan/60 text-cyan" : "border-edge text-ink-faint"
              }`}
            >
              {value === "table" ? dict.viewAsTable : dict.viewAsCards}
            </button>
          ))}
        </div>
      </div>

      {/* カード表示（スマートフォンのみ） */}
      <ul className={`space-y-2 sm:hidden ${mode === "cards" ? "" : "hidden"}`}>
        {standing.rows.map((row) => {
          const team = getTeam(row.teamId);
          if (!team) return null;
          return (
            <li key={row.teamId} className="sp-solid p-3">
              <div className="flex items-center gap-3">
                <span
                  className="sp-mono w-6 shrink-0 text-center text-sm font-bold"
                  style={{ color: row.zone ? zoneColor[row.zone] : undefined }}
                >
                  {row.rank}
                </span>
                <Crest {...team.crest} size={24} />
                <Link
                  href={href(locale, `/teams/${team.slug}`)}
                  className="text-ink min-w-0 flex-1 truncate text-sm"
                >
                  {text(team.name, locale)}
                </Link>
                <span className="sp-mono text-ink-faint text-[0.6875rem]">
                  {formatChange(row.change)}
                </span>
              </div>
              <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.6875rem]">
                {primaryColumns.map((column) => (
                  <div key={column.key} className="flex gap-1">
                    <dt className="text-ink-faint">{text(column.label, locale)}</dt>
                    <dd className="sp-mono text-ink">{row.values[column.key] ?? "—"}</dd>
                  </div>
                ))}
              </dl>
              {row.form ? (
                <div className="mt-2">
                  <FormStrip form={row.form} />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {/* 表表示 */}
      <div
        className={`sp-scroll-x border-edge rounded-xl border ${mode === "cards" ? "hidden sm:block" : ""}`}
      >
        <table className="w-full min-w-[38rem] text-sm">
          <caption className="sr-only">{standing.group ?? dict.sectionStandings}</caption>
          <thead>
            <tr className="border-edge text-ink-faint border-b text-[0.6875rem]">
              <th scope="col" className="px-3 py-2 text-left font-normal">
                {dict.rank}
              </th>
              <th scope="col" className="px-3 py-2 text-left font-normal">
                {dict.team}
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="sp-mono px-2 py-2 text-right font-normal"
                >
                  {text(column.label, locale)}
                </th>
              ))}
              <th scope="col" className="px-3 py-2 text-left font-normal">
                {dict.form}
              </th>
            </tr>
          </thead>
          <tbody>
            {standing.rows.map((row) => {
              const team = getTeam(row.teamId);
              if (!team) return null;
              return (
                <tr
                  key={row.teamId}
                  className="border-edge/60 hover:bg-edge/25 border-b last:border-0"
                >
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-4 w-0.5 rounded-full"
                        style={{ background: row.zone ? zoneColor[row.zone] : "transparent" }}
                        aria-hidden="true"
                      />
                      <span className="sp-mono text-ink font-bold">{row.rank}</span>
                      <span
                        className={`sp-mono text-[0.625rem] ${
                          row.change > 0
                            ? "text-neon"
                            : row.change < 0
                              ? "text-live"
                              : "text-ink-faint"
                        }`}
                      >
                        {formatChange(row.change)}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={href(locale, `/teams/${team.slug}`)}
                      className="hover:text-cyan flex items-center gap-2"
                    >
                      <Crest {...team.crest} size={20} />
                      <span className="truncate">{text(team.name, locale)}</span>
                    </Link>
                  </td>
                  {columns.map((column) => (
                    <td key={column.key} className="sp-mono text-ink-soft px-2 py-2 text-right">
                      {row.values[column.key] ?? "—"}
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <FormStrip form={row.form} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
