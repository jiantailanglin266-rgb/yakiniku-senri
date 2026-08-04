import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { isLocale, localePath, staticLocales } from "@/portal/i18n/config";
import { getDictionary } from "@/portal/i18n/dictionaries";
import { portalMetadata } from "@/portal/lib/seo";
import { getMarketSnapshot } from "@/portal/lib/market";
import { coins } from "@/portal/data/coins";
import { formatCompact, formatPrice, t } from "@/portal/lib/format";
import { breadcrumbJsonLd, itemListJsonLd } from "@/portal/lib/structured-data";

import { Breadcrumbs, Container, PageHeader, Section } from "@/portal/components/layout/Shell";
import { PageVisual } from "@/portal/components/layout/PageVisual";
import { CoinMark } from "@/portal/components/market/CoinCard";
import { PriceChange, Sparkline } from "@/portal/components/market/charts";
import { DataFreshness } from "@/portal/components/market/DataFreshness";
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
    path: "/coins",
    title: dict.nav.coins,
    description: dict.market.featuredLead,
  });
}

export default async function CoinsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const snapshot = await getMarketSnapshot();
  const marketById = new Map(snapshot.coins.map((entry) => [entry.id, entry]));
  const ranked = coins
    .slice()
    .sort((a, b) => (marketById.get(a.id)?.rank ?? 99) - (marketById.get(b.id)?.rank ?? 99));

  const labels = { up: dict.a11y.priceUp, down: dict.a11y.priceDown, flat: dict.a11y.priceFlat };
  const trail = [{ name: dict.nav.coins, path: "/coins" }];

  return (
    <Section className="pt-28">
      <Container>
        <Breadcrumbs trail={trail} locale={locale} dict={dict} />
        <PageHeader
          display="Market"
          title={dict.nav.coins}
          lead={dict.market.featuredLead}
          meta={<DataFreshness snapshot={snapshot} dict={dict} locale={locale} />}
        />
        <PageVisual name="market" locale={locale} priority />

        {/* 一覧は表で。スマートフォンでは列を減らして横スクロールを避けます */}
        <div className="scroll-fade -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <caption className="sr-only">{dict.nav.coins}</caption>
            <thead>
              <tr className="border-b border-(--color-hairline-strong) text-xs tracking-wide text-(--color-ink-dim) uppercase">
                <th scope="col" className="px-3 py-3 text-start">
                  {dict.market.rank}
                </th>
                <th scope="col" className="px-3 py-3 text-start">
                  {dict.nav.coins}
                </th>
                <th scope="col" className="px-3 py-3 text-end">
                  {dict.market.price}
                </th>
                <th scope="col" className="px-3 py-3 text-end">
                  {dict.market.change24h}
                </th>
                <th scope="col" className="hidden px-3 py-3 text-end sm:table-cell">
                  {dict.market.change7d}
                </th>
                <th scope="col" className="hidden px-3 py-3 text-end md:table-cell">
                  {dict.market.marketCap}
                </th>
                <th scope="col" className="hidden px-3 py-3 text-end lg:table-cell">
                  {dict.market.volume}
                </th>
                <th scope="col" className="hidden px-3 py-3 text-end xl:table-cell">
                  7D
                </th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((coin) => {
                const market = marketById.get(coin.id);
                return (
                  <tr
                    key={coin.id}
                    className="border-b border-(--color-hairline) transition-colors hover:bg-white/4"
                  >
                    <td className="tabular px-3 py-3 font-mono text-xs text-(--color-ink-dim)">
                      {market?.rank ?? "—"}
                    </td>
                    <th scope="row" className="px-3 py-3 text-start font-normal">
                      <Link
                        href={localePath(locale, `/coins/${coin.slug}`)}
                        className="flex items-center gap-3"
                      >
                        <CoinMark coin={coin} size={32} />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{t(coin.name, locale)}</span>
                          <span className="block font-mono text-xs text-(--color-ink-dim)">
                            {coin.symbol}
                          </span>
                        </span>
                      </Link>
                    </th>
                    <td className="tabular px-3 py-3 text-end font-mono">
                      {market ? formatPrice(market.price, locale) : "—"}
                    </td>
                    <td className="px-3 py-3 text-end">
                      {market ? (
                        <PriceChange value={market.change24h} locale={locale} labels={labels} />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="hidden px-3 py-3 text-end sm:table-cell">
                      {market ? (
                        <PriceChange value={market.change7d} locale={locale} labels={labels} />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="tabular hidden px-3 py-3 text-end font-mono md:table-cell">
                      {market ? formatCompact(market.marketCap, locale) : "—"}
                    </td>
                    <td className="tabular hidden px-3 py-3 text-end font-mono lg:table-cell">
                      {market ? formatCompact(market.volume24h, locale) : "—"}
                    </td>
                    <td className="hidden px-3 py-3 xl:table-cell">
                      {market ? (
                        <Sparkline
                          values={market.sparkline}
                          width={110}
                          height={32}
                          className="ms-auto"
                        />
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-(--color-ink-dim)">{dict.market.dataNote}</p>
      </Container>

      <JsonLd
        data={[
          breadcrumbJsonLd(locale, trail),
          itemListJsonLd(
            locale,
            dict.nav.coins,
            ranked.map((coin) => ({ name: t(coin.name, locale), path: `/coins/${coin.slug}` })),
          ),
        ]}
      />
    </Section>
  );
}
