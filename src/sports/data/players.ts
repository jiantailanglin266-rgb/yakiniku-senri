/**
 * 選手データ（デモ）。
 *
 * ■ 選手名はすべて架空です。
 *   実在の選手に架空の成績・移籍・負傷情報を結び付けないための判断です。
 *   実データAPIに接続すると、この配列は API 由来のレコードに置き換わります。
 * ■ 写真は掲載しません（肖像権・利用許諾が必要なため）。
 *   代わりにポジションとチームカラーからシルエットを生成して表示します。
 */
import type { DataStamp, Player } from "../types";
import { minutesAfterReference } from "./clock";

export const mockStamp: DataStamp = {
  provenance: "mock",
  source: "SPORTS PORT デモデータ",
  fetchedAt: minutesAfterReference(11 * 60 + 55),
  refreshIntervalSec: 0,
};

type Seed = Omit<Player, "stamp">;

const seeds: Seed[] = [
  {
    id: "p-hale",
    slug: "jordan-hale",
    sportId: "football",
    teamId: "t-arsenal",
    name: { ja: "ジョーダン・ヘイル", en: "Jordan Hale" },
    aliases: ["Jordan Hale", "ヘイル", "J. Hale"],
    nationality: "gb",
    birthDate: "2001-03-14",
    heightCm: 183,
    weightKg: 76,
    position: { ja: "フォワード", en: "Forward" },
    number: 9,
    seasonStats: [
      { key: "apps", label: { ja: "出場", en: "Apps" }, value: "24" },
      { key: "goals", label: { ja: "得点", en: "Goals" }, value: "14" },
      { key: "assists", label: { ja: "アシスト", en: "Assists" }, value: "6" },
      { key: "minutes", label: { ja: "出場時間", en: "Minutes" }, value: "1,982" },
    ],
    careerStats: [
      { key: "apps", label: { ja: "通算出場", en: "Career apps" }, value: "138" },
      { key: "goals", label: { ja: "通算得点", en: "Career goals" }, value: "61" },
    ],
    transfers: [{ season: "2024/25", from: "Redbridge Athletic", to: "Arsenal", type: "移籍" }],
    honours: [
      { year: "2025", title: { ja: "リーグ月間最優秀選手", en: "League Player of the Month" } },
    ],
  },
  {
    id: "p-okada",
    slug: "riku-okada",
    sportId: "football",
    teamId: "t-kawasaki",
    name: { ja: "岡田 陸", en: "Riku Okada" },
    aliases: ["岡田陸", "Riku Okada", "オカダ"],
    nationality: "jp",
    birthDate: "1999-07-02",
    heightCm: 176,
    weightKg: 70,
    position: { ja: "ミッドフィールダー", en: "Midfielder" },
    number: 8,
    seasonStats: [
      { key: "apps", label: { ja: "出場", en: "Apps" }, value: "21" },
      { key: "goals", label: { ja: "得点", en: "Goals" }, value: "5" },
      { key: "assists", label: { ja: "アシスト", en: "Assists" }, value: "9" },
      { key: "keyPasses", label: { ja: "キーパス／試合", en: "Key passes / match" }, value: "2.4" },
    ],
    careerStats: [
      { key: "apps", label: { ja: "通算出場", en: "Career apps" }, value: "164" },
      { key: "assists", label: { ja: "通算アシスト", en: "Career assists" }, value: "38" },
    ],
  },
  {
    id: "p-moreno",
    slug: "diego-moreno",
    sportId: "football",
    teamId: "t-real-madrid",
    name: { ja: "ディエゴ・モレーノ", en: "Diego Moreno" },
    aliases: ["Diego Moreno", "モレーノ"],
    nationality: "es",
    birthDate: "2003-01-22",
    heightCm: 179,
    weightKg: 72,
    position: { ja: "ウインガー", en: "Winger" },
    number: 11,
    seasonStats: [
      { key: "apps", label: { ja: "出場", en: "Apps" }, value: "26" },
      { key: "goals", label: { ja: "得点", en: "Goals" }, value: "11" },
      {
        key: "dribbles",
        label: { ja: "ドリブル成功／試合", en: "Dribbles / match" },
        value: "3.1",
      },
    ],
    careerStats: [{ key: "apps", label: { ja: "通算出場", en: "Career apps" }, value: "71" }],
  },
  {
    id: "p-ferreira",
    slug: "luca-ferreira",
    sportId: "football",
    teamId: "t-barcelona",
    name: { ja: "ルカ・フェレイラ", en: "Luca Ferreira" },
    aliases: ["Luca Ferreira", "フェレイラ"],
    nationality: "pt",
    birthDate: "1998-11-08",
    heightCm: 188,
    weightKg: 82,
    position: { ja: "センターバック", en: "Centre-back" },
    number: 4,
    seasonStats: [
      { key: "apps", label: { ja: "出場", en: "Apps" }, value: "25" },
      { key: "duels", label: { ja: "デュエル勝率", en: "Duel win %" }, value: "64%" },
      { key: "clearances", label: { ja: "クリア／試合", en: "Clearances / match" }, value: "4.8" },
    ],
    careerStats: [{ key: "apps", label: { ja: "通算出場", en: "Career apps" }, value: "212" }],
  },
  {
    id: "p-tanaka",
    slug: "sora-tanaka",
    sportId: "football",
    teamId: "t-marinos",
    name: { ja: "田中 空", en: "Sora Tanaka" },
    aliases: ["田中空", "Sora Tanaka"],
    nationality: "jp",
    birthDate: "2004-05-19",
    heightCm: 172,
    weightKg: 66,
    position: { ja: "フォワード", en: "Forward" },
    number: 19,
    seasonStats: [
      { key: "apps", label: { ja: "出場", en: "Apps" }, value: "18" },
      { key: "goals", label: { ja: "得点", en: "Goals" }, value: "8" },
    ],
    careerStats: [{ key: "apps", label: { ja: "通算出場", en: "Career apps" }, value: "34" }],
  },
  {
    id: "p-novak",
    slug: "marek-novak",
    sportId: "football",
    teamId: "t-man-city",
    name: { ja: "マレク・ノヴァーク", en: "Marek Novak" },
    aliases: ["Marek Novak", "ノヴァーク"],
    nationality: "cz",
    birthDate: "1997-02-27",
    heightCm: 191,
    weightKg: 85,
    position: { ja: "ゴールキーパー", en: "Goalkeeper" },
    number: 1,
    seasonStats: [
      { key: "apps", label: { ja: "出場", en: "Apps" }, value: "26" },
      { key: "cleanSheets", label: { ja: "クリーンシート", en: "Clean sheets" }, value: "11" },
      { key: "savePct", label: { ja: "セーブ率", en: "Save %" }, value: "74%" },
    ],
    careerStats: [{ key: "apps", label: { ja: "通算出場", en: "Career apps" }, value: "248" }],
  },
  {
    id: "p-brooks",
    slug: "aaron-brooks",
    sportId: "basketball",
    teamId: "t-celtics",
    name: { ja: "アーロン・ブルックス", en: "Aaron Brooks" },
    aliases: ["Aaron Brooks", "ブルックス"],
    nationality: "us",
    birthDate: "1999-09-30",
    heightCm: 201,
    weightKg: 98,
    position: { ja: "スモールフォワード", en: "Small forward" },
    number: 7,
    seasonStats: [
      { key: "ppg", label: { ja: "平均得点", en: "PPG" }, value: "24.8" },
      { key: "rpg", label: { ja: "平均リバウンド", en: "RPG" }, value: "7.1" },
      { key: "apg", label: { ja: "平均アシスト", en: "APG" }, value: "4.6" },
      { key: "fg", label: { ja: "FG成功率", en: "FG%" }, value: "48.2%" },
    ],
    careerStats: [
      { key: "games", label: { ja: "通算出場", en: "Career games" }, value: "412" },
      { key: "ppg", label: { ja: "通算平均得点", en: "Career PPG" }, value: "21.3" },
    ],
  },
  {
    id: "p-mensah",
    slug: "kofi-mensah",
    sportId: "basketball",
    teamId: "t-nuggets",
    name: { ja: "コフィ・メンサ", en: "Kofi Mensah" },
    aliases: ["Kofi Mensah", "メンサ"],
    nationality: "us",
    birthDate: "1996-12-11",
    heightCm: 211,
    weightKg: 113,
    position: { ja: "センター", en: "Center" },
    number: 15,
    seasonStats: [
      { key: "ppg", label: { ja: "平均得点", en: "PPG" }, value: "26.4" },
      { key: "rpg", label: { ja: "平均リバウンド", en: "RPG" }, value: "12.3" },
      { key: "apg", label: { ja: "平均アシスト", en: "APG" }, value: "8.9" },
    ],
    careerStats: [{ key: "games", label: { ja: "通算出場", en: "Career games" }, value: "538" }],
  },
  {
    id: "p-suzuki-b",
    slug: "kaito-suzuki",
    sportId: "basketball",
    teamId: "t-lakers",
    name: { ja: "鈴木 海斗", en: "Kaito Suzuki" },
    aliases: ["鈴木海斗", "Kaito Suzuki"],
    nationality: "jp",
    birthDate: "2002-04-03",
    heightCm: 193,
    weightKg: 88,
    position: { ja: "シューティングガード", en: "Shooting guard" },
    number: 24,
    seasonStats: [
      { key: "ppg", label: { ja: "平均得点", en: "PPG" }, value: "14.2" },
      { key: "threePct", label: { ja: "3P成功率", en: "3P%" }, value: "41.5%" },
    ],
    careerStats: [{ key: "games", label: { ja: "通算出場", en: "Career games" }, value: "96" }],
  },
  {
    id: "p-alvarez",
    slug: "mateo-alvarez",
    sportId: "baseball",
    teamId: "t-dodgers",
    name: { ja: "マテオ・アルバレス", en: "Mateo Álvarez" },
    aliases: ["Mateo Alvarez", "アルバレス"],
    nationality: "es",
    birthDate: "1997-06-16",
    heightCm: 186,
    weightKg: 92,
    position: { ja: "投手", en: "Pitcher" },
    number: 21,
    seasonStats: [
      { key: "era", label: { ja: "防御率", en: "ERA" }, value: "2.68" },
      { key: "so", label: { ja: "奪三振", en: "Strikeouts" }, value: "168" },
      { key: "whip", label: { ja: "WHIP", en: "WHIP" }, value: "1.04" },
    ],
    careerStats: [{ key: "wins", label: { ja: "通算勝利", en: "Career wins" }, value: "64" }],
  },
  {
    id: "p-mori",
    slug: "haruto-mori",
    sportId: "baseball",
    teamId: "t-hanshin",
    name: { ja: "森 陽翔", en: "Haruto Mori" },
    aliases: ["森陽翔", "Haruto Mori"],
    nationality: "jp",
    birthDate: "2000-08-25",
    heightCm: 180,
    weightKg: 84,
    position: { ja: "外野手", en: "Outfielder" },
    number: 5,
    seasonStats: [
      { key: "avg", label: { ja: "打率", en: "AVG" }, value: ".312" },
      { key: "hr", label: { ja: "本塁打", en: "HR" }, value: "18" },
      { key: "rbi", label: { ja: "打点", en: "RBI" }, value: "61" },
    ],
    careerStats: [{ key: "hits", label: { ja: "通算安打", en: "Career hits" }, value: "548" }],
  },
  {
    id: "p-yamada",
    slug: "ren-yamada",
    sportId: "baseball",
    teamId: "t-hawks",
    name: { ja: "山田 蓮", en: "Ren Yamada" },
    aliases: ["山田蓮", "Ren Yamada"],
    nationality: "jp",
    birthDate: "1998-02-09",
    heightCm: 178,
    weightKg: 80,
    position: { ja: "捕手", en: "Catcher" },
    number: 27,
    seasonStats: [
      { key: "avg", label: { ja: "打率", en: "AVG" }, value: ".284" },
      { key: "caught", label: { ja: "盗塁阻止率", en: "Caught stealing %" }, value: "38%" },
    ],
    careerStats: [{ key: "games", label: { ja: "通算出場", en: "Career games" }, value: "702" }],
  },
  {
    id: "p-kowalski",
    slug: "adam-kowalski",
    sportId: "american-football",
    teamId: "t-chiefs",
    name: { ja: "アダム・コワルスキー", en: "Adam Kowalski" },
    aliases: ["Adam Kowalski", "コワルスキー"],
    nationality: "us",
    birthDate: "1996-10-05",
    heightCm: 190,
    weightKg: 102,
    position: { ja: "クォーターバック", en: "Quarterback" },
    number: 12,
    seasonStats: [
      { key: "yds", label: { ja: "パスヤード", en: "Passing yards" }, value: "3,842" },
      { key: "td", label: { ja: "タッチダウンパス", en: "Passing TDs" }, value: "29" },
      { key: "int", label: { ja: "インターセプト", en: "Interceptions" }, value: "8" },
    ],
    careerStats: [
      { key: "yds", label: { ja: "通算パスヤード", en: "Career yards" }, value: "28,110" },
    ],
  },
  {
    id: "p-sato-e",
    slug: "yuma-sato",
    sportId: "esports",
    teamId: "t-zeta",
    name: { ja: "佐藤 悠真", en: "Yuma Sato" },
    aliases: ["佐藤悠真", "Yuma Sato", "YUMA"],
    nationality: "jp",
    birthDate: "2003-09-12",
    position: { ja: "デュエリスト", en: "Duelist" },
    seasonStats: [
      { key: "acs", label: { ja: "平均コンバットスコア", en: "ACS" }, value: "248" },
      { key: "kd", label: { ja: "K/D", en: "K/D" }, value: "1.24" },
    ],
    careerStats: [{ key: "maps", label: { ja: "通算マップ数", en: "Maps played" }, value: "312" }],
  },
  {
    id: "p-lee",
    slug: "minjun-lee",
    sportId: "esports",
    teamId: "t-sentinels",
    name: { ja: "イ・ミンジュン", en: "Minjun Lee" },
    aliases: ["Minjun Lee", "ミンジュン", "MJ"],
    nationality: "kr",
    birthDate: "2002-01-30",
    position: { ja: "コントローラー", en: "Controller" },
    seasonStats: [
      { key: "acs", label: { ja: "平均コンバットスコア", en: "ACS" }, value: "212" },
      { key: "assists", label: { ja: "平均アシスト", en: "Assists / map" }, value: "6.8" },
    ],
    careerStats: [{ key: "maps", label: { ja: "通算マップ数", en: "Maps played" }, value: "289" }],
  },
  {
    // 個人競技のため所属チームは持ちません（teamId は任意項目）
    id: "p-dubois",
    slug: "camille-dubois",
    sportId: "tennis",
    name: { ja: "カミーユ・デュボワ", en: "Camille Dubois" },
    aliases: ["Camille Dubois", "デュボワ"],
    nationality: "fr",
    birthDate: "2000-03-08",
    heightCm: 175,
    position: { ja: "シングルス", en: "Singles" },
    seasonStats: [
      { key: "titles", label: { ja: "優勝", en: "Titles" }, value: "3" },
      { key: "winRate", label: { ja: "勝率", en: "Win rate" }, value: "72%" },
      { key: "aces", label: { ja: "エース／試合", en: "Aces / match" }, value: "6.4" },
    ],
    careerStats: [{ key: "titles", label: { ja: "通算優勝", en: "Career titles" }, value: "9" }],
  },
];

export const players: Player[] = seeds.map((seed) => ({ ...seed, stamp: mockStamp }));

export const playersById = new Map(players.map((player) => [player.id, player]));

export function getPlayer(id: string | undefined): Player | undefined {
  if (!id) return undefined;
  return playersById.get(id);
}

export function getPlayerBySlug(slug: string): Player | undefined {
  return players.find((player) => player.slug === slug);
}

export function playersByTeam(teamId: string): Player[] {
  return players.filter((player) => player.teamId === teamId);
}

export function playersBySport(sportId: string): Player[] {
  return players.filter((player) => player.sportId === sportId);
}
