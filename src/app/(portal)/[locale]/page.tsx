import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isLocale, localePath, staticLocales } from "@/portal/i18n/config";
import { getDictionary } from "@/portal/i18n/dictionaries";
import { portalMetadata } from "@/portal/lib/seo";
import { getMarketSnapshot } from "@/portal/lib/market";
import { formatCompact, formatNumber, t, tList } from "@/portal/lib/format";

import { coins, getCoin } from "@/portal/data/coins";
import { domesticExchanges, overseasExchanges, DATASET_STATUS } from "@/portal/data/exchanges";
import { groupedNews, trendingNews, NEWS_DATASET_STATUS } from "@/portal/data/news";
import { wallets } from "@/portal/data/wallets";
import { toolCategories, tools } from "@/portal/data/tools";
import { longVideos, shortVideos } from "@/portal/data/videos";
import { learnArticles } from "@/portal/data/learn";
import { diagnoses } from "@/portal/data/diagnoses";
import { activeCampaigns, siteFaq } from "@/portal/data/site-content";

import { Container, Section } from "@/portal/components/layout/Shell";
import { Hero } from "@/portal/components/home/Hero";
import { MarketTicker } from "@/portal/components/market/MarketTicker";
import { CoinCard } from "@/portal/components/market/CoinCard";
import { DataFreshness } from "@/portal/components/market/DataFreshness";
import { PriceChange } from "@/portal/components/market/charts";
import { NewsCard } from "@/portal/components/news/NewsCard";
import {
  Badge,
  EmptyState,
  GlassCard,
  NeonLink,
  NoticeBox,
  SectionHeading,
  StatTile,
} from "@/portal/components/ui/primitives";
import { FaqList, SubscribeForm } from "@/portal/components/ui/sections";
import { JsonLd } from "@/portal/components/ui/JsonLd";
import { faqJsonLd, itemListJsonLd } from "@/portal/lib/structured-data";

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
    title: dict.hero.title,
    description: dict.hero.subtitle,
  });
}

export default async function PortalHome(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const snapshot = await getMarketSnapshot();
  const marketById = new Map(snapshot.coins.map((entry) => [entry.id, entry]));

  const byChange = snapshot.coins.slice().sort((a, b) => b.change24h - a.change24h);
  const gainers = byChange.slice(0, 3);
  const losers = byChange.slice(-3).reverse();
  const featuredCoins = coins.slice(0, 6);
  const news = groupedNews().slice(0, 6);
  const trending = trendingNews(5);
  const campaigns = activeCampaigns();

  const a11yLabels = {
    up: dict.a11y.priceUp,
    down: dict.a11y.priceDown,
    flat: dict.a11y.priceFlat,
  };

  return (
    <>
      {/* 1. ファーストビュー */}
      <Hero locale={locale} dict={dict} snapshot={snapshot} featured={coins} />

      {/* 2. リアルタイムマーケットティッカー */}
      <div aria-label={dict.market.ticker}>
        <MarketTicker
          coins={coins.map((coin) => ({
            id: coin.id,
            slug: coin.slug,
            symbol: coin.symbol,
            name: t(coin.name, locale),
            color: coin.color,
          }))}
          markets={snapshot.coins}
          locale={locale}
          refreshIntervalSec={snapshot.refreshIntervalSec}
          labels={a11yLabels}
        />
      </div>

      {/* 3. マーケット概要 */}
      <Section id="market" labelledBy="market-heading">
        <Container>
          <SectionHeading
            id="market-heading"
            eyebrow="Market overview"
            title={dict.market.overview}
            lead={dict.market.overviewLead}
            action={
              <NeonLink href={localePath(locale, "/coins")} tone="outline">
                {dict.common.viewAll}
              </NeonLink>
            }
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label={dict.hero.marketCap}
              value={formatCompact(snapshot.global.totalMarketCap, locale)}
              sub={
                <PriceChange
                  value={snapshot.global.marketCapChange24h}
                  locale={locale}
                  labels={a11yLabels}
                />
              }
            />
            <StatTile
              label={dict.hero.volume24h}
              value={formatCompact(snapshot.global.totalVolume24h, locale)}
            />
            <StatTile
              label={dict.market.btcDominance}
              value={`${formatNumber(snapshot.global.btcDominance, locale, 1)}%`}
            />
            <StatTile
              label={dict.market.ethDominance}
              value={`${formatNumber(snapshot.global.ethDominance, locale, 1)}%`}
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            {[
              { title: dict.market.gainers, list: gainers },
              { title: dict.market.losers, list: losers },
              {
                title: dict.market.trending,
                list: snapshot.trending
                  .map((id) => marketById.get(id))
                  .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
                  .slice(0, 3),
              },
              {
                title: dict.market.newListings,
                list: snapshot.newListings
                  .map((id) => marketById.get(id))
                  .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
                  .slice(0, 3),
              },
            ].map((group) => (
              <GlassCard key={group.title} className="p-4" glow={false}>
                <h3 className="mb-3 text-xs tracking-wide text-(--color-ink-dim) uppercase">
                  {group.title}
                </h3>
                <ul className="grid gap-2">
                  {group.list.map((market) => {
                    const coin = getCoin(market.id);
                    if (!coin) return null;
                    return (
                      <li key={market.id}>
                        <Link
                          href={localePath(locale, `/coins/${coin.slug}`)}
                          className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
                        >
                          <span className="font-mono text-xs font-semibold">{coin.symbol}</span>
                          <PriceChange
                            value={market.change24h}
                            locale={locale}
                            labels={a11yLabels}
                            className="ms-auto"
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </GlassCard>
            ))}
          </div>

          <DataFreshness snapshot={snapshot} dict={dict} locale={locale} className="mt-5" />
          <p className="mt-2 text-xs text-(--color-ink-dim)">{dict.market.dataNote}</p>
        </Container>
      </Section>

      {/* 4. 最新ニュース */}
      <Section id="news" labelledBy="news-heading">
        <Container>
          <SectionHeading
            id="news-heading"
            eyebrow="News"
            title={dict.news.title}
            lead={dict.news.lead}
            action={
              <NeonLink href={localePath(locale, "/news")} tone="outline">
                {dict.common.viewAll}
              </NeonLink>
            }
          />

          {NEWS_DATASET_STATUS === "sample" ? (
            <NoticeBox tone="cyan" className="mb-6">
              {locale === "ja"
                ? "掲載中のニュースはレイアウト確認用のサンプルです。本番ではRSS / ニュースAPIから取得した記事に差し替わります。"
                : "The articles below are samples used to verify the layout. In production they are replaced by items fetched from RSS and news APIs."}
            </NoticeBox>
          ) : null}

          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {news.map(({ article, duplicates }) => (
              <li key={article.id}>
                <NewsCard
                  article={article}
                  duplicates={duplicates.length}
                  locale={locale}
                  dict={dict}
                />
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* 5. 急上昇ニュース */}
      <Section labelledBy="trending-heading">
        <Container>
          <SectionHeading
            id="trending-heading"
            eyebrow="Trending"
            title={dict.news.trending}
            lead={dict.news.trendingLead}
          />
          <ol className="grid gap-3 lg:grid-cols-2">
            {trending.map((article, index) => (
              <li key={article.id} className="flex items-start gap-4">
                <span
                  aria-hidden="true"
                  className="mt-1 font-mono text-2xl font-bold text-(--color-violet) opacity-60"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <NewsCard article={article} locale={locale} dict={dict} compact />
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* 6. 注目の仮想通貨 */}
      <Section labelledBy="coins-heading">
        <Container>
          <SectionHeading
            id="coins-heading"
            eyebrow="Coins"
            title={dict.market.featured}
            lead={dict.market.featuredLead}
            action={
              <NeonLink href={localePath(locale, "/coins")} tone="outline">
                {dict.common.viewAll}
              </NeonLink>
            }
          />
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {featuredCoins.map((coin) => (
              <li key={coin.id}>
                <CoinCard
                  coin={coin}
                  market={marketById.get(coin.id)}
                  locale={locale}
                  dict={dict}
                />
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* 7 / 8. 取引所比較 */}
      <Section labelledBy="exchanges-heading">
        <Container>
          <SectionHeading
            id="exchanges-heading"
            eyebrow="Exchanges"
            title={dict.exchanges.domestic}
            lead={dict.exchanges.domesticLead}
            action={
              <NeonLink href={localePath(locale, "/exchanges")} tone="outline">
                {dict.common.viewAll}
              </NeonLink>
            }
          />

          {DATASET_STATUS === "sample" ? (
            <NoticeBox tone="amber" className="mb-6">
              {locale === "ja"
                ? "手数料・スプレッド・最低取引額は変動するため、未検証の数値は掲載していません（「公式サイトで要確認」と表示）。実測値を確認のうえ差し替えてください。"
                : "Fees, spreads and minimums change constantly, so unverified figures are not published here — they show as “check official site”. Replace them once verified."}
            </NoticeBox>
          ) : null}

          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {domesticExchanges.slice(0, 3).map((exchange) => (
              <li key={exchange.id}>
                <GlassCard as="article" className="flex h-full flex-col p-5">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="grid size-10 shrink-0 place-items-center rounded-lg font-mono text-xs font-bold"
                      style={{
                        color: exchange.color,
                        background: `${exchange.color}1a`,
                        border: `1px solid ${exchange.color}44`,
                      }}
                    >
                      {exchange.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <h3 className="font-semibold">{exchange.name}</h3>
                      <p className="text-xs text-(--color-ink-dim)">
                        {dict.exchanges.rating} {exchange.rating.toFixed(1)} / 5.0
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 flex-1 text-sm text-(--color-ink-soft)">
                    {t(exchange.summary, locale)}
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {exchange.beginnerFriendly ? (
                      <li>
                        <Badge tone="emerald">{dict.exchanges.beginner}</Badge>
                      </li>
                    ) : null}
                    {exchange.staking === "yes" ? (
                      <li>
                        <Badge tone="cyan">{dict.exchanges.staking}</Badge>
                      </li>
                    ) : null}
                    {exchange.savings === "yes" ? (
                      <li>
                        <Badge tone="violet">{dict.exchanges.savings}</Badge>
                      </li>
                    ) : null}
                  </ul>
                  <NeonLink
                    href={localePath(locale, `/exchanges/${exchange.slug}`)}
                    tone="outline"
                    className="mt-4 w-full"
                  >
                    {dict.common.readMore}
                  </NeonLink>
                </GlassCard>
              </li>
            ))}
          </ul>

          <div className="mt-12">
            <SectionHeading
              eyebrow="Global"
              title={dict.exchanges.overseas}
              lead={dict.exchanges.overseasLead}
              action={
                <NeonLink href={localePath(locale, "/exchanges/overseas")} tone="outline">
                  {dict.common.viewAll}
                </NeonLink>
              }
            />
            <NoticeBox tone="rose" title={dict.exchanges.overseas}>
              {dict.exchanges.overseasWarning}
            </NoticeBox>
            <ul className="mt-6 grid gap-4 md:grid-cols-3">
              {overseasExchanges.map((exchange) => (
                <li key={exchange.id}>
                  <GlassCard as="article" className="p-5">
                    <h3 className="font-semibold">{exchange.name}</h3>
                    <p className="mt-2 text-sm text-(--color-ink-soft)">
                      {t(exchange.summary, locale)}
                    </p>
                    <NeonLink
                      href={localePath(locale, `/exchanges/${exchange.slug}`)}
                      tone="ghost"
                      className="mt-3 px-0"
                    >
                      {dict.common.readMore} →
                    </NeonLink>
                  </GlassCard>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {/* 9. ウォレット比較 */}
      <Section labelledBy="wallets-heading">
        <Container>
          <SectionHeading
            id="wallets-heading"
            eyebrow="Wallets"
            title={dict.wallets.title}
            lead={dict.wallets.lead}
            action={
              <NeonLink href={localePath(locale, "/wallets")} tone="outline">
                {dict.common.viewAll}
              </NeonLink>
            }
          />
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {wallets.slice(0, 4).map((wallet) => (
              <li key={wallet.id}>
                <GlassCard as="article" className="h-full p-5">
                  <Link href={localePath(locale, `/wallets/${wallet.slug}`)}>
                    <h3 className="font-semibold" style={{ color: wallet.color }}>
                      {wallet.name}
                    </h3>
                    <p className="mt-2 text-sm text-(--color-ink-soft)">
                      {t(wallet.summary, locale)}
                    </p>
                    <p className="mt-3 text-xs text-(--color-ink-dim)">
                      {dict.wallets.chains}: {wallet.chains.slice(0, 3).join(" / ")}
                    </p>
                  </Link>
                </GlassCard>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* 10. Web3.0ツール */}
      <Section labelledBy="tools-heading">
        <Container>
          <SectionHeading
            id="tools-heading"
            eyebrow="Web3"
            title={dict.tools.title}
            lead={dict.tools.lead}
            action={
              <NeonLink href={localePath(locale, "/tools")} tone="outline">
                {dict.common.viewAll}
              </NeonLink>
            }
          />
          <ul className="mb-6 flex flex-wrap gap-2">
            {toolCategories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`${localePath(locale, "/tools")}?category=${category.id}`}
                  className="glass edge-glow inline-flex rounded-full px-3 py-1.5 text-xs transition-colors hover:text-white"
                >
                  {t(category.label, locale)}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tools.slice(0, 6).map((tool) => (
              <li key={tool.id}>
                <GlassCard as="article" className="h-full p-5">
                  <Link href={localePath(locale, `/tools/${tool.slug}`)}>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{tool.name}</h3>
                      <Badge tone="violet">
                        {t(
                          toolCategories.find((entry) => entry.id === tool.category)?.label ?? {
                            ja: tool.category,
                            en: tool.category,
                          },
                          locale,
                        )}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-(--color-ink-soft)">
                      {t(tool.summary, locale)}
                    </p>
                  </Link>
                </GlassCard>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* 11. YouTube 最新動画 */}
      <Section labelledBy="videos-heading">
        <Container>
          <SectionHeading
            id="videos-heading"
            eyebrow="YouTube"
            title={dict.videos.title}
            lead={dict.videos.lead}
            action={
              <NeonLink href={localePath(locale, "/videos")} tone="outline">
                {dict.common.viewAll}
              </NeonLink>
            }
          />
          <ul className="grid gap-4 md:grid-cols-3">
            {longVideos.map((video) => (
              <li key={video.id}>
                <GlassCard as="article" className="h-full overflow-hidden">
                  <Link href={localePath(locale, `/videos/${video.slug}`)}>
                    <div
                      aria-hidden="true"
                      className="grid aspect-video place-items-center bg-linear-to-br from-(--color-navy) to-(--color-abyss) text-(--color-ink-dim)"
                    >
                      <svg viewBox="0 0 24 24" className="size-10 opacity-50">
                        <path d="M9 7.5v9l7.5-4.5z" fill="currentColor" />
                        <rect
                          x="1.5"
                          y="3.5"
                          width="21"
                          height="17"
                          rx="4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.4"
                        />
                      </svg>
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-semibold">{t(video.title, locale)}</h3>
                      <p className="mt-1.5 line-clamp-2 text-xs text-(--color-ink-soft)">
                        {t(video.summary, locale)}
                      </p>
                    </div>
                  </Link>
                </GlassCard>
              </li>
            ))}
          </ul>

          {shortVideos.length > 0 ? (
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold">{dict.videos.shorts}</h3>
              <ul className="flex flex-wrap gap-3">
                {shortVideos.map((video) => (
                  <li key={video.id}>
                    <Link
                      href={localePath(locale, `/videos/${video.slug}`)}
                      className="glass edge-glow inline-flex rounded-full px-4 py-2 text-xs transition-colors hover:text-white"
                    >
                      {t(video.title, locale)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Container>
      </Section>

      {/* 12. 仮想通貨診断 */}
      <Section labelledBy="diagnosis-heading">
        <Container>
          <SectionHeading
            id="diagnosis-heading"
            eyebrow="Quiz"
            title={dict.diagnosis.title}
            lead={dict.diagnosis.lead}
            action={
              <NeonLink href={localePath(locale, "/diagnosis")} tone="outline">
                {dict.common.viewAll}
              </NeonLink>
            }
          />
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {diagnoses.slice(0, 4).map((diagnosis) => (
              <li key={diagnosis.id}>
                <GlassCard as="article" className="h-full p-5">
                  <Link href={localePath(locale, `/diagnosis/${diagnosis.slug}`)}>
                    <h3 className="text-sm font-semibold">{t(diagnosis.title, locale)}</h3>
                    <p className="mt-2 text-xs text-(--color-ink-soft)">
                      {t(diagnosis.lead, locale)}
                    </p>
                    <p className="mt-3 text-xs text-(--color-cyan-soft)">
                      {dict.diagnosis.start} →
                    </p>
                  </Link>
                </GlassCard>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* 13. AIチャットボット */}
      <Section labelledBy="chat-heading">
        <Container>
          <GlassCard className="edge-flow p-6 sm:p-10" glow={false}>
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
              <div>
                <p className="eyebrow mb-2">AI assistant</p>
                <h2 id="chat-heading" className="text-2xl font-semibold sm:text-3xl">
                  {dict.chat.title}
                </h2>
                <p className="mt-3 text-sm text-(--color-ink-soft)">{dict.chat.intro}</p>
                <p className="mt-3 text-xs text-(--color-ink-dim)">{dict.chat.sourceNote}</p>
              </div>
              <NoticeBox tone="rose">{dict.chat.securityNotice}</NoticeBox>
            </div>
          </GlassCard>
        </Container>
      </Section>

      {/* 14. 学習コンテンツ */}
      <Section labelledBy="learn-heading">
        <Container>
          <SectionHeading
            id="learn-heading"
            eyebrow="Learn"
            title={dict.learn.title}
            lead={dict.learn.lead}
            action={
              <NeonLink href={localePath(locale, "/learn")} tone="outline">
                {dict.common.viewAll}
              </NeonLink>
            }
          />
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {learnArticles.slice(0, 6).map((article) => (
              <li key={article.id}>
                <GlassCard as="article" className="h-full p-5">
                  <Link href={localePath(locale, `/learn/${article.slug}`)}>
                    <Badge
                      tone={
                        article.level === "beginner"
                          ? "emerald"
                          : article.level === "intermediate"
                            ? "cyan"
                            : "magenta"
                      }
                    >
                      {dict.learn.levels[article.level]}
                    </Badge>
                    <h3 className="mt-3 font-semibold">{t(article.title, locale)}</h3>
                    <p className="mt-2 line-clamp-3 text-sm text-(--color-ink-soft)">
                      {t(article.conclusion, locale)}
                    </p>
                  </Link>
                </GlassCard>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* 15. 最新キャンペーン */}
      <Section labelledBy="campaigns-heading">
        <Container>
          <SectionHeading
            id="campaigns-heading"
            eyebrow="Campaigns"
            title={dict.campaigns.title}
            lead={dict.campaigns.lead}
          />
          {campaigns.length === 0 ? (
            <EmptyState message={dict.campaigns.empty} />
          ) : (
            <ul className="grid gap-4 md:grid-cols-3">
              {campaigns.map((campaign) => (
                <li key={campaign.id}>
                  <GlassCard as="article" className="p-5">
                    <h3 className="font-semibold">{t(campaign.title, locale)}</h3>
                    <p className="mt-2 text-sm text-(--color-ink-soft)">
                      {t(campaign.summary, locale)}
                    </p>
                    <ul className="mt-3 grid gap-1 text-xs text-(--color-ink-dim)">
                      {tList(campaign.conditions, locale).map((condition) => (
                        <li key={condition}>· {condition}</li>
                      ))}
                    </ul>
                  </GlassCard>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </Section>

      {/* 16. メルマガ・SNS */}
      <Section labelledBy="subscribe-heading">
        <Container>
          <GlassCard className="p-6 sm:p-10" glow={false}>
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="eyebrow mb-2">Stay updated</p>
                <h2 id="subscribe-heading" className="text-2xl font-semibold sm:text-3xl">
                  {dict.subscribe.title}
                </h2>
                <p className="mt-3 text-sm text-(--color-ink-soft)">{dict.subscribe.lead}</p>
              </div>
              <SubscribeForm dict={dict} />
            </div>
          </GlassCard>
        </Container>
      </Section>

      {/* 17. FAQ */}
      <Section labelledBy="faq-heading">
        <Container>
          <SectionHeading
            id="faq-heading"
            eyebrow="FAQ"
            title={dict.faq.title}
            lead={dict.faq.lead}
          />
          <FaqList items={siteFaq} locale={locale} />
        </Container>
      </Section>

      <JsonLd
        data={[
          faqJsonLd(locale, siteFaq),
          itemListJsonLd(
            locale,
            dict.market.featured,
            featuredCoins.map((coin) => ({
              name: t(coin.name, locale),
              path: `/coins/${coin.slug}`,
            })),
          ),
        ]}
      />
    </>
  );
}
