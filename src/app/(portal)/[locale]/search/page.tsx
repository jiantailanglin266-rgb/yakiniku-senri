import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isLocale, staticLocales } from "@/portal/i18n/config";
import { getDictionary } from "@/portal/i18n/dictionaries";
import { portalMetadata } from "@/portal/lib/seo";

import { Breadcrumbs, Container, PageHeader, Section } from "@/portal/components/layout/Shell";
import { SearchResults } from "@/portal/components/search/SearchResults";

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
    path: "/search",
    title: dict.search.title,
    description: dict.search.hint,
    // 検索結果ページはクエリごとに無限に増えるため、索引に載せません
    noindex: true,
  });
}

export default async function SearchPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return (
    <Section className="pt-28">
      <Container size="text">
        <Breadcrumbs
          trail={[{ name: dict.search.title, path: "/search" }]}
          locale={locale}
          dict={dict}
        />
        <PageHeader eyebrow="Search" title={dict.search.title} />
        {/*
          `useSearchParams` を使う要素は Suspense で包む必要があります。
          静的書き出しではクエリがサーバー側で確定しないため、
          ここまでを静的HTMLにして、検索語の反映だけをクライアントで行います。
        */}
        <Suspense
          fallback={<p className="text-sm text-(--color-ink-dim)">{dict.common.loading}</p>}
        >
          <SearchResults locale={locale} dict={dict} />
        </Suspense>
      </Container>
    </Section>
  );
}
