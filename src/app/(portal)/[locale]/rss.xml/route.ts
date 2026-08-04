import { isLocale, staticLocales } from "@/portal/i18n/config";
import { getDictionary } from "@/portal/i18n/dictionaries";
import { sortedNews } from "@/portal/data/news";
import { brand } from "@/portal/lib/site";
import { localeUrl } from "@/portal/lib/seo";
import { t } from "@/portal/lib/format";

/**
 * 言語別のRSS。
 *
 * 言語ごとに別フィードにしているのは、購読者が読める言語だけを受け取れるようにするためです。
 * （1本のフィードに全言語を混ぜると、大半が読めない記事になります）
 */
export const dynamic = "force-static";

export function generateStaticParams() {
  return staticLocales().map((locale) => ({ locale }));
}

/** XML に埋め込む文字列のエスケープ */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(_request: Request, context: { params: Promise<{ locale: string }> }) {
  const { locale } = await context.params;
  if (!isLocale(locale)) return new Response("Not found", { status: 404 });

  const dict = getDictionary(locale);
  const articles = sortedNews().slice(0, 30);
  const self = `${localeUrl(locale, "/rss.xml")}`;

  const items = articles
    .map((article) => {
      const url = localeUrl(locale, `/news/${article.slug}`);
      return `    <item>
      <title>${escapeXml(t(article.title, locale))}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description>${escapeXml(t(article.summary, locale))}</description>
      <category>${escapeXml(article.category)}</category>
      <source url="${escapeXml(self)}">${escapeXml(article.outlet)}</source>
      <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${brand.name} — ${dict.news.title}`)}</title>
    <link>${escapeXml(localeUrl(locale, "/news"))}</link>
    <description>${escapeXml(dict.news.lead)}</description>
    <language>${escapeXml(locale)}</language>
    <atom:link href="${escapeXml(self)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
