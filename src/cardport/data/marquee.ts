/**
 * 斜めマーキーに流す金融キーワード。
 *
 * ■ ここに置いてよいもの
 *   このサイトが扱っている「話題」の名前だけです。
 *   装飾用の文字列なので、金額・還元率・順位・実績は書きません。
 *   数字を流すと、条件を伴わない断片だけが目に入り、
 *   実際の条件と食い違って読まれます（AGENTS.md §3）。
 *
 * ■ 実在ブランドを書かない
 *   掲載しているカードはすべて架空です。
 *   国際ブランド名・決済事業者名を流すと、
 *   そのブランドを扱っているかのように読めてしまいます。
 *
 * ■ 翻訳
 *   `ja` は必須、`en` を推奨。未定義の言語は en → ja の順に落とします。
 *   ここは装飾なので、未訳のまま原文が流れても実害はありません。
 */
import type { LocalizedText } from "@/cardport/i18n/localized";

/**
 * 文字色に使うアクセント。
 *
 * 暗い地の上でコントラスト比 4.5:1 を確保できる色だけを並べています。
 * `--color-cp-violet` / `--color-cp-electric` は文字に使うと 4.5:1 を割るため、
 * 面（枠線・発光）専用にしていて、ここには入れていません。
 */
export type MarqueeAccent = "cyan" | "magenta" | "emerald" | "amber" | "gold";

export type MarqueeKeyword = {
  text: LocalizedText;
  accent: MarqueeAccent;
};

export const marqueeKeywords: MarqueeKeyword[] = [
  { text: { ja: "キャッシュレス決済", en: "Cashless payments" }, accent: "cyan" },
  { text: { ja: "ポイント還元", en: "Points rewards" }, accent: "amber" },
  { text: { ja: "マイル", en: "Air miles" }, accent: "gold" },
  { text: { ja: "年会費", en: "Annual fees" }, accent: "emerald" },
  { text: { ja: "タッチ決済", en: "Contactless" }, accent: "magenta" },
  { text: { ja: "QRコード決済", en: "QR payments" }, accent: "cyan" },
  { text: { ja: "スマホ決済", en: "Mobile wallets" }, accent: "emerald" },
  { text: { ja: "電子マネー", en: "E-money" }, accent: "amber" },
  { text: { ja: "法人カード", en: "Corporate cards" }, accent: "gold" },
  { text: { ja: "経費精算", en: "Expense management" }, accent: "cyan" },
  { text: { ja: "家計管理", en: "Budgeting" }, accent: "emerald" },
  { text: { ja: "分割払い", en: "Instalments" }, accent: "magenta" },
  { text: { ja: "リボ払い", en: "Revolving credit" }, accent: "amber" },
  { text: { ja: "与信審査", en: "Credit assessment" }, accent: "gold" },
  { text: { ja: "信用スコア", en: "Credit scoring" }, accent: "cyan" },
  { text: { ja: "不正利用検知", en: "Fraud detection" }, accent: "magenta" },
  { text: { ja: "3Dセキュア", en: "3-D Secure" }, accent: "emerald" },
  { text: { ja: "旅行保険", en: "Travel insurance" }, accent: "gold" },
  { text: { ja: "空港ラウンジ", en: "Airport lounges" }, accent: "amber" },
  { text: { ja: "海外事務手数料", en: "Foreign transaction fees" }, accent: "cyan" },
  { text: { ja: "為替レート", en: "Exchange rates" }, accent: "emerald" },
  { text: { ja: "国際送金", en: "Cross-border transfers" }, accent: "magenta" },
  { text: { ja: "Web3.0決済", en: "Web3 payments" }, accent: "gold" },
  { text: { ja: "ステーブルコイン", en: "Stablecoins" }, accent: "cyan" },
  { text: { ja: "暗号資産カード", en: "Crypto cards" }, accent: "magenta" },
  { text: { ja: "オープンバンキング", en: "Open banking" }, accent: "emerald" },
  { text: { ja: "サブスク管理", en: "Subscription tracking" }, accent: "amber" },
  { text: { ja: "資産形成", en: "Wealth building" }, accent: "gold" },
];

/**
 * キーワードを行に配り直します。
 *
 * 順番に1行ずつ入れていくので、キーワードを1つ足しても
 * 行の割り当てを手で組み直す必要がありません。
 * 色の並びも自然にばらけます。
 */
export function marqueeRows(rows = 3): MarqueeKeyword[][] {
  const result: MarqueeKeyword[][] = Array.from({ length: rows }, () => []);
  marqueeKeywords.forEach((keyword, index) => {
    result[index % rows].push(keyword);
  });
  return result;
}
