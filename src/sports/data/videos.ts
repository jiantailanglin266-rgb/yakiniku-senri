/**
 * 動画（デモ）。
 *
 * ■ YouTube Data API を使う場合は lib/api/videos.ts が同じ形へ正規化して返します。
 *   APIキーが無い状態でも、この配列でページ全体を確認できます。
 * ■ youtubeId が未設定の項目は埋め込みを行わず、プレースホルダーを表示します。
 *   実在しない動画IDを埋め込むと、権利者不明の動画が再生される可能性があるためです。
 * ■ AI要約は「生成物である」ことを明示して表示します。
 */
import type { VideoItem } from "../types";
import { minutesAfterReference } from "./clock";
import { mockStamp } from "./players";

const publishedAt = (hoursAgo: number) => minutesAfterReference(12 * 60 - hoursAgo * 60);

export const videos: VideoItem[] = [
  {
    id: "v-new-avl-highlights",
    slug: "newcastle-aston-villa-highlights",
    kind: "long",
    title: {
      ja: "ハイライト｜ニューカッスル 3-2 アストン・ヴィラ",
      en: "Highlights: Newcastle 3-2 Aston Villa",
    },
    description: {
      ja: "5得点が生まれた一戦のハイライト。3本のカウンターとPKの場面を中心にまとめています。",
      en: "Five goals, three counter-attacks and a penalty from a breathless afternoon.",
    },
    sportId: "football",
    leagueId: "premier-league",
    teamIds: ["t-newcastle", "t-aston-villa"],
    playerIds: [],
    matchId: "m-new-avl",
    channel: { name: "SPORTS PORT（デモ）", official: false },
    publishedAt: publishedAt(20),
    durationSec: 482,
    chapters: [
      { at: 0, label: { ja: "試合前", en: "Before kick-off" } },
      { at: 45, label: { ja: "9分 先制点", en: "9' opener" } },
      { at: 152, label: { ja: "41分 勝ち越し", en: "41' third goal" } },
      { at: 318, label: { ja: "72分 PK", en: "72' penalty" } },
    ],
    aiSummary: [
      {
        ja: "ホームは支配率44%ながら枠内シュート7本で3得点。",
        en: "The hosts scored three from seven shots on target despite 44% possession.",
      },
      {
        ja: "アウェイは終盤に1点を返したが、決定機の質で劣った。",
        en: "The visitors pulled one back late but lacked chance quality.",
      },
    ],
    stamp: mockStamp,
  },
  {
    id: "v-nyk-cel-highlights",
    slug: "knicks-celtics-highlights",
    kind: "long",
    title: {
      ja: "ハイライト｜ニックス 108-114 セルティックス",
      en: "Highlights: Knicks 108-114 Celtics",
    },
    description: {
      ja: "第4クォーター残り2分10秒、ブルックスの3ポイントが試合を決めました。",
      en: "Brooks' three with 2:10 left in the fourth settled it.",
    },
    sportId: "basketball",
    leagueId: "nba",
    teamIds: ["t-knicks", "t-celtics"],
    playerIds: ["p-brooks"],
    matchId: "m-nyk-cel",
    channel: { name: "SPORTS PORT（デモ）", official: false },
    publishedAt: publishedAt(40),
    durationSec: 604,
    chapters: [
      { at: 0, label: { ja: "第1クォーター", en: "Q1" } },
      { at: 180, label: { ja: "第3クォーター", en: "Q3" } },
      { at: 430, label: { ja: "第4クォーター", en: "Q4" } },
    ],
    aiSummary: [
      {
        ja: "3ポイント成功率は40%対33%。差はここに出た。",
        en: "Forty per cent from three against 33% — that was the margin.",
      },
    ],
    stamp: mockStamp,
  },
  {
    id: "v-hale-analysis",
    slug: "hale-finishing-analysis",
    kind: "long",
    title: {
      ja: "分析｜ヘイルの決定力はどこから来るのか",
      en: "Analysis: where Hale's finishing comes from",
    },
    description: {
      ja: "シュート位置とタイミングのデータから、今季14得点の背景を読み解きます。",
      en: "Shot location and timing data behind 14 goals this season.",
    },
    sportId: "football",
    leagueId: "premier-league",
    teamIds: ["t-arsenal"],
    playerIds: ["p-hale"],
    channel: { name: "SPORTS PORT データデスク（デモ）", official: false },
    publishedAt: publishedAt(70),
    durationSec: 725,
    chapters: [
      { at: 0, label: { ja: "概要", en: "Overview" } },
      { at: 120, label: { ja: "シュート位置", en: "Shot map" } },
      { at: 400, label: { ja: "まとめ", en: "Summary" } },
    ],
    transcriptExcerpt: {
      ja: "今季のシュート位置を見ると、ペナルティエリア内での本数が全体の78%を占めています。",
      en: "Looking at his shot map, 78% of his attempts come from inside the box.",
    },
    stamp: mockStamp,
  },
  {
    id: "v-clasico-preview",
    slug: "clasico-preview-video",
    kind: "long",
    title: {
      ja: "プレビュー｜今夜の直接対決を3つの数字で",
      en: "Preview: tonight's Clásico in three numbers",
    },
    description: {
      ja: "支配率・被シュート・セットプレー。試合前に押さえる3点。",
      en: "Possession, shots conceded, set pieces.",
    },
    sportId: "football",
    leagueId: "laliga",
    teamIds: ["t-real-madrid", "t-barcelona"],
    playerIds: [],
    matchId: "m-rma-bar",
    channel: { name: "SPORTS PORT データデスク（デモ）", official: false },
    publishedAt: publishedAt(4),
    durationSec: 396,
    stamp: mockStamp,
  },
  {
    id: "v-mensah-interview",
    slug: "mensah-interview",
    kind: "long",
    title: { ja: "インタビュー｜メンサが語る連続記録", en: "Interview: Mensah on the streak" },
    description: {
      ja: "8試合連続トリプルダブルについて本人が語ります。",
      en: "The man himself on eight straight triple-doubles.",
    },
    sportId: "basketball",
    leagueId: "nba",
    teamIds: ["t-nuggets"],
    playerIds: ["p-mensah"],
    channel: { name: "SPORTS PORT（デモ）", official: false },
    publishedAt: publishedAt(10),
    durationSec: 540,
    stamp: mockStamp,
  },
  {
    id: "v-f1-explainer",
    slug: "f1-2026-explainer",
    kind: "long",
    title: { ja: "解説｜2026年F1新規定を5分で", en: "Explainer: F1's 2026 rules in five minutes" },
    description: {
      ja: "パワーユニットと車体の変更点をまとめました。",
      en: "What changed in the power unit and the chassis.",
    },
    sportId: "f1",
    leagueId: "f1-championship",
    teamIds: [],
    playerIds: [],
    channel: { name: "SPORTS PORT（デモ）", official: false },
    publishedAt: publishedAt(45),
    durationSec: 312,
    stamp: mockStamp,
  },
  {
    id: "v-short-hale",
    slug: "hale-second-goal-short",
    kind: "short",
    title: { ja: "ヘイルの2点目（ショート）", en: "Hale's second (Short)" },
    description: { ja: "63分の勝ち越しゴール。", en: "The 63rd-minute winner." },
    sportId: "football",
    leagueId: "premier-league",
    teamIds: ["t-arsenal"],
    playerIds: ["p-hale"],
    matchId: "m-ars-liv",
    channel: { name: "SPORTS PORT（デモ）", official: false },
    publishedAt: publishedAt(1),
    durationSec: 42,
    stamp: mockStamp,
  },
  {
    id: "v-short-brooks",
    slug: "brooks-dagger-short",
    kind: "short",
    title: { ja: "ブルックスの決勝3P（ショート）", en: "Brooks' dagger three (Short)" },
    description: { ja: "残り2分10秒の一撃。", en: "With 2:10 to play." },
    sportId: "basketball",
    leagueId: "nba",
    teamIds: ["t-celtics"],
    playerIds: ["p-brooks"],
    matchId: "m-nyk-cel",
    channel: { name: "SPORTS PORT（デモ）", official: false },
    publishedAt: publishedAt(40),
    durationSec: 31,
    stamp: mockStamp,
  },
  {
    id: "v-short-okada",
    slug: "okada-equaliser-short",
    kind: "short",
    title: { ja: "岡田のミドルシュート（ショート）", en: "Okada's strike from range (Short)" },
    description: { ja: "39分の同点弾。", en: "The 39th-minute equaliser." },
    sportId: "football",
    leagueId: "j1-league",
    teamIds: ["t-kawasaki"],
    playerIds: ["p-okada"],
    matchId: "m-kaw-mar",
    channel: { name: "SPORTS PORT（デモ）", official: false },
    publishedAt: publishedAt(2),
    durationSec: 28,
    stamp: mockStamp,
  },
  {
    id: "v-short-zeta",
    slug: "zeta-clutch-short",
    kind: "short",
    title: { ja: "ZETAのクラッチラウンド（ショート）", en: "ZETA's clutch round (Short)" },
    description: { ja: "1マップ目を決めたラウンド。", en: "The round that sealed map one." },
    sportId: "esports",
    leagueId: "valorant-champions",
    teamIds: ["t-zeta"],
    playerIds: ["p-sato-e"],
    matchId: "m-zeta-sen",
    channel: { name: "SPORTS PORT（デモ）", official: false },
    publishedAt: publishedAt(3),
    durationSec: 35,
    stamp: mockStamp,
  },
];

export const videosById = new Map(videos.map((video) => [video.id, video]));

export function getVideo(id: string | undefined): VideoItem | undefined {
  if (!id) return undefined;
  return videosById.get(id);
}

export function getVideoBySlug(slug: string): VideoItem | undefined {
  return videos.find((video) => video.slug === slug);
}

export function longVideos(): VideoItem[] {
  return videos.filter((video) => video.kind === "long");
}

export function shortVideos(): VideoItem[] {
  return videos.filter((video) => video.kind === "short");
}

export function videosByTeam(teamId: string): VideoItem[] {
  return videos.filter((video) => video.teamIds.includes(teamId));
}

export function videosByPlayer(playerId: string): VideoItem[] {
  return videos.filter((video) => video.playerIds.includes(playerId));
}

export function videosByMatch(matchId: string): VideoItem[] {
  return videos.filter((video) => video.matchId === matchId);
}

export function videosByLeague(leagueId: string): VideoItem[] {
  return videos.filter((video) => video.leagueId === leagueId);
}
