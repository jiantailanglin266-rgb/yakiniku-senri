import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FaqList } from "@/cardport/components/home/sections";
import { PageShell } from "@/cardport/components/layout/PageShell";
import { JsonLd, SectionHeading } from "@/cardport/components/ui/primitives";
import { faqs, getFaqs } from "@/cardport/data/faqs";
import type { Faq } from "@/cardport/data/types";
import { getDictionary } from "@/cardport/i18n";
import { isLocale, locales, type Locale } from "@/cardport/i18n/locales";
import { routes } from "@/cardport/lib/routes";
import { cardportMetadata } from "@/cardport/lib/seo";
import { faqJsonLd } from "@/cardport/lib/structured-data";

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
    title: dictionary.sections.faq,
    description: dictionary.hero.subtitle,
    path: routes.faq(locale),
    locale,
  });
}

const scopes: { scope: Faq["scope"]; ja: string; en: string }[] = [
  { scope: "site", ja: "このサイトについて", en: "About this site" },
  { scope: "card", ja: "クレジットカード", en: "Credit cards" },
  { scope: "point", ja: "ポイント", en: "Points" },
  { scope: "business", ja: "法人カード", en: "Business cards" },
  { scope: "web3", ja: "Web3.0・暗号資産", en: "Web3 and crypto" },
  { scope: "diagnosis", ja: "診断・申込み", en: "Finder and applications" },
];

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dictionary = getDictionary(locale);

  return (
    <PageShell
      breadcrumbLabel={dictionary.common.breadcrumb}
      crumbs={[
        { name: dictionary.nav.home, path: routes.home(locale) },
        { name: dictionary.nav.faq, path: routes.faq(locale) },
      ]}
      eyebrow="FAQ"
      title={dictionary.sections.faq}
    >
      <div className="max-w-3xl">
        {scopes.map((group) => {
          const items = getFaqs(group.scope);
          if (items.length === 0) return null;
          return (
            <div key={group.scope} className="mb-10 last:mb-0">
              <SectionHeading title={locale === "ja" ? group.ja : group.en} accent="violet" />
              <FaqList items={items} locale={locale} />
            </div>
          );
        })}
      </div>

      {/* 構造化データは画面に出しているFAQと完全に同じ内容にします */}
      <JsonLd data={faqJsonLd(faqs, locale)} />
    </PageShell>
  );
}
