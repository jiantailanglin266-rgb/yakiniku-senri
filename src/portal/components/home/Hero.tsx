import Link from "next/link";
import { localePath } from "@/portal/i18n/config";
import { formatCompact, formatPercent, t } from "@/portal/lib/format";
import type { Dictionary } from "@/portal/i18n/dictionaries";
import type { Coin, MarketSnapshot } from "@/portal/lib/types";
import { Coin3D } from "@/portal/components/effects/Coin3D";
import { HeroLogoVideo } from "./HeroLogoVideo";
import { ParticleField } from "@/portal/components/effects/ParticleField";
import { FearGreedGauge, PriceChange } from "@/portal/components/market/charts";
import { DataFreshness } from "@/portal/components/market/DataFreshness";
import { GlobalSearch } from "@/portal/components/layout/GlobalSearch";
import { NeonLink } from "@/portal/components/ui/primitives";

/**
 * ファーストビュー。
 *
 * ■ レイヤー構成
 *   背面: グラデーション（layout の .bg-*）→ 粒子とネットワーク線
 *   中間: 3Dコイン（CSS 3D）
 *   前面: 見出し / 検索 / CTA / 価格サマリー
 *
 * ■ 情報を装飾に負けさせない
 *   価格・変動率・Fear & Greed は必ず最前面に、実線のカードの上に置きます。
 *   コインは装飾なので `aria-hidden`、数値は読み上げ対象です。
 */
export function Hero({
  locale,
  dict,
  snapshot,
  featured,
}: {
  locale: string;
  dict: Dictionary;
  snapshot: MarketSnapshot;
  /** 3Dで見せる主要通貨（3枚まで） */
  featured: Coin[];
}) {
  const marketById = new Map(snapshot.coins.map((coin) => [coin.id, coin]));
  const highlights = ["bitcoin", "ethereum", "ripple", "solana"]
    .map((id) => ({ coin: featured.find((entry) => entry.id === id), market: marketById.get(id) }))
    .filter(
      (entry): entry is { coin: Coin; market: NonNullable<ReturnType<typeof marketById.get>> } =>
        Boolean(entry.coin && entry.market),
    );

  const fearGreedCaption = {
    "extreme-fear": locale === "ja" ? "極度の恐怖" : "Extreme fear",
    fear: locale === "ja" ? "恐怖" : "Fear",
    neutral: locale === "ja" ? "中立" : "Neutral",
    greed: locale === "ja" ? "強欲" : "Greed",
    "extreme-greed": locale === "ja" ? "極度の強欲" : "Extreme greed",
  }[snapshot.fearGreed.classification];

  return (
    <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-20 lg:pt-36">
      {/* 中間レイヤー: 粒子 + ネットワーク */}
      <ParticleField className="pointer-events-none absolute inset-0 -z-[1] size-full opacity-70" />

      {/* 中間レイヤー: 3Dコイン。狭い画面では1枚だけ、かつ小さく */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-16 top-24 hidden opacity-70 lg:block xl:end-8"
      >
        <div className="float-slow">
          <Coin3D symbol="BTC" color="#f7931a" size={280} />
        </div>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute end-56 top-[26rem] hidden opacity-50 xl:block"
      >
        <div className="float-slow" style={{ animationDelay: "1.4s" }}>
          <Coin3D symbol="ETH" color="#627eea" size={150} delay={-3} />
        </div>
      </div>

      <div className="relative mx-auto max-w-[110rem] px-4 sm:px-6">
        <div className="max-w-3xl">
          {/* 動くロゴ。見出しの上に置きます。高さは動画の比率から決まります */}
          <HeroLogoVideo className="mb-6 block w-full max-w-[19rem] sm:max-w-[28rem] lg:max-w-[34rem]" />
          <p className="eyebrow mb-4">{dict.hero.eyebrow}</p>
          <h1 className="text-4xl leading-[1.15] font-semibold sm:text-5xl lg:text-6xl">
            <span className="text-gradient">{dict.hero.title}</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base text-(--color-ink-soft) sm:text-lg">
            {dict.hero.subtitle}
          </p>

          <div className="mt-8 max-w-xl">
            <GlobalSearch locale={locale} dict={dict} compact />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <NeonLink href={localePath(locale, "/coins")}>{dict.hero.ctaCoins}</NeonLink>
            <NeonLink href={localePath(locale, "/exchanges")} tone="outline">
              {dict.hero.ctaExchanges}
            </NeonLink>
            <NeonLink href={localePath(locale, "/diagnosis/exchange")} tone="outline">
              {dict.hero.ctaDiagnosis}
            </NeonLink>
          </div>
        </div>

        {/* 前面レイヤー: 市場サマリー */}
        <div className="glass-strong mt-12 rounded-2xl p-5 sm:p-6 lg:mt-16">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
            <div>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <dt className="text-[0.6875rem] tracking-wide text-(--color-ink-dim) uppercase">
                    {dict.hero.marketCap}
                  </dt>
                  <dd className="tabular mt-1 font-mono text-lg font-semibold sm:text-xl">
                    {formatCompact(snapshot.global.totalMarketCap, locale)}
                  </dd>
                  <dd className="mt-0.5">
                    <PriceChange
                      value={snapshot.global.marketCapChange24h}
                      locale={locale}
                      labels={{
                        up: dict.a11y.priceUp,
                        down: dict.a11y.priceDown,
                        flat: dict.a11y.priceFlat,
                      }}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.6875rem] tracking-wide text-(--color-ink-dim) uppercase">
                    {dict.hero.volume24h}
                  </dt>
                  <dd className="tabular mt-1 font-mono text-lg font-semibold sm:text-xl">
                    {formatCompact(snapshot.global.totalVolume24h, locale)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.6875rem] tracking-wide text-(--color-ink-dim) uppercase">
                    {dict.market.btcDominance}
                  </dt>
                  <dd className="tabular mt-1 font-mono text-lg font-semibold sm:text-xl">
                    {formatPercent(snapshot.global.btcDominance, locale).replace("+", "")}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.6875rem] tracking-wide text-(--color-ink-dim) uppercase">
                    {dict.market.ethDominance}
                  </dt>
                  <dd className="tabular mt-1 font-mono text-lg font-semibold sm:text-xl">
                    {formatPercent(snapshot.global.ethDominance, locale).replace("+", "")}
                  </dd>
                </div>
              </dl>

              <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                {highlights.map(({ coin, market }) => (
                  <li key={coin.id}>
                    <Link
                      href={localePath(locale, `/coins/${coin.slug}`)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
                    >
                      <span
                        aria-hidden="true"
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: coin.color, boxShadow: `0 0 10px ${coin.color}` }}
                      />
                      <span className="font-mono text-sm font-semibold">{coin.symbol}</span>
                      <span className="truncate text-xs text-(--color-ink-dim)">
                        {t(coin.name, locale)}
                      </span>
                      <span className="ms-auto flex items-center gap-3">
                        <span className="tabular font-mono text-sm">
                          {formatCompact(market.price, locale)}
                        </span>
                        <PriceChange
                          value={market.change24h}
                          locale={locale}
                          labels={{
                            up: dict.a11y.priceUp,
                            down: dict.a11y.priceDown,
                            flat: dict.a11y.priceFlat,
                          }}
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-center border-t border-(--color-hairline) pt-6 lg:border-s lg:border-t-0 lg:ps-8 lg:pt-0">
              <FearGreedGauge
                value={snapshot.fearGreed.value}
                label={dict.hero.fearGreed}
                caption={fearGreedCaption}
              />
            </div>
          </div>

          <DataFreshness
            snapshot={snapshot}
            dict={dict}
            locale={locale}
            className="mt-5 border-t border-(--color-hairline) pt-4"
          />
        </div>
      </div>
    </section>
  );
}
