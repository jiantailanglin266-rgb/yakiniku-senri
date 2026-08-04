import { getArticles } from "@/data/ai-port/articles";
import { aiPortDescription, aiPortName, aiPortUrl } from "@/data/ai-port/site";

/**
 * AI PORT のRSSフィード。
 *
 * ⚠ 配信するのは自社で書いた解説記事だけです。
 *   外部から収集したニュースを自社フィードとして再配信すると、
 *   他社の記事を自社コンテンツとして配っていることになります。
 *
 * 静的エクスポートでも出力できるよう `force-static` にしています。
 */
export const dynamic = "force-static";

/** XMLに入れられない文字を実体参照へ置き換えます。 */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET(): Response {
  const articles = getArticles();
  const latest = articles[0];

  // ビルドのたびに現在時刻を入れると「毎回更新された」ことになり、
  // クロールの優先度判断を誤らせます。最新記事の更新日を基準にします。
  const lastBuildDate = latest ? new Date(latest.updated).toUTCString() : new Date(0).toUTCString();

  const items = articles
    .map((article) =>
      [
        "    <item>",
        `      <title>${escapeXml(article.title)}</title>`,
        `      <link>${escapeXml(aiPortUrl(`/guides/${article.slug}`))}</link>`,
        `      <guid isPermaLink="true">${escapeXml(aiPortUrl(`/guides/${article.slug}`))}</guid>`,
        `      <description>${escapeXml(article.description)}</description>`,
        `      <pubDate>${new Date(article.published).toUTCString()}</pubDate>`,
        `      <category>${escapeXml(article.topic)}</category>`,
        "    </item>",
      ].join("\n"),
    )
    .join("\n");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(aiPortName)}</title>`,
    `    <link>${escapeXml(aiPortUrl("/"))}</link>`,
    `    <description>${escapeXml(aiPortDescription)}</description>`,
    "    <language>ja</language>",
    `    <lastBuildDate>${lastBuildDate}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(aiPortUrl("/rss.xml"))}" rel="self" type="application/rss+xml" />`,
    items,
    "  </channel>",
    "</rss>",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
