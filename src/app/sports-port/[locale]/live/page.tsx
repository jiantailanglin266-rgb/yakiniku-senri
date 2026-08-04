import type { Metadata } from "next";

import { localeCodes, getDictionary, findLocale } from "@/sports/i18n";
import { resolveLocale } from "@/sports/lib/page";
import { sportsMetadata } from "@/sports/lib/seo";
import { basePath } from "@/lib/base-path";
import { getLiveMatches, getMatchesOn } from "@/sports/lib/api";
import { referenceDayIso } from "@/sports/data/clock";
import { getSport } from "@/sports/data/sports";
import { getLeague } from "@/sports/data/leagues";
import { getTeam } from "@/sports/data/teams";
import { faqsFor } from "@/sports/data/content";

import { LiveTicker, type TickerItem } from "@/sports/components/live/LiveTicker";
import { MatchCard, Timeline } from "@/sports/components/match/MatchParts";
import {
  Breadcrumbs,
  FaqList,
  JsonLd,
  SectionHeading,
  StampLine,
} from "@/sports/components/ui/primitives";
import { breadcrumbJsonLd, faqJsonLd } from "@/sports/lib/structured-data";

export function generateStaticParams() {
  return localeCodes.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const info = findLocale(locale);
  if (!info) return {};
  const dict = getDictionary(info.code);
  return sportsMetadata({
    locale: info.code,
    path: "/live",
    title: dict.sectionLiveTicker,
    description:
      info.code === "ja"
        ? "進行中の試合を競技別に一覧表示します。各試合の更新間隔と最終更新時刻を明記しています。"
        : "Every match in progress, grouped by sport, with each feed's refresh interval and last update time.",
  });
}

export default async function LivePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, dict, t } = await resolveLocale(params);

  const live = getLiveMatches();
  const today = getMatchesOn(referenceDayIso);
  const upcomingToday = today.filter((match) => match.status === "scheduled");
  const faqs = faqsFor("live");

  const bySport = new Map<string, typeof live>();
  for (const match of live) {
    const bucket = bySport.get(match.sportId) ?? [];
    bucket.push(match);
    bySport.set(match.sportId, bucket);
  }

  const ticker: TickerItem[] = live.map((match) => ({
    id: match.id,
    slug: match.slug,
    status: match.status,
    clock: match.clock ?? null,
    league: getLeague(match.leagueId)?.shortName ?? "",
    home: getTeam(match.homeTeamId)?.shortName ?? "",
    away: getTeam(match.awayTeamId)?.shortName ?? "",
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    accent: getSport(match.sportId)?.accent ?? "#22d3ee",
    fetchedAt: match.stamp.fetchedAt,
    refreshIntervalSec: match.stamp.refreshIntervalSec,
  }));

  const trail = [
    { label: "HOME", path: "/" },
    { label: dict.sectionLiveTicker, path: "/live" },
  ];

  return (
    <>
      <Breadcrumbs locale={locale} trail={trail} />

      <header className="mb-8">
        <p className="sp-eyebrow mb-2">LIVE SCORES</p>
        <h1 className="text-ink text-3xl font-extrabold sm:text-4xl">{dict.sectionLiveTicker}</h1>
        <p className="text-ink-dim mt-3 max-w-2xl text-sm">{dict.timezoneNote}</p>
      </header>

      <div className="mb-10">
        <LiveTicker items={ticker} locale={locale} basePath={basePath} />
      </div>

      {live.length === 0 ? (
        <p className="sp-solid text-ink-dim p-6 text-sm">{dict.noMatchesToday}</p>
      ) : (
        Array.from(bySport.entries()).map(([sportId, group]) => {
          const sport = getSport(sportId);
          return (
            <section key={sportId} aria-labelledby={`live-${sportId}`} className="mb-12">
              <SectionHeading
                id={`live-${sportId}`}
                eyebrow={sport?.glyph}
                title={t(sport?.name)}
                description={t(sport?.primer)}
              />
              <div className="grid gap-4 lg:grid-cols-2">
                {group.map((match) => (
                  <div key={match.id} className="sp-solid p-5">
                    <div className="mb-4">
                      <MatchCard match={match} locale={locale} compact />
                    </div>
                    <Timeline match={match} locale={locale} />
                    <StampLine stamp={match.stamp} locale={locale} />
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}

      {upcomingToday.length > 0 ? (
        <section aria-labelledby="live-upcoming" className="mb-12">
          <SectionHeading id="live-upcoming" eyebrow="TODAY" title={dict.sectionSchedule} />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {upcomingToday.map((match) => (
              <MatchCard key={match.id} match={match} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="live-faq">
        <SectionHeading id="live-faq" eyebrow="FAQ" title={dict.sectionFaq} />
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
