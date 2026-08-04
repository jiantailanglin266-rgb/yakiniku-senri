import { isLocale, staticLocales } from "@/portal/i18n/config";
import { portalVideoSitemapEntries } from "@/portal/lib/sitemap";
import { escapeXml } from "@/portal/lib/xml";

/**
 * 動画サイトマップ（言語別）。
 *
 * ■ 載せる動画
 *   `youtubeId` が設定されている動画だけです。
 *   動画サイトマップは `player_loc` か `content_loc` のどちらかが必須で、
 *   再生できる場所を示せない動画を載せても無効な項目になります。
 *   構造化データ（VideoObject）と同じ基準に揃えています。
 *
 * ■ 空でも200を返す理由
 *   404 を返すと Search Console が「取得できないサイトマップ」として
 *   警告を出し続けます。有効な空の urlset を返すのが正しい振る舞いです。
 */
export const dynamic = "force-static";

export function generateStaticParams() {
  return staticLocales().map((locale) => ({ locale }));
}

export async function GET(_request: Request, context: { params: Promise<{ locale: string }> }) {
  const { locale } = await context.params;
  if (!isLocale(locale)) return new Response("Not found", { status: 404 });

  const entries = portalVideoSitemapEntries(locale);

  const items = entries
    .map(
      (entry) => `  <url>
    <loc>${escapeXml(entry.pageUrl)}</loc>
    <video:video>
      <video:thumbnail_loc>${escapeXml(entry.thumbnailUrl)}</video:thumbnail_loc>
      <video:title>${escapeXml(entry.title)}</video:title>
      <video:description>${escapeXml(entry.description)}</video:description>
      <video:player_loc>${escapeXml(entry.playerUrl)}</video:player_loc>
      <video:duration>${entry.durationSec}</video:duration>
      <video:publication_date>${escapeXml(entry.publishedAt)}</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
      <video:live>no</video:live>
    </video:video>
  </url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${items}
</urlset>
`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
