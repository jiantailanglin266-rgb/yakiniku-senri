import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { VideoGrid } from "@/cardport/components/home/sections";
import { PageShell } from "@/cardport/components/layout/PageShell";
import { Notice, SectionHeading } from "@/cardport/components/ui/primitives";
import { youtubeChannelId } from "@/cardport/config/site";
import { getVideos } from "@/cardport/data/videos";
import { getDictionary } from "@/cardport/i18n";
import { isLocale, locales, type Locale } from "@/cardport/i18n/locales";
import { routes } from "@/cardport/lib/routes";
import { cardportMetadata } from "@/cardport/lib/seo";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const locale = raw as Locale;
  const dictionary = getDictionary(locale);
  return cardportMetadata({
    title: dictionary.sections.videos,
    description: dictionary.hero.subtitle,
    path: routes.videos(locale),
    locale,
  });
}

export default async function VideosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dictionary = getDictionary(locale);

  return (
    <PageShell
      breadcrumbLabel={dictionary.common.breadcrumb}
      crumbs={[
        { name: dictionary.nav.home, path: routes.home(locale) },
        { name: dictionary.nav.videos, path: routes.videos(locale) },
      ]}
      eyebrow="VIDEO"
      title={dictionary.sections.videos}
      notice={
        !youtubeChannelId ? (
          <Notice>
            {locale === "ja"
              ? "YouTube Data API のチャンネルIDが未設定のため、モックデータを表示しています（NEXT_PUBLIC_YOUTUBE_CHANNEL_ID）。"
              : "No YouTube channel ID is configured, so mock data is shown (NEXT_PUBLIC_YOUTUBE_CHANNEL_ID)."}
          </Notice>
        ) : undefined
      }
    >
      <SectionHeading eyebrow="LONG FORM" title={dictionary.sections.videos} accent="magenta" />
      <VideoGrid videos={getVideos({ shorts: false })} locale={locale} />

      <div className="mt-14">
        <SectionHeading eyebrow="SHORTS" title="YouTube Shorts" accent="violet" />
        <VideoGrid videos={getVideos({ shorts: true })} locale={locale} />
      </div>
    </PageShell>
  );
}
