import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CardTile } from "@/cardport/components/cards/CardTile";
import { PageShell } from "@/cardport/components/layout/PageShell";
import { JsonLd, Notice, Panel, SectionHeading } from "@/cardport/components/ui/primitives";
import { cards } from "@/cardport/data/cards";
import { rankingCategories } from "@/cardport/data/categories";
import { getDictionary } from "@/cardport/i18n";
import { isLocale, locales, type Locale } from "@/cardport/i18n/locales";
import { pick } from "@/cardport/i18n/localized";
import { routes } from "@/cardport/lib/routes";
import { cardportMetadata } from "@/cardport/lib/seo";
import { rankCards } from "@/cardport/lib/scoring";
import { itemListJsonLd } from "@/cardport/lib/structured-data";

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
    title: dictionary.sections.ranking,
    description: dictionary.sections.rankingLead,
    path: routes.rankings(locale),
    locale,
  });
}

export default async function RankingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dictionary = getDictionary(locale);
  const overall = rankCards(cards, "overall", 5);

  return (
    <PageShell
      breadcrumbLabel={dictionary.common.breadcrumb}
      crumbs={[
        { name: dictionary.nav.home, path: routes.home(locale) },
        { name: dictionary.nav.rankings, path: routes.rankings(locale) },
      ]}
      eyebrow="RANKING"
      title={dictionary.sections.ranking}
      lead={dictionary.sections.rankingLead}
      notice={
        <div className="space-y-3">
          <Notice tone="warn">{dictionary.legal.verifyNotice}</Notice>
          <Notice>
            {dictionary.affiliate.disclosureLong}{" "}
            <Link
              href={routes.policy(locale, "ranking-criteria")}
              className="text-cp-cyan underline"
            >
              {dictionary.footer.rankingCriteria}
            </Link>
          </Notice>
        </div>
      }
    >
      <SectionHeading eyebrow="OVERALL" title={dictionary.common.all} accent="gold" />
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {overall.map((entry) => (
          <li key={entry.card.id}>
            <CardTile
              card={entry.card}
              locale={locale}
              dictionary={dictionary}
              rank={entry.rank}
              placement="ranking"
            />
          </li>
        ))}
      </ul>

      <div className="mt-14">
        <SectionHeading eyebrow="BY CATEGORY" title={dictionary.sections.features} accent="cyan" />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rankingCategories.map((category) => {
            const top = rankCards(
              cards.filter((card) => card.categories.includes(category.id)),
              category.id,
              3,
            );
            return (
              <li key={category.id}>
                <Panel className="h-full p-4">
                  <h2 className="text-cp-ink text-[0.9rem] font-semibold">
                    <Link
                      href={routes.ranking(locale, category.id)}
                      className="hover:text-cp-cyan transition-colors"
                    >
                      {pick(category.title, locale)}
                    </Link>
                  </h2>
                  <ol className="mt-3 space-y-1.5">
                    {top.map((entry) => (
                      <li key={entry.card.id} className="flex items-center gap-2 text-[0.78rem]">
                        <span className="numeric text-cp-gold w-4 shrink-0">{entry.rank}</span>
                        <Link
                          href={routes.card(locale, entry.card.slug)}
                          className="text-cp-mist hover:text-cp-cyan flex-1 truncate"
                        >
                          {pick(entry.card.name, locale)}
                        </Link>
                        <span className="numeric text-cp-dim shrink-0">
                          {entry.score.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ol>
                </Panel>
              </li>
            );
          })}
        </ul>
      </div>

      <JsonLd
        data={itemListJsonLd(
          overall.map((entry) => ({
            name: pick(entry.card.name, locale),
            path: routes.card(locale, entry.card.slug),
          })),
          dictionary.sections.ranking,
        )}
      />
    </PageShell>
  );
}
