import type { Metadata } from "next";
import { Suspense } from "react";

import { findLocale, getDictionary, localeCodes } from "@/sports/i18n";
import { resolveLocale } from "@/sports/lib/page";
import { sportsMetadata } from "@/sports/lib/seo";
import { searchIndex } from "@/sports/lib/search";

import { SearchPanel } from "@/sports/components/search/SearchPanel";
import { Breadcrumbs, JsonLd, SectionHeading } from "@/sports/components/ui/primitives";
import { breadcrumbJsonLd } from "@/sports/lib/structured-data";

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
    path: "/search",
    title: dict.search,
    description:
      info.code === "ja"
        ? "競技・リーグ・試合・チーム・選手・ニュース・動画・配信サービス・用語を横断検索します。「マンU」のような略称にも対応しています。"
        : "Search across sports, leagues, matches, teams, players, news, videos, services and terms — nicknames included.",
    noindex: true,
  });
}

export default async function SearchPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, dict } = await resolveLocale(params);

  const total = searchIndex(locale).length;
  const trail = [
    { label: "HOME", path: "/" },
    { label: dict.search, path: "/search" },
  ];

  return (
    <>
      <Breadcrumbs locale={locale} trail={trail} />

      <header className="mb-8">
        <p className="sp-eyebrow mb-2">SEARCH</p>
        <h1 className="text-ink text-3xl font-extrabold sm:text-4xl">{dict.search}</h1>
        <p className="sp-mono text-ink-faint mt-3 text-xs">
          {locale === "ja" ? `索引: ${total} 件` : `${total} entries indexed`}
        </p>
      </header>

      <div className="mx-auto max-w-3xl">
        {/* useSearchParams を使うため Suspense で包みます（静的書き出しの要件） */}
        <Suspense
          fallback={<div className="sp-solid text-ink-faint px-4 py-3 text-sm">{dict.loading}</div>}
        >
          <SearchPanel locale={locale} />
        </Suspense>
      </div>

      <section aria-labelledby="se-hint" className="mx-auto mt-12 max-w-3xl">
        <SectionHeading
          id="se-hint"
          eyebrow="TIP"
          title={locale === "ja" ? "表記ゆれについて" : "About name variants"}
        />
        <p className="sp-solid text-ink-soft p-5 text-sm leading-relaxed">
          {locale === "ja"
            ? "チーム名・選手名・リーグ名は、正式名称のほかに愛称・略称・英語表記でも検索できます。たとえば「マンチェスター・ユナイテッド」「マンU」「Man United」「MUFC」はすべて同じチームに辿り着きます。"
            : 'Teams, players and leagues are searchable by nickname, abbreviation and English name. "Manchester United", "Man Utd", "MUFC" and the Japanese spelling all land on the same page.'}
        </p>
      </section>

      <JsonLd data={[breadcrumbJsonLd(locale, trail)]} />
    </>
  );
}
