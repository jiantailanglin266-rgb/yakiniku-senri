/**
 * ライブスコアの取得エンドポイント。
 *
 * 外部APIをブラウザから直接叩かないための境界です。
 * APIキーはここ（サーバー側）だけで扱い、クライアントへは正規化済みの結果しか返しません。
 *
 * 静的書き出し（GitHub Pages）でも動くよう force-static を指定しています。
 * その場合はビルド時点のスナップショットが JSON として書き出されます。
 * サーバー実行時（Vercel など）は revalidate 秒ごとに再生成されます。
 */
import { NextResponse } from "next/server";
import { getLiveMatches, usingMockData } from "@/sports/lib/api";
import { liveRefreshSec } from "@/sports/config/site";

export const dynamic = "force-static";
export const revalidate = 30;

export async function GET() {
  const matches = getLiveMatches();

  return NextResponse.json({
    /** モックか実データかをクライアント側でも判別できるようにします */
    source: usingMockData ? "mock" : "live",
    refreshIntervalSec: liveRefreshSec,
    /** 生成時刻。表示の「最終更新」はこの値を使います */
    generatedAt: matches[0]?.stamp.fetchedAt ?? null,
    matches: matches.map((match) => ({
      id: match.id,
      slug: match.slug,
      sportId: match.sportId,
      leagueId: match.leagueId,
      status: match.status,
      clock: match.clock ?? null,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      fetchedAt: match.stamp.fetchedAt,
      refreshIntervalSec: match.stamp.refreshIntervalSec,
    })),
  });
}
