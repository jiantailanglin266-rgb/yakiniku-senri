/**
 * Money handling.
 *
 * Every amount in this system is an integer in the currency's minor unit.
 * For JPY the minor unit is the yen itself, so 1 = ¥1. Floating point is
 * never used, because 0.1 + 0.2 !== 0.3 and a salon's daily close must
 * balance to the yen.
 */

export type Money = number;

export class MoneyError extends Error {}

/** Guard against a non-integer sneaking in from a parsed form value. */
export function assertMoney(value: number, label = "amount"): Money {
  if (!Number.isInteger(value)) {
    throw new MoneyError(`${label} must be an integer minor-unit value, received ${value}`);
  }
  if (!Number.isSafeInteger(value)) {
    throw new MoneyError(`${label} exceeds the safe integer range`);
  }
  return value;
}

export function sum(amounts: readonly Money[]): Money {
  return amounts.reduce<Money>((total, amount) => total + amount, 0);
}

/**
 * Apply a rate expressed in basis points (10000 = 100%).
 * Basis points keep percentage discounts and commissions exact.
 */
export function applyBps(amount: Money, bps: number, rounding: RoundingMode = "floor"): Money {
  return roundMoney((amount * bps) / 10_000, rounding);
}

export type RoundingMode = "floor" | "ceil" | "half_up";

export function roundMoney(value: number, mode: RoundingMode = "floor"): Money {
  switch (mode) {
    case "ceil":
      return Math.ceil(value - Number.EPSILON);
    case "half_up":
      // Math.round rounds -0.5 towards zero; force away-from-zero for symmetry.
      return value < 0 ? -Math.round(-value) : Math.round(value);
    case "floor":
    default:
      return Math.floor(value + Number.EPSILON);
  }
}

const CURRENCY_MINOR_DIGITS: Record<string, number> = {
  JPY: 0,
  KRW: 0,
  USD: 2,
  EUR: 2,
  TWD: 2,
  CNY: 2,
};

export function minorUnitDigits(currency: string): number {
  return CURRENCY_MINOR_DIGITS[currency.toUpperCase()] ?? 2;
}

/** Render an amount for display, e.g. formatMoney(3300, "JPY", "ja") -> "￥3,300". */
export function formatMoney(amount: Money, currency = "JPY", locale = "ja-JP"): string {
  const digits = minorUnitDigits(currency);
  const value = digits === 0 ? amount : amount / 10 ** digits;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/**
 * Distribute `amount` across `weights` so the parts sum exactly to `amount`.
 * Used to split a whole-sale discount or tax figure back onto line items
 * without losing or inventing a yen. The largest-remainder method assigns
 * leftover units to the entries that were rounded down the most.
 */
export function distribute(amount: Money, weights: readonly number[]): Money[] {
  const totalWeight = weights.reduce((total, weight) => total + weight, 0);
  if (weights.length === 0) return [];
  if (totalWeight <= 0) {
    // Nothing to weigh by: put everything on the first entry.
    return weights.map((_, index) => (index === 0 ? amount : 0));
  }

  const exact = weights.map((weight) => (amount * weight) / totalWeight);
  const floored = exact.map((value) => Math.floor(value));
  let remainder = amount - floored.reduce((total, value) => total + value, 0);

  const order = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction);

  const result = [...floored];
  for (const entry of order) {
    if (remainder === 0) break;
    const step = remainder > 0 ? 1 : -1;
    result[entry.index] = (result[entry.index] ?? 0) + step;
    remainder -= step;
  }

  return result;
}
