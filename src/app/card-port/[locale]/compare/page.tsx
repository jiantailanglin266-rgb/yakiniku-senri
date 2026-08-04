import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CompareView } from "@/cardport/components/cards/CompareView";
import { PageShell } from "@/cardport/components/layout/PageShell";
import { Notice } from "@/cardport/components/ui/primitives";
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
    title: dictionary.sections.comparison,
    description: dictionary.sections.comparisonLead,
    path: routes.compare(locale),
    locale,
  });
}

export default async function ComparePage({ params }: { params: Promise<{ locale: string }> }) {
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
        { name: dictionary.sections.comparison, path: routes.compare(locale) },
      ]}
      eyebrow="COMPARE"
      title={dictionary.sections.comparison}
      lead={dictionary.sections.comparisonLead}
      notice={<Notice tone="warn">{dictionary.legal.verifyNotice}</Notice>}
    >
      <CompareView locale={locale} dictionary={dictionary} />
    </PageShell>
  );
}
