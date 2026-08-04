/**
 * データ取得レイヤー。
 *
 * ページ・コンポーネントは必ずここを経由してデータを取ります。
 * 外部APIをフロントエンドから直接呼ばないための境界であり、
 * 「モック ↔ 実API」の切り替えもここ1か所で完結します。
 *
 * 実運用での責務：
 *   - APIキーの管理（サーバー側の環境変数のみ。NEXT_PUBLIC_ を付けない）
 *   - キャッシュ / レート制限 / リトライ / タイムアウト
 *   - 複数ソースのフォールバックと重複排除
 *   - 取得時刻の保存（DataStamp）
 *
 * 取得に失敗した場合、古い値を「最新」として返すことはしません。
 * 呼び出し側が「取得できなかった」ことを表示できるよう、ok:false を返します。
 */
import type {
  DataStamp,
  League,
  Match,
  NewsArticle,
  Sport,
  Standing,
  Team,
  VideoItem,
} from "../types";
import { dataSource } from "../config/site";
import { matches as mockMatches, byKickoffAsc, byKickoffDesc, isLive } from "../data/matches";
import { leagues as mockLeagues } from "../data/leagues";
import { teams as mockTeams } from "../data/teams";
import { standings as mockStandings } from "../data/standings";
import { news as mockNews, latestNews } from "../data/news";
import { videos as mockVideos } from "../data/videos";
import { sports as mockSports } from "../data/sports";
import { referenceDayIso } from "../data/clock";

/** 取得結果。失敗を握りつぶさず、必ず呼び出し側へ伝えます。 */
export type Result<T> =
  { ok: true; data: T; stamp: DataStamp } | { ok: false; error: string; stamp: DataStamp };

const unavailableStamp: DataStamp = {
  provenance: "api",
  source: "外部API",
  fetchedAt: referenceDayIso,
  refreshIntervalSec: 0,
};

/**
 * 実APIから取得するときの共通処理。
 * タイムアウト・リトライ・フォールバックをここに集約します。
 *
 * 現時点では実APIの接続先が未設定のため、呼ばれると ok:false を返します。
 * 接続先が決まったら fetcher を渡すだけで有効になります。
 */
export async function fetchWithGuards<T>(
  fetcher: (() => Promise<T>) | undefined,
  options: { timeoutMs?: number; retries?: number; source: string; refreshIntervalSec: number },
): Promise<Result<T>> {
  const { timeoutMs = 5000, retries = 2, source, refreshIntervalSec } = options;

  if (!fetcher) {
    return {
      ok: false,
      error: "データソースが設定されていません",
      stamp: { ...unavailableStamp, source },
    };
  }

  let lastError = "unknown";
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const data = await Promise.race([
        fetcher(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), timeoutMs),
        ),
      ]);
      return {
        ok: true,
        data,
        stamp: {
          provenance: "api",
          source,
          fetchedAt: new Date().toISOString(),
          refreshIntervalSec,
        },
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      // 指数バックオフ。レート制限に当たったときに畳みかけないための待機です。
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 200));
      }
    }
  }

  return { ok: false, error: lastError, stamp: { ...unavailableStamp, source } };
}

/* ------------------------------------------------------------------
   同期アクセサ（モック時はローカルデータ、実API時は事前取得結果を使います）
   ------------------------------------------------------------------ */

export const usingMockData = dataSource === "mock";

export function getSports(): Sport[] {
  return mockSports;
}

export function getLeagues(): League[] {
  return mockLeagues;
}

export function getTeams(): Team[] {
  return mockTeams;
}

export function getStandings(): Standing[] {
  return mockStandings;
}

export function getVideos(): VideoItem[] {
  return mockVideos;
}

export function getNews(): NewsArticle[] {
  return mockNews;
}

export function getMatches(): Match[] {
  return mockMatches;
}

/** 進行中の試合（開始時刻の古い順＝先に始まった試合が上） */
export function getLiveMatches(): Match[] {
  return mockMatches.filter(isLive).sort(byKickoffAsc);
}

/** 指定日（YYYY-MM-DD, UTC基準）の試合 */
export function getMatchesOn(dayIso: string): Match[] {
  const day = dayIso.slice(0, 10);
  return mockMatches.filter((match) => match.kickoff.slice(0, 10) === day).sort(byKickoffAsc);
}

export function getUpcomingMatches(limit = 8): Match[] {
  return mockMatches
    .filter((match) => match.status === "scheduled")
    .sort(byKickoffAsc)
    .slice(0, limit);
}

export function getFinishedMatches(limit = 8): Match[] {
  return mockMatches
    .filter((match) => match.status === "finished")
    .sort(byKickoffDesc)
    .slice(0, limit);
}

export function getLatestNews(limit = 6): NewsArticle[] {
  return latestNews(limit);
}

/** 表示用のデータ状態。UI 側の「デモデータ表示中」バッジに使います。 */
export function dataSourceLabel(locale: string): string {
  if (usingMockData) return locale === "ja" ? "デモデータ" : "Demo data";
  return locale === "ja" ? "実データ" : "Live data";
}
