import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageShell } from "@/cardport/components/layout/PageShell";
import { Badge, Notice, Panel } from "@/cardport/components/ui/primitives";
import { diagnoses } from "@/cardport/data/diagnoses";
import { getDictionary } from "@/cardport/i18n";
import { isLocale, locales, type Locale } from "@/cardport/i18n/locales";
import { pick } from "@/cardport/i18n/localized";
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
    title: dictionary.sections.diagnosis,
    description: dictionary.sections.diagnosisLead,
    path: routes.diagnosisIndex(locale),
    locale,
  });
}

export default async function DiagnosisIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dictionary = getDictionary(locale);

  return (
    <PageShell
      breadcrumbLabel={dictionary.common.breadcrumb}
      crumbs={[
        { name: dictionary.nav.home, path: routes.home(locale) },
        { name: dictionary.nav.diagnosis, path: routes.diagnosisIndex(locale) },
      ]}
      eyebrow="AI FINDER"
      title={dictionary.sections.diagnosis}
      lead={dictionary.sections.diagnosisLead}
      notice={<Notice tone="warn">{dictionary.diagnosis.disclaimer}</Notice>}
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {diagnoses.map((diagnosis) => (
          <li key={diagnosis.id}>
            <Link href={routes.diagnosis(locale, diagnosis.slug)} className="block h-full">
              <Panel glow className="hover:border-cp-cyan/40 h-full p-5 transition-colors">
                <Badge accent={diagnosis.accent}>{diagnosis.questions.length} Q</Badge>
                <h2 className="text-cp-ink mt-3 text-[0.96rem] font-semibold">
                  {pick(diagnosis.title, locale)}
                </h2>
                <p className="text-cp-mist mt-2 text-[0.79rem] leading-relaxed">
                  {pick(diagnosis.lead, locale)}
                </p>
                <p className="text-cp-cyan mt-4 text-[0.78rem]">{dictionary.diagnosis.start} →</p>
              </Panel>
            </Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
