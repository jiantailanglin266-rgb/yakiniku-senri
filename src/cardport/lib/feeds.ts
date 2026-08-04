/**
 * サイトマップ・RSS の生成。
 *
 * ■ 既存サイトと分ける理由
 *   焼肉店サイトと CARD PORT は別ドメインで運用できる構成にしているため、
 *   サイトマップも分けています（`/sitemap.xml` は既存サイト用のままです）。
 *
 * ■ 言語別サイトマップ
 *   1ファイルに全言語を入れ、各URLへ `xhtml:link` で相互参照を張ります。
 *   言語ごとにファイルを分けるより、代替言語の対応関係が明示できます。
 */
import { cardportAbsoluteUrl } from "@/cardport/config/site";
import { cards } from "@/cardport/data/cards";
import { cardCategories, rankingCategories } from "@/cardport/data/categories";
import { diagnoses } from "@/cardport/data/diagnoses";
import { featureCollections } from "@/cardport/data/features";
import { guides } from "@/cardport/data/guides";
import { news } from "@/cardport/data/news";
import { policyPages } from "@/cardport/data/policies";
import { simulators } from "@/cardport/data/simulators";
import { videos } from "@/cardport/data/videos";
import { web3Services } from "@/cardport/data/web3";
import {
  getContentLocales,
  getLocaleDefinition,
  locales,
  type Locale,
} from "@/cardport/i18n/locales";
import { pick } from "@/cardport/i18n/localized";
import { routes } from "./routes";

export type SitemapEntry = {
  /** 言語プレフィックスを除いたパス生成関数 */
  build: (locale: Locale) => string;
  lastModified?: string;
  changeFrequency?: "daily" | "weekly" | "monthly" | "yearly";
  priority?: number;
  /**
   * このページを生成する言語。
   * 詳細ページは静的エクスポート時に主要言語だけを生成するため、
   * サイトマップにも生成しない言語のURLを載せないようにします。
   */
  locales?: Locale[];
};

/** 全ページの一覧。ページを追加したらここにも足してください */
export function sitemapEntries(): SitemapEntry[] {
  // 詳細ページの生成言語。ここに無い言語のURLはサイトマップにも載せません
  const contentLocales = getContentLocales();

  return [
    { build: routes.home, changeFrequency: "daily", priority: 1 },
    { build: routes.cards, changeFrequency: "daily", priority: 0.9 },
    { build: routes.rankings, changeFrequency: "weekly", priority: 0.9 },
    { build: routes.compare, changeFrequency: "weekly", priority: 0.8 },
    { build: routes.diagnosisIndex, changeFrequency: "weekly", priority: 0.8 },
    { build: routes.simulatorIndex, changeFrequency: "weekly", priority: 0.8 },
    { build: routes.campaigns, changeFrequency: "daily", priority: 0.8 },
    { build: routes.business, changeFrequency: "weekly", priority: 0.8 },
    { build: routes.payments, changeFrequency: "weekly", priority: 0.7 },
    { build: routes.web3, changeFrequency: "weekly", priority: 0.7 },
    { build: routes.tools, changeFrequency: "weekly", priority: 0.7 },
    { build: routes.news, changeFrequency: "daily", priority: 0.8 },
    { build: routes.videos, changeFrequency: "weekly", priority: 0.7 },
    { build: routes.guides, changeFrequency: "monthly", priority: 0.7 },
    { build: routes.features, changeFrequency: "monthly", priority: 0.7 },
    { build: routes.faq, changeFrequency: "monthly", priority: 0.6 },
    { build: routes.policies, changeFrequency: "yearly", priority: 0.4 },
    { build: routes.imageCredits, changeFrequency: "monthly", priority: 0.3 },
    { build: routes.sitemap, changeFrequency: "monthly", priority: 0.3 },

    ...cardCategories.map((category) => ({
      build: (locale: Locale) => routes.cardCategory(locale, category.id),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...rankingCategories.map((category) => ({
      build: (locale: Locale) => routes.ranking(locale, category.id),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...cards.map((card) => ({
      build: (locale: Locale) => routes.card(locale, card.slug),
      lastModified: card.updatedOn,
      changeFrequency: "weekly" as const,
      priority: 0.9,
      locales: contentLocales,
    })),
    ...diagnoses.map((diagnosis) => ({
      build: (locale: Locale) => routes.diagnosis(locale, diagnosis.slug),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...simulators.map((simulator) => ({
      build: (locale: Locale) => routes.simulator(locale, simulator.slug),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...featureCollections.map((feature) => ({
      build: (locale: Locale) => routes.feature(locale, feature.slug),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...news.map((article) => ({
      build: (locale: Locale) => routes.newsArticle(locale, article.slug),
      lastModified: article.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      locales: contentLocales,
    })),
    ...videos.map((video) => ({
      build: (locale: Locale) => routes.video(locale, video.slug),
      lastModified: video.publishedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      locales: contentLocales,
    })),
    ...web3Services.map((service) => ({
      build: (locale: Locale) => routes.web3Service(locale, service.slug),
      changeFrequency: "monthly" as const,
      priority: 0.6,
      locales: contentLocales,
    })),
    ...guides.map((guide) => ({
      build: (locale: Locale) => routes.guide(locale, guide.slug),
      lastModified: guide.updatedOn,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      locales: contentLocales,
    })),
    ...policyPages.map((page) => ({
      build: (locale: Locale) => routes.policy(locale, page.slug),
      lastModified: page.updatedOn,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** 言語別 hreflang つきのサイトマップ */
export function buildSitemapXml(): string {
  const entries = sitemapEntries();
  const urls: string[] = [];

  for (const entry of entries) {
    const entryLocales = entry.locales ?? locales;
    for (const locale of entryLocales) {
      const alternates = entryLocales
        .map(
          (alternate) =>
            `    <xhtml:link rel="alternate" hreflang="${getLocaleDefinition(alternate).hreflang}" href="${escapeXml(
              cardportAbsoluteUrl(entry.build(alternate)),
            )}" />`,
        )
        .join("\n");

      urls.push(
        [
          "  <url>",
          `    <loc>${escapeXml(cardportAbsoluteUrl(entry.build(locale)))}</loc>`,
          entry.lastModified ? `    <lastmod>${entry.lastModified}</lastmod>` : "",
          entry.changeFrequency ? `    <changefreq>${entry.changeFrequency}</changefreq>` : "",
          entry.priority !== undefined ? `    <priority>${entry.priority}</priority>` : "",
          alternates,
          `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(
            cardportAbsoluteUrl(entry.build("ja")),
          )}" />`,
          "  </url>",
        ]
          .filter(Boolean)
          .join("\n"),
      );
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>
`;
}

/** ニュースサイトマップ（直近2日分のみを載せる仕様に従い、掲載期間で絞ります） */
export function buildNewsSitemapXml(publicationName: string, now = new Date()): string {
  const cutoff = now.getTime() - 2 * 24 * 60 * 60 * 1000;
  const recent = news.filter(
    (article) => new Date(`${article.publishedAt}T00:00:00Z`).getTime() >= cutoff,
  );

  const urls = recent.flatMap((article) =>
    getContentLocales().map((locale) =>
      [
        "  <url>",
        `    <loc>${escapeXml(cardportAbsoluteUrl(routes.newsArticle(locale, article.slug)))}</loc>`,
        "    <news:news>",
        "      <news:publication>",
        `        <news:name>${escapeXml(publicationName)}</news:name>`,
        `        <news:language>${getLocaleDefinition(locale).hreflang.split("-")[0]}</news:language>`,
        "      </news:publication>",
        `      <news:publication_date>${article.publishedAt}</news:publication_date>`,
        `      <news:title>${escapeXml(pick(article.title, locale))}</news:title>`,
        "    </news:news>",
        "  </url>",
      ].join("\n"),
    ),
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls.join("\n")}
</urlset>
`;
}

/** 動画サイトマップ */
export function buildVideoSitemapXml(): string {
  const urls = videos.flatMap((video) =>
    getContentLocales().map((locale) =>
      [
        "  <url>",
        `    <loc>${escapeXml(cardportAbsoluteUrl(routes.video(locale, video.slug)))}</loc>`,
        "    <video:video>",
        `      <video:title>${escapeXml(pick(video.title, locale))}</video:title>`,
        `      <video:description>${escapeXml(pick(video.description, locale))}</video:description>`,
        video.youtubeId
          ? `      <video:thumbnail_loc>https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg</video:thumbnail_loc>`
          : "",
        video.youtubeId
          ? `      <video:player_loc>https://www.youtube.com/embed/${video.youtubeId}</video:player_loc>`
          : "",
        `      <video:duration>${video.durationSeconds}</video:duration>`,
        `      <video:publication_date>${video.publishedAt}</video:publication_date>`,
        "    </video:video>",
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n"),
    ),
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls.join("\n")}
</urlset>
`;
}

/** RSS（日本語版のニュース） */
export function buildRssXml(title: string, description: string, locale: Locale = "ja"): string {
  const items = [...news]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 20)
    .map((article) =>
      [
        "    <item>",
        `      <title>${escapeXml(pick(article.title, locale))}</title>`,
        `      <link>${escapeXml(cardportAbsoluteUrl(routes.newsArticle(locale, article.slug)))}</link>`,
        `      <guid isPermaLink="true">${escapeXml(cardportAbsoluteUrl(routes.newsArticle(locale, article.slug)))}</guid>`,
        `      <description>${escapeXml(pick(article.summary, locale))}</description>`,
        `      <pubDate>${new Date(`${article.publishedAt}T00:00:00Z`).toUTCString()}</pubDate>`,
        "    </item>",
      ].join("\n"),
    );

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${escapeXml(cardportAbsoluteUrl(routes.home(locale)))}</link>
    <description>${escapeXml(description)}</description>
    <language>${getLocaleDefinition(locale).hreflang}</language>
${items.join("\n")}
  </channel>
</rss>
`;
}
