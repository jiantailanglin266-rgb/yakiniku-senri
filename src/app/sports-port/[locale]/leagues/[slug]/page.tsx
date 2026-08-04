import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { findLocale, getDictionary, localeCodes, text } from "@/sports/i18n";
import { resolveLocale } from "@/sports/lib/page";
import { sportsMetadata } from "@/sports/lib/seo";
import { leagues, getLeagueBySlug } from "@/sports/data/leagues";
import { getSport } from "@/sports/data/sports";
import { teamsByLeague } from "@/sports/data/teams";
import { standingsByLeague } from "@/sports/data/standings";
import { matchesByLeague, byKickoffAsc, byKickoffDesc } from "@/sports/data/matches";
import { newsByLeague } from "@/sports/data/news";
import { videosByLeague } from "@/sports/data/videos";
import { streamingForLeague } from "@/sports/data/streaming";
import { players } from "@/sports/data/players";
import { faqsFor } from "@/sports/data/content";

import { StandingsTable } from "@/sports/components/standings/StandingsTable";
import { MatchCard } from "@/sports/components/match/MatchParts";
import { NewsCard, PlayerCard, TeamCard, VideoCard } from "@/sports/components/cards/Cards";
import { WatchOptions } from "@/sports/components/streaming/StreamingTable";
import {
  Badge,
  Breadcrumbs,
  FaqList,
  JsonLd,
  SectionHeading,
  StampLine,
} from "@/sports/components/ui/primitives";
import { breadcrumbJsonLd, faqJsonLd } from "@/sports/lib/structured-data";

export function generateStaticParams() {
  return localeCodes.flatMap((locale) => leagues.map((league) => ({ locale, slug: league.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const info = findLocale(locale);
  const league = getLeagueBySlug(slug);
  if (!info || !league) return {};
  const dict = getDictionary(info.code);
  return sportsMetadata({
    locale: info.code,
    path: `/leagues/${league.slug}`,
    title: `${text(league.name, info.code)}（${league.season}）`,
    description: `${text(league.description, info.code)} ${dict.sectionStandings}・${dict.sectionSchedule}・${dict.sectionResults}・${dict.whereToWatch}。`,
  });
}

export default async function LeagueDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!findLocale(raw)) notFound();
  const league = getLeagueBySlug(slug);
  if (!league) notFound();

  const { locale, dict, t } = await resolveLocale(params);

  const sport = getSport(league.sportId);
  const tables = standingsByLeague(league.id);
  const teams = teamsByLeague(league.id);
  const all = matchesByLeague(league.id);
  const upcoming = all.filter((match) => match.status !== "finished").sort(byKickoffAsc);
  const results = all.filter((match) => match.status === "finished").sort(byKickoffDesc);
  const news = newsByLeague(league.id);
  const videos = videosByLeague(league.id);
  const services = streamingForLeague(league.id);
  const leaguePlayers = players.filter((player) => teams.some((team) => team.id === player.teamId));
  const faqs = faqsFor("leagues");

  const trail = [
    { label: "HOME", path: "/" },
    { label: dict.navLeagues, path: "/leagues" },
    { label: t(league.name), path: `/leagues/${league.slug}` },
  ];

  return (
    <>
      <Breadcrumbs locale={locale} trail={trail} />

      <header className="mb-10">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className="sp-mono text-[0.6875rem] tracking-wider uppercase"
            style={{ color: league.accent }}
          >
            {sport?.glyph} {t(sport?.name)}
          </span>
          <Badge>{league.shortName}</Badge>
          <Badge>{league.season}</Badge>
          <Badge>{league.format}</Badge>
          <Badge>{league.country.toUpperCase()}</Badge>
        </div>
        <h1 className="text-ink text-3xl font-extrabold sm:text-4xl">{t(league.name)}</h1>
        <p className="text-ink-dim mt-3 max-w-3xl text-sm leading-relaxed">
          {t(league.description)}
        </p>
        <p className="sp-mono text-ink-faint mt-3 text-xs">
          {dict.season}: {league.seasonStart} 〜 {league.seasonEnd}
          {league.teamCount ? ` · ${league.teamCount} ${dict.team}` : ""}
        </p>
      </header>

      {tables.length > 0 && sport ? (
        <section aria-labelledby="l-standings" className="mb-12">
          <SectionHeading id="l-standings" eyebrow="STANDINGS" title={dict.sectionStandings} />
          <div className="space-y-8">
            {tables.map((table, index) => (
              <StandingsTable
                key={`${table.leagueId}-${index}`}
                standing={table}
                sport={sport}
                locale={locale}
              />
            ))}
          </div>
          <StampLine stamp={tables[0].stamp} locale={locale} />
        </section>
      ) : null}

      {upcoming.length > 0 ? (
        <section aria-labelledby="l-schedule" className="mb-12">
          <SectionHeading id="l-schedule" eyebrow="SCHEDULE" title={dict.sectionSchedule} />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {upcoming.map((match) => (
              <MatchCard key={match.id} match={match} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      {results.length > 0 ? (
        <section aria-labelledby="l-results" className="mb-12">
          <SectionHeading id="l-results" eyebrow="RESULTS" title={dict.sectionResults} />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((match) => (
              <MatchCard key={match.id} match={match} locale={locale} compact />
            ))}
          </div>
        </section>
      ) : null}

      {teams.length > 0 ? (
        <section aria-labelledby="l-teams" className="mb-12">
          <SectionHeading id="l-teams" eyebrow="TEAMS" title={dict.sectionTeamRanking} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <TeamCard key={team.id} team={team} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      {leaguePlayers.length > 0 ? (
        <section aria-labelledby="l-players" className="mb-12">
          <SectionHeading id="l-players" eyebrow="PLAYERS" title={dict.sectionPlayerRanking} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {leaguePlayers.map((player) => (
              <PlayerCard key={player.id} player={player} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      {services.length > 0 ? (
        <section aria-labelledby="l-watch" className="mb-12">
          <SectionHeading id="l-watch" eyebrow="WATCH" title={dict.whereToWatch} />
          <WatchOptions services={services} locale={locale} placement="league-detail" />
        </section>
      ) : null}

      {news.length > 0 ? (
        <section aria-labelledby="l-news" className="mb-12">
          <SectionHeading id="l-news" eyebrow="NEWS" title={dict.sectionNews} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((article) => (
              <NewsCard key={article.id} article={article} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      {videos.length > 0 ? (
        <section aria-labelledby="l-videos" className="mb-12">
          <SectionHeading id="l-videos" eyebrow="VIDEOS" title={dict.sectionVideos} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      {league.honours?.length ? (
        <section aria-labelledby="l-honours" className="mb-12">
          <SectionHeading
            id="l-honours"
            eyebrow="HONOURS"
            title={locale === "ja" ? "歴代優勝" : "Past champions"}
          />
          <ul className="sp-solid divide-edge divide-y">
            {league.honours.map((item) => (
              <li
                key={item.season}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
              >
                <span className="sp-mono text-ink-faint">{item.season}</span>
                <span className="text-ink-soft">{item.teamName}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="l-faq">
        <SectionHeading id="l-faq" eyebrow="FAQ" title={dict.sectionFaq} />
        <FaqList items={faqs} locale={locale} t={t} />
      </section>

      <JsonLd
        data={[
          breadcrumbJsonLd(locale, trail),
          faqJsonLd(faqs.map((faq) => ({ question: t(faq.question), answer: t(faq.answer) }))),
        ]}
      />
    </>
  );
}
