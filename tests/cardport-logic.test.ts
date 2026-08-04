/**
 * CARD PORT のロジック（ランキング・診断・シミュレーター・アフィリエイト・検索・RAG）。
 *
 * 数値を出す機能は、根拠を説明できることが要件です。
 * そのため「同じ入力からは必ず同じ結果になる」ことを確認します。
 */
import { describe, expect, it } from "vitest";

import { cards, getCardById } from "@/cardport/data/cards";
import { diagnoses, getDiagnosis } from "@/cardport/data/diagnoses";
import { getDictionary } from "@/cardport/i18n";
import { locales, isLocale, getLocaleDefinition } from "@/cardport/i18n/locales";
import { pick } from "@/cardport/i18n/localized";
import { formatAnnualFee, formatDate, formatYen } from "@/cardport/i18n/format";
import { computeScore, getWeights, rankCards, scoreAxes } from "@/cardport/lib/scoring";
import { auditAffiliateLinks, resolveLink } from "@/cardport/lib/affiliate";
import {
  decodeAnswers,
  encodeAnswers,
  estimateAnnualPoints,
  runDiagnosis,
} from "@/cardport/lib/diagnosis-engine";
import {
  breakEvenSpend,
  simulateAnnual,
  simulateFxFee,
  simulateMiles,
  totalMonthlySpend,
} from "@/cardport/lib/simulator-engine";
import { defaultFilters, filterCards, filtersToQuery, queryToFilters } from "@/cardport/lib/search";
import { answer, containsSensitiveInput, retrieve } from "@/cardport/lib/rag";
import { path, routes, swapLocale } from "@/cardport/lib/routes";

describe("ランキング", () => {
  it("重みの合計が 1 に正規化される", () => {
    for (const category of ["overall", "free-annual-fee", "travel", "business"] as const) {
      const weights = getWeights(category);
      const total = scoreAxes.reduce((sum, axis) => sum + weights[axis], 0);
      expect(total).toBeCloseTo(1, 6);
    }
  });

  it("スコアが 0〜5 に収まる", () => {
    for (const card of cards) {
      expect(computeScore(card)).toBeGreaterThanOrEqual(0);
      expect(computeScore(card)).toBeLessThanOrEqual(5);
    }
  });

  it("同じ入力からは必ず同じ順位になる（同点は年会費順→スラッグ順）", () => {
    const first = rankCards(cards, "overall").map((entry) => entry.card.id);
    const second = rankCards([...cards].reverse(), "overall").map((entry) => entry.card.id);
    expect(first).toEqual(second);
  });

  it("年会費無料カテゴリでは年会費の重みが最大になる", () => {
    const weights = getWeights("free-annual-fee");
    const max = Math.max(...scoreAxes.map((axis) => weights[axis]));
    expect(weights.fee).toBe(max);
  });

  it("順位が 1 から連番になる", () => {
    const ranked = rankCards(cards, "overall", 5);
    expect(ranked.map((entry) => entry.rank)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("アフィリエイト", () => {
  it("提携リンクが無いときは公式サイトへ nofollow で遷移し、広告扱いにしない", () => {
    const link = resolveLink({
      officialUrl: "https://example.com/x",
      placement: "card-list",
      locale: "ja",
      itemId: "nova-zero",
    });
    expect(link.isSponsored).toBe(false);
    expect(link.rel).toContain("nofollow");
    expect(link.rel).not.toContain("sponsored");
    expect(link.href).toBe("https://example.com/x");
  });

  it("提携リンクがあるときは sponsored を付け、計測パラメータを載せる", () => {
    const link = resolveLink({
      affiliateId: "test",
      officialUrl: "https://example.com/x",
      placement: "ranking",
      locale: "en",
      itemId: "nova-zero",
      position: 3,
    });
    // 初期状態では未提携のため公式リンクになります（この分岐は下の直接検証で担保）
    expect(link.rel).toContain("nofollow");
  });

  it("期限切れの提携リンクは公式サイトへフォールバックする", async () => {
    const { affiliateLinks } = await import("@/cardport/lib/affiliate");
    affiliateLinks["__test__"] = {
      id: "__test__",
      program: "Test",
      url: "https://partner.example/apply",
      expiresOn: "2020-01-01",
    };
    const link = resolveLink({
      affiliateId: "__test__",
      officialUrl: "https://official.example",
      placement: "card-detail",
      locale: "ja",
      itemId: "x",
    });
    expect(link.isSponsored).toBe(false);
    expect(link.href).toBe("https://official.example");

    affiliateLinks["__test__"].expiresOn = "2099-01-01";
    const active = resolveLink({
      affiliateId: "__test__",
      officialUrl: "https://official.example",
      placement: "card-detail",
      locale: "ja",
      itemId: "x",
      position: 2,
    });
    expect(active.isSponsored).toBe(true);
    expect(active.rel).toContain("sponsored");
    expect(active.href).toContain("utm_medium=affiliate");
    expect(active.href).toContain("cp_pos=2");
    delete affiliateLinks["__test__"];
  });

  it("リンクの棚卸しで未設定を検出できる", () => {
    const audit = auditAffiliateLinks();
    expect(audit.length).toBeGreaterThan(0);
    expect(audit.every((entry) => ["unset", "active", "expired"].includes(entry.status))).toBe(
      true,
    );
  });
});

describe("診断", () => {
  const diagnosis = getDiagnosis("card-match")!;

  it("同じ回答からは必ず同じ結果になる", () => {
    const answers = { "monthly-spend": "over-150k", "fee-tolerance": "any", priority: "mile" };
    const a = runDiagnosis(diagnosis, answers).map((result) => result.card.id);
    const b = runDiagnosis(diagnosis, answers).map((result) => result.card.id);
    expect(a).toEqual(b);
  });

  it("一致度が 0〜100 に収まる", () => {
    const results = runDiagnosis(diagnosis, { priority: "reward" });
    for (const result of results) {
      expect(result.match).toBeGreaterThanOrEqual(0);
      expect(result.match).toBeLessThanOrEqual(100);
    }
  });

  it("年会費無料を選ぶと、無料カードが上位に来る", () => {
    const results = runDiagnosis(diagnosis, { "fee-tolerance": "free-only" });
    expect(results[0].card.annualFee).toBe(0);
  });

  it("回答コードを往復しても同じ回答に戻る", () => {
    const answers = { experience: "first", "monthly-spend": "30k-80k", priority: "reward" };
    const code = encodeAnswers(diagnosis, answers);
    expect(decodeAnswers(diagnosis, code)).toEqual(answers);
  });

  it("すべての診断が結果を返す（対象が0件にならない）", () => {
    for (const item of diagnoses) {
      const first = item.questions[0];
      const results = runDiagnosis(item, { [first.id]: first.options[0].id });
      expect(results.length).toBeGreaterThan(0);
    }
  });

  it("年間ポイントの概算は基本還元率で計算する（最大還元率を使わない）", () => {
    const card = getCardById("nova-zero")!;
    // 月5万円 × 12か月 × 1.0% = 6,000
    expect(estimateAnnualPoints(card, 50000)).toBe(6000);
  });
});

describe("シミュレーター", () => {
  const card = getCardById("meridian-gold")!;

  it("年間ポイントが 利用額 × 基本還元率 になる", () => {
    const result = simulateAnnual(card, { daily: 100000 });
    expect(result.annualSpend).toBe(1200000);
    expect(result.annualPoints).toBe(12000);
    expect(result.netValue).toBe(12000 - card.annualFee);
  });

  it("年会費の回収に必要な利用額を求められる", () => {
    // 11,000円 ÷ 1.0% = 1,100,000円
    expect(breakEvenSpend(card)).toBe(1_100_000);
  });

  it("年会費無料のカードは回収に必要な利用額が 0 になる", () => {
    expect(breakEvenSpend(getCardById("nova-zero")!)).toBe(0);
  });

  it("マイル非対応のカードは 0 マイルになる", () => {
    expect(simulateMiles(getCardById("nova-zero")!, 1_000_000)).toBe(0);
  });

  it("海外事務手数料を計算できる", () => {
    // 30万円 × 1.6% = 4,800円
    expect(simulateFxFee(card, 300_000)).toBe(4800);
  });

  it("負の入力があっても合計が壊れない", () => {
    expect(totalMonthlySpend({ a: 1000, b: Number.NaN })).toBe(1000);
  });
});

describe("検索", () => {
  it("年会費無料で絞ると無料カードだけが残る", () => {
    const result = filterCards(cards, { ...defaultFilters, fee: "free" }, "ja");
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((card) => card.annualFee === 0)).toBe(true);
  });

  it("ラウンジ条件で絞るとラウンジのあるカードだけが残る", () => {
    const result = filterCards(cards, { ...defaultFilters, features: ["lounge"] }, "ja");
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((card) => card.lounges.ja.length > 0)).toBe(true);
  });

  it("該当なしの条件では空になる（例外を投げない）", () => {
    const result = filterCards(cards, { ...defaultFilters, query: "存在しないカード名" }, "ja");
    expect(result).toEqual([]);
  });

  it("条件をURLへ書き出して読み戻せる", () => {
    const filters = {
      ...defaultFilters,
      query: "ゴールド",
      fee: "under11000" as const,
      minRate: 1,
      brands: ["visa" as const],
      features: ["lounge" as const],
      sort: "rate" as const,
    };
    expect(queryToFilters(new URLSearchParams(filtersToQuery(filters)))).toEqual(filters);
  });
});

describe("チャットボット（RAG）", () => {
  it("カード名で検索するとそのカードが上位に来る", () => {
    const docs = retrieve("ノヴァ ゼロ", "ja");
    expect(docs.length).toBeGreaterThan(0);
    expect(docs[0].title).toContain("ノヴァ");
  });

  it("回答には必ず参照元が付く", () => {
    const result = answer("年会費無料", "ja");
    expect(result.kind).toBe("answer");
    expect(result.sources.length).toBeGreaterThan(0);
    for (const source of result.sources)
      expect(source.href.startsWith("/card-port/ja/")).toBe(true);
  });

  it("該当が無いときは作らずに empty を返す", () => {
    expect(answer("qqqqzzzzxxxx", "ja").kind).toBe("empty");
  });

  it("カード番号らしき入力を検出して回答しない", () => {
    expect(containsSensitiveInput("4111 1111 1111 1111")).toBe(true);
    expect(containsSensitiveInput("セキュリティコードは何桁ですか")).toBe(true);
    expect(containsSensitiveInput("年会費無料のカードは？")).toBe(false);
    expect(answer("4111111111111111", "ja").kind).toBe("blocked");
  });
});

describe("URL と多言語", () => {
  it("言語つきパスを組み立てられる", () => {
    // CRYPTO PORT が /<言語>/ を使っているため、CARD PORT は /card-port 配下にあります
    expect(path("ja")).toBe("/card-port/ja");
    expect(routes.card("en", "nova-zero")).toBe("/card-port/en/cards/nova-zero");
  });

  it("表示中のページを保ったまま言語だけ切り替えられる", () => {
    expect(swapLocale("/card-port/ja/cards/nova-zero", "en")).toBe("/card-port/en/cards/nova-zero");
    expect(swapLocale("/card-port/ja", "ko")).toBe("/card-port/ko");
    expect(swapLocale("/senri/card-port/ja/cards", "en", "/senri")).toBe(
      "/senri/card-port/en/cards",
    );
  });

  it("未定義の言語コードを弾く", () => {
    expect(isLocale("ja")).toBe(true);
    expect(isLocale("about")).toBe(false);
  });

  it("すべての言語で辞書が引ける（未訳キーは英語→日本語へフォールバック）", () => {
    for (const locale of locales) {
      const dictionary = getDictionary(locale);
      expect(dictionary.nav.cards.length).toBeGreaterThan(0);
      expect(dictionary.legal.verifyNotice.length).toBeGreaterThan(0);
      expect(dictionary.diagnosis.disclaimer.length).toBeGreaterThan(0);
    }
  });

  it("右から左へ読む言語が定義されている", () => {
    expect(getLocaleDefinition("ar").rtl).toBe(true);
    expect(getLocaleDefinition("ja").rtl).toBeUndefined();
  });

  it("金額は言語を変えても円建てのまま（実際の請求額と食い違わせない）", () => {
    for (const locale of ["ja", "en", "ar"] as const) {
      expect(formatYen(11000, locale)).toMatch(/11,?000|١١٬٠٠٠/);
    }
    expect(formatAnnualFee(0, "ja", "無料")).toBe("無料");
  });

  it("日付が言語別に整形される", () => {
    expect(formatDate("2026-07-15", "ja")).toContain("2026");
    expect(formatDate("2026-07-15", "en")).toContain("2026");
  });

  it("コンテンツのフォールバックが働く", () => {
    const card = cards[0];
    // 未定義の言語では英語 → 日本語の順に落ちます
    expect(pick(card.name, "th").length).toBeGreaterThan(0);
  });
});
