import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageShell } from "@/cardport/components/layout/PageShell";
import { Panel, SectionHeading } from "@/cardport/components/ui/primitives";
import { cards } from "@/cardport/data/cards";
import { cardCategories } from "@/cardport/data/categories";
import { diagnoses } from "@/cardport/data/diagnoses";
import { featureCollections } from "@/cardport/data/features";
import { guides } from "@/cardport/data/guides";
import { news } from "@/cardport/data/news";
import { policyPages } from "@/cardport/data/policies";
import { simulators } from "@/cardport/data/simulators";
import { videos } from "@/cardport/data/videos";
import { web3Services } from "@/cardport/data/web3";
import { getDictionary } from "@/cardport/i18n";
import { pick } from "@/cardport/i18n/localized";
import { isLocale, locales, type Locale } from "@/cardport/i18n/locales";
import { routes } from "@/cardport/lib/routes";
import { cardportMetadata } from "@/cardport/lib/seo";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const locale = raw as Locale;
  const dictionary = getDictionary(locale);
  return cardportMetadata({
    title: dictionary.nav.sitemap,
    description: dictionary.hero.subtitle,
    path: routes.sitemap(locale),
    locale,
  });
}

export default async function SitemapPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dictionary = getDictionary(locale);

  const groups: { title: string; items: { name: string; href: string }[] }[] = [
    {
      title: dictionary.nav.cards,
      items: [
        { name: dictionary.sections.cardSearch, href: routes.cards(locale) },
        { name: dictionary.sections.comparison, href: routes.compare(locale) },
        { name: dictionary.nav.rankings, href: routes.rankings(locale) },
        ...cardCategories.map((category) => ({
          name: pick(category.title, locale),
          href: routes.cardCategory(locale, category.id),
        })),
      ],
    },
    {
      title: dictionary.nav.cards + " — " + dictionary.card.detail,
      items: cards.map((card) => ({
        name: pick(card.name, locale),
        href: routes.card(locale, card.slug),
      })),
    },
    {
      title: dictionary.nav.diagnosis,
      items: diagnoses.map((diagnosis) => ({
        name: pick(diagnosis.title, locale),
        href: routes.diagnosis(locale, diagnosis.slug),
      })),
    },
    {
      title: dictionary.nav.simulators,
      items: simulators.map((simulator) => ({
        name: pick(simulator.title, locale),
        href: routes.simulator(locale, simulator.slug),
      })),
    },
    {
      title: dictionary.sections.features,
      items: featureCollections.map((feature) => ({
        name: pick(feature.title, locale),
        href: routes.feature(locale, feature.slug),
      })),
    },
    {
      title: dictionary.nav.news,
      items: news.map((article) => ({
        name: pick(article.title, locale),
        href: routes.newsArticle(locale, article.slug),
      })),
    },
    {
      title: dictionary.nav.videos,
      items: videos.map((video) => ({
        name: pick(video.title, locale),
        href: routes.video(locale, video.slug),
      })),
    },
    {
      title: dictionary.nav.web3,
      items: web3Services.map((service) => ({
        name: pick(service.name, locale),
        href: routes.web3Service(locale, service.slug),
      })),
    },
    {
      title: dictionary.nav.guides,
      items: guides.map((guide) => ({
        name: pick(guide.title, locale),
        href: routes.guide(locale, guide.slug),
      })),
    },
    {
      title: dictionary.footer.operator,
      items: policyPages.map((page) => ({
        name: pick(page.title, locale),
        href: routes.policy(locale, page.slug),
      })),
    },
    {
      title: dictionary.common.all,
      items: [
        { name: dictionary.nav.campaigns, href: routes.campaigns(locale) },
        { name: dictionary.nav.business, href: routes.business(locale) },
        { name: dictionary.nav.payments, href: routes.payments(locale) },
        { name: dictionary.nav.tools, href: routes.tools(locale) },
        { name: dictionary.nav.faq, href: routes.faq(locale) },
      ],
    },
  ];

  return (
    <PageShell
      breadcrumbLabel={dictionary.common.breadcrumb}
      crumbs={[
        { name: dictionary.nav.home, path: routes.home(locale) },
        { name: dictionary.nav.sitemap, path: routes.sitemap(locale) },
      ]}
      eyebrow="SITEMAP"
      title={dictionary.nav.sitemap}
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Panel key={group.title} className="p-5">
            <SectionHeading title={group.title} accent="cyan" />
            <ul className="space-y-1.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-cp-mist hover:text-cp-cyan text-[0.78rem] transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </PageShell>
  );
}
