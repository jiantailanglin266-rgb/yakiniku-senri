/**
 * AI PORT — YouTube の取得。
 *
 * ■ APIキーがなくても動きます
 *   YouTube はチャンネルごとに公開RSS（feeds/videos.xml）を出しています。
 *   キー不要・レート制限も緩いので、こちらを既定の経路にしています。
 *   `YOUTUBE_API_KEY` を設定すれば Data API v3 へ切り替わり、再生数も取得できます。
 *
 * ■ 再生数について
 *   RSS には再生数が含まれません。取得できない数字は表示しません。
 *   「人気動画」と称して推測の再生数を出すことは絶対にしないでください。
 *
 * ■ channelId の解決
 *   RSS は UC… 形式の channelId が必要です。
 *   分かっていない場合はチャンネルページを1度だけ取得して抽出し、
 *   結果を Next.js のデータキャッシュに載せます（既定24時間）。
 *   失敗したチャンネルは一覧から外れるだけで、全体は壊れません。
 */

import { parseFeed } from "./rss";
import { youtubeChannels, type YoutubeChannel } from "@/data/ai-port/youtube";

export type YoutubeVideo = {
  id: string;
  title: string;
  url: string;
  isoDate: string;
  channelName: string;
  channelUrl: string;
  thumbnail?: string;
  /** APIキーがあるときだけ入ります。無いときは表示しません。 */
  viewCount?: number;
};

export const YOUTUBE_REVALIDATE_SECONDS = 3600;
const CHANNEL_ID_REVALIDATE_SECONDS = 86400;
const FETCH_TIMEOUT_MS = 6000;

/** ハンドル（@openai）から channelId を1度だけ解決します。 */
async function resolveChannelId(channel: YoutubeChannel): Promise<string | null> {
  if (channel.channelId) return channel.channelId;

  try {
    const response = await fetch(`https://www.youtube.com/@${channel.handle}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AIPortBot/1.0)" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      next: { revalidate: CHANNEL_ID_REVALIDATE_SECONDS, tags: ["ai-port-youtube"] },
    });

    if (!response.ok) return null;

    const html = await response.text();
    const match = html.match(/"(?:channelId|externalId)"\s*:\s*"(UC[\w-]{20,})"/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

async function fetchChannelVideos(channel: YoutubeChannel, limit: number): Promise<YoutubeVideo[]> {
  const channelId = await resolveChannelId(channel);
  if (!channelId) return [];

  try {
    const response = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
      {
        headers: { "User-Agent": "AIPortBot/1.0 (RSS reader)" },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        next: { revalidate: YOUTUBE_REVALIDATE_SECONDS, tags: ["ai-port-youtube"] },
      },
    );

    if (!response.ok) return [];

    const xml = await response.text();

    return parseFeed(xml)
      .slice(0, limit)
      .map((item) => {
        const videoId = new URL(item.link).searchParams.get("v") ?? item.link;
        return {
          id: videoId,
          title: item.title,
          url: item.link,
          isoDate: item.isoDate,
          channelName: channel.name,
          channelUrl: `https://www.youtube.com/@${channel.handle}`,
          // サムネイルは動画IDから決まるURLなので、RSSに無くても組み立てられます
          thumbnail: item.image ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        };
      });
  } catch {
    return [];
  }
}

/**
 * 全チャンネルの最新動画を取得し、新しい順に並べます。
 * 取得できなかったチャンネルは黙って除かれます。
 */
export async function getLatestVideos(limit = 8): Promise<YoutubeVideo[]> {
  const results = await Promise.allSettled(
    youtubeChannels.map((channel) => fetchChannelVideos(channel, 4)),
  );

  return results
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .sort((a, b) => (a.isoDate < b.isoDate ? 1 : a.isoDate > b.isoDate ? -1 : 0))
    .slice(0, limit);
}
