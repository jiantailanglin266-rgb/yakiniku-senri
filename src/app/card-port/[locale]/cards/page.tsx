import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CardBrowser } from "@/cardport/components/cards/CardBrowser";
import { CategoryChips } from "@/cardport/components/home/sections";
import { PageShell } from "@/cardport/components/layout/PageShell";
import { JsonLd, Notice } from "@/cardport/components/ui/primitives";
import { cards } from "@/cardport/data/cards";
import { getDictionary } from "@/cardport/i18n";
import { isLocale, locales, type Locale } from "@/cardport/i18n/locales";
import { pick } from "@/cardport/i18n/localized";
import { routes } from "@/cardport/lib/routes";
import { cardportMetadata } from "@/cardport/lib/seo";
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
    title: dictionary.sections.cardSearch,
    description: dictionary.sections.cardSearchLead,
    path: routes.cards(locale),
    locale,
  });
}

export default async function CardsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dictionary = getDictionary(locale);

  return (
    <PageShell
      wide
      breadcrumbLabel={dictionary.common.breadcrumb}
      crumbs={[
        { name: dictionary.nav.home, path: routes.home(locale) },
        { name: dictionary.nav.cards, path: routes.cards(locale) },
      ]}
      eyebrow="CARD SEARCH"
      title={dictionary.sections.cardSearch}
      lead={dictionary.sections.cardSearchLead}
      notice={
        <div className="space-y-3">
          <Notice tone="warn">{dictionary.legal.verifyNotice}</Notice>
          {/* 海外からの閲覧者に、日本国内向け商品であることを必ず伝えます */}
          {locale !== "ja" ? <Notice tone="danger">{dictionary.legal.regionNotice}</Notice> : null}
        </div>
      }
    >
      <div className="mb-8">
        <CategoryChips locale={locale} />
      </div>

      <CardBrowser locale={locale} dictionary={dictionary} />

      <JsonLd
        data={itemListJsonLd(
          cards.map((card) => ({
            name: pick(card.name, locale),
            path: routes.card(locale, card.slug),
          })),
          dictionary.nav.cards,
        )}
      />
    </PageShell>
  );
}
