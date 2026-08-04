/**
 * SPORTS PORT のニュース RSS（日本語版）。
 *
 * 生成AIやフィードリーダーからの参照を想定し、
 * 各記事に情報の確度（公式発表 / 報道 / 未確認）をカテゴリとして含めます。
 */
import { brand } from "@/sports/config/site";
import { news } from "@/sports/data/news";
import { text } from "@/sports/i18n";
import { absoluteUrl } from "@/sports/lib/url";

export const dynamic = "force-static";

const confidenceLabel: Record<string, string> = {
  official: "公式発表",
  report: "報道",
  rumour: "未確認",
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const locale = "ja";
  const sorted = [...news].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const items = sorted
    .map((article) =>
      [
        "    <item>",
        `      <title>${escapeXml(text(article.title, locale))}</title>`,
        `      <link>${escapeXml(absoluteUrl(locale, `/news/${article.slug}`))}</link>`,
        `      <guid isPermaLink="true">${escapeXml(absoluteUrl(locale, `/news/${article.slug}`))}</guid>`,
        `      <description>${escapeXml(text(article.summary, locale))}</description>`,
        `      <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>`,
        `      <category>${escapeXml(article.category)}</category>`,
        `      <category>${escapeXml(confidenceLabel[article.confidence] ?? article.confidence)}</category>`,
        "    </item>",
      ].join("\n"),
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(brand.name)}</title>
    <link>${escapeXml(absoluteUrl(locale, "/news"))}</link>
    <description>${escapeXml(brand.subCopy.ja)}</description>
    <language>ja</language>
    <atom:link href="${escapeXml(`${brand.origin}/sports-rss.xml`)}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
