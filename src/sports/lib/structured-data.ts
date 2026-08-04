/**
 * 構造化データ（JSON-LD）。
 *
 * ■ 画面に表示している内容とだけ一致させます。
 * ■ AggregateRating / Review は実データが無いため出力しません。
 *   （評価の実体が無い状態で出すと、ポリシー違反かつ優良誤認になります）
 * ■ SportsEvent の eventStatus は試合状況と必ず一致させます。
 */
import type { Match, NewsArticle, Player, Sport, Team, VideoItem } from "../types";
import { brand } from "../config/site";
import { text } from "../i18n";
import { absoluteUrl } from "./url";
import { getTeam, getVenue } from "../data/teams";
import { getLeague } from "../data/leagues";
import { authorsById } from "../data/news";

type Json = Record<string, unknown>;

export function organizationJsonLd(locale: string): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${brand.origin}/#organization`,
    name: brand.name,
    url: absoluteUrl(locale, "/"),
    description: text(brand.subCopy, locale),
  };
}

export function websiteJsonLd(locale: string): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${brand.origin}/#website`,
    name: brand.name,
    url: absoluteUrl(locale, "/"),
    inLanguage: locale,
    publisher: { "@id": `${brand.origin}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl(locale, "/search")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(locale: string, trail: { label: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: absoluteUrl(locale, item.path),
    })),
  };
}

const eventStatusMap: Record<Match["status"], string> = {
  scheduled: "https://schema.org/EventScheduled",
  live: "https://schema.org/EventScheduled",
  break: "https://schema.org/EventScheduled",
  extra: "https://schema.org/EventScheduled",
  finished: "https://schema.org/EventScheduled",
  postponed: "https://schema.org/EventPostponed",
  cancelled: "https://schema.org/EventCancelled",
};

export function sportsEventJsonLd(locale: string, match: Match): Json {
  const home = getTeam(match.homeTeamId);
  const away = getTeam(match.awayTeamId);
  const league = getLeague(match.leagueId);
  const venue = getVenue(match.venueId);

  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${home ? text(home.name, locale) : ""} vs ${away ? text(away.name, locale) : ""}`,
    startDate: match.kickoff,
    eventStatus: eventStatusMap[match.status],
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: absoluteUrl(locale, `/matches/${match.slug}`),
    ...(league ? { superEvent: { "@type": "SportsEvent", name: text(league.name, locale) } } : {}),
    ...(venue
      ? {
          location: {
            "@type": "Place",
            name: text(venue.name, locale),
            address: {
              "@type": "PostalAddress",
              addressLocality: text(venue.city, locale),
              addressCountry: venue.country,
            },
          },
        }
      : {}),
    competitor: [home, away]
      .filter((team): team is Team => Boolean(team))
      .map((team) => ({
        "@type": "SportsTeam",
        name: text(team.name, locale),
        url: absoluteUrl(locale, `/teams/${team.slug}`),
      })),
  };
}

export function sportsTeamJsonLd(locale: string, team: Team, sport: Sport | undefined): Json {
  const venue = getVenue(team.venueId);
  return {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: text(team.name, locale),
    url: absoluteUrl(locale, `/teams/${team.slug}`),
    ...(sport ? { sport: text(sport.name, locale) } : {}),
    ...(team.founded ? { foundingDate: String(team.founded) } : {}),
    ...(team.officialUrl ? { sameAs: [team.officialUrl] } : {}),
    ...(venue
      ? {
          location: {
            "@type": "Place",
            name: text(venue.name, locale),
            address: {
              "@type": "PostalAddress",
              addressLocality: text(venue.city, locale),
              addressCountry: venue.country,
            },
          },
        }
      : {}),
  };
}

export function personJsonLd(locale: string, player: Player, team: Team | undefined): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: text(player.name, locale),
    url: absoluteUrl(locale, `/players/${player.slug}`),
    ...(player.birthDate ? { birthDate: player.birthDate } : {}),
    ...(player.heightCm ? { height: `${player.heightCm} cm` } : {}),
    jobTitle: text(player.position, locale),
    ...(team ? { memberOf: { "@type": "SportsTeam", name: text(team.name, locale) } } : {}),
  };
}

export function newsArticleJsonLd(locale: string, article: NewsArticle): Json {
  const author = authorsById.get(article.authorId);
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: text(article.title, locale),
    description: text(article.summary, locale),
    datePublished: article.publishedAt,
    ...(article.updatedAt ? { dateModified: article.updatedAt } : {}),
    inLanguage: locale,
    mainEntityOfPage: absoluteUrl(locale, `/news/${article.slug}`),
    ...(author ? { author: { "@type": "Organization", name: text(author.name, locale) } } : {}),
    publisher: { "@id": `${brand.origin}/#organization` },
  };
}

export function videoObjectJsonLd(locale: string, video: VideoItem): Json {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: text(video.title, locale),
    description: text(video.description, locale),
    uploadDate: video.publishedAt,
    duration: `PT${Math.floor(video.durationSec / 60)}M${video.durationSec % 60}S`,
    url: absoluteUrl(locale, `/videos/${video.slug}`),
    ...(video.youtubeId
      ? {
          embedUrl: `https://www.youtube-nocookie.com/embed/${video.youtubeId}`,
          thumbnailUrl: `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`,
        }
      : {}),
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function itemListJsonLd(locale: string, items: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(locale, item.path),
    })),
  };
}

export function howToJsonLd(name: string, steps: { name: string; text: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };
}
