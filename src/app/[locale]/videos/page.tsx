import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { isLocale, localePath, staticLocales } from "@/portal/i18n/config";
import { getDictionary } from "@/portal/i18n/dictionaries";
import { portalMetadata } from "@/portal/lib/seo";
import { longVideos, shortVideos } from "@/portal/data/videos";
import { formatDate, formatDuration, t } from "@/portal/lib/format";
import { breadcrumbJsonLd, itemListJsonLd } from "@/portal/lib/structured-data";

import { Breadcrumbs, Container, PageHeader, Section } from "@/portal/components/layout/Shell";
import { PageVisual } from "@/portal/components/layout/PageVisual";
import { Badge, GlassCard, NoticeBox, SectionHeading } from "@/portal/components/ui/primitives";
import { JsonLd } from "@/portal/components/ui/JsonLd";
import { MediaSlot } from "@/media/components";
import { mediaSeed, portalPageKey } from "@/portal/lib/media";

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
    path: "/videos",
    title: dict.videos.title,
    description: dict.videos.lead,
  });
}

function VideoCard({
  video,
  locale,
  dict,
}: {
  video: (typeof longVideos)[number];
  locale: string;
  dict: ReturnType<typeof getDictionary>;
}) {
  return (
    <GlassCard as="article" className="h-full overflow-hidden">
      <Link href={localePath(locale, `/videos/${video.slug}`)}>
        {/* サムネイル枠。YouTube のサムネイルは権利者が別にいるため、
            ここでは表示せず、掲載可否を確認できた画像か装飾表現だけを出します */}
        <div className="relative">
          <MediaSlot
            pageKey={portalPageKey("video", video.slug)}
            slot="thumbnail"
            locale={locale}
            theme="video"
            seed={mediaSeed(video.slug)}
            showCaption={false}
            className={video.shorts ? "aspect-9/16 w-full" : "aspect-video w-full"}
            sizes="(min-width: 1024px) 20rem, 45vw"
          />
          <span className="pointer-events-none absolute end-2 bottom-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[0.625rem]">
            {formatDuration(video.durationSec)}
          </span>
        </div>
        <div className="p-4">
          {video.shorts ? <Badge tone="magenta">{dict.videos.shorts}</Badge> : null}
          <h3 className="mt-2 text-sm font-semibold">{t(video.title, locale)}</h3>
          <p className="mt-1.5 line-clamp-2 text-xs text-(--color-ink-soft)">
            {t(video.summary, locale)}
          </p>
          <p className="mt-2 text-[0.6875rem] text-(--color-ink-dim)">
            {video.channel} · {formatDate(video.publishedAt, locale)}
          </p>
        </div>
      </Link>
    </GlassCard>
  );
}

export default async function VideosPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const trail = [{ name: dict.nav.videos, path: "/videos" }];

  return (
    <Section className="pt-28">
      <Container>
        <Breadcrumbs trail={trail} locale={locale} dict={dict} />
        <PageHeader display="YouTube" title={dict.videos.title} lead={dict.videos.lead} />
        <PageVisual name="videos" locale={locale} priority />

        <NoticeBox tone="cyan" className="mb-8">
          {locale === "ja"
            ? "動画IDが未設定のため、現在はプレースホルダを表示しています。各ページの要約・目次・文字起こしは動画を見なくても内容が分かるように用意しています。"
            : "Video IDs are not configured yet, so placeholders are shown. Each page still carries a summary, chapters and transcript so the content stands on its own."}
        </NoticeBox>

        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {longVideos.map((video) => (
            <li key={video.id}>
              <VideoCard video={video} locale={locale} dict={dict} />
            </li>
          ))}
        </ul>

        {shortVideos.length > 0 ? (
          <div className="mt-14">
            <SectionHeading
              eyebrow="Shorts"
              title={dict.videos.shorts}
              lead={
                locale === "ja"
                  ? "ショート動画から来た方向けに、要点と次の一歩をまとめた専用ページを用意しています。"
                  : "Dedicated landing pages summarising the point and the next step for viewers arriving from Shorts."
              }
            />
            <ul className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
              {shortVideos.map((video) => (
                <li key={video.id}>
                  <VideoCard video={video} locale={locale} dict={dict} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Container>

      <JsonLd
        data={[
          breadcrumbJsonLd(locale, trail),
          itemListJsonLd(
            locale,
            dict.videos.title,
            [...longVideos, ...shortVideos].map((video) => ({
              name: t(video.title, locale),
              path: `/videos/${video.slug}`,
            })),
          ),
        ]}
      />
    </Section>
  );
}
