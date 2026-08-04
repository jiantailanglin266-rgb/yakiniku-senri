import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { isLocale, localePath, staticLocales } from "@/portal/i18n/config";
import { getDictionary } from "@/portal/i18n/dictionaries";
import { portalMetadata } from "@/portal/lib/seo";
import { exchanges, getExchange } from "@/portal/data/exchanges";
import { coins } from "@/portal/data/coins";
import { formatDate, t, tList } from "@/portal/lib/format";
import { resolveLink } from "@/portal/lib/affiliate";
import { breadcrumbJsonLd, faqJsonLd, howToJsonLd } from "@/portal/lib/structured-data";

import { Breadcrumbs, Container, PageHeader, Section } from "@/portal/components/layout/Shell";
import {
  Badge,
  GlassCard,
  NeonLink,
  NoticeBox,
  SupportMark,
} from "@/portal/components/ui/primitives";
import { OutboundLink } from "@/portal/components/ui/links";
import { FaqList } from "@/portal/components/ui/sections";
import { JsonLd } from "@/portal/components/ui/JsonLd";

export function generateStaticParams() {
  return staticLocales().flatMap((locale) =>
    exchanges.map((exchange) => ({ locale, slug: exchange.slug })),
  );
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const exchange = getExchange(slug);
  if (!isLocale(locale) || !exchange) return {};
  return portalMetadata({
    locale,
    path: `/exchanges/${exchange.slug}`,
    title: exchange.name,
    description: t(exchange.summary, locale),
  });
}

export default async function ExchangeDetailPage(props: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await props.params;
  if (!isLocale(locale)) notFound();
  const exchange = getExchange(slug);
  if (!exchange) notFound();

  const dict = getDictionary(locale);
  const link = resolveLink(exchange.affiliateId, exchange.officialUrl);
  const supportLabels = {
    yes: dict.common.yes,
    no: dict.common.no,
    partial: dict.common.partial,
    unknown: dict.common.unknown,
  };

  const listedCoins = coins.filter((coin) => coin.listedOn.includes(exchange.id));
  const howTo = tList(exchange.howToOpen, locale);

  const specs: { label: string; value: React.ReactNode }[] = [
    {
      label: dict.exchanges.spot,
      value: <SupportMark value={exchange.spot} labels={supportLabels} />,
    },
    {
      label: dict.exchanges.margin,
      value: <SupportMark value={exchange.margin} labels={supportLabels} />,
    },
    {
      label: dict.exchanges.futures,
      value: <SupportMark value={exchange.futures} labels={supportLabels} />,
    },
    {
      label: dict.exchanges.copyTrading,
      value: <SupportMark value={exchange.copyTrading} labels={supportLabels} />,
    },
    {
      label: dict.exchanges.savings,
      value: <SupportMark value={exchange.savings} labels={supportLabels} />,
    },
    {
      label: dict.exchanges.staking,
      value: <SupportMark value={exchange.staking} labels={supportLabels} />,
    },
    {
      label: dict.exchanges.lending,
      value: <SupportMark value={exchange.lending} labels={supportLabels} />,
    },
    {
      label: dict.exchanges.app,
      value: <SupportMark value={exchange.app} labels={supportLabels} />,
    },
    {
      label: dict.exchanges.japanese,
      value: <SupportMark value={exchange.japanese} labels={supportLabels} />,
    },
    { label: dict.exchanges.tradingFee, value: t(exchange.tradingFee, locale) },
    { label: dict.exchanges.spread, value: t(exchange.spread, locale) },
    { label: dict.exchanges.depositFee, value: t(exchange.depositFee, locale) },
    { label: dict.exchanges.withdrawalFee, value: t(exchange.withdrawalFee, locale) },
    { label: dict.exchanges.minOrder, value: t(exchange.minOrder, locale) },
    { label: dict.exchanges.kyc, value: t(exchange.kyc, locale) },
    ...(exchange.maxLeverage
      ? [{ label: dict.exchanges.maxLeverage, value: exchange.maxLeverage }]
      : []),
  ];

  const trail = [
    { name: dict.nav.exchanges, path: "/exchanges" },
    { name: exchange.name, path: `/exchanges/${exchange.slug}` },
  ];

  return (
    <Section className="pt-28">
      <Container>
        <Breadcrumbs trail={trail} locale={locale} dict={dict} />
        <PageHeader
          eyebrow={exchange.region === "domestic" ? "Japan" : "Global"}
          title={exchange.name}
          lead={t(exchange.summary, locale)}
          meta={
            <div className="flex flex-wrap items-center gap-3 text-xs text-(--color-ink-dim)">
              <span>{t(exchange.operator, locale)}</span>
              {exchange.checkedAt ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    {dict.common.checkedAt}: {formatDate(exchange.checkedAt, locale)}
                  </span>
                </>
              ) : (
                <Badge tone="amber">
                  {locale === "ja" ? "数値は未検証（サンプル）" : "Figures unverified (sample)"}
                </Badge>
              )}
            </div>
          }
        />

        {exchange.region === "overseas" ? (
          <NoticeBox tone="rose" className="mb-8" title={dict.exchanges.overseas}>
            {dict.exchanges.overseasWarning}
          </NoticeBox>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="grid gap-8">
            {/* 編集部評価。ユーザーレビューではないことを明示します */}
            <GlassCard className="p-5" glow={false}>
              <h2 className="mb-1 text-lg font-semibold">
                {dict.exchanges.rating}: {exchange.rating.toFixed(1)} / 5.0
              </h2>
              <p className="mb-4 text-xs text-(--color-ink-dim)">
                {locale === "ja"
                  ? "編集部が定めた基準にもとづく評価です。利用者レビューの集計ではありません。"
                  : "An editorial score against our own criteria — not an aggregate of user reviews."}
              </p>
              <dl className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["fees", dict.exchanges.tradingFee],
                    ["assets", dict.exchanges.listings],
                    ["security", dict.exchanges.security],
                    ["usability", dict.common.readMore],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <dt className="mb-1 flex justify-between text-xs">
                      <span className="text-(--color-ink-dim)">{label}</span>
                      <span className="font-mono">{exchange.ratingBreakdown[key].toFixed(1)}</span>
                    </dt>
                    <dd className="h-1 overflow-hidden rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-(--color-cyan) to-(--color-violet)"
                        style={{ width: `${(exchange.ratingBreakdown[key] / 5) * 100}%` }}
                      />
                    </dd>
                  </div>
                ))}
              </dl>
            </GlassCard>

            <section>
              <h2 className="mb-3 text-xl font-semibold">{dict.exchanges.pros}</h2>
              <ul className="grid gap-2 text-sm text-(--color-ink-soft)">
                {tList(exchange.pros, locale).map((entry) => (
                  <li key={entry} className="flex gap-2">
                    <span aria-hidden="true" className="text-(--color-emerald)">
                      ＋
                    </span>
                    {entry}
                  </li>
                ))}
              </ul>

              <h2 className="mt-6 mb-3 text-xl font-semibold">{dict.exchanges.cons}</h2>
              <ul className="grid gap-2 text-sm text-(--color-ink-soft)">
                {tList(exchange.cons, locale).map((entry) => (
                  <li key={entry} className="flex gap-2">
                    <span aria-hidden="true" className="text-(--color-down)">
                      －
                    </span>
                    {entry}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">{dict.common.category}</h2>
              <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="flex items-center justify-between gap-4 border-b border-(--color-hairline) py-2 text-sm"
                  >
                    <dt className="text-(--color-ink-dim)">{spec.label}</dt>
                    <dd className="tabular text-end">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">{dict.exchanges.security}</h2>
              <ul className="grid gap-2 text-sm text-(--color-ink-soft)">
                {tList(exchange.security, locale).map((entry) => (
                  <li key={entry}>· {entry}</li>
                ))}
              </ul>
            </section>

            {howTo.length > 0 ? (
              <section>
                <h2 className="mb-3 text-xl font-semibold">{dict.exchanges.howToOpen}</h2>
                <ol className="grid gap-3">
                  {howTo.map((step, index) => (
                    <li key={step} className="flex gap-3 text-sm text-(--color-ink-soft)">
                      <span
                        aria-hidden="true"
                        className="grid size-6 shrink-0 place-items-center rounded-full border border-(--color-cyan)/40 font-mono text-xs text-(--color-cyan)"
                      >
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {listedCoins.length > 0 ? (
              <section>
                <h2 className="mb-3 text-xl font-semibold">{dict.exchanges.viewListings}</h2>
                <ul className="flex flex-wrap gap-2">
                  {listedCoins.map((coin) => (
                    <li key={coin.id}>
                      <Link
                        href={localePath(locale, `/coins/${coin.slug}`)}
                        className="glass edge-glow inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs"
                      >
                        <span
                          aria-hidden="true"
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: coin.color }}
                        />
                        {coin.symbol}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {exchange.faq.length > 0 ? (
              <section>
                <h2 className="mb-3 text-xl font-semibold">{dict.faq.title}</h2>
                <FaqList items={exchange.faq} locale={locale} />
              </section>
            ) : null}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <GlassCard className="edge-flow p-5" glow={false}>
              <h2 className="text-base font-semibold">{exchange.name}</h2>
              <p className="mt-2 text-sm text-(--color-ink-soft)">{t(exchange.summary, locale)}</p>

              <OutboundLink
                link={link}
                placement="exchange-detail-sidebar"
                label={exchange.name}
                adLabel={dict.common.sponsored}
                srExternal={dict.a11y.externalLink}
                className="mt-5 w-full justify-center rounded-full bg-linear-to-r from-(--color-cyan) via-(--color-blue) to-(--color-violet) px-5 py-3 text-sm font-semibold text-(--color-void)"
              >
                {exchange.region === "domestic"
                  ? dict.exchanges.openAccount
                  : dict.exchanges.viewOfficial}
              </OutboundLink>

              <p className="mt-3 text-[0.6875rem] text-(--color-ink-dim)">
                {link.sponsored ? dict.footer.affiliateNote : dict.common.official}
              </p>

              <NeonLink
                href={localePath(locale, "/diagnosis/exchange")}
                tone="outline"
                className="mt-4 w-full"
              >
                {dict.hero.ctaDiagnosis}
              </NeonLink>
            </GlassCard>

            <NoticeBox tone="amber" className="mt-6">
              {dict.footer.disclaimer}
            </NoticeBox>
          </aside>
        </div>
      </Container>

      <JsonLd
        data={[
          breadcrumbJsonLd(locale, trail),
          faqJsonLd(locale, exchange.faq),
          howToJsonLd(`${exchange.name} — ${dict.exchanges.howToOpen}`, howTo),
        ]}
      />
    </Section>
  );
}
