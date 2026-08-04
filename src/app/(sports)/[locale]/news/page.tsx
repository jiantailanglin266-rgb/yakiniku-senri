import type { Metadata } from "next";

import { findLocale, getDictionary, localeCodes, text } from "@/sports/i18n";
import { resolveLocale } from "@/sports/lib/page";
import { sportsMetadata } from "@/sports/lib/seo";
import { news, popularNews } from "@/sports/data/news";
import { authors } from "@/sports/data/news";

import { NewsCard } from "@/sports/components/cards/Cards";
import { Breadcrumbs, JsonLd, SectionHeading } from "@/sports/components/ui/primitives";
import { breadcrumbJsonLd, itemListJsonLd } from "@/sports/lib/structured-data";

export function generateStaticParams() {
  return localeCodes.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const info = findLocale(locale);
  if (!info) return {};
  const dict = getDictionary(info.code);
  return sportsMetadata({
    locale: info.code,
    path: "/news",
    title: dict.sectionNews,
    description:
      info.code === "ja"
        ? "移籍・負傷・記録・戦術分析まで。公式発表・報道・未確認情報を区別し、情報元を必ず明記しています。"
        : "Transfers, injuries, records and tactics — with official, reported and unconfirmed items clearly separated.",
  });
}

export default async function NewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, dict, t } = await resolveLocale(params);

  const sorted = [...news].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const popular = popularNews(5);

  const trail = [
    { label: "HOME", path: "/" },
    { label: dict.navNews, path: "/news" },
  ];

  return (
    <>
      <Breadcrumbs locale={locale} trail={trail} />

      <header className="mb-10">
        <p className="sp-eyebrow mb-2">NEWS</p>
        <h1 className="text-ink text-3xl font-extrabold sm:text-4xl">{dict.sectionNews}</h1>
        <p className="text-ink-dim mt-3 max-w-2xl text-sm">{dict.confidenceNote}</p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
        <div className="grid gap-4 sm:grid-cols-2">
          {sorted.map((article) => (
            <NewsCard key={article.id} article={article} locale={locale} />
          ))}
        </div>

        <aside className="space-y-8">
          <section aria-labelledby="n-popular">
            <SectionHeading id="n-popular" eyebrow="POPULAR" title={dict.sectionPopular} />
            <ol className="space-y-2">
              {popular.map((article, index) => (
                <li key={article.id} className="sp-solid flex items-start gap-3 p-3">
                  <span className="sp-mono text-ink-faint w-5 shrink-0 text-center text-lg font-extrabold">
                    {index + 1}
                  </span>
                  <span className="text-ink-soft min-w-0 text-sm">{t(article.title)}</span>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="n-authors">
            <SectionHeading id="n-authors" eyebrow="TEAM" title={dict.author} />
            <ul className="space-y-2">
              {authors.map((author) => (
                <li key={author.id} className="sp-solid p-4">
                  <p className="text-ink text-sm font-semibold">{t(author.name)}</p>
                  <p className="sp-mono text-cyan mt-0.5 text-[0.625rem]">{t(author.role)}</p>
                  <p className="text-ink-dim mt-2 text-xs leading-relaxed">{t(author.bio)}</p>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <JsonLd
        data={[
          breadcrumbJsonLd(locale, trail),
          itemListJsonLd(
            locale,
            sorted.map((article) => ({
              name: text(article.title, locale),
              path: `/news/${article.slug}`,
            })),
          ),
        ]}
      />
    </>
  );
}
