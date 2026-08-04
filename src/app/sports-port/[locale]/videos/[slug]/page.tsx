import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { findLocale, localeCodes, text } from "@/sports/i18n";
import { resolveLocale } from "@/sports/lib/page";
import { sportsMetadata } from "@/sports/lib/seo";
import { href } from "@/sports/lib/url";
import { videos, getVideoBySlug } from "@/sports/data/videos";
import { getMatch } from "@/sports/data/matches";
import { getTeam } from "@/sports/data/teams";
import { getPlayer } from "@/sports/data/players";
import { getLeague } from "@/sports/data/leagues";
import { getSport } from "@/sports/data/sports";
import { streamingForIds } from "@/sports/data/streaming";
import { newsByMatch } from "@/sports/data/news";
import { faqsFor } from "@/sports/data/content";
import { resolveAffiliateUrl } from "@/sports/data/content";

import { MatchCard } from "@/sports/components/match/MatchParts";
import { NewsCard, VideoCard } from "@/sports/components/cards/Cards";
import { WatchOptions } from "@/sports/components/streaming/StreamingTable";
import {
  Badge,
  Breadcrumbs,
  FaqList,
  JsonLd,
  OutboundLink,
  SectionHeading,
  StampLine,
} from "@/sports/components/ui/primitives";
import { LocalTime } from "@/sports/components/ui/LocalTime";
import { formatDuration } from "@/sports/lib/format";
import { breadcrumbJsonLd, faqJsonLd, videoObjectJsonLd } from "@/sports/lib/structured-data";

export function generateStaticParams() {
  return localeCodes.flatMap((locale) => videos.map((video) => ({ locale, slug: video.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const info = findLocale(locale);
  const video = getVideoBySlug(slug);
  if (!info || !video) return {};
  return sportsMetadata({
    locale: info.code,
    path: `/videos/${video.slug}`,
    title: text(video.title, info.code),
    description: text(video.description, info.code),
    type: "article",
    publishedTime: video.publishedAt,
  });
}

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!findLocale(raw)) notFound();
  const video = getVideoBySlug(slug);
  if (!video) notFound();

  const { locale, dict, t } = await resolveLocale(params);

  const match = getMatch(video.matchId);
  const league = getLeague(video.leagueId);
  const sport = getSport(video.sportId);
  const services = match ? streamingForIds(match.broadcastIds) : [];
  const news = match ? newsByMatch(match.id) : [];
  const related = videos
    .filter((item) => item.id !== video.id && item.sportId === video.sportId)
    .slice(0, 4);
  const faqs = faqsFor("videos");
  const goodsUrl = resolveAffiliateUrl("aff-goods", locale);

  const trail = [
    { label: "HOME", path: "/" },
    { label: dict.navVideos, path: "/videos" },
    { label: t(video.title), path: `/videos/${video.slug}` },
  ];

  return (
    <>
      <Breadcrumbs locale={locale} trail={trail} />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div>
          {/* 埋め込みは youtubeId がある場合のみ。実在しないIDを埋め込むと権利者不明の動画が再生されます */}
          {video.youtubeId ? (
            <div className="border-edge aspect-video overflow-hidden rounded-2xl border">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}`}
                title={t(video.title)}
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                className="size-full"
              />
            </div>
          ) : (
            <div
              className="sp-holo border-edge grid aspect-video place-items-center rounded-2xl border"
              style={{
                background: `radial-gradient(60% 80% at 50% 40%, ${sport?.accent ?? "#22d3ee"}22, transparent 70%)`,
              }}
            >
              <div className="p-6 text-center">
                <p className="text-4xl" aria-hidden="true">
                  {sport?.glyph ?? "▶"}
                </p>
                <p className="text-ink-dim mt-3 text-sm">
                  {locale === "ja"
                    ? "この動画はデモデータのため、埋め込みは行っていません。"
                    : "Demo entry — no embed, because there is no real video behind it."}
                </p>
                <p className="sp-mono text-ink-faint mt-1 text-[0.6875rem]">
                  {locale === "ja"
                    ? "YouTube Data API を設定すると、実際の動画に置き換わります。"
                    : "Configure the YouTube Data API to replace this with real videos."}
                </p>
              </div>
            </div>
          )}

          <header className="mt-6">
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              {video.kind === "short" ? <Badge tone="accent">SHORTS</Badge> : null}
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
            <h1 className="text-ink text-2xl font-extrabold sm:text-3xl">{t(video.title)}</h1>
            <p className="sp-mono text-ink-faint mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.6875rem]">
              <span>
                {dict.channel}: {video.channel.name}
                {video.channel.official ? ` (${dict.officialChannel})` : ""}
              </span>
              <span>{formatDuration(video.durationSec)}</span>
              <LocalTime iso={video.publishedAt} locale={locale} kind="date" />
            </p>
            <p className="text-ink-soft mt-4 text-sm leading-relaxed">{t(video.description)}</p>
          </header>

          {video.aiSummary?.length ? (
            <section aria-labelledby="v-summary" className="mt-8">
              <SectionHeading
                id="v-summary"
                eyebrow="AI"
                title={dict.aiSummary}
                description={dict.aiSummaryNote}
              />
              <ul className="sp-solid space-y-2 p-4">
                {video.aiSummary.map((line, index) => (
                  <li key={index} className="text-ink-soft flex gap-2 text-sm">
                    <span className="text-cyan" aria-hidden="true">
                      ▍
                    </span>
                    {t(line)}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {video.chapters?.length ? (
            <section aria-labelledby="v-chapters" className="mt-8">
              <SectionHeading id="v-chapters" eyebrow="CHAPTERS" title={dict.chapters} />
              <ol className="sp-solid divide-edge divide-y">
                {video.chapters.map((chapter) => (
                  <li key={chapter.at} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <span className="sp-mono text-cyan w-12 shrink-0">
                      {formatDuration(chapter.at)}
                    </span>
                    <span className="text-ink-soft">{t(chapter.label)}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {video.transcriptExcerpt ? (
            <section aria-labelledby="v-transcript" className="mt-8">
              <SectionHeading id="v-transcript" eyebrow="TRANSCRIPT" title={dict.transcript} />
              <blockquote className="sp-solid text-ink-soft p-4 text-sm leading-relaxed">
                {t(video.transcriptExcerpt)}
              </blockquote>
            </section>
          ) : null}

          {news.length > 0 ? (
            <section aria-labelledby="v-news" className="mt-8">
              <SectionHeading id="v-news" eyebrow="NEWS" title={dict.relatedNews} />
              <div className="grid gap-4 sm:grid-cols-2">
                {news.map((article) => (
                  <NewsCard key={article.id} article={article} locale={locale} />
                ))}
              </div>
            </section>
          ) : null}

          <section aria-labelledby="v-faq" className="mt-8">
            <SectionHeading id="v-faq" eyebrow="FAQ" title={dict.sectionFaq} />
            <FaqList items={faqs} locale={locale} t={t} />
          </section>
        </div>

        <aside className="space-y-8">
          {match ? (
            <section aria-labelledby="v-match">
              <SectionHeading id="v-match" eyebrow="MATCH" title={dict.ctaMatchDetail} />
              <MatchCard match={match} locale={locale} />
            </section>
          ) : null}

          {services.length > 0 ? (
            <section aria-labelledby="v-watch">
              <SectionHeading id="v-watch" eyebrow="WATCH" title={dict.whereToWatch} />
              <WatchOptions services={services} locale={locale} placement="video-detail" />
            </section>
          ) : null}

          {video.teamIds.length > 0 || video.playerIds.length > 0 ? (
            <section aria-labelledby="v-entities">
              <SectionHeading
                id="v-entities"
                eyebrow="RELATED"
                title={locale === "ja" ? "関連チーム・選手" : "Teams & players"}
              />
              <ul className="flex flex-wrap gap-1.5">
                {video.teamIds.map((id) => {
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
                {video.playerIds.map((id) => {
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

          {goodsUrl ? (
            <section aria-labelledby="v-goods">
              <SectionHeading
                id="v-goods"
                eyebrow="SHOP"
                title={locale === "ja" ? "関連グッズ" : "Merchandise"}
              />
              <OutboundLink
                url={goodsUrl}
                sponsored
                campaign="goods"
                placement="video-detail"
                locale={locale}
                className="sp-solid text-ink-soft hover:border-cyan/50 hover:text-cyan w-full justify-between text-sm"
              >
                {locale === "ja" ? "関連グッズを見る" : "Browse merchandise"}
              </OutboundLink>
            </section>
          ) : null}

          <StampLine stamp={video.stamp} locale={locale} />
        </aside>
      </div>

      {related.length > 0 ? (
        <section aria-labelledby="v-related" className="mt-12">
          <SectionHeading id="v-related" eyebrow="MORE" title={dict.relatedVideos} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <VideoCard key={item.id} video={item} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      <JsonLd
        data={[
          breadcrumbJsonLd(locale, trail),
          videoObjectJsonLd(locale, video),
          faqJsonLd(faqs.map((faq) => ({ question: t(faq.question), answer: t(faq.answer) }))),
        ]}
      />
    </>
  );
}
