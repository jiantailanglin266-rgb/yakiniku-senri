import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { DiagnosisRunner } from "@/cardport/components/diagnosis/DiagnosisRunner";
import { PageShell } from "@/cardport/components/layout/PageShell";
import { JsonLd, Notice, Panel } from "@/cardport/components/ui/primitives";
import { diagnoses, getDiagnosis } from "@/cardport/data/diagnoses";
import { getDictionary } from "@/cardport/i18n";
import { isLocale, locales, type Locale } from "@/cardport/i18n/locales";
import { pick } from "@/cardport/i18n/localized";
import { routes } from "@/cardport/lib/routes";
import { cardportMetadata } from "@/cardport/lib/seo";
import { softwareApplicationJsonLd } from "@/cardport/lib/structured-data";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    diagnoses.map((diagnosis) => ({ locale, slug: diagnosis.slug })),
  );
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) return {};
  const locale = raw as Locale;
  const diagnosis = getDiagnosis(slug);
  if (!diagnosis) return {};
  return cardportMetadata({
    title: pick(diagnosis.title, locale),
    description: pick(diagnosis.lead, locale),
    path: routes.diagnosis(locale, diagnosis.slug),
    locale,
    // 診断結果ごとのOGPは、共有時に上位カードの画像へ差し替えられる設計です（README参照）
    image: "/images/cardport/ogp-diagnosis.png",
  });
}

export default async function DiagnosisPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const diagnosis = getDiagnosis(slug);
  if (!diagnosis) notFound();

  const dictionary = getDictionary(locale);

  return (
    <PageShell
      breadcrumbLabel={dictionary.common.breadcrumb}
      crumbs={[
        { name: dictionary.nav.home, path: routes.home(locale) },
        { name: dictionary.nav.diagnosis, path: routes.diagnosisIndex(locale) },
        { name: pick(diagnosis.title, locale), path: routes.diagnosis(locale, diagnosis.slug) },
      ]}
      eyebrow="AI FINDER"
      title={pick(diagnosis.title, locale)}
      lead={pick(diagnosis.lead, locale)}
      notice={
        <div className="space-y-3">
          <Notice tone="warn">{dictionary.diagnosis.disclaimer}</Notice>
          {locale !== "ja" ? <Notice tone="danger">{dictionary.legal.regionNotice}</Notice> : null}
        </div>
      }
    >
      {/* 共有リンクの回答コードを useSearchParams で読むため、境界が必要です */}
      <Suspense
        fallback={
          <Panel className="p-8 text-center text-[0.85rem]">{dictionary.common.loading}…</Panel>
        }
      >
        <DiagnosisRunner diagnosis={diagnosis} locale={locale} dictionary={dictionary} />
      </Suspense>

      <JsonLd
        data={softwareApplicationJsonLd(
          pick(diagnosis.title, locale),
          pick(diagnosis.lead, locale),
          routes.diagnosis(locale, diagnosis.slug),
          locale,
        )}
      />
    </PageShell>
  );
}
