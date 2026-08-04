import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageShell } from "@/cardport/components/layout/PageShell";
import { Panel } from "@/cardport/components/ui/primitives";
import { policyPages } from "@/cardport/data/policies";
import { getDictionary } from "@/cardport/i18n";
import { formatDate } from "@/cardport/i18n/format";
import { pick } from "@/cardport/i18n/localized";
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
    title: dictionary.footer.operator,
    description: dictionary.affiliate.disclosureLong,
    path: routes.policies(locale),
    locale,
  });
}

export default async function PoliciesIndexPage({
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
        { name: dictionary.footer.operator, path: routes.policies(locale) },
      ]}
      eyebrow="POLICIES"
      title={dictionary.footer.operator}
      lead={
        locale === "ja"
          ? "運営体制・編集方針・評価基準・広告の扱いを開示しています。"
          : "Who runs this site, how we edit, how we score, and how advertising is handled."
      }
    >
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {policyPages.map((page) => (
          <li key={page.id}>
            <Link href={routes.policy(locale, page.slug)} className="block h-full">
              <Panel className="hover:border-cyan/40 h-full p-4 transition-colors">
                <h2 className="text-ink text-[0.9rem] font-semibold">{pick(page.title, locale)}</h2>
                <p className="text-mist mt-1.5 text-[0.76rem] leading-relaxed">
                  {pick(page.lead, locale)}
                </p>
                <p className="text-dim numeric mt-2 text-[0.68rem]">
                  {dictionary.common.updatedAt}: {formatDate(page.updatedOn, locale)}
                </p>
              </Panel>
            </Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
