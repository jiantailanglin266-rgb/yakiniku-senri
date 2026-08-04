/**
 * AI PORT — ツールの「注目度スコア」。
 *
 * ============================================================
 * ⚠ このスコアは人気投票でも売上でもありません。
 *   持っていないデータ（PV・ダウンロード数・レビュー点）で
 *   順位を作ることは事実の捏造にあたるため、一切使いません。
 *
 *   使うのは、実際に手元にある2つの材料だけです。
 *     1. 直近のニュースでその提供元が何件言及されたか（実測値）
 *     2. 編集部の選定基準（日本語UI・API・無料枠・法人利用）
 *
 *   計算式は画面（/ai-port/ranking）にそのまま掲載しています。
 *   ⚠ アフィリエイトの有無はスコアに一切影響させません。
 * ============================================================
 */

import type { AiTool } from "@/data/ai-port/tools";
import { vendors } from "@/data/ai-port/feeds";

/** 配点。画面に出している表と必ず一致させてください。 */
export const SCORE_WEIGHTS = {
  /** ニュース言及1件あたり（上限あり） */
  mentionPerItem: 6,
  mentionCap: 36,
  /** 編集部が「まず試す価値がある」と判断した度合い（1〜3）×この値 */
  editorPick: 12,
  japaneseUi: 10,
  freeTier: 8,
  api: 6,
  team: 4,
} as const;

export type ScoredTool = {
  tool: AiTool;
  score: number;
  /** 内訳。画面でそのまま開示します。 */
  breakdown: { label: string; value: number }[];
  mentions: number;
};

/** ツールの提供元に対応するベンダーIDを探します。 */
function vendorIdForTool(tool: AiTool): string | undefined {
  const haystack = `${tool.name} ${tool.maker}`.toLowerCase();
  return vendors.find((vendor) =>
    vendor.terms.some((term) => haystack.includes(term.toLowerCase().split(" ")[0])),
  )?.id;
}

export function scoreTool(tool: AiTool, mentionCounts: Record<string, number>): ScoredTool {
  const vendorId = vendorIdForTool(tool);
  const mentions = vendorId ? (mentionCounts[vendorId] ?? 0) : 0;

  const mentionScore = Math.min(mentions * SCORE_WEIGHTS.mentionPerItem, SCORE_WEIGHTS.mentionCap);
  const editorScore = tool.editorPick * SCORE_WEIGHTS.editorPick;
  const japaneseScore = tool.japaneseUi === true ? SCORE_WEIGHTS.japaneseUi : 0;
  const freeScore = tool.pricing === "free-tier" ? SCORE_WEIGHTS.freeTier : 0;
  const apiScore = tool.api === true ? SCORE_WEIGHTS.api : 0;
  const teamScore = tool.team === true ? SCORE_WEIGHTS.team : 0;

  const breakdown = [
    { label: `直近ニュースでの言及（${mentions}件）`, value: mentionScore },
    { label: "編集部の注目度", value: editorScore },
    { label: "日本語UI", value: japaneseScore },
    { label: "無料で試せる", value: freeScore },
    { label: "API提供", value: apiScore },
    { label: "チーム・法人プラン", value: teamScore },
  ];

  return {
    tool,
    mentions,
    breakdown,
    score: breakdown.reduce((total, row) => total + row.value, 0),
  };
}

export function rankTools(tools: AiTool[], mentionCounts: Record<string, number>): ScoredTool[] {
  return tools
    .map((tool) => scoreTool(tool, mentionCounts))
    .sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name));
}

/** 満点（バーの最大値）。 */
export const MAX_SCORE =
  SCORE_WEIGHTS.mentionCap +
  3 * SCORE_WEIGHTS.editorPick +
  SCORE_WEIGHTS.japaneseUi +
  SCORE_WEIGHTS.freeTier +
  SCORE_WEIGHTS.api +
  SCORE_WEIGHTS.team;
