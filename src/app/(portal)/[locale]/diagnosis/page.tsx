import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { isLocale, localePath, staticLocales } from "@/portal/i18n/config";
import { getDictionary } from "@/portal/i18n/dictionaries";
import { portalMetadata } from "@/portal/lib/seo";
import { diagnoses } from "@/portal/data/diagnoses";
import { t } from "@/portal/lib/format";
import { breadcrumbJsonLd, itemListJsonLd } from "@/portal/lib/structured-data";

import { Breadcrumbs, Container, PageHeader, Section } from "@/portal/components/layout/Shell";
import { GlassCard, NoticeBox } from "@/portal/components/ui/primitives";
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
    path: "/diagnosis",
    title: dict.diagnosis.title,
    description: dict.diagnosis.lead,
  });
}

export default async function DiagnosisIndexPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const trail = [{ name: dict.nav.diagnosis, path: "/diagnosis" }];

  return (
    <Section className="pt-28">
      <Container>
        <Breadcrumbs trail={trail} locale={locale} dict={dict} />
        <PageHeader display="Quiz" title={dict.diagnosis.title} lead={dict.diagnosis.lead} />

        <NoticeBox tone="cyan" className="mb-8">
          {dict.diagnosis.disclaimer}
        </NoticeBox>

        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {diagnoses.map((diagnosis) => (
            <li key={diagnosis.id}>
              <GlassCard as="article" className="h-full p-5">
                <Link href={localePath(locale, `/diagnosis/${diagnosis.slug}`)}>
                  <h2 className="font-semibold">{t(diagnosis.title, locale)}</h2>
                  <p className="mt-2 text-sm text-(--color-ink-soft)">
                    {t(diagnosis.lead, locale)}
                  </p>
                  <p className="mt-3 text-xs text-(--color-ink-dim)">
                    {diagnosis.questions.length} {locale === "ja" ? "問" : "questions"}
                  </p>
                  <p className="mt-2 text-xs text-(--color-cyan-soft)">{dict.diagnosis.start} →</p>
                </Link>
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
            dict.diagnosis.title,
            diagnoses.map((diagnosis) => ({
              name: t(diagnosis.title, locale),
              path: `/diagnosis/${diagnosis.slug}`,
            })),
          ),
        ]}
      />
    </Section>
  );
}
