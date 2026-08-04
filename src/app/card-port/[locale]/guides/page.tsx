import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GuideList } from "@/cardport/components/home/sections";
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
    title: dictionary.sections.beginner,
    description: dictionary.hero.subtitle,
    path: routes.guides(locale),
    locale,
  });
}

export default async function GuidesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dictionary = getDictionary(locale);

  return (
    <PageShell
      breadcrumbLabel={dictionary.common.breadcrumb}
      crumbs={[
        { name: dictionary.nav.home, path: routes.home(locale) },
        { name: dictionary.nav.guides, path: routes.guides(locale) },
      ]}
      eyebrow="LEARN"
      title={dictionary.sections.beginner}
      lead={
        locale === "ja"
          ? "結論から書いています。読み飛ばしても、最初の段落だけで判断できる構成にしています。"
          : "Each guide opens with the conclusion, so the first paragraph alone is enough to decide."
      }
    >
      <GuideList locale={locale} dictionary={dictionary} />
    </PageShell>
  );
}
