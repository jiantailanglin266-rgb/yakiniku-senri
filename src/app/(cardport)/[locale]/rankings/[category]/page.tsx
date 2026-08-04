import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CardTile } from "@/cardport/components/cards/CardTile";
import { PageShell } from "@/cardport/components/layout/PageShell";
import { JsonLd, Notice, Panel } from "@/cardport/components/ui/primitives";
import { cards } from "@/cardport/data/cards";
import { getCategory, rankingCategories } from "@/cardport/data/categories";
import { getDictionary } from "@/cardport/i18n";
import { isLocale, locales, type Locale } from "@/cardport/i18n/locales";
import { pick } from "@/cardport/i18n/localized";
import { routes } from "@/cardport/lib/routes";
import { cardportMetadata } from "@/cardport/lib/seo";
import { axisLabels, getWeights, rankCards, scoreAxes } from "@/cardport/lib/scoring";
import { itemListJsonLd } from "@/cardport/lib/structured-data";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    rankingCategories.map((category) => ({ locale, category: category.id })),
  );
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}): Promise<Metadata> {
  const { locale: raw, category: categoryId } = await params;
  if (!isLocale(raw)) return {};
  const locale = raw as Locale;
  const category = getCategory(categoryId);
  if (!category) return {};
  const dictionary = getDictionary(locale);
  return cardportMetadata({
    title: `${pick(category.title, locale)} — ${dictionary.sections.ranking}`,
    description: pick(category.lead, locale),
    path: routes.ranking(locale, category.id),
    locale,
  });
}

export default async function CategoryRankingPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale: raw, category: categoryId } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const category = getCategory(categoryId);
  if (!category || !category.ranking) notFound();

  const dictionary = getDictionary(locale);
  const list = rankCards(
    cards.filter((card) => card.categories.includes(category.id)),
    category.id,
  );
  const weights = getWeights(category.id);

  return (
    <PageShell
      breadcrumbLabel={dictionary.common.breadcrumb}
      crumbs={[
        { name: dictionary.nav.home, path: routes.home(locale) },
        { name: dictionary.nav.rankings, path: routes.rankings(locale) },
        { name: pick(category.title, locale), path: routes.ranking(locale, category.id) },
      ]}
      eyebrow="RANKING"
      title={`${pick(category.title, locale)} — ${dictionary.sections.ranking}`}
      lead={pick(category.lead, locale)}
      notice={<Notice tone="warn">{dictionary.legal.verifyNotice}</Notice>}
    >
      {/* 順位の根拠になる重みを、そのランキングのページに必ず出します */}
      <Panel className="mb-8 p-4">
        <h2 className="text-ink mb-3 text-[0.86rem] font-semibold">
          {dictionary.footer.rankingCriteria}
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {scoreAxes.map((axis) => (
            <li key={axis} className="flex items-center gap-2 text-[0.76rem]">
              <span className="text-dim w-28 shrink-0">{pick(axisLabels[axis], locale)}</span>
              <span className="bg-slate/70 h-1.5 flex-1 overflow-hidden rounded-full">
                <span
                  className="from-cyan to-violet block h-full rounded-full bg-gradient-to-r"
                  style={{ width: `${weights[axis] * 100}%` }}
                />
              </span>
              <span className="numeric text-mist w-10 shrink-0 text-end">
                {Math.round(weights[axis] * 100)}%
              </span>
            </li>
          ))}
        </ul>
        <Link
          href={routes.policy(locale, "ranking-criteria")}
          className="text-cyan mt-3 inline-block text-[0.74rem] underline"
        >
          {dictionary.common.more} →
        </Link>
      </Panel>

      {list.length === 0 ? (
        <Notice>{dictionary.common.noResults}</Notice>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((entry) => (
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
      )}

      <JsonLd
        data={itemListJsonLd(
          list.map((entry) => ({
            name: pick(entry.card.name, locale),
            path: routes.card(locale, entry.card.slug),
          })),
          pick(category.title, locale),
        )}
      />
    </PageShell>
  );
}
