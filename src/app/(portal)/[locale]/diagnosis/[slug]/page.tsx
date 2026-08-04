import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isLocale, staticLocales } from "@/portal/i18n/config";
import { getDictionary } from "@/portal/i18n/dictionaries";
import { portalMetadata } from "@/portal/lib/seo";
import { diagnoses, getDiagnosis } from "@/portal/data/diagnoses";
import { exchanges } from "@/portal/data/exchanges";
import { wallets } from "@/portal/data/wallets";
import { tools } from "@/portal/data/tools";
import { learnArticles } from "@/portal/data/learn";
import { t } from "@/portal/lib/format";
import { breadcrumbJsonLd } from "@/portal/lib/structured-data";

import { Breadcrumbs, Container, PageHeader, Section } from "@/portal/components/layout/Shell";
import { DiagnosisRunner } from "@/portal/components/diagnosis/DiagnosisRunner";
import { NoticeBox } from "@/portal/components/ui/primitives";
import { JsonLd } from "@/portal/components/ui/JsonLd";

export function generateStaticParams() {
  return staticLocales().flatMap((locale) =>
    diagnoses.map((diagnosis) => ({ locale, slug: diagnosis.slug })),
  );
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const diagnosis = getDiagnosis(slug);
  if (!isLocale(locale) || !diagnosis) return {};
  return portalMetadata({
    locale,
    path: `/diagnosis/${diagnosis.slug}`,
    title: t(diagnosis.title, locale),
    description: t(diagnosis.lead, locale),
  });
}

export default async function DiagnosisDetailPage(props: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await props.params;
  if (!isLocale(locale)) notFound();
  const diagnosis = getDiagnosis(slug);
  if (!diagnosis) notFound();

  const dict = getDictionary(locale);
  const trail = [
    { name: dict.nav.diagnosis, path: "/diagnosis" },
    { name: t(diagnosis.title, locale), path: `/diagnosis/${diagnosis.slug}` },
  ];

  return (
    <Section className="pt-28">
      <Container size="text">
        <Breadcrumbs trail={trail} locale={locale} dict={dict} />
        <PageHeader
          eyebrow="Quiz"
          title={t(diagnosis.title, locale)}
          lead={t(diagnosis.lead, locale)}
        />

        <NoticeBox tone="cyan" className="mb-8">
          {dict.diagnosis.resultLead}
        </NoticeBox>

        {/* 共有リンク（?a=...）を読むため Suspense で包みます */}
        <Suspense
          fallback={<p className="text-sm text-(--color-ink-dim)">{dict.common.loading}</p>}
        >
          <DiagnosisRunner
            diagnosis={diagnosis}
            locale={locale}
            dict={dict}
            catalog={{ exchanges, wallets, tools, learn: learnArticles }}
          />
        </Suspense>
      </Container>

      <JsonLd data={[breadcrumbJsonLd(locale, trail)]} />
    </Section>
  );
}
