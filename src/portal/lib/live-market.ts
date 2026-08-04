/**
 * ブラウザから直接取得する市場データ。
 *
 * ⚠ このモジュールは `@/portal/lib/market` とは**別物**です。混ぜないでください。
 *   - `market.ts` … サーバー専用。APIキーを読みます。ビルド時／サーバー実行時に使います。
 *   - `live-market.ts`（このファイル）… ブラウザ専用。**キーを一切読みません**。
 *
 * ■ なぜブラウザから直接叩くのか
 *   このサイトは静的書き出し（GitHub Pages）で配信しています。
 *   サーバーが無いため、`market.ts` はビルドした瞬間の値で固定されます。
 *   価格を動かすには、閲覧者のブラウザが取得するほかありません。
 *
 * ■ それでもキーは出しません
 *   ここで使うのは CoinGecko の**キー不要の公開エンドポイント**だけです。
 *   キーを付ければレート制限は緩みますが、静的サイトに埋めた値は誰でも読めます。
 *   「速いが漏れている」より「遅いが漏れていない」を選びます。
 *   `process.env` を読むコードをこのファイルに足さないでください。
 *
 * ■ レート制限への配慮
 *   キー無しの公開APIは、IP あたり毎分数回で制限されます。
 *   閲覧者ごとに直接叩くため、以下で回数を抑えます。
 *     - 取得間隔は既定60秒。「リアルタイム」とは書かず、実際の間隔を画面に出します
 *     - 同じ問い合わせはメモリにキャッシュして使い回します
 *     - 429 が返ったら間隔を倍にして下がります（最大10分）
 *     - タブが見えていない間は取得しません
 *
 * ■ 失敗しても画面は壊しません
 *   取得できないときは、ビルド時に埋め込んだ値をそのまま表示し続け、
 *   「更新できていない」ことを状態として返します。
 *   金融情報なので、古い値を黙って新しい値のように見せることはしません。
 */

import type { ChartPeriod, PricePoint } from "./types";

/** キー不要の公開エンドポイント。 */
const BASE = "https://api.coingecko.com/api/v3";

/** 既定の取得間隔（秒）。画面にはこの値をそのまま表示します。 */
export const LIVE_REFRESH_SEC = 60;

/** 429 が続いたときの上限（秒）。 */
const MAX_BACKOFF_SEC = 600;

/** 期間 → CoinGecko の `days` パラメータ。 */
const PERIOD_DAYS: Record<ChartPeriod, string> = {
  d1: "1",
  d7: "7",
  m1: "30",
  m3: "90",
  y1: "365",
  all: "max",
};

/**
 * 系列のキャッシュ期間（ミリ秒）。
 *
 * 短い期間ほど動きが速いので短く、長い期間は1日単位の粒度なので長く取ります。
 * 期間を切り替えるたびに取得すると、それだけでレート制限に当たります。
 */
const SERIES_TTL_MS: Record<ChartPeriod, number> = {
  d1: 60_000,
  d7: 5 * 60_000,
  m1: 30 * 60_000,
  m3: 60 * 60_000,
  y1: 6 * 60 * 60_000,
  all: 12 * 60 * 60_000,
};

export type LiveQuote = {
  /** CoinGecko の coin id（例: bitcoin） */
  id: string;
  usd: number;
  change24h: number | null;
  marketCap: number | null;
  volume24h: number | null;
  /** 提供元が示す最終更新（UNIX 秒）。取得時刻ではありません */
  lastUpdatedAt: number | null;
};

export type LiveStatus =
  /** まだ一度も取得していない */
  | "idle"
  /** 取得中 */
  | "loading"
  /** 取得できている */
  | "live"
  /** レート制限に当たり、間隔を空けて待っている */
  | "throttled"
  /** 取得に失敗した（通信断・提供元の障害など） */
  | "error";

export class RateLimitedError extends Error {
  constructor() {
    super("rate limited");
    this.name = "RateLimitedError";
  }
}

/* ------------------------------------------------------------------
   キャッシュ

   モジュールスコープに置きます。同じページ内の複数のチャートが
   同じ問い合わせをしても、外部への往復は1回で済みます。
   ------------------------------------------------------------------ */

type CacheEntry<T> = { at: number; value: T };

const quoteCache = new Map<string, CacheEntry<LiveQuote[]>>();
const seriesCache = new Map<string, CacheEntry<PricePoint[]>>();
const inFlight = new Map<string, Promise<unknown>>();

/** テスト用。モジュールスコープのキャッシュを空にします。 */
export function clearLiveCache(): void {
  quoteCache.clear();
  seriesCache.clear();
  inFlight.clear();
}

/**
 * 同じキーの取得が走っている間は、その Promise を共有します。
 * 待たずに2回投げると、レート制限を2回ぶん消費します。
 */
function dedupe<T>(key: string, run: () => Promise<T>): Promise<T> {
  const running = inFlight.get(key) as Promise<T> | undefined;
  if (running) return running;
  const promise = run().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { accept: "application/json" },
    // 提供元のキャッシュに任せます。こちらで no-store にすると往復が増えます
    cache: "default",
    // 認証情報は送りません（送る必要が無く、CORS も単純要求のままにできます）
    credentials: "omit",
    mode: "cors",
  });
  if (response.status === 429) throw new RateLimitedError();
  if (!response.ok) throw new Error(`unexpected status ${response.status}`);
  return response.json();
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/* ------------------------------------------------------------------
   価格
   ------------------------------------------------------------------ */

/**
 * 現在値をまとめて取得します。
 *
 * `/simple/price` は1回の問い合わせで複数銘柄を返すため、
 * 銘柄ごとに投げるより制限に当たりにくくなります。
 */
export async function fetchLiveQuotes(ids: string[]): Promise<LiveQuote[]> {
  if (ids.length === 0) return [];
  const key = [...ids].sort().join(",");

  const cached = quoteCache.get(key);
  if (cached && Date.now() - cached.at < LIVE_REFRESH_SEC * 1000) return cached.value;

  return dedupe(`q:${key}`, async () => {
    const url =
      `${BASE}/simple/price?ids=${encodeURIComponent(key)}&vs_currencies=usd` +
      `&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true` +
      `&include_last_updated_at=true`;

    const raw = (await getJson(url)) as Record<string, Record<string, number>>;
    const quotes: LiveQuote[] = [];
    for (const id of ids) {
      const row = raw?.[id];
      const usd = num(row?.usd);
      // 価格が読めないものは、0 で埋めずに落とします（0円と誤読されるため）
      if (usd === null) continue;
      quotes.push({
        id,
        usd,
        change24h: num(row?.usd_24h_change),
        marketCap: num(row?.usd_market_cap),
        volume24h: num(row?.usd_24h_vol),
        lastUpdatedAt: num(row?.last_updated_at),
      });
    }
    quoteCache.set(key, { at: Date.now(), value: quotes });
    return quotes;
  });
}

/* ------------------------------------------------------------------
   系列
   ------------------------------------------------------------------ */

/**
 * 価格の系列を取得します。
 *
 * `/coins/{id}/market_chart` は `[[ミリ秒, 価格], ...]` を返します。
 * 1日分は5分刻みで約290点あり、そのまま描くと線が潰れるので間引きます。
 */
export async function fetchLiveSeries(id: string, period: ChartPeriod): Promise<PricePoint[]> {
  const key = `${id}:${period}`;
  const cached = seriesCache.get(key);
  if (cached && Date.now() - cached.at < SERIES_TTL_MS[period]) return cached.value;

  return dedupe(`s:${key}`, async () => {
    const url =
      `${BASE}/coins/${encodeURIComponent(id)}/market_chart` +
      `?vs_currency=usd&days=${PERIOD_DAYS[period]}`;

    const raw = (await getJson(url)) as { prices?: [number, number][] };
    const points = normalizeSeries(raw?.prices ?? []);
    seriesCache.set(key, { at: Date.now(), value: points });
    return points;
  });
}

/** 描画に使える点だけを残し、多すぎる場合は等間隔に間引きます。 */
export function normalizeSeries(rows: [number, number][], maxPoints = 180): PricePoint[] {
  const points: PricePoint[] = [];
  for (const row of rows) {
    const t = num(row?.[0]);
    const p = num(row?.[1]);
    if (t === null || p === null) continue;
    points.push({ t, p });
  }
  if (points.length <= maxPoints) return points;

  const step = (points.length - 1) / (maxPoints - 1);
  const thinned: PricePoint[] = [];
  for (let i = 0; i < maxPoints; i += 1) {
    thinned.push(points[Math.round(i * step)]);
  }
  // 最新の値は必ず残します。間引きで直近が消えると、現在値と線の右端がずれます
  thinned[thinned.length - 1] = points[points.length - 1];
  return thinned;
}

/** 429 に当たった回数から、次に待つ秒数を返します。 */
export function backoffSec(consecutiveRateLimits: number): number {
  if (consecutiveRateLimits <= 0) return LIVE_REFRESH_SEC;
  return Math.min(LIVE_REFRESH_SEC * 2 ** consecutiveRateLimits, MAX_BACKOFF_SEC);
}

/**
 * 出典表記。
 *
 * CoinGecko の無料APIは、データの出どころを示すことを求めています。
 * 表示を消さないでください。
 */
export const LIVE_SOURCE = {
  name: "CoinGecko",
  url: "https://www.coingecko.com/",
} as const;
