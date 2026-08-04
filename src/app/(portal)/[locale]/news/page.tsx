import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isLocale, staticLocales } from "@/portal/i18n/config";
import { getDictionary } from "@/portal/i18n/dictionaries";
import { portalMetadata } from "@/portal/lib/seo";
import { groupedNews, NEWS_DATASET_STATUS, trendingNews } from "@/portal/data/news";
import { breadcrumbJsonLd } from "@/portal/lib/structured-data";
import { t } from "@/portal/lib/format";

import { Breadcrumbs, Container, PageHeader, Section } from "@/portal/components/layout/Shell";
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
        <PageHeader eyebrow="News" title={dict.news.title} lead={dict.news.lead} />

        {NEWS_DATASET_STATUS === "sample" ? (
          <NoticeBox tone="cyan" className="mb-6">
            {locale === "ja"
              ? "掲載中のニュースはレイアウト確認用のサンプルです。本番ではRSS / ニュースAPIから取得した記事に差し替わります。取得元・公開日時・一次情報へのリンクは常に表示します。"
              : "The articles below are samples for layout verification. In production they are replaced by RSS and news API results. Outlet, timestamp and a primary-source link are always shown."}
          </NoticeBox>
        ) : null}

        <NewsBrowser groups={groups} locale={locale} dict={dict} />

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
