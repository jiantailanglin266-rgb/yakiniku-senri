import type { Metadata } from "next";
import Link from "next/link";

import { findLocale, getDictionary, localeCodes, text } from "@/sports/i18n";
import { resolveLocale } from "@/sports/lib/page";
import { sportsMetadata } from "@/sports/lib/seo";
import { href } from "@/sports/lib/url";
import { diagnoses } from "@/sports/data/diagnoses";

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
    path: "/diagnosis",
    title: dict.sectionDiagnosis,
    description:
      info.code === "ja"
        ? "あなたに合うスポーツ、配信サービス、推しチーム・選手を診断します。娯楽・情報提供が目的で、結果や成績を保証するものではありません。"
        : "Quizzes for finding your sport, your streaming service and your team. Entertainment and information only.",
  });
}

export default async function DiagnosisIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale, dict, t } = await resolveLocale(params);

  const trail = [
    { label: "HOME", path: "/" },
    { label: dict.navDiagnosis, path: "/diagnosis" },
  ];

  return (
    <>
      <Breadcrumbs locale={locale} trail={trail} />

      <header className="mb-10">
        <p className="sp-eyebrow mb-2">QUIZ</p>
        <h1 className="text-ink text-3xl font-extrabold sm:text-4xl">{dict.sectionDiagnosis}</h1>
        <p className="text-ink-dim mt-3 max-w-2xl text-sm">{dict.diagnosisNote}</p>
      </header>

      <section aria-labelledby="dg-list" className="mb-12">
        <SectionHeading
          id="dg-list"
          eyebrow="ALL"
          title={`${diagnoses.length} ${locale === "ja" ? "種類" : "quizzes"}`}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {diagnoses.map((diagnosis) => (
            <Link
              key={diagnosis.id}
              href={href(locale, `/diagnosis/${diagnosis.slug}`)}
              className="sp-solid sp-tilt flex h-full flex-col p-4"
            >
              <h2 className="text-ink text-sm font-semibold">{t(diagnosis.title)}</h2>
              <p className="text-ink-dim mt-1.5 flex-1 text-xs leading-relaxed">
                {t(diagnosis.lead)}
              </p>
              <p className="sp-mono border-edge mt-3 flex items-center justify-between border-t pt-3 text-[0.625rem]">
                <span className="text-ink-faint">
                  {diagnosis.questions.length} {dict.question}
                </span>
                <span className="text-cyan">{dict.startDiagnosis} →</span>
              </p>
            </Link>
          ))}
        </div>
      </section>

      <JsonLd
        data={[
          breadcrumbJsonLd(locale, trail),
          itemListJsonLd(
            locale,
            diagnoses.map((diagnosis) => ({
              name: text(diagnosis.title, locale),
              path: `/diagnosis/${diagnosis.slug}`,
            })),
          ),
        ]}
      />
    </>
  );
}
