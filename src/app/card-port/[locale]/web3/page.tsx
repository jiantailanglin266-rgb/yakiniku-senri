import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CardTile } from "@/cardport/components/cards/CardTile";
import { FaqList, Web3Grid } from "@/cardport/components/home/sections";
import { PageShell } from "@/cardport/components/layout/PageShell";
import { JsonLd, Notice, SectionHeading } from "@/cardport/components/ui/primitives";
import { cards } from "@/cardport/data/cards";
import { getFaqs } from "@/cardport/data/faqs";
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
    title: dictionary.sections.web3,
    description: dictionary.legal.cryptoRisk,
    path: routes.web3(locale),
    locale,
  });
}

export default async function Web3Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dictionary = getDictionary(locale);
  const cryptoCards = cards.filter((card) => card.crypto);
  const web3Faqs = getFaqs("web3");

  return (
    <PageShell
      breadcrumbLabel={dictionary.common.breadcrumb}
      crumbs={[
        { name: dictionary.nav.home, path: routes.home(locale) },
        { name: dictionary.nav.web3, path: routes.web3(locale) },
      ]}
      eyebrow="WEB3"
      title={dictionary.sections.web3}
      lead={
        locale === "ja"
          ? "決済手段としてのWeb3.0サービスを比較します。投資を勧めるものではありません。"
          : "We compare Web3 services as payment rails. Nothing here is an investment recommendation."
      }
      notice={<Notice tone="danger">{dictionary.legal.cryptoRisk}</Notice>}
    >
      <Web3Grid locale={locale} dictionary={dictionary} />

      {cryptoCards.length > 0 ? (
        <div className="mt-14">
          <SectionHeading
            eyebrow="CRYPTO CARDS"
            title={dictionary.sections.cryptoCards}
            accent="magenta"
          />
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cryptoCards.map((card) => (
              <li key={card.id}>
                <CardTile card={card} locale={locale} dictionary={dictionary} placement="web3" />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-14 max-w-3xl">
        <SectionHeading eyebrow="FAQ" title={dictionary.sections.faq} accent="violet" />
        <FaqList items={web3Faqs} locale={locale} />
      </div>

      <JsonLd data={faqJsonLd(web3Faqs, locale)} />
    </PageShell>
  );
}
