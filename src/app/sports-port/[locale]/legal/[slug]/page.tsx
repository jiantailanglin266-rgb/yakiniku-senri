import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { findLocale, localeCodes, text } from "@/sports/i18n";
import { resolveLocale } from "@/sports/lib/page";
import { sportsMetadata } from "@/sports/lib/seo";
import { href } from "@/sports/lib/url";
import { legalPages, getLegalPage } from "@/sports/data/legal";

import { Breadcrumbs, JsonLd, SectionHeading } from "@/sports/components/ui/primitives";
import { breadcrumbJsonLd } from "@/sports/lib/structured-data";

export function generateStaticParams() {
  return localeCodes.flatMap((locale) => legalPages.map((page) => ({ locale, slug: page.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const info = findLocale(locale);
  const page = getLegalPage(slug);
  if (!info || !page) return {};
  return sportsMetadata({
    locale: info.code,
    path: `/legal/${page.slug}`,
    title: text(page.title, info.code),
    description: text(page.lead, info.code),
  });
}

export default async function LegalPageView({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!findLocale(raw)) notFound();
  const page = getLegalPage(slug);
  if (!page) notFound();

  const { locale, dict, t } = await resolveLocale(params);

  const trail = [
    { label: "HOME", path: "/" },
    { label: t(page.title), path: `/legal/${page.slug}` },
  ];

  return (
    <>
      <Breadcrumbs locale={locale} trail={trail} />

      <article className="mx-auto max-w-3xl">
        <header className="mb-10">
          <p className="sp-eyebrow mb-2">POLICY</p>
          <h1 className="text-ink text-3xl font-extrabold sm:text-4xl">{t(page.title)}</h1>
          <p className="text-ink-dim mt-3 text-sm">{t(page.lead)}</p>
          <p className="sp-mono text-ink-faint mt-3 text-[0.6875rem]">
            {dict.lastUpdated}: {page.updatedAt}
          </p>
        </header>

        <div className="space-y-8">
          {page.sections.map((section, index) => (
            <section key={index}>
              <h2 className="text-ink mb-3 text-lg font-bold">{t(section.heading)}</h2>
              {section.paragraphs.map((paragraph, pIndex) => (
                <p key={pIndex} className="text-ink-soft mb-3 text-sm leading-relaxed">
                  {t(paragraph)}
                </p>
              ))}
              {section.bullets?.length ? (
                <ul className="space-y-1.5">
                  {section.bullets.map((bullet, bIndex) => (
                    <li key={bIndex} className="text-ink-soft flex gap-2 text-sm">
                      <span className="text-cyan" aria-hidden="true">
                        ▍
                      </span>
                      {t(bullet)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </article>

      <section aria-labelledby="lp-others" className="mx-auto mt-12 max-w-3xl">
        <SectionHeading
          id="lp-others"
          eyebrow="POLICIES"
          title={locale === "ja" ? "その他の方針" : "Other policies"}
        />
        <ul className="flex flex-wrap gap-1.5">
          {legalPages
            .filter((item) => item.slug !== page.slug)
            .map((item) => (
              <li key={item.slug}>
                <Link
                  href={href(locale, `/legal/${item.slug}`)}
                  className="border-edge text-ink-soft hover:border-cyan/60 hover:text-cyan inline-block rounded-lg border px-3 py-1.5 text-xs transition-colors"
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
