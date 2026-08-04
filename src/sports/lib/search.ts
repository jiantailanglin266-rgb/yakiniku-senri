/**
 * サイト内検索。
 *
 * 表記ゆれ（「マンU」「Man United」「Manchester United」）に対応するため、
 * 各エンティティが持つ aliases を検索キーワードに含めます。
 * 静的書き出しでも動くよう、索引はビルド時にメモリ上で構築します。
 */
import type { SearchDoc } from "../types";
import { text } from "../i18n";
import { sports } from "../data/sports";
import { leagues } from "../data/leagues";
import { teams } from "../data/teams";
import { players } from "../data/players";
import { matches } from "../data/matches";
import { news } from "../data/news";
import { videos } from "../data/videos";
import { streamingServices } from "../data/streaming";
import { web3Services } from "../data/web3";
import { faqs, glossary } from "../data/content";
import { getSport } from "../data/sports";
import { getLeague } from "../data/leagues";
import { getTeam } from "../data/teams";

const cache = new Map<string, SearchDoc[]>();

/** ロケールごとの検索索引を構築します（初回のみ） */
export function searchIndex(locale: string): SearchDoc[] {
  const cached = cache.get(locale);
  if (cached) return cached;

  const docs: SearchDoc[] = [];

  for (const sport of sports) {
    docs.push({
      id: `sport-${sport.id}`,
      type: "sport",
      title: text(sport.name, locale),
      subtitle: text(sport.primer, locale),
      href: `/sports/${sport.slug}`,
      keywords: [sport.slug, text(sport.name, "ja"), text(sport.name, "en")],
      accent: sport.accent,
    });
  }

  for (const league of leagues) {
    docs.push({
      id: `league-${league.id}`,
      type: "league",
      title: text(league.name, locale),
      subtitle: `${league.shortName} · ${league.season}`,
      href: `/leagues/${league.slug}`,
      keywords: [league.slug, league.shortName, text(league.name, "ja"), text(league.name, "en")],
      accent: league.accent,
    });
  }

  for (const team of teams) {
    const league = getLeague(team.leagueId);
    docs.push({
      id: `team-${team.id}`,
      type: "team",
      title: text(team.name, locale),
      subtitle: league ? text(league.name, locale) : text(team.city, locale),
      href: `/teams/${team.slug}`,
      keywords: [
        team.slug,
        team.shortName,
        ...team.aliases,
        text(team.name, "ja"),
        text(team.name, "en"),
      ],
      accent: team.crest.primary,
    });
  }

  for (const player of players) {
    const team = getTeam(player.teamId);
    docs.push({
      id: `player-${player.id}`,
      type: "player",
      title: text(player.name, locale),
      subtitle: [text(player.position, locale), team ? text(team.name, locale) : ""]
        .filter(Boolean)
        .join(" · "),
      href: `/players/${player.slug}`,
      keywords: [player.slug, ...player.aliases, text(player.name, "ja"), text(player.name, "en")],
      accent: getSport(player.sportId)?.accent ?? "#22d3ee",
    });
  }

  for (const match of matches) {
    const home = getTeam(match.homeTeamId);
    const away = getTeam(match.awayTeamId);
    const league = getLeague(match.leagueId);
    docs.push({
      id: `match-${match.id}`,
      type: "match",
      title: `${home ? text(home.name, locale) : ""} vs ${away ? text(away.name, locale) : ""}`,
      subtitle: league ? text(league.name, locale) : "",
      href: `/matches/${match.slug}`,
      keywords: [
        match.slug,
        ...(home?.aliases ?? []),
        ...(away?.aliases ?? []),
        ...(league ? [league.shortName] : []),
      ],
      accent: getSport(match.sportId)?.accent ?? "#22d3ee",
    });
  }

  for (const article of news) {
    docs.push({
      id: `news-${article.id}`,
      type: "news",
      title: text(article.title, locale),
      subtitle: text(article.summary, locale),
      href: `/news/${article.slug}`,
      keywords: [
        article.slug,
        article.category,
        text(article.title, "ja"),
        text(article.title, "en"),
      ],
      accent: article.accent ?? "#6366f1",
    });
  }

  for (const video of videos) {
    docs.push({
      id: `video-${video.id}`,
      type: "video",
      title: text(video.title, locale),
      subtitle: video.channel.name,
      href: `/videos/${video.slug}`,
      keywords: [video.slug, text(video.title, "ja"), text(video.title, "en")],
      accent: "#d946ef",
    });
  }

  for (const service of streamingServices) {
    docs.push({
      id: `streaming-${service.id}`,
      type: "streaming",
      title: service.name,
      subtitle: text(service.notes, locale),
      href: `/streaming#${service.slug}`,
      keywords: [service.slug, service.name],
      accent: "#22d3ee",
    });
  }

  for (const service of web3Services) {
    docs.push({
      id: `web3-${service.id}`,
      type: "web3",
      title: service.name,
      subtitle: text(service.summary, locale),
      href: `/web3/${service.slug}`,
      keywords: [service.slug, service.name, service.category],
      accent: "#a855f7",
    });
  }

  for (const faq of faqs) {
    docs.push({
      id: `faq-${faq.id}`,
      type: "faq",
      title: text(faq.question, locale),
      subtitle: text(faq.answer, locale).slice(0, 90),
      href: `/faq#${faq.id}`,
      keywords: [text(faq.question, "ja"), text(faq.question, "en")],
      accent: "#38bdf8",
    });
  }

  for (const term of glossary) {
    docs.push({
      id: `glossary-${term.id}`,
      type: "glossary",
      title: text(term.term, locale),
      subtitle: text(term.description, locale).slice(0, 90),
      href: `/guide#${term.id}`,
      keywords: [...term.aliases, text(term.term, "ja"), text(term.term, "en")],
      accent: "#34d399",
    });
  }

  cache.set(locale, docs);
  return docs;
}

function normalise(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[・　\s.\-_]/g, "")
      // 全角英数を半角へ（「ＭａｎＵ」でも引けるように）
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
  );
}

export type SearchHit = SearchDoc & { score: number };

/** 単純なスコアリング検索。前方一致を強く、部分一致を弱く評価します。 */
export function searchDocs(query: string, locale: string, limit = 30): SearchHit[] {
  const q = normalise(query);
  if (!q) return [];

  const hits: SearchHit[] = [];
  for (const doc of searchIndex(locale)) {
    const haystacks = [doc.title, doc.subtitle, ...doc.keywords].map(normalise);
    let score = 0;
    for (const [index, hay] of haystacks.entries()) {
      if (!hay) continue;
      const weight = index === 0 ? 3 : index === 1 ? 1 : 2;
      if (hay === q) score += 10 * weight;
      else if (hay.startsWith(q)) score += 5 * weight;
      else if (hay.includes(q)) score += 2 * weight;
    }
    if (score > 0) hits.push({ ...doc, score });
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
