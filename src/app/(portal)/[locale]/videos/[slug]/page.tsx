import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { isLocale, localePath, staticLocales } from "@/portal/i18n/config";
import { getDictionary } from "@/portal/i18n/dictionaries";
import { portalMetadata } from "@/portal/lib/seo";
import { getVideo, videos } from "@/portal/data/videos";
import { getCoin } from "@/portal/data/coins";
import { getExchange } from "@/portal/data/exchanges";
import { getTool } from "@/portal/data/tools";
import { getLearnArticle } from "@/portal/data/learn";
import { formatDate, formatDuration, t, tList } from "@/portal/lib/format";
import { resolveLink } from "@/portal/lib/affiliate";
import { breadcrumbJsonLd, faqJsonLd, videoJsonLd } from "@/portal/lib/structured-data";

import { Breadcrumbs, Container, PageHeader, Section } from "@/portal/components/layout/Shell";
import { GlassCard, NeonLink, NoticeBox } from "@/portal/components/ui/primitives";
import { OutboundLink } from "@/portal/components/ui/links";
import { FaqList } from "@/portal/components/ui/sections";
import { JsonLd } from "@/portal/components/ui/JsonLd";

export function generateStaticParams() {
  return staticLocales().flatMap((locale) => videos.map((video) => ({ locale, slug: video.slug })));
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const video = getVideo(slug);
  if (!isLocale(locale) || !video) return {};
  return portalMetadata({
    locale,
    path: `/videos/${video.slug}`,
    title: t(video.title, locale),
    description: t(video.summary, locale),
    type: "article",
    publishedTime: video.publishedAt,
  });
}

export default async function VideoDetailPage(props: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await props.params;
  if (!isLocale(locale)) notFound();
  const video = getVideo(slug);
  if (!video) notFound();

  const dict = getDictionary(locale);

  const relatedCoins = video.relatedCoins
    .map((id) => getCoin(id))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  const relatedExchanges = video.relatedExchanges
    .map((id) => getExchange(id))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  const relatedTools = video.relatedTools
    .map((id) => getTool(id))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  const relatedLearn = video.relatedLearn
    .map((id) => getLearnArticle(id))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const trail = [
    { name: dict.nav.videos, path: "/videos" },
    { name: t(video.title, locale), path: `/videos/${video.slug}` },
  ];

  return (
    <Section className="pt-28">
      <Container>
        <Breadcrumbs trail={trail} locale={locale} dict={dict} />
        <PageHeader
          eyebrow={video.shorts ? dict.videos.shorts : "YouTube"}
          title={t(video.title, locale)}
          lead={t(video.summary, locale)}
          meta={
            <p className="text-xs text-(--color-ink-dim)">
              {video.channel} · {formatDate(video.publishedAt, locale)} ·{" "}
              {formatDuration(video.durationSec)}
            </p>
          }
        />

        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="grid gap-8">
            {/* 動画埋め込み。IDが未設定のあいだはプレースホルダを出します */}
            <div
              className={`glass grid place-items-center overflow-hidden rounded-2xl ${video.shorts ? "aspect-9/16 max-w-sm" : "aspect-video"}`}
            >
              {video.youtubeId ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}`}
                  title={t(video.title, locale)}
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  className="size-full"
                />
              ) : (
                <p className="px-6 text-center text-sm text-(--color-ink-dim)">
                  {locale === "ja"
                    ? "動画IDが未設定です。管理画面から設定すると、ここに埋め込みが表示されます。"
                    : "No video ID configured. Set one in the admin and the embed appears here."}
                </p>
              )}
            </div>

            <section>
              <h2 className="mb-3 text-xl font-semibold">{dict.videos.summary}</h2>
              <ul className="grid gap-2 text-sm text-(--color-ink-soft)">
                {tList(video.keyPoints, locale).map((entry) => (
                  <li key={entry} className="flex gap-2">
                    <span aria-hidden="true" className="text-(--color-cyan)">
                      ▸
                    </span>
                    {entry}
                  </li>
                ))}
              </ul>
            </section>

            {video.chapters.length > 0 ? (
              <section>
                <h2 className="mb-3 text-xl font-semibold">{dict.videos.chapters}</h2>
                <ol className="grid gap-1.5 text-sm">
                  {video.chapters.map((chapter) => (
                    <li key={chapter.at} className="flex gap-3">
                      <span className="font-mono text-xs text-(--color-cyan-soft)">
                        {chapter.at}
                      </span>
                      <span className="text-(--color-ink-soft)">{t(chapter.label, locale)}</span>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            <section>
              <h2 className="mb-3 text-xl font-semibold">{dict.videos.transcript}</h2>
              <div className="grid gap-3 text-sm leading-relaxed text-(--color-ink-soft)">
                {tList(video.transcript, locale).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </section>

            {video.faq.length > 0 ? (
              <section>
                <h2 className="mb-3 text-xl font-semibold">{dict.faq.title}</h2>
                <FaqList items={video.faq} locale={locale} />
              </section>
            ) : null}
          </div>

          <aside className="grid gap-6">
            {relatedCoins.length > 0 ? (
              <GlassCard className="p-5" glow={false}>
                <h2 className="mb-3 text-sm font-semibold">{dict.videos.relatedCoins}</h2>
                <ul className="flex flex-wrap gap-2">
                  {relatedCoins.map((coin) => (
                    <li key={coin.id}>
                      <Link
                        href={localePath(locale, `/coins/${coin.slug}`)}
                        className="glass inline-flex rounded-full px-3 py-1.5 text-xs"
                      >
                        {coin.symbol}
                      </Link>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            ) : null}

            {relatedExchanges.length > 0 ? (
              <GlassCard className="edge-flow p-5" glow={false}>
                <h2 className="mb-3 text-sm font-semibold">{dict.nav.exchanges}</h2>
                <ul className="grid gap-2">
                  {relatedExchanges.map((exchange) => {
                    const link = resolveLink(exchange.affiliateId, exchange.officialUrl);
                    return (
                      <li key={exchange.id} className="flex items-center justify-between gap-3">
                        <Link
                          href={localePath(locale, `/exchanges/${exchange.slug}`)}
                          className="text-sm hover:text-white"
                        >
                          {exchange.name}
                        </Link>
                        <OutboundLink
                          link={link}
                          placement="video-detail-sidebar"
                          label={exchange.name}
                          adLabel={dict.common.sponsored}
                          srExternal={dict.a11y.externalLink}
                          className="rounded-full border border-(--color-hairline-strong) px-3 py-1 text-[0.6875rem] whitespace-nowrap"
                        >
                          {dict.exchanges.viewOfficial}
                        </OutboundLink>
                      </li>
                    );
                  })}
                </ul>
                <NeonLink
                  href={localePath(locale, "/diagnosis/exchange")}
                  tone="outline"
                  className="mt-4 w-full"
                >
                  {dict.hero.ctaDiagnosis}
                </NeonLink>
              </GlassCard>
            ) : null}

            {relatedTools.length > 0 ? (
              <GlassCard className="p-5" glow={false}>
                <h2 className="mb-3 text-sm font-semibold">{dict.nav.tools}</h2>
                <ul className="grid gap-2 text-sm">
                  {relatedTools.map((tool) => (
                    <li key={tool.id}>
                      <Link
                        href={localePath(locale, `/tools/${tool.slug}`)}
                        className="text-(--color-cyan-soft) hover:underline"
                      >
                        {tool.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            ) : null}

            {relatedLearn.length > 0 ? (
              <GlassCard className="p-5" glow={false}>
                <h2 className="mb-3 text-sm font-semibold">{dict.learn.nextSteps}</h2>
                <ul className="grid gap-2 text-sm">
                  {relatedLearn.map((article) => (
                    <li key={article.id}>
                      <Link
                        href={localePath(locale, `/learn/${article.slug}`)}
                        className="text-(--color-cyan-soft) hover:underline"
                      >
                        {t(article.title, locale)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            ) : null}

            <NoticeBox tone="amber">{dict.footer.disclaimer}</NoticeBox>
          </aside>
        </div>
      </Container>

      <JsonLd
        data={[
          breadcrumbJsonLd(locale, trail),
          videoJsonLd(locale, video),
          faqJsonLd(locale, video.faq),
        ]}
      />
    </Section>
  );
}
