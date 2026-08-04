import { isLocale, staticLocales } from "@/portal/i18n/config";
import { portalNewsSitemapUrls } from "@/portal/lib/sitemap";
import { escapeXml } from "@/portal/lib/xml";

/**
 * Google ニュース向けサイトマップ（言語別）。
 *
 * ■ 2日ルール
 *   Google ニュースのサイトマップは、公開から**2日以内**の記事だけが対象です。
 *   古い記事を載せてもクロールされず、載せ続けると「更新されていないフィード」
 *   として扱われます。ここで機械的に絞り込んでいます。
 *
 * ■ 静的書き出しでの限界
 *   `output: "export"` ではビルド時に内容が固定されます。
 *   2日の判定もビルド時刻が基準になるため、静的配信のままでは
 *   時間の経過とともに空になります。運用時はサーバー実行（Vercel）か、
 *   定期ビルドのどちらかが必要です。docs/portal/04-status.md に記載しています。
 *
 * ■ 空でも200を返す理由
 *   対象記事が無いときに404を返すと、Search Console が
 *   「取得できないサイトマップ」として警告を出し続けます。
 *   有効な空の urlset を返すのが正しい振る舞いです。
 */
export const dynamic = "force-static";

export function generateStaticParams() {
  return staticLocales().map((locale) => ({ locale }));
}

export async function GET(_request: Request, context: { params: Promise<{ locale: string }> }) {
  const { locale } = await context.params;
  if (!isLocale(locale)) return new Response("Not found", { status: 404 });

  const entries = portalNewsSitemapUrls(locale);

  const items = entries
    .map(
      (entry) => `  <url>
    <loc>${escapeXml(entry.url)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(entry.publicationName)}</news:name>
        <news:language>${escapeXml(entry.language)}</news:language>
      </news:publication>
      <news:publication_date>${escapeXml(entry.publishedAt)}</news:publication_date>
      <news:title>${escapeXml(entry.title)}</news:title>
    </news:news>
  </url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items}
</urlset>
`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=600, s-maxage=600",
    },
  });
}
