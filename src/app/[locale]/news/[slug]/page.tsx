import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CardTile } from "@/cardport/components/cards/CardTile";
import { PageShell } from "@/cardport/components/layout/PageShell";
import { Badge, JsonLd, Notice, Panel } from "@/cardport/components/ui/primitives";
import { getAuthor } from "@/cardport/data/authors";
import { getCardsByIds } from "@/cardport/data/cards";
import { getNewsBySlug, groupByStory, news } from "@/cardport/data/news";
import { getDictionary } from "@/cardport/i18n";
import { formatDate } from "@/cardport/i18n/format";
import { pick, pickList } from "@/cardport/i18n/localized";
import { getContentLocales, isLocale, type Locale } from "@/cardport/i18n/locales";
import { routes } from "@/cardport/lib/routes";
import { cardportMetadata } from "@/cardport/lib/seo";
import { newsArticleJsonLd } from "@/cardport/lib/structured-data";
import { WikimediaFigure } from "@/media/components";
import { pageImagesJsonLd } from "@/media/lib/structured-data";
import { pageKey } from "@/media/data/usages";

export function generateStaticParams() {
  return getContentLocales().flatMap((locale) =>
    news.map((article) => ({ locale, slug: article.slug })),
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
  const article = getNewsBySlug(slug);
  if (!article) return {};
  return cardportMetadata({
    title: pick(article.title, locale),
    description: pick(article.summary, locale),
    path: routes.newsArticle(locale, article.slug),
    locale,
    type: "article",
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
    localeSet: getContentLocales(),
  });
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const article = getNewsBySlug(slug);
  if (!article) notFound();

  const dictionary = getDictionary(locale);
  const author = getAuthor(article.authorId);
  const articleImages = pageImagesJsonLd(pageKey("cardport", "news", article.slug), locale);
  const supervisor = article.supervisorId ? getAuthor(article.supervisorId) : undefined;
  const relatedCards = getCardsByIds(article.relatedCardIds);
  const sameStory = article.storyKey
    ? groupByStory(news.filter((entry) => entry.storyKey === article.storyKey))[0]
    : undefined;
  const others = sameStory
    ? [...(sameStory.lead.id === article.id ? [] : [sameStory.lead]), ...sameStory.others].filter(
        (entry) => entry.id !== article.id,
      )
    : [];

  const kindLabel: Record<typeof article.kind, { ja: string; en: string }> = {
    official: { ja: "公式発表", en: "Official" },
    press: { ja: "報道", en: "Press" },
    campaign: { ja: "キャンペーン", en: "Campaign" },
    editorial: { ja: "編集部解説", en: "Editorial" },
    comparison: { ja: "比較記事", en: "Comparison" },
    sponsored: { ja: "広告記事", en: "Sponsored" },
  };

  return (
    <PageShell
      breadcrumbLabel={dictionary.common.breadcrumb}
      crumbs={[
        { name: dictionary.nav.home, path: routes.home(locale) },
        { name: dictionary.nav.news, path: routes.news(locale) },
        { name: pick(article.title, locale), path: routes.newsArticle(locale, article.slug) },
      ]}
      eyebrow={locale === "ja" ? kindLabel[article.kind].ja : kindLabel[article.kind].en}
      title={pick(article.title, locale)}
      lead={pick(article.summary, locale)}
      meta={
        <p className="flex flex-wrap gap-x-4 gap-y-1">
          <span>
            {dictionary.common.publishedAt}: {formatDate(article.publishedAt, locale)}
          </span>
          <span>
            {dictionary.common.updatedAt}: {formatDate(article.updatedAt, locale)}
          </span>
          {author ? (
            <span>
              {dictionary.common.author}: {pick(author.name, locale)}
            </span>
          ) : null}
          {supervisor ? (
            <span>
              {dictionary.common.supervisor}: {pick(supervisor.name, locale)}
            </span>
          ) : null}
          <span>
            {article.readingMinutes} {dictionary.common.readingTime}
          </span>
        </p>
      }
      notice={
        article.kind === "sponsored" ? (
          <Notice tone="warn">{dictionary.affiliate.disclosureLong}</Notice>
        ) : undefined
      }
    >
      <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
        <article className="max-w-3xl">
          {/*
            記事の図版。ライセンス確認済みの画像が無ければ何も描画しません。
            ニュースに関連の薄い写真を添えると、事実の印象を歪めるためです。
          */}
          <WikimediaFigure pageKey={pageKey("cardport", "news", article.slug)} locale={locale} />

          {pickList(article.body, locale).map((paragraph) => (
            <p key={paragraph} className="text-cp-mist mb-5 text-[0.9rem] leading-[1.95]">
              {paragraph}
            </p>
          ))}

          <div className="border-cp-line/50 mt-8 border-t pt-5">
            <p className="text-cp-dim text-[0.76rem]">
              {dictionary.common.source}: {pick(article.sourceName, locale)}
              {article.sourceUrl ? (
                <>
                  {" — "}
                  <a
                    href={article.sourceUrl}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="text-cp-cyan hover:underline"
                  >
                    {dictionary.card.official}
                  </a>
                </>
              ) : null}
            </p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {article.tags.map((tag) => (
                <li key={tag}>
                  <Badge accent="cyan">{tag}</Badge>
                </li>
              ))}
            </ul>
          </div>
        </article>

        <aside className="space-y-5">
          {others.length > 0 ? (
            <Panel className="p-4">
              <h2 className="text-cp-ink mb-2 text-[0.84rem] font-semibold">
                {locale === "ja" ? "同じ発表を扱う記事" : "Other coverage"}
              </h2>
              <ul className="space-y-1.5">
                {others.map((entry) => (
                  <li key={entry.id}>
                    <Link
                      href={routes.newsArticle(locale, entry.slug)}
                      className="text-cp-mist hover:text-cp-cyan text-[0.78rem]"
                    >
                      {pick(entry.title, locale)}
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          {relatedCards.length > 0 ? (
            <div>
              <h2 className="text-cp-ink mb-3 text-[0.84rem] font-semibold">
                {dictionary.card.relatedCards}
              </h2>
              <ul className="space-y-3">
                {relatedCards.slice(0, 2).map((card) => (
                  <li key={card.id}>
                    <CardTile
                      card={card}
                      locale={locale}
                      dictionary={dictionary}
                      placement="news"
                      compact
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>

      <JsonLd data={newsArticleJsonLd(article, locale)} />
      {/* 画面に出している画像がある場合だけ ImageObject を出します */}
      {articleImages ? <JsonLd data={articleImages} /> : null}
    </PageShell>
  );
}
