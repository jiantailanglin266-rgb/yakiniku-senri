import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { isLocale, localePath, staticLocales } from "@/portal/i18n/config";
import { getDictionary } from "@/portal/i18n/dictionaries";
import { portalMetadata } from "@/portal/lib/seo";
import { getLegalPage, legalPages } from "@/portal/data/legal";
import { t, tList } from "@/portal/lib/format";
import { breadcrumbJsonLd } from "@/portal/lib/structured-data";

import { Breadcrumbs, Container, PageHeader, Section } from "@/portal/components/layout/Shell";
import { JsonLd } from "@/portal/components/ui/JsonLd";

export function generateStaticParams() {
  return staticLocales().flatMap((locale) =>
    legalPages.map((page) => ({ locale, slug: page.slug })),
  );
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const page = getLegalPage(slug);
  if (!isLocale(locale) || !page) return {};
  return portalMetadata({
    locale,
    path: `/legal/${page.slug}`,
    title: t(page.title, locale),
    description: t(page.lead, locale),
  });
}

export default async function LegalPageView(props: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await props.params;
  if (!isLocale(locale)) notFound();
  const page = getLegalPage(slug);
  if (!page) notFound();

  const dict = getDictionary(locale);
  const trail = [
    { name: dict.legal.title, path: "/legal/about" },
    { name: t(page.title, locale), path: `/legal/${page.slug}` },
  ];

  return (
    <Section className="pt-28">
      <Container size="text">
        <Breadcrumbs trail={trail} locale={locale} dict={dict} />
        <PageHeader title={t(page.title, locale)} lead={t(page.lead, locale)} />

        <div className="grid gap-10">
          {page.sections.map((section) => (
            <section key={section.heading.ja}>
              <h2 className="mb-3 text-xl font-semibold">{t(section.heading, locale)}</h2>
              <div className="grid gap-3 text-(--color-ink-soft)">
                {tList(section.body, locale).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <nav
          aria-label={dict.legal.title}
          className="mt-14 border-t border-(--color-hairline) pt-6"
        >
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {legalPages
              .filter((entry) => entry.slug !== page.slug)
              .map((entry) => (
                <li key={entry.slug}>
                  <Link
                    href={localePath(locale, `/legal/${entry.slug}`)}
                    className="text-(--color-ink-dim) transition-colors hover:text-(--color-ink)"
                  >
                    {t(entry.title, locale)}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>
      </Container>

      <JsonLd data={[breadcrumbJsonLd(locale, trail)]} />
    </Section>
  );
}
