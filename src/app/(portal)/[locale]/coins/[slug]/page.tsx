import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { isLocale, localePath, staticLocales } from "@/portal/i18n/config";
import { getDictionary } from "@/portal/i18n/dictionaries";
import { portalMetadata } from "@/portal/lib/seo";
import { getMarketSnapshot, getPriceSeries } from "@/portal/lib/market";
import { coins, getCoin } from "@/portal/data/coins";
import { getExchange } from "@/portal/data/exchanges";
import { newsForCoin } from "@/portal/data/news";
import { videosForCoin } from "@/portal/data/videos";
import { learnArticles } from "@/portal/data/learn";
import {
  formatCompact,
  formatDate,
  formatNumber,
  formatPrice,
  t,
  tList,
} from "@/portal/lib/format";
import { breadcrumbJsonLd, faqJsonLd } from "@/portal/lib/structured-data";
import { EXTERNAL_REL } from "@/portal/lib/affiliate";
import type { ChartPeriod, PricePoint } from "@/portal/lib/types";

import { Breadcrumbs, Container, Section } from "@/portal/components/layout/Shell";
import { CoinMark } from "@/portal/components/market/CoinCard";
import { PriceChange } from "@/portal/components/market/charts";
import { PriceChartPanel } from "@/portal/components/market/PriceChartPanel";
import { DataFreshness } from "@/portal/components/market/DataFreshness";
import { NewsCard } from "@/portal/components/news/NewsCard";
import { WikimediaFigure } from "@/media/components";
import { pageImagesJsonLd } from "@/media/lib/structured-data";
import { portalPageKey } from "@/portal/lib/media";
import { PortalPhoto } from "@/portal/components/media/PortalPhoto";
import { Badge, GlassCard, NeonLink, NoticeBox } from "@/portal/components/ui/primitives";
import { FaqList } from "@/portal/components/ui/sections";
import { JsonLd } from "@/portal/components/ui/JsonLd";

export function generateStaticParams() {
  return staticLocales().flatMap((locale) => coins.map((coin) => ({ locale, slug: coin.slug })));
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const coin = getCoin(slug);
  if (!isLocale(locale) || !coin) return {};

  return portalMetadata({
    locale,
    path: `/coins/${coin.slug}`,
    title: `${t(coin.name, locale)}（${coin.symbol}）`,
    description: t(coin.summary, locale),
  });
}

const PERIODS: ChartPeriod[] = ["d1", "d7", "m1", "m3", "y1", "all"];

export default async function CoinDetailPage(props: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await props.params;
  if (!isLocale(locale)) notFound();
  const coin = getCoin(slug);
  if (!coin) notFound();

  const dict = getDictionary(locale);
  const snapshot = await getMarketSnapshot();
  const market = snapshot.coins.find((entry) => entry.id === coin.id);

  // 期間ごとの系列をまとめて取得し、クライアントでは切り替えるだけにします
  const seriesEntries = await Promise.all(
    PERIODS.map(
      async (period) => [period, (await getPriceSeries(coin.id, period)).points] as const,
    ),
  );
  const series = Object.fromEntries(seriesEntries) as Record<ChartPeriod, PricePoint[]>;

  const labels = { up: dict.a11y.priceUp, down: dict.a11y.priceDown, flat: dict.a11y.priceFlat };
  const relatedNews = newsForCoin(coin.id);
  const relatedVideos = videosForCoin(coin.id);
  const relatedLearn = learnArticles.filter((entry) => entry.relatedCoins.includes(coin.id));
  const listedExchanges = coin.listedOn
    .map((id) => getExchange(id))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const faq = [
    {
      q: {
        ja: `${t(coin.name, locale)}はどこで購入できますか？`,
        en: `Where can I buy ${t(coin.name, "en")}?`,
      },
      a: {
        ja: `当サイトで掲載している取引所のうち、${listedExchanges.map((entry) => entry.name).join("・")}で取り扱いが確認できています。取扱状況は変わるため、購入前に各社の公式サイトでご確認ください。`,
        en: `Among the exchanges listed on this site, it is available on ${listedExchanges.map((entry) => entry.name).join(", ")}. Listings change, so confirm on the official site before buying.`,
      },
    },
    {
      q: { ja: "発行上限はありますか？", en: "Is the supply capped?" },
      a: coin.maxSupply
        ? {
            ja: `プロトコル上の発行上限は ${formatNumber(coin.maxSupply, locale)} ${coin.symbol} です。`,
            en: `The protocol caps supply at ${formatNumber(coin.maxSupply, "en")} ${coin.symbol}.`,
          }
        : {
            ja: "発行上限は設けられていません。供給量は今後も増える設計です。",
            en: "There is no supply cap; issuance continues by design.",
          },
    },
  ];

  const trail = [
    { name: dict.nav.coins, path: "/coins" },
    { name: t(coin.name, locale), path: `/coins/${coin.slug}` },
  ];

  return (
    <Section className="pt-28">
      <Container>
        <Breadcrumbs trail={trail} locale={locale} dict={dict} />

        <div className="mb-8 flex flex-wrap items-center gap-4">
          <CoinMark coin={coin} size={56} />
          <div>
            <h1 className="text-3xl font-semibold sm:text-4xl">
              <span className="text-gradient">{t(coin.name, locale)}</span>
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 font-mono text-sm text-(--color-ink-dim)">
              <span>{coin.symbol}</span>
              {market ? <span>#{market.rank}</span> : null}
              {coin.categories.map((category) => (
                <Badge key={category}>{category}</Badge>
              ))}
            </p>
          </div>
        </div>

        {market ? (
          <div className="glass-strong mb-8 rounded-2xl p-5 sm:p-6">
            <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
              <p className="tabular font-mono text-3xl font-semibold sm:text-4xl">
                {formatPrice(market.price, locale)}
              </p>
              <PriceChange value={market.change24h} locale={locale} labels={labels} size="lg" />
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {[
                { label: dict.market.change24h, value: null, change: market.change24h },
                { label: dict.market.change7d, value: null, change: market.change7d },
                { label: dict.market.marketCap, value: formatCompact(market.marketCap, locale) },
                { label: dict.market.volume, value: formatCompact(market.volume24h, locale) },
                {
                  label: dict.market.supply,
                  value: market.circulatingSupply
                    ? `${formatNumber(market.circulatingSupply, locale)} ${coin.symbol}`
                    : dict.common.unknown,
                },
                {
                  label: dict.market.maxSupply,
                  value: coin.maxSupply
                    ? `${formatNumber(coin.maxSupply, locale)} ${coin.symbol}`
                    : dict.common.unknown,
                },
                {
                  label: dict.market.ath,
                  value: market.ath ? formatPrice(market.ath, locale) : dict.common.unknown,
                  sub: market.athDate ? formatDate(market.athDate, locale) : undefined,
                },
                {
                  label: dict.market.atl,
                  value: market.atl ? formatPrice(market.atl, locale) : dict.common.unknown,
                  sub: market.atlDate ? formatDate(market.atlDate, locale) : undefined,
                },
              ].map((entry) => (
                <div key={entry.label}>
                  <dt className="text-[0.6875rem] tracking-wide text-(--color-ink-dim) uppercase">
                    {entry.label}
                  </dt>
                  <dd className="tabular mt-1 font-mono text-sm font-medium">
                    {entry.change !== undefined && entry.change !== null ? (
                      <PriceChange value={entry.change} locale={locale} labels={labels} size="md" />
                    ) : (
                      entry.value
                    )}
                  </dd>
                  {entry.sub ? (
                    <dd className="text-[0.6875rem] text-(--color-ink-dim)">{entry.sub}</dd>
                  ) : null}
                </div>
              ))}
            </dl>

            <DataFreshness
              snapshot={snapshot}
              dict={dict}
              locale={locale}
              className="mt-5 border-t border-(--color-hairline) pt-4"
            />
          </div>
        ) : null}

        {/* 取得済みの写真があるときだけ出ます（無ければ何も足しません） */}
        <PortalPhoto
          kind="coin"
          slug={coin.slug}
          alt={t(coin.name, locale)}
          locale={locale}
          className="mb-8"
          priority
        />

        <PriceChartPanel
          series={series}
          color={coin.color}
          locale={locale}
          dict={dict}
          coinName={t(coin.name, locale)}
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="grid gap-8">
            <section>
              <h2 className="mb-3 text-xl font-semibold">{dict.learn.definition}</h2>
              <p className="text-(--color-ink-soft)">{t(coin.description, locale)}</p>
              {/* 図版はライセンス確認済みの画像があるときだけ出ます。
                  無いときは何も表示しません（装飾目的の画像は本文に挟みません） */}
              <WikimediaFigure pageKey={portalPageKey("coin", coin.slug)} locale={locale} />
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">{dict.learn.keyPoints}</h2>
              <ul className="grid gap-2 text-sm text-(--color-ink-soft)">
                {tList(coin.features, locale).map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span aria-hidden="true" className="text-(--color-cyan)">
                      ▸
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">{dict.learn.caution}</h2>
              <NoticeBox tone="amber">
                <ul className="grid gap-1.5">
                  {tList(coin.risks, locale).map((risk) => (
                    <li key={risk}>· {risk}</li>
                  ))}
                </ul>
              </NoticeBox>
            </section>

            {relatedNews.length > 0 ? (
              <section>
                <h2 className="mb-3 text-xl font-semibold">{dict.news.related}</h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {relatedNews.map((article) => (
                    <li key={article.id}>
                      <NewsCard article={article} locale={locale} dict={dict} compact />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {relatedVideos.length > 0 ? (
              <section>
                <h2 className="mb-3 text-xl font-semibold">{dict.videos.title}</h2>
                <ul className="grid gap-2">
                  {relatedVideos.map((video) => (
                    <li key={video.id}>
                      <Link
                        href={localePath(locale, `/videos/${video.slug}`)}
                        className="glass block rounded-xl px-4 py-3 text-sm transition-colors hover:text-white"
                      >
                        {t(video.title, locale)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section>
              <h2 className="mb-3 text-xl font-semibold">{dict.faq.title}</h2>
              <FaqList items={faq} locale={locale} />
            </section>
          </div>

          <aside className="grid gap-6">
            <GlassCard className="p-5" glow={false}>
              <h2 className="mb-3 text-sm font-semibold">{dict.exchanges.buyableAt}</h2>
              <ul className="grid gap-2">
                {listedExchanges.map((exchange) => (
                  <li key={exchange.id}>
                    <Link
                      href={localePath(locale, `/exchanges/${exchange.slug}`)}
                      className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/5"
                    >
                      <span>{exchange.name}</span>
                      <span className="text-xs text-(--color-ink-dim)">
                        {exchange.region === "domestic"
                          ? locale === "ja"
                            ? "国内"
                            : "JP"
                          : locale === "ja"
                            ? "海外"
                            : "Global"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <NeonLink
                href={localePath(locale, "/exchanges")}
                tone="outline"
                className="mt-4 w-full"
              >
                {dict.hero.ctaExchanges}
              </NeonLink>
            </GlassCard>

            <GlassCard className="p-5" glow={false}>
              <h2 className="mb-3 text-sm font-semibold">{dict.common.source}</h2>
              <ul className="grid gap-2 text-sm">
                {[
                  { label: dict.common.official, url: coin.links.website },
                  { label: "Whitepaper", url: coin.links.whitepaper },
                  { label: "Explorer", url: coin.links.explorer },
                  { label: "GitHub", url: coin.links.github },
                ]
                  .filter((entry) => Boolean(entry.url))
                  .map((entry) => (
                    <li key={entry.label}>
                      <a
                        href={entry.url}
                        target="_blank"
                        rel={EXTERNAL_REL}
                        className="text-(--color-cyan-soft) underline-offset-2 hover:underline"
                      >
                        {entry.label}
                        <span className="sr-only"> {dict.a11y.externalLink}</span>
                      </a>
                    </li>
                  ))}
              </ul>
              {coin.consensus ? (
                <p className="mt-4 text-xs text-(--color-ink-dim)">
                  {t(coin.consensus, locale)}
                  {coin.launchedAt ? ` · ${formatDate(coin.launchedAt, locale)}` : ""}
                </p>
              ) : null}
            </GlassCard>

            {relatedLearn.length > 0 ? (
              <GlassCard className="p-5" glow={false}>
                <h2 className="mb-3 text-sm font-semibold">{dict.learn.nextSteps}</h2>
                <ul className="grid gap-2 text-sm">
                  {relatedLearn.map((article) => (
                    <li key={article.id}>
                      <Link
                        href={localePath(locale, `/learn/${article.slug}`)}
                        className="text-(--color-cyan-soft) underline-offset-2 hover:underline"
                      >
                        {t(article.title, locale)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            ) : null}
          </aside>
        </div>
      </Container>

      <JsonLd
        data={[
          breadcrumbJsonLd(locale, trail),
          faqJsonLd(locale, faq),
          // 画面に出している画像だけを ImageObject として出します
          ...(pageImagesJsonLd(portalPageKey("coin", coin.slug), locale) ?? []),
        ]}
      />
    </Section>
  );
}
