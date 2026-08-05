/**
 * AI PORT — ナビゲーション。
 * ここを編集するとヘッダー・フッター・モバイルタブ・サイトマップがすべて追従します。
 */

import { aiPortPath } from "./site";

export type AiNavItem = {
  href: string;
  label: string;
  labelEn: string;
  description?: string;
};

/** ヘッダーの主要ナビ（デスクトップ） */
export const aiMainNav: AiNavItem[] = [
  {
    href: aiPortPath("/news"),
    label: "ニュース",
    labelEn: "NEWS",
    description: "公式RSSから自動収集",
  },
  {
    href: aiPortPath("/tools"),
    label: "AIツール",
    labelEn: "TOOLS",
    description: "用途別データベース",
  },
  {
    href: aiPortPath("/ranking"),
    label: "ランキング",
    labelEn: "RANKING",
    description: "注目度スコア順",
  },
  {
    href: aiPortPath("/compare"),
    label: "比較",
    labelEn: "COMPARE",
    description: "選定軸で横並び比較",
  },
  {
    href: aiPortPath("/guides"),
    label: "解説",
    labelEn: "GUIDES",
    description: "編集部の解説記事",
  },
  {
    href: aiPortPath("/diagnosis"),
    label: "AI診断",
    labelEn: "DIAGNOSIS",
    description: "無料・5種類",
  },
  {
    href: aiPortPath("/chat"),
    label: "AIチャット",
    labelEn: "CHAT",
    description: "サイト内を検索して回答",
  },
];

/** ヘッダーのメガメニューに出す第二階層 */
export const aiSecondaryNav: AiNavItem[] = [
  { href: aiPortPath("/youtube"), label: "YouTube", labelEn: "VIDEO" },
  { href: aiPortPath("/events"), label: "AIイベント", labelEn: "EVENTS" },
  { href: aiPortPath("/jobs"), label: "AI求人・副業", labelEn: "CAREERS" },
  { href: aiPortPath("/schools"), label: "AIスクール", labelEn: "LEARN" },
  { href: aiPortPath("/topics"), label: "カテゴリー一覧", labelEn: "TOPICS" },
  { href: aiPortPath("/search"), label: "サイト内検索", labelEn: "SEARCH" },
];

/** フッター下段 */
export const aiUtilityNav: AiNavItem[] = [
  { href: aiPortPath("/about"), label: "運営者情報・編集方針", labelEn: "ABOUT" },
  { href: aiPortPath("/disclosure"), label: "広告掲載について", labelEn: "DISCLOSURE" },
  { href: aiPortPath("/image-credits"), label: "画像の出典とライセンス", labelEn: "CREDITS" },
  { href: aiPortPath("/rss.xml"), label: "RSS", labelEn: "RSS" },
];

/** モバイル下部の固定タブ（4つまで。増やすと押し間違えます） */
export const aiTabNav: AiNavItem[] = [
  { href: aiPortPath("/"), label: "ホーム", labelEn: "HOME" },
  { href: aiPortPath("/news"), label: "ニュース", labelEn: "NEWS" },
  { href: aiPortPath("/tools"), label: "ツール", labelEn: "TOOLS" },
  { href: aiPortPath("/chat"), label: "AIに聞く", labelEn: "CHAT" },
];
