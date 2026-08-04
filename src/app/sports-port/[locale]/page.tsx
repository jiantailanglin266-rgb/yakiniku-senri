import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { features, socials } from "@/sports/config/site";
import { findLocale, getDictionary, localeCodes, text } from "@/sports/i18n";
import type { LocalizedText, Match } from "@/sports/types";
import { sportsMetadata } from "@/sports/lib/seo";
import { href } from "@/sports/lib/url";
import { basePath } from "@/lib/base-path";
import {
  getFinishedMatches,
  getLatestNews,
  getLiveMatches,
  getMatchesOn,
  getUpcomingMatches,
} from "@/sports/lib/api";
import { referenceDayIso } from "@/sports/data/clock";
import { sports } from "@/sports/data/sports";
import { leagues, getLeague } from "@/sports/data/leagues";
import { getTeam } from "@/sports/data/teams";
import { players } from "@/sports/data/players";
import { standingsByLeague } from "@/sports/data/standings";
import { popularNews } from "@/sports/data/news";
import { longVideos, shortVideos } from "@/sports/data/videos";
import { streamingServices } from "@/sports/data/streaming";
import { web3Services, fanTokens, nftCollections } from "@/sports/data/web3";
import { diagnoses } from "@/sports/data/diagnoses";
import { faqsFor } from "@/sports/data/content";
import { getSport } from "@/sports/data/sports";

import { Hero } from "@/sports/components/hero/Hero";
import { LiveTicker, type TickerItem } from "@/sports/components/live/LiveTicker";
import { MatchCard, Timeline, FormStrip } from "@/sports/components/match/MatchParts";
import { StandingsTable } from "@/sports/components/standings/StandingsTable";
import { StreamingTable } from "@/sports/components/streaming/StreamingTable";
import {
  NewsCard,
  PlayerCard,
  SportCard,
  VideoCard,
  Web3Card,
} from "@/sports/components/cards/Cards";
import {
  FaqList,
  SectionHeading,
  StampLine,
  Badge,
  Crest,
} from "@/sports/components/ui/primitives";
import { Reveal } from "@/sports/components/ui/Reveal";
import { faqJsonLd, itemListJsonLd } from "@/sports/lib/structured-data";
import { JsonLd } from "@/sports/components/ui/primitives";

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
    path: "/",
    title: dict.siteTagline,
    description: dict.siteSubCopy,
  });
}

export default async function SportsHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const info = findLocale(raw);
  if (!info) notFound();

  const locale = info.code;
  const dict = getDictionary(locale);
  const t = (value: LocalizedText | undefined) => text(value, locale);

  const live = getLiveMatches();
  const today = getMatchesOn(referenceDayIso);
  const upcoming = getUpcomingMatches(6);
  const finished = getFinishedMatches(4);
  const latest = getLatestNews(6);
  const popular = popularNews(4);
  const featuredLeague = getLeague("premier-league");
  const featuredStandings = standingsByLeague("premier-league")[0];
  const featuredSport = getSport("football");

  const ticker: TickerItem[] = live.map((match) => {
    const home = getTeam(match.homeTeamId);
    const away = getTeam(match.awayTeamId);
    const league = getLeague(match.leagueId);
    return {
      id: match.id,
      slug: match.slug,
      status: match.status,
      clock: match.clock ?? null,
      league: league?.shortName ?? "",
      home: home?.shortName ?? "",
      away: away?.shortName ?? "",
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      accent: getSport(match.sportId)?.accent ?? "#22d3ee",
      fetchedAt: match.stamp.fetchedAt,
      refreshIntervalSec: match.stamp.refreshIntervalSec,
    };
  });

  // 選手ランキングはデモのため、今季成績の先頭項目で並べています
  const playerRanking = players.filter((player) => player.seasonStats.length > 0).slice(0, 6);
  const teamRanking = featuredStandings?.rows.slice(0, 5) ?? [];
  const homeFaqs = faqsFor("home");

  return (
    <>
      {/* 1. ファーストビュー */}
      <Hero
        locale={info}
        liveMatches={live}
        todayCount={today.length}
        leagueCount={leagues.length}
        sportCount={sports.length}
      />

      {/* 2. ライブスコアティッカー */}
      <section aria-labelledby="s-live" className="mb-14">
        <SectionHeading
          id="s-live"
          eyebrow="LIVE SCORES"
          title={dict.sectionLiveTicker}
          action={
            <Link href={href(locale, "/live")} className="text-cyan text-sm hover:underline">
              {dict.seeAll} →
            </Link>
          }
        />
        <LiveTicker items={ticker} locale={locale} basePath={basePath} />
      </section>

      {/* 3. 本日の注目試合 */}
      <section aria-labelledby="s-featured" className="mb-14">
        <SectionHeading id="s-featured" eyebrow="FEATURED" title={dict.sectionFeatured} />
        <div className="grid gap-4 lg:grid-cols-2">
          {[...live, ...upcoming].slice(0, 4).map((match, index) => (
            <Reveal key={match.id} delay={index * 0.06}>
              <FeaturedMatch match={match} locale={locale} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* 4. 競技カテゴリ */}
      <section aria-labelledby="s-sports" className="mb-14">
        <SectionHeading
          id="s-sports"
          eyebrow="SPORTS"
          title={dict.sectionSports}
          description={
            locale === "ja"
              ? "競技を追加しても表示項目・順位表・スタッツはデータ側の設定だけで切り替わります。"
              : "Adding a sport only changes data: columns, stats and scoreboards follow its configuration."
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sports.slice(0, 12).map((sport, index) => (
            <Reveal key={sport.id} delay={index * 0.03}>
              <SportCard sport={sport} locale={locale} />
            </Reveal>
          ))}
        </div>
        <div className="mt-4">
          <Link href={href(locale, "/leagues")} className="text-cyan text-sm hover:underline">
            {dict.seeAll} ({sports.length}) →
          </Link>
        </div>
      </section>

      {/* 5. 最新ニュース */}
      <section aria-labelledby="s-news" className="mb-14">
        <SectionHeading
          id="s-news"
          eyebrow="NEWS"
          title={dict.sectionNews}
          description={dict.confidenceNote}
          action={
            <Link href={href(locale, "/news")} className="text-cyan text-sm hover:underline">
              {dict.seeAll} →
            </Link>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {latest.map((article, index) => (
            <Reveal key={article.id} delay={index * 0.04}>
              <NewsCard article={article} locale={locale} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* 6. 試合速報 */}
      {live.length > 0 ? (
        <section aria-labelledby="s-feed" className="mb-14">
          <SectionHeading id="s-feed" eyebrow="LIVE FEED" title={dict.sectionLiveFeed} />
          <div className="grid gap-4 lg:grid-cols-2">
            {live.slice(0, 2).map((match) => (
              <div key={match.id} className="sp-solid p-5">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <Link
                    href={href(locale, `/matches/${match.slug}`)}
                    className="text-ink hover:text-cyan text-sm font-semibold"
                  >
                    {t(getTeam(match.homeTeamId)?.name)} {match.homeScore}–{match.awayScore}{" "}
                    {t(getTeam(match.awayTeamId)?.name)}
                  </Link>
                  <Badge tone="live">{match.clock}</Badge>
                </div>
                <Timeline match={match} locale={locale} />
                <StampLine stamp={match.stamp} locale={locale} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* 7. 今日の試合日程 */}
      <section aria-labelledby="s-schedule" className="mb-14">
        <SectionHeading
          id="s-schedule"
          eyebrow="SCHEDULE"
          title={dict.sectionSchedule}
          description={dict.timezoneNote}
          action={
            <Link href={href(locale, "/matches")} className="text-cyan text-sm hover:underline">
              {dict.seeAll} →
            </Link>
          }
        />
        {today.length === 0 ? (
          <p className="sp-solid text-ink-dim p-6 text-sm">{dict.noMatchesToday}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {today.slice(0, 6).map((match, index) => (
              <Reveal key={match.id} delay={index * 0.04}>
                <MatchCard match={match} locale={locale} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* 8. 試合結果 */}
      <section aria-labelledby="s-results" className="mb-14">
        <SectionHeading id="s-results" eyebrow="RESULTS" title={dict.sectionResults} />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {finished.map((match, index) => (
            <Reveal key={match.id} delay={index * 0.04}>
              <MatchCard match={match} locale={locale} compact />
            </Reveal>
          ))}
        </div>
      </section>

      {/* 9. リーグ順位表 */}
      {featuredStandings && featuredSport && featuredLeague ? (
        <section aria-labelledby="s-standings" className="mb-14">
          <SectionHeading
            id="s-standings"
            eyebrow="STANDINGS"
            title={`${dict.sectionStandings} — ${t(featuredLeague.name)}`}
            action={
              <Link
                href={href(locale, `/leagues/${featuredLeague.slug}`)}
                className="text-cyan text-sm hover:underline"
              >
                {dict.seeAll} →
              </Link>
            }
          />
          <StandingsTable standing={featuredStandings} sport={featuredSport} locale={locale} />
          <StampLine stamp={featuredStandings.stamp} locale={locale} />
        </section>
      ) : null}

      {/* 10-11. 選手ランキング / チームランキング */}
      <div className="mb-14 grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="s-players">
          <SectionHeading id="s-players" eyebrow="PLAYERS" title={dict.sectionPlayerRanking} />
          <div className="space-y-2">
            {playerRanking.map((player, index) => (
              <Reveal key={player.id} delay={index * 0.03} from="left">
                <PlayerCard player={player} locale={locale} />
              </Reveal>
            ))}
          </div>
        </section>

        <section aria-labelledby="s-teams">
          <SectionHeading id="s-teams" eyebrow="TEAMS" title={dict.sectionTeamRanking} />
          <ol className="space-y-2">
            {teamRanking.map((row, index) => {
              const team = getTeam(row.teamId);
              if (!team) return null;
              return (
                <li key={row.teamId}>
                  <Reveal delay={index * 0.03} from="right">
                    <Link
                      href={href(locale, `/teams/${team.slug}`)}
                      className="sp-solid sp-tilt flex items-center gap-3 p-4"
                    >
                      <span className="sp-mono text-cyan w-6 text-center text-lg font-extrabold">
                        {row.rank}
                      </span>
                      <Crest {...team.crest} size={30} />
                      <span className="text-ink min-w-0 flex-1 truncate text-sm">
                        {t(team.name)}
                      </span>
                      <FormStrip form={row.form} />
                    </Link>
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      {/* 12-13. 人気ニュース / 急上昇 */}
      <div className="mb-14 grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="s-popular">
          <SectionHeading id="s-popular" eyebrow="POPULAR" title={dict.sectionPopular} />
          <ol className="space-y-2">
            {popular.map((article, index) => (
              <li key={article.id}>
                <Link
                  href={href(locale, `/news/${article.slug}`)}
                  className="sp-solid hover:border-cyan/50 flex items-start gap-3 p-3 transition-colors"
                >
                  <span className="sp-mono text-ink-faint w-5 shrink-0 text-center text-lg font-extrabold">
                    {index + 1}
                  </span>
                  <span className="text-ink-soft min-w-0 text-sm">{t(article.title)}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="s-trending">
          <SectionHeading id="s-trending" eyebrow="TRENDING" title={dict.sectionTrending} />
          <div className="grid gap-3 sm:grid-cols-2">
            {shortVideos()
              .slice(0, 4)
              .map((video) => (
                <VideoCard key={video.id} video={video} locale={locale} />
              ))}
          </div>
        </section>
      </div>

      {/* 14. スポーツ動画 */}
      <section aria-labelledby="s-videos" className="mb-14">
        <SectionHeading
          id="s-videos"
          eyebrow="VIDEOS"
          title={dict.sectionVideos}
          action={
            <Link href={href(locale, "/videos")} className="text-cyan text-sm hover:underline">
              {dict.seeAll} →
            </Link>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {longVideos()
            .slice(0, 3)
            .map((video, index) => (
              <Reveal key={video.id} delay={index * 0.05}>
                <VideoCard video={video} locale={locale} />
              </Reveal>
            ))}
        </div>
      </section>

      {/* 15. 配信サービス比較 */}
      <section aria-labelledby="s-streaming" className="mb-14">
        <SectionHeading
          id="s-streaming"
          eyebrow="STREAMING"
          title={dict.sectionStreaming}
          action={
            <Link href={href(locale, "/streaming")} className="text-cyan text-sm hover:underline">
              {dict.seeAll} →
            </Link>
          }
        />
        <StreamingTable
          services={streamingServices.slice(0, 4)}
          locale={locale}
          placement="home-streaming"
        />
      </section>

      {/* 16. スポーツ分析ツール */}
      <section aria-labelledby="s-analytics" className="mb-14">
        <SectionHeading
          id="s-analytics"
          eyebrow="ANALYTICS"
          title={dict.sectionAnalytics}
          description={dict.predictionDisclaimer}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { key: "compare", ja: "チーム比較", en: "Team comparison", path: "/matches" },
            { key: "form", ja: "直近成績・対戦成績", en: "Form & head-to-head", path: "/leagues" },
            {
              key: "player",
              ja: "選手スタッツ比較",
              en: "Player stat comparison",
              path: "/leagues",
            },
            { key: "trend", ja: "順位推移", en: "Position trends", path: "/leagues" },
          ].map((tool) => (
            <Link key={tool.key} href={href(locale, tool.path)} className="sp-solid sp-tilt p-4">
              <p className="text-ink text-sm font-semibold">
                {locale === "ja" ? tool.ja : tool.en}
              </p>
              <p className="sp-mono text-ink-faint mt-1 text-[0.625rem]">
                {locale === "ja" ? "元データと集計日時を併記" : "Source and timestamp included"}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 17-19. Web3.0 / ファントークン / NFT */}
      {features.web3 ? (
        <>
          <section aria-labelledby="s-web3" className="mb-14">
            <SectionHeading
              id="s-web3"
              eyebrow="WEB3"
              title={dict.sectionWeb3}
              description={dict.web3Risk}
              action={
                <Link href={href(locale, "/web3")} className="text-cyan text-sm hover:underline">
                  {dict.seeAll} →
                </Link>
              }
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {web3Services.slice(0, 4).map((service, index) => (
                <Reveal key={service.id} delay={index * 0.04}>
                  <Web3Card service={service} locale={locale} />
                </Reveal>
              ))}
            </div>
          </section>

          <div className="mb-14 grid gap-10 lg:grid-cols-2">
            <section aria-labelledby="s-tokens">
              <SectionHeading id="s-tokens" eyebrow="FAN TOKENS" title={dict.sectionFanTokens} />
              <ul className="space-y-2">
                {fanTokens.slice(0, 3).map((token) => (
                  <li
                    key={token.id}
                    className="sp-solid flex items-center justify-between gap-3 p-3"
                  >
                    <span className="min-w-0">
                      <span className="sp-mono text-ink block text-sm">{token.symbol}</span>
                      <span className="text-ink-faint block truncate text-[0.6875rem]">
                        {token.teamName}
                      </span>
                    </span>
                    <span className="sp-mono text-ink-faint shrink-0 text-[0.625rem]">
                      {token.chain}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3">
                <Link
                  href={href(locale, "/fan-tokens")}
                  className="text-cyan text-sm hover:underline"
                >
                  {dict.seeAll} →
                </Link>
              </p>
            </section>

            <section aria-labelledby="s-nfts">
              <SectionHeading id="s-nfts" eyebrow="NFT" title={dict.sectionNfts} />
              <ul className="space-y-2">
                {nftCollections.map((collection) => (
                  <li key={collection.id} className="sp-solid p-3">
                    <p className="text-ink text-sm">{collection.name}</p>
                    <p className="text-ink-faint mt-0.5 text-[0.6875rem]">
                      {t(collection.summary)}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="mt-3">
                <Link href={href(locale, "/nfts")} className="text-cyan text-sm hover:underline">
                  {dict.seeAll} →
                </Link>
              </p>
            </section>
          </div>
        </>
      ) : null}

      {/* 20. AI診断 */}
      {features.diagnosis ? (
        <section aria-labelledby="s-diagnosis" className="mb-14">
          <SectionHeading
            id="s-diagnosis"
            eyebrow="QUIZ"
            title={dict.sectionDiagnosis}
            description={dict.diagnosisNote}
            action={
              <Link href={href(locale, "/diagnosis")} className="text-cyan text-sm hover:underline">
                {dict.seeAll} ({diagnoses.length}) →
              </Link>
            }
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {diagnoses.slice(0, 6).map((diagnosis, index) => (
              <Reveal key={diagnosis.id} delay={index * 0.04}>
                <Link
                  href={href(locale, `/diagnosis/${diagnosis.slug}`)}
                  className="sp-solid sp-tilt block p-4"
                >
                  <p className="text-ink text-sm font-semibold">{t(diagnosis.title)}</p>
                  <p className="text-ink-dim mt-1.5 line-clamp-2 text-xs">{t(diagnosis.lead)}</p>
                  <p className="sp-mono text-cyan mt-3 text-[0.625rem]">{dict.startDiagnosis} →</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {/* 21. AIチャットボット */}
      <section aria-labelledby="s-chat" className="mb-14">
        <SectionHeading id="s-chat" eyebrow="AI ASSISTANT" title={dict.sectionChatbot} />
        <div className="sp-glass sp-holo p-6">
          <p className="text-ink-soft text-sm">{dict.chatIntro}</p>
          <p className="text-ink-faint mt-3 text-xs leading-relaxed">{dict.chatRealtimeNote}</p>
          <p className="text-cyan mt-4 text-xs">
            {locale === "ja"
              ? "画面右下のボタンから開けます。"
              : "Open it from the button at the bottom right."}
          </p>
        </div>
      </section>

      {/* 22. 初心者向けガイド */}
      <section aria-labelledby="s-beginner" className="mb-14">
        <SectionHeading
          id="s-beginner"
          eyebrow="GUIDE"
          title={dict.sectionBeginner}
          action={
            <Link href={href(locale, "/guide")} className="text-cyan text-sm hover:underline">
              {dict.seeAll} →
            </Link>
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sports.slice(0, 3).map((sport) => (
            <div key={sport.id} className="sp-solid p-4">
              <p className="text-ink text-sm font-semibold">
                {sport.glyph} {t(sport.name)}
              </p>
              <p className="text-ink-dim mt-1.5 text-xs leading-relaxed">{t(sport.primer)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 23. メルマガ・LINE・SNS */}
      <section aria-labelledby="s-follow" className="mb-14">
        <SectionHeading id="s-follow" eyebrow="STAY UPDATED" title={dict.sectionFollow} />
        <div className="sp-solid flex flex-wrap items-center gap-3 p-6">
          <p className="text-ink-soft min-w-0 flex-1 text-sm">
            {locale === "ja"
              ? "試合開始・得点・移籍の通知は、お気に入り登録した競技・リーグ・チーム・選手に絞って配信する設計です（配信機能は今後の実装）。"
              : "Notifications for kick-off, goals and transfers are scoped to what you follow. Delivery is not implemented yet."}
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(socials)
              .filter(([, url]) => Boolean(url))
              .map(([key, url]) => (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sp-mono border-edge text-ink-soft hover:border-cyan/60 hover:text-cyan rounded-lg border px-3 py-2 text-xs uppercase transition-colors"
                >
                  {key}
                </a>
              ))}
            {Object.values(socials).every((url) => !url) ? (
              <span className="sp-mono text-ink-faint text-[0.6875rem]">
                {locale === "ja"
                  ? "SNSアカウントは未設定です（config/site.ts で設定できます）"
                  : "No social accounts configured yet (see config/site.ts)"}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      {/* 24. FAQ */}
      <section aria-labelledby="s-faq" className="mb-4">
        <SectionHeading id="s-faq" eyebrow="FAQ" title={dict.sectionFaq} />
        <FaqList items={homeFaqs} locale={locale} t={t} />
      </section>

      <JsonLd
        data={[
          faqJsonLd(homeFaqs.map((faq) => ({ question: t(faq.question), answer: t(faq.answer) }))),
          itemListJsonLd(
            locale,
            live.map((match) => ({
              name: `${text(getTeam(match.homeTeamId)?.name, locale)} vs ${text(getTeam(match.awayTeamId)?.name, locale)}`,
              path: `/matches/${match.slug}`,
            })),
          ),
        ]}
      />
    </>
  );
}

/* ------------------------------------------------------------------
   注目試合カード（順位・直近成績・見どころ・配信までを1枚に）
   ------------------------------------------------------------------ */
function FeaturedMatch({ match, locale }: { match: Match; locale: string }) {
  const dict = getDictionary(locale);
  const home = getTeam(match.homeTeamId);
  const away = getTeam(match.awayTeamId);
  const league = getLeague(match.leagueId);
  const sport = getSport(match.sportId);
  const standing = standingsByLeague(match.leagueId)[0];
  const rankOf = (teamId: string) => standing?.rows.find((row) => row.teamId === teamId);

  if (!home || !away) return null;

  return (
    <article className="sp-solid overflow-hidden">
      <div
        className="border-edge border-b px-5 py-3"
        style={{
          background: `linear-gradient(90deg, ${sport?.accent ?? "#22d3ee"}1a, transparent)`,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className="sp-mono text-[0.625rem] tracking-wider uppercase"
            style={{ color: sport?.accent }}
          >
            {sport?.glyph} {league ? text(league.name, locale) : ""}
            {match.round ? ` · ${text(match.round, locale)}` : ""}
          </span>
          <Badge tone={match.status === "live" ? "live" : "accent"}>
            {match.status === "live" ? `${dict.liveNow} ${match.clock}` : dict.statusScheduled}
          </Badge>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          {[home, away].map((team, index) => {
            const row = rankOf(team.id);
            const score = index === 0 ? match.homeScore : match.awayScore;
            return (
              <div key={team.id} className={index === 1 ? "order-3 text-right" : ""}>
                <div className={`flex items-center gap-2 ${index === 1 ? "flex-row-reverse" : ""}`}>
                  <Crest {...team.crest} size={34} />
                  <div className="min-w-0">
                    <Link
                      href={href(locale, `/teams/${team.slug}`)}
                      className="text-ink hover:text-cyan block truncate text-sm font-semibold"
                    >
                      {text(team.name, locale)}
                    </Link>
                    {row ? (
                      <span className="sp-mono text-ink-faint block text-[0.625rem]">
                        {dict.rank} {row.rank}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className={`mt-2 flex ${index === 1 ? "justify-end" : ""}`}>
                  <FormStrip form={row?.form} />
                </div>
                <span className="sr-only">{score ?? ""}</span>
              </div>
            );
          })}

          <div className="order-2 text-center">
            <span className="sp-mono text-ink text-3xl font-extrabold" data-score>
              {match.homeScore ?? "–"}
              <span className="text-ink-faint mx-1">:</span>
              {match.awayScore ?? "–"}
            </span>
          </div>
        </div>

        {match.preview ? (
          <p className="border-edge text-ink-dim mt-4 line-clamp-3 border-t pt-4 text-xs leading-relaxed">
            <span className="sp-eyebrow mr-2">{dict.preview}</span>
            {text(match.preview, locale)}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            href={href(locale, `/matches/${match.slug}`)}
            className="bg-cyan/15 text-cyan hover:bg-cyan/25 rounded-lg px-3 py-1.5 text-xs transition-colors"
          >
            {dict.ctaMatchDetail} →
          </Link>
          {match.broadcastIds.length > 0 ? (
            <Link
              href={href(locale, "/streaming")}
              className="border-edge text-ink-soft hover:border-cyan/60 hover:text-cyan rounded-lg border px-3 py-1.5 text-xs transition-colors"
            >
              {dict.ctaWatchOn}
            </Link>
          ) : null}
        </div>

        <StampLine stamp={match.stamp} locale={locale} />
      </div>
    </article>
  );
}
