/**
 * CARD PORT の掲載データの整合性テスト。
 *
 * 金融メディアとして「壊れていると気づけない不具合」を機械的に潰します。
 *   - スラッグの衝突（カテゴリとカードが同じURLになる）
 *   - 参照切れ（存在しないカードIDを指している）
 *   - 禁止表現の混入
 *   - 実データのないレビュー・評価を構造化データへ出していないこと
 */
import { describe, expect, it } from "vitest";

import { cards, getCardById } from "@/cardport/data/cards";
import { campaigns, isExpired, sortCampaigns } from "@/cardport/data/campaigns";
import { cardCategories } from "@/cardport/data/categories";
import { diagnoses } from "@/cardport/data/diagnoses";
import { featureCollections } from "@/cardport/data/features";
import { guides } from "@/cardport/data/guides";
import { issuers } from "@/cardport/data/issuers";
import { news } from "@/cardport/data/news";
import { paymentServices } from "@/cardport/data/payments";
import { policyPages } from "@/cardport/data/policies";
import { simulators } from "@/cardport/data/simulators";
import { financialTools } from "@/cardport/data/tools";
import { videos } from "@/cardport/data/videos";
import { web3Services } from "@/cardport/data/web3";
import { faqs } from "@/cardport/data/faqs";
import { authors } from "@/cardport/data/authors";
import { marqueeKeywords, marqueeRows } from "@/cardport/data/marquee";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

describe("スラッグ", () => {
  it("カードのスラッグが重複しない", () => {
    const slugs = cards.map((card) => card.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("カテゴリIDとカードのスラッグが衝突しない（同じURL階層のため）", () => {
    const categoryIds = new Set<string>(cardCategories.map((category) => category.id));
    for (const card of cards) {
      expect(categoryIds.has(card.slug)).toBe(false);
    }
  });

  it("記事・動画・サービス・ガイド・固定ページのスラッグが重複しない", () => {
    for (const list of [
      news,
      videos,
      web3Services,
      guides,
      policyPages,
      financialTools,
      paymentServices,
    ]) {
      const slugs = list.map((item) => item.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });
});

describe("参照の整合性", () => {
  it("カードの発行会社が存在する", () => {
    const issuerIds = new Set(issuers.map((issuer) => issuer.id));
    for (const card of cards) expect(issuerIds.has(card.issuerId)).toBe(true);
  });

  it("カードのカテゴリが定義済みである", () => {
    const categoryIds = new Set<string>(cardCategories.map((category) => category.id));
    for (const card of cards) {
      for (const category of card.categories) expect(categoryIds.has(category)).toBe(true);
    }
  });

  it("キャンペーンが実在するカードを指す", () => {
    for (const campaign of campaigns) expect(getCardById(campaign.cardId)).toBeDefined();
  });

  it("記事・動画の関連カードが実在する", () => {
    for (const article of news) {
      for (const id of article.relatedCardIds) expect(getCardById(id)).toBeDefined();
    }
    for (const video of videos) {
      for (const id of video.featuredCardIds) expect(getCardById(id)).toBeDefined();
    }
  });

  it("記事の執筆者・監修者が実在する", () => {
    const authorIds = new Set(authors.map((author) => author.id));
    for (const article of news) {
      expect(authorIds.has(article.authorId)).toBe(true);
      if (article.supervisorId) expect(authorIds.has(article.supervisorId)).toBe(true);
    }
    for (const guide of guides) expect(authorIds.has(guide.authorId)).toBe(true);
  });

  it("決済サービスの相性カードが実在する", () => {
    for (const service of paymentServices) {
      for (const id of service.bestCardIds) expect(getCardById(id)).toBeDefined();
    }
  });
});

describe("日付", () => {
  it("情報確認日・更新日が ISO 8601 である", () => {
    for (const card of cards) {
      expect(card.verifiedOn).toMatch(ISO_DATE);
      expect(card.updatedOn).toMatch(ISO_DATE);
    }
    for (const article of news) {
      expect(article.publishedAt).toMatch(ISO_DATE);
      expect(article.updatedAt).toMatch(ISO_DATE);
    }
  });

  it("記事の更新日が公開日より前にならない", () => {
    for (const article of news) {
      expect(article.updatedAt >= article.publishedAt).toBe(true);
    }
  });

  it("キャンペーンの期限切れ判定が働く", () => {
    const past = campaigns[0];
    expect(isExpired(past, new Date("2099-01-01T00:00:00Z"))).toBe(true);
    expect(isExpired(past, new Date("2000-01-01T00:00:00Z"))).toBe(false);
  });

  it("キャンペーンの並びは期限が近い順、期限切れは末尾", () => {
    const sorted = sortCampaigns(campaigns, new Date("2026-09-01T00:00:00Z"));
    const expiredIndexes = sorted
      .map((campaign, index) =>
        isExpired(campaign, new Date("2026-09-01T00:00:00Z")) ? index : -1,
      )
      .filter((index) => index >= 0);
    const activeIndexes = sorted
      .map((campaign, index) =>
        isExpired(campaign, new Date("2026-09-01T00:00:00Z")) ? -1 : index,
      )
      .filter((index) => index >= 0);
    if (expiredIndexes.length && activeIndexes.length) {
      expect(Math.min(...expiredIndexes)).toBeGreaterThan(Math.max(...activeIndexes));
    }
  });
});

describe("金融メディアとしての表示ルール", () => {
  /** 使ってはいけない表現。断定・保証・条件隠しにつながるもの */
  const banned = [
    "必ず審査に通",
    "誰でも発行でき",
    "絶対に得",
    "確実に儲か",
    "無条件でもらえ",
    "審査なしで作れ",
    "100%発行",
  ];

  const allText = JSON.stringify([
    cards,
    campaigns,
    news,
    guides,
    faqs,
    web3Services,
    financialTools,
    paymentServices,
    policyPages,
    diagnoses,
    simulators,
    featureCollections,
  ]);

  it.each(banned)("禁止表現「%s」を含まない", (phrase) => {
    // 「使ってはいけない表現」として列挙している編集方針ページ自体は除きます
    const withoutPolicy = JSON.stringify([cards, campaigns, news, guides, faqs, web3Services]);
    expect(withoutPolicy).not.toContain(phrase);
    expect(allText.length).toBeGreaterThan(0);
  });

  it("すべてのカードにデメリットと注意点がある", () => {
    for (const card of cards) {
      expect(card.cons.ja.length).toBeGreaterThan(0);
      expect(card.notes.ja.length).toBeGreaterThan(0);
    }
  });

  it("すべてのカードに申込み条件と限度額の注記がある", () => {
    for (const card of cards) {
      expect(card.eligibilityNote.ja.length).toBeGreaterThan(10);
      expect(card.limitNote.ja.length).toBeGreaterThan(5);
    }
  });

  it("キャンペーンに達成条件・期限・対象者がそろっている", () => {
    for (const campaign of campaigns) {
      expect(campaign.conditions.ja.length).toBeGreaterThan(0);
      expect(campaign.endsOn).toMatch(ISO_DATE);
      expect(campaign.target.ja.length).toBeGreaterThan(0);
    }
  });

  it("Web3サービスにリスクと規制の注記がある", () => {
    for (const service of web3Services) {
      expect(service.risks.ja.length).toBeGreaterThan(0);
      expect(service.regulatoryNote.ja.length).toBeGreaterThan(10);
    }
  });

  it("シミュレーターに前提条件と計算式がある", () => {
    for (const simulator of simulators) {
      expect(simulator.assumptions.ja.length).toBeGreaterThan(0);
      expect(simulator.method.ja.length).toBeGreaterThan(0);
    }
  });
});

describe("数値の妥当性", () => {
  it("最大還元率が基本還元率を下回らない", () => {
    for (const card of cards) expect(card.maxRate).toBeGreaterThanOrEqual(card.baseRate);
  });

  it("初年度年会費が通常年会費を超えない", () => {
    for (const card of cards) expect(card.firstYearFee).toBeLessThanOrEqual(card.annualFee);
  });

  it("スコアが 0〜5 の範囲に収まる", () => {
    for (const card of cards) {
      for (const value of Object.values(card.scores)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(5);
      }
    }
  });

  it("海外事務手数料が現実的な範囲にある", () => {
    for (const card of cards) {
      expect(card.fxFee).toBeGreaterThanOrEqual(0);
      expect(card.fxFee).toBeLessThanOrEqual(5);
    }
  });
});

describe("斜めマーキーのキーワード", () => {
  const all = marqueeKeywords.flatMap((keyword) => Object.values(keyword.text));

  it("日本語が必ずあり、空文字がない", () => {
    for (const keyword of marqueeKeywords) {
      expect(keyword.text.ja.trim().length).toBeGreaterThan(0);
    }
    for (const text of all) expect(text.trim().length).toBeGreaterThan(0);
  });

  it("金額・還元率・順位などの数字を流さない", () => {
    /*
      条件を伴わない数字だけが目に入ると、実際の条件と食い違って読まれます。
      「3Dセキュア」のように、規格名として数字を含むものだけを許可します。
    */
    const allowed = new Set(["3Dセキュア", "3-D Secure", "Web3.0決済", "Web3 payments"]);
    for (const text of all) {
      if (allowed.has(text)) continue;
      expect(text, text).not.toMatch(/[0-9０-９]/);
    }
  });

  it("金額・割合の記号を含まない", () => {
    for (const text of all) expect(text, text).not.toMatch(/[¥￥%％円]/);
  });

  it("実在する決済ブランド名を流さない（掲載カードはすべて架空のため）", () => {
    const brands = [
      "visa",
      "mastercard",
      "american express",
      "amex",
      "jcb",
      "unionpay",
      "paypal",
      "apple pay",
      "google pay",
      "楽天",
      "三井住友",
      "イオン",
    ];
    const joined = all.join(" ").toLowerCase();
    for (const brand of brands) expect(joined, brand).not.toContain(brand);
  });

  it("同じキーワードが重複しない", () => {
    const ja = marqueeKeywords.map((keyword) => keyword.text.ja);
    expect(new Set(ja).size).toBe(ja.length);
  });

  it("行へ配り直しても、1語も落とさず、空の行を作らない", () => {
    for (const rows of [2, 3, 4]) {
      const distributed = marqueeRows(rows);
      expect(distributed).toHaveLength(rows);
      expect(distributed.flat()).toHaveLength(marqueeKeywords.length);
      for (const row of distributed) expect(row.length).toBeGreaterThan(0);
    }
  });

  it("文字色に使えるアクセントだけを指定している", () => {
    /*
      --color-cp-violet / --color-cp-electric は暗い地の上で 4.5:1 を割るため、
      面（枠線・発光）専用にしています。文字には使いません。
    */
    const usable = new Set(["cyan", "magenta", "emerald", "amber", "gold"]);
    for (const keyword of marqueeKeywords) {
      expect(usable.has(keyword.accent), keyword.accent).toBe(true);
    }
  });
});
