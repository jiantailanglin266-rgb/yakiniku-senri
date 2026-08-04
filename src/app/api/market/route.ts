import { getMarketSnapshot, MARKET_REVALIDATE_SEC } from "@/portal/lib/market";

/**
 * 市場データのサーバー側API。
 *
 * ■ なぜフロントから外部APIを直接叩かないのか
 *   - APIキーがクライアントに露出する
 *   - 利用者ごとに外部APIを叩くため、無料枠のレート制限をすぐ超える
 *   - CORS とエラー処理を各画面で書くことになる
 *   このエンドポイントを挟むことで、キーはサーバーに留まり、
 *   キャッシュも1か所で効きます。
 *
 * ■ force-static について
 *   静的書き出し（GitHub Pages）でもビルド時に1回だけ生成して配信できるようにしています。
 *   サーバー実行（Vercel）では `revalidate` 秒ごとに再生成されます。
 */
export const dynamic = "force-static";
export const revalidate = 60;

export async function GET() {
  const snapshot = await getMarketSnapshot();

  return Response.json(snapshot, {
    headers: {
      // CDN 側でも同じ間隔でキャッシュし、オリジンへの往復を減らします
      "cache-control": `public, s-maxage=${MARKET_REVALIDATE_SEC}, stale-while-revalidate=${MARKET_REVALIDATE_SEC * 5}`,
    },
  });
}
