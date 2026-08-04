import type { Metadata } from "next";

import { findLocale, getDictionary, localeCodes } from "@/sports/i18n";
import { resolveLocale } from "@/sports/lib/page";
import { sportsMetadata } from "@/sports/lib/seo";
import { faqs } from "@/sports/data/content";

import { Breadcrumbs, FaqList, JsonLd, SectionHeading } from "@/sports/components/ui/primitives";
import { breadcrumbJsonLd, faqJsonLd } from "@/sports/lib/structured-data";

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
    path: "/faq",
    title: dict.sectionFaq,
    description:
      info.code === "ja"
        ? "更新頻度、タイムゾーン、データの出所、広告表記、権利の扱いなど、よくいただく質問にまとめてお答えします。"
        : "Refresh rates, time zones, data provenance, ad labelling and rights — the questions we get most.",
  });
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, dict, t } = await resolveLocale(params);

  const trail = [
    { label: "HOME", path: "/" },
    { label: dict.sectionFaq, path: "/faq" },
  ];

  return (
    <>
      <Breadcrumbs locale={locale} trail={trail} />

      <header className="mb-10">
        <p className="sp-eyebrow mb-2">FAQ</p>
        <h1 className="text-ink text-3xl font-extrabold sm:text-4xl">{dict.sectionFaq}</h1>
      </header>

      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow="ALL"
          title={`${faqs.length} ${locale === "ja" ? "件" : "questions"}`}
        />
        <FaqList items={faqs} locale={locale} t={t} />
      </div>

      <JsonLd
        data={[
          breadcrumbJsonLd(locale, trail),
          faqJsonLd(faqs.map((faq) => ({ question: t(faq.question), answer: t(faq.answer) }))),
        ]}
      />
    </>
  );
}
