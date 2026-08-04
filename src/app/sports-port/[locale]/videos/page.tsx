import type { Metadata } from "next";
import Link from "next/link";

import { findLocale, getDictionary, localeCodes, text } from "@/sports/i18n";
import { resolveLocale } from "@/sports/lib/page";
import { sportsMetadata } from "@/sports/lib/seo";
import { href } from "@/sports/lib/url";
import { longVideos, shortVideos, videos } from "@/sports/data/videos";
import { faqsFor } from "@/sports/data/content";

import { VideoCard } from "@/sports/components/cards/Cards";
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
    path: "/videos",
    title: dict.sectionVideos,
    description:
      info.code === "ja"
        ? "ハイライト・分析・インタビュー。当サイトは映像の配信や転載を行わず、権利者が公開している動画のみを扱います。"
        : "Highlights, analysis and interviews. We never host or redistribute footage — only rights-holder uploads.",
  });
}

export default async function VideosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, dict, t } = await resolveLocale(params);

  const longForm = longVideos();
  const shorts = shortVideos();
  const faqs = faqsFor("videos");

  const trail = [
    { label: "HOME", path: "/" },
    { label: dict.navVideos, path: "/videos" },
  ];

  const categories = [
    { key: "match-analysis", ja: "試合分析", en: "Match analysis" },
    { key: "player-interview", ja: "選手インタビュー", en: "Player interviews" },
    { key: "highlights", ja: "ハイライト", en: "Highlights" },
  ];

  return (
    <>
      <Breadcrumbs locale={locale} trail={trail} />

      <header className="mb-10">
        <p className="sp-eyebrow mb-2">VIDEOS</p>
        <h1 className="text-ink text-3xl font-extrabold sm:text-4xl">{dict.sectionVideos}</h1>
        <p className="text-ink-dim mt-3 max-w-2xl text-sm">
          {locale === "ja"
            ? "各動画ページでは、要点・チャプター・関連試合・関連ニュース・視聴方法をまとめています。"
            : "Each video page gathers the key points, chapters, related matches, news and how to watch."}
        </p>
      </header>

      <nav aria-label={dict.newsCategory} className="mb-10 flex flex-wrap gap-1.5">
        {categories.map((category) => (
          <span
            key={category.key}
            className="border-edge text-ink-dim rounded-lg border px-3 py-1.5 text-xs"
          >
            {locale === "ja" ? category.ja : category.en}
          </span>
        ))}
        <Link
          href={href(locale, "/videos/shorts")}
          className="border-magenta/50 text-magenta hover:bg-magenta/10 rounded-lg border px-3 py-1.5 text-xs transition-colors"
        >
          {dict.shorts} →
        </Link>
      </nav>

      <section aria-labelledby="v-long" className="mb-12">
        <SectionHeading id="v-long" eyebrow="LONG FORM" title={dict.sectionVideos} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {longForm.map((video) => (
            <VideoCard key={video.id} video={video} locale={locale} />
          ))}
        </div>
      </section>

      <section aria-labelledby="v-shorts" className="mb-12">
        <SectionHeading
          id="v-shorts"
          eyebrow="SHORTS"
          title={dict.shorts}
          action={
            <Link
              href={href(locale, "/videos/shorts")}
              className="text-cyan text-sm hover:underline"
            >
              {dict.seeAll} →
            </Link>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {shorts.map((video) => (
            <VideoCard key={video.id} video={video} locale={locale} />
          ))}
        </div>
      </section>

      <section aria-labelledby="v-faq">
        <SectionHeading id="v-faq" eyebrow="FAQ" title={dict.sectionFaq} />
        <FaqList items={faqs} locale={locale} t={t} />
      </section>

      <JsonLd
        data={[
          breadcrumbJsonLd(locale, trail),
          itemListJsonLd(
            locale,
            videos.map((video) => ({
              name: text(video.title, locale),
              path: `/videos/${video.slug}`,
            })),
          ),
          faqJsonLd(faqs.map((faq) => ({ question: t(faq.question), answer: t(faq.answer) }))),
        ]}
      />
    </>
  );
}
