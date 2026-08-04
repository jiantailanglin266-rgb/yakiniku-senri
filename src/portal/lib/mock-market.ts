/**
 * モック市場データ。
 *
 * APIキーが無い状態でもサイト全体を確認できるようにするための生成器です。
 *
 * ■ 決定的であること
 *   `Math.random()` を使うと、サーバーとクライアントで別の値になりハイドレーションが壊れます。
 *   また、ビルドのたびに数値が変わると差分レビューが読めません。
 *   ここでは通貨IDと「時間バケット」から擬似乱数を作るため、
 *   同じ時間帯なら何度呼んでも同じ値を返します。
 *
 * ■ モックであることを隠さない
 *   返り値の `source` は必ず "mock" です。UI 側はこれを見てバッジを出します。
 */

import type {
  ChartPeriod,
  CoinMarket,
  FearGreed,
  MarketGlobal,
  MarketSnapshot,
  PricePoint,
} from "./types";
import { coins } from "@/portal/data/coins";

/** モックの更新間隔（秒）。UI に「◯秒ごと」と実際の頻度を出すために使います。 */
export const MOCK_REFRESH_SEC = 60;

/**
 * 基準値。実在の相場を再現するものではなく、
 * 桁感とランキングの妥当性だけを合わせた「見た目用の値」です。
 */
type Seed = {
  id: string;
  price: number;
  marketCap: number;
  volume24h: number;
  circulating?: number;
  ath?: number;
  athDate?: string;
  atl?: number;
  atlDate?: string;
};

const seeds: Seed[] = [
  { id: "bitcoin", price: 68_500, marketCap: 1_355_000_000_000, volume24h: 32_500_000_000, circulating: 19_780_000, ath: 73_750, athDate: "2024-03-14", atl: 67.81, atlDate: "2013-07-06" }, // prettier-ignore
  { id: "ethereum", price: 3_420, marketCap: 411_000_000_000, volume24h: 15_200_000_000, circulating: 120_200_000, ath: 4_878, athDate: "2021-11-10", atl: 0.4329, atlDate: "2015-10-20" }, // prettier-ignore
  { id: "ripple", price: 0.62, marketCap: 34_800_000_000, volume24h: 1_450_000_000, circulating: 56_100_000_000, ath: 3.4, athDate: "2018-01-07", atl: 0.0028, atlDate: "2014-07-07" }, // prettier-ignore
  { id: "solana", price: 168.4, marketCap: 78_400_000_000, volume24h: 3_150_000_000, circulating: 465_000_000, ath: 259.96, athDate: "2021-11-06", atl: 0.5052, atlDate: "2020-05-11" }, // prettier-ignore
  { id: "binancecoin", price: 588.2, marketCap: 86_900_000_000, volume24h: 1_720_000_000, circulating: 147_600_000, ath: 686.31, athDate: "2021-05-10", atl: 0.0398, atlDate: "2017-10-19" }, // prettier-ignore
  { id: "cardano", price: 0.452, marketCap: 16_100_000_000, volume24h: 420_000_000, circulating: 35_600_000_000, ath: 3.09, athDate: "2021-09-02", atl: 0.0192, atlDate: "2020-03-13" }, // prettier-ignore
  { id: "dogecoin", price: 0.128, marketCap: 18_600_000_000, volume24h: 980_000_000, circulating: 145_000_000_000, ath: 0.7376, athDate: "2021-05-08", atl: 0.0000869, atlDate: "2015-05-06" }, // prettier-ignore
  { id: "avalanche-2", price: 34.8, marketCap: 13_700_000_000, volume24h: 480_000_000, circulating: 394_000_000, ath: 144.96, athDate: "2021-11-21", atl: 2.8, atlDate: "2020-12-31" }, // prettier-ignore
  { id: "chainlink", price: 15.2, marketCap: 9_500_000_000, volume24h: 390_000_000, circulating: 626_000_000, ath: 52.7, athDate: "2021-05-10", atl: 0.1482, atlDate: "2017-11-29" }, // prettier-ignore
  { id: "polkadot", price: 6.4, marketCap: 9_200_000_000, volume24h: 260_000_000, circulating: 1_440_000_000, ath: 54.98, athDate: "2021-11-04", atl: 2.7, atlDate: "2020-08-20" }, // prettier-ignore
  { id: "sui", price: 1.72, marketCap: 4_600_000_000, volume24h: 620_000_000, circulating: 2_680_000_000, ath: 2.18, athDate: "2024-03-27", atl: 0.3643, atlDate: "2023-10-19" }, // prettier-ignore
  { id: "tron", price: 0.124, marketCap: 10_800_000_000, volume24h: 340_000_000, circulating: 87_100_000_000, ath: 0.3004, athDate: "2018-01-05", atl: 0.0018, atlDate: "2017-09-13" }, // prettier-ignore
  { id: "shiba-inu", price: 0.0000178, marketCap: 10_500_000_000, volume24h: 310_000_000, circulating: 589_000_000_000_000, ath: 0.0000863, athDate: "2021-10-28", atl: 0.00000000008, atlDate: "2020-11-28" }, // prettier-ignore
];

const seedById = new Map(seeds.map((seed) => [seed.id, seed]));

/**
 * 文字列から 32bit のハッシュを作ります（FNV-1a）。
 * 暗号用途ではありません。見た目のばらつきを決定的に作るためだけのものです。
 */
function hash(input: string): number {
  let value = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    value ^= input.charCodeAt(i);
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
}

/** ハッシュから 0–1 の値を作ります */
function unit(input: string): number {
  return hash(input) / 0xffffffff;
}

/** -1 〜 1 */
function signed(input: string): number {
  return unit(input) * 2 - 1;
}

/** 現在時刻を更新間隔で丸めたバケット。同じバケット内では値が変わりません。 */
export function timeBucket(now: number, intervalSec = MOCK_REFRESH_SEC): number {
  return Math.floor(now / (intervalSec * 1000));
}

function buildCoinMarket(seed: Seed, rank: number, bucket: number): CoinMarket {
  const key = `${seed.id}:${bucket}`;
  // ±3% の範囲で基準値を揺らします
  const drift = signed(`${key}:drift`) * 0.03;
  const price = seed.price * (1 + drift);

  const change24h = signed(`${key}:c24`) * 7.5;
  const change1h = signed(`${key}:c1`) * 1.2;
  const change7d = signed(`${key}:c7`) * 14;
  const change30d = signed(`${key}:c30`) * 28;

  // スパークラインは、7日前から現在価格へつながるように後ろから組み立てます
  const points = 48;
  const sparkline: number[] = [];
  for (let i = 0; i < points; i += 1) {
    const progress = i / (points - 1);
    // 7日変動を線形に、そこへ日内のうねりを重ねます
    const trend = 1 + (change7d / 100) * (progress - 1);
    const wobble = signed(`${key}:s${i}`) * 0.012;
    sparkline.push(price * trend * (1 + wobble));
  }
  sparkline[sparkline.length - 1] = price;

  return {
    id: seed.id,
    rank,
    price,
    change1h,
    change24h,
    change7d,
    change30d,
    marketCap: seed.marketCap * (1 + drift),
    volume24h: seed.volume24h * (1 + signed(`${key}:vol`) * 0.25),
    circulatingSupply: seed.circulating,
    maxSupply: coins.find((coin) => coin.id === seed.id)?.maxSupply,
    ath: seed.ath,
    athDate: seed.athDate,
    atl: seed.atl,
    atlDate: seed.atlDate,
    sparkline,
  };
}

function classifyFearGreed(value: number): FearGreed["classification"] {
  if (value < 25) return "extreme-fear";
  if (value < 45) return "fear";
  if (value < 55) return "neutral";
  if (value < 75) return "greed";
  return "extreme-greed";
}

export function buildMockSnapshot(now = Date.now()): MarketSnapshot {
  const bucket = timeBucket(now);
  // 順位は「揺らしたあとの時価総額」で決めます。
  // 基準値で並べてから揺らすと、時価総額が近い2銘柄で
  // 表示順と順位番号が食い違います（例: TRX と SHIB）。
  const markets = seeds
    .map((seed) => buildCoinMarket(seed, 0, bucket))
    .sort((a, b) => b.marketCap - a.marketCap)
    .map((market, index) => ({ ...market, rank: index + 1 }));

  const totalMarketCap = markets.reduce((sum, coin) => sum + coin.marketCap, 0);
  const totalVolume24h = markets.reduce((sum, coin) => sum + coin.volume24h, 0);
  const btc = markets.find((coin) => coin.id === "bitcoin");
  const eth = markets.find((coin) => coin.id === "ethereum");

  const global: MarketGlobal = {
    // 掲載13銘柄だけでは市場全体にならないため、全体推計として係数をかけます。
    // これはモックの見た目用の値であり、実データでは API の global 値に差し替わります。
    totalMarketCap: totalMarketCap * 1.32,
    totalVolume24h: totalVolume24h * 1.55,
    marketCapChange24h: signed(`global:${bucket}`) * 4.2,
    btcDominance: btc ? (btc.marketCap / (totalMarketCap * 1.32)) * 100 : 0,
    ethDominance: eth ? (eth.marketCap / (totalMarketCap * 1.32)) * 100 : 0,
    activeCoins: 13_500,
  };

  const fearGreedValue = Math.round(20 + unit(`fng:${bucket}`) * 65);

  const byChange = markets.slice().sort((a, b) => b.change24h - a.change24h);

  return {
    coins: markets,
    global,
    fearGreed: { value: fearGreedValue, classification: classifyFearGreed(fearGreedValue) },
    trending: byChange.slice(0, 5).map((coin) => coin.id),
    newListings: ["sui", "avalanche-2", "chainlink"],
    fetchedAt: new Date(bucket * MOCK_REFRESH_SEC * 1000).toISOString(),
    source: "mock",
    refreshIntervalSec: MOCK_REFRESH_SEC,
  };
}

/** 期間ごとの本数と刻み幅。チャートの点数は端末負荷を見て抑えめにしています。 */
const periodShape: Record<ChartPeriod, { points: number; days: number; volatility: number }> = {
  d1: { points: 48, days: 1, volatility: 0.012 },
  d7: { points: 56, days: 7, volatility: 0.03 },
  m1: { points: 60, days: 30, volatility: 0.07 },
  m3: { points: 60, days: 90, volatility: 0.14 },
  y1: { points: 73, days: 365, volatility: 0.3 },
  all: { points: 80, days: 1825, volatility: 0.6 },
};

/**
 * 指定期間の価格系列（モック）。
 * 最終点は必ず現在価格に一致させ、チャートとティッカーの数値が食い違わないようにします。
 */
export function buildMockSeries(
  coinId: string,
  period: ChartPeriod,
  now = Date.now(),
): PricePoint[] {
  const seed = seedById.get(coinId);
  if (!seed) return [];
  const bucket = timeBucket(now);
  const { points, days, volatility } = periodShape[period];
  const currentPrice = buildCoinMarket(seed, 1, bucket).price ?? seed.price;

  const spanMs = days * 24 * 60 * 60 * 1000;
  const startPrice = currentPrice * (1 - signed(`${coinId}:${period}:start`) * volatility);

  const series: PricePoint[] = [];
  for (let i = 0; i < points; i += 1) {
    const progress = i / (points - 1);
    const base = startPrice + (currentPrice - startPrice) * progress;
    // ランダムウォークではなく、決定的な複数波の合成でうねりを作ります
    const noise =
      signed(`${coinId}:${period}:${i}`) * volatility * 0.35 +
      Math.sin(progress * Math.PI * 3 + unit(`${coinId}:${period}`) * 6) * volatility * 0.12;
    series.push({
      t: now - spanMs + spanMs * progress,
      p: Math.max(base * (1 + noise), currentPrice * 0.05),
    });
  }
  series[series.length - 1] = { t: now, p: currentPrice };
  return series;
}
