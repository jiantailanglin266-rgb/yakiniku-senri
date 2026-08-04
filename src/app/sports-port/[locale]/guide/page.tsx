import type { Metadata } from "next";
import Link from "next/link";

import { findLocale, getDictionary, localeCodes } from "@/sports/i18n";
import { resolveLocale } from "@/sports/lib/page";
import { sportsMetadata } from "@/sports/lib/seo";
import { href } from "@/sports/lib/url";
import { sports } from "@/sports/data/sports";
import { glossary, faqsFor } from "@/sports/data/content";

import { Breadcrumbs, FaqList, JsonLd, SectionHeading } from "@/sports/components/ui/primitives";
import { breadcrumbJsonLd, faqJsonLd, howToJsonLd } from "@/sports/lib/structured-data";

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
    path: "/guide",
    title: dict.sectionBeginner,
    description:
      info.code === "ja"
        ? "何から見ればいいか分からない人のための入門ガイド。競技の選び方、ルールの要点、視聴手段、よく出る用語まで。"
        : "A beginner's guide: how to pick a sport, the rules that matter, how to watch, and the vocabulary you'll hear.",
  });
}

export default async function GuidePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, dict, t } = await resolveLocale(params);

  const faqs = faqsFor("guide");
  const trail = [
    { label: "HOME", path: "/" },
    { label: dict.navGuide, path: "/guide" },
  ];

  const steps =
    locale === "ja"
      ? [
          {
            name: "生活時間に合う競技を選ぶ",
            text: "深夜開催が中心の競技は、最初の一歩には向きません。まずは自分が起きている時間に試合がある競技から始めてください。",
          },
          {
            name: "ルールの要点だけ押さえる",
            text: "細則は後からで構いません。得点の仕組みと試合の区切り方だけ分かれば、試合は追えます。",
          },
          {
            name: "視聴手段を決める",
            text: "配信サービス比較で、見たい大会が対象に含まれるか、無料期間があるかを確認します。",
          },
          {
            name: "追いかける対象をひとつ決める",
            text: "チームでも選手でも構いません。ひとつ決めると、順位表とニュースが自分ごとになります。",
          },
        ]
      : [
          {
            name: "Pick a sport that fits your clock",
            text: "Anything that starts at 3am is a hard place to begin. Start with something on while you are awake.",
          },
          {
            name: "Learn only the rules that matter",
            text: "Scoring and how the match is divided is enough to follow a game.",
          },
          {
            name: "Sort out how to watch",
            text: "Check the comparison table for whether your competition is covered and whether there is a trial.",
          },
          {
            name: "Choose one thing to follow",
            text: "A team or a player. Once you have one, the table and the news become personal.",
          },
        ];

  return (
    <>
      <Breadcrumbs locale={locale} trail={trail} />

      <header className="mb-10">
        <p className="sp-eyebrow mb-2">GUIDE</p>
        <h1 className="text-ink text-3xl font-extrabold sm:text-4xl">{dict.sectionBeginner}</h1>
        <p className="text-ink-dim mt-3 max-w-2xl text-sm">
          {locale === "ja"
            ? "「何から見ればいいか」に、順番で答えます。所要4分。"
            : 'An ordered answer to "where do I even start". Four minutes.'}
        </p>
      </header>

      <section aria-labelledby="g-steps" className="mb-12">
        <SectionHeading
          id="g-steps"
          eyebrow="STEPS"
          title={locale === "ja" ? "はじめかた" : "How to start"}
        />
        <ol className="space-y-3">
          {steps.map((step, index) => (
            <li key={step.name} className="sp-solid flex gap-4 p-5">
              <span className="sp-mono text-cyan shrink-0 text-2xl font-extrabold">
                {index + 1}
              </span>
              <span>
                <span className="text-ink block text-sm font-semibold">{step.name}</span>
                <span className="text-ink-dim mt-1 block text-xs leading-relaxed">{step.text}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={href(locale, "/diagnosis/your-sport")}
            className="bg-cyan/15 text-cyan hover:bg-cyan/25 rounded-lg px-4 py-2.5 text-sm transition-colors"
          >
            {dict.ctaFindYourSport}
          </Link>
          <Link
            href={href(locale, "/streaming")}
            className="border-edge text-ink-soft hover:border-cyan/60 hover:text-cyan rounded-lg border px-4 py-2.5 text-sm transition-colors"
          >
            {dict.ctaCompareStreaming}
          </Link>
        </div>
      </section>

      <section aria-labelledby="g-sports" className="mb-12">
        <SectionHeading
          id="g-sports"
          eyebrow="RULES"
          title={locale === "ja" ? "競技のルールを一行で" : "Every sport in one line"}
        />
        <dl className="grid gap-3 sm:grid-cols-2">
          {sports.map((sport) => (
            <div key={sport.id} className="sp-solid p-4">
              <dt className="text-ink text-sm font-semibold">
                <Link
                  href={href(locale, `/sports/${sport.slug}`)}
                  className="hover:text-cyan transition-colors"
                >
                  <span aria-hidden="true">{sport.glyph}</span> {t(sport.name)}
                </Link>
              </dt>
              <dd className="text-ink-dim mt-1 text-xs leading-relaxed">{t(sport.primer)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="g-glossary" className="mb-12">
        <SectionHeading
          id="g-glossary"
          eyebrow="GLOSSARY"
          title={locale === "ja" ? "よく出る用語" : "Words you'll hear"}
        />
        <dl className="sp-solid divide-edge divide-y">
          {glossary.map((term) => (
            <div key={term.id} id={term.id} className="px-4 py-3">
              <dt className="text-ink text-sm font-semibold">{t(term.term)}</dt>
              <dd className="text-ink-dim mt-1 text-xs leading-relaxed">{t(term.description)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="g-faq">
        <SectionHeading id="g-faq" eyebrow="FAQ" title={dict.sectionFaq} />
        <FaqList items={faqs} locale={locale} t={t} />
      </section>

      <JsonLd
        data={[
          breadcrumbJsonLd(locale, trail),
          howToJsonLd(
            locale === "ja" ? "スポーツ観戦のはじめかた" : "How to start watching sport",
            steps,
          ),
          faqJsonLd(faqs.map((faq) => ({ question: t(faq.question), answer: t(faq.answer) }))),
        ]}
      />
    </>
  );
}
