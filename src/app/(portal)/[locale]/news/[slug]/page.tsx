import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { isLocale, localePath, staticLocales } from "@/portal/i18n/config";
import { getDictionary } from "@/portal/i18n/dictionaries";
import { portalMetadata } from "@/portal/lib/seo";
import {
  getNewsArticle,
  news,
  newsCategories,
  relatedByStory,
  sortedNews,
} from "@/portal/data/news";
import { getAuthor } from "@/portal/data/authors";
import { getCoin } from "@/portal/data/coins";
import { formatDateTime, t, tList } from "@/portal/lib/format";
import { breadcrumbJsonLd, newsArticleJsonLd } from "@/portal/lib/structured-data";
import { EXTERNAL_REL } from "@/portal/lib/affiliate";

import { Breadcrumbs, Container, Section } from "@/portal/components/layout/Shell";
import { NewsCard, NewsLabels } from "@/portal/components/news/NewsCard";
import { Badge, GlassCard, NeonLink, NoticeBox } from "@/portal/components/ui/primitives";
import { JsonLd } from "@/portal/components/ui/JsonLd";

export function generateStaticParams() {
  return staticLocales().flatMap((locale) =>
    news.map((article) => ({ locale, slug: article.slug })),
  );
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const article = getNewsArticle(slug);
  if (!isLocale(locale) || !article) return {};

  return portalMetadata({
    locale,
    path: `/news/${article.slug}`,
    title: t(article.title, locale),
    description: t(article.summary, locale),
    type: "article",
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
  });
}

export default async function NewsDetailPage(props: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await props.params;
  if (!isLocale(locale)) notFound();
  const article = getNewsArticle(slug);
  if (!article) notFound();

  const dict = getDictionary(locale);
  const author = getAuthor(article.authorId);
  const category = newsCategories.find((entry) => entry.id === article.category);
  const sameStory = relatedByStory(article);
  const related = sortedNews()
    .filter((entry) => entry.id !== article.id && entry.category === article.category)
    .slice(0, 3);

  const trail = [
    { name: dict.news.title, path: "/news" },
    { name: t(article.title, locale), path: `/news/${article.slug}` },
  ];

  return (
    <Section className="pt-28">
      <Container size="text">
        <Breadcrumbs trail={trail} locale={locale} dict={dict} />

        <article>
          <header className="mb-8">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {category ? <Badge tone="cyan">{t(category.label, locale)}</Badge> : null}
              <NewsLabels labels={article.labels} dict={dict} />
            </div>

            <h1 className="text-2xl leading-snug font-semibold sm:text-3xl lg:text-4xl">
              {t(article.title, locale)}
            </h1>

            <p className="mt-4 text-(--color-ink-soft)">{t(article.summary, locale)}</p>

            {/* 情報元・公開日時・執筆者は必ず出します */}
            <dl className="mt-6 grid gap-1.5 border-y border-(--color-hairline) py-4 text-xs text-(--color-ink-dim) sm:grid-cols-2">
              <div className="flex gap-2">
                <dt>{dict.common.source}</dt>
                <dd>{article.outlet}</dd>
              </div>
              <div className="flex gap-2">
                <dt>{dict.common.publishedAt}</dt>
                <dd>
                  <time dateTime={article.publishedAt}>
                    {formatDateTime(article.publishedAt, locale)}
                  </time>
                </dd>
              </div>
              {article.updatedAt ? (
                <div className="flex gap-2">
                  <dt>{dict.common.modifiedAt}</dt>
                  <dd>
                    <time dateTime={article.updatedAt}>
                      {formatDateTime(article.updatedAt, locale)}
                    </time>
                  </dd>
                </div>
              ) : null}
              {article.checkedAt ? (
                <div className="flex gap-2">
                  <dt>{dict.common.checkedAt}</dt>
                  <dd>
                    <time dateTime={article.checkedAt}>
                      {formatDateTime(article.checkedAt, locale)}
                    </time>
                  </dd>
                </div>
              ) : null}
              {author ? (
                <div className="flex gap-2">
                  <dt>{dict.common.author}</dt>
                  <dd>{t(author.name, locale)}</dd>
                </div>
              ) : null}
              <div className="flex gap-2">
                <dt>{dict.common.readingTime}</dt>
                <dd>
                  {article.readingMinutes} {dict.common.minutes}
                </dd>
              </div>
            </dl>
          </header>

          <div className="grid gap-4 leading-relaxed text-(--color-ink-soft)">
            {tList(article.body, locale).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {article.sourceUrl ? (
            <p className="mt-6 text-sm">
              <a
                href={article.sourceUrl}
                target="_blank"
                rel={EXTERNAL_REL}
                className="text-(--color-cyan-soft) underline-offset-2 hover:underline"
              >
                {dict.common.source}
                <span className="sr-only"> {dict.a11y.externalLink}</span>
              </a>
            </p>
          ) : null}

          {article.tags.length > 0 ? (
            <ul className="mt-6 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <li key={tag}>
                  <Badge>#{tag}</Badge>
                </li>
              ))}
            </ul>
          ) : null}
        </article>

        {article.relatedCoins.length > 0 ? (
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-semibold">{dict.videos.relatedCoins}</h2>
            <ul className="flex flex-wrap gap-2">
              {article.relatedCoins.map((coinId) => {
                const coin = getCoin(coinId);
                if (!coin) return null;
                return (
                  <li key={coinId}>
                    <Link
                      href={localePath(locale, `/coins/${coin.slug}`)}
                      className="glass edge-glow inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs"
                    >
                      <span
                        aria-hidden="true"
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: coin.color }}
                      />
                      {t(coin.name, locale)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {sameStory.length > 0 ? (
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-semibold">{dict.news.similar}</h2>
            <ul className="grid gap-3">
              {sameStory.map((entry) => (
                <li key={entry.id}>
                  <NewsCard article={entry} locale={locale} dict={dict} compact />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {related.length > 0 ? (
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-semibold">{dict.news.related}</h2>
            <ul className="grid gap-3">
              {related.map((entry) => (
                <li key={entry.id}>
                  <NewsCard article={entry} locale={locale} dict={dict} compact />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <GlassCard className="mt-12 p-5" glow={false}>
          <h2 className="text-base font-semibold">{dict.hero.ctaDiagnosis}</h2>
          <p className="mt-2 text-sm text-(--color-ink-soft)">{dict.diagnosis.lead}</p>
          <NeonLink href={localePath(locale, "/diagnosis/exchange")} className="mt-4">
            {dict.diagnosis.start}
          </NeonLink>
        </GlassCard>

        <NoticeBox tone="amber" className="mt-6" title={dict.footer.disclaimerTitle}>
          {dict.footer.disclaimer}
        </NoticeBox>
      </Container>

      <JsonLd
        data={[
          breadcrumbJsonLd(locale, trail),
          newsArticleJsonLd(locale, article, author ? t(author.name, locale) : "Editorial"),
        ]}
      />
    </Section>
  );
}
