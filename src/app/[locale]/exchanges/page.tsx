import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isLocale, localePath, staticLocales } from "@/portal/i18n/config";
import { getDictionary } from "@/portal/i18n/dictionaries";
import { portalMetadata } from "@/portal/lib/seo";
import { DATASET_STATUS, domesticExchanges } from "@/portal/data/exchanges";
import { breadcrumbJsonLd, itemListJsonLd } from "@/portal/lib/structured-data";

import { Breadcrumbs, Container, PageHeader, Section } from "@/portal/components/layout/Shell";
import { PageVisual } from "@/portal/components/layout/PageVisual";
import { ExchangeCompare } from "@/portal/components/compare/ExchangeCompare";
import { NeonLink, NoticeBox } from "@/portal/components/ui/primitives";
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
    path: "/exchanges",
    title: dict.exchanges.domestic,
    description: dict.exchanges.domesticLead,
  });
}

export default async function ExchangesPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const trail = [{ name: dict.nav.exchanges, path: "/exchanges" }];

  return (
    <Section className="pt-28">
      <Container>
        <Breadcrumbs trail={trail} locale={locale} dict={dict} />
        <PageHeader
          display="Exchanges"
          title={dict.exchanges.domestic}
          lead={dict.exchanges.domesticLead}
        />
        <PageVisual name="exchanges" locale={locale} priority />

        {DATASET_STATUS === "sample" ? (
          <NoticeBox tone="amber" className="mb-6">
            {locale === "ja"
              ? "手数料・スプレッド・最低取引額は頻繁に変わるため、確認できていない数値は掲載していません（「公式サイトで要確認」と表示されます）。実測値を確認したうえで差し替えてください。総合評価は編集部の基準にもとづく暫定値で、利用者レビューの集計ではありません。"
              : "Fees, spreads and minimums change often, so unverified figures are not published (they show as “check official site”). Ratings are provisional editorial scores, not aggregated user reviews."}
          </NoticeBox>
        ) : null}

        <ExchangeCompare
          exchanges={domesticExchanges}
          locale={locale}
          dict={dict}
          placement="exchange-compare-domestic"
        />

        <div className="mt-10 flex flex-wrap gap-3">
          <NeonLink href={localePath(locale, "/exchanges/overseas")} tone="outline">
            {dict.exchanges.overseas}
          </NeonLink>
          <NeonLink href={localePath(locale, "/diagnosis/exchange")}>
            {dict.hero.ctaDiagnosis}
          </NeonLink>
        </div>
      </Container>

      <JsonLd
        data={[
          breadcrumbJsonLd(locale, trail),
          itemListJsonLd(
            locale,
            dict.exchanges.domestic,
            domesticExchanges.map((exchange) => ({
              name: exchange.name,
              path: `/exchanges/${exchange.slug}`,
            })),
          ),
        ]}
      />
    </Section>
  );
}
