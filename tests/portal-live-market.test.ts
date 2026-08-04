import { describe, expect, it, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  backoffSec,
  clearLiveCache,
  fetchLiveQuotes,
  fetchLiveSeries,
  LIVE_REFRESH_SEC,
  LIVE_SOURCE,
  normalizeSeries,
  RateLimitedError,
} from "@/portal/lib/live-market";

/**
 * ブラウザ側で取得する市場データ。
 *
 * 実際の外部APIは叩きません（テストが提供元の稼働状況に左右されるため）。
 * fetch を差し替えて、レート制限・欠損・間引きの扱いだけを確かめます。
 */

function stubFetch(handler: (url: string) => { status?: number; body?: unknown }) {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const { status = 200, body = {} } = handler(String(input));
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    } as Response;
  }) as typeof fetch;
}

beforeEach(() => {
  clearLiveCache();
});

/**
 * コメントを外した「実際のコード」を返します。
 *
 * このファイルの説明文には `process.env` や `market.ts` という語が出てきます。
 * 素の文字列一致で見ると、説明を書いただけで落ちてしまいます。
 */
function codeOf(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

describe("APIキーを使わない", () => {
  it("live-market.ts が process.env を読まない", () => {
    /*
     * 静的サイトに埋めた値は誰でも読めます。
     * キーを読むコードが入り込むと、そのまま公開されます。
     */
    expect(codeOf("src/portal/lib/live-market.ts").includes("process.env")).toBe(false);
  });

  it("サーバー専用モジュールを import しない", () => {
    // market.ts は APIキーを読みます。ブラウザ用から参照してはいけません
    const code = codeOf("src/portal/lib/live-market.ts");
    expect(code.includes('from "./market"')).toBe(false);
    expect(code.includes("@/portal/lib/market")).toBe(false);
  });

  it("出典を持っている", () => {
    // 無料APIはデータの出どころの表示を求めています
    expect(LIVE_SOURCE.name.length).toBeGreaterThan(0);
    expect(LIVE_SOURCE.url).toMatch(/^https:\/\//);
  });
});

describe("価格の取得", () => {
  it("価格が読めない銘柄は落とす（0で埋めない）", async () => {
    // 0 を入れると「0ドル」と読まれます
    stubFetch(() => ({
      body: {
        bitcoin: { usd: 68000, usd_24h_change: 1.5 },
        ethereum: { usd_24h_change: -2 },
      },
    }));
    const quotes = await fetchLiveQuotes(["bitcoin", "ethereum"]);
    expect(quotes.map((quote) => quote.id)).toEqual(["bitcoin"]);
    expect(quotes[0].usd).toBe(68000);
    expect(quotes[0].change24h).toBe(1.5);
  });

  it("欠けている項目は null にする", async () => {
    stubFetch(() => ({ body: { bitcoin: { usd: 100 } } }));
    const [quote] = await fetchLiveQuotes(["bitcoin"]);
    expect(quote.change24h).toBeNull();
    expect(quote.marketCap).toBeNull();
    expect(quote.lastUpdatedAt).toBeNull();
  });

  it("同じ問い合わせは1回にまとめる", async () => {
    let calls = 0;
    stubFetch(() => {
      calls += 1;
      return { body: { bitcoin: { usd: 1 } } };
    });
    await Promise.all([fetchLiveQuotes(["bitcoin"]), fetchLiveQuotes(["bitcoin"])]);
    expect(calls).toBe(1);
  });

  it("429 は RateLimitedError として区別する", async () => {
    // 通信エラーと同じ扱いにすると、待たずに再試行して制限を悪化させます
    stubFetch(() => ({ status: 429 }));
    await expect(fetchLiveQuotes(["bitcoin"])).rejects.toBeInstanceOf(RateLimitedError);
  });

  it("銘柄が空なら外部を叩かない", async () => {
    let calls = 0;
    stubFetch(() => {
      calls += 1;
      return { body: {} };
    });
    expect(await fetchLiveQuotes([])).toEqual([]);
    expect(calls).toBe(0);
  });
});

describe("系列の取得", () => {
  it("[時刻, 価格] の並びを点に直す", async () => {
    stubFetch(() => ({
      body: {
        prices: [
          [1000, 10],
          [2000, 20],
        ],
      },
    }));
    const points = await fetchLiveSeries("bitcoin", "d1");
    expect(points).toEqual([
      { t: 1000, p: 10 },
      { t: 2000, p: 20 },
    ]);
  });

  it("期間ごとに別のURLを叩く", async () => {
    const urls: string[] = [];
    stubFetch((url) => {
      urls.push(url);
      return { body: { prices: [] } };
    });
    await fetchLiveSeries("bitcoin", "d1");
    await fetchLiveSeries("bitcoin", "y1");
    expect(urls[0]).toContain("days=1");
    expect(urls[1]).toContain("days=365");
  });
});

describe("間引き", () => {
  it("点が多いときは上限まで減らす", () => {
    const rows = Array.from({ length: 900 }, (_, i) => [i, i] as [number, number]);
    expect(normalizeSeries(rows, 180)).toHaveLength(180);
  });

  it("間引いても最新の点は残る", () => {
    // 直近が消えると、現在値と線の右端がずれます
    const rows = Array.from({ length: 900 }, (_, i) => [i, i] as [number, number]);
    const points = normalizeSeries(rows, 180);
    expect(points[points.length - 1]).toEqual({ t: 899, p: 899 });
  });

  it("数値でない点は捨てる", () => {
    const rows = [
      [1, 1],
      [2, null],
      [null, 3],
      [4, 4],
    ] as unknown as [number, number][];
    expect(normalizeSeries(rows)).toEqual([
      { t: 1, p: 1 },
      { t: 4, p: 4 },
    ]);
  });
});

describe("待ち時間", () => {
  it("制限に当たっていなければ既定の間隔", () => {
    expect(backoffSec(0)).toBe(LIVE_REFRESH_SEC);
  });

  it("連続で当たるほど長く待つ", () => {
    expect(backoffSec(1)).toBeGreaterThan(backoffSec(0));
    expect(backoffSec(2)).toBeGreaterThan(backoffSec(1));
  });

  it("待ち時間には上限がある", () => {
    // 際限なく伸びると、復帰しても取りに行かなくなります
    expect(backoffSec(50)).toBeLessThanOrEqual(600);
  });
});
