import type { Metadata } from "next";

import { findLocale, getDictionary, localeCodes } from "@/sports/i18n";
import { resolveLocale } from "@/sports/lib/page";
import { sportsMetadata } from "@/sports/lib/seo";
import {
  getFinishedMatches,
  getLiveMatches,
  getMatchesOn,
  getUpcomingMatches,
} from "@/sports/lib/api";
import { referenceDayIso } from "@/sports/data/clock";
import { faqsFor } from "@/sports/data/content";
import { getTeam } from "@/sports/data/teams";

import { MatchCard } from "@/sports/components/match/MatchParts";
import { Breadcrumbs, FaqList, JsonLd, SectionHeading } from "@/sports/components/ui/primitives";
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd } from "@/sports/lib/structured-data";
import { text } from "@/sports/i18n";

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
    path: "/matches",
    title: dict.navMatches,
    description:
      info.code === "ja"
        ? "本日の試合日程、進行中の試合、直近の試合結果をまとめて確認できます。開始時刻はお使いの端末のタイムゾーンで表示します。"
        : "Today's fixtures, matches in progress and recent results, with kick-off times in your own time zone.",
  });
}

export default async function MatchesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, dict, t } = await resolveLocale(params);

  const live = getLiveMatches();
  const today = getMatchesOn(referenceDayIso);
  const upcoming = getUpcomingMatches(12);
  const finished = getFinishedMatches(12);
  const faqs = faqsFor("matches");

  const trail = [
    { label: "HOME", path: "/" },
    { label: dict.navMatches, path: "/matches" },
  ];

  const sections = [
    { key: "live", title: dict.sectionLiveFeed, eyebrow: "LIVE", items: live },
    { key: "today", title: dict.sectionSchedule, eyebrow: "TODAY", items: today },
    { key: "upcoming", title: dict.statusScheduled, eyebrow: "UPCOMING", items: upcoming },
    { key: "results", title: dict.sectionResults, eyebrow: "RESULTS", items: finished },
  ];

  return (
    <>
      <Breadcrumbs locale={locale} trail={trail} />

      <header className="mb-10">
        <p className="sp-eyebrow mb-2">MATCHES</p>
        <h1 className="text-ink text-3xl font-extrabold sm:text-4xl">{dict.navMatches}</h1>
        <p className="text-ink-dim mt-3 max-w-2xl text-sm">{dict.timezoneNote}</p>
      </header>

      {sections.map((section) => (
        <section key={section.key} aria-labelledby={`m-${section.key}`} className="mb-12">
          <SectionHeading id={`m-${section.key}`} eyebrow={section.eyebrow} title={section.title} />
          {section.items.length === 0 ? (
            <p className="sp-solid text-ink-dim p-6 text-sm">{dict.noMatchesToday}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {section.items.map((match) => (
                <MatchCard key={`${section.key}-${match.id}`} match={match} locale={locale} />
              ))}
            </div>
          )}
        </section>
      ))}

      <section aria-labelledby="m-faq">
        <SectionHeading id="m-faq" eyebrow="FAQ" title={dict.sectionFaq} />
        <FaqList items={faqs} locale={locale} t={t} />
      </section>

      <JsonLd
        data={[
          breadcrumbJsonLd(locale, trail),
          itemListJsonLd(
            locale,
            today.map((match) => ({
              name: `${text(getTeam(match.homeTeamId)?.name, locale)} vs ${text(getTeam(match.awayTeamId)?.name, locale)}`,
              path: `/matches/${match.slug}`,
            })),
          ),
          faqJsonLd(faqs.map((faq) => ({ question: t(faq.question), answer: t(faq.answer) }))),
        ]}
      />
    </>
  );
}
