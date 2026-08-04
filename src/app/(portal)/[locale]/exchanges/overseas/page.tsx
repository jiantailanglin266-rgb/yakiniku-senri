import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isLocale, staticLocales } from "@/portal/i18n/config";
import { getDictionary } from "@/portal/i18n/dictionaries";
import { portalMetadata } from "@/portal/lib/seo";
import { overseasExchanges } from "@/portal/data/exchanges";
import { breadcrumbJsonLd, itemListJsonLd } from "@/portal/lib/structured-data";

import { Breadcrumbs, Container, PageHeader, Section } from "@/portal/components/layout/Shell";
import { ExchangeCompare } from "@/portal/components/compare/ExchangeCompare";
import { NoticeBox } from "@/portal/components/ui/primitives";
import { JsonLd } from "@/portal/components/ui/JsonLd";

export function generateStaticParams() {
  return staticLocales().map((locale) => ({ locale }));
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return portalMetadata({
    locale,
    path: "/exchanges/overseas",
    title: dict.exchanges.overseas,
    description: dict.exchanges.overseasLead,
  });
}

export default async function OverseasExchangesPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const trail = [
    { name: dict.nav.exchanges, path: "/exchanges" },
    { name: dict.exchanges.overseas, path: "/exchanges/overseas" },
  ];

  return (
    <Section className="pt-28">
      <Container>
        <Breadcrumbs trail={trail} locale={locale} dict={dict} />
        <PageHeader
          eyebrow="Global"
          title={dict.exchanges.overseas}
          lead={dict.exchanges.overseasLead}
        />

        {/* 海外取引所は、比較表より先に注意事項を読ませます */}
        <NoticeBox tone="rose" className="mb-8" title={dict.exchanges.overseas}>
          {dict.exchanges.overseasWarning}
        </NoticeBox>

        <ExchangeCompare
          exchanges={overseasExchanges}
          locale={locale}
          dict={dict}
          placement="exchange-compare-overseas"
        />
      </Container>

      <JsonLd
        data={[
          breadcrumbJsonLd(locale, trail),
          itemListJsonLd(
            locale,
            dict.exchanges.overseas,
            overseasExchanges.map((exchange) => ({
              name: exchange.name,
              path: `/exchanges/${exchange.slug}`,
            })),
          ),
        ]}
      />
    </Section>
  );
}
