import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FeatureGrid } from "@/cardport/components/home/sections";
import { PageShell } from "@/cardport/components/layout/PageShell";
import { getDictionary } from "@/cardport/i18n";
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
    title: dictionary.sections.features,
    description: dictionary.hero.subtitle,
    path: routes.features(locale),
    locale,
  });
}

export default async function FeaturesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dictionary = getDictionary(locale);

  return (
    <PageShell
      breadcrumbLabel={dictionary.common.breadcrumb}
      crumbs={[
        { name: dictionary.nav.home, path: routes.home(locale) },
        { name: dictionary.sections.features, path: routes.features(locale) },
      ]}
      eyebrow="COLLECTIONS"
      title={dictionary.sections.features}
      lead={
        locale === "ja"
          ? "各特集は掲載条件で自動的に対象カードを選んでいます。データを更新すると内容も追随します。"
          : "Each collection selects cards by rule, so it stays in sync whenever the data changes."
      }
    >
      <FeatureGrid locale={locale} />
    </PageShell>
  );
}
