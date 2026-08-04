/**
 * ローソク足・板情報・約定の取得口（ブラウザ専用）。
 *
 * ⚠ `market.ts`（サーバー専用・APIキーあり）とは別物です。混ぜないでください。
 *   このファイルは `process.env` を読みません。読むコードを足さないでください。
 *
 * ■ なぜ CoinGecko ではなく取引所なのか
 *   CoinGecko は複数取引所を集計した「参考値」で、板情報は持っていません。
 *   板と約定は取引所ごとの生データなので、取引所から直接取ります。
 *
 * ■ なぜ WebSocket なのか
 *   板は秒より速く動きます。ポーリングでは追いつかず、
 *   追いつこうとするとレート制限に当たります。
 *   WebSocket は接続したままサーバー側から届くので、
 *   ここではじめて「リアルタイム」と呼べる更新になります。
 *   （CoinGecko を使う `live-market.ts` は約60秒間隔です。混同しないでください）
 *
 * ■ ここで扱うのは「Binance の板」であって「市場全体の板」ではありません
 *   板は取引所ごとに別物です。画面では必ず取引所名と通貨ペアを出します。
 *   価格は USDT 建てで、米ドルそのものではありません。
 *
 * ■ つながらない地域があります
 *   Binance は国・地域によって利用できません。その場合は接続に失敗します。
 *   失敗を隠して数字を出すことはせず、状態として画面に出します。
 */

const REST = "https://api.binance.com/api/v3";
const WS = "wss://stream.binance.com:9443/stream";

/** 取引所と建て通貨。画面に必ず出します */
export const TRADING_VENUE = {
  name: "Binance",
  url: "https://www.binance.com/",
  quote: "USDT",
} as const;

export type Interval = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

export const INTERVALS: Interval[] = ["1m", "5m", "15m", "1h", "4h", "1d"];

export type Candle = {
  /** 始値の時刻（ミリ秒） */
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  /** 出来高（基軸通貨の数量） */
  v: number;
};

export type BookLevel = { price: number; size: number };

export type OrderBook = {
  bids: BookLevel[];
  asks: BookLevel[];
};

export type Trade = {
  id: number;
  price: number;
  size: number;
  time: number;
  /** 買い手が能動的だったか（板を食いに行った側） */
  buyerTaker: boolean;
};

export type ConnectionState =
  | "connecting"
  | "open"
  /** 切断され、再接続を待っている */
  | "reconnecting"
  /** この環境からは接続できない（地域制限・遮断など） */
  | "unavailable";

/** 銘柄 → Binance の通貨ペア。無い銘柄はチャートに出しません。 */
export const SYMBOLS: Record<string, string> = {
  bitcoin: "BTCUSDT",
  ethereum: "ETHUSDT",
  ripple: "XRPUSDT",
  solana: "SOLUSDT",
  binancecoin: "BNBUSDT",
  cardano: "ADAUSDT",
  dogecoin: "DOGEUSDT",
  chainlink: "LINKUSDT",
  sui: "SUIUSDT",
  tron: "TRXUSDT",
  "avalanche-2": "AVAXUSDT",
  polkadot: "DOTUSDT",
};

export function symbolFor(coinId: string): string | null {
  return SYMBOLS[coinId] ?? null;
}

/* ------------------------------------------------------------------
   初期データ（REST）
   ------------------------------------------------------------------ */

/**
 * ローソク足の初期値。
 *
 * WebSocket は「これから起きること」しか流してくれません。
 * 過去の足は一度だけ REST で取ります。
 */
export async function fetchCandles(
  symbol: string,
  interval: Interval,
  limit = 200,
): Promise<Candle[]> {
  const url = `${REST}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const response = await fetch(url, { headers: { accept: "application/json" }, mode: "cors" });
  if (!response.ok) throw new Error(`klines ${response.status}`);
  const rows = (await response.json()) as unknown[][];
  return rows.map((row) => ({
    t: Number(row[0]),
    o: Number(row[1]),
    h: Number(row[2]),
    l: Number(row[3]),
    c: Number(row[4]),
    v: Number(row[5]),
  }));
}

/* ------------------------------------------------------------------
   購読（WebSocket）
   ------------------------------------------------------------------ */

export type TradingStreams = {
  onCandle?: (candle: Candle, closed: boolean) => void;
  onBook?: (book: OrderBook) => void;
  onTrade?: (trade: Trade) => void;
  onState?: (state: ConnectionState) => void;
};

type RawKline = {
  k: { t: number; o: string; h: string; l: string; c: string; v: string; x: boolean };
};
type RawDepth = { bids: [string, string][]; asks: [string, string][] };
type RawTrade = { a: number; p: string; q: string; T: number; m: boolean };

/** 再接続の待ち時間（ミリ秒）。総当たりで叩き続けないよう伸ばしていきます */
function retryDelay(attempt: number): number {
  return Math.min(1000 * 2 ** attempt, 30_000);
}

/**
 * 1本の接続で3種類のストリームをまとめて購読します。
 *
 * 戻り値を呼ぶと購読を終了します。**必ず呼んでください。**
 * 呼ばないと、ページを離れたあとも接続が残り、再接続を繰り返します。
 */
export function subscribeTrading(
  symbol: string,
  interval: Interval,
  handlers: TradingStreams,
): () => void {
  const lower = symbol.toLowerCase();
  const streams = [`${lower}@kline_${interval}`, `${lower}@depth20@1000ms`, `${lower}@aggTrade`];
  const url = `${WS}?streams=${streams.join("/")}`;

  let socket: WebSocket | null = null;
  let attempt = 0;
  let closed = false;
  let timer: number | null = null;

  const connect = () => {
    if (closed) return;
    handlers.onState?.(attempt === 0 ? "connecting" : "reconnecting");

    try {
      socket = new WebSocket(url);
    } catch {
      // コンストラクタが投げるのは、そもそも接続できない環境のときです
      handlers.onState?.("unavailable");
      return;
    }

    socket.onopen = () => {
      attempt = 0;
      handlers.onState?.("open");
    };

    socket.onmessage = (event) => {
      let payload: { stream?: string; data?: unknown };
      try {
        payload = JSON.parse(String(event.data));
      } catch {
        return;
      }
      const stream = payload.stream ?? "";
      const data = payload.data;
      if (!data) return;

      if (stream.includes("@kline")) {
        const k = (data as RawKline).k;
        handlers.onCandle?.(
          {
            t: Number(k.t),
            o: Number(k.o),
            h: Number(k.h),
            l: Number(k.l),
            c: Number(k.c),
            v: Number(k.v),
          },
          Boolean(k.x),
        );
        return;
      }

      if (stream.includes("@depth")) {
        const depth = data as RawDepth;
        handlers.onBook?.({
          bids: toLevels(depth.bids),
          asks: toLevels(depth.asks),
        });
        return;
      }

      if (stream.includes("@aggTrade")) {
        const trade = data as RawTrade;
        handlers.onTrade?.({
          id: trade.a,
          price: Number(trade.p),
          size: Number(trade.q),
          time: Number(trade.T),
          // m は「買い手がメイカーだったか」。裏返すと能動的に買った側かが分かります
          buyerTaker: !trade.m,
        });
      }
    };

    socket.onclose = () => {
      if (closed) return;
      /*
       * 一度も開けないまま閉じるのが続くときは、地域制限などで
       * そもそも到達できない可能性が高いので、再接続をあきらめます。
       * 無言で試し続けると、画面は「接続中」のまま止まって見えます。
       */
      if (attempt >= 4) {
        handlers.onState?.("unavailable");
        return;
      }
      const delay = retryDelay(attempt);
      attempt += 1;
      handlers.onState?.("reconnecting");
      timer = window.setTimeout(connect, delay);
    };

    socket.onerror = () => {
      // onerror のあとに必ず onclose が来るので、ここでは何もしません
    };
  };

  connect();

  return () => {
    closed = true;
    if (timer !== null) window.clearTimeout(timer);
    // 正常終了（1000）で閉じます。onclose の再接続は closed で止めています
    socket?.close(1000);
  };
}

function toLevels(rows: [string, string][]): BookLevel[] {
  const levels: BookLevel[] = [];
  for (const [price, size] of rows) {
    const p = Number(price);
    const s = Number(size);
    if (!Number.isFinite(p) || !Number.isFinite(s) || s <= 0) continue;
    levels.push({ price: p, size: s });
  }
  return levels;
}

/* ------------------------------------------------------------------
   計算（表示用）
   ------------------------------------------------------------------ */

/**
 * 板の累積数量。深さのバーを描くために使います。
 * 「この価格まで食べたら、どれだけの量になるか」を表します。
 */
export function cumulative(levels: BookLevel[]): number[] {
  const totals: number[] = [];
  let sum = 0;
  for (const level of levels) {
    sum += level.size;
    totals.push(sum);
  }
  return totals;
}

/** 最良買いと最良売りの差。狭いほど売買が成立しやすい状態です */
export function spread(book: OrderBook): { abs: number; pct: number } | null {
  const bid = book.bids[0]?.price;
  const ask = book.asks[0]?.price;
  if (!bid || !ask) return null;
  const abs = ask - bid;
  return { abs, pct: (abs / ask) * 100 };
}

/**
 * 直近の足を差し替えます。
 *
 * WebSocket は「進行中の足」を何度も送ってきます。時刻が同じなら上書き、
 * 新しい時刻なら追加します。追加し続けると際限なく伸びるため、上限で切ります。
 */
export function mergeCandle(candles: Candle[], incoming: Candle, max = 400): Candle[] {
  const last = candles[candles.length - 1];
  if (last && last.t === incoming.t) {
    const next = candles.slice(0, -1);
    next.push(incoming);
    return next;
  }
  if (last && incoming.t < last.t) return candles;
  const next = [...candles, incoming];
  return next.length > max ? next.slice(next.length - max) : next;
}
