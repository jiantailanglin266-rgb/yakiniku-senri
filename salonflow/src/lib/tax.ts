/**
 * Japanese consumption tax (消費税).
 *
 * Supports the standard rate, the reduced rate, exempt (非課税) and
 * out-of-scope (不課税) categories, both tax-inclusive (内税) and
 * tax-exclusive (外税) pricing, and configurable rounding.
 *
 * IMPORTANT: rates are configuration, not law. They are declared here so a
 * rate change is a one-line edit, but the correct treatment of any given
 * service — and the qualified-invoice requirements around it — must be
 * confirmed with a tax professional. See docs/legal/LEGAL_REVIEW.md.
 */

import { roundMoney, type Money, type RoundingMode } from "./money";

export type TaxCategory = "standard" | "reduced" | "exempt" | "out_of_scope";
export type TaxMode = "inclusive" | "exclusive";

/** Rates in basis points. 10% -> 1000. */
export const TAX_RATE_BPS: Record<TaxCategory, number> = {
  standard: 1000,
  reduced: 800,
  exempt: 0,
  out_of_scope: 0,
};

export interface TaxableLine {
  /** Unit price as entered, interpreted according to `mode`. */
  unitPrice: Money;
  quantity: number;
  /** Line-level discount, in the same tax mode as `unitPrice`. */
  discount?: Money;
  category: TaxCategory;
}

export interface TaxedLine {
  /** Amount excluding tax. */
  net: Money;
  /** Tax charged on this line. */
  tax: Money;
  /** Amount including tax. */
  gross: Money;
  category: TaxCategory;
}

export interface TaxTotals {
  lines: TaxedLine[];
  /** Total excluding tax. */
  netTotal: Money;
  /** Total tax. */
  taxTotal: Money;
  /** Total including tax — what the customer pays. */
  grossTotal: Money;
  /** Tax broken out per rate, as required on a qualified invoice. */
  byCategory: Array<{ category: TaxCategory; net: Money; tax: Money; gross: Money }>;
}

/**
 * Compute tax for a single line.
 *
 * Rounding is applied once, at the line level. Japanese practice permits
 * per-line or per-invoice rounding; per-line is used here because it matches
 * what a customer sees on the receipt. The choice is documented as an open
 * question (U-02) pending confirmation by a tax advisor.
 */
export function taxLine(line: TaxableLine, mode: TaxMode, rounding: RoundingMode): TaxedLine {
  const rateBps = TAX_RATE_BPS[line.category];
  const raw = line.unitPrice * line.quantity - (line.discount ?? 0);
  const amount = Math.max(0, raw);

  if (rateBps === 0) {
    return { net: amount, tax: 0, gross: amount, category: line.category };
  }

  if (mode === "inclusive") {
    // The entered price already contains tax: net = gross * 10000 / (10000 + rate)
    const net = roundMoney((amount * 10_000) / (10_000 + rateBps), rounding);
    return { net, tax: amount - net, gross: amount, category: line.category };
  }

  const tax = roundMoney((amount * rateBps) / 10_000, rounding);
  return { net: amount, tax, gross: amount + tax, category: line.category };
}

export function calculateTax(
  lines: readonly TaxableLine[],
  mode: TaxMode,
  rounding: RoundingMode = "floor",
): TaxTotals {
  const taxed = lines.map((line) => taxLine(line, mode, rounding));

  const grouped = new Map<TaxCategory, { net: Money; tax: Money; gross: Money }>();
  for (const line of taxed) {
    const bucket = grouped.get(line.category) ?? { net: 0, tax: 0, gross: 0 };
    bucket.net += line.net;
    bucket.tax += line.tax;
    bucket.gross += line.gross;
    grouped.set(line.category, bucket);
  }

  return {
    lines: taxed,
    netTotal: taxed.reduce((total, line) => total + line.net, 0),
    taxTotal: taxed.reduce((total, line) => total + line.tax, 0),
    grossTotal: taxed.reduce((total, line) => total + line.gross, 0),
    byCategory: [...grouped.entries()].map(([category, bucket]) => ({ category, ...bucket })),
  };
}

/** Convenience: the tax-inclusive price a customer is quoted for one item. */
export function displayPrice(
  price: Money,
  category: TaxCategory,
  mode: TaxMode,
  rounding: RoundingMode = "floor",
): Money {
  return taxLine({ unitPrice: price, quantity: 1, category }, mode, rounding).gross;
}
