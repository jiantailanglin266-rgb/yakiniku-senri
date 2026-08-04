"use client";

import { cumulative, spread, type OrderBook, type Trade } from "@/portal/lib/live-trading";

/**
 * 板情報。
 *
 * ■ 「市場全体の板」ではありません
 *   板は取引所ごとに別物です。ここに出しているのは1つの取引所のものだけで、
 *   同じ時刻でも別の取引所では違う板になります。
 *   取引所名と通貨ペアは、この表の外（呼び出し側）で必ず出しています。
 *
 * ■ 売りを上、買いを下に置いています
 *   価格が上のものほど上に並ぶ、取引画面の慣習に合わせています。
 *   売り板は価格の高い順が上になるよう、逆順にして描きます。
 *
 * ■ 深さのバー
 *   累積数量を横棒で示します。「この価格まで食べたらどれだけの量か」で、
 *   1行ぶんの数量ではありません。厚みのある価格帯が一目で分かります。
 *
 * ■ 色だけで売買を区別しません
 *   行の意味は見出し（売り/買い）で示し、読み上げでも区別できるようにします。
 */
export function OrderBookPanel({
  book,
  locale,
  labels,
  rows = 12,
}: {
  book: OrderBook;
  locale: string;
  labels: {
    asks: string;
    bids: string;
    price: string;
    size: string;
    spread: string;
    empty: string;
  };
  rows?: number;
}) {
  const asks = book.asks.slice(0, rows);
  const bids = book.bids.slice(0, rows);
  const askTotals = cumulative(asks);
  const bidTotals = cumulative(bids);
  const max = Math.max(
    askTotals[askTotals.length - 1] ?? 0,
    bidTotals[bidTotals.length - 1] ?? 0,
    1,
  );
  const gap = spread(book);

  const fmtPrice = (value: number) =>
    new Intl.NumberFormat(locale === "ja" ? "ja-JP" : locale, {
      maximumFractionDigits: value < 1 ? 6 : value < 100 ? 4 : 2,
    }).format(value);
  const fmtSize = (value: number) =>
    new Intl.NumberFormat(locale === "ja" ? "ja-JP" : locale, {
      maximumFractionDigits: value < 1 ? 4 : 3,
    }).format(value);

  if (asks.length === 0 && bids.length === 0) {
    return <p className="py-8 text-center text-sm text-(--color-ink-dim)">{labels.empty}</p>;
  }

  const Row = ({
    level,
    total,
    side,
  }: {
    level: { price: number; size: number };
    total: number;
    side: "ask" | "bid";
  }) => (
    <li className="relative grid grid-cols-2 px-2 py-[3px] font-mono text-xs">
      {/* 深さのバー。文字の背面に敷きます */}
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 end-0 ${
          side === "ask" ? "bg-(--color-rose)/14" : "bg-(--color-emerald)/14"
        }`}
        style={{ width: `${Math.min(100, (total / max) * 100)}%` }}
      />
      <span
        className={`relative ${side === "ask" ? "text-(--color-rose)" : "text-(--color-emerald)"}`}
        translate="no"
      >
        {fmtPrice(level.price)}
      </span>
      <span className="relative text-end text-(--color-ink-soft)" translate="no">
        {fmtSize(level.size)}
      </span>
    </li>
  );

  return (
    <div>
      <div className="grid grid-cols-2 px-2 pb-1 text-[0.6875rem] text-(--color-ink-dim)">
        <span>{labels.price}</span>
        <span className="text-end">{labels.size}</span>
      </div>

      {/* 売り板。価格の高いものが上になるよう逆順に描きます */}
      <h4 className="sr-only">{labels.asks}</h4>
      <ul className="flex flex-col-reverse">
        {asks.map((level, index) => (
          <Row key={`a-${level.price}`} level={level} total={askTotals[index]} side="ask" />
        ))}
      </ul>

      {gap ? (
        <p className="my-1.5 border-y border-(--color-hairline) px-2 py-1.5 font-mono text-xs text-(--color-ink-dim)">
          {labels.spread}{" "}
          <span translate="no">
            {fmtPrice(gap.abs)}（{gap.pct.toFixed(3)}%）
          </span>
        </p>
      ) : null}

      <h4 className="sr-only">{labels.bids}</h4>
      <ul>
        {bids.map((level, index) => (
          <Row key={`b-${level.price}`} level={level} total={bidTotals[index]} side="bid" />
        ))}
      </ul>
    </div>
  );
}

/**
 * 直近の約定。
 *
 * 板が「これから売買できる注文」なのに対し、こちらは「成立した取引」です。
 * 買い手が能動的だったかで色を分けますが、色だけに頼らず、
 * 読み上げ向けの語を `sr-only` で添えています。
 */
export function TradeTape({
  trades,
  locale,
  labels,
}: {
  trades: Trade[];
  locale: string;
  labels: { price: string; size: string; time: string; buy: string; sell: string; empty: string };
}) {
  if (trades.length === 0) {
    return <p className="py-8 text-center text-sm text-(--color-ink-dim)">{labels.empty}</p>;
  }

  const fmtPrice = (value: number) =>
    new Intl.NumberFormat(locale === "ja" ? "ja-JP" : locale, {
      maximumFractionDigits: value < 1 ? 6 : value < 100 ? 4 : 2,
    }).format(value);
  const time = new Intl.DateTimeFormat(locale === "ja" ? "ja-JP" : locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div>
      <div className="grid grid-cols-3 px-2 pb-1 text-[0.6875rem] text-(--color-ink-dim)">
        <span>{labels.price}</span>
        <span className="text-end">{labels.size}</span>
        <span className="text-end">{labels.time}</span>
      </div>
      <ul>
        {trades.map((trade) => (
          <li key={trade.id} className="grid grid-cols-3 px-2 py-[3px] font-mono text-xs">
            <span
              className={trade.buyerTaker ? "text-(--color-emerald)" : "text-(--color-rose)"}
              translate="no"
            >
              <span className="sr-only">{trade.buyerTaker ? labels.buy : labels.sell} </span>
              {fmtPrice(trade.price)}
            </span>
            <span className="text-end text-(--color-ink-soft)" translate="no">
              {new Intl.NumberFormat(locale === "ja" ? "ja-JP" : locale, {
                maximumFractionDigits: 4,
              }).format(trade.size)}
            </span>
            <span className="text-end text-(--color-ink-dim)" translate="no">
              {time.format(new Date(trade.time))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
