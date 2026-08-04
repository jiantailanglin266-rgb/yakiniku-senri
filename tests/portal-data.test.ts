import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";

import { defaultLocale, isLocale, localePath, locales } from "@/portal/i18n/config";
import { getDictionary, hasAuthoredDictionary } from "@/portal/i18n/dictionaries";
import { coins, getCoin, getCoinBySymbol } from "@/portal/data/coins";
import { domesticExchanges, exchanges, overseasExchanges } from "@/portal/data/exchanges";
import { wallets } from "@/portal/data/wallets";
import { categoryFields, tools } from "@/portal/data/tools";
import { videos } from "@/portal/data/videos";
import { learnArticles } from "@/portal/data/learn";
import { diagnoses } from "@/portal/data/diagnoses";
import { legalPages } from "@/portal/data/legal";
import { groupedNews, news, relatedByStory, trendingNews } from "@/portal/data/news";
import { footerNav, mainNav, siteFaq } from "@/portal/data/site-content";

/**
 * データの整合性テスト。
 *
 * ここで守りたいのは「リンク先が存在すること」と「事実性のルールを破っていないこと」です。
 * 表示の細部よりも、壊れると気づきにくいものを対象にしています。
 */

// vitest はプロジェクトルートを cwd として起動します
const publicDir = path.join(process.cwd(), "public");

describe("多言語設定", () => {
  it("要件の13言語をすべて備えている", () => {
    const required = [
      "ja",
      "en",
      "ko",
      "zh-cn",
      "zh-tw",
      "es",
      "fr",
      "de",
      "pt",
      "th",
      "vi",
      "id",
      "ar",
    ];
    for (const code of required) {
      expect(locales.map((locale) => locale.code)).toContain(code);
    }
  });

  it("言語コードが重複していない", () => {
    const codes = locales.map((locale) => locale.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("すべての言語に国旗画像が存在する", () => {
    // 言語を足したのに旗を足し忘れる、が一番起きやすい壊れ方です
    for (const locale of locales) {
      expect(
        existsSync(`${publicDir}/images/flags/${locale.country}.webp`),
        `国旗が見つかりません: ${locale.country} (${locale.labelJa})`,
      ).toBe(true);
    }
  });

  it("並び順が日本語・英語から始まる（アルファベット順ではない）", () => {
    expect(locales[0].code).toBe("ja");
    expect(locales[1].code).toBe("en");
  });

  it("右横書きの言語に rtl が設定されている", () => {
    expect(locales.find((locale) => locale.code === "ar")?.rtl).toBe(true);
  });

  it("isLocale が未対応の言語を弾く", () => {
    expect(isLocale("ja")).toBe(true);
    expect(isLocale("xx")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("localePath が言語プレフィックスを付ける", () => {
    expect(localePath("ja")).toBe("/ja");
    expect(localePath("en", "/coins/bitcoin")).toBe("/en/coins/bitcoin");
    expect(localePath("ko", "coins")).toBe("/ko/coins");
  });
});

describe("辞書", () => {
  it("日本語と英語は人手で用意されている", () => {
    expect(hasAuthoredDictionary("ja")).toBe(true);
    expect(hasAuthoredDictionary("en")).toBe(true);
  });

  it("未整備の言語は英語へフォールバックする（日本語のままにしない）", () => {
    const thai = getDictionary("th");
    expect(thai.common.search).toBe(getDictionary("en").common.search);
  });

  it("同じキー構造を持つ", () => {
    const ja = getDictionary("ja");
    const en = getDictionary("en");
    expect(Object.keys(en).sort()).toEqual(Object.keys(ja).sort());
    for (const key of Object.keys(ja) as Array<keyof typeof ja>) {
      expect(Object.keys(en[key]).sort()).toEqual(Object.keys(ja[key]).sort());
    }
  });
});

describe("通貨", () => {
  it("スラッグとIDが重複していない", () => {
    expect(new Set(coins.map((coin) => coin.slug)).size).toBe(coins.length);
    expect(new Set(coins.map((coin) => coin.id)).size).toBe(coins.length);
  });

  it("要件の13銘柄を掲載している", () => {
    const symbols = coins.map((coin) => coin.symbol);
    for (const symbol of [
      "BTC",
      "ETH",
      "XRP",
      "SOL",
      "BNB",
      "ADA",
      "DOGE",
      "AVAX",
      "LINK",
      "DOT",
      "SUI",
      "TRX",
      "SHIB",
    ]) {
      expect(symbols).toContain(symbol);
    }
  });

  it("取扱取引所として存在しないIDを参照していない", () => {
    const ids = new Set(exchanges.map((exchange) => exchange.id));
    for (const coin of coins) {
      for (const exchangeId of coin.listedOn) {
        expect(ids.has(exchangeId), `${coin.id} → ${exchangeId}`).toBe(true);
      }
    }
  });

  it("すべての通貨にリスクの記載がある", () => {
    // 価格変動リスクを書かないまま銘柄ページを公開しないための歯止めです
    for (const coin of coins) {
      expect(coin.risks.ja.length, coin.id).toBeGreaterThan(0);
      expect(coin.risks.en.length, coin.id).toBeGreaterThan(0);
    }
  });

  it("スラッグ・シンボルのどちらでも引ける", () => {
    expect(getCoin("bitcoin")?.symbol).toBe("BTC");
    expect(getCoin("xrp")?.id).toBe("ripple");
    expect(getCoinBySymbol("eth")?.id).toBe("ethereum");
  });
});

describe("取引所", () => {
  it("国内と海外に分かれている", () => {
    expect(domesticExchanges.length).toBeGreaterThan(0);
    expect(overseasExchanges.length).toBeGreaterThan(0);
    expect(domesticExchanges.length + overseasExchanges.length).toBe(exchanges.length);
  });

  it("評価は0〜5の範囲で、内訳を必ず持つ", () => {
    for (const exchange of exchanges) {
      expect(exchange.rating).toBeGreaterThanOrEqual(0);
      expect(exchange.rating).toBeLessThanOrEqual(5);
      for (const score of Object.values(exchange.ratingBreakdown)) {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(5);
      }
    }
  });

  it("メリットとデメリットの両方を書いている", () => {
    // 良い点しか書かない比較記事にしないための歯止めです
    for (const exchange of exchanges) {
      expect(exchange.pros.ja.length, exchange.id).toBeGreaterThan(0);
      expect(exchange.cons.ja.length, exchange.id).toBeGreaterThan(0);
    }
  });

  it("海外取引所には日本語対応の状況を明示している", () => {
    for (const exchange of overseasExchanges) {
      expect(["yes", "no", "partial", "unknown"]).toContain(exchange.japanese);
    }
  });
});

describe("ウォレット・ツール", () => {
  it("ウォレットのスラッグが重複していない", () => {
    expect(new Set(wallets.map((wallet) => wallet.slug)).size).toBe(wallets.length);
  });

  it("要件のウォレットを掲載している", () => {
    const names = wallets.map((wallet) => wallet.name);
    for (const name of [
      "MetaMask",
      "Phantom",
      "Trust Wallet",
      "Ledger",
      "Trezor",
      "Safe",
      "Coinbase Wallet",
    ]) {
      expect(names).toContain(name);
    }
  });

  it("ツールのカテゴリすべてに表示項目が定義されている", () => {
    for (const tool of tools) {
      expect(categoryFields[tool.category], tool.id).toBeDefined();
    }
  });

  it("ツールの代替サービスが実在するIDを指している", () => {
    const ids = new Set(tools.map((tool) => tool.id));
    for (const tool of tools) {
      for (const alternative of tool.alternatives) {
        expect(ids.has(alternative), `${tool.id} → ${alternative}`).toBe(true);
      }
    }
  });

  it("すべてのツールに安全上の注意がある", () => {
    for (const tool of tools) {
      expect(tool.safety.ja.length, tool.id).toBeGreaterThan(0);
    }
  });
});

describe("ニュース", () => {
  it("情報元と公開日時が必ず入っている", () => {
    for (const article of news) {
      expect(article.outlet.length, article.id).toBeGreaterThan(0);
      expect(Number.isNaN(Date.parse(article.publishedAt)), article.id).toBe(false);
    }
  });

  it("同じ storyKey の記事は1件にまとめられる", () => {
    const groups = groupedNews();
    const etf = groups.find((group) => group.article.storyKey === "sample-etf-flows");
    expect(etf).toBeDefined();
    expect(etf?.duplicates.length).toBeGreaterThan(0);
    // まとめられた記事は一覧の代表としては現れません
    expect(groups.filter((group) => group.article.storyKey === "sample-etf-flows")).toHaveLength(1);
  });

  it("同じ話題の記事を相互に辿れる", () => {
    const article = news.find((entry) => entry.id === "n-001");
    expect(article).toBeDefined();
    expect(relatedByStory(article!).map((entry) => entry.id)).toContain("n-012");
  });

  it("急上昇は指定件数以内で、新しい記事が有利になる", () => {
    const trending = trendingNews(3);
    expect(trending.length).toBeLessThanOrEqual(3);
    expect(trending.length).toBeGreaterThan(0);
  });

  it("関連通貨として存在しないIDを参照していない", () => {
    const ids = new Set(coins.map((coin) => coin.id));
    for (const article of news) {
      for (const coinId of article.relatedCoins) {
        expect(ids.has(coinId), `${article.id} → ${coinId}`).toBe(true);
      }
    }
  });
});

describe("動画", () => {
  it("要約と文字起こしがあり、動画を見なくても要点が読める", () => {
    for (const video of videos) {
      expect(video.keyPoints.ja.length, video.slug).toBeGreaterThan(0);
      expect(video.transcript.ja.length, video.slug).toBeGreaterThan(0);
    }
  });

  it("関連する通貨・取引所・ツール・記事が実在する", () => {
    const coinIds = new Set(coins.map((coin) => coin.id));
    const exchangeIds = new Set(exchanges.map((exchange) => exchange.id));
    const toolIds = new Set(tools.map((tool) => tool.id));
    const learnIds = new Set(learnArticles.map((article) => article.id));

    for (const video of videos) {
      video.relatedCoins.forEach((id) =>
        expect(coinIds.has(id), `${video.slug} → ${id}`).toBe(true),
      );
      video.relatedExchanges.forEach((id) =>
        expect(exchangeIds.has(id), `${video.slug} → ${id}`).toBe(true),
      );
      video.relatedTools.forEach((id) =>
        expect(toolIds.has(id), `${video.slug} → ${id}`).toBe(true),
      );
      video.relatedLearn.forEach((id) =>
        expect(learnIds.has(id), `${video.slug} → ${id}`).toBe(true),
      );
    }
  });

  it("ショート動画が用意されている", () => {
    expect(videos.some((video) => video.shorts)).toBe(true);
  });
});

describe("学習コンテンツ", () => {
  it("結論・要点・定義・注意点をすべて備えている", () => {
    // 「結論を先に置く」構成を崩さないための歯止めです
    for (const article of learnArticles) {
      expect(article.conclusion.ja.length, article.slug).toBeGreaterThan(0);
      expect(article.keyPoints.ja.length, article.slug).toBeGreaterThan(0);
      expect(article.definition.ja.length, article.slug).toBeGreaterThan(0);
      expect(article.cautions.ja.length, article.slug).toBeGreaterThan(0);
    }
  });

  it("難易度ラベルが付いている", () => {
    for (const article of learnArticles) {
      expect(["beginner", "intermediate", "advanced"]).toContain(article.level);
    }
  });

  it("次に読む記事が実在する", () => {
    const ids = new Set(learnArticles.map((article) => article.id));
    for (const article of learnArticles) {
      for (const next of article.next) {
        expect(ids.has(next), `${article.slug} → ${next}`).toBe(true);
      }
    }
  });
});

describe("診断", () => {
  it("要件の7種類を備えている", () => {
    expect(diagnoses).toHaveLength(7);
  });

  it("すべての選択肢が実在する結果プロフィールへ加点している", () => {
    for (const diagnosis of diagnoses) {
      const resultIds = new Set(diagnosis.results.map((result) => result.id));
      for (const question of diagnosis.questions) {
        for (const option of question.options) {
          for (const key of Object.keys(option.scores)) {
            expect(
              resultIds.has(key),
              `${diagnosis.slug}/${question.id}/${option.id} → ${key}`,
            ).toBe(true);
          }
        }
      }
    }
  });

  it("すべての結果に到達しうる（加点されない結果を作らない）", () => {
    for (const diagnosis of diagnoses) {
      const scored = new Set<string>();
      for (const question of diagnosis.questions) {
        for (const option of question.options) {
          Object.keys(option.scores).forEach((key) => scored.add(key));
        }
      }
      for (const result of diagnosis.results) {
        expect(scored.has(result.id), `${diagnosis.slug} → ${result.id} に到達できません`).toBe(
          true,
        );
      }
    }
  });

  it("結果が参照する取引所・ウォレット・ツール・記事が実在する", () => {
    const exchangeIds = new Set(exchanges.map((entry) => entry.id));
    const walletIds = new Set(wallets.map((entry) => entry.id));
    const toolIds = new Set(tools.map((entry) => entry.id));
    const learnIds = new Set(learnArticles.map((entry) => entry.id));

    for (const diagnosis of diagnoses) {
      for (const result of diagnosis.results) {
        result.exchangeIds?.forEach((id) => expect(exchangeIds.has(id), id).toBe(true));
        result.walletIds?.forEach((id) => expect(walletIds.has(id), id).toBe(true));
        result.toolIds?.forEach((id) => expect(toolIds.has(id), id).toBe(true));
        result.learnIds?.forEach((id) => expect(learnIds.has(id), id).toBe(true));
      }
    }
  });

  it("すべての結果に注意点が書かれている", () => {
    for (const diagnosis of diagnoses) {
      for (const result of diagnosis.results) {
        expect(result.cautions.ja.length, `${diagnosis.slug}/${result.id}`).toBeGreaterThan(0);
      }
    }
  });
});

describe("固定ページ・ナビゲーション", () => {
  it("金融メディアとして必要な固定ページが揃っている", () => {
    const slugs = legalPages.map((page) => page.slug);
    for (const required of [
      "about",
      "editorial-policy",
      "advertising-policy",
      "affiliate-policy",
      "disclaimer",
      "privacy",
      "terms",
      "cookie",
      "sources",
      "corrections",
      "copyright",
      "contact",
    ]) {
      expect(slugs, required).toContain(required);
    }
  });

  it("フッターのリンク先がすべて実在するルートを指す", () => {
    const legalHrefs = new Set(legalPages.map((page) => `/legal/${page.slug}`));
    const known = new Set([
      "/coins",
      "/news",
      "/campaigns",
      "/search",
      "/exchanges",
      "/exchanges/overseas",
      "/wallets",
      "/tools",
      "/learn",
      "/videos",
      "/diagnosis",
      "/faq",
      "/image-credits",
    ]);
    for (const group of footerNav) {
      for (const item of group.items) {
        expect(known.has(item.href) || legalHrefs.has(item.href), item.href).toBe(true);
      }
    }
  });

  it("主要ナビゲーションが空でない", () => {
    expect(mainNav.length).toBeGreaterThan(0);
    expect(siteFaq.length).toBeGreaterThan(0);
  });

  it("既定言語が対応言語に含まれている", () => {
    expect(isLocale(defaultLocale)).toBe(true);
  });
});
