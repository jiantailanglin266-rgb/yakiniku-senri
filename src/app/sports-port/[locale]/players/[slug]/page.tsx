import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { findLocale, localeCodes, text } from "@/sports/i18n";
import { resolveLocale } from "@/sports/lib/page";
import { sportsMetadata } from "@/sports/lib/seo";
import { href } from "@/sports/lib/url";
import { players, getPlayerBySlug } from "@/sports/data/players";
import { getTeam } from "@/sports/data/teams";
import { getSport } from "@/sports/data/sports";
import { getLeague } from "@/sports/data/leagues";
import { matchesByTeam, byKickoffDesc } from "@/sports/data/matches";
import { newsByPlayer } from "@/sports/data/news";
import { videosByPlayer } from "@/sports/data/videos";

import { MatchCard } from "@/sports/components/match/MatchParts";
import { NewsCard, VideoCard } from "@/sports/components/cards/Cards";
import {
  Badge,
  Breadcrumbs,
  Crest,
  JsonLd,
  SectionHeading,
  StampLine,
} from "@/sports/components/ui/primitives";
import { breadcrumbJsonLd, personJsonLd } from "@/sports/lib/structured-data";

export function generateStaticParams() {
  return localeCodes.flatMap((locale) => players.map((player) => ({ locale, slug: player.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const info = findLocale(locale);
  const player = getPlayerBySlug(slug);
  if (!info || !player) return {};
  const team = getTeam(player.teamId);
  return sportsMetadata({
    locale: info.code,
    path: `/players/${player.slug}`,
    title: text(player.name, info.code),
    description:
      info.code === "ja"
        ? `${text(player.name, info.code)}（${text(team?.name, info.code)}）のポジション・今季成績・通算成績・関連ニュース。`
        : `${text(player.name, info.code)} — position, season and career stats, related news.`,
  });
}

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!findLocale(raw)) notFound();
  const player = getPlayerBySlug(slug);
  if (!player) notFound();

  const { locale, dict, t } = await resolveLocale(params);

  const team = getTeam(player.teamId);
  const sport = getSport(player.sportId);
  const league = team ? getLeague(team.leagueId) : undefined;
  const recent = team ? matchesByTeam(team.id).sort(byKickoffDesc).slice(0, 4) : [];
  const news = newsByPlayer(player.id);
  const videos = videosByPlayer(player.id);

  const trail = [
    { label: "HOME", path: "/" },
    ...(team ? [{ label: t(team.name), path: `/teams/${team.slug}` }] : []),
    { label: t(player.name), path: `/players/${player.slug}` },
  ];

  const profile: { label: string; value: string }[] = [
    { label: locale === "ja" ? "国籍" : "Nationality", value: player.nationality.toUpperCase() },
    ...(player.birthDate
      ? [{ label: locale === "ja" ? "生年月日" : "Born", value: player.birthDate }]
      : []),
    ...(player.heightCm
      ? [{ label: locale === "ja" ? "身長" : "Height", value: `${player.heightCm} cm` }]
      : []),
    ...(player.weightKg
      ? [{ label: locale === "ja" ? "体重" : "Weight", value: `${player.weightKg} kg` }]
      : []),
    { label: dict.position, value: t(player.position) },
    ...(player.number
      ? [{ label: locale === "ja" ? "背番号" : "Number", value: `#${player.number}` }]
      : []),
  ];

  return (
    <>
      <Breadcrumbs locale={locale} trail={trail} />

      <header className="mb-10 flex flex-wrap items-center gap-5">
        {/* 写真は権利上掲載しません。番号とチームカラーで識別します */}
        <span
          className="grid size-20 shrink-0 place-items-center rounded-2xl text-2xl font-extrabold"
          style={{
            background: `linear-gradient(135deg, ${team?.crest.primary ?? "#22d3ee"}44, ${team?.crest.secondary ?? "#6366f1"}22)`,
            color: "var(--color-ink)",
          }}
          aria-hidden="true"
        >
          {player.number ?? "#"}
        </span>
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {sport ? (
              <Link
                href={href(locale, `/sports/${sport.slug}`)}
                className="sp-mono hover:text-cyan text-[0.6875rem] tracking-wider uppercase transition-colors"
                style={{ color: sport.accent }}
              >
                {sport.glyph} {t(sport.name)}
              </Link>
            ) : null}
            {league ? <Badge>{league.shortName}</Badge> : null}
            <Badge>{t(player.position)}</Badge>
          </div>
          <h1 className="text-ink text-3xl font-extrabold sm:text-4xl">{t(player.name)}</h1>
          {team ? (
            <Link
              href={href(locale, `/teams/${team.slug}`)}
              className="text-ink-dim hover:text-cyan mt-2 inline-flex items-center gap-2 text-sm transition-colors"
            >
              <Crest {...team.crest} size={20} />
              {t(team.name)}
            </Link>
          ) : null}
        </div>
      </header>

      <p className="border-caution/40 bg-caution/10 text-caution mb-8 rounded-lg border p-3 text-xs leading-relaxed">
        {locale === "ja"
          ? "この選手はデモデータ用の架空の人物です。実在の選手に架空の成績・移籍・負傷情報を結び付けないため、モックデータでは実名を使用していません。"
          : "This player is fictional demo data. We never attach invented stats, transfers or injuries to a real person."}
      </p>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <aside className="space-y-8">
          <section aria-labelledby="p-profile">
            <SectionHeading
              id="p-profile"
              eyebrow="PROFILE"
              title={locale === "ja" ? "プロフィール" : "Profile"}
            />
            <dl className="sp-solid divide-edge divide-y">
              {profile.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between px-4 py-2.5 text-sm"
                >
                  <dt className="text-ink-faint">{item.label}</dt>
                  <dd className="sp-mono text-ink">{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {player.honours?.length ? (
            <section aria-labelledby="p-honours">
              <SectionHeading
                id="p-honours"
                eyebrow="HONOURS"
                title={locale === "ja" ? "受賞歴" : "Honours"}
              />
              <ul className="sp-solid divide-edge divide-y">
                {player.honours.map((item) => (
                  <li
                    key={item.year}
                    className="flex items-center justify-between px-4 py-2.5 text-sm"
                  >
                    <span className="sp-mono text-ink-faint">{item.year}</span>
                    <span className="text-ink-soft">{t(item.title)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {player.transfers?.length ? (
            <section aria-labelledby="p-transfers">
              <SectionHeading
                id="p-transfers"
                eyebrow="TRANSFERS"
                title={locale === "ja" ? "移籍履歴" : "Transfers"}
              />
              <ul className="sp-solid divide-edge divide-y">
                {player.transfers.map((item, index) => (
                  <li key={index} className="px-4 py-2.5 text-sm">
                    <span className="sp-mono text-ink-faint text-[0.6875rem]">{item.season}</span>
                    <span className="text-ink-soft mt-0.5 block">
                      {item.from} → {item.to}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <StampLine stamp={player.stamp} locale={locale} />
        </aside>

        <div className="space-y-12">
          <section aria-labelledby="p-season">
            <SectionHeading
              id="p-season"
              eyebrow="SEASON"
              title={locale === "ja" ? "今季成績" : "This season"}
            />
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {player.seasonStats.map((stat) => (
                <div key={stat.key} className="sp-solid p-4 text-center">
                  <dd className="sp-mono text-cyan text-2xl font-extrabold">{stat.value}</dd>
                  <dt className="text-ink-faint mt-1 text-[0.625rem]">{t(stat.label)}</dt>
                </div>
              ))}
            </dl>
          </section>

          {player.careerStats.length > 0 ? (
            <section aria-labelledby="p-career">
              <SectionHeading
                id="p-career"
                eyebrow="CAREER"
                title={locale === "ja" ? "通算成績" : "Career"}
              />
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {player.careerStats.map((stat) => (
                  <div key={stat.key} className="sp-solid p-4 text-center">
                    <dd className="sp-mono text-ink text-xl font-bold">{stat.value}</dd>
                    <dt className="text-ink-faint mt-1 text-[0.625rem]">{t(stat.label)}</dt>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {recent.length > 0 ? (
            <section aria-labelledby="p-matches">
              <SectionHeading
                id="p-matches"
                eyebrow="MATCHES"
                title={locale === "ja" ? "試合履歴" : "Match history"}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {recent.map((match) => (
                  <MatchCard key={match.id} match={match} locale={locale} compact />
                ))}
              </div>
            </section>
          ) : null}

          {news.length > 0 ? (
            <section aria-labelledby="p-news">
              <SectionHeading id="p-news" eyebrow="NEWS" title={dict.relatedNews} />
              <div className="grid gap-4 sm:grid-cols-2">
                {news.map((article) => (
                  <NewsCard key={article.id} article={article} locale={locale} />
                ))}
              </div>
            </section>
          ) : null}

          {videos.length > 0 ? (
            <section aria-labelledby="p-videos">
              <SectionHeading id="p-videos" eyebrow="VIDEOS" title={dict.relatedVideos} />
              <div className="grid gap-4 sm:grid-cols-2">
                {videos.map((video) => (
                  <VideoCard key={video.id} video={video} locale={locale} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <JsonLd data={[breadcrumbJsonLd(locale, trail), personJsonLd(locale, player, team)]} />
    </>
  );
}
