/**
 * AI PORT — 広告・アフィリエイトの管理。
 *
 * ============================================================
 * ⚠ 表示のルール（景品表示法・ステマ規制）
 * ============================================================
 * 1. 対価を受け取っている枠には、必ず「PR」ラベルを出します。
 *    ラベルは `<AdSlot>` が自動で描画するので、外さないでください。
 * 2. 報酬額で掲載順位・評価を変えません。
 *    ランキングのスコア計算（lib/ai-port/ranking.ts）は
 *    アフィリエイトの有無を一切参照していません。
 * 3. 記事本文とアフィリエイトリンクは視覚的に区別します。
 * ============================================================
 *
 * ■ アフィリエイトリンクの入れ方
 *   環境変数 `AI_PORT_AFFILIATE_<SLUG>` にリンクを入れると、
 *   ツール詳細の「公式サイトへ」ボタンがそのリンクに差し替わります。
 *   未設定なら公式サイトの素のURLが使われます（＝常に壊れません）。
 */

import { findTool } from "./tools";

/** 広告枠の位置。UXを壊さない場所だけを定義しています。 */
export type AdPlacement =
  /** 記事本文の途中（見出しの直前） */
  | "in-article"
  /** 一覧の下（スクロールしきった人向け） */
  | "list-footer"
  /** サイドバー（デスクトップのみ） */
  | "sidebar";

export type AdSlot = {
  id: string;
  placement: AdPlacement;
  /** 対価を受け取っている枠か。true なら必ず PR 表示が出ます。 */
  sponsored: boolean;
  title: string;
  body: string;
  ctaLabel: string;
  /** 遷移先。空なら枠ごと描画しません。 */
  href: string;
};

/**
 * 実際に契約している広告だけをここに入れます。
 * 初期状態は空です。⚠ ダミーの広告を置かないでください
 *   （実在しない案件の表示は不当表示にあたります）。
 */
export const adSlots: AdSlot[] = [];

export function getAdSlots(placement: AdPlacement): AdSlot[] {
  return adSlots.filter((slot) => slot.placement === placement && slot.href.length > 0);
}

/** 環境変数名（例: AI_PORT_AFFILIATE_CHATGPT） */
function affiliateEnvKey(slug: string): string {
  return `AI_PORT_AFFILIATE_${slug.toUpperCase().replace(/-/g, "_")}`;
}

/**
 * ツールの外部リンク。
 * アフィリエイトリンクが設定されていればそちらを、なければ公式URLを返します。
 */
export function toolOutboundUrl(slug: string): { href: string; sponsored: boolean } {
  const tool = findTool(slug);
  const fallback = tool?.url ?? "";
  const affiliate = process.env[affiliateEnvKey(slug)];

  if (affiliate && affiliate.startsWith("https://")) {
    return { href: affiliate, sponsored: true };
  }
  return { href: fallback, sponsored: false };
}
