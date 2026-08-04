import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { findLocale, localeCodes, text } from "@/sports/i18n";
import { resolveLocale } from "@/sports/lib/page";
import { sportsMetadata } from "@/sports/lib/seo";
import { href } from "@/sports/lib/url";
import { teams, getTeamBySlug, getVenue } from "@/sports/data/teams";
import { getLeague } from "@/sports/data/leagues";
import { getSport } from "@/sports/data/sports";
import { matchesByTeam, byKickoffAsc, byKickoffDesc } from "@/sports/data/matches";
import { playersByTeam } from "@/sports/data/players";
import { newsByTeam } from "@/sports/data/news";
import { videosByTeam } from "@/sports/data/videos";
import { rankOf, formOf } from "@/sports/data/standings";
import { fanTokens } from "@/sports/data/web3";
import { resolveAffiliateUrl } from "@/sports/data/content";

import { MatchCard, FormStrip } from "@/sports/components/match/MatchParts";
import { NewsCard, PlayerCard, VideoCard } from "@/sports/components/cards/Cards";
import {
  Badge,
  Breadcrumbs,
  Crest,
  JsonLd,
  OutboundLink,
  SectionHeading,
  StampLine,
} from "@/sports/components/ui/primitives";
import { breadcrumbJsonLd, sportsTeamJsonLd } from "@/sports/lib/structured-data";

export function generateStaticParams() {
  return localeCodes.flatMap((locale) => teams.map((team) => ({ locale, slug: team.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const info = findLocale(locale);
  const team = getTeamBySlug(slug);
  if (!info || !team) return {};
  const league = getLeague(team.leagueId);
  return sportsMetadata({
    locale: info.code,
    path: `/teams/${team.slug}`,
    title: text(team.name, info.code),
    description:
      info.code === "ja"
        ? `${text(team.name, info.code)}（${text(league?.name, info.code)}）の順位・直近成績・次の試合・所属選手・関連ニュース。`
        : `${text(team.name, info.code)} in ${text(league?.name, info.code)}: position, form, fixtures, squad and news.`,
  });
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!findLocale(raw)) notFound();
  const team = getTeamBySlug(slug);
  if (!team) notFound();

  const { locale, dict, t } = await resolveLocale(params);

  const league = getLeague(team.leagueId);
  const sport = getSport(team.sportId);
  const venue = getVenue(team.venueId);
  const all = matchesByTeam(team.id);
  const next = all.filter((match) => match.status !== "finished").sort(byKickoffAsc);
  const past = all.filter((match) => match.status === "finished").sort(byKickoffDesc);
  const squad = playersByTeam(team.id);
  const news = newsByTeam(team.id);
  const videos = videosByTeam(team.id);
  const rank = rankOf(team.id);
  const form = formOf(team.id);
  const token = fanTokens.find((item) => item.teamId === team.id);
  const goodsUrl = resolveAffiliateUrl("aff-goods", locale);
  const ticketUrl = resolveAffiliateUrl("aff-tickets", locale);

  const trail = [
    { label: "HOME", path: "/" },
    ...(league ? [{ label: t(league.name), path: `/leagues/${league.slug}` }] : []),
    { label: t(team.name), path: `/teams/${team.slug}` },
  ];

  return (
    <>
      <Breadcrumbs locale={locale} trail={trail} />

      <header className="mb-10 flex flex-wrap items-center gap-5">
        <Crest {...team.crest} size={80} label={t(team.name)} />
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {league ? (
              <Link
                href={href(locale, `/leagues/${league.slug}`)}
                className="sp-mono hover:text-cyan text-[0.6875rem] tracking-wider uppercase transition-colors"
                style={{ color: sport?.accent }}
              >
                {sport?.glyph} {t(league.name)}
              </Link>
            ) : null}
            <Badge>{team.country.toUpperCase()}</Badge>
            {team.founded ? <Badge>{team.founded}</Badge> : null}
          </div>
          <h1 className="text-ink text-3xl font-extrabold sm:text-4xl">{t(team.name)}</h1>
          <p className="sp-mono text-ink-dim mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span>{t(team.city)}</span>
            {venue ? <span>{t(venue.name)}</span> : null}
            {team.manager ? <span>{team.manager}</span> : null}
            {rank ? (
              <span className="text-cyan">
                {dict.rank} {rank.rank}
                {rank.group ? ` (${rank.group})` : ""}
              </span>
            ) : null}
          </p>
          {form ? (
            <div className="mt-3 flex items-center gap-2">
              <span className="sp-eyebrow">{dict.recentForm}</span>
              <FormStrip form={form} />
            </div>
          ) : null}
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-12">
          {next.length > 0 ? (
            <section aria-labelledby="t-next">
              <SectionHeading id="t-next" eyebrow="NEXT" title={dict.sectionSchedule} />
              <div className="grid gap-3 sm:grid-cols-2">
                {next.map((match) => (
                  <MatchCard key={match.id} match={match} locale={locale} />
                ))}
              </div>
            </section>
          ) : null}

          {past.length > 0 ? (
            <section aria-labelledby="t-past">
              <SectionHeading id="t-past" eyebrow="RESULTS" title={dict.sectionResults} />
              <div className="grid gap-3 sm:grid-cols-2">
                {past.map((match) => (
                  <MatchCard key={match.id} match={match} locale={locale} compact />
                ))}
              </div>
            </section>
          ) : null}

          {squad.length > 0 ? (
            <section aria-labelledby="t-squad">
              <SectionHeading
                id="t-squad"
                eyebrow="SQUAD"
                title={dict.sectionPlayerRanking}
                description={
                  locale === "ja"
                    ? "デモデータの選手はすべて架空です。実在の選手に架空の成績を結び付けないための措置です。"
                    : "Demo players are fictional so that no invented stats attach to a real person."
                }
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {squad.map((player) => (
                  <PlayerCard key={player.id} player={player} locale={locale} />
                ))}
              </div>
            </section>
          ) : null}

          {news.length > 0 ? (
            <section aria-labelledby="t-news">
              <SectionHeading id="t-news" eyebrow="NEWS" title={dict.relatedNews} />
              <div className="grid gap-4 sm:grid-cols-2">
                {news.map((article) => (
                  <NewsCard key={article.id} article={article} locale={locale} />
                ))}
              </div>
            </section>
          ) : null}

          {videos.length > 0 ? (
            <section aria-labelledby="t-videos">
              <SectionHeading id="t-videos" eyebrow="VIDEOS" title={dict.relatedVideos} />
              <div className="grid gap-4 sm:grid-cols-2">
                {videos.map((video) => (
                  <VideoCard key={video.id} video={video} locale={locale} />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-8">
          <section aria-labelledby="t-links">
            <SectionHeading
              id="t-links"
              eyebrow="LINKS"
              title={locale === "ja" ? "公式・関連" : "Official & related"}
            />
            <ul className="space-y-2">
              {team.officialUrl ? (
                <li>
                  <OutboundLink
                    url={team.officialUrl}
                    locale={locale}
                    className="sp-solid text-ink-soft hover:border-cyan/50 hover:text-cyan w-full justify-between text-sm"
                  >
                    {locale === "ja" ? "公式サイト" : "Official site"}
                  </OutboundLink>
                </li>
              ) : null}
              {ticketUrl ? (
                <li>
                  <OutboundLink
                    url={ticketUrl}
                    sponsored
                    campaign="ticket"
                    placement="team-detail"
                    locale={locale}
                    className="sp-solid text-ink-soft hover:border-cyan/50 hover:text-cyan w-full justify-between text-sm"
                  >
                    {locale === "ja" ? "チケットを確認する" : "Check tickets"}
                  </OutboundLink>
                </li>
              ) : null}
              {goodsUrl ? (
                <li>
                  <OutboundLink
                    url={goodsUrl}
                    sponsored
                    campaign="goods"
                    placement="team-detail"
                    locale={locale}
                    className="sp-solid text-ink-soft hover:border-cyan/50 hover:text-cyan w-full justify-between text-sm"
                  >
                    {locale === "ja" ? "関連グッズを見る" : "Browse merchandise"}
                  </OutboundLink>
                </li>
              ) : null}
            </ul>
          </section>

          {token ? (
            <section aria-labelledby="t-token">
              <SectionHeading id="t-token" eyebrow="WEB3" title={dict.sectionFanTokens} />
              <div className="sp-solid p-4">
                <p className="sp-mono text-ink text-sm">{token.symbol}</p>
                <p className="text-ink-faint mt-1 text-[0.6875rem]">
                  {token.platform} · {token.chain}
                </p>
                <ul className="text-ink-soft mt-3 space-y-1 text-xs">
                  {token.utility.map((item, index) => (
                    <li key={index}>・{t(item)}</li>
                  ))}
                </ul>
                <p className="text-caution mt-3 text-[0.625rem] leading-relaxed">{dict.web3Risk}</p>
              </div>
            </section>
          ) : null}

          <section aria-labelledby="t-aliases">
            <SectionHeading
              id="t-aliases"
              eyebrow="ALIASES"
              title={locale === "ja" ? "表記ゆれ" : "Also known as"}
            />
            <ul className="flex flex-wrap gap-1.5">
              {team.aliases.map((alias) => (
                <li key={alias}>
                  <Badge>{alias}</Badge>
                </li>
              ))}
            </ul>
            <p className="text-ink-faint mt-2 text-[0.6875rem]">
              {locale === "ja"
                ? "これらの表記はすべて検索でヒットします。"
                : "All of these are searchable on this site."}
            </p>
          </section>

          <StampLine stamp={team.stamp} locale={locale} />
        </aside>
      </div>

      <JsonLd data={[breadcrumbJsonLd(locale, trail), sportsTeamJsonLd(locale, team, sport)]} />
    </>
  );
}
