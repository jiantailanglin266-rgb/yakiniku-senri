import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { isLocale, localePath, staticLocales } from "@/portal/i18n/config";
import { getDictionary } from "@/portal/i18n/dictionaries";
import { portalMetadata } from "@/portal/lib/seo";
import { getLearnArticle, learnArticles } from "@/portal/data/learn";
import { getAuthor } from "@/portal/data/authors";
import { getCoin } from "@/portal/data/coins";
import { formatDate, t, tList } from "@/portal/lib/format";
import { breadcrumbJsonLd, faqJsonLd, learnArticleJsonLd } from "@/portal/lib/structured-data";
import { EXTERNAL_REL } from "@/portal/lib/affiliate";

import { Breadcrumbs, Container, Section } from "@/portal/components/layout/Shell";
import { Badge, GlassCard, NeonLink, NoticeBox } from "@/portal/components/ui/primitives";
import { FaqList } from "@/portal/components/ui/sections";
import { JsonLd } from "@/portal/components/ui/JsonLd";

export function generateStaticParams() {
  return staticLocales().flatMap((locale) =>
    learnArticles.map((article) => ({ locale, slug: article.slug })),
  );
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const article = getLearnArticle(slug);
  if (!isLocale(locale) || !article) return {};
  return portalMetadata({
    locale,
    path: `/learn/${article.slug}`,
    title: t(article.title, locale),
    description: t(article.conclusion, locale),
    type: "article",
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
  });
}

const levelTone = { beginner: "emerald", intermediate: "cyan", advanced: "magenta" } as const;

export default async function LearnDetailPage(props: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await props.params;
  if (!isLocale(locale)) notFound();
  const article = getLearnArticle(slug);
  if (!article) notFound();

  const dict = getDictionary(locale);
  const author = getAuthor(article.authorId);
  const next = article.next
    .map((id) => getLearnArticle(id))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  const relatedCoins = article.relatedCoins
    .map((id) => getCoin(id))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const trail = [
    { name: dict.nav.learn, path: "/learn" },
    { name: t(article.title, locale), path: `/learn/${article.slug}` },
  ];

  return (
    <Section className="pt-28">
      <Container size="text">
        <Breadcrumbs trail={trail} locale={locale} dict={dict} />

        {/*
          構成は「結論 → 要点 → 定義 → 本文 → 注意点 → FAQ → 関連」で固定しています。
          冒頭で結論が読めると、検索エンジンにも生成AIにも要旨が伝わります。
        */}
        <article>
          <header className="mb-8">
            <Badge tone={levelTone[article.level]}>{dict.learn.levels[article.level]}</Badge>
            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
              <span className="text-gradient">{t(article.title, locale)}</span>
            </h1>
            <dl className="mt-5 flex flex-wrap gap-x-5 gap-y-1 border-y border-(--color-hairline) py-3 text-xs text-(--color-ink-dim)">
              {author ? (
                <div className="flex gap-2">
                  <dt>{dict.common.author}</dt>
                  <dd>{t(author.name, locale)}</dd>
                </div>
              ) : null}
              <div className="flex gap-2">
                <dt>{dict.common.publishedAt}</dt>
                <dd>
                  <time dateTime={article.publishedAt}>
                    {formatDate(article.publishedAt, locale)}
                  </time>
                </dd>
              </div>
              <div className="flex gap-2">
                <dt>{dict.common.modifiedAt}</dt>
                <dd>
                  <time dateTime={article.updatedAt}>{formatDate(article.updatedAt, locale)}</time>
                </dd>
              </div>
              <div className="flex gap-2">
                <dt>{dict.common.readingTime}</dt>
                <dd>
                  {article.readingMinutes} {dict.common.minutes}
                </dd>
              </div>
            </dl>
          </header>

          <GlassCard className="mb-8 p-5" glow={false}>
            <h2 className="mb-2 text-sm font-semibold text-(--color-cyan-soft)">
              {dict.learn.conclusion}
            </h2>
            <p className="text-(--color-ink)">{t(article.conclusion, locale)}</p>
          </GlassCard>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-semibold">{dict.learn.keyPoints}</h2>
            <ul className="grid gap-2 text-sm text-(--color-ink-soft)">
              {tList(article.keyPoints, locale).map((point) => (
                <li key={point} className="flex gap-2">
                  <span aria-hidden="true" className="text-(--color-cyan)">
                    ▸
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-semibold">{dict.learn.definition}</h2>
            <p className="text-(--color-ink-soft)">{t(article.definition, locale)}</p>
          </section>

          <section className="mb-8 grid gap-4 leading-relaxed text-(--color-ink-soft)">
            {tList(article.body, locale).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-xl font-semibold">{dict.learn.caution}</h2>
            <NoticeBox tone="amber">
              <ul className="grid gap-1.5">
                {tList(article.cautions, locale).map((caution) => (
                  <li key={caution}>· {caution}</li>
                ))}
              </ul>
            </NoticeBox>
          </section>

          {article.faq.length > 0 ? (
            <section className="mb-8">
              <h2 className="mb-3 text-xl font-semibold">{dict.faq.title}</h2>
              <FaqList items={article.faq} locale={locale} />
            </section>
          ) : null}

          {article.sources.length > 0 ? (
            <section className="mb-8">
              <h2 className="mb-3 text-sm font-semibold">{dict.common.source}</h2>
              <ul className="grid gap-1.5 text-sm">
                {article.sources.map((source) => (
                  <li key={source.url}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel={EXTERNAL_REL}
                      className="text-(--color-cyan-soft) underline-offset-2 hover:underline"
                    >
                      {source.label}
                      <span className="sr-only"> {dict.a11y.externalLink}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </article>

        {relatedCoins.length > 0 ? (
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">{dict.videos.relatedCoins}</h2>
            <ul className="flex flex-wrap gap-2">
              {relatedCoins.map((coin) => (
                <li key={coin.id}>
                  <Link
                    href={localePath(locale, `/coins/${coin.slug}`)}
                    className="glass edge-glow inline-flex rounded-full px-3.5 py-1.5 text-xs"
                  >
                    {t(coin.name, locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {next.length > 0 ? (
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">{dict.learn.nextSteps}</h2>
            <ul className="grid gap-2">
              {next.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={localePath(locale, `/learn/${entry.slug}`)}
                    className="glass block rounded-xl px-4 py-3 text-sm transition-colors hover:text-white"
                  >
                    {t(entry.title, locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <GlassCard className="p-5" glow={false}>
          <h2 className="text-base font-semibold">{dict.diagnosis.title}</h2>
          <p className="mt-2 text-sm text-(--color-ink-soft)">{dict.diagnosis.lead}</p>
          <NeonLink href={localePath(locale, "/diagnosis")} className="mt-4">
            {dict.diagnosis.start}
          </NeonLink>
        </GlassCard>
      </Container>

      <JsonLd
        data={[
          breadcrumbJsonLd(locale, trail),
          learnArticleJsonLd(locale, article, author ? t(author.name, locale) : "Editorial"),
          faqJsonLd(locale, article.faq),
        ]}
      />
    </Section>
  );
}
