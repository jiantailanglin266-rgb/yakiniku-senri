/**
 * 試合データ（デモ）。
 *
 * スコア・スタッツ・タイムラインはすべてデモ用の値です（stamp.provenance = "mock"）。
 * 実APIに接続した場合は lib/api/matches.ts が同じ形へ正規化して返します。
 *
 * 開始時刻はビルド日を基準に組み立てているため、
 * デプロイした日に「今日の試合」が今日として並びます（clock.ts 参照）。
 */
import type { DataStamp, Match } from "../types";
import { at, minutesAfterReference } from "./clock";

/** ライブ更新のスタンプ。表示の「更新間隔」と実際のポーリング間隔は必ず一致させます。 */
const liveStamp = (refreshIntervalSec: number): DataStamp => ({
  provenance: "mock",
  source: "SPORTS PORT デモフィード",
  fetchedAt: minutesAfterReference(12 * 60 + 39),
  refreshIntervalSec,
});

const finishedStamp: DataStamp = {
  provenance: "mock",
  source: "SPORTS PORT デモフィード",
  fetchedAt: minutesAfterReference(9 * 60),
  refreshIntervalSec: 0,
};

const scheduledStamp: DataStamp = {
  provenance: "mock",
  source: "SPORTS PORT デモフィード",
  fetchedAt: minutesAfterReference(11 * 60 + 30),
  refreshIntervalSec: 300,
};

export const matches: Match[] = [
  // ------------------------------------------------------------------
  // 試合中
  // ------------------------------------------------------------------
  {
    id: "m-ars-liv",
    slug: "arsenal-vs-liverpool",
    sportId: "football",
    leagueId: "premier-league",
    season: "2025/26",
    round: { ja: "第26節", en: "Matchweek 26" },
    kickoff: at(0, 11, 30),
    status: "live",
    clock: "67'",
    venueId: "v-emirates",
    homeTeamId: "t-arsenal",
    awayTeamId: "t-liverpool",
    homeScore: 2,
    awayScore: 1,
    periodScores: [
      { label: "1H", home: 1, away: 1 },
      { label: "2H", home: 1, away: 0 },
    ],
    events: [
      {
        id: "e1",
        clock: "12'",
        type: "goal",
        side: "home",
        playerId: "p-hale",
        text: { ja: "ヘイルが右足で先制", en: "Hale opens the scoring" },
      },
      {
        id: "e2",
        clock: "31'",
        type: "yellow",
        side: "away",
        text: { ja: "アウェイ側に警告", en: "Booking for the away side" },
      },
      {
        id: "e3",
        clock: "44'",
        type: "goal",
        side: "away",
        text: { ja: "セットプレーから同点", en: "Equaliser from a set piece" },
      },
      {
        id: "e4",
        clock: "45+2'",
        type: "period",
        side: "neutral",
        text: { ja: "ハーフタイム", en: "Half time" },
      },
      {
        id: "e5",
        clock: "58'",
        type: "substitution",
        side: "home",
        text: { ja: "ホーム、2枚替え", en: "Double change for the hosts" },
      },
      {
        id: "e6",
        clock: "63'",
        type: "goal",
        side: "home",
        playerId: "p-hale",
        text: { ja: "ヘイル、この試合2点目", en: "Hale grabs his second" },
      },
    ],
    statistics: [
      { key: "possession", home: 54, away: 46 },
      { key: "shots", home: 13, away: 9 },
      { key: "shotsOnTarget", home: 6, away: 3 },
      { key: "corners", home: 5, away: 4 },
      { key: "fouls", home: 8, away: 11 },
      { key: "passAccuracy", home: 87, away: 83 },
    ],
    lineups: {
      home: [
        {
          playerId: "p-hale",
          name: "ジョーダン・ヘイル",
          number: 9,
          position: "FW",
          starter: true,
        },
        { name: "T. ウォード", number: 6, position: "MF", starter: true },
        { name: "S. ベネット", number: 4, position: "DF", starter: true },
        { name: "M. カーター", number: 1, position: "GK", starter: true },
        { name: "R. フィッシャー", number: 17, position: "MF", starter: false },
      ],
      away: [
        { name: "D. ホワイト", number: 10, position: "FW", starter: true },
        { name: "P. オコンネル", number: 8, position: "MF", starter: true },
        { name: "L. グラント", number: 5, position: "DF", starter: true },
        { name: "K. ラッセル", number: 13, position: "GK", starter: true },
      ],
    },
    broadcastIds: ["stream-global-football", "stream-allsports"],
    preview: {
      ja: "上位対決。ホームは直近5試合で4勝、セットプレーからの得点が全体の4割を占めます。アウェイは前線からのプレスで主導権を握りたいところです。",
      en: "A top-of-the-table clash. The hosts have won four of five, with 40% of their goals from set pieces.",
    },
    stamp: liveStamp(30),
  },
  {
    id: "m-cel-den",
    slug: "boston-celtics-vs-denver-nuggets",
    sportId: "basketball",
    leagueId: "nba",
    season: "2025-26",
    round: { ja: "レギュラーシーズン", en: "Regular season" },
    kickoff: at(0, 11, 0),
    status: "live",
    clock: "Q3 4:21",
    venueId: "v-td-garden",
    homeTeamId: "t-celtics",
    awayTeamId: "t-nuggets",
    homeScore: 78,
    awayScore: 82,
    periodScores: [
      { label: "Q1", home: 27, away: 24 },
      { label: "Q2", home: 22, away: 29 },
      { label: "Q3", home: 29, away: 29 },
    ],
    events: [
      {
        id: "e1",
        clock: "Q1 9:40",
        type: "score",
        side: "home",
        playerId: "p-brooks",
        text: { ja: "ブルックスの3ポイント", en: "Brooks hits from deep" },
      },
      {
        id: "e2",
        clock: "Q2 5:12",
        type: "timeout",
        side: "home",
        text: { ja: "ホーム、タイムアウト", en: "Timeout, home" },
      },
      {
        id: "e3",
        clock: "Q3 6:02",
        type: "score",
        side: "away",
        playerId: "p-mensah",
        text: { ja: "メンサ、この日24点目", en: "Mensah up to 24 points" },
      },
    ],
    statistics: [
      { key: "fieldGoalPct", home: 46, away: 50 },
      { key: "threePointPct", home: 37, away: 41 },
      { key: "rebounds", home: 33, away: 38 },
      { key: "assists", home: 19, away: 24 },
      { key: "turnovers", home: 11, away: 8 },
    ],
    broadcastIds: ["stream-hoops-pass", "stream-allsports"],
    stamp: liveStamp(15),
  },
  {
    id: "m-kaw-mar",
    slug: "kawasaki-frontale-vs-yokohama-f-marinos",
    sportId: "football",
    leagueId: "j1-league",
    season: "2026",
    round: { ja: "第21節", en: "Matchweek 21" },
    kickoff: at(0, 10, 0),
    status: "break",
    clock: "HT",
    venueId: "v-todoroki",
    homeTeamId: "t-kawasaki",
    awayTeamId: "t-marinos",
    homeScore: 1,
    awayScore: 1,
    periodScores: [{ label: "1H", home: 1, away: 1 }],
    events: [
      {
        id: "e1",
        clock: "23'",
        type: "goal",
        side: "away",
        playerId: "p-tanaka",
        text: { ja: "田中が抜け出して先制", en: "Tanaka races clear to score" },
      },
      {
        id: "e2",
        clock: "39'",
        type: "goal",
        side: "home",
        playerId: "p-okada",
        text: { ja: "岡田、ミドルシュートで同点", en: "Okada levels from range" },
      },
      {
        id: "e3",
        clock: "45+1'",
        type: "period",
        side: "neutral",
        text: { ja: "ハーフタイム", en: "Half time" },
      },
    ],
    statistics: [
      { key: "possession", home: 58, away: 42 },
      { key: "shots", home: 7, away: 5 },
      { key: "shotsOnTarget", home: 3, away: 2 },
      { key: "corners", home: 3, away: 1 },
      { key: "fouls", home: 5, away: 7 },
      { key: "passAccuracy", home: 85, away: 79 },
    ],
    broadcastIds: ["stream-jsports-plus"],
    stamp: liveStamp(30),
  },
  {
    id: "m-zeta-sen",
    slug: "zeta-division-vs-sentinels",
    sportId: "esports",
    leagueId: "valorant-champions",
    season: "2026",
    round: { ja: "グループステージ", en: "Group stage" },
    kickoff: at(0, 12, 0),
    status: "live",
    clock: "MAP 2",
    venueId: "v-online",
    homeTeamId: "t-zeta",
    awayTeamId: "t-sentinels",
    homeScore: 1,
    awayScore: 0,
    periodScores: [
      { label: "MAP1", home: "13", away: "9" },
      { label: "MAP2", home: "7", away: "6" },
    ],
    events: [
      {
        id: "e1",
        clock: "MAP1",
        type: "score",
        side: "home",
        playerId: "p-sato-e",
        text: { ja: "ZETAが1マップ目を先取", en: "ZETA take the opening map" },
      },
      {
        id: "e2",
        clock: "MAP2 R13",
        type: "info",
        side: "neutral",
        text: { ja: "サイド交代", en: "Side switch" },
      },
    ],
    statistics: [
      { key: "kills", home: 42, away: 38 },
      { key: "deaths", home: 38, away: 42 },
      { key: "objectives", home: 6, away: 5 },
    ],
    broadcastIds: ["stream-arena-gg"],
    stamp: liveStamp(10),
  },

  // ------------------------------------------------------------------
  // 本日開催予定
  // ------------------------------------------------------------------
  {
    id: "m-rma-bar",
    slug: "real-madrid-vs-fc-barcelona",
    sportId: "football",
    leagueId: "laliga",
    season: "2025/26",
    round: { ja: "第25節", en: "Matchweek 25" },
    kickoff: at(0, 19, 0),
    status: "scheduled",
    venueId: "v-bernabeu",
    homeTeamId: "t-real-madrid",
    awayTeamId: "t-barcelona",
    homeScore: null,
    awayScore: null,
    events: [],
    predictedLineup: true,
    lineups: {
      home: [
        {
          playerId: "p-moreno",
          name: "ディエゴ・モレーノ",
          number: 11,
          position: "WG",
          starter: true,
        },
        { name: "A. ロペス", number: 6, position: "MF", starter: true },
        { name: "J. サンチェス", number: 3, position: "DF", starter: true },
      ],
      away: [
        {
          playerId: "p-ferreira",
          name: "ルカ・フェレイラ",
          number: 4,
          position: "DF",
          starter: true,
        },
        { name: "N. トーレス", number: 9, position: "FW", starter: true },
        { name: "V. ロメロ", number: 8, position: "MF", starter: true },
      ],
    },
    broadcastIds: ["stream-global-football"],
    preview: {
      ja: "今季2度目の直接対決。ホームは前回対戦で敗れており、中盤の主導権をどう取り戻すかが焦点です。アウェイは前線の高い位置でのプレスが機能しています。",
      en: "The second meeting of the season. The hosts lost the first and must win the midfield battle.",
    },
    stamp: scheduledStamp,
  },
  {
    id: "m-mci-mun",
    slug: "manchester-city-vs-manchester-united",
    sportId: "football",
    leagueId: "premier-league",
    season: "2025/26",
    round: { ja: "第26節", en: "Matchweek 26" },
    kickoff: at(0, 16, 30),
    status: "scheduled",
    venueId: "v-etihad",
    homeTeamId: "t-man-city",
    awayTeamId: "t-man-united",
    homeScore: null,
    awayScore: null,
    events: [],
    broadcastIds: ["stream-global-football", "stream-allsports"],
    preview: {
      ja: "マンチェスター・ダービー。ホームはリーグ最少失点、アウェイはカウンターからの得点が多く、対照的なスタイルの対決になります。",
      en: "The Manchester derby: the league's meanest defence against the sharpest counter-attack.",
    },
    stamp: scheduledStamp,
  },
  {
    id: "m-lal-nyk",
    slug: "los-angeles-lakers-vs-new-york-knicks",
    sportId: "basketball",
    leagueId: "nba",
    season: "2025-26",
    round: { ja: "レギュラーシーズン", en: "Regular season" },
    kickoff: at(0, 21, 0),
    status: "scheduled",
    venueId: "v-crypto-arena",
    homeTeamId: "t-lakers",
    awayTeamId: "t-knicks",
    homeScore: null,
    awayScore: null,
    events: [],
    broadcastIds: ["stream-hoops-pass"],
    stamp: scheduledStamp,
  },
  {
    id: "m-han-haw",
    slug: "hanshin-tigers-vs-fukuoka-softbank-hawks",
    sportId: "baseball",
    leagueId: "npb",
    season: "2026",
    round: { ja: "交流戦", en: "Interleague" },
    kickoff: at(0, 9, 0),
    status: "scheduled",
    venueId: "v-koshien",
    homeTeamId: "t-hanshin",
    awayTeamId: "t-hawks",
    homeScore: null,
    awayScore: null,
    events: [],
    broadcastIds: ["stream-jsports-plus", "stream-allsports"],
    stamp: scheduledStamp,
  },
  {
    id: "m-che-tot",
    slug: "chelsea-vs-tottenham-hotspur",
    sportId: "football",
    leagueId: "premier-league",
    season: "2025/26",
    round: { ja: "第26節", en: "Matchweek 26" },
    kickoff: at(0, 14, 0),
    status: "scheduled",
    venueId: "v-stamford-bridge",
    homeTeamId: "t-chelsea",
    awayTeamId: "t-tottenham",
    homeScore: null,
    awayScore: null,
    events: [],
    broadcastIds: ["stream-global-football"],
    stamp: scheduledStamp,
  },

  // ------------------------------------------------------------------
  // 終了
  // ------------------------------------------------------------------
  {
    id: "m-new-avl",
    slug: "newcastle-united-vs-aston-villa",
    sportId: "football",
    leagueId: "premier-league",
    season: "2025/26",
    round: { ja: "第25節", en: "Matchweek 25" },
    kickoff: at(-1, 15, 0),
    status: "finished",
    venueId: "v-st-james",
    homeTeamId: "t-newcastle",
    awayTeamId: "t-aston-villa",
    homeScore: 3,
    awayScore: 2,
    periodScores: [
      { label: "1H", home: 2, away: 1 },
      { label: "2H", home: 1, away: 1 },
    ],
    events: [
      {
        id: "e1",
        clock: "9'",
        type: "goal",
        side: "home",
        text: { ja: "ホームが早い時間に先制", en: "Early opener for the hosts" },
      },
      {
        id: "e2",
        clock: "27'",
        type: "goal",
        side: "away",
        text: { ja: "アウェイが追いつく", en: "Away side level" },
      },
      {
        id: "e3",
        clock: "41'",
        type: "goal",
        side: "home",
        text: { ja: "カウンターから勝ち越し", en: "Hosts ahead on the break" },
      },
      {
        id: "e4",
        clock: "72'",
        type: "goal",
        side: "home",
        text: { ja: "PKで3点目", en: "Third from the spot" },
      },
      {
        id: "e5",
        clock: "88'",
        type: "goal",
        side: "away",
        text: { ja: "1点差に迫る", en: "Back to within one" },
      },
    ],
    statistics: [
      { key: "possession", home: 44, away: 56 },
      { key: "shots", home: 12, away: 17 },
      { key: "shotsOnTarget", home: 7, away: 6 },
      { key: "corners", home: 4, away: 8 },
      { key: "fouls", home: 12, away: 9 },
      { key: "passAccuracy", home: 78, away: 86 },
    ],
    broadcastIds: ["stream-global-football"],
    highlightVideoId: "v-new-avl-highlights",
    report: {
      ja: "支配率で上回ったアウェイに対し、ホームは3本のカウンターを確実に決めました。前半のうちに2点を奪えたことが、そのまま試合を決めています。",
      en: "The visitors held the ball but the hosts converted three counters — the two first-half goals proved decisive.",
    },
    stamp: finishedStamp,
  },
  {
    id: "m-ath-atm",
    slug: "athletic-club-vs-atletico-madrid",
    sportId: "football",
    leagueId: "laliga",
    season: "2025/26",
    round: { ja: "第24節", en: "Matchweek 24" },
    kickoff: at(-1, 18, 0),
    status: "finished",
    venueId: "v-san-mames",
    homeTeamId: "t-athletic",
    awayTeamId: "t-atletico",
    homeScore: 1,
    awayScore: 1,
    periodScores: [
      { label: "1H", home: 0, away: 1 },
      { label: "2H", home: 1, away: 0 },
    ],
    events: [
      {
        id: "e1",
        clock: "35'",
        type: "goal",
        side: "away",
        text: { ja: "アウェイが先制", en: "Visitors ahead" },
      },
      {
        id: "e2",
        clock: "77'",
        type: "goal",
        side: "home",
        text: { ja: "終盤に同点", en: "Late leveller" },
      },
    ],
    statistics: [
      { key: "possession", home: 51, away: 49 },
      { key: "shots", home: 14, away: 10 },
      { key: "shotsOnTarget", home: 4, away: 4 },
      { key: "corners", home: 7, away: 3 },
      { key: "fouls", home: 14, away: 16 },
      { key: "passAccuracy", home: 81, away: 82 },
    ],
    broadcastIds: ["stream-global-football"],
    stamp: finishedStamp,
  },
  {
    id: "m-nyk-cel",
    slug: "new-york-knicks-vs-boston-celtics",
    sportId: "basketball",
    leagueId: "nba",
    season: "2025-26",
    round: { ja: "レギュラーシーズン", en: "Regular season" },
    kickoff: at(-2, 0, 30),
    status: "finished",
    venueId: "v-msg",
    homeTeamId: "t-knicks",
    awayTeamId: "t-celtics",
    homeScore: 108,
    awayScore: 114,
    periodScores: [
      { label: "Q1", home: 25, away: 31 },
      { label: "Q2", home: 28, away: 26 },
      { label: "Q3", home: 26, away: 30 },
      { label: "Q4", home: 29, away: 27 },
    ],
    events: [
      {
        id: "e1",
        clock: "Q4 2:10",
        type: "score",
        side: "away",
        playerId: "p-brooks",
        text: { ja: "ブルックスが勝負を決める3ポイント", en: "Brooks with the dagger" },
      },
    ],
    statistics: [
      { key: "fieldGoalPct", home: 44, away: 49 },
      { key: "threePointPct", home: 33, away: 40 },
      { key: "rebounds", home: 41, away: 45 },
      { key: "assists", home: 21, away: 27 },
      { key: "turnovers", home: 14, away: 10 },
    ],
    broadcastIds: ["stream-hoops-pass"],
    highlightVideoId: "v-nyk-cel-highlights",
    stamp: finishedStamp,
  },
  {
    id: "m-vis-mac",
    slug: "vissel-kobe-vs-fc-machida-zelvia",
    sportId: "football",
    leagueId: "j1-league",
    season: "2026",
    round: { ja: "第20節", en: "Matchweek 20" },
    kickoff: at(-3, 10, 0),
    status: "finished",
    venueId: "v-noevir",
    homeTeamId: "t-vissel",
    awayTeamId: "t-machida",
    homeScore: 2,
    awayScore: 0,
    periodScores: [
      { label: "1H", home: 1, away: 0 },
      { label: "2H", home: 1, away: 0 },
    ],
    events: [
      {
        id: "e1",
        clock: "18'",
        type: "goal",
        side: "home",
        text: { ja: "クロスから頭で先制", en: "Header from the cross" },
      },
      {
        id: "e2",
        clock: "69'",
        type: "goal",
        side: "home",
        text: { ja: "追加点", en: "Second for the hosts" },
      },
    ],
    statistics: [
      { key: "possession", home: 47, away: 53 },
      { key: "shots", home: 11, away: 8 },
      { key: "shotsOnTarget", home: 5, away: 2 },
      { key: "corners", home: 4, away: 5 },
      { key: "fouls", home: 9, away: 12 },
      { key: "passAccuracy", home: 80, away: 84 },
    ],
    broadcastIds: ["stream-jsports-plus"],
    stamp: finishedStamp,
  },
  {
    id: "m-kc-den-nfl",
    slug: "kansas-city-chiefs-vs-denver-broncos",
    sportId: "american-football",
    leagueId: "nfl",
    season: "2025",
    round: { ja: "プレーオフ", en: "Play-offs" },
    kickoff: at(-4, 20, 0),
    status: "finished",
    venueId: "v-arrowhead",
    homeTeamId: "t-chiefs",
    awayTeamId: "t-broncos",
    homeScore: 27,
    awayScore: 24,
    periodScores: [
      { label: "Q1", home: 7, away: 3 },
      { label: "Q2", home: 3, away: 14 },
      { label: "Q3", home: 10, away: 0 },
      { label: "Q4", home: 7, away: 7 },
    ],
    events: [
      {
        id: "e1",
        clock: "Q4 0:42",
        type: "score",
        side: "home",
        playerId: "p-kowalski",
        text: { ja: "コワルスキーの決勝タッチダウンパス", en: "Kowalski finds the winner" },
      },
    ],
    statistics: [
      { key: "totalYards", home: 388, away: 351 },
      { key: "passingYards", home: 274, away: 236 },
      { key: "rushingYards", home: 114, away: 115 },
      { key: "turnovers", home: 1, away: 2 },
      { key: "thirdDownPct", home: 47, away: 38 },
    ],
    broadcastIds: ["stream-gridiron-now"],
    stamp: finishedStamp,
  },

  // ------------------------------------------------------------------
  // 明日以降 / 延期
  // ------------------------------------------------------------------
  {
    id: "m-liv-che",
    slug: "liverpool-vs-chelsea",
    sportId: "football",
    leagueId: "premier-league",
    season: "2025/26",
    round: { ja: "第27節", en: "Matchweek 27" },
    kickoff: at(1, 15, 0),
    status: "scheduled",
    venueId: "v-anfield",
    homeTeamId: "t-liverpool",
    awayTeamId: "t-chelsea",
    homeScore: null,
    awayScore: null,
    events: [],
    broadcastIds: ["stream-global-football", "stream-allsports"],
    stamp: scheduledStamp,
  },
  {
    id: "m-bar-atm",
    slug: "fc-barcelona-vs-atletico-madrid",
    sportId: "football",
    leagueId: "laliga",
    season: "2025/26",
    round: { ja: "第26節", en: "Matchweek 26" },
    kickoff: at(2, 20, 0),
    status: "scheduled",
    venueId: "v-camp-nou",
    homeTeamId: "t-barcelona",
    awayTeamId: "t-atletico",
    homeScore: null,
    awayScore: null,
    events: [],
    broadcastIds: ["stream-global-football"],
    stamp: scheduledStamp,
  },
  {
    id: "m-mun-new",
    slug: "manchester-united-vs-newcastle-united",
    sportId: "football",
    leagueId: "premier-league",
    season: "2025/26",
    round: { ja: "第27節", en: "Matchweek 27" },
    kickoff: at(1, 12, 0),
    status: "postponed",
    venueId: "v-old-trafford",
    homeTeamId: "t-man-united",
    awayTeamId: "t-newcastle",
    homeScore: null,
    awayScore: null,
    events: [
      {
        id: "e1",
        clock: "—",
        type: "info",
        side: "neutral",
        text: {
          ja: "悪天候のため延期。振替日は未定です。",
          en: "Postponed due to weather. A new date has not been announced.",
        },
      },
    ],
    broadcastIds: [],
    stamp: scheduledStamp,
  },
];

export const matchesById = new Map(matches.map((match) => [match.id, match]));

export function getMatch(id: string | undefined): Match | undefined {
  if (!id) return undefined;
  return matchesById.get(id);
}

export function getMatchBySlug(slug: string): Match | undefined {
  return matches.find((match) => match.slug === slug);
}

export const liveStatuses: Match["status"][] = ["live", "break", "extra"];

export function isLive(match: Match): boolean {
  return liveStatuses.includes(match.status);
}

export function liveMatches(): Match[] {
  return matches.filter(isLive);
}

export function matchesByLeague(leagueId: string): Match[] {
  return matches.filter((match) => match.leagueId === leagueId);
}

export function matchesBySport(sportId: string): Match[] {
  return matches.filter((match) => match.sportId === sportId);
}

export function matchesByTeam(teamId: string): Match[] {
  return matches.filter((match) => match.homeTeamId === teamId || match.awayTeamId === teamId);
}

/** 開始時刻の昇順 */
export function byKickoffAsc(a: Match, b: Match): number {
  return a.kickoff.localeCompare(b.kickoff);
}

/** 開始時刻の降順 */
export function byKickoffDesc(a: Match, b: Match): number {
  return b.kickoff.localeCompare(a.kickoff);
}
