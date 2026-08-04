import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { findLocale, getDictionary, localeCodes, text } from "@/sports/i18n";
import { resolveLocale } from "@/sports/lib/page";
import { sportsMetadata } from "@/sports/lib/seo";
import { href } from "@/sports/lib/url";
import { matches, getMatchBySlug, matchesByTeam } from "@/sports/data/matches";
import { getTeam, getVenue } from "@/sports/data/teams";
import { getLeague } from "@/sports/data/leagues";
import { getSport } from "@/sports/data/sports";
import { streamingForIds } from "@/sports/data/streaming";
import { newsByMatch } from "@/sports/data/news";
import { videosByMatch, getVideo } from "@/sports/data/videos";
import { standingsByLeague, formOf } from "@/sports/data/standings";
import { faqsFor } from "@/sports/data/content";

import {
  FormStrip,
  Scoreboard,
  StatBars,
  Timeline,
  statusLabel,
} from "@/sports/components/match/MatchParts";
import { WatchOptions } from "@/sports/components/streaming/StreamingTable";
import { NewsCard, VideoCard } from "@/sports/components/cards/Cards";
import {
  Badge,
  Breadcrumbs,
  Crest,
  FaqList,
  JsonLd,
  SectionHeading,
  StampLine,
} from "@/sports/components/ui/primitives";
import { LocalTime } from "@/sports/components/ui/LocalTime";
import { breadcrumbJsonLd, faqJsonLd, sportsEventJsonLd } from "@/sports/lib/structured-data";

export function generateStaticParams() {
  return localeCodes.flatMap((locale) => matches.map((match) => ({ locale, slug: match.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const info = findLocale(locale);
  const match = getMatchBySlug(slug);
  if (!info || !match) return {};

  const dict = getDictionary(info.code);
  const home = getTeam(match.homeTeamId);
  const away = getTeam(match.awayTeamId);
  const league = getLeague(match.leagueId);
  const title = `${text(home?.name, info.code)} vs ${text(away?.name, info.code)}`;

  const description =
    match.status === "finished"
      ? `${title}（${text(league?.name, info.code)}）の試合結果・タイムライン・スタッツ・ハイライト。`
      : `${title}（${text(league?.name, info.code)}）の${dict.kickoff}・${dict.whereToWatch}・${dict.recentForm}・${dict.headToHead}。`;

  return sportsMetadata({
    locale: info.code,
    path: `/matches/${match.slug}`,
    title,
    description:
      info.code === "ja"
        ? description
        : `${title} — ${text(league?.name, info.code)}: score, timeline, stats and how to watch.`,
    type: "article",
    modifiedTime: match.stamp.fetchedAt,
  });
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const info = findLocale(raw);
  if (!info) notFound();
  const match = getMatchBySlug(slug);
  if (!match) notFound();

  const { locale, dict, t } = await resolveLocale(params);

  const home = getTeam(match.homeTeamId);
  const away = getTeam(match.awayTeamId);
  const league = getLeague(match.leagueId);
  const sport = getSport(match.sportId);
  const venue = getVenue(match.venueId);
  const services = streamingForIds(match.broadcastIds);
  const related = newsByMatch(match.id);
  const clips = videosByMatch(match.id);
  const highlight = getVideo(match.highlightVideoId);
  const standing = standingsByLeague(match.leagueId)[0];
  const faqs = faqsFor("matches");

  const isBefore = match.status === "scheduled" || match.status === "postponed";
  const isLive = match.status === "live" || match.status === "break" || match.status === "extra";
  const isAfter = match.status === "finished";

  // 過去の対戦（同じ2チームの他の試合）
  const headToHead = home
    ? matchesByTeam(home.id).filter(
        (item) =>
          item.id !== match.id &&
          (item.homeTeamId === away?.id || item.awayTeamId === away?.id) &&
          item.status === "finished",
      )
    : [];

  const trail = [
    { label: "HOME", path: "/" },
    { label: dict.navMatches, path: "/matches" },
    { label: `${t(home?.name)} vs ${t(away?.name)}`, path: `/matches/${match.slug}` },
  ];

  const rankRow = (teamId: string) => standing?.rows.find((row) => row.teamId === teamId);

  return (
    <>
      <Breadcrumbs locale={locale} trail={trail} />

      <header className="mb-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {league ? (
            <Link
              href={href(locale, `/leagues/${league.slug}`)}
              className="sp-mono hover:text-cyan text-[0.6875rem] tracking-wider uppercase transition-colors"
              style={{ color: sport?.accent }}
            >
              {sport?.glyph} {t(league.name)}
            </Link>
          ) : null}
          {match.round ? <Badge>{t(match.round)}</Badge> : null}
          <Badge>{match.season}</Badge>
        </div>
        <h1 className="text-ink text-2xl font-extrabold sm:text-4xl">
          {t(home?.name)} <span className="text-ink-faint">vs</span> {t(away?.name)}
        </h1>
        <p className="sp-mono text-ink-dim mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span>
            {dict.kickoff}: <LocalTime iso={match.kickoff} locale={locale} />
          </span>
          {venue ? (
            <span>
              {dict.venue}: {t(venue.name)}, {t(venue.city)}
            </span>
          ) : null}
          <span>
            {locale === "ja" ? "状況" : "Status"}: {statusLabel(match.status, locale)}
          </span>
        </p>
      </header>

      {/* 試合前 / 試合中 / 試合後で情報の優先順位を変えます */}
      <div className="mb-8">
        <Scoreboard match={match} locale={locale} />
        <StampLine stamp={match.stamp} locale={locale} />
      </div>

      <div className="mb-6 flex flex-wrap gap-1.5">
        <Badge tone={isBefore ? "accent" : "neutral"}>{dict.beforeMatch}</Badge>
        <Badge tone={isLive ? "live" : "neutral"}>{dict.duringMatch}</Badge>
        <Badge tone={isAfter ? "success" : "neutral"}>{dict.afterMatch}</Badge>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-10">
          {/* 見どころ / 試合分析 */}
          {isAfter && match.report ? (
            <section aria-labelledby="d-report">
              <SectionHeading id="d-report" eyebrow="REPORT" title={dict.report} />
              <p className="text-ink-soft text-sm leading-relaxed">{t(match.report)}</p>
            </section>
          ) : null}

          {match.preview ? (
            <section aria-labelledby="d-preview">
              <SectionHeading id="d-preview" eyebrow="PREVIEW" title={dict.preview} />
              <p className="text-ink-soft text-sm leading-relaxed">{t(match.preview)}</p>
            </section>
          ) : null}

          {/* タイムライン */}
          {match.events.length > 0 ? (
            <section aria-labelledby="d-timeline">
              <SectionHeading id="d-timeline" eyebrow="TIMELINE" title={dict.timeline} />
              <Timeline match={match} locale={locale} />
            </section>
          ) : null}

          {/* スタッツ */}
          {match.statistics?.length ? (
            <section aria-labelledby="d-stats">
              <SectionHeading id="d-stats" eyebrow="STATS" title={dict.teamStats} />
              <div className="sp-solid p-5">
                <StatBars match={match} sport={sport} locale={locale} />
              </div>
            </section>
          ) : null}

          {/* スターティングメンバー */}
          {match.lineups ? (
            <section aria-labelledby="d-lineups">
              <SectionHeading
                id="d-lineups"
                eyebrow="LINE-UPS"
                title={match.predictedLineup ? dict.predictedLineups : dict.lineups}
                description={match.predictedLineup ? dict.predictedLineupsNote : undefined}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                {(["home", "away"] as const).map((side) => {
                  const team = side === "home" ? home : away;
                  const entries = match.lineups?.[side] ?? [];
                  return (
                    <div key={side} className="sp-solid p-4">
                      <p className="text-ink mb-3 flex items-center gap-2 text-sm font-semibold">
                        {team ? <Crest {...team.crest} size={22} /> : null}
                        {t(team?.name)}
                      </p>
                      <ul className="space-y-1.5">
                        {entries.map((entry, index) => (
                          <li
                            key={`${entry.name}-${index}`}
                            className="flex items-center gap-2 text-xs"
                          >
                            <span className="sp-mono text-ink-faint w-6">
                              {entry.number ?? "–"}
                            </span>
                            <span className="text-ink-soft min-w-0 flex-1 truncate">
                              {entry.name}
                            </span>
                            <span className="sp-mono text-ink-faint text-[0.625rem]">
                              {entry.position ?? ""} {entry.starter ? "" : `· ${dict.bench}`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {/* 過去の対戦 */}
          {headToHead.length > 0 ? (
            <section aria-labelledby="d-h2h">
              <SectionHeading id="d-h2h" eyebrow="H2H" title={dict.headToHead} />
              <ul className="space-y-2">
                {headToHead.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={href(locale, `/matches/${item.slug}`)}
                      className="sp-solid hover:border-cyan/50 flex items-center justify-between gap-3 p-3 text-sm transition-colors"
                    >
                      <span className="text-ink-soft truncate">
                        {text(getTeam(item.homeTeamId)?.name, locale)} {item.homeScore}–
                        {item.awayScore} {text(getTeam(item.awayTeamId)?.name, locale)}
                      </span>
                      <LocalTime
                        iso={item.kickoff}
                        locale={locale}
                        kind="date"
                        className="sp-mono text-ink-faint shrink-0 text-xs"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* ハイライト・関連動画 */}
          {highlight || clips.length > 0 ? (
            <section aria-labelledby="d-videos">
              <SectionHeading
                id="d-videos"
                eyebrow="VIDEO"
                title={isAfter ? dict.highlights : dict.relatedVideos}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                {[highlight, ...clips]
                  .filter(
                    (video, index, list) =>
                      video && list.findIndex((item) => item?.id === video.id) === index,
                  )
                  .map((video) =>
                    video ? <VideoCard key={video.id} video={video} locale={locale} /> : null,
                  )}
              </div>
            </section>
          ) : null}

          {/* 関連ニュース */}
          {related.length > 0 ? (
            <section aria-labelledby="d-news">
              <SectionHeading id="d-news" eyebrow="NEWS" title={dict.relatedNews} />
              <div className="grid gap-4 sm:grid-cols-2">
                {related.map((article) => (
                  <NewsCard key={article.id} article={article} locale={locale} />
                ))}
              </div>
            </section>
          ) : null}

          <section aria-labelledby="d-faq">
            <SectionHeading id="d-faq" eyebrow="FAQ" title={dict.sectionFaq} />
            <FaqList items={faqs} locale={locale} t={t} />
          </section>
        </div>

        {/* サイドバー：視聴方法・順位・直近成績 */}
        <aside className="space-y-8">
          <section aria-labelledby="d-watch">
            <SectionHeading id="d-watch" eyebrow="WATCH" title={dict.whereToWatch} />
            <WatchOptions services={services} locale={locale} placement="match-detail" />
          </section>

          <section aria-labelledby="d-form">
            <SectionHeading id="d-form" eyebrow="FORM" title={dict.recentForm} />
            <ul className="space-y-2">
              {[home, away].map((team) =>
                team ? (
                  <li
                    key={team.id}
                    className="sp-solid flex items-center justify-between gap-3 p-3"
                  >
                    <Link
                      href={href(locale, `/teams/${team.slug}`)}
                      className="flex min-w-0 items-center gap-2"
                    >
                      <Crest {...team.crest} size={22} />
                      <span className="text-ink-soft truncate text-sm">{t(team.name)}</span>
                    </Link>
                    <span className="flex shrink-0 items-center gap-2">
                      {rankRow(team.id) ? (
                        <span className="sp-mono text-ink-faint text-[0.6875rem]">
                          {dict.rank} {rankRow(team.id)?.rank}
                        </span>
                      ) : null}
                      <FormStrip form={formOf(team.id)} />
                    </span>
                  </li>
                ) : null,
              )}
            </ul>
          </section>

          {league ? (
            <section aria-labelledby="d-league">
              <SectionHeading id="d-league" eyebrow="LEAGUE" title={t(league.name)} />
              <Link
                href={href(locale, `/leagues/${league.slug}`)}
                className="sp-solid text-ink-soft hover:border-cyan/50 block p-4 text-sm transition-colors"
              >
                {t(league.description)}
                <span className="text-cyan mt-2 block">{dict.sectionStandings} →</span>
              </Link>
            </section>
          ) : null}
        </aside>
      </div>

      <JsonLd
        data={[
          breadcrumbJsonLd(locale, trail),
          sportsEventJsonLd(locale, match),
          faqJsonLd(faqs.map((faq) => ({ question: t(faq.question), answer: t(faq.answer) }))),
        ]}
      />
    </>
  );
}
