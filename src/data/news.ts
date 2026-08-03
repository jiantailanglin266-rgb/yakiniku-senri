/**
 * お知らせデータ。
 *
 * ■ 変更方法
 *   news 配列に追記するだけで、一覧・詳細ページ・sitemap.xml に自動反映されます。
 *   将来 WordPress / ヘッドレスCMS に接続する場合は、getNews() / getNewsBySlug() の
 *   実装だけを差し替えてください（UI 側の変更は不要です）。
 *
 * ⚠ 記事タイトルと日付は既存サイトの掲載内容を参照しています。
 * ⚠ 本文は [本文をここに入力してください] のプレースホルダーです。公開前に差し替えてください。
 */
import { z } from "zod";
import { media } from "./media";

export const newsCategories = {
  info: "お知らせ",
  hours: "営業案内",
  menu: "メニュー",
  takeout: "テイクアウト",
  media: "メディア",
  event: "イベント",
} as const;

export type NewsCategoryId = keyof typeof newsCategories;

export const newsSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  /** ISO 8601 (YYYY-MM-DD) */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.custom<NewsCategoryId>((v) => typeof v === "string" && v in newsCategories),
  lead: z.string().min(1),
  body: z.array(z.string().min(1)).min(1),
  image: z.string().optional(),
});

export type NewsPost = z.infer<typeof newsSchema>;

const PLACEHOLDER_BODY = "[本文をここに入力してください]";

const news: NewsPost[] = [
  {
    slug: "osechi-yoyaku",
    title: "千里のおせち 予約受付中",
    date: "2024-10-16",
    category: "info",
    lead: "千里のおせちのご予約を承っております。詳しくはお電話にてお問い合わせください。",
    body: [PLACEHOLDER_BODY],
    image: media.news.src,
  },
  {
    slug: "business-hours-notice",
    title: "営業時間のお知らせ",
    date: "2023-12-01",
    category: "hours",
    lead: "営業時間についてのご案内です。ご来店前にご確認ください。",
    body: [PLACEHOLDER_BODY],
    image: media.news.src,
  },
  {
    slug: "takeout-limited-menu",
    title: "テイクアウト限定メニュー",
    date: "2023-09-29",
    category: "takeout",
    lead: "テイクアウト限定のメニューをご用意しております。",
    body: [PLACEHOLDER_BODY],
    image: media.news.src,
  },
];

news.forEach((post) => newsSchema.parse(post));

/** 新しい順に取得（limit 指定で件数制限） */
export function getNews(limit?: number): NewsPost[] {
  const sorted = [...news].sort((a, b) => (a.date < b.date ? 1 : -1));
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export function getNewsBySlug(slug: string): NewsPost | undefined {
  return news.find((post) => post.slug === slug);
}

export function getAllNewsSlugs(): string[] {
  return news.map((post) => post.slug);
}

export function formatNewsDate(date: string): string {
  const [y, m, d] = date.split("-");
  return `${y}.${m}.${d}`;
}
