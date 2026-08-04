import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageShell } from "@/cardport/components/layout/PageShell";
import { Badge, Notice, Panel } from "@/cardport/components/ui/primitives";
import { simulators } from "@/cardport/data/simulators";
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
    title: dictionary.sections.simulator,
    description: dictionary.simulator.disclaimer,
    path: routes.simulatorIndex(locale),
    locale,
  });
}

export default async function SimulatorIndexPage({
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
        { name: dictionary.nav.simulators, path: routes.simulatorIndex(locale) },
      ]}
      eyebrow="SIMULATOR"
      title={dictionary.sections.simulator}
      notice={<Notice tone="warn">{dictionary.simulator.disclaimer}</Notice>}
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {simulators.map((simulator) => (
          <li key={simulator.id}>
            <Link href={routes.simulator(locale, simulator.slug)} className="block h-full">
              <Panel glow className="hover:border-cp-emerald/40 h-full p-5 transition-colors">
                <Badge accent={simulator.accent}>SIM</Badge>
                <h2 className="text-cp-ink mt-3 text-[0.94rem] font-semibold">
                  {pick(simulator.title, locale)}
                </h2>
                <p className="text-cp-mist mt-2 text-[0.79rem] leading-relaxed">
                  {pick(simulator.lead, locale)}
                </p>
                <p className="numeric text-cp-cyan bg-cp-navy/60 border-cp-line mt-3 rounded-lg border px-2.5 py-1.5 text-[0.7rem]">
                  {pick(simulator.method, locale)}
                </p>
              </Panel>
            </Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
