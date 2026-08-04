import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { findLocale, localeCodes, text } from "@/sports/i18n";
import { resolveLocale } from "@/sports/lib/page";
import { sportsMetadata } from "@/sports/lib/seo";
import { href } from "@/sports/lib/url";
import { news, getNewsBySlug, authorsById } from "@/sports/data/news";
import { getSport } from "@/sports/data/sports";
import { getLeague } from "@/sports/data/leagues";
import { getTeam } from "@/sports/data/teams";
import { getPlayer } from "@/sports/data/players";
import { getMatch } from "@/sports/data/matches";

import { confidenceLabel, confidenceTone, NewsCard } from "@/sports/components/cards/Cards";
import { MatchCard } from "@/sports/components/match/MatchParts";
import {
  Badge,
  Breadcrumbs,
  JsonLd,
  SectionHeading,
  StampLine,
} from "@/sports/components/ui/primitives";
import { LocalTime } from "@/sports/components/ui/LocalTime";
import { breadcrumbJsonLd, newsArticleJsonLd } from "@/sports/lib/structured-data";

export function generateStaticParams() {
  return localeCodes.flatMap((locale) => news.map((article) => ({ locale, slug: article.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const info = findLocale(locale);
  const article = getNewsBySlug(slug);
  if (!info || !article) return {};
  return sportsMetadata({
    locale: info.code,
    path: `/news/${article.slug}`,
    title: text(article.title, info.code),
    description: text(article.summary, info.code),
    type: "article",
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
  });
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!findLocale(raw)) notFound();
  const article = getNewsBySlug(slug);
  if (!article) notFound();

  const { locale, dict, t } = await resolveLocale(params);

  const author = authorsById.get(article.authorId);
  const supervisor = article.supervisorId ? authorsById.get(article.supervisorId) : undefined;
  const sport = getSport(article.sportId);
  const league = getLeague(article.leagueId);
  const match = getMatch(article.matchId);
  const related = news
    .filter((item) => item.id !== article.id)
    .filter(
      (item) =>
        item.sportId === article.sportId ||
        item.leagueId === article.leagueId ||
        item.teamIds.some((id) => article.teamIds.includes(id)),
    )
    .slice(0, 4);

  const trail = [
    { label: "HOME", path: "/" },
    { label: dict.navNews, path: "/news" },
    { label: t(article.title), path: `/news/${article.slug}` },
  ];

  return (
    <>
      <Breadcrumbs locale={locale} trail={trail} />

      <article className="mx-auto max-w-3xl">
        <header className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <Badge tone={confidenceTone(article.confidence)}>
              {confidenceLabel(article.confidence, locale)}
            </Badge>
            {sport ? (
              <Link
                href={href(locale, `/sports/${sport.slug}`)}
                className="sp-mono hover:text-cyan text-[0.6875rem] tracking-wider uppercase transition-colors"
                style={{ color: sport.accent }}
              >
                {sport.glyph} {t(sport.name)}
              </Link>
            ) : null}
            {league ? (
              <Link href={href(locale, `/leagues/${league.slug}`)}>
                <Badge>{league.shortName}</Badge>
              </Link>
            ) : null}
          </div>

          <h1 className="text-ink text-2xl leading-tight font-extrabold sm:text-4xl">
            {t(article.title)}
          </h1>
          <p className="text-ink-soft mt-4 text-base leading-relaxed">{t(article.summary)}</p>

          <div className="sp-mono border-edge text-ink-faint mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-4 text-[0.6875rem]">
            <span>
              {dict.publishedAt}: <LocalTime iso={article.publishedAt} locale={locale} />
            </span>
            {article.updatedAt ? (
              <span>
                {dict.updated}: <LocalTime iso={article.updatedAt} locale={locale} />
              </span>
            ) : null}
            <span>
              {dict.readingTime}: {article.readingMinutes} min
            </span>
            {author ? (
              <span>
                {dict.author}: {t(author.name)}
              </span>
            ) : null}
            {supervisor ? (
              <span>
                {dict.supervisor}: {t(supervisor.name)}
              </span>
            ) : null}
          </div>
        </header>

        {/* 本文：結論 → 要点 → 背景 → 注意点 の順に構成しています */}
        <div className="space-y-8">
          {article.body.map((block, index) => (
            <section key={index}>
              <h2 className="text-ink mb-3 text-lg font-bold">{t(block.heading)}</h2>
              {block.paragraphs.map((paragraph, pIndex) => (
                <p key={pIndex} className="text-ink-soft mb-3 text-sm leading-relaxed">
                  {t(paragraph)}
                </p>
              ))}
            </section>
          ))}
        </div>

        {/* 情報元 */}
        <section aria-labelledby="a-sources" className="border-edge mt-10 border-t pt-6">
          <h2 id="a-sources" className="sp-eyebrow mb-2">
            {dict.sources}
          </h2>
          <ul className="text-ink-dim space-y-1 text-xs">
            {article.sources.map((source) => (
              <li key={source.name}>
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-cyan transition-colors"
                  >
                    {source.name}
                  </a>
                ) : (
                  source.name
                )}
              </li>
            ))}
          </ul>
          <StampLine stamp={article.stamp} locale={locale} />
        </section>

        {author ? (
          <section aria-labelledby="a-author" className="mt-8">
            <h2 id="a-author" className="sp-eyebrow mb-2">
              {dict.author}
            </h2>
            <div className="sp-solid p-4">
              <p className="text-ink text-sm font-semibold">{t(author.name)}</p>
              <p className="sp-mono text-cyan mt-0.5 text-[0.625rem]">{t(author.role)}</p>
              <p className="text-ink-dim mt-2 text-xs leading-relaxed">{t(author.bio)}</p>
            </div>
          </section>
        ) : null}
      </article>

      {match ? (
        <section aria-labelledby="a-match" className="mt-12">
          <SectionHeading id="a-match" eyebrow="MATCH" title={dict.ctaMatchDetail} />
          <div className="max-w-md">
            <MatchCard match={match} locale={locale} />
          </div>
        </section>
      ) : null}

      {article.teamIds.length > 0 || article.playerIds.length > 0 ? (
        <section aria-labelledby="a-entities" className="mt-12">
          <SectionHeading
            id="a-entities"
            eyebrow="RELATED"
            title={locale === "ja" ? "関連チーム・選手" : "Teams & players"}
          />
          <ul className="flex flex-wrap gap-1.5">
            {article.teamIds.map((id) => {
              const team = getTeam(id);
              return team ? (
                <li key={id}>
                  <Link
                    href={href(locale, `/teams/${team.slug}`)}
                    className="border-edge text-ink-soft hover:border-cyan/60 hover:text-cyan inline-block rounded-lg border px-3 py-1.5 text-xs transition-colors"
                  >
                    {t(team.name)}
                  </Link>
                </li>
              ) : null;
            })}
            {article.playerIds.map((id) => {
              const player = getPlayer(id);
              return player ? (
                <li key={id}>
                  <Link
                    href={href(locale, `/players/${player.slug}`)}
                    className="border-edge text-ink-soft hover:border-magenta/60 hover:text-magenta inline-block rounded-lg border px-3 py-1.5 text-xs transition-colors"
                  >
                    {t(player.name)}
                  </Link>
                </li>
              ) : null;
            })}
          </ul>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section aria-labelledby="a-related" className="mt-12">
          <SectionHeading id="a-related" eyebrow="MORE" title={dict.relatedNews} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <NewsCard key={item.id} article={item} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      <JsonLd data={[breadcrumbJsonLd(locale, trail), newsArticleJsonLd(locale, article)]} />
    </>
  );
}
