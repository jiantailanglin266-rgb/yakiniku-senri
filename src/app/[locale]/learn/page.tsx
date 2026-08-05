import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { isLocale, localePath, staticLocales } from "@/portal/i18n/config";
import { getDictionary } from "@/portal/i18n/dictionaries";
import { portalMetadata } from "@/portal/lib/seo";
import { learnArticles } from "@/portal/data/learn";
import { t } from "@/portal/lib/format";
import { breadcrumbJsonLd, itemListJsonLd } from "@/portal/lib/structured-data";

import { Breadcrumbs, Container, PageHeader, Section } from "@/portal/components/layout/Shell";
import { Badge, GlassCard } from "@/portal/components/ui/primitives";
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
    path: "/learn",
    title: dict.learn.title,
    description: dict.learn.lead,
  });
}

const levels = ["beginner", "intermediate", "advanced"] as const;

const levelTone = {
  beginner: "emerald",
  intermediate: "cyan",
  advanced: "magenta",
} as const;

export default async function LearnPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const trail = [{ name: dict.nav.learn, path: "/learn" }];

  return (
    <Section className="pt-28">
      <Container>
        <Breadcrumbs trail={trail} locale={locale} dict={dict} />
        <PageHeader display="Learn" title={dict.learn.title} lead={dict.learn.lead} />

        {/* 難易度でまとめます。上から順に読めば積み上がる構成です */}
        {levels.map((level) => {
          const articles = learnArticles.filter((article) => article.level === level);
          if (articles.length === 0) return null;
          return (
            <section key={level} className="mb-12">
              <h2 className="mb-4 flex items-center gap-3 text-lg font-semibold">
                <Badge tone={levelTone[level]}>{dict.learn.levels[level]}</Badge>
                <span className="rule-gradient h-px flex-1" />
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {articles.map((article) => (
                  <li key={article.id}>
                    <GlassCard as="article" className="h-full p-5">
                      <Link href={localePath(locale, `/learn/${article.slug}`)}>
                        <h3 className="font-semibold">{t(article.title, locale)}</h3>
                        <p className="mt-2 line-clamp-3 text-sm text-(--color-ink-soft)">
                          {t(article.conclusion, locale)}
                        </p>
                        <p className="mt-3 text-xs text-(--color-ink-dim)">
                          {article.readingMinutes} {dict.common.minutes}
                        </p>
                      </Link>
                    </GlassCard>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </Container>

      <JsonLd
        data={[
          breadcrumbJsonLd(locale, trail),
          itemListJsonLd(
            locale,
            dict.learn.title,
            learnArticles.map((article) => ({
              name: t(article.title, locale),
              path: `/learn/${article.slug}`,
            })),
          ),
        ]}
      />
    </Section>
  );
}
