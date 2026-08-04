import Link from "next/link";
import { formatCompact, formatPrice, t } from "@/portal/lib/format";
import { localePath } from "@/portal/i18n/config";
import type { Dictionary } from "@/portal/i18n/dictionaries";
import type { Coin, CoinMarket } from "@/portal/lib/types";
import { GlassCard } from "@/portal/components/ui/primitives";
import { PriceChange, Sparkline } from "./charts";

/** 通貨のロゴ画像は用意していないため、シンボルの頭文字＋ブランドカラーで代替します */
export function CoinMark({ coin, size = 40 }: { coin: Coin; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-full font-mono font-bold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        color: coin.color,
        background: `radial-gradient(circle at 30% 25%, ${coin.color}38, ${coin.color}0d 60%, transparent 75%)`,
        border: `1px solid ${coin.color}55`,
        boxShadow: `0 0 18px -6px ${coin.color}`,
      }}
    >
      {coin.symbol.slice(0, 3)}
    </span>
  );
}

export function CoinCard({
  coin,
  market,
  locale,
  dict,
}: {
  coin: Coin;
  market: CoinMarket | undefined;
  locale: string;
  dict: Dictionary;
}) {
  return (
    <GlassCard as="article" className="p-5">
      <Link
        href={localePath(locale, `/coins/${coin.slug}`)}
        className="flex flex-col gap-4 focus-visible:outline-none"
      >
        <div className="flex items-center gap-3">
          <CoinMark coin={coin} />
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold">{t(coin.name, locale)}</h3>
            <p className="font-mono text-xs text-(--color-ink-dim)">{coin.symbol}</p>
          </div>
          {market ? (
            <span className="ml-auto rounded-full border border-(--color-hairline) px-2 py-0.5 font-mono text-[0.625rem] text-(--color-ink-dim)">
              #{market.rank}
            </span>
          ) : null}
        </div>

        {market ? (
          <>
            <div className="flex items-end justify-between gap-3">
              <p className="tabular font-mono text-xl font-semibold">
                {formatPrice(market.price, locale)}
              </p>
              <PriceChange
                value={market.change24h}
                locale={locale}
                labels={{
                  up: dict.a11y.priceUp,
                  down: dict.a11y.priceDown,
                  flat: dict.a11y.priceFlat,
                }}
                size="md"
              />
            </div>

            <Sparkline values={market.sparkline} width={280} height={48} className="h-12 w-full" />

            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-(--color-ink-dim)">{dict.market.marketCap}</dt>
                <dd className="tabular font-mono">{formatCompact(market.marketCap, locale)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-(--color-ink-dim)">{dict.market.volume}</dt>
                <dd className="tabular font-mono">{formatCompact(market.volume24h, locale)}</dd>
              </div>
            </dl>
          </>
        ) : null}

        <p className="line-clamp-2 text-xs text-(--color-ink-soft)">{t(coin.summary, locale)}</p>
      </Link>
    </GlassCard>
  );
}
