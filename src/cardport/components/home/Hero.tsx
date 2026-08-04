/**
 * ファーストビュー。
 *
 * ■ レイヤー構造
 *   背景（グラデーション・決済ネットワーク・粒子）
 *   → 中間（3Dカード群）
 *   → 前面（コピー・検索・CTA）
 *
 * ■ 可読性
 *   コピーとCTAは装飾レイヤーの上に置き、背景側には最大でも 0.35 の不透明度しか与えません。
 *   数値（掲載件数など）は等幅で表示し、桁を読み違えないようにします。
 */
import Link from "next/link";

import { cards } from "@/cardport/data/cards";
import { getNews } from "@/cardport/data/news";
import { locales } from "@/cardport/i18n/locales";
import type { Dictionary } from "@/cardport/i18n";
import { formatDate } from "@/cardport/i18n/format";
import { pick } from "@/cardport/i18n/localized";
import type { Locale } from "@/cardport/i18n/locales";
import { routes } from "@/cardport/lib/routes";
import { LinkButton } from "@/cardport/components/ui/primitives";
import { CardArt } from "@/cardport/components/visual/CardArt";
import { ParticleField } from "@/cardport/components/visual/ParticleField";
import { PaymentNetwork } from "@/cardport/components/visual/PaymentNetwork";
import { TiltCard } from "@/cardport/components/visual/TiltCard";

export function Hero({ locale, dictionary }: { locale: Locale; dictionary: Dictionary }) {
  // 券面の見映えが異なる3枚を選び、奥行きを出します
  const showcase = [
    cards.find((card) => card.slug === "aurum-platinum"),
    cards.find((card) => card.slug === "nova-zero"),
    cards.find((card) => card.slug === "chainbridge-nova"),
  ].filter(Boolean) as typeof cards;

  const latest = getNews(1)[0];

  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-24">
      {/* 背景レイヤー */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <PaymentNetwork className="absolute inset-x-0 top-0 h-[130%] w-full opacity-[0.35]" />
        <ParticleField className="absolute inset-0 h-full w-full opacity-70" />
        <div className="from-cp-void/0 via-cp-void/30 to-cp-void absolute inset-0 bg-gradient-to-b" />
      </div>

      <div className="mx-auto grid max-w-[88rem] items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr]">
        {/* 前面レイヤー：コピーとCTA */}
        <div>
          <p className="text-cp-cyan font-cp-mono mb-4 text-[0.68rem] tracking-[0.32em] uppercase">
            {dictionary.hero.eyebrow}
          </p>
          <h1 className="text-[2rem] leading-[1.25] font-semibold sm:text-[2.9rem] lg:text-[3.3rem]">
            <span className="text-aurora">{dictionary.hero.title}</span>
          </h1>
          <p className="text-cp-mist mt-5 max-w-xl text-[0.92rem] leading-relaxed sm:text-[1rem]">
            {dictionary.hero.subtitle}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href={routes.cards(locale)} variant="primary">
              {dictionary.hero.ctaCompare}
            </LinkButton>
            <LinkButton href={routes.diagnosis(locale, "card-match")} variant="outline">
              {dictionary.hero.ctaDiagnosis}
            </LinkButton>
            <LinkButton href={routes.campaigns(locale)} variant="ghost">
              {dictionary.hero.ctaCampaign} →
            </LinkButton>
            <LinkButton href={routes.business(locale)} variant="ghost">
              {dictionary.hero.ctaBusiness} →
            </LinkButton>
          </div>

          <dl className="border-cp-line/60 mt-10 grid max-w-lg grid-cols-3 gap-4 border-t pt-6">
            <div>
              <dt className="text-cp-dim text-[0.68rem]">{dictionary.hero.statCards}</dt>
              <dd className="numeric text-cp-cyan text-[1.4rem] font-semibold">{cards.length}</dd>
            </div>
            <div>
              <dt className="text-cp-dim text-[0.68rem]">{dictionary.hero.statCategories}</dt>
              <dd className="numeric text-cp-violet text-[1.4rem] font-semibold">60+</dd>
            </div>
            <div>
              <dt className="text-cp-dim text-[0.68rem]">{dictionary.hero.statLanguages}</dt>
              <dd className="numeric text-cp-magenta text-[1.4rem] font-semibold">
                {locales.length}
              </dd>
            </div>
          </dl>

          {latest ? (
            <Link
              href={routes.newsArticle(locale, latest.slug)}
              className="glass hover:border-cp-cyan/50 mt-6 flex items-center gap-3 rounded-full px-4 py-2.5 text-[0.76rem] transition-colors"
            >
              <span className="bg-cp-cyan/18 text-cp-cyan shrink-0 rounded-full px-2 py-0.5 text-[0.64rem]">
                NEWS
              </span>
              <span className="text-cp-mist line-clamp-1">{pick(latest.title, locale)}</span>
              <span className="text-cp-dim numeric ms-auto hidden shrink-0 sm:block">
                {formatDate(latest.publishedAt, locale)}
              </span>
            </Link>
          ) : null}
        </div>

        {/* 中間レイヤー：3Dカード群 */}
        <div className="card3d-scene relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative aspect-[4/3.4]">
            {showcase.map((card, index) => {
              const layout = [
                { top: "0%", left: "14%", width: "70%", tilt: "-8deg", z: 3, delay: "0s" },
                { top: "26%", left: "0%", width: "62%", tilt: "6deg", z: 2, delay: "1.1s" },
                { top: "40%", left: "38%", width: "62%", tilt: "-3deg", z: 1, delay: "2.2s" },
              ][index];
              return (
                <div
                  key={card.id}
                  className="port-float absolute"
                  style={{
                    top: layout.top,
                    left: layout.left,
                    width: layout.width,
                    zIndex: layout.z,
                    ["--port-tilt" as string]: layout.tilt,
                    ["--port-delay" as string]: layout.delay,
                  }}
                >
                  <TiltCard maxTilt={14}>
                    <CardArt card={card} locale={locale} />
                  </TiltCard>
                </div>
              );
            })}

            {/* ホログラム型の情報パネル */}
            <div className="glass absolute right-0 bottom-0 z-10 rounded-xl px-3.5 py-2.5 backdrop-blur-md">
              <p className="text-cp-dim text-[0.62rem] tracking-wide">
                {dictionary.hero.networkLabel}
              </p>
              <p className="numeric text-cp-cyan text-[0.9rem] font-semibold">
                ●●●● ●●●● ●●●● <span className="text-cp-emerald">LIVE</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
