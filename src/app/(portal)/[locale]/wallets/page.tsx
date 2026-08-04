import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { isLocale, localePath, staticLocales } from "@/portal/i18n/config";
import { getDictionary } from "@/portal/i18n/dictionaries";
import { portalMetadata } from "@/portal/lib/seo";
import { wallets } from "@/portal/data/wallets";
import { t, tList } from "@/portal/lib/format";
import { breadcrumbJsonLd, itemListJsonLd } from "@/portal/lib/structured-data";

import { Breadcrumbs, Container, PageHeader, Section } from "@/portal/components/layout/Shell";
import { Badge, GlassCard, NoticeBox, SupportMark } from "@/portal/components/ui/primitives";
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
    path: "/wallets",
    title: dict.wallets.title,
    description: dict.wallets.lead,
  });
}

const typeLabel: Record<string, { ja: string; en: string }> = {
  "hot-mobile": { ja: "モバイル", en: "Mobile" },
  "hot-extension": { ja: "拡張機能・アプリ", en: "Extension & app" },
  hardware: { ja: "ハードウェア", en: "Hardware" },
  "smart-contract": { ja: "スマートコントラクト", en: "Smart contract" },
};

export default async function WalletsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const supportLabels = {
    yes: dict.common.yes,
    no: dict.common.no,
    partial: dict.common.partial,
    unknown: dict.common.unknown,
  };
  const trail = [{ name: dict.nav.wallets, path: "/wallets" }];

  return (
    <Section className="pt-28">
      <Container>
        <Breadcrumbs trail={trail} locale={locale} dict={dict} />
        <PageHeader display="Wallets" title={dict.wallets.title} lead={dict.wallets.lead} />

        {/* 比較表より先に、鍵の扱いに関する注意を読ませます */}
        <NoticeBox tone="rose" className="mb-8">
          {locale === "ja"
            ? "当サイトは秘密鍵・シードフレーズを一切扱いません。いかなるサービスであっても、シードフレーズの入力を求められたら詐欺です。ウォレット接続の導線もこのページには置いていません。"
            : "This site never handles private keys or seed phrases. Any service that asks for a seed phrase is a scam. This page contains no wallet-connect prompts."}
        </NoticeBox>

        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {wallets.map((wallet) => (
            <li key={wallet.id}>
              <GlassCard as="article" className="flex h-full flex-col p-5">
                <Link href={localePath(locale, `/wallets/${wallet.slug}`)} className="flex-1">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="grid size-10 shrink-0 place-items-center rounded-lg font-mono text-xs font-bold"
                      style={{
                        color: wallet.color,
                        background: `${wallet.color}1a`,
                        border: `1px solid ${wallet.color}44`,
                      }}
                    >
                      {wallet.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <h2 className="font-semibold">{wallet.name}</h2>
                      <Badge tone="violet">{t(typeLabel[wallet.type], locale)}</Badge>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-(--color-ink-soft)">
                    {t(wallet.summary, locale)}
                  </p>
                </Link>

                <dl className="mt-4 grid gap-1.5 border-t border-(--color-hairline) pt-3 text-xs">
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
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-(--color-ink-dim)">{dict.wallets.chains}</dt>
                    <dd className="text-end">{wallet.chains.slice(0, 3).join(" / ")}</dd>
                  </div>
                </dl>

                <p className="mt-3 text-xs text-(--color-ink-dim)">
                  {tList(wallet.security, locale)[0]}
                </p>
              </GlassCard>
            </li>
          ))}
        </ul>
      </Container>

      <JsonLd
        data={[
          breadcrumbJsonLd(locale, trail),
          itemListJsonLd(
            locale,
            dict.wallets.title,
            wallets.map((wallet) => ({ name: wallet.name, path: `/wallets/${wallet.slug}` })),
          ),
        ]}
      />
    </Section>
  );
}
