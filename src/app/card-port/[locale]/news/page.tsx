import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NewsCard } from "@/cardport/components/home/sections";
import { PageShell } from "@/cardport/components/layout/PageShell";
import { Notice, Panel } from "@/cardport/components/ui/primitives";
import { getNews, groupByStory } from "@/cardport/data/news";
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
    title: dictionary.nav.news,
    description: dictionary.sections.cardNews,
    path: routes.news(locale),
    locale,
  });
}

export default async function NewsIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dictionary = getDictionary(locale);

  // 同じ発表を扱う記事はまとめ、代表記事だけを一覧に出します
  const stories = groupByStory(getNews());

  return (
    <PageShell
      breadcrumbLabel={dictionary.common.breadcrumb}
      crumbs={[
        { name: dictionary.nav.home, path: routes.home(locale) },
        { name: dictionary.nav.news, path: routes.news(locale) },
      ]}
      eyebrow="NEWS"
      title={dictionary.nav.news}
      lead={
        locale === "ja"
          ? "公式発表・報道・キャンペーン・編集部解説・比較記事・広告記事を区別して掲載しています。"
          : "We label every item as official, press, campaign, editorial, comparison or sponsored."
      }
      notice={<Notice tone="warn">{dictionary.legal.verifyNotice}</Notice>}
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stories.map(({ lead, others }) => (
          <li key={lead.id} className="flex flex-col gap-2">
            <NewsCard article={lead} locale={locale} dictionary={dictionary} />
            {others.length > 0 ? (
              <Panel className="p-3">
                <p className="text-cp-dim mb-1.5 text-[0.68rem]">
                  {locale === "ja"
                    ? "同じ発表を扱う記事"
                    : "Other coverage of the same announcement"}
                </p>
                <ul className="space-y-1">
                  {others.map((article) => (
                    <li key={article.id}>
                      <Link
                        href={routes.newsArticle(locale, article.slug)}
                        className="text-cp-mist hover:text-cp-cyan text-[0.74rem]"
                      >
                        {pick(article.title, locale)}
                      </Link>
                      <span className="text-cp-dim numeric ms-2 text-[0.66rem]">
                        {formatDate(article.publishedAt, locale)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            ) : null}
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
