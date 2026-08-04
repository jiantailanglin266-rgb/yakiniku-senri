import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isLocale, staticLocales } from "@/portal/i18n/config";
import { getDictionary } from "@/portal/i18n/dictionaries";
import { portalMetadata } from "@/portal/lib/seo";
import { getWallet, wallets } from "@/portal/data/wallets";
import { t, tList } from "@/portal/lib/format";
import { resolveLink } from "@/portal/lib/affiliate";
import { breadcrumbJsonLd, softwareJsonLd } from "@/portal/lib/structured-data";

import { Breadcrumbs, Container, PageHeader, Section } from "@/portal/components/layout/Shell";
import { GlassCard, NoticeBox, SupportMark } from "@/portal/components/ui/primitives";
import { OutboundLink } from "@/portal/components/ui/links";
import { JsonLd } from "@/portal/components/ui/JsonLd";

export function generateStaticParams() {
  return staticLocales().flatMap((locale) =>
    wallets.map((wallet) => ({ locale, slug: wallet.slug })),
  );
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const wallet = getWallet(slug);
  if (!isLocale(locale) || !wallet) return {};
  return portalMetadata({
    locale,
    path: `/wallets/${wallet.slug}`,
    title: wallet.name,
    description: t(wallet.summary, locale),
  });
}

export default async function WalletDetailPage(props: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await props.params;
  if (!isLocale(locale)) notFound();
  const wallet = getWallet(slug);
  if (!wallet) notFound();

  const dict = getDictionary(locale);
  const link = resolveLink(wallet.affiliateId, wallet.officialUrl);
  const supportLabels = {
    yes: dict.common.yes,
    no: dict.common.no,
    partial: dict.common.partial,
    unknown: dict.common.unknown,
  };

  const trail = [
    { name: dict.nav.wallets, path: "/wallets" },
    { name: wallet.name, path: `/wallets/${wallet.slug}` },
  ];

  return (
    <Section className="pt-28">
      <Container>
        <Breadcrumbs trail={trail} locale={locale} dict={dict} />
        <PageHeader eyebrow="Wallet" title={wallet.name} lead={t(wallet.summary, locale)} />

        <NoticeBox tone="rose" className="mb-8">
          {dict.wallets.lead}
        </NoticeBox>

        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="grid gap-8">
            <section>
              <h2 className="mb-3 text-xl font-semibold">{dict.exchanges.security}</h2>
              <ul className="grid gap-2 text-sm text-(--color-ink-soft)">
                {tList(wallet.security, locale).map((entry) => (
                  <li key={entry}>· {entry}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">{dict.exchanges.pros}</h2>
              <ul className="grid gap-2 text-sm text-(--color-ink-soft)">
                {tList(wallet.pros, locale).map((entry) => (
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
                {tList(wallet.cons, locale).map((entry) => (
                  <li key={entry} className="flex gap-2">
                    <span aria-hidden="true" className="text-(--color-down)">
                      －
                    </span>
                    {entry}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside>
            <GlassCard className="p-5" glow={false}>
              <h2 className="mb-4 text-sm font-semibold">{dict.common.category}</h2>
              <dl className="grid gap-2 text-sm">
                {(
                  [
                    [dict.wallets.mobile, wallet.mobile],
                    [dict.wallets.extension, wallet.extension],
                    [dict.wallets.hardware, wallet.hardware],
                    [dict.wallets.nft, wallet.nft],
                    [dict.wallets.swap, wallet.swap],
                    [dict.exchanges.staking, wallet.staking],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <dt className="text-(--color-ink-dim)">{label}</dt>
                    <dd>
                      <SupportMark value={value} labels={supportLabels} />
                    </dd>
                  </div>
                ))}
                <div className="flex items-start justify-between gap-3 border-t border-(--color-hairline) pt-2">
                  <dt className="text-(--color-ink-dim)">{dict.wallets.chains}</dt>
                  <dd className="text-end">{wallet.chains.join(" / ")}</dd>
                </div>
              </dl>

              <OutboundLink
                link={link}
                placement="wallet-detail"
                label={wallet.name}
                adLabel={dict.common.sponsored}
                srExternal={dict.a11y.externalLink}
                className="mt-5 w-full justify-center rounded-full border border-(--color-hairline-strong) px-5 py-3 text-sm font-semibold"
              >
                {dict.common.official}
              </OutboundLink>

              <p className="mt-3 text-[0.6875rem] text-(--color-ink-dim)">
                {locale === "ja"
                  ? "必ず公式ドメインであることを確認してからインストールしてください。"
                  : "Always verify you are on the official domain before installing."}
              </p>
            </GlassCard>
          </aside>
        </div>
      </Container>

      <JsonLd
        data={[
          breadcrumbJsonLd(locale, trail),
          softwareJsonLd(
            wallet.name,
            t(wallet.summary, locale),
            "FinanceApplication",
            wallet.officialUrl,
          ),
        ]}
      />
    </Section>
  );
}
