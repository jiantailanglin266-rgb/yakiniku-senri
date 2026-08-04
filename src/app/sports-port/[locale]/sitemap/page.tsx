import type { Metadata } from "next";
import Link from "next/link";

import { findLocale, getDictionary, localeCodes } from "@/sports/i18n";
import { resolveLocale } from "@/sports/lib/page";
import { sportsMetadata } from "@/sports/lib/seo";
import { href } from "@/sports/lib/url";
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
    path: "/sitemap",
    title: dict.footerSitemap,
    description:
      info.code === "ja" ? "サイト内の全ページ一覧です。" : "Every page on this site, in one list.",
  });
}

export default async function SitemapPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, dict, t } = await resolveLocale(params);

  const trail = [
    { label: "HOME", path: "/" },
    { label: dict.footerSitemap, path: "/sitemap" },
  ];

  const groups: { title: string; links: { label: string; path: string }[] }[] = [
    {
      title: dict.navMatches,
      links: [
        { label: dict.sectionLiveTicker, path: "/live" },
        { label: dict.navMatches, path: "/matches" },
        ...matches.map((match) => ({ label: match.slug, path: `/matches/${match.slug}` })),
      ],
    },
    {
      title: dict.navLeagues,
      links: [
        { label: dict.navLeagues, path: "/leagues" },
        ...leagues.map((league) => ({ label: t(league.name), path: `/leagues/${league.slug}` })),
        ...sports.map((sport) => ({ label: t(sport.name), path: `/sports/${sport.slug}` })),
      ],
    },
    {
      title: dict.team,
      links: teams.map((team) => ({ label: t(team.name), path: `/teams/${team.slug}` })),
    },
    {
      title: dict.player,
      links: players.map((player) => ({ label: t(player.name), path: `/players/${player.slug}` })),
    },
    {
      title: dict.navNews,
      links: [
        { label: dict.navNews, path: "/news" },
        ...news.map((article) => ({ label: t(article.title), path: `/news/${article.slug}` })),
      ],
    },
    {
      title: dict.navVideos,
      links: [
        { label: dict.navVideos, path: "/videos" },
        { label: dict.shorts, path: "/videos/shorts" },
        ...videos.map((video) => ({ label: t(video.title), path: `/videos/${video.slug}` })),
      ],
    },
    {
      title: dict.navWeb3,
      links: [
        { label: dict.navStreaming, path: "/streaming" },
        { label: dict.navWeb3, path: "/web3" },
        { label: dict.sectionFanTokens, path: "/fan-tokens" },
        { label: dict.sectionNfts, path: "/nfts" },
        ...web3Services.map((service) => ({ label: service.name, path: `/web3/${service.slug}` })),
      ],
    },
    {
      title: dict.navDiagnosis,
      links: [
        { label: dict.navDiagnosis, path: "/diagnosis" },
        ...diagnoses.map((diagnosis) => ({
          label: t(diagnosis.title),
          path: `/diagnosis/${diagnosis.slug}`,
        })),
      ],
    },
    {
      title: locale === "ja" ? "その他" : "Other",
      links: [
        { label: dict.navGuide, path: "/guide" },
        { label: dict.sectionFaq, path: "/faq" },
        { label: dict.navBetting, path: "/betting" },
        { label: dict.navSearch, path: "/search" },
        { label: dict.navAdmin, path: "/admin" },
        ...legalPages.map((page) => ({ label: t(page.title), path: `/legal/${page.slug}` })),
      ],
    },
  ];

  return (
    <>
      <Breadcrumbs locale={locale} trail={trail} />

      <header className="mb-10">
        <p className="sp-eyebrow mb-2">SITEMAP</p>
        <h1 className="text-ink text-3xl font-extrabold sm:text-4xl">{dict.footerSitemap}</h1>
      </header>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <section key={group.title} aria-labelledby={`sm-${group.title}`}>
            <SectionHeading id={`sm-${group.title}`} title={group.title} />
            <ul className="space-y-1">
              {group.links.map((link) => (
                <li key={link.path}>
                  <Link
                    href={href(locale, link.path)}
                    className="text-ink-dim hover:text-cyan text-xs transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <JsonLd data={[breadcrumbJsonLd(locale, trail)]} />
    </>
  );
}
