/**
 * 一覧に並ぶカード群。
 * 見出し・要約・出所・日時の並び順をここで統一しています。
 */
import Link from "next/link";
import type { League, NewsArticle, Player, Sport, Team, VideoItem, Web3Service } from "../../types";
import { getDictionary, text } from "../../i18n";
import { href } from "../../lib/url";
import { formatDuration } from "../../lib/format";
import { Badge, Crest } from "../ui/primitives";
import { LocalTime } from "../ui/LocalTime";
import { getSport } from "../../data/sports";
import { getLeague } from "../../data/leagues";
import { getTeam } from "../../data/teams";
import { authorsById } from "../../data/news";
import { MediaSlot } from "@/media/components";
import { pageKey } from "@/media/data/usages";

/* ------------------------------------------------------------------
   ニュース
   ------------------------------------------------------------------ */
const categoryLabel: Record<string, { ja: string; en: string }> = {
  breaking: { ja: "速報", en: "Breaking" },
  transfer: { ja: "移籍", en: "Transfer" },
  contract: { ja: "契約", en: "Contract" },
  injury: { ja: "負傷", en: "Injury" },
  retirement: { ja: "引退", en: "Retirement" },
  tournament: { ja: "大会", en: "Tournament" },
  record: { ja: "記録更新", en: "Record" },
  interview: { ja: "インタビュー", en: "Interview" },
  tactics: { ja: "戦術", en: "Tactics" },
  analysis: { ja: "分析", en: "Analysis" },
  broadcast: { ja: "放送", en: "Broadcast" },
  sponsor: { ja: "スポンサー", en: "Sponsor" },
  web3: { ja: "Web3.0", en: "Web3" },
  esports: { ja: "eスポーツ", en: "Esports" },
};

/**
 * 装飾の見た目を、スラッグから決定的に決めるための種。
 *
 * 乱数を使うと、再ビルドのたびに絵柄が変わり、
 * サーバー描画とクライアント描画でも食い違います。
 */
function seedFrom(slug: string): number {
  let hash = 0;
  for (let index = 0; index < slug.length; index += 1) {
    hash = (hash * 31 + slug.charCodeAt(index)) % 1000;
  }
  return hash;
}

export function confidenceTone(confidence: NewsArticle["confidence"]) {
  return confidence === "official" ? "success" : confidence === "report" ? "accent" : "caution";
}

export function confidenceLabel(confidence: NewsArticle["confidence"], locale: string) {
  const dict = getDictionary(locale);
  return confidence === "official"
    ? dict.confidenceOfficial
    : confidence === "report"
      ? dict.confidenceReport
      : dict.confidenceRumour;
}

export function NewsCard({ article, locale }: { article: NewsArticle; locale: string }) {
  const dict = getDictionary(locale);
  const sport = getSport(article.sportId);
  const author = authorsById.get(article.authorId);

  return (
    <article className="sp-solid sp-tilt flex h-full flex-col overflow-hidden">
      {/*
        承認済みの Wikimedia 画像があればそれを、無ければ生成ビジュアルを出します。
        報道写真は権利関係が重く、確認が済むまでは生成ビジュアルのままにします。
      */}
      <Link href={href(locale, `/news/${article.slug}`)} className="border-edge block border-b">
        <MediaSlot
          pageKey={pageKey("sportsport", "news", article.slug)}
          slot="card"
          locale={locale}
          theme="news"
          seed={seedFrom(article.slug)}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          showCaption={false}
          className="aspect-[16/9]"
        />
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <Badge tone={article.priority >= 5 ? "live" : "neutral"}>
            {text(categoryLabel[article.category], locale)}
          </Badge>
          <Badge tone={confidenceTone(article.confidence)}>
            {confidenceLabel(article.confidence, locale)}
          </Badge>
          {sport ? (
            <span className="sp-mono text-[0.625rem]" style={{ color: sport.accent }}>
              {sport.glyph} {text(sport.name, locale)}
            </span>
          ) : null}
        </div>

        <h3 className="text-ink text-base leading-snug font-bold">
          <Link
            href={href(locale, `/news/${article.slug}`)}
            className="hover:text-cyan transition-colors"
          >
            {text(article.title, locale)}
          </Link>
        </h3>
        <p className="text-ink-dim mt-2 line-clamp-3 flex-1 text-sm">
          {text(article.summary, locale)}
        </p>

        <div className="border-edge text-ink-faint mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-3 text-[0.6875rem]">
          <LocalTime iso={article.publishedAt} locale={locale} className="sp-mono" />
          <span>
            {dict.readingTime}: {article.readingMinutes} min
          </span>
          {author ? <span className="truncate">{text(author.name, locale)}</span> : null}
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------
   動画
   ------------------------------------------------------------------ */
export function VideoCard({ video, locale }: { video: VideoItem; locale: string }) {
  return (
    <article className="sp-solid sp-tilt flex h-full flex-col overflow-hidden">
      <Link href={href(locale, `/videos/${video.slug}`)} className="block">
        <div className="border-edge relative border-b">
          {/*
            承認済みの Wikimedia 画像があればそれを、無ければ生成ビジュアルを出します。
            関連性の低い画像を装飾目的で並べない方針のため、既定は生成ビジュアルです。
          */}
          <MediaSlot
            pageKey={pageKey("sportsport", "video", video.slug)}
            slot="card"
            locale={locale}
            theme="video"
            seed={seedFrom(video.slug)}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            showCaption={false}
            className="aspect-[16/9]"
          />
          <span className="sp-mono bg-void/80 text-ink absolute right-2 bottom-2 rounded-sm px-1.5 py-0.5 text-[0.625rem]">
            {formatDuration(video.durationSec)}
          </span>
          {video.kind === "short" ? (
            <span className="absolute top-2 left-2">
              <Badge tone="accent">SHORTS</Badge>
            </span>
          ) : null}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-ink text-sm leading-snug font-semibold">
          <Link
            href={href(locale, `/videos/${video.slug}`)}
            className="hover:text-cyan transition-colors"
          >
            {text(video.title, locale)}
          </Link>
        </h3>
        <p className="text-ink-dim mt-1.5 line-clamp-2 flex-1 text-xs">
          {text(video.description, locale)}
        </p>
        <div className="text-ink-faint mt-3 flex items-center justify-between text-[0.6875rem]">
          <span className="truncate">{video.channel.name}</span>
          <LocalTime
            iso={video.publishedAt}
            locale={locale}
            kind="date"
            className="sp-mono shrink-0"
          />
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------
   競技・リーグ・チーム・選手
   ------------------------------------------------------------------ */
export function SportCard({ sport, locale }: { sport: Sport; locale: string }) {
  return (
    <Link
      href={href(locale, `/sports/${sport.slug}`)}
      className="sp-solid sp-tilt group flex items-center gap-3 p-4"
      style={{ borderColor: "var(--color-edge)" }}
    >
      <span
        className="grid size-11 shrink-0 place-items-center rounded-xl text-xl"
        style={{ background: `${sport.accent}1f`, boxShadow: `inset 0 0 0 1px ${sport.accent}44` }}
        aria-hidden="true"
      >
        {sport.glyph}
      </span>
      <span className="min-w-0">
        <span className="text-ink block truncate text-sm font-semibold">
          {text(sport.name, locale)}
        </span>
        <span className="text-ink-faint mt-0.5 line-clamp-1 block text-[0.6875rem]">
          {text(sport.primer, locale)}
        </span>
      </span>
    </Link>
  );
}

export function LeagueCard({ league, locale }: { league: League; locale: string }) {
  const sport = getSport(league.sportId);
  return (
    <Link href={href(locale, `/leagues/${league.slug}`)} className="sp-solid sp-tilt block p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="sp-mono text-[0.625rem] tracking-wider" style={{ color: league.accent }}>
          {league.shortName}
        </span>
        <span className="sp-mono text-ink-faint text-[0.625rem] uppercase">{league.country}</span>
      </div>
      <h3 className="text-ink text-sm font-semibold">{text(league.name, locale)}</h3>
      <p className="text-ink-dim mt-1 line-clamp-2 text-xs">{text(league.description, locale)}</p>
      <p className="sp-mono text-ink-faint mt-2 text-[0.625rem]">
        {sport ? `${sport.glyph} ${text(sport.name, locale)}` : ""} · {league.season}
      </p>
    </Link>
  );
}

export function TeamCard({ team, locale }: { team: Team; locale: string }) {
  const league = getLeague(team.leagueId);
  return (
    <Link
      href={href(locale, `/teams/${team.slug}`)}
      className="sp-solid sp-tilt flex items-center gap-3 p-4"
    >
      <Crest {...team.crest} size={38} />
      <span className="min-w-0">
        <span className="text-ink block truncate text-sm font-semibold">
          {text(team.name, locale)}
        </span>
        <span className="text-ink-faint block truncate text-[0.6875rem]">
          {league ? text(league.name, locale) : ""} · {text(team.city, locale)}
        </span>
      </span>
    </Link>
  );
}

export function PlayerCard({ player, locale }: { player: Player; locale: string }) {
  const team = getTeam(player.teamId);
  const sport = getSport(player.sportId);
  return (
    <Link
      href={href(locale, `/players/${player.slug}`)}
      className="sp-solid sp-tilt flex items-center gap-3 p-4"
    >
      {/* 写真は権利上掲載しないため、シルエットで代替します */}
      <span
        className="grid size-10 shrink-0 place-items-center rounded-full text-base"
        style={{ background: `${sport?.accent ?? "#22d3ee"}22` }}
        aria-hidden="true"
      >
        {player.number ?? "#"}
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-ink block truncate text-sm font-semibold">
          {text(player.name, locale)}
        </span>
        <span className="text-ink-faint block truncate text-[0.6875rem]">
          {text(player.position, locale)}
          {team ? ` · ${text(team.name, locale)}` : ""}
        </span>
      </span>
      {player.seasonStats[0] ? (
        <span className="sp-mono shrink-0 text-right">
          <span className="text-ink block text-sm font-bold">{player.seasonStats[0].value}</span>
          <span className="text-ink-faint block text-[0.5625rem]">
            {text(player.seasonStats[0].label, locale)}
          </span>
        </span>
      ) : null}
    </Link>
  );
}

export function Web3Card({ service, locale }: { service: Web3Service; locale: string }) {
  return (
    <Link
      href={href(locale, `/web3/${service.slug}`)}
      className="sp-solid sp-tilt flex h-full flex-col p-4"
    >
      <div className="mb-2">
        <Badge tone="accent">{service.category}</Badge>
      </div>
      <h3 className="text-ink text-sm font-semibold">{service.name}</h3>
      <p className="text-ink-dim mt-1.5 line-clamp-3 flex-1 text-xs">
        {text(service.summary, locale)}
      </p>
      <p className="sp-mono border-edge text-ink-faint mt-3 border-t pt-3 text-[0.625rem]">
        {service.chains.length ? service.chains.join(" / ") : "—"}
      </p>
    </Link>
  );
}
