import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { isLocale, localePath, staticLocales } from "@/portal/i18n/config";
import { getDictionary } from "@/portal/i18n/dictionaries";
import { portalMetadata } from "@/portal/lib/seo";
import { getMarketSnapshot, getPriceSeries } from "@/portal/lib/market";
import { coins } from "@/portal/data/coins";
import { formatCompact, formatPrice, t } from "@/portal/lib/format";
import { breadcrumbJsonLd } from "@/portal/lib/structured-data";
import type { PricePoint } from "@/portal/lib/types";

import { Breadcrumbs, Container, PageHeader, Section } from "@/portal/components/layout/Shell";
import { LiveChart } from "@/portal/components/market/LiveChart";
import { CoinMark } from "@/portal/components/market/CoinCard";
import { PriceChange } from "@/portal/components/market/charts";
import { DataFreshness } from "@/portal/components/market/DataFreshness";
import { NoticeBox, SectionHeading } from "@/portal/components/ui/primitives";
import { JsonLd } from "@/portal/components/ui/JsonLd";

/**
 * リアルタイムチャートのページ。
 *
 * ■ サーバーとブラウザで二重に持つ理由
 *   静的書き出しではサーバーが無いため、ビルド時の値はすぐ古くなります。
 *   ブラウザ側で取り直しますが、取得できるまでの数百ミリ秒を空欄にすると
 *   画面が跳ねます。ビルド時の系列を初期表示として渡し、
 *   取得できたら差し替えます。取得できないときはそのまま残します。
 *
 * ■ 「リアルタイム」の実際
 *   無料の公開APIはIPあたり毎分数回で制限されるため、更新は約60秒に1回です。
 *   秒単位で動くように見せず、更新間隔と取得日時を必ず並べて出します。
 */

/** チャートに載せる銘柄。多すぎると1回の問い合わせが重くなります */
const CHART_COINS = coins.slice(0, 8);

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
    path: "/charts",
    title: dict.market.live.title,
    description: dict.market.live.lead,
  });
}

export default async function ChartsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const snapshot = await getMarketSnapshot();

  // 初期表示ぶんだけを用意します。全期間ぶんを持つと書き出しが膨らみます
  const seriesEntries = await Promise.all(
    CHART_COINS.map(
      async (coin) => [coin.id, (await getPriceSeries(coin.id, "d1")).points] as const,
    ),
  );
  const initialSeries: Record<string, PricePoint[]> = Object.fromEntries(seriesEntries);

  const trail = [{ name: dict.market.live.title, path: "/charts" }];
  const rows = snapshot.coins.filter((row) => CHART_COINS.some((coin) => coin.id === row.id));

  return (
    <Section className="pt-28">
      <Container>
        <Breadcrumbs trail={trail} locale={locale} dict={dict} />
        <PageHeader display="Live" title={dict.market.live.title} lead={dict.market.live.lead} />

        <NoticeBox tone="cyan" className="mb-6">
          {dict.market.live.note}
        </NoticeBox>

        <LiveChart coins={CHART_COINS} locale={locale} dict={dict} initialSeries={initialSeries} />

        <div className="mt-16">
          <SectionHeading
            eyebrow="Markets"
            title={dict.market.overview}
            lead={dict.market.overviewLead}
          />

          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b border-(--color-hairline) text-start text-xs text-(--color-ink-dim)">
                  <th scope="col" className="py-2 text-start font-medium">
                    {dict.market.rank}
                  </th>
                  <th scope="col" className="py-2 text-start font-medium">
                    {dict.nav.coins}
                  </th>
                  <th scope="col" className="py-2 text-end font-medium">
                    {dict.market.price}
                  </th>
                  <th scope="col" className="py-2 text-end font-medium">
                    {dict.market.change24h}
                  </th>
                  <th scope="col" className="py-2 text-end font-medium">
                    {dict.market.marketCap}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const coin = CHART_COINS.find((entry) => entry.id === row.id);
                  if (!coin) return null;
                  return (
                    <tr key={row.id} className="border-b border-(--color-hairline)/60">
                      <td className="py-3 font-mono text-xs text-(--color-ink-dim)">{row.rank}</td>
                      <td className="py-3">
                        <Link
                          href={localePath(locale, `/coins/${coin.slug}`)}
                          className="inline-flex items-center gap-2 transition-colors hover:text-white"
                        >
                          <CoinMark coin={coin} size={24} />
                          <span>{t(coin.name, locale)}</span>
                          <span className="font-mono text-xs text-(--color-ink-dim)" translate="no">
                            {coin.symbol}
                          </span>
                        </Link>
                      </td>
                      <td className="py-3 text-end font-mono" translate="no">
                        {row.price !== null ? formatPrice(row.price, locale) : "—"}
                      </td>
                      <td className="py-3 text-end">
                        {row.change24h !== null ? (
                          <PriceChange
                            value={row.change24h}
                            locale={locale}
                            labels={{
                              up: dict.a11y.priceUp,
                              down: dict.a11y.priceDown,
                              flat: dict.a11y.priceFlat,
                            }}
                            className="justify-end"
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 text-end font-mono" translate="no">
                        {row.marketCap !== null ? formatCompact(row.marketCap, locale) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/*
            この表はビルド時の値です。上のチャートだけがブラウザ側で更新されます。
            両方が同じ鮮度に見えないよう、取得日時を表の側にも出します。
          */}
          <DataFreshness snapshot={snapshot} dict={dict} locale={locale} className="mt-4" />
          <p className="mt-2 text-xs text-(--color-ink-dim)">{dict.market.dataNote}</p>
        </div>

        <JsonLd data={[breadcrumbJsonLd(locale, trail)]} />
      </Container>
    </Section>
  );
}
