/**
 * 動画ページ（YouTubeからの流入受け皿）。
 *
 * ショート動画から来た人は滞在時間が短いため、要点・紹介カード・
 * 比較/診断への導線を、スクロールせずに見える位置へ置いています。
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CardTile } from "@/cardport/components/cards/CardTile";
import { FaqList } from "@/cardport/components/home/sections";
import { PageShell } from "@/cardport/components/layout/PageShell";
import { JsonLd, LinkButton, Notice, Panel } from "@/cardport/components/ui/primitives";
import { channels } from "@/cardport/config/site";
import { getCardsByIds } from "@/cardport/data/cards";
import { getFaqs } from "@/cardport/data/faqs";
import { getNewsByIds } from "@/cardport/data/news";
import { formatDuration, getVideo, videos } from "@/cardport/data/videos";
import { getDictionary } from "@/cardport/i18n";
import { formatDate } from "@/cardport/i18n/format";
import { pick, pickList } from "@/cardport/i18n/localized";
import { getContentLocales, isLocale, type Locale } from "@/cardport/i18n/locales";
import { routes } from "@/cardport/lib/routes";
import { cardportMetadata } from "@/cardport/lib/seo";
import { faqJsonLd, videoJsonLd } from "@/cardport/lib/structured-data";

export function generateStaticParams() {
  return getContentLocales().flatMap((locale) =>
    videos.map((video) => ({ locale, slug: video.slug })),
  );
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) return {};
  const locale = raw as Locale;
  const video = getVideo(slug);
  if (!video) return {};
  return cardportMetadata({
    title: pick(video.title, locale),
    description: pick(video.description, locale),
    path: routes.video(locale, video.slug),
    locale,
    type: "article",
    publishedTime: video.publishedAt,
    localeSet: getContentLocales(),
  });
}

export default async function VideoPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const video = getVideo(slug);
  if (!video) notFound();

  const dictionary = getDictionary(locale);
  const featured = getCardsByIds(video.featuredCardIds);
  const relatedNews = getNewsByIds(video.relatedNewsIds);
  const videoFaqs = getFaqs("card").slice(0, 4);

  return (
    <PageShell
      breadcrumbLabel={dictionary.common.breadcrumb}
      crumbs={[
        { name: dictionary.nav.home, path: routes.home(locale) },
        { name: dictionary.nav.videos, path: routes.videos(locale) },
        { name: pick(video.title, locale), path: routes.video(locale, video.slug) },
      ]}
      eyebrow={video.isShort ? "SHORTS" : "VIDEO"}
      title={pick(video.title, locale)}
      lead={pick(video.description, locale)}
      meta={
        <p className="flex flex-wrap gap-x-4">
          <span>
            {dictionary.common.publishedAt}: {formatDate(video.publishedAt, locale)}
          </span>
          <span className="numeric">{formatDuration(video.durationSeconds)}</span>
        </p>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-8">
          {/* 埋め込み。動画IDが未設定でもレイアウトが崩れないようにします */}
          <Panel className="overflow-hidden">
            {video.youtubeId ? (
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}`}
                  title={pick(video.title, locale)}
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  className="h-full w-full border-0"
                />
              </div>
            ) : (
              <div className="from-cp-violet/35 via-cp-magenta/20 to-cp-navy grid aspect-video place-items-center bg-gradient-to-br">
                <p className="text-cp-mist px-6 text-center text-[0.8rem]">
                  {locale === "ja"
                    ? "動画IDが未設定です。YouTube Data API またはデータの youtubeId を設定すると、ここに埋め込みが表示されます。"
                    : "No video ID is set. Configure the YouTube Data API or the youtubeId field to embed the player here."}
                </p>
              </div>
            )}
          </Panel>

          {/* ショートから来た人向けに、要点を最上部に置きます */}
          <section aria-labelledby="summary">
            <h2 id="summary" className="mb-3 text-[1.05rem] font-semibold">
              {locale === "ja" ? "この動画の要点" : "Key points"}
            </h2>
            <Panel className="p-5">
              <ul className="text-cp-mist space-y-2 text-[0.86rem] leading-relaxed">
                {pickList(video.aiSummary, locale).map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="text-cp-cyan">・</span>
                    {line}
                  </li>
                ))}
              </ul>
            </Panel>
          </section>

          {video.chapters.length > 0 ? (
            <section aria-labelledby="chapters">
              <h2 id="chapters" className="mb-3 text-[1.05rem] font-semibold">
                {locale === "ja" ? "チャプター" : "Chapters"}
              </h2>
              <ol className="space-y-1.5">
                {video.chapters.map((chapter) => (
                  <li
                    key={chapter.at}
                    className="glass flex items-center gap-3 rounded-lg px-3.5 py-2"
                  >
                    <span className="numeric text-cp-cyan shrink-0 text-[0.76rem]">
                      {formatDuration(chapter.at)}
                    </span>
                    <span className="text-cp-mist text-[0.8rem]">
                      {pick(chapter.label, locale)}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          <section aria-labelledby="transcript">
            <h2 id="transcript" className="mb-3 text-[1.05rem] font-semibold">
              {locale === "ja" ? "文字起こし（要点）" : "Transcript highlights"}
            </h2>
            <Panel className="p-5">
              <ul className="text-cp-mist space-y-2 text-[0.84rem] leading-relaxed">
                {pickList(video.transcriptHighlights, locale).map((line) => (
                  <li key={line}>「{line}」</li>
                ))}
              </ul>
            </Panel>
          </section>

          {featured.length > 0 ? (
            <section aria-labelledby="featured">
              <h2 id="featured" className="mb-3 text-[1.05rem] font-semibold">
                {locale === "ja" ? "動画で紹介したカード" : "Cards featured in this video"}
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2">
                {featured.map((card) => (
                  <li key={card.id}>
                    <CardTile
                      card={card}
                      locale={locale}
                      dictionary={dictionary}
                      placement="video"
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="video-faq">
            <h2 id="video-faq" className="mb-3 text-[1.05rem] font-semibold">
              {dictionary.sections.faq}
            </h2>
            <FaqList items={videoFaqs} locale={locale} />
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Panel glow className="p-5">
            <h2 className="text-cp-ink mb-3 text-[0.88rem] font-semibold">
              {locale === "ja" ? "次にすること" : "What to do next"}
            </h2>
            <div className="flex flex-col gap-2">
              <LinkButton href={routes.diagnosis(locale, "card-match")} variant="primary">
                {dictionary.hero.ctaDiagnosis}
              </LinkButton>
              <LinkButton href={routes.compare(locale)} variant="outline">
                {dictionary.sections.comparison}
              </LinkButton>
              <LinkButton href={routes.simulatorIndex(locale)} variant="outline">
                {dictionary.nav.simulators}
              </LinkButton>
              <LinkButton href={routes.campaigns(locale)} variant="ghost">
                {dictionary.hero.ctaCampaign} →
              </LinkButton>
            </div>
            {channels.youtube ? (
              <a
                href={channels.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cp-magenta mt-4 inline-block text-[0.78rem] hover:underline"
              >
                {locale === "ja" ? "チャンネル登録" : "Subscribe on YouTube"} →
              </a>
            ) : null}
          </Panel>

          {relatedNews.length > 0 ? (
            <Panel className="p-4">
              <h2 className="text-cp-ink mb-2 text-[0.84rem] font-semibold">
                {dictionary.nav.news}
              </h2>
              <ul className="space-y-1.5">
                {relatedNews.map((article) => (
                  <li key={article.id}>
                    <Link
                      href={routes.newsArticle(locale, article.slug)}
                      className="text-cp-mist hover:text-cp-cyan text-[0.78rem]"
                    >
                      {pick(article.title, locale)}
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          <Notice tone="warn">{dictionary.legal.verifyNotice}</Notice>
        </aside>
      </div>

      <JsonLd data={[videoJsonLd(video, locale), faqJsonLd(videoFaqs, locale)]} />
    </PageShell>
  );
}
