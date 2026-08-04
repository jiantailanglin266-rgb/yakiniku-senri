import type { Metadata } from "next";
import Image from "next/image";

import { Reveal } from "@/components/ai-port/effects/Reveal";
import { PageBody, PageHero, RelatedLinks } from "@/components/ai-port/layout/PageShell";
import { Disclaimer, GlassCard } from "@/components/ai-port/ui/Primitives";
import { JsonLd } from "@/components/ui/JsonLd";
import { aiPortPath } from "@/data/ai-port/site";
import { channelUrl, youtubeChannels } from "@/data/ai-port/youtube";
import { relativeTime } from "@/lib/ai-port/news";
import { aiPortMetadata } from "@/lib/ai-port/seo";
import { aiPortBreadcrumbJsonLd } from "@/lib/ai-port/structured-data";
import { getLatestVideos } from "@/lib/ai-port/youtube";

const CRUMBS = [
  { name: "AI PORT", path: "/" },
  { name: "YouTube", path: "/youtube" },
];

export const metadata: Metadata = aiPortMetadata({
  title: "AI公式チャンネルの最新動画｜YouTube",
  description:
    "OpenAI・Anthropic・Google DeepMind・NVIDIA・Microsoft・Hugging Face の公式YouTubeチャンネルから、最新動画を自動収集しています。",
  path: "/youtube",
  keywords: ["AI YouTube", "OpenAI 動画", "AI 解説 動画", "生成AI チャンネル"],
});

/**
 * YouTube。
 *
 * ⚠ 再生数は表示しません。
 *   キー不要のRSS経由で取得しており、再生数が含まれないためです。
 *   取得できない数字を「人気」として推測で出すことはしません。
 */
export default async function YoutubePage() {
  const videos = await getLatestVideos(24);

  return (
    <>
      <PageHero
        eyebrow="Video"
        title="AI公式チャンネルの"
        highlight="最新動画"
        description="各社の公式チャンネルの配信を自動で収集しています。サムネイルをクリックするとYouTubeで再生されます。"
        crumbs={CRUMBS}
      />

      <PageBody>
        <section>
          <h2 className="text-ai-white text-[1.1rem]">収集しているチャンネル</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {youtubeChannels.map((channel) => (
              <li key={channel.id}>
                <a
                  href={channelUrl(channel)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ai-glass ai-glass-rim group block h-full rounded-xl p-4"
                >
                  <span
                    className="text-ai-white group-hover:text-ai-cyan block text-[0.9rem] transition-colors"
                    translate="no"
                  >
                    {channel.name}
                  </span>
                  <span className="text-ai-haze mt-1.5 block text-[0.76rem] leading-[1.8]">
                    {channel.description}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14">
          <h2 className="text-ai-white text-[1.1rem]">最新の動画</h2>

          <div className="mt-6">
            {videos.length === 0 ? (
              <GlassCard className="px-6 py-10 text-center">
                <p className="text-ai-mist text-[0.9rem]">動画を取得できませんでした。</p>
                <p className="text-ai-dim mt-2.5 text-[0.78rem] leading-[1.9]">
                  YouTubeの配信フィードに一時的に接続できていない可能性があります。
                  上のチャンネル一覧から直接ご覧ください。
                </p>
              </GlassCard>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {videos.map((video, index) => (
                  <Reveal key={video.id} as="li" delay={(index % 8) * 45}>
                    <article className="ai-glass ai-glass-rim group relative h-full overflow-hidden rounded-2xl">
                      <div className="relative aspect-video overflow-hidden bg-white/5">
                        {video.thumbnail ? (
                          <Image
                            src={video.thumbnail}
                            alt=""
                            fill
                            unoptimized
                            sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 90vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : null}
                      </div>

                      <div className="p-4">
                        <p className="text-ai-dim flex items-center justify-between gap-2 text-[0.66rem]">
                          <span translate="no">{video.channelName}</span>
                          <time dateTime={video.isoDate} translate="no">
                            {relativeTime(video.isoDate)}
                          </time>
                        </p>
                        <h3 className="text-ai-white mt-1.5 line-clamp-2 text-[0.86rem] leading-[1.6]">
                          <a
                            href={video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group-hover:text-ai-cyan transition-colors after:absolute after:inset-0"
                          >
                            {video.title}
                          </a>
                        </h3>
                      </div>
                    </article>
                  </Reveal>
                ))}
              </ul>
            )}
          </div>
        </section>

        <Disclaimer>
          動画のサムネイル・タイトルは各チャンネルに帰属します。AI PORT
          は再生数を取得していないため表示していません。
        </Disclaimer>

        <RelatedLinks
          items={[
            { href: aiPortPath("/news"), label: "AIニュース一覧" },
            { href: aiPortPath("/guides"), label: "解説記事を読む" },
            { href: aiPortPath("/tools"), label: "AIツール一覧" },
          ]}
        />
      </PageBody>

      <JsonLd data={[aiPortBreadcrumbJsonLd(CRUMBS)]} />
    </>
  );
}
