import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AffiliateCta } from "@/cardport/components/cards/AffiliateCta";
import { PageShell } from "@/cardport/components/layout/PageShell";
import { Badge, Notice, Panel } from "@/cardport/components/ui/primitives";
import { campaigns, isExpired, sortCampaigns } from "@/cardport/data/campaigns";
import { getCardById } from "@/cardport/data/cards";
import { getDictionary } from "@/cardport/i18n";
import { formatDate, formatYen } from "@/cardport/i18n/format";
import { pick, pickList } from "@/cardport/i18n/localized";
import { isLocale, locales, type Locale } from "@/cardport/i18n/locales";
import { routes } from "@/cardport/lib/routes";
import { cardportMetadata } from "@/cardport/lib/seo";

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
    title: dictionary.sections.campaignTicker,
    description: dictionary.legal.verifyNotice,
    path: routes.campaigns(locale),
    locale,
  });
}

export default async function CampaignsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dictionary = getDictionary(locale);
  const list = sortCampaigns(campaigns);

  return (
    <PageShell
      breadcrumbLabel={dictionary.common.breadcrumb}
      crumbs={[
        { name: dictionary.nav.home, path: routes.home(locale) },
        { name: dictionary.nav.campaigns, path: routes.campaigns(locale) },
      ]}
      eyebrow="CAMPAIGNS"
      title={dictionary.sections.campaignTicker}
      lead={
        locale === "ja"
          ? "適用条件・期限・対象者をすべて記載しています。条件を満たさない場合は特典を受け取れません。"
          : "Every offer here lists its conditions, deadline and eligibility. Miss a condition and the reward does not apply."
      }
      notice={<Notice tone="warn">{dictionary.legal.verifyNotice}</Notice>}
    >
      <ul className="grid gap-4 lg:grid-cols-2">
        {list.map((campaign) => {
          const card = getCardById(campaign.cardId);
          const expired = isExpired(campaign);
          return (
            <li key={campaign.id}>
              <Panel as="article" className="h-full p-5">
                <div className="flex flex-wrap items-center gap-2">
                  {expired ? (
                    <Badge accent="magenta">{dictionary.affiliate.expired}</Badge>
                  ) : (
                    <Badge accent="emerald">〜{formatDate(campaign.endsOn, locale)}</Badge>
                  )}
                  {campaign.maxValue > 0 ? (
                    <span className="numeric text-amber text-[0.86rem] font-semibold">
                      {dictionary.card.upTo} {formatYen(campaign.maxValue, locale)}
                    </span>
                  ) : null}
                </div>

                <h2 className="text-ink mt-3 text-[0.98rem] leading-snug font-semibold">
                  {pick(campaign.title, locale)}
                </h2>

                {card ? (
                  <p className="mt-1.5 text-[0.8rem]">
                    <Link
                      href={routes.card(locale, card.slug)}
                      className="text-cyan hover:underline"
                    >
                      {pick(card.name, locale)}
                    </Link>
                  </p>
                ) : null}

                <p className="text-dim mt-3 text-[0.74rem]">
                  {locale === "ja" ? "対象者" : "Eligibility"}: {pick(campaign.target, locale)}
                </p>

                {/* 達成条件は必ず全文表示します（畳むと「無条件」に見えてしまうため） */}
                <div className="border-line/50 mt-3 border-t pt-3">
                  <p className="text-dim mb-2 text-[0.74rem]">
                    {locale === "ja" ? "達成条件" : "Conditions"}
                  </p>
                  <ul className="text-mist space-y-1.5 text-[0.78rem]">
                    {pickList(campaign.conditions, locale).map((line) => (
                      <li key={line} className="flex gap-1.5">
                        <span className="text-dim">・</span>
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>

                {expired ? (
                  <p className="mt-4">
                    <Notice tone="warn">{dictionary.affiliate.expired}</Notice>
                  </p>
                ) : card ? (
                  <div className="mt-4">
                    <AffiliateCta
                      itemId={card.id}
                      officialUrl={campaign.officialUrl}
                      affiliateId={card.affiliateId}
                      placement="campaign"
                      locale={locale}
                      label={dictionary.card.apply}
                      adLabel={dictionary.affiliate.label}
                      adTitle={dictionary.affiliate.disclosure}
                    />
                  </div>
                ) : null}
              </Panel>
            </li>
          );
        })}
      </ul>
    </PageShell>
  );
}
