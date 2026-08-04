import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isLocale, staticLocales } from "@/portal/i18n/config";
import { getDictionary } from "@/portal/i18n/dictionaries";
import { portalMetadata } from "@/portal/lib/seo";
import { groupedNews, NEWS_DATASET_STATUS, trendingNews } from "@/portal/data/news";
import { breadcrumbJsonLd } from "@/portal/lib/structured-data";
import { t } from "@/portal/lib/format";

import {
  AsideCard,
  Breadcrumbs,
  Container,
  PageHeader,
  Section,
  WithSidebar,
} from "@/portal/components/layout/Shell";
import Link from "next/link";
import { localePath } from "@/portal/i18n/config";
import { newsCategories } from "@/portal/data/news";
import { NewsBrowser } from "@/portal/components/news/NewsBrowser";
import { NewsCard } from "@/portal/components/news/NewsCard";
import { NoticeBox, SectionHeading } from "@/portal/components/ui/primitives";
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
    path: "/news",
    title: dict.news.title,
    description: dict.news.lead,
  });
}

export default async function NewsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const groups = groupedNews();
  const trending = trendingNews(5);
  const trail = [{ name: dict.news.title, path: "/news" }];

  return (
    <Section className="pt-28">
      <Container>
        <Breadcrumbs trail={trail} locale={locale} dict={dict} />
        <PageHeader display="News" title={dict.news.title} lead={dict.news.lead} />

        {NEWS_DATASET_STATUS === "sample" ? (
          <NoticeBox tone="cyan" className="mb-6">
            {locale === "ja"
              ? "掲載中のニュースはレイアウト確認用のサンプルです。本番ではRSS / ニュースAPIから取得した記事に差し替わります。取得元・公開日時・一次情報へのリンクは常に表示します。"
              : "The articles below are samples for layout verification. In production they are replaced by RSS and news API results. Outlet, timestamp and a primary-source link are always shown."}
          </NoticeBox>
        ) : null}

        <WithSidebar
          aside={
            <>
              {/* 見本の「トレンドワード」に相当。実データはカテゴリの件数から出します */}
              <AsideCard title={dict.news.trending}>
                <ol className="grid gap-2 text-sm">
                  {trending.slice(0, 5).map((article, index) => (
                    <li key={article.id} className="flex gap-2">
                      <span aria-hidden="true" className="font-mono text-xs text-(--color-violet)">
                        {index + 1}
                      </span>
                      <Link
                        href={localePath(locale, `/news/${article.slug}`)}
                        className="line-clamp-2 text-(--color-ink-soft) transition-colors hover:text-white"
                      >
                        {t(article.title, locale)}
                      </Link>
                    </li>
                  ))}
                </ol>
              </AsideCard>

              <AsideCard title={dict.common.category}>
                <ul className="flex flex-wrap gap-1.5 text-xs">
                  {newsCategories.map((category) => (
                    <li key={category.id}>
                      <Link
                        href={localePath(locale, `/news?category=${category.id}`)}
                        className="glass inline-block rounded-full px-2.5 py-1 text-(--color-ink-soft) transition-colors hover:text-white"
                      >
                        {t(category.label, locale)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </AsideCard>

              {/* 見本の「はじめての方へ」CTA */}
              <AsideCard title={dict.learn.title}>
                <p className="text-sm text-(--color-ink-soft)">{dict.learn.lead}</p>
                <Link
                  href={localePath(locale, "/learn")}
                  className="mt-3 inline-block text-sm text-(--color-cyan-soft) hover:underline"
                >
                  {dict.common.viewAll} →
                </Link>
              </AsideCard>
            </>
          }
        >
          <NewsBrowser groups={groups} locale={locale} dict={dict} />
        </WithSidebar>

        <div className="mt-16">
          <SectionHeading
            eyebrow="Trending"
            title={dict.news.trending}
            lead={dict.news.trendingLead}
          />
          <ol className="grid gap-3 lg:grid-cols-2">
            {trending.map((article, index) => (
              <li key={article.id} className="flex items-start gap-4">
                <span
                  aria-hidden="true"
                  className="mt-1 font-mono text-2xl font-bold text-(--color-violet) opacity-60"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <NewsCard article={article} locale={locale} dict={dict} compact />
                </div>
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-10 text-xs text-(--color-ink-dim)">
          {locale === "ja"
            ? `全 ${groups.length} 件（同じ話題の記事はまとめて1件として数えています）`
            : `${groups.length} stories (articles about the same event are grouped)`}
          {" · "}
          {t({ ja: "RSS", en: "RSS" }, locale)}:{" "}
          <a href="rss.xml" className="text-(--color-cyan-soft) hover:underline">
            /news/rss.xml
          </a>
        </p>
      </Container>

      <JsonLd data={[breadcrumbJsonLd(locale, trail)]} />
    </Section>
  );
}
