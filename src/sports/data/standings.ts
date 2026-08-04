/**
 * 順位表（デモ）。
 *
 * 列の定義は sports.ts の standingsColumns 側にあり、ここは値だけを持ちます。
 * そのため競技を追加しても、順位表コンポーネントの改修は不要です。
 */
import type { DataStamp, Standing } from "../types";
import { minutesAfterReference } from "./clock";

const stamp: DataStamp = {
  provenance: "mock",
  source: "SPORTS PORT デモフィード",
  fetchedAt: minutesAfterReference(10 * 60 + 5),
  refreshIntervalSec: 3600,
};

export const standings: Standing[] = [
  {
    leagueId: "premier-league",
    rows: [
      {
        teamId: "t-arsenal",
        rank: 1,
        change: 0,
        values: {
          played: 25,
          won: 18,
          drawn: 4,
          lost: 3,
          goalsFor: 54,
          goalsAgainst: 21,
          goalDiff: 33,
          points: 58,
        },
        form: ["W", "W", "D", "W", "W"],
        zone: "champions",
      },
      {
        teamId: "t-liverpool",
        rank: 2,
        change: 1,
        values: {
          played: 25,
          won: 17,
          drawn: 5,
          lost: 3,
          goalsFor: 51,
          goalsAgainst: 24,
          goalDiff: 27,
          points: 56,
        },
        form: ["W", "D", "W", "W", "L"],
        zone: "champions",
      },
      {
        teamId: "t-man-city",
        rank: 3,
        change: -1,
        values: {
          played: 25,
          won: 16,
          drawn: 6,
          lost: 3,
          goalsFor: 49,
          goalsAgainst: 19,
          goalDiff: 30,
          points: 54,
        },
        form: ["D", "W", "W", "D", "W"],
        zone: "champions",
      },
      {
        teamId: "t-chelsea",
        rank: 4,
        change: 2,
        values: {
          played: 25,
          won: 14,
          drawn: 6,
          lost: 5,
          goalsFor: 43,
          goalsAgainst: 28,
          goalDiff: 15,
          points: 48,
        },
        form: ["W", "W", "L", "W", "D"],
        zone: "champions",
      },
      {
        teamId: "t-newcastle",
        rank: 5,
        change: 0,
        values: {
          played: 25,
          won: 13,
          drawn: 5,
          lost: 7,
          goalsFor: 42,
          goalsAgainst: 33,
          goalDiff: 9,
          points: 44,
        },
        form: ["W", "L", "W", "W", "D"],
        zone: "europa",
      },
      {
        teamId: "t-aston-villa",
        rank: 6,
        change: -2,
        values: {
          played: 25,
          won: 12,
          drawn: 6,
          lost: 7,
          goalsFor: 40,
          goalsAgainst: 34,
          goalDiff: 6,
          points: 42,
        },
        form: ["L", "W", "D", "W", "L"],
        zone: "europa",
      },
      {
        teamId: "t-man-united",
        rank: 7,
        change: 1,
        values: {
          played: 25,
          won: 11,
          drawn: 7,
          lost: 7,
          goalsFor: 36,
          goalsAgainst: 31,
          goalDiff: 5,
          points: 40,
        },
        form: ["D", "W", "W", "D", "L"],
      },
      {
        teamId: "t-tottenham",
        rank: 8,
        change: -1,
        values: {
          played: 25,
          won: 10,
          drawn: 6,
          lost: 9,
          goalsFor: 38,
          goalsAgainst: 36,
          goalDiff: 2,
          points: 36,
        },
        form: ["L", "D", "W", "L", "W"],
      },
    ],
    stamp,
  },
  {
    leagueId: "laliga",
    rows: [
      {
        teamId: "t-real-madrid",
        rank: 1,
        change: 0,
        values: {
          played: 24,
          won: 17,
          drawn: 4,
          lost: 3,
          goalsFor: 52,
          goalsAgainst: 20,
          goalDiff: 32,
          points: 55,
        },
        form: ["W", "W", "W", "D", "W"],
        zone: "champions",
      },
      {
        teamId: "t-barcelona",
        rank: 2,
        change: 0,
        values: {
          played: 24,
          won: 16,
          drawn: 5,
          lost: 3,
          goalsFor: 55,
          goalsAgainst: 25,
          goalDiff: 30,
          points: 53,
        },
        form: ["W", "D", "W", "W", "W"],
        zone: "champions",
      },
      {
        teamId: "t-atletico",
        rank: 3,
        change: 1,
        values: {
          played: 24,
          won: 14,
          drawn: 6,
          lost: 4,
          goalsFor: 41,
          goalsAgainst: 21,
          goalDiff: 20,
          points: 48,
        },
        form: ["D", "W", "W", "L", "W"],
        zone: "champions",
      },
      {
        teamId: "t-athletic",
        rank: 4,
        change: -1,
        values: {
          played: 24,
          won: 12,
          drawn: 7,
          lost: 5,
          goalsFor: 36,
          goalsAgainst: 24,
          goalDiff: 12,
          points: 43,
        },
        form: ["D", "W", "D", "W", "L"],
        zone: "champions",
      },
    ],
    stamp,
  },
  {
    leagueId: "j1-league",
    rows: [
      {
        teamId: "t-kawasaki",
        rank: 1,
        change: 1,
        values: {
          played: 20,
          won: 12,
          drawn: 5,
          lost: 3,
          goalsFor: 38,
          goalsAgainst: 20,
          goalDiff: 18,
          points: 41,
        },
        form: ["W", "D", "W", "W", "D"],
        zone: "champions",
      },
      {
        teamId: "t-vissel",
        rank: 2,
        change: -1,
        values: {
          played: 20,
          won: 12,
          drawn: 3,
          lost: 5,
          goalsFor: 34,
          goalsAgainst: 22,
          goalDiff: 12,
          points: 39,
        },
        form: ["W", "W", "L", "W", "W"],
        zone: "champions",
      },
      {
        teamId: "t-marinos",
        rank: 3,
        change: 0,
        values: {
          played: 20,
          won: 10,
          drawn: 6,
          lost: 4,
          goalsFor: 33,
          goalsAgainst: 24,
          goalDiff: 9,
          points: 36,
        },
        form: ["D", "W", "D", "L", "W"],
        zone: "playoff",
      },
      {
        teamId: "t-machida",
        rank: 4,
        change: 0,
        values: {
          played: 20,
          won: 9,
          drawn: 5,
          lost: 6,
          goalsFor: 26,
          goalsAgainst: 22,
          goalDiff: 4,
          points: 32,
        },
        form: ["L", "W", "W", "D", "L"],
        zone: "playoff",
      },
    ],
    stamp,
  },
  {
    leagueId: "nba",
    group: "Eastern Conference",
    rows: [
      {
        teamId: "t-celtics",
        rank: 1,
        change: 0,
        values: { won: 41, lost: 14, winPct: ".745", gamesBehind: "—", streak: "W3" },
        form: ["W", "W", "W", "L", "W"],
        zone: "playoff",
      },
      {
        teamId: "t-knicks",
        rank: 2,
        change: 0,
        values: { won: 36, lost: 19, winPct: ".655", gamesBehind: "5.0", streak: "L1" },
        form: ["L", "W", "W", "L", "W"],
        zone: "playoff",
      },
    ],
    stamp,
  },
  {
    leagueId: "nba",
    group: "Western Conference",
    rows: [
      {
        teamId: "t-nuggets",
        rank: 1,
        change: 1,
        values: { won: 38, lost: 17, winPct: ".691", gamesBehind: "—", streak: "W2" },
        form: ["W", "W", "L", "W", "W"],
        zone: "playoff",
      },
      {
        teamId: "t-lakers",
        rank: 2,
        change: -1,
        values: { won: 30, lost: 25, winPct: ".545", gamesBehind: "8.0", streak: "W1" },
        form: ["W", "L", "L", "W", "D"],
        zone: "playoff",
      },
    ],
    stamp,
  },
  {
    leagueId: "npb",
    group: "セントラル・リーグ",
    rows: [
      {
        teamId: "t-hanshin",
        rank: 1,
        change: 0,
        values: { won: 62, lost: 41, drawn: 3, winPct: ".602", gamesBehind: "—" },
        form: ["W", "W", "L", "W", "D"],
        zone: "playoff",
      },
    ],
    stamp,
  },
  {
    leagueId: "npb",
    group: "パシフィック・リーグ",
    rows: [
      {
        teamId: "t-hawks",
        rank: 1,
        change: 0,
        values: { won: 66, lost: 38, drawn: 2, winPct: ".635", gamesBehind: "—" },
        form: ["W", "W", "W", "L", "W"],
        zone: "playoff",
      },
    ],
    stamp,
  },
  {
    leagueId: "valorant-champions",
    group: "Group A",
    rows: [
      {
        teamId: "t-zeta",
        rank: 1,
        change: 1,
        values: { won: 4, lost: 1, mapDiff: "+5", points: 12 },
        form: ["W", "W", "L", "W", "W"],
        zone: "playoff",
      },
      {
        teamId: "t-sentinels",
        rank: 2,
        change: -1,
        values: { won: 3, lost: 2, mapDiff: "+2", points: 9 },
        form: ["W", "L", "W", "W", "L"],
        zone: "playoff",
      },
    ],
    stamp,
  },
  {
    leagueId: "nfl",
    group: "AFC West",
    rows: [
      {
        teamId: "t-chiefs",
        rank: 1,
        change: 0,
        values: { won: 13, lost: 4, tied: 0, winPct: ".765", pointsFor: 421, pointsAgainst: 328 },
        form: ["W", "W", "L", "W", "W"],
        zone: "playoff",
      },
      {
        teamId: "t-broncos",
        rank: 2,
        change: 0,
        values: { won: 9, lost: 8, tied: 0, winPct: ".529", pointsFor: 366, pointsAgainst: 351 },
        form: ["L", "W", "W", "L", "W"],
      },
    ],
    stamp,
  },
];

export function standingsByLeague(leagueId: string): Standing[] {
  return standings.filter((standing) => standing.leagueId === leagueId);
}

/** チームの現在順位（複数グループがある場合は最初に見つかったもの） */
export function rankOf(
  teamId: string,
): { rank: number; group?: string; leagueId: string } | undefined {
  for (const standing of standings) {
    const row = standing.rows.find((item) => item.teamId === teamId);
    if (row) return { rank: row.rank, group: standing.group, leagueId: standing.leagueId };
  }
  return undefined;
}

export function formOf(teamId: string): ("W" | "L" | "D" | "O")[] | undefined {
  for (const standing of standings) {
    const row = standing.rows.find((item) => item.teamId === teamId);
    if (row?.form) return row.form;
  }
  return undefined;
}
