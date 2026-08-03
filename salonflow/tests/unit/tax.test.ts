import { describe, expect, it } from "vitest";

import { calculateTax, displayPrice, taxLine, TAX_RATE_BPS } from "@/lib/tax";
import { applyBps, distribute, formatMoney, roundMoney, sum } from "@/lib/money";

describe("taxLine — inclusive pricing (内税)", () => {
  it("extracts 10% tax from a tax-included price", () => {
    // ¥5,500 including 10% -> net ¥5,000, tax ¥500
    const line = taxLine(
      { unitPrice: 5500, quantity: 1, category: "standard" },
      "inclusive",
      "floor",
    );
    expect(line.net).toBe(5000);
    expect(line.tax).toBe(500);
    expect(line.gross).toBe(5500);
  });

  it("keeps net + tax === gross when the division is not exact", () => {
    // ¥3,333 including 10% -> net 3030.0, tax 303
    const line = taxLine(
      { unitPrice: 3333, quantity: 1, category: "standard" },
      "inclusive",
      "floor",
    );
    expect(line.net + line.tax).toBe(line.gross);
    expect(line.gross).toBe(3333);
  });

  it("applies the reduced rate", () => {
    // ¥1,080 including 8% -> net ¥1,000, tax ¥80
    const line = taxLine(
      { unitPrice: 1080, quantity: 1, category: "reduced" },
      "inclusive",
      "floor",
    );
    expect(line.net).toBe(1000);
    expect(line.tax).toBe(80);
  });
});

describe("taxLine — exclusive pricing (外税)", () => {
  it("adds 10% to a tax-excluded price", () => {
    const line = taxLine(
      { unitPrice: 5000, quantity: 1, category: "standard" },
      "exclusive",
      "floor",
    );
    expect(line.net).toBe(5000);
    expect(line.tax).toBe(500);
    expect(line.gross).toBe(5500);
  });

  it("rounds fractional tax down by default", () => {
    // ¥333 * 10% = 33.3 -> 33
    const line = taxLine(
      { unitPrice: 333, quantity: 1, category: "standard" },
      "exclusive",
      "floor",
    );
    expect(line.tax).toBe(33);
    expect(line.gross).toBe(366);
  });

  it("honours the rounding mode", () => {
    const base = { unitPrice: 333, quantity: 1, category: "standard" } as const;
    expect(taxLine(base, "exclusive", "floor").tax).toBe(33);
    expect(taxLine(base, "exclusive", "ceil").tax).toBe(34);
    expect(taxLine(base, "exclusive", "half_up").tax).toBe(33);
  });
});

describe("taxLine — exempt and out-of-scope", () => {
  it("charges no tax and reports the full amount as net", () => {
    for (const category of ["exempt", "out_of_scope"] as const) {
      const line = taxLine({ unitPrice: 4000, quantity: 1, category }, "exclusive", "floor");
      expect(line.tax).toBe(0);
      expect(line.net).toBe(4000);
      expect(line.gross).toBe(4000);
    }
  });
});

describe("taxLine — quantities and discounts", () => {
  it("multiplies before taxing", () => {
    const line = taxLine(
      { unitPrice: 1000, quantity: 3, category: "standard" },
      "exclusive",
      "floor",
    );
    expect(line.net).toBe(3000);
    expect(line.tax).toBe(300);
  });

  it("subtracts the line discount before taxing", () => {
    const line = taxLine(
      { unitPrice: 1000, quantity: 3, discount: 500, category: "standard" },
      "exclusive",
      "floor",
    );
    expect(line.net).toBe(2500);
    expect(line.tax).toBe(250);
  });

  it("clamps a discount larger than the line to zero rather than going negative", () => {
    const line = taxLine(
      { unitPrice: 1000, quantity: 1, discount: 5000, category: "standard" },
      "exclusive",
      "floor",
    );
    expect(line.net).toBe(0);
    expect(line.gross).toBe(0);
  });
});

describe("calculateTax", () => {
  it("breaks totals out per rate, as a qualified invoice requires", () => {
    const totals = calculateTax(
      [
        { unitPrice: 5000, quantity: 1, category: "standard" }, // cut
        { unitPrice: 2000, quantity: 1, category: "standard" }, // treatment
        { unitPrice: 1000, quantity: 2, category: "reduced" }, // retail food item
      ],
      "exclusive",
      "floor",
    );

    expect(totals.netTotal).toBe(9000);
    expect(totals.taxTotal).toBe(700 + 160);
    expect(totals.grossTotal).toBe(9860);

    const standard = totals.byCategory.find((entry) => entry.category === "standard");
    const reduced = totals.byCategory.find((entry) => entry.category === "reduced");

    expect(standard).toMatchObject({ net: 7000, tax: 700 });
    expect(reduced).toMatchObject({ net: 2000, tax: 160 });
  });

  it("returns zeros for an empty basket", () => {
    const totals = calculateTax([], "inclusive", "floor");
    expect(totals).toMatchObject({ netTotal: 0, taxTotal: 0, grossTotal: 0 });
  });
});

describe("displayPrice", () => {
  it("shows the tax-included figure regardless of the stored mode", () => {
    expect(displayPrice(5000, "standard", "exclusive")).toBe(5500);
    expect(displayPrice(5500, "standard", "inclusive")).toBe(5500);
  });
});

describe("rates", () => {
  it("declares the Japanese standard and reduced rates in basis points", () => {
    expect(TAX_RATE_BPS.standard).toBe(1000);
    expect(TAX_RATE_BPS.reduced).toBe(800);
  });
});

describe("money helpers", () => {
  it("sums integers exactly", () => {
    expect(sum([1100, 2200, 3300])).toBe(6600);
  });

  it("applies a basis-point rate", () => {
    expect(applyBps(10_000, 1500)).toBe(1500); // 15%
    expect(applyBps(3333, 1000)).toBe(333);
  });

  it("rounds away from zero for half_up on negatives", () => {
    expect(roundMoney(-2.5, "half_up")).toBe(-3);
    expect(roundMoney(2.5, "half_up")).toBe(3);
  });

  it("formats JPY without decimals", () => {
    expect(formatMoney(3300, "JPY", "ja-JP")).toContain("3,300");
  });
});

describe("distribute", () => {
  it("splits an amount so the parts sum exactly to the whole", () => {
    const parts = distribute(1000, [1, 1, 1]);
    expect(parts.reduce((total, part) => total + part, 0)).toBe(1000);
    expect(parts).toEqual([334, 333, 333]);
  });

  it("weights the split", () => {
    const parts = distribute(1000, [3, 1]);
    expect(parts).toEqual([750, 250]);
  });

  it("handles a zero total weight without losing the amount", () => {
    const parts = distribute(500, [0, 0]);
    expect(parts.reduce((total, part) => total + part, 0)).toBe(500);
  });

  it("distributes a negative amount (a refund) exactly", () => {
    const parts = distribute(-1000, [1, 1, 1]);
    expect(parts.reduce((total, part) => total + part, 0)).toBe(-1000);
  });
});
