/**
 * ファーストビュー。
 *
 * 「開いた瞬間に、世界中で試合が動いていることが分かる」ことを最優先にしています。
 * そのため装飾より先に、進行中の試合数と当日の試合数を数字で出します。
 */
import Link from "next/link";
import { brand } from "../../config/site";
import { getDictionary, text } from "../../i18n";
import type { Locale } from "../../i18n/locales";
import { href } from "../../lib/url";
import { getTeam } from "../../data/teams";
import { getLeague } from "../../data/leagues";
import { getSport } from "../../data/sports";
import type { Match } from "../../types";
import { HeroStage } from "./HeroStage";
import { Badge, Crest, LiveDot } from "../ui/primitives";
import { LocalTime } from "../ui/LocalTime";

export function Hero({
  locale,
  liveMatches,
  todayCount,
  leagueCount,
  sportCount,
}: {
  locale: Locale;
  liveMatches: Match[];
  todayCount: number;
  leagueCount: number;
  sportCount: number;
}) {
  const dict = getDictionary(locale.code);
  const featured = liveMatches[0];
  const home = featured ? getTeam(featured.homeTeamId) : undefined;
  const away = featured ? getTeam(featured.awayTeamId) : undefined;
  const league = featured ? getLeague(featured.leagueId) : undefined;
  const sport = featured ? getSport(featured.sportId) : undefined;

  const stats = [
    { value: liveMatches.length, label: dict.liveNow, accent: "var(--color-live)" },
    { value: todayCount, label: dict.todayMatches, accent: "var(--color-cyan)" },
    { value: leagueCount, label: dict.navLeagues, accent: "var(--color-indigo)" },
    { value: sportCount, label: dict.sectionSports, accent: "var(--color-magenta)" },
  ];

  return (
    <section className="sp-stage relative -mx-4 mb-14 overflow-hidden px-4 py-14 sm:-mx-6 sm:px-6 sm:py-20">
      <div className="sp-floodlight" aria-hidden="true" />
      <div className="sp-pitch" aria-hidden="true" />
      <HeroStage />

      <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
        <div>
          <p className="sp-eyebrow mb-4 flex items-center gap-2">
            <LiveDot />
            {brand.name} —{" "}
            {locale.code === "ja" ? "スポーツデータターミナル" : "Sports data terminal"}
          </p>

          <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="sp-gradient-text sp-anim-sheen">{dict.siteTagline}</span>
          </h1>

          <p className="text-ink-soft mt-5 max-w-xl text-sm leading-relaxed sm:text-base">
            {dict.siteSubCopy}
          </p>

          <div className="mt-8 flex flex-wrap gap-2.5">
            <Link
              href={href(locale.code, "/live")}
              className="from-cyan to-indigo text-void rounded-xl bg-linear-to-r px-5 py-3 text-sm font-bold shadow-[0_0_2rem_-0.5rem_var(--color-cyan)] transition-transform hover:scale-[1.02]"
            >
              {dict.ctaLiveScores}
            </Link>
            <Link
              href={href(locale.code, "/matches")}
              className="border-edge text-ink hover:border-cyan/60 hover:text-cyan rounded-xl border px-5 py-3 text-sm transition-colors"
            >
              {dict.ctaTodayMatches}
            </Link>
            <Link
              href={href(locale.code, "/streaming")}
              className="border-edge text-ink hover:border-cyan/60 hover:text-cyan rounded-xl border px-5 py-3 text-sm transition-colors"
            >
              {dict.ctaCompareStreaming}
            </Link>
            <Link
              href={href(locale.code, "/diagnosis/your-sport")}
              className="border-edge text-ink hover:border-magenta/60 hover:text-magenta rounded-xl border px-5 py-3 text-sm transition-colors"
            >
              {dict.ctaFindYourSport}
            </Link>
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="sp-glass px-4 py-3">
                <dd className="sp-mono text-2xl font-extrabold" style={{ color: stat.accent }}>
                  {stat.value}
                </dd>
                <dt className="text-ink-faint mt-0.5 text-[0.6875rem]">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </div>

        {/* 浮遊するスコアカード（ホログラム風） */}
        {featured && home && away ? (
          <div className="relative">
            <Link
              href={href(locale.code, `/matches/${featured.slug}`)}
              className="sp-glass sp-holo sp-tilt block p-6"
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <span
                  className="sp-mono text-[0.625rem] tracking-wider uppercase"
                  style={{ color: sport?.accent }}
                >
                  {sport?.glyph} {league ? text(league.name, locale.code) : ""}
                </span>
                <Badge tone="live">
                  <LiveDot />
                  {dict.liveNow} {featured.clock}
                </Badge>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="flex flex-col items-center gap-2 text-center">
                  <Crest {...home.crest} size={52} />
                  <span className="text-ink-soft line-clamp-2 text-xs">
                    {text(home.name, locale.code)}
                  </span>
                </div>
                <div className="sp-mono text-ink text-4xl font-extrabold" data-score>
                  {featured.homeScore}
                  <span className="text-ink-faint mx-1.5">:</span>
                  {featured.awayScore}
                </div>
                <div className="flex flex-col items-center gap-2 text-center">
                  <Crest {...away.crest} size={52} />
                  <span className="text-ink-soft line-clamp-2 text-xs">
                    {text(away.name, locale.code)}
                  </span>
                </div>
              </div>

              <p className="sp-mono border-edge text-ink-faint mt-5 border-t pt-3 text-[0.625rem]">
                {dict.lastUpdated}:{" "}
                <LocalTime iso={featured.stamp.fetchedAt} locale={locale.code} />
              </p>
            </Link>

            {/* 背後に浮かぶ薄いカード（レイヤー感） */}
            <div
              className="border-edge/60 bg-panel/40 absolute inset-x-6 -bottom-4 -z-10 h-16 rounded-2xl border"
              aria-hidden="true"
            />
            <div
              className="border-edge/40 bg-panel/20 absolute inset-x-12 -bottom-8 -z-20 h-16 rounded-2xl border"
              aria-hidden="true"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
