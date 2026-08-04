import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CardTile } from "@/cardport/components/cards/CardTile";
import { PageShell } from "@/cardport/components/layout/PageShell";
import { JsonLd, Notice } from "@/cardport/components/ui/primitives";
import { cards } from "@/cardport/data/cards";
import { featureCollections, getFeature } from "@/cardport/data/features";
import type { Card, FeatureCollection } from "@/cardport/data/types";
import { getDictionary } from "@/cardport/i18n";
import { pick } from "@/cardport/i18n/localized";
import { isLocale, locales, type Locale } from "@/cardport/i18n/locales";
import { routes } from "@/cardport/lib/routes";
import { cardportMetadata } from "@/cardport/lib/seo";
import { rankCards } from "@/cardport/lib/scoring";
import { itemListJsonLd } from "@/cardport/lib/structured-data";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    featureCollections.map((feature) => ({ locale, slug: feature.slug })),
  );
}

export const dynamicParams = false;

/** 特集の条件でカードを絞り込みます（カードIDの直書きをしないための関数） */
function matches(card: Card, filter: FeatureCollection["filter"]): boolean {
  if (filter.categories && !filter.categories.some((c) => card.categories.includes(c)))
    return false;
  if (filter.ranks && !filter.ranks.includes(card.rank)) return false;
  if (filter.maxAnnualFee !== undefined && card.annualFee > filter.maxAnnualFee) return false;
  if (filter.minBaseRate !== undefined && card.baseRate < filter.minBaseRate) return false;
  if (filter.minMileRate !== undefined && card.mileRate < filter.minMileRate) return false;
  if (filter.requiresLounge && card.lounges.ja.length === 0) return false;
  if (filter.eligibility && !filter.eligibility.some((e) => card.eligibility.includes(e)))
    return false;
  return true;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) return {};
  const locale = raw as Locale;
  const feature = getFeature(slug);
  if (!feature) return {};
  return cardportMetadata({
    title: pick(feature.title, locale),
    description: pick(feature.lead, locale),
    path: routes.feature(locale, feature.slug),
    locale,
  });
}

export default async function FeaturePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const feature = getFeature(slug);
  if (!feature) notFound();

  const dictionary = getDictionary(locale);
  const list = rankCards(
    cards.filter((card) => matches(card, feature.filter)),
    feature.filter.categories?.[0] ?? "overall",
  );

  return (
    <PageShell
      breadcrumbLabel={dictionary.common.breadcrumb}
      crumbs={[
        { name: dictionary.nav.home, path: routes.home(locale) },
        { name: dictionary.sections.features, path: routes.features(locale) },
        { name: pick(feature.title, locale), path: routes.feature(locale, feature.slug) },
      ]}
      eyebrow="COLLECTION"
      title={pick(feature.title, locale)}
      lead={pick(feature.lead, locale)}
      notice={<Notice tone="warn">{dictionary.legal.verifyNotice}</Notice>}
    >
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
                placement="feature"
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
          pick(feature.title, locale),
        )}
      />
    </PageShell>
  );
}
