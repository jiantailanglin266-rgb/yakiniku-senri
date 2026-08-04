import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isLocale, staticLocales } from "@/portal/i18n/config";
import { getDictionary } from "@/portal/i18n/dictionaries";
import { portalMetadata } from "@/portal/lib/seo";
import { activeCampaigns } from "@/portal/data/site-content";
import { t, tList } from "@/portal/lib/format";
import { breadcrumbJsonLd } from "@/portal/lib/structured-data";

import { Breadcrumbs, Container, PageHeader, Section } from "@/portal/components/layout/Shell";
import { PageVisual } from "@/portal/components/layout/PageVisual";
import { EmptyState, GlassCard, NoticeBox } from "@/portal/components/ui/primitives";
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
    path: "/campaigns",
    title: dict.campaigns.title,
    description: dict.campaigns.lead,
  });
}

export default async function CampaignsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const campaigns = activeCampaigns();
  const trail = [{ name: dict.campaigns.title, path: "/campaigns" }];

  return (
    <Section className="pt-28">
      <Container>
        <Breadcrumbs trail={trail} locale={locale} dict={dict} />
        <PageHeader display="Campaigns" title={dict.campaigns.title} lead={dict.campaigns.lead} />
        <PageVisual name="campaigns" locale={locale} priority />

        {/*
          終了済み・存在しない特典を載せると景品表示法上の問題になります。
          条件を確認できたものだけを掲載し、確認できないあいだは空のままにします。
        */}
        <NoticeBox tone="amber" className="mb-8">
          {locale === "ja"
            ? "掲載できるのは、開催期間と条件を確認できたキャンペーンのみです。確認が取れるまでは何も掲載しません。"
            : "We only list campaigns whose period and terms we have verified. Until then, nothing is listed."}
        </NoticeBox>

        {campaigns.length === 0 ? (
          <EmptyState message={dict.campaigns.empty} />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {campaigns.map((campaign) => (
              <li key={campaign.id}>
                <GlassCard as="article" className="p-5">
                  <h2 className="font-semibold">{t(campaign.title, locale)}</h2>
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

      <JsonLd data={[breadcrumbJsonLd(locale, trail)]} />
    </Section>
  );
}
