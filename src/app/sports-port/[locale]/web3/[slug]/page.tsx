import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { findLocale, localeCodes, text } from "@/sports/i18n";
import { resolveLocale } from "@/sports/lib/page";
import { sportsMetadata } from "@/sports/lib/seo";
import { href } from "@/sports/lib/url";
import { web3Services, getWeb3BySlug } from "@/sports/data/web3";
import { getSport } from "@/sports/data/sports";
import { getLeague } from "@/sports/data/leagues";
import { news } from "@/sports/data/news";
import { resolveAffiliateUrl } from "@/sports/data/content";

import { NewsCard } from "@/sports/components/cards/Cards";
import {
  Badge,
  Breadcrumbs,
  JsonLd,
  OutboundLink,
  SectionHeading,
} from "@/sports/components/ui/primitives";
import { breadcrumbJsonLd, howToJsonLd } from "@/sports/lib/structured-data";

export function generateStaticParams() {
  return localeCodes.flatMap((locale) =>
    web3Services.map((service) => ({ locale, slug: service.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const info = findLocale(locale);
  const service = getWeb3BySlug(slug);
  if (!info || !service) return {};
  return sportsMetadata({
    locale: info.code,
    path: `/web3/${service.slug}`,
    title: service.name,
    description: text(service.summary, info.code),
  });
}

export default async function Web3DetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!findLocale(raw)) notFound();
  const service = getWeb3BySlug(slug);
  if (!service) notFound();

  const { locale, dict, t } = await resolveLocale(params);

  const related = news.filter((article) => article.category === "web3").slice(0, 3);
  const url = resolveAffiliateUrl(service.affiliateId, locale) ?? service.officialUrl;

  const trail = [
    { label: "HOME", path: "/" },
    { label: dict.navWeb3, path: "/web3" },
    { label: service.name, path: `/web3/${service.slug}` },
  ];

  const facts: { label: string; value: string }[] = [
    { label: dict.category, value: service.category },
    { label: dict.chains, value: service.chains.length ? service.chains.join(" / ") : "—" },
    { label: dict.wallet, value: service.wallet.length ? service.wallet.join(" / ") : "—" },
    { label: dict.pricing, value: t(service.pricing) },
    {
      label: locale === "ja" ? "無料プラン" : "Free plan",
      value: service.hasFreePlan
        ? locale === "ja"
          ? "あり"
          : "Yes"
        : locale === "ja"
          ? "なし"
          : "No",
    },
    { label: locale === "ja" ? "トークン" : "Token", value: service.token ?? "—" },
    {
      label: locale === "ja" ? "対応言語" : "Languages",
      value: service.languages.join(", ").toUpperCase(),
    },
    {
      label: locale === "ja" ? "対応地域" : "Regions",
      value: service.regions.join(", ").toUpperCase(),
    },
    { label: dict.verifiedAt, value: service.verifiedAt },
  ];

  return (
    <>
      <Breadcrumbs locale={locale} trail={trail} />

      <header className="mb-8">
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <Badge tone="accent">{service.category}</Badge>
          {service.sportIds.map((id) => {
            const sport = getSport(id);
            return sport ? (
              <Badge key={id}>
                {sport.glyph} {t(sport.name)}
              </Badge>
            ) : null;
          })}
        </div>
        <h1 className="text-ink text-3xl font-extrabold sm:text-4xl">{service.name}</h1>
        <p className="text-ink-soft mt-3 max-w-3xl text-sm leading-relaxed">{t(service.summary)}</p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-10">
          <section aria-labelledby="w3-features">
            <SectionHeading
              id="w3-features"
              eyebrow="FEATURES"
              title={locale === "ja" ? "特徴" : "Features"}
            />
            <ul className="space-y-1.5">
              {service.features.map((item, index) => (
                <li key={index} className="text-ink-soft flex gap-2 text-sm">
                  <span className="text-cyan" aria-hidden="true">
                    ▍
                  </span>
                  {t(item)}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="w3-how">
            <SectionHeading id="w3-how" eyebrow="HOW TO" title={dict.howTo} />
            <ol className="sp-solid divide-edge divide-y">
              {service.howTo.map((item, index) => (
                <li key={index} className="text-ink-soft flex gap-3 px-4 py-3 text-sm">
                  <span className="sp-mono text-cyan shrink-0">{index + 1}</span>
                  {t(item)}
                </li>
              ))}
            </ol>
          </section>

          <div className="grid gap-6 sm:grid-cols-2">
            <section aria-labelledby="w3-benefits">
              <SectionHeading id="w3-benefits" eyebrow="UPSIDE" title={dict.benefits} />
              <ul className="space-y-1.5">
                {service.benefits.map((item, index) => (
                  <li key={index} className="text-ink-soft flex gap-2 text-sm">
                    <span className="text-neon" aria-hidden="true">
                      +
                    </span>
                    {t(item)}
                  </li>
                ))}
              </ul>
            </section>

            {/* リスクはメリットと同じ大きさで出します（片方だけ小さくしない） */}
            <section aria-labelledby="w3-risks">
              <SectionHeading id="w3-risks" eyebrow="RISKS" title={dict.risks} />
              <ul className="space-y-1.5">
                {service.risks.map((item, index) => (
                  <li key={index} className="text-caution flex gap-2 text-sm">
                    <span aria-hidden="true">!</span>
                    {t(item)}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {related.length > 0 ? (
            <section aria-labelledby="w3-news">
              <SectionHeading id="w3-news" eyebrow="NEWS" title={dict.relatedNews} />
              <div className="grid gap-4 sm:grid-cols-2">
                {related.map((article) => (
                  <NewsCard key={article.id} article={article} locale={locale} />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-8">
          <section aria-labelledby="w3-facts">
            <SectionHeading
              id="w3-facts"
              eyebrow="FACTS"
              title={locale === "ja" ? "基本情報" : "At a glance"}
            />
            <dl className="sp-solid divide-edge divide-y">
              {facts.map((fact) => (
                <div
                  key={fact.label}
                  className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm"
                >
                  <dt className="text-ink-faint shrink-0">{fact.label}</dt>
                  <dd className="text-ink-soft text-right">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {service.leagueIds.length > 0 ? (
            <section aria-labelledby="w3-leagues">
              <SectionHeading id="w3-leagues" eyebrow="LEAGUES" title={dict.navLeagues} />
              <ul className="flex flex-wrap gap-1.5">
                {service.leagueIds.map((id) => {
                  const league = getLeague(id);
                  return league ? (
                    <li key={id}>
                      <Link
                        href={href(locale, `/leagues/${league.slug}`)}
                        className="border-edge text-ink-soft hover:border-cyan/60 hover:text-cyan inline-block rounded-lg border px-3 py-1.5 text-xs transition-colors"
                      >
                        {t(league.name)}
                      </Link>
                    </li>
                  ) : null;
                })}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="w3-link">
            <SectionHeading id="w3-link" eyebrow="OFFICIAL" title={dict.ctaOfficialSite} />
            <OutboundLink
              url={url}
              sponsored={Boolean(service.affiliateId)}
              campaign="web3"
              placement="web3-detail"
              locale={locale}
              className="sp-solid text-ink-soft hover:border-cyan/50 hover:text-cyan w-full justify-between text-sm"
            >
              {dict.ctaOfficialSite}
            </OutboundLink>
            <p className="text-ink-faint mt-2 text-[0.625rem] leading-relaxed">
              {locale === "ja"
                ? "公式サイトは必ずブックマークから開いてください。検索結果や広告経由の偽サイトによる被害が報告されています。"
                : "Always open the official site from a bookmark — fake sites via search ads are a known problem."}
            </p>
          </section>

          <p className="border-caution/40 bg-caution/10 text-caution rounded-lg border p-3 text-[0.6875rem] leading-relaxed">
            {dict.web3Risk}
          </p>
        </aside>
      </div>

      <JsonLd
        data={[
          breadcrumbJsonLd(locale, trail),
          howToJsonLd(
            `${service.name} — ${dict.howTo}`,
            service.howTo.map((item, index) => ({
              name: `Step ${index + 1}`,
              text: t(item),
            })),
          ),
        ]}
      />
    </>
  );
}
