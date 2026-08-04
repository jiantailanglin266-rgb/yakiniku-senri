import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  cumulative,
  INTERVALS,
  mergeCandle,
  spread,
  SYMBOLS,
  symbolFor,
  TRADING_VENUE,
  type Candle,
} from "@/portal/lib/live-trading";
import { coins } from "@/portal/data/coins";

const candle = (t: number, c = 10): Candle => ({ t, o: 10, h: 12, l: 9, c, v: 100 });

describe("取引所への接続", () => {
  it("APIキーを読まない", () => {
    // 静的サイトに埋めた値は誰でも読めます
    const code = readFileSync(path.join(process.cwd(), "src/portal/lib/live-trading.ts"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    expect(code.includes("process.env")).toBe(false);
  });

  it("取引所名と建て通貨を持っている", () => {
    // 板は取引所ごとに別物なので、どこの板かを必ず出せるようにします
    expect(TRADING_VENUE.name.length).toBeGreaterThan(0);
    expect(TRADING_VENUE.url).toMatch(/^https:\/\//);
    expect(TRADING_VENUE.quote).toBe("USDT");
  });

  it("通貨ペアの割り当ては実在する銘柄だけ", () => {
    // 存在しない銘柄を書くと、切り替えても何も出ません
    const ids = new Set(coins.map((coin) => coin.id));
    for (const id of Object.keys(SYMBOLS)) {
      expect(ids.has(id), id).toBe(true);
    }
  });

  it("通貨ペアはすべて USDT 建て", () => {
    // 建て通貨が混ざると、画面の注記と実際の値が食い違います
    for (const symbol of Object.values(SYMBOLS)) {
      expect(symbol.endsWith("USDT"), symbol).toBe(true);
    }
  });

  it("割り当ての無い銘柄は null を返す", () => {
    expect(symbolFor("bitcoin")).toBe("BTCUSDT");
    expect(symbolFor("not-a-coin")).toBeNull();
  });

  it("期間の選択肢が重複していない", () => {
    expect(new Set(INTERVALS).size).toBe(INTERVALS.length);
  });
});

describe("ローソク足の更新", () => {
  it("同じ時刻の足は差し替える", () => {
    // 進行中の足は何度も届きます。追加すると同じ時刻が並びます
    const merged = mergeCandle([candle(1000, 10), candle(2000, 11)], candle(2000, 15));
    expect(merged).toHaveLength(2);
    expect(merged[1].c).toBe(15);
  });

  it("新しい時刻の足は追加する", () => {
    const merged = mergeCandle([candle(1000)], candle(2000));
    expect(merged.map((entry) => entry.t)).toEqual([1000, 2000]);
  });

  it("過去の足が遅れて届いても並びを壊さない", () => {
    const merged = mergeCandle([candle(1000), candle(2000)], candle(1500));
    expect(merged.map((entry) => entry.t)).toEqual([1000, 2000]);
  });

  it("際限なく伸びない", () => {
    // 接続したままなので、上限が無いとメモリを食い続けます
    let list: Candle[] = [];
    for (let i = 0; i < 500; i += 1) list = mergeCandle(list, candle(i * 1000), 400);
    expect(list).toHaveLength(400);
    expect(list[list.length - 1].t).toBe(499_000);
  });
});

describe("板の計算", () => {
  it("累積数量は足し上げになる", () => {
    expect(
      cumulative([
        { price: 3, size: 1 },
        { price: 2, size: 2 },
        { price: 1, size: 3 },
      ]),
    ).toEqual([1, 3, 6]);
  });

  it("スプレッドは最良気配の差", () => {
    const gap = spread({ bids: [{ price: 99, size: 1 }], asks: [{ price: 100, size: 1 }] });
    expect(gap?.abs).toBe(1);
    expect(gap?.pct).toBeCloseTo(1, 5);
  });

  it("片側が空ならスプレッドを出さない", () => {
    // 0 を出すと「差が無い」と読まれます
    expect(spread({ bids: [], asks: [{ price: 100, size: 1 }] })).toBeNull();
  });
});
