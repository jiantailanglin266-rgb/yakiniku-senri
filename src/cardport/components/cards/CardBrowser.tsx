"use client";

/**
 * カード検索・絞り込み。
 *
 * ■ すべてクライアント側で処理する理由
 *   このサイトは静的配信できることを要件にしているため、
 *   検索APIに依存しません。掲載件数はページあたり数十件規模なので、
 *   全件をメモリ上で絞り込んでも体感速度に影響しません。
 *
 * ■ 表示件数
 *   一度に描画する件数を制限し、「もっと見る」で増やします。
 *   数百件を一度に描画すると、スマートフォンで初期描画が遅くなるためです。
 */
import { useMemo, useState } from "react";

import { cards as allCards } from "@/cardport/data/cards";
import { cardCategories } from "@/cardport/data/categories";
import { brandLabels, brandOrder } from "@/cardport/data/issuers";
import type { Card, CardBrand, CardCategoryId, CardRank, Eligibility } from "@/cardport/data/types";
import type { Dictionary } from "@/cardport/i18n";
import { pick } from "@/cardport/i18n/localized";
import type { Locale } from "@/cardport/i18n/locales";
import {
  defaultFilters,
  filterCards,
  type CardFilters,
  type FeatureFlag,
  type FeeBand,
  type SortKey,
} from "@/cardport/lib/search";
import { Button, Panel, cx } from "@/cardport/components/ui/primitives";
import { CardTile } from "./CardTile";

const PAGE_SIZE = 9;

const ranks: CardRank[] = [
  "standard",
  "gold",
  "platinum",
  "black",
  "business",
  "debit",
  "prepaid",
  "virtual",
];

const eligibilityKeys: { id: Eligibility; ja: string; en: string }[] = [
  { id: "general", ja: "一般", en: "General" },
  { id: "student", ja: "学生", en: "Students" },
  { id: "young", ja: "若年層", en: "Young adults" },
  { id: "business", ja: "法人", en: "Companies" },
  { id: "sole-proprietor", ja: "個人事業主", en: "Sole proprietors" },
];

const featureKeys: { id: FeatureFlag; ja: string; en: string }[] = [
  { id: "travel-insurance", ja: "旅行保険", en: "Travel insurance" },
  { id: "shopping-insurance", ja: "ショッピング保険", en: "Purchase protection" },
  { id: "lounge", ja: "空港ラウンジ", en: "Airport lounge" },
  { id: "mile", ja: "マイル交換", en: "Mile transfer" },
  { id: "touch", ja: "タッチ決済", en: "Contactless" },
  { id: "mobile", ja: "スマホ決済", en: "Mobile payments" },
  { id: "emoney", ja: "電子マネー", en: "E-money" },
  { id: "etc", ja: "ETCカード", en: "ETC card" },
  { id: "family", ja: "家族カード", en: "Family card" },
  { id: "business", ja: "法人利用", en: "Business use" },
  { id: "overseas", ja: "海外手数料が低い", en: "Low FX fee" },
  { id: "virtual", ja: "バーチャルカード", en: "Virtual card" },
];

const feeBands: { id: FeeBand; key: keyof Dictionary["filters"] }[] = [
  { id: "any", key: "annualFeeAny" },
  { id: "free", key: "annualFeeFree" },
  { id: "conditional", key: "annualFeeConditional" },
  { id: "under2000", key: "annualFeeUnder2000" },
  { id: "under11000", key: "annualFeeUnder11000" },
];

const sortKeys: { id: SortKey; key: keyof Dictionary["filters"] }[] = [
  { id: "score", key: "sortScore" },
  { id: "rate", key: "sortRate" },
  { id: "fee", key: "sortFee" },
  { id: "name", key: "sortName" },
];

function toggleIn<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "rounded-full border px-3 py-1.5 text-[0.74rem] transition-colors",
        active
          ? "border-cp-cyan/60 bg-cp-cyan/15 text-cp-cyan"
          : "border-cp-line text-cp-mist hover:border-cp-cyan/40 hover:text-cp-ink",
      )}
    >
      {children}
    </button>
  );
}

export function CardBrowser({
  locale,
  dictionary,
  pool,
  initialFilters,
}: {
  locale: Locale;
  dictionary: Dictionary;
  /** 対象カード。省略時は全カード */
  pool?: Card[];
  initialFilters?: Partial<CardFilters>;
}) {
  const [filters, setFilters] = useState<CardFilters>({ ...defaultFilters, ...initialFilters });
  const [visible, setVisible] = useState(PAGE_SIZE);

  const source = pool ?? allCards;
  const results = useMemo(() => filterCards(source, filters, locale), [source, filters, locale]);

  const update = (patch: Partial<CardFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
    setVisible(PAGE_SIZE);
  };

  const label = (item: { ja: string; en: string }) => (locale === "ja" ? item.ja : item.en);

  return (
    <div className="grid gap-6 lg:grid-cols-[19rem_1fr]">
      <Panel as="aside" className="h-fit p-4 lg:sticky lg:top-24">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[0.9rem] font-semibold">{dictionary.common.filter}</h3>
          <Button
            variant="ghost"
            onClick={() => update(defaultFilters)}
            className="!px-2 !py-1 text-[0.72rem]"
          >
            {dictionary.common.reset}
          </Button>
        </div>

        <div className="mt-4 space-y-5">
          <div>
            <label htmlFor="cardport-search" className="text-cp-dim mb-1.5 block text-[0.72rem]">
              {dictionary.common.search}
            </label>
            <input
              id="cardport-search"
              type="search"
              value={filters.query}
              onChange={(event) => update({ query: event.target.value })}
              placeholder={dictionary.common.searchPlaceholder}
              className="border-cp-line bg-cp-navy/70 text-cp-ink placeholder:text-cp-dim focus:border-cp-cyan w-full rounded-lg border px-3 py-2 text-[0.8rem] outline-none"
            />
          </div>

          <fieldset>
            <legend className="text-cp-dim mb-2 text-[0.72rem]">
              {dictionary.filters.annualFee}
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {feeBands.map((band) => (
                <Chip
                  key={band.id}
                  active={filters.fee === band.id}
                  onClick={() => update({ fee: band.id })}
                >
                  {dictionary.filters[band.key]}
                </Chip>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="cardport-rate" className="text-cp-dim mb-1.5 block text-[0.72rem]">
              {dictionary.filters.rewardRate}
              <span className="numeric text-cp-cyan ms-2">{filters.minRate.toFixed(1)}% +</span>
            </label>
            <input
              id="cardport-rate"
              type="range"
              min={0}
              max={1.5}
              step={0.1}
              value={filters.minRate}
              onChange={(event) => update({ minRate: Number(event.target.value) })}
              className="accent-cp-cyan w-full"
            />
          </div>

          <fieldset>
            <legend className="text-cp-dim mb-2 text-[0.72rem]">{dictionary.filters.brand}</legend>
            <div className="flex flex-wrap gap-1.5">
              {brandOrder.map((brand) => (
                <Chip
                  key={brand}
                  active={filters.brands.includes(brand)}
                  onClick={() => update({ brands: toggleIn<CardBrand>(filters.brands, brand) })}
                >
                  {brandLabels[brand]}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-cp-dim mb-2 text-[0.72rem]">{dictionary.filters.rank}</legend>
            <div className="flex flex-wrap gap-1.5">
              {ranks.map((rank) => (
                <Chip
                  key={rank}
                  active={filters.ranks.includes(rank)}
                  onClick={() => update({ ranks: toggleIn<CardRank>(filters.ranks, rank) })}
                >
                  {dictionary.rank[rank]}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-cp-dim mb-2 text-[0.72rem]">{dictionary.filters.target}</legend>
            <div className="flex flex-wrap gap-1.5">
              {eligibilityKeys.map((item) => (
                <Chip
                  key={item.id}
                  active={filters.eligibility.includes(item.id)}
                  onClick={() =>
                    update({ eligibility: toggleIn<Eligibility>(filters.eligibility, item.id) })
                  }
                >
                  {label(item)}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-cp-dim mb-2 text-[0.72rem]">
              {dictionary.filters.purpose}
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {cardCategories.slice(0, 12).map((category) => (
                <Chip
                  key={category.id}
                  active={filters.categories.includes(category.id)}
                  onClick={() =>
                    update({
                      categories: toggleIn<CardCategoryId>(filters.categories, category.id),
                    })
                  }
                >
                  {pick(category.title, locale)}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-cp-dim mb-2 text-[0.72rem]">
              {dictionary.filters.features}
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {featureKeys.map((item) => (
                <Chip
                  key={item.id}
                  active={filters.features.includes(item.id)}
                  onClick={() =>
                    update({ features: toggleIn<FeatureFlag>(filters.features, item.id) })
                  }
                >
                  {label(item)}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-cp-dim mb-2 text-[0.72rem]">
              {dictionary.filters.issueSpeed}
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {[0, 1, 3, 7].map((days) => (
                <Chip
                  key={days}
                  active={filters.maxIssueDays === days}
                  onClick={() => update({ maxIssueDays: days })}
                >
                  {days === 0
                    ? dictionary.filters.annualFeeAny
                    : `${days}${dictionary.card.days}${locale === "ja" ? "以内" : " or less"}`}
                </Chip>
              ))}
            </div>
          </fieldset>
        </div>
      </Panel>

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-cp-mist text-[0.82rem]">
            <span className="numeric text-cp-cyan text-[1.05rem] font-semibold">
              {results.length}
            </span>{" "}
            {dictionary.common.results}
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="cardport-sort" className="text-cp-dim text-[0.72rem]">
              {dictionary.common.sort}
            </label>
            <select
              id="cardport-sort"
              value={filters.sort}
              onChange={(event) => update({ sort: event.target.value as SortKey })}
              className="border-cp-line bg-cp-navy/70 text-cp-ink focus:border-cp-cyan rounded-lg border px-2.5 py-1.5 text-[0.76rem] outline-none"
            >
              {sortKeys.map((item) => (
                <option key={item.id} value={item.id}>
                  {dictionary.filters[item.key]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {results.length === 0 ? (
          <Panel className="p-8 text-center">
            <p className="text-cp-mist text-[0.85rem]">{dictionary.common.noResults}</p>
            <Button variant="outline" onClick={() => update(defaultFilters)} className="mt-4">
              {dictionary.common.reset}
            </Button>
          </Panel>
        ) : (
          <>
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.slice(0, visible).map((card) => (
                <li key={card.id}>
                  <CardTile card={card} locale={locale} dictionary={dictionary} />
                </li>
              ))}
            </ul>
            {visible < results.length ? (
              <div className="mt-8 text-center">
                <Button variant="outline" onClick={() => setVisible((value) => value + PAGE_SIZE)}>
                  {dictionary.common.more}（{results.length - visible}）
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
