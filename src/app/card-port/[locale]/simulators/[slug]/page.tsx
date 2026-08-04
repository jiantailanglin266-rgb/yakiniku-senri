import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageShell } from "@/cardport/components/layout/PageShell";
import { SimulatorRunner } from "@/cardport/components/simulators/SimulatorRunner";
import { JsonLd, Notice } from "@/cardport/components/ui/primitives";
import { getSimulator, simulators } from "@/cardport/data/simulators";
import { getDictionary } from "@/cardport/i18n";
import { isLocale, locales, type Locale } from "@/cardport/i18n/locales";
import { pick } from "@/cardport/i18n/localized";
import { routes } from "@/cardport/lib/routes";
import { cardportMetadata } from "@/cardport/lib/seo";
import { softwareApplicationJsonLd } from "@/cardport/lib/structured-data";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    simulators.map((simulator) => ({ locale, slug: simulator.slug })),
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
  const simulator = getSimulator(slug);
  if (!simulator) return {};
  return cardportMetadata({
    title: pick(simulator.title, locale),
    description: pick(simulator.lead, locale),
    path: routes.simulator(locale, simulator.slug),
    locale,
  });
}

export default async function SimulatorPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const simulator = getSimulator(slug);
  if (!simulator) notFound();

  const dictionary = getDictionary(locale);

  return (
    <PageShell
      wide
      breadcrumbLabel={dictionary.common.breadcrumb}
      crumbs={[
        { name: dictionary.nav.home, path: routes.home(locale) },
        { name: dictionary.nav.simulators, path: routes.simulatorIndex(locale) },
        { name: pick(simulator.title, locale), path: routes.simulator(locale, simulator.slug) },
      ]}
      eyebrow="SIMULATOR"
      title={pick(simulator.title, locale)}
      lead={pick(simulator.lead, locale)}
      notice={<Notice tone="warn">{dictionary.simulator.disclaimer}</Notice>}
    >
      <SimulatorRunner simulator={simulator} locale={locale} dictionary={dictionary} />

      <JsonLd
        data={softwareApplicationJsonLd(
          pick(simulator.title, locale),
          pick(simulator.lead, locale),
          routes.simulator(locale, simulator.slug),
          locale,
        )}
      />
    </PageShell>
  );
}
