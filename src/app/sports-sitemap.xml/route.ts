/**
 * SPORTS PORT の言語別サイトマップ。
 *
 * Next.js の `sitemap.ts` は既存サイト（焼肉 千里）が使っているため、
 * スポーツポータル用は独立したエンドポイントとして出力します。
 * 各URLに全ロケールの hreflang（xhtml:link）を添えるため、XML を直接組み立てます。
 *
 * 静的書き出しでも動くよう force-static を指定しています。
 */
import { brand } from "@/sports/config/site";
import { locales, defaultLocaleCode } from "@/sports/i18n/locales";
import { absoluteUrl } from "@/sports/lib/url";
import { sports } from "@/sports/data/sports";
import { leagues } from "@/sports/data/leagues";
import { teams } from "@/sports/data/teams";
import { players } from "@/sports/data/players";
import { matches } from "@/sports/data/matches";
import { news } from "@/sports/data/news";
import { videos } from "@/sports/data/videos";
import { web3Services } from "@/sports/data/web3";
import { diagnoses } from "@/sports/data/diagnoses";
import { legalPages } from "@/sports/data/legal";
import { referenceDayIso } from "@/sports/data/clock";

export const dynamic = "force-static";

type Entry = { path: string; changefreq: string; priority: number; lastmod?: string };

/** サイトマップに載せるパス（ロケールを含まない） */
export function sitemapEntries(): Entry[] {
  return [
    { path: "/", changefreq: "hourly", priority: 1 },
    { path: "/live", changefreq: "hourly", priority: 0.9 },
    { path: "/matches", changefreq: "hourly", priority: 0.9 },
    { path: "/leagues", changefreq: "daily", priority: 0.8 },
    { path: "/news", changefreq: "hourly", priority: 0.8 },
    { path: "/videos", changefreq: "daily", priority: 0.7 },
    { path: "/videos/shorts", changefreq: "daily", priority: 0.6 },
    { path: "/streaming", changefreq: "weekly", priority: 0.8 },
    { path: "/web3", changefreq: "weekly", priority: 0.6 },
    { path: "/fan-tokens", changefreq: "weekly", priority: 0.5 },
    { path: "/nfts", changefreq: "weekly", priority: 0.5 },
    { path: "/diagnosis", changefreq: "weekly", priority: 0.7 },
    { path: "/betting", changefreq: "monthly", priority: 0.4 },
    { path: "/guide", changefreq: "monthly", priority: 0.6 },
    { path: "/faq", changefreq: "monthly", priority: 0.5 },
    { path: "/sitemap", changefreq: "weekly", priority: 0.3 },

    ...matches.map((match) => ({
      path: `/matches/${match.slug}`,
      changefreq: match.status === "finished" ? "monthly" : "hourly",
      priority: 0.7,
      lastmod: match.stamp.fetchedAt,
    })),
    ...leagues.map((league) => ({
      path: `/leagues/${league.slug}`,
      changefreq: "daily",
      priority: 0.7,
    })),
    ...sports.map((sport) => ({
      path: `/sports/${sport.slug}`,
      changefreq: "weekly",
      priority: 0.6,
    })),
    ...teams.map((team) => ({ path: `/teams/${team.slug}`, changefreq: "daily", priority: 0.6 })),
    ...players.map((player) => ({
      path: `/players/${player.slug}`,
      changefreq: "weekly",
      priority: 0.5,
    })),
    ...news.map((article) => ({
      path: `/news/${article.slug}`,
      changefreq: "weekly",
      priority: 0.6,
      lastmod: article.updatedAt ?? article.publishedAt,
    })),
    ...videos.map((video) => ({
      path: `/videos/${video.slug}`,
      changefreq: "weekly",
      priority: 0.5,
      lastmod: video.publishedAt,
    })),
    ...web3Services.map((service) => ({
      path: `/web3/${service.slug}`,
      changefreq: "monthly",
      priority: 0.4,
    })),
    ...diagnoses.map((diagnosis) => ({
      path: `/diagnosis/${diagnosis.slug}`,
      changefreq: "monthly",
      priority: 0.5,
    })),
    ...legalPages.map((page) => ({
      path: `/legal/${page.slug}`,
      changefreq: "yearly",
      priority: 0.2,
    })),
  ];
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET() {
  const entries = sitemapEntries();

  const urls = entries
    .flatMap((entry) =>
      locales.map((locale) => {
        const alternates = locales
          .map(
            (alt) =>
              `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${escapeXml(absoluteUrl(alt.code, entry.path))}"/>`,
          )
          .join("\n");

        return [
          "  <url>",
          `    <loc>${escapeXml(absoluteUrl(locale.code, entry.path))}</loc>`,
          `    <lastmod>${(entry.lastmod ?? referenceDayIso).slice(0, 10)}</lastmod>`,
          `    <changefreq>${entry.changefreq}</changefreq>`,
          `    <priority>${entry.priority}</priority>`,
          alternates,
          `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(absoluteUrl(defaultLocaleCode, entry.path))}"/>`,
          "  </url>",
        ].join("\n");
      }),
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "X-Robots-Tag": "noindex",
      "X-Sitemap-Origin": brand.origin,
    },
  });
}
