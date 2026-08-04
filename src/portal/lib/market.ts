/**
 * 市場データの取得口。
 *
 * ⚠ このモジュールはサーバー専用です。
 *   APIキー（COINGECKO_API_KEY）を読むため、クライアントコンポーネントから
 *   import しないでください。`"use client"` のファイルから参照すると、
 *   キーがバンドルに含まれる恐れがあります。
 *   （呼び出してよいのは Server Component と Route Handler だけです）
 *
 * ■ 設計方針
 *   - フロントエンドから外部APIを直接叩きません。必ずこのモジュール（＝サーバー側）を経由します。
 *     APIキーがクライアントに露出せず、レート制限も一元管理できます。
 *   - データソースは環境変数で切り替えます（既定はモック）。
 *   - 失敗したら「エラーで真っ白」にせず、モックへフォールバックし、
 *     `degraded` に理由を入れて画面に「取得できなかった」ことを表示します。
 *   - 取得日時（fetchedAt）と更新間隔（refreshIntervalSec）を必ず持ち回り、
 *     UI では「リアルタイム」ではなく実際の更新頻度を表示します。
 */

import { coins } from "@/portal/data/coins";
import { buildMockSeries, buildMockSnapshot, MOCK_REFRESH_SEC } from "./mock-market";
import type { ChartPeriod, MarketSnapshot, PricePoint } from "./types";

export type MarketSource = "mock" | "coingecko";

/** 実データを使うかどうか。既定はモックです（キー無しで全ページが見られるように）。 */
export function marketSource(): MarketSource {
  const configured = process.env.MARKET_DATA_SOURCE?.trim().toLowerCase();
  if (configured === "coingecko") return "coingecko";
  return "mock";
}

/** サーバー側キャッシュの秒数。無料APIのレート制限を前提に長めに取ります。 */
export const MARKET_REVALIDATE_SEC = Number(process.env.MARKET_REVALIDATE_SEC ?? "60") || 60;

const COINGECKO_BASE = process.env.COINGECKO_BASE_URL ?? "https://api.coingecko.com/api/v3";

/** 1回だけ短い間隔で再試行します。無料枠を食い潰さないよう回数は増やしません。 */
async function fetchWithRetry(url: string, init: RequestInit & { next?: { revalidate: number } }) {
  try {
    const response = await fetch(url, init);
    if (response.ok) return response;
    // 429（レート制限）は待っても同じなので即座に諦めます
    if (response.status === 429) throw new Error(`rate limited (${response.status})`);
    throw new Error(`unexpected status ${response.status}`);
  } catch (first) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const response = await fetch(url, init);
    if (!response.ok) {
      throw first instanceof Error ? first : new Error(`unexpected status ${response.status}`);
    }
    return response;
  }
}

function authHeaders(): Record<string, string> {
  const key = process.env.COINGECKO_API_KEY;
  return key ? { "x-cg-demo-api-key": key } : {};
}

type CoinGeckoMarket = {
  id: string;
  market_cap_rank: number | null;
  current_price: number;
  price_change_percentage_1h_in_currency?: number | null;
  price_change_percentage_24h_in_currency?: number | null;
  price_change_percentage_7d_in_currency?: number | null;
  price_change_percentage_30d_in_currency?: number | null;
  market_cap: number;
  total_volume: number;
  circulating_supply: number | null;
  max_supply: number | null;
  ath: number | null;
  ath_date: string | null;
  atl: number | null;
  atl_date: string | null;
  sparkline_in_7d?: { price: number[] } | null;
};

async function fetchCoinGecko(): Promise<MarketSnapshot> {
  const ids = coins.map((coin) => coin.id).join(",");
  const url =
    `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${ids}` +
    `&order=market_cap_desc&sparkline=true&price_change_percentage=1h,24h,7d,30d`;

  const response = await fetchWithRetry(url, {
    headers: { accept: "application/json", ...authHeaders() },
    next: { revalidate: MARKET_REVALIDATE_SEC },
  });
  const rows = (await response.json()) as CoinGeckoMarket[];

  const markets = rows.map((row, index) => ({
    id: row.id,
    rank: row.market_cap_rank ?? index + 1,
    price: row.current_price,
    change1h: row.price_change_percentage_1h_in_currency ?? 0,
    change24h: row.price_change_percentage_24h_in_currency ?? 0,
    change7d: row.price_change_percentage_7d_in_currency ?? 0,
    change30d: row.price_change_percentage_30d_in_currency ?? undefined,
    marketCap: row.market_cap,
    volume24h: row.total_volume,
    circulatingSupply: row.circulating_supply ?? undefined,
    maxSupply: row.max_supply ?? undefined,
    ath: row.ath ?? undefined,
    athDate: row.ath_date ?? undefined,
    atl: row.atl ?? undefined,
    atlDate: row.atl_date ?? undefined,
    // スパークラインは点数が多いと転送量が増えるため間引きます
    sparkline: (row.sparkline_in_7d?.price ?? []).filter((_, i) => i % 4 === 0),
  }));

  const totalMarketCap = markets.reduce((sum, coin) => sum + coin.marketCap, 0);
  const totalVolume = markets.reduce((sum, coin) => sum + coin.volume24h, 0);
  const btc = markets.find((coin) => coin.id === "bitcoin");
  const eth = markets.find((coin) => coin.id === "ethereum");
  const byChange = markets.slice().sort((a, b) => b.change24h - a.change24h);

  return {
    coins: markets,
    global: {
      totalMarketCap,
      totalVolume24h: totalVolume,
      marketCapChange24h: btc?.change24h ?? 0,
      btcDominance: btc && totalMarketCap ? (btc.marketCap / totalMarketCap) * 100 : 0,
      ethDominance: eth && totalMarketCap ? (eth.marketCap / totalMarketCap) * 100 : 0,
      activeCoins: markets.length,
    },
    // Fear & Greed は別APIのため、未接続のあいだはモックの値を使い、
    // 画面側では source を見て「参考値」であることが分かるようにします。
    fearGreed: buildMockSnapshot().fearGreed,
    trending: byChange.slice(0, 5).map((coin) => coin.id),
    newListings: [],
    fetchedAt: new Date().toISOString(),
    source: "coingecko",
    refreshIntervalSec: MARKET_REVALIDATE_SEC,
  };
}

/**
 * 市場データのスナップショット。
 * 失敗しても必ず何かを返します（真っ白なページを出さないため）。
 */
export async function getMarketSnapshot(): Promise<MarketSnapshot> {
  if (marketSource() === "mock") {
    return buildMockSnapshot();
  }
  try {
    return await fetchCoinGecko();
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown error";
    return {
      ...buildMockSnapshot(),
      degraded: reason,
      refreshIntervalSec: MARKET_REVALIDATE_SEC,
    };
  }
}

type CoinGeckoChart = { prices: [number, number][] };

const periodDays: Record<ChartPeriod, string> = {
  d1: "1",
  d7: "7",
  m1: "30",
  m3: "90",
  y1: "365",
  all: "max",
};

/** 通貨1件の価格系列。チャートの期間切り替えから呼ばれます。 */
export async function getPriceSeries(
  coinId: string,
  period: ChartPeriod,
): Promise<{ points: PricePoint[]; source: MarketSource; fetchedAt: string; degraded?: string }> {
  if (marketSource() === "mock") {
    return {
      points: buildMockSeries(coinId, period),
      source: "mock",
      fetchedAt: new Date().toISOString(),
    };
  }
  try {
    const url = `${COINGECKO_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${periodDays[period]}`;
    const response = await fetchWithRetry(url, {
      headers: { accept: "application/json", ...authHeaders() },
      next: { revalidate: MARKET_REVALIDATE_SEC * 5 },
    });
    const data = (await response.json()) as CoinGeckoChart;
    // 点が多すぎると描画が重くなるため、80点程度まで間引きます
    const step = Math.max(1, Math.ceil(data.prices.length / 80));
    return {
      points: data.prices.filter((_, index) => index % step === 0).map(([t, p]) => ({ t, p })),
      source: "coingecko",
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      points: buildMockSeries(coinId, period),
      source: "mock",
      fetchedAt: new Date().toISOString(),
      degraded: error instanceof Error ? error.message : "unknown error",
    };
  }
}

export { MOCK_REFRESH_SEC };
