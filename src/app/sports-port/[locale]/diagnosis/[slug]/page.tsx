import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { findLocale, localeCodes, text } from "@/sports/i18n";
import { resolveLocale } from "@/sports/lib/page";
import { sportsMetadata } from "@/sports/lib/seo";
import { href } from "@/sports/lib/url";
import { diagnoses, getDiagnosis } from "@/sports/data/diagnoses";

import { DiagnosisRunner } from "@/sports/components/diagnosis/DiagnosisRunner";
import { Breadcrumbs, JsonLd, SectionHeading } from "@/sports/components/ui/primitives";
import { breadcrumbJsonLd } from "@/sports/lib/structured-data";

export function generateStaticParams() {
  return localeCodes.flatMap((locale) =>
    diagnoses.map((diagnosis) => ({ locale, slug: diagnosis.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const info = findLocale(locale);
  const diagnosis = getDiagnosis(slug);
  if (!info || !diagnosis) return {};
  return sportsMetadata({
    locale: info.code,
    path: `/diagnosis/${diagnosis.slug}`,
    title: text(diagnosis.title, info.code),
    description: text(diagnosis.lead, info.code),
  });
}

export default async function DiagnosisDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!findLocale(raw)) notFound();
  const diagnosis = getDiagnosis(slug);
  if (!diagnosis) notFound();

  const { locale, dict, t } = await resolveLocale(params);

  const others = diagnoses.filter((item) => item.id !== diagnosis.id).slice(0, 4);
  const trail = [
    { label: "HOME", path: "/" },
    { label: dict.navDiagnosis, path: "/diagnosis" },
    { label: t(diagnosis.title), path: `/diagnosis/${diagnosis.slug}` },
  ];

  return (
    <>
      <Breadcrumbs locale={locale} trail={trail} />

      <header className="mx-auto mb-8 max-w-2xl text-center">
        <p className="sp-eyebrow mb-2">QUIZ</p>
        <h1 className="text-ink text-2xl font-extrabold sm:text-3xl">{t(diagnosis.title)}</h1>
        <p className="text-ink-dim mt-3 text-sm">{t(diagnosis.lead)}</p>
      </header>

      {diagnosis.disclaimer ? (
        <p className="border-caution/40 bg-caution/10 text-caution mx-auto mb-6 max-w-2xl rounded-lg border p-3 text-xs leading-relaxed">
          {t(diagnosis.disclaimer)}
        </p>
      ) : null}

      <div className="mx-auto max-w-2xl">
        <DiagnosisRunner diagnosis={diagnosis} locale={locale} />
      </div>

      <section aria-labelledby="dg-others" className="mx-auto mt-12 max-w-2xl">
        <SectionHeading id="dg-others" eyebrow="MORE" title={dict.sectionDiagnosis} />
        <ul className="space-y-2">
          {others.map((item) => (
            <li key={item.id}>
              <Link
                href={href(locale, `/diagnosis/${item.slug}`)}
                className="sp-solid text-ink-soft hover:border-cyan/50 hover:text-cyan block p-3 text-sm transition-colors"
              >
                {t(item.title)}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <JsonLd data={[breadcrumbJsonLd(locale, trail)]} />
    </>
  );
}
