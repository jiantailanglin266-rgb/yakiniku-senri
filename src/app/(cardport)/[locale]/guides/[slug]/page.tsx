import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CardTile } from "@/cardport/components/cards/CardTile";
import { PageShell } from "@/cardport/components/layout/PageShell";
import { JsonLd, Notice, Panel } from "@/cardport/components/ui/primitives";
import { getAuthor } from "@/cardport/data/authors";
import { getCardsByIds } from "@/cardport/data/cards";
import { getGuide, guides } from "@/cardport/data/guides";
import { getDictionary } from "@/cardport/i18n";
import { formatDate } from "@/cardport/i18n/format";
import { pick, pickList } from "@/cardport/i18n/localized";
import { getContentLocales, isLocale, type Locale } from "@/cardport/i18n/locales";
import { routes } from "@/cardport/lib/routes";
import { cardportMetadata } from "@/cardport/lib/seo";
import { guideJsonLd, howToJsonLd } from "@/cardport/lib/structured-data";

export function generateStaticParams() {
  return getContentLocales().flatMap((locale) =>
    guides.map((guide) => ({ locale, slug: guide.slug })),
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
  const guide = getGuide(slug);
  if (!guide) return {};
  return cardportMetadata({
    title: pick(guide.title, locale),
    description: pick(guide.lead, locale),
    path: routes.guide(locale, guide.slug),
    locale,
    type: "article",
    modifiedTime: guide.updatedOn,
    localeSet: getContentLocales(),
  });
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const dictionary = getDictionary(locale);
  const author = getAuthor(guide.authorId);
  const relatedCards = getCardsByIds(guide.relatedCardIds);

  return (
    <PageShell
      breadcrumbLabel={dictionary.common.breadcrumb}
      crumbs={[
        { name: dictionary.nav.home, path: routes.home(locale) },
        { name: dictionary.nav.guides, path: routes.guides(locale) },
        { name: pick(guide.title, locale), path: routes.guide(locale, guide.slug) },
      ]}
      eyebrow="GUIDE"
      title={pick(guide.title, locale)}
      lead={pick(guide.lead, locale)}
      meta={
        <p className="flex flex-wrap gap-x-4">
          <span>
            {dictionary.common.updatedAt}: {formatDate(guide.updatedOn, locale)}
          </span>
          {author ? (
            <span>
              {dictionary.common.author}: {pick(author.name, locale)}
            </span>
          ) : null}
          <span>
            {guide.readingMinutes} {dictionary.common.readingTime}
          </span>
        </p>
      }
      notice={<Notice tone="warn">{dictionary.legal.verifyNotice}</Notice>}
    >
      <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
        <article className="max-w-3xl">
          {/* 章立ての目次。長いガイドでも読みたい箇所へ直接飛べます */}
          <Panel className="mb-8 p-4">
            <ol className="space-y-1.5">
              {guide.sections.map((section, index) => (
                <li key={index}>
                  <a
                    href={`#section-${index}`}
                    className="text-mist hover:text-cyan text-[0.8rem] transition-colors"
                  >
                    {index + 1}. {pick(section.heading, locale)}
                  </a>
                </li>
              ))}
            </ol>
          </Panel>

          {guide.sections.map((section, index) => (
            <section key={index} id={`section-${index}`} className="mb-10 scroll-mt-24">
              <h2 className="text-ink mb-4 text-[1.1rem] font-semibold">
                {pick(section.heading, locale)}
              </h2>
              <ul className="space-y-3">
                {pickList(section.body, locale).map((line) => (
                  <li key={line} className="text-mist flex gap-2.5 text-[0.9rem] leading-[1.9]">
                    <span className="text-cyan shrink-0">・</span>
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </article>

        <aside className="space-y-5">
          {relatedCards.length > 0 ? (
            <div>
              <h2 className="text-ink mb-3 text-[0.86rem] font-semibold">
                {dictionary.card.relatedCards}
              </h2>
              <ul className="space-y-3">
                {relatedCards.slice(0, 2).map((card) => (
                  <li key={card.id}>
                    <CardTile card={card} locale={locale} dictionary={dictionary} compact />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>

      <JsonLd data={[guideJsonLd(guide, locale), howToJsonLd(guide, locale)]} />
    </PageShell>
  );
}
