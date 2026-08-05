import type { Metadata } from "next";
import Link from "next/link";

import { findLocale, getDictionary, localeCodes } from "@/sports/i18n";
import { resolveLocale } from "@/sports/lib/page";
import { sportsMetadata } from "@/sports/lib/seo";
import { href } from "@/sports/lib/url";
import { streamingServices } from "@/sports/data/streaming";
import { faqsFor } from "@/sports/data/content";
import { sports } from "@/sports/data/sports";

import { StreamingTable } from "@/sports/components/streaming/StreamingTable";
import { Breadcrumbs, FaqList, JsonLd, SectionHeading } from "@/sports/components/ui/primitives";
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd } from "@/sports/lib/structured-data";

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
    path: "/streaming",
    title: dict.sectionStreaming,
    description:
      info.code === "ja"
        ? "スポーツ配信サービスを、対象競技・料金・無料期間・同時視聴・日本語実況・海外視聴で横並び比較。各行に情報確認日を明記しています。"
        : "Compare sports streaming services on competitions, price, trial, simultaneous streams and overseas access — each row dated.",
  });
}

export default async function StreamingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, dict, t } = await resolveLocale(params);

  const faqs = faqsFor("streaming");
  const trail = [
    { label: "HOME", path: "/" },
    { label: dict.navStreaming, path: "/streaming" },
  ];

  const bySport = sports
    .map((sport) => ({
      sport,
      services: streamingServices.filter((service) => service.sportIds.includes(sport.id)),
    }))
    .filter((entry) => entry.services.length > 0);

  return (
    <>
      <Breadcrumbs locale={locale} trail={trail} />

      <header className="mb-10">
        <p className="sp-eyebrow mb-2">STREAMING</p>
        <h1 className="text-ink text-3xl font-extrabold sm:text-4xl">{dict.sectionStreaming}</h1>
        <p className="text-ink-dim mt-3 max-w-3xl text-sm leading-relaxed">
          {locale === "ja"
            ? "「どのサービスなら見たい試合を見られるか」を最短で判断できるよう、対象大会・料金・無料期間・解約方法・海外視聴可否を同じ粒度で並べています。"
            : "Laid out so you can answer one question fast: which service actually carries the matches you want."}
        </p>
        <p className="mt-3">
          <Link
            href={href(locale, "/diagnosis/streaming-service")}
            className="text-cyan text-sm hover:underline"
          >
            {dict.ctaFindYourSport} →
          </Link>
        </p>
      </header>

      <section aria-labelledby="st-all" className="mb-12">
        <SectionHeading
          id="st-all"
          eyebrow="COMPARISON"
          title={locale === "ja" ? "全サービス比較表" : "All services"}
        />
        <StreamingTable services={streamingServices} locale={locale} />
      </section>

      <section aria-labelledby="st-sport" className="mb-12">
        <SectionHeading
          id="st-sport"
          eyebrow="BY SPORT"
          title={locale === "ja" ? "競技から選ぶ" : "By sport"}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bySport.map(({ sport, services }) => (
            <div key={sport.id} className="sp-solid p-4">
              <p className="text-ink mb-2 text-sm font-semibold">
                <span aria-hidden="true">{sport.glyph}</span> {t(sport.name)}
              </p>
              <ul className="space-y-1">
                {services.map((service) => (
                  <li key={service.id} className="text-ink-dim text-xs">
                    <a href={`#${service.slug}`} className="hover:text-cyan transition-colors">
                      {service.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="st-notes" className="mb-12">
        <SectionHeading
          id="st-notes"
          eyebrow="BEFORE YOU SUBSCRIBE"
          title={locale === "ja" ? "契約前に確認すること" : "Check before you subscribe"}
        />
        <ol className="sp-solid divide-edge divide-y">
          {(locale === "ja"
            ? [
                "見たい大会が契約期間中も対象に含まれるか（放映権は年度で変わります）",
                "無料期間の条件（自動更新の有無、解約期限）",
                "解約方法（アプリ内課金の場合はストア側の手続きが必要なことがあります）",
                "同時視聴数（家族で使う場合に効いてきます）",
                "海外からの視聴可否（規約で禁止されている場合、回避は推奨しません）",
              ]
            : [
                "Whether your competition stays covered for the whole contract term",
                "The free-trial terms — auto-renewal and the cancellation deadline",
                "How to cancel (in-app purchases often require the store, not the service)",
                "How many simultaneous streams you get",
                "Whether viewing from abroad is permitted — we do not advise circumventing restrictions",
              ]
          ).map((item, index) => (
            <li key={index} className="text-ink-soft flex gap-3 px-4 py-3 text-sm">
              <span className="sp-mono text-cyan shrink-0">{index + 1}</span>
              {item}
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="st-faq">
        <SectionHeading id="st-faq" eyebrow="FAQ" title={dict.sectionFaq} />
        <FaqList items={faqs} locale={locale} t={t} />
      </section>

      <JsonLd
        data={[
          breadcrumbJsonLd(locale, trail),
          itemListJsonLd(
            locale,
            streamingServices.map((service) => ({
              name: service.name,
              path: `/streaming#${service.slug}`,
            })),
          ),
          faqJsonLd(faqs.map((faq) => ({ question: t(faq.question), answer: t(faq.answer) }))),
        ]}
      />
    </>
  );
}
