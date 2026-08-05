import { describe, expect, it } from "vitest";

import { buildMockSeries, buildMockSnapshot, MOCK_REFRESH_SEC } from "@/portal/lib/mock-market";
import {
  formatCompact,
  formatDuration,
  formatPercent,
  priceDirection,
  t,
  tList,
} from "@/portal/lib/format";
import { normalize, search } from "@/portal/lib/search-index";
import { answer, asksForAdvice, mentionsSecrets, retrieve } from "@/portal/lib/chat";
import { decodeAnswers, encodeAnswers, isComplete, scoreDiagnosis } from "@/portal/lib/diagnosis";
import { resolveLink, SPONSORED_REL } from "@/portal/lib/affiliate";
import { alternateLanguages, portalMetadata } from "@/portal/lib/seo";
import { portalSitemap } from "@/portal/lib/sitemap";
import { faqJsonLd, videoJsonLd } from "@/portal/lib/structured-data";
import { getDiagnosis } from "@/portal/data/diagnoses";
import { locales } from "@/portal/i18n/config";
import { videos } from "@/portal/data/videos";
import { outboundLinks } from "@/portal/lib/admin";

describe("モック市場データ", () => {
  it("同じ時刻なら同じ値を返す（サーバーとクライアントで食い違わない）", () => {
    const now = Date.parse("2026-08-01T12:00:00Z");
    const a = buildMockSnapshot(now);
    const b = buildMockSnapshot(now);
    expect(a.coins.map((coin) => coin.price)).toEqual(b.coins.map((coin) => coin.price));
    expect(a.fetchedAt).toBe(b.fetchedAt);
  });

  it("時間が進むと値が変わる", () => {
    const first = buildMockSnapshot(Date.parse("2026-08-01T12:00:00Z"));
    const later = buildMockSnapshot(Date.parse("2026-08-01T13:00:00Z"));
    expect(first.coins[0].price).not.toBe(later.coins[0].price);
  });

  it("モックであることを隠さない", () => {
    const snapshot = buildMockSnapshot();
    expect(snapshot.source).toBe("mock");
    expect(snapshot.refreshIntervalSec).toBe(MOCK_REFRESH_SEC);
  });

  it("時価総額の降順に順位が付いている", () => {
    const snapshot = buildMockSnapshot();
    for (let i = 1; i < snapshot.coins.length; i += 1) {
      expect(snapshot.coins[i - 1].marketCap).toBeGreaterThanOrEqual(snapshot.coins[i].marketCap);
      expect(snapshot.coins[i].rank).toBe(i + 1);
    }
  });

  it("ドミナンスが0〜100に収まる", () => {
    const { global } = buildMockSnapshot();
    expect(global.btcDominance).toBeGreaterThan(0);
    expect(global.btcDominance).toBeLessThan(100);
    expect(global.ethDominance).toBeGreaterThan(0);
    expect(global.ethDominance).toBeLessThan(100);
  });

  it("Fear & Greed が0〜100で、区分が値と整合する", () => {
    const { fearGreed } = buildMockSnapshot();
    expect(fearGreed.value).toBeGreaterThanOrEqual(0);
    expect(fearGreed.value).toBeLessThanOrEqual(100);
    if (fearGreed.value < 25) expect(fearGreed.classification).toBe("extreme-fear");
    if (fearGreed.value >= 75) expect(fearGreed.classification).toBe("extreme-greed");
  });

  it("チャートの終点が現在価格と一致する（表とグラフが食い違わない）", () => {
    const now = Date.parse("2026-08-01T12:00:00Z");
    const snapshot = buildMockSnapshot(now);
    const btc = snapshot.coins.find((coin) => coin.id === "bitcoin");
    const series = buildMockSeries("bitcoin", "d7", now);
    expect(series.at(-1)?.p).toBeCloseTo(btc!.price, 6);
  });

  it("価格が負にならない", () => {
    for (const period of ["d1", "d7", "m1", "m3", "y1", "all"] as const) {
      for (const point of buildMockSeries("solana", period)) {
        expect(point.p).toBeGreaterThan(0);
      }
    }
  });

  it("存在しない通貨には空の系列を返す", () => {
    expect(buildMockSeries("does-not-exist", "d7")).toEqual([]);
  });
});

describe("表示整形", () => {
  it("変動率に符号が付く", () => {
    expect(formatPercent(3.2, "en")).toMatch(/^\+/);
    expect(formatPercent(-3.2, "en")).toMatch(/^-/);
  });

  it("方向の判定が微小な変化を「変化なし」にする", () => {
    expect(priceDirection(1)).toBe("up");
    expect(priceDirection(-1)).toBe("down");
    expect(priceDirection(0.001)).toBe("flat");
  });

  it("大きな数を短縮表記にする", () => {
    expect(formatCompact(1_355_000_000_000, "en")).toMatch(/T/);
  });

  it("動画の長さを m:ss / h:mm:ss にする", () => {
    expect(formatDuration(32)).toBe("0:32");
    expect(formatDuration(842)).toBe("14:02");
    expect(formatDuration(3_723)).toBe("1:02:03");
  });

  it("言語別テキストが その言語 → 英語 → 日本語 の順にフォールバックする", () => {
    const text = { ja: "日本語", en: "English" };
    expect(t(text, "ja")).toBe("日本語");
    expect(t(text, "en")).toBe("English");
    expect(t(text, "th")).toBe("English");
    expect(t(undefined, "ja")).toBe("");
    expect(tList(undefined, "ja")).toEqual([]);
  });
});

describe("検索", () => {
  it("全角・カタカナ・大文字を正規化する", () => {
    expect(normalize("ビットコイン")).toBe(normalize("びっとこいん"));
    expect(normalize("ＢＴＣ")).toBe("btc");
    expect(normalize("Trust Wallet")).toBe("trustwallet");
  });

  it("英語名・カタカナ・ティッカーのいずれでも同じ通貨に着地する", () => {
    for (const query of ["Bitcoin", "ビットコイン", "BTC", "btc"]) {
      const top = search(query, "ja", 5)[0];
      expect(top?.doc.path, query).toBe("/coins/bitcoin");
    }
  });

  it("空の検索語では何も返さない", () => {
    expect(search("", "ja")).toEqual([]);
    expect(search("   ", "ja")).toEqual([]);
  });

  it("取引所・ツール・学習記事も検索対象になる", () => {
    expect(search("bitbank", "ja")[0]?.doc.type).toBe("exchange");
    expect(search("uniswap", "ja")[0]?.doc.type).toBe("tool");
    expect(search("ガス代", "ja").some((hit) => hit.doc.type === "learn")).toBe(true);
  });

  it("該当がなければ空を返す（無関係な結果を混ぜない）", () => {
    expect(search("zzzzqqqxyz", "ja")).toEqual([]);
  });
});

describe("AIチャットボット", () => {
  it("シードフレーズに触れる質問には警告を返す", () => {
    expect(mentionsSecrets("シードフレーズを教えて")).toBe(true);
    expect(mentionsSecrets("what is my private key")).toBe(true);
    const result = answer("シードフレーズはどこに入力しますか", "ja");
    expect(result.basis).toBe("guardrail");
    expect(result.paragraphs[0]).toContain("入力しないでください");
  });

  it("投資助言を求める質問に断定で答えない", () => {
    expect(asksForAdvice("ビットコインは上がりますか")).toBe(true);
    const result = answer("ビットコインは買うべきですか", "ja");
    expect(result.basis).toBe("guardrail");
    // 「買うべき」「儲かる」といった断定を返さないこと
    const text = result.paragraphs.join(" ");
    expect(text).not.toMatch(/必ず|保証|儲かります/);
  });

  it("サイト内に根拠がある質問には該当箇所を返す", () => {
    const result = answer("ガス代とは何ですか", "ja");
    expect(result.basis).toBe("site-content");
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.sources.every((source) => source.path.startsWith("/"))).toBe(true);
  });

  it("根拠が無ければ、作らずに「見つからなかった」を返す", () => {
    const result = answer("qqqzzzxyz について教えて", "ja");
    expect(result.basis).toBe("none");
    expect(result.paragraphs).toEqual([]);
  });

  it("検索結果は必ず参照先パスを持つ", () => {
    for (const passage of retrieve("ウォレット", "ja", 3)) {
      expect(passage.path.startsWith("/")).toBe(true);
      expect(passage.title.length).toBeGreaterThan(0);
    }
  });
});

describe("診断の採点", () => {
  const diagnosis = getDiagnosis("exchange")!;

  it("回答が揃うまで未完了と判定する", () => {
    expect(isComplete(diagnosis, {})).toBe(false);
    const all = Object.fromEntries(
      diagnosis.questions.map((question) => [question.id, question.options[0].id]),
    );
    expect(isComplete(diagnosis, all)).toBe(true);
  });

  it("加点の合計が最大の結果を返す", () => {
    // 初心者寄りの選択肢だけを選ぶ
    const answers = {
      experience: "none",
      assets: "major",
      budget: "small",
      savings: "yes",
      leverage: "no",
      cost: "low",
      device: "mobile",
      extras: "no",
    };
    const scored = scoreDiagnosis(diagnosis, answers);
    expect(scored[0].result.id).toBe("beginner");
    expect(scored[0].score).toBeGreaterThan(scored[1].score);
  });

  it("上級者寄りの回答では別の結果になる", () => {
    const answers = {
      experience: "lots",
      assets: "alt",
      budget: "large",
      savings: "no",
      leverage: "yes",
      cost: "high",
      device: "pc",
      extras: "no",
    };
    expect(scoreDiagnosis(diagnosis, answers)[0].result.id).toBe("trader");
  });

  it("割合の合計が100前後になる", () => {
    const answers = Object.fromEntries(
      diagnosis.questions.map((question) => [question.id, question.options[0].id]),
    );
    const total = scoreDiagnosis(diagnosis, answers).reduce((sum, entry) => sum + entry.share, 0);
    expect(total).toBeGreaterThan(95);
    expect(total).toBeLessThan(105);
  });

  it("共有用の符号から回答を復元できる", () => {
    const answers = {
      experience: "some",
      assets: "alt",
      budget: "medium",
      savings: "no",
      leverage: "maybe",
      cost: "medium",
      device: "pc",
      extras: "yes",
    };
    const code = encodeAnswers(diagnosis, answers);
    expect(decodeAnswers(diagnosis, code)).toEqual(answers);
  });

  it("壊れた符号でも例外を投げない", () => {
    expect(() => decodeAnswers(diagnosis, "99999999")).not.toThrow();
    expect(decodeAnswers(diagnosis, "--------")).toEqual({});
  });
});

describe("アフィリエイトリンク", () => {
  it("環境変数が未設定なら通常リンクになり、PR表記も出さない", () => {
    const link = resolveLink("aff-bitbank", "https://bitbank.cc/");
    expect(link.sponsored).toBe(false);
    expect(link.href).toBe("https://bitbank.cc/");
  });

  it("アフィリエイトIDが無ければ公式URLをそのまま使う", () => {
    const link = resolveLink(undefined, "https://www.binance.com/");
    expect(link.sponsored).toBe(false);
    expect(link.href).toBe("https://www.binance.com/");
  });

  it("未知のIDでも壊れず公式URLへ落ちる", () => {
    expect(resolveLink("aff-unknown", "https://example.com/").href).toBe("https://example.com/");
  });

  it("広告リンクの rel に sponsored と nofollow が入る", () => {
    expect(SPONSORED_REL).toContain("sponsored");
    expect(SPONSORED_REL).toContain("nofollow");
    expect(SPONSORED_REL).toContain("noopener");
  });
});

describe("SEO", () => {
  it("タイトルは absolute で組み立てる（同居サイトのテンプレートを拾わない）", () => {
    /*
     * `title.template` は同じルートセグメントの page には効きません。
     * トップページ（[locale]/layout.tsx と [locale]/page.tsx が同階層）だけが
     * ルートレイアウト側のテンプレートを拾ってしまうため、自前で組み立てています。
     */
    const home = portalMetadata({
      locale: "ja",
      title: "未来の資産を、ひとつの画面に。",
      description: "x",
    });
    expect(home.title).toEqual({ absolute: "未来の資産を、ひとつの画面に。 | CRYPTO PORT" });

    const child = portalMetadata({
      locale: "ja",
      path: "/coins",
      title: "仮想通貨",
      description: "x",
    });
    expect(child.title).toEqual({ absolute: "仮想通貨 | CRYPTO PORT" });

    // OGP / X Card も同じ文字列に揃えます
    expect(child.openGraph?.title).toBe("仮想通貨 | CRYPTO PORT");
    expect(child.twitter?.title).toBe("仮想通貨 | CRYPTO PORT");
  });

  it("noindex を指定したページだけ索引から外れる", () => {
    expect(
      portalMetadata({
        locale: "ja",
        path: "/search",
        title: "検索",
        description: "x",
        noindex: true,
      }).robots,
    ).toMatchObject({ index: false });
    expect(
      portalMetadata({ locale: "ja", path: "/coins", title: "仮想通貨", description: "x" }).robots,
    ).toMatchObject({ index: true });
  });

  it("hreflang に全言語と x-default が入る", () => {
    const languages = alternateLanguages("/coins");
    expect(Object.keys(languages)).toHaveLength(locales.length + 1);
    expect(languages["x-default"]).toBeDefined();
    expect(languages["ja"]).toContain("/ja/coins");
    expect(languages["zh-Hans"]).toContain("/zh-cn/coins");
  });

  it("サイトマップが全言語ぶんのURLを持ち、重複しない", () => {
    const entries = portalSitemap();
    const urls = entries.map((entry) => entry.url);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.some((url) => url.includes("/ja/coins/bitcoin"))).toBe(true);
    expect(urls.some((url) => url.includes("/ar/"))).toBe(true);
  });

  it("サイトマップの各URLに言語別 alternates が付く", () => {
    const entry = portalSitemap()[0];
    expect(Object.keys(entry.alternates?.languages ?? {}).length).toBe(locales.length + 1);
  });

  it("lastModified にビルド時刻を入れない（毎回更新扱いにしない）", () => {
    const now = Date.now();
    for (const entry of portalSitemap().slice(0, 20)) {
      const modified = entry.lastModified as Date;
      expect(now - modified.getTime()).toBeGreaterThan(1000);
    }
  });
});

describe("構造化データ", () => {
  it("FAQ が空なら出力しない", () => {
    expect(faqJsonLd("ja", [])).toBeNull();
  });

  it("動画IDが未設定なら VideoObject を出力しない", () => {
    // 再生できない動画を「存在する」と宣言しないための歯止めです
    const video = videos.find((entry) => entry.youtubeId === "");
    expect(video).toBeDefined();
    expect(videoJsonLd("ja", video!)).toBeNull();
  });

  it("Review / AggregateRating を出力しない", async () => {
    // 実レビューが無いため、これらを出すとポリシー違反になります
    const structuredData = await import("@/portal/lib/structured-data");
    const exported = Object.keys(structuredData).join(" ").toLowerCase();
    expect(exported).not.toContain("aggregaterating");
    expect(exported).not.toContain("reviewjsonld");
  });
});

describe("外部リンクの生存確認", () => {
  // scripts/check-links.mjs は `@/` エイリアスを解決できないため、
  // 同じ一覧をデータファイルから直接組み立てています。
  // 種別が増えたらスクリプト側にも足す必要があるため、ここで気づけるようにします。
  it("対象の種別がスクリプトの実装と揃っている", () => {
    const kinds = new Set(outboundLinks().map((entry) => entry.kind));
    expect([...kinds].sort()).toEqual(["coin", "exchange", "tool", "wallet"]);
  });

  it("すべて絶対URLで、重複を除いても1件以上ある", () => {
    const links = outboundLinks();
    expect(links.length).toBeGreaterThan(0);
    for (const entry of links) {
      expect(entry.url, entry.label).toMatch(/^https?:\/\//);
    }
  });
});
