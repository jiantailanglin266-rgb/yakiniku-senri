import { describe, expect, it } from "vitest";

import {
  DUPLICATE_SUGGEST_THRESHOLD,
  duplicateScore,
  normalizeEmail,
  normalizeKana,
  normalizeName,
  normalizePhone,
  toHalfWidth,
  toKatakana,
} from "@/lib/normalize";
import { escapeCsvCell, maskEmail, maskTail, slugify, toCsv } from "@/lib/utils";

describe("normalizePhone", () => {
  it("collapses the ways a Japanese mobile number gets typed", () => {
    const expected = "+819012345678";
    expect(normalizePhone("090-1234-5678")).toBe(expected);
    expect(normalizePhone("09012345678")).toBe(expected);
    expect(normalizePhone("+81 90 1234 5678")).toBe(expected);
    expect(normalizePhone("０９０－１２３４－５６７８")).toBe(expected);
    expect(normalizePhone(" 090 (1234) 5678 ")).toBe(expected);
  });

  it("keeps a landline distinguishable", () => {
    expect(normalizePhone("03-1234-5678")).toBe("+81312345678");
  });

  it("returns null for empty or non-numeric input", () => {
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("---")).toBeNull();
  });
});

describe("normalizeEmail", () => {
  it("lower-cases and trims", () => {
    expect(normalizeEmail("  Test.User@Example.COM ")).toBe("test.user@example.com");
  });

  it("folds full-width characters", () => {
    expect(normalizeEmail("ｔｅｓｔ＠ｅｘａｍｐｌｅ．ｃｏｍ")).toBe("test@example.com");
  });

  it("does NOT strip dots or plus tags", () => {
    // Treating these as equivalent would merge two different people on
    // providers that distinguish them.
    expect(normalizeEmail("a.b+tag@example.com")).toBe("a.b+tag@example.com");
  });
});

describe("kana handling", () => {
  it("converts hiragana to katakana", () => {
    expect(toKatakana("やまだ")).toBe("ヤマダ");
  });

  it("normalises a reading for comparison", () => {
    expect(normalizeKana("やまだ　はなこ")).toBe("ヤマダハナコ");
    expect(normalizeKana("ヤマダ ハナコ")).toBe("ヤマダハナコ");
  });

  it("folds full-width ASCII", () => {
    expect(toHalfWidth("ＡＢＣ１２３")).toBe("ABC123");
  });

  it("strips whitespace from names", () => {
    expect(normalizeName("山田 花子")).toBe("山田花子");
    expect(normalizeName("  ")).toBeNull();
  });
});

describe("duplicateScore", () => {
  it("scores an exact phone match highly", () => {
    const score = duplicateScore(
      { phoneNormalized: "+819012345678" },
      { phoneNormalized: "+819012345678" },
    );
    expect(score).toBeGreaterThanOrEqual(DUPLICATE_SUGGEST_THRESHOLD - 5);
  });

  it("treats phone plus name as a strong duplicate signal", () => {
    const score = duplicateScore(
      { name: "山田花子", phoneNormalized: "+819012345678" },
      { name: "山田花子", phoneNormalized: "+819012345678" },
    );
    expect(score).toBeGreaterThanOrEqual(DUPLICATE_SUGGEST_THRESHOLD);
  });

  it("does not suggest a merge on a common name alone", () => {
    const score = duplicateScore({ name: "佐藤" }, { name: "佐藤" });
    expect(score).toBeLessThan(DUPLICATE_SUGGEST_THRESHOLD);
  });

  it("scores nothing when there is nothing comparable", () => {
    expect(duplicateScore({}, {})).toBe(0);
  });

  it("caps at 100", () => {
    const identical = {
      name: "山田花子",
      nameKana: "ヤマダハナコ",
      phoneNormalized: "+819012345678",
      emailNormalized: "hanako@example.com",
      birthDate: new Date("1990-05-05"),
    };
    expect(duplicateScore(identical, identical)).toBe(100);
  });
});

describe("CSV escaping", () => {
  it("neutralises a formula injection attempt", () => {
    // A customer "name" that Excel would otherwise execute.
    expect(escapeCsvCell("=cmd|'/c calc'!A1")).toBe("'=cmd|'/c calc'!A1");
    expect(escapeCsvCell("+1234")).toBe("'+1234");
    expect(escapeCsvCell("-1+2")).toBe("'-1+2");
    expect(escapeCsvCell("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  it("quotes cells containing separators", () => {
    expect(escapeCsvCell("山田, 花子")).toBe('"山田, 花子"');
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
  });

  it("renders empty for null and undefined", () => {
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(undefined)).toBe("");
  });

  it("joins rows with CRLF", () => {
    expect(toCsv([["a", "b"], ["c", "d"]])).toBe("a,b\r\nc,d");
  });
});

describe("masking", () => {
  it("keeps only the last characters of a phone number", () => {
    expect(maskTail("09012345678", 2)).toBe("*********78");
  });

  it("masks the local part of an email", () => {
    expect(maskEmail("hanako@example.com")).toBe("h*****@example.com");
  });

  it("returns null for absent values", () => {
    expect(maskTail(null)).toBeNull();
    expect(maskEmail(null)).toBeNull();
  });
});

describe("slugify", () => {
  it("produces a URL-safe slug", () => {
    expect(slugify("Demo Beauty Salon 表参道")).toMatch(/^demo-beauty-salon/);
  });

  it("falls back when nothing survives", () => {
    expect(slugify("表参道")).toMatch(/^s[a-z0-9]+$/);
  });
});
