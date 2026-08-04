import type { Metadata } from "next";
import Link from "next/link";

import { findLocale, getDictionary, localeCodes } from "@/sports/i18n";
import { resolveLocale } from "@/sports/lib/page";
import { sportsMetadata } from "@/sports/lib/seo";
import { href } from "@/sports/lib/url";
import { shortVideos } from "@/sports/data/videos";
import { getMatch } from "@/sports/data/matches";
import { getPlayer } from "@/sports/data/players";
import { getLatestNews } from "@/sports/lib/api";
import { streamingForIds } from "@/sports/data/streaming";

import { VideoCard, NewsCard } from "@/sports/components/cards/Cards";
import { MatchCard } from "@/sports/components/match/MatchParts";
import { WatchOptions } from "@/sports/components/streaming/StreamingTable";
import { Breadcrumbs, JsonLd, SectionHeading } from "@/sports/components/ui/primitives";
import { breadcrumbJsonLd } from "@/sports/lib/structured-data";

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
    path: "/videos/shorts",
    title: dict.shorts,
    description:
      info.code === "ja"
        ? "ショート動画から来た方向けのページです。要点・試合速報・関連ニュース・フル動画・視聴方法をひとまとめにしています。"
        : "Landing page for viewers arriving from short-form video: key points, live scores, news, full videos and how to watch.",
  });
}

export default async function ShortsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, dict, t } = await resolveLocale(params);

  const shorts = shortVideos();
  const news = getLatestNews(4);

  // ショート動画に紐づく試合をまとめて出します（流入直後に最も知りたい情報のため）
  const relatedMatches = Array.from(
    new Set(shorts.map((video) => video.matchId).filter(Boolean) as string[]),
  )
    .map((id) => getMatch(id))
    .filter((match): match is NonNullable<typeof match> => Boolean(match));

  const services = streamingForIds(
    Array.from(new Set(relatedMatches.flatMap((match) => match.broadcastIds))),
  );

  const players = Array.from(new Set(shorts.flatMap((video) => video.playerIds)))
    .map((id) => getPlayer(id))
    .filter((player): player is NonNullable<typeof player> => Boolean(player));

  const trail = [
    { label: "HOME", path: "/" },
    { label: dict.navVideos, path: "/videos" },
    { label: dict.shorts, path: "/videos/shorts" },
  ];

  return (
    <>
      <Breadcrumbs locale={locale} trail={trail} />

      <header className="mb-10">
        <p className="sp-eyebrow mb-2">SHORTS</p>
        <h1 className="text-ink text-3xl font-extrabold sm:text-4xl">{dict.shorts}</h1>
        <p className="text-ink-dim mt-3 max-w-2xl text-sm">
          {locale === "ja"
            ? "動画で見た場面の「続き」をここでまとめて確認できます。試合の現在のスコア、関連ニュース、視聴方法まで1ページで完結します。"
            : "Everything that comes after the clip: the live score, the news around it, and where to watch the full match."}
        </p>
      </header>

      <section aria-labelledby="sh-videos" className="mb-12">
        <SectionHeading id="sh-videos" eyebrow="CLIPS" title={dict.shorts} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {shorts.map((video) => (
            <VideoCard key={video.id} video={video} locale={locale} />
          ))}
        </div>
      </section>

      {relatedMatches.length > 0 ? (
        <section aria-labelledby="sh-matches" className="mb-12">
          <SectionHeading
            id="sh-matches"
            eyebrow="LIVE"
            title={dict.sectionLiveFeed}
            description={dict.timezoneNote}
          />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {relatedMatches.map((match) => (
              <MatchCard key={match.id} match={match} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      {players.length > 0 ? (
        <section aria-labelledby="sh-players" className="mb-12">
          <SectionHeading id="sh-players" eyebrow="PLAYERS" title={dict.player} />
          <ul className="flex flex-wrap gap-1.5">
            {players.map((player) => (
              <li key={player.id}>
                <Link
                  href={href(locale, `/players/${player.slug}`)}
                  className="border-edge text-ink-soft hover:border-cyan/60 hover:text-cyan inline-block rounded-lg border px-3 py-1.5 text-xs transition-colors"
                >
                  {t(player.name)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="sh-news" className="mb-12">
        <SectionHeading id="sh-news" eyebrow="NEWS" title={dict.sectionNews} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {news.map((article) => (
            <NewsCard key={article.id} article={article} locale={locale} />
          ))}
        </div>
      </section>

      {services.length > 0 ? (
        <section aria-labelledby="sh-watch" className="mb-12">
          <SectionHeading id="sh-watch" eyebrow="WATCH" title={dict.whereToWatch} />
          <WatchOptions services={services} locale={locale} placement="shorts-landing" />
        </section>
      ) : null}

      <section aria-labelledby="sh-next" className="mb-4">
        <SectionHeading
          id="sh-next"
          eyebrow="NEXT"
          title={locale === "ja" ? "次に見る" : "What next"}
        />
        <div className="flex flex-wrap gap-2">
          <Link
            href={href(locale, "/videos")}
            className="border-edge text-ink-soft hover:border-cyan/60 hover:text-cyan rounded-lg border px-4 py-2.5 text-sm transition-colors"
          >
            {dict.sectionVideos}
          </Link>
          <Link
            href={href(locale, "/live")}
            className="border-edge text-ink-soft hover:border-cyan/60 hover:text-cyan rounded-lg border px-4 py-2.5 text-sm transition-colors"
          >
            {dict.ctaLiveScores}
          </Link>
          <Link
            href={href(locale, "/diagnosis/your-sport")}
            className="border-edge text-ink-soft hover:border-magenta/60 hover:text-magenta rounded-lg border px-4 py-2.5 text-sm transition-colors"
          >
            {dict.ctaFindYourSport}
          </Link>
        </div>
      </section>

      <JsonLd data={[breadcrumbJsonLd(locale, trail)]} />
    </>
  );
}
