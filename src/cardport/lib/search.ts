/**
 * カードの検索・絞り込み・並び替え。
 *
 * 静的エクスポートでも全機能が動くよう、すべてクライアント側で完結させます。
 * URL のクエリと相互変換できる形にして、絞り込んだ状態を共有できるようにしています。
 */
import type { Card, CardBrand, CardCategoryId, CardRank, Eligibility } from "@/cardport/data/types";
import { pick } from "@/cardport/i18n/localized";
import type { Locale } from "@/cardport/i18n/locales";
import { computeScore } from "./scoring";

export type FeeBand = "any" | "free" | "conditional" | "under2000" | "under11000";
export type SortKey = "score" | "rate" | "fee" | "name";

export type CardFilters = {
  query: string;
  fee: FeeBand;
  /** 最低基本還元率（%） */
  minRate: number;
  brands: CardBrand[];
  ranks: CardRank[];
  categories: CardCategoryId[];
  eligibility: Eligibility[];
  /** ほしい機能 */
  features: FeatureFlag[];
  /** 発行までの最長日数。0 は指定なし */
  maxIssueDays: number;
  sort: SortKey;
};

export type FeatureFlag =
  | "travel-insurance"
  | "shopping-insurance"
  | "lounge"
  | "mile"
  | "touch"
  | "mobile"
  | "emoney"
  | "family"
  | "etc"
  | "business"
  | "overseas"
  | "virtual";

export const defaultFilters: CardFilters = {
  query: "",
  fee: "any",
  minRate: 0,
  brands: [],
  ranks: [],
  categories: [],
  eligibility: [],
  features: [],
  maxIssueDays: 0,
  sort: "score",
};

function matchesFee(card: Card, band: FeeBand): boolean {
  switch (band) {
    case "free":
      return card.annualFee === 0;
    case "conditional":
      return card.annualFee > 0 && (Boolean(card.feeWaiver) || card.firstYearFee === 0);
    case "under2000":
      return card.annualFee <= 2200;
    case "under11000":
      return card.annualFee <= 11000;
    default:
      return true;
  }
}

function matchesFeature(card: Card, feature: FeatureFlag): boolean {
  switch (feature) {
    case "travel-insurance":
      return card.travelInsuranceOverseas.amount > 0 || card.travelInsuranceDomestic.amount > 0;
    case "shopping-insurance":
      return card.shoppingInsurance.amount > 0;
    case "lounge":
      return card.lounges.ja.length > 0;
    case "mile":
      return card.mileRate > 0;
    case "touch":
      return card.touchPayment;
    case "mobile":
      return card.mobilePayments.length > 0;
    case "emoney":
      return card.electronicMoney.length > 0;
    case "family":
      return card.rank !== "debit" && card.rank !== "prepaid" && card.rank !== "virtual";
    case "etc":
      return card.rank !== "prepaid" && card.rank !== "virtual";
    case "business":
      return Boolean(card.business);
    case "overseas":
      return card.fxFee <= 2.0;
    case "virtual":
      return card.rank === "virtual" || Boolean(card.business?.virtualCards);
    default:
      return true;
  }
}

/** カード1枚ぶんの検索対象テキスト */
export function searchableText(card: Card, locale: Locale): string {
  return [
    pick(card.name, locale),
    card.slug,
    pick(card.summary, locale),
    pick(card.pointName, locale),
    ...card.categories,
    ...card.brands,
    card.rank,
  ]
    .join(" ")
    .toLowerCase();
}

export function filterCards(list: Card[], filters: CardFilters, locale: Locale): Card[] {
  const query = filters.query.trim().toLowerCase();

  const filtered = list.filter((card) => {
    if (query && !searchableText(card, locale).includes(query)) return false;
    if (!matchesFee(card, filters.fee)) return false;
    if (card.baseRate < filters.minRate) return false;
    if (filters.brands.length > 0 && !filters.brands.some((b) => card.brands.includes(b)))
      return false;
    if (filters.ranks.length > 0 && !filters.ranks.includes(card.rank)) return false;
    if (
      filters.categories.length > 0 &&
      !filters.categories.some((category) => card.categories.includes(category))
    ) {
      return false;
    }
    if (
      filters.eligibility.length > 0 &&
      !filters.eligibility.some((value) => card.eligibility.includes(value))
    ) {
      return false;
    }
    if (filters.features.length > 0 && !filters.features.every((f) => matchesFeature(card, f))) {
      return false;
    }
    if (filters.maxIssueDays > 0 && card.issueDays > filters.maxIssueDays) return false;
    return true;
  });

  return sortCards(filtered, filters.sort, locale);
}

export function sortCards(list: Card[], sort: SortKey, locale: Locale): Card[] {
  const sorted = [...list];
  switch (sort) {
    case "rate":
      return sorted.sort((a, b) => b.baseRate - a.baseRate || a.annualFee - b.annualFee);
    case "fee":
      return sorted.sort((a, b) => a.annualFee - b.annualFee || b.baseRate - a.baseRate);
    case "name":
      return sorted.sort((a, b) =>
        pick(a.name, locale).localeCompare(pick(b.name, locale), locale),
      );
    default:
      return sorted.sort((a, b) => computeScore(b) - computeScore(a) || a.annualFee - b.annualFee);
  }
}

/** 絞り込み条件を URL クエリへ */
export function filtersToQuery(filters: CardFilters): string {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.fee !== "any") params.set("fee", filters.fee);
  if (filters.minRate > 0) params.set("rate", String(filters.minRate));
  if (filters.brands.length) params.set("brand", filters.brands.join(","));
  if (filters.ranks.length) params.set("rank", filters.ranks.join(","));
  if (filters.categories.length) params.set("cat", filters.categories.join(","));
  if (filters.eligibility.length) params.set("who", filters.eligibility.join(","));
  if (filters.features.length) params.set("feat", filters.features.join(","));
  if (filters.maxIssueDays > 0) params.set("days", String(filters.maxIssueDays));
  if (filters.sort !== "score") params.set("sort", filters.sort);
  return params.toString();
}

export function queryToFilters(params: URLSearchParams): CardFilters {
  const list = <T extends string>(key: string): T[] =>
    (params.get(key)?.split(",").filter(Boolean) as T[]) ?? [];

  return {
    query: params.get("q") ?? "",
    fee: (params.get("fee") as FeeBand) ?? "any",
    minRate: Number(params.get("rate") ?? 0) || 0,
    brands: list<CardBrand>("brand"),
    ranks: list<CardRank>("rank"),
    categories: list<CardCategoryId>("cat"),
    eligibility: list<Eligibility>("who"),
    features: list<FeatureFlag>("feat"),
    maxIssueDays: Number(params.get("days") ?? 0) || 0,
    sort: (params.get("sort") as SortKey) ?? "score",
  };
}
