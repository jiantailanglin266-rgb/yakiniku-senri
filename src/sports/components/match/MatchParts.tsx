/**
 * 試合表示の部品。
 *
 * 競技ごとの差分（ピリオドの呼び方・スタッツ項目）は Sport 設定から読むため、
 * 競技を増やしてもこのファイルは変更不要です。
 */
import Link from "next/link";
import type { Match, Sport, Team, LocalizedText } from "../../types";
import { getTeam, getVenue } from "../../data/teams";
import { getLeague } from "../../data/leagues";
import { getSport } from "../../data/sports";
import { getDictionary, text } from "../../i18n";
import { href } from "../../lib/url";
import { Badge, Crest, LiveDot } from "../ui/primitives";
import { LocalTime } from "../ui/LocalTime";

export function statusLabel(status: Match["status"], locale: string): string {
  const dict = getDictionary(locale);
  const map: Record<Match["status"], string> = {
    scheduled: dict.statusScheduled,
    live: dict.statusLive,
    break: dict.statusBreak,
    extra: dict.statusExtra,
    finished: dict.statusFinished,
    postponed: dict.statusPostponed,
    cancelled: dict.statusCancelled,
  };
  return map[status];
}

export function StatusBadge({ match, locale }: { match: Match; locale: string }) {
  const live = match.status === "live" || match.status === "break" || match.status === "extra";
  const tone = live
    ? "live"
    : match.status === "finished"
      ? "neutral"
      : match.status === "scheduled"
        ? "accent"
        : "caution";
  return (
    <Badge tone={tone}>
      {live ? <LiveDot /> : null}
      {statusLabel(match.status, locale)}
      {match.clock ? <span className="tnum ml-1">{match.clock}</span> : null}
    </Badge>
  );
}

/* ------------------------------------------------------------------
   試合カード
   ------------------------------------------------------------------ */
export function MatchCard({
  match,
  locale,
  compact = false,
}: {
  match: Match;
  locale: string;
  compact?: boolean;
}) {
  const home = getTeam(match.homeTeamId);
  const away = getTeam(match.awayTeamId);
  const league = getLeague(match.leagueId);
  const sport = getSport(match.sportId);
  const dict = getDictionary(locale);
  const decided = match.homeScore !== null && match.awayScore !== null;

  return (
    <Link
      href={href(locale, `/matches/${match.slug}`)}
      className="sp-solid sp-tilt focus-visible:outline-cyan block p-4"
      style={{
        borderColor:
          match.status === "live"
            ? "color-mix(in oklab, var(--color-live) 45%, var(--color-edge))"
            : undefined,
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span
          className="sp-mono truncate text-[0.625rem] tracking-wider uppercase"
          style={{ color: sport?.accent }}
        >
          {sport?.glyph} {league ? text(league.name, locale) : ""}
        </span>
        <StatusBadge match={match} locale={locale} />
      </div>

      <div className="space-y-2">
        <TeamRow
          team={home}
          score={match.homeScore}
          locale={locale}
          winner={decided && (match.homeScore ?? 0) > (match.awayScore ?? 0)}
        />
        <TeamRow
          team={away}
          score={match.awayScore}
          locale={locale}
          winner={decided && (match.awayScore ?? 0) > (match.homeScore ?? 0)}
        />
      </div>

      {compact ? null : (
        <div className="border-edge text-ink-faint mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-3 text-[0.6875rem]">
          <LocalTime iso={match.kickoff} locale={locale} className="sp-mono" />
          {match.round ? <span>{text(match.round, locale)}</span> : null}
          {match.venueId ? (
            <span className="truncate">{text(getVenue(match.venueId)?.name, locale)}</span>
          ) : null}
          {match.broadcastIds.length > 0 ? (
            <span className="text-cyan">{dict.whereToWatch}</span>
          ) : null}
        </div>
      )}
    </Link>
  );
}

function TeamRow({
  team,
  score,
  locale,
  winner,
}: {
  team: Team | undefined;
  score: number | null;
  locale: string;
  winner: boolean;
}) {
  if (!team) return null;
  return (
    <div className="flex items-center gap-3">
      <Crest {...team.crest} size={26} />
      <span
        className={`min-w-0 flex-1 truncate text-sm ${winner ? "text-ink font-bold" : "text-ink-soft"}`}
      >
        {text(team.name, locale)}
      </span>
      <span
        className={`sp-mono text-lg ${winner ? "text-ink font-extrabold" : "text-ink-dim"}`}
        data-score
      >
        {score ?? "–"}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------
   スコアボード（試合詳細ページの主役）
   ------------------------------------------------------------------ */
export function Scoreboard({ match, locale }: { match: Match; locale: string }) {
  const home = getTeam(match.homeTeamId);
  const away = getTeam(match.awayTeamId);
  const dict = getDictionary(locale);

  return (
    <div className="sp-solid overflow-hidden">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-5 sm:gap-6 sm:p-8">
        <SideBlock team={home} locale={locale} align="start" label={dict.homeTeam} />
        <div className="text-center">
          <div
            className="sp-mono text-ink text-4xl leading-none font-extrabold sm:text-6xl"
            data-score
          >
            {match.homeScore ?? "–"}
            <span className="text-ink-faint mx-2">:</span>
            {match.awayScore ?? "–"}
          </div>
          <div className="mt-3 flex justify-center">
            <StatusBadge match={match} locale={locale} />
          </div>
        </div>
        <SideBlock team={away} locale={locale} align="end" label={dict.awayTeam} />
      </div>

      {match.periodScores?.length ? (
        <div className="sp-scroll-x border-edge border-t">
          <table className="w-full min-w-[22rem] text-center text-xs">
            <thead>
              <tr className="text-ink-faint">
                <th className="px-3 py-2 text-left font-normal">{dict.team}</th>
                {match.periodScores.map((period) => (
                  <th key={period.label} className="sp-mono px-3 py-2 font-normal">
                    {period.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-ink-soft">
              <tr className="border-edge border-t">
                <td className="truncate px-3 py-2 text-left">
                  {home ? text(home.name, locale) : ""}
                </td>
                {match.periodScores.map((period) => (
                  <td key={period.label} className="sp-mono px-3 py-2">
                    {period.home}
                  </td>
                ))}
              </tr>
              <tr className="border-edge border-t">
                <td className="truncate px-3 py-2 text-left">
                  {away ? text(away.name, locale) : ""}
                </td>
                {match.periodScores.map((period) => (
                  <td key={period.label} className="sp-mono px-3 py-2">
                    {period.away}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function SideBlock({
  team,
  locale,
  align,
  label,
}: {
  team: Team | undefined;
  locale: string;
  align: "start" | "end";
  label: string;
}) {
  if (!team) return <div />;
  return (
    <Link
      href={href(locale, `/teams/${team.slug}`)}
      className={`flex min-w-0 flex-col items-center gap-2 sm:flex-row sm:gap-4 ${
        align === "end" ? "sm:flex-row-reverse sm:text-right" : ""
      }`}
    >
      <Crest {...team.crest} size={56} label={text(team.name, locale)} />
      <span className="min-w-0">
        <span className="sp-eyebrow block">{label}</span>
        <span className="text-ink block truncate text-sm font-semibold sm:text-lg">
          {text(team.name, locale)}
        </span>
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------
   タイムライン
   ------------------------------------------------------------------ */
const eventGlyph: Record<string, string> = {
  goal: "⚽",
  assist: "🅰",
  yellow: "🟨",
  red: "🟥",
  substitution: "⇄",
  penalty: "◎",
  period: "⏱",
  timeout: "⏸",
  score: "●",
  info: "ℹ",
};

export function Timeline({ match, locale }: { match: Match; locale: string }) {
  if (match.events.length === 0) return null;
  return (
    <ol className="border-edge relative space-y-3 border-l pl-5">
      {match.events.map((event) => (
        <li key={event.id} className="relative">
          <span
            className="border-edge bg-panel absolute top-1.5 -left-[1.6rem] grid size-5 place-items-center rounded-full border text-[0.625rem]"
            aria-hidden="true"
          >
            {eventGlyph[event.type] ?? "•"}
          </span>
          <div className="flex flex-wrap items-baseline gap-x-3">
            <span className="sp-mono text-cyan text-xs">{event.clock}</span>
            <span className="text-ink-soft text-sm">{text(event.text, locale)}</span>
            {event.side !== "neutral" ? (
              <span className="sp-mono text-ink-faint text-[0.625rem] uppercase">
                {event.side === "home" ? "H" : "A"}
              </span>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------
   スタッツ比較バー
   ------------------------------------------------------------------ */
export function StatBars({
  match,
  sport,
  locale,
}: {
  match: Match;
  sport: Sport | undefined;
  locale: string;
}) {
  if (!match.statistics?.length || !sport) return null;

  return (
    <div className="space-y-4">
      {match.statistics.map((entry) => {
        const definition = sport.statKeys.find((item) => item.key === entry.key);
        if (!definition) return null;
        const total = entry.home + entry.away || 1;
        const homeRatio = definition.percentage
          ? entry.home
          : Math.round((entry.home / total) * 100);
        const awayRatio = definition.percentage ? entry.away : 100 - homeRatio;

        return (
          <div key={entry.key}>
            <div className="mb-1 flex items-baseline justify-between text-xs">
              <span className="sp-mono text-ink font-semibold">
                {entry.home}
                {definition.percentage ? "%" : ""}
              </span>
              <span className="text-ink-dim">
                {text(definition.label as LocalizedText, locale)}
              </span>
              <span className="sp-mono text-ink font-semibold">
                {entry.away}
                {definition.percentage ? "%" : ""}
              </span>
            </div>
            <div className="bg-edge flex h-1.5 overflow-hidden rounded-full">
              <div className="bg-cyan" style={{ width: `${homeRatio}%` }} />
              <div className="bg-magenta ml-auto" style={{ width: `${awayRatio}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------
   直近成績（W/L/D）
   ------------------------------------------------------------------ */
export function FormStrip({ form }: { form: ("W" | "L" | "D" | "O")[] | undefined }) {
  if (!form?.length) return null;
  const tone: Record<string, string> = {
    W: "bg-neon/80 text-void",
    L: "bg-live/80 text-void",
    D: "bg-ink-faint/70 text-void",
    O: "bg-caution/80 text-void",
  };
  return (
    <span className="flex gap-1">
      {form.map((item, index) => (
        <span
          key={`${item}-${index}`}
          className={`sp-mono grid size-4 place-items-center rounded-sm text-[0.5625rem] font-bold ${tone[item]}`}
        >
          {item}
        </span>
      ))}
    </span>
  );
}
