/**
 * 取得パイプライン（scripts/）の検証。
 *
 * スクリプトは .mjs で、TypeScript の実装（src/media/lib/）とは別に
 * ライセンス判定を持っています。判定が食い違うと、
 * 「スクリプトは通したのに画面では出ない」「その逆」が起きます。
 * ここで両者を突き合わせます。
 */
import { describe, expect, it } from "vitest";

import { deriveKeywords, isNonVisualOnly, altTextFor } from "../scripts/lib/media-keywords.mjs";
import { scoreCandidate, CANDIDATE_THRESHOLD } from "../scripts/lib/candidate-score.mjs";
import {
  detectBlockingSubjects,
  evaluateAutoApproval,
  getApprovalConfig,
} from "../scripts/lib/media-approval.mjs";

/** 取得直後の素のメタデータ（判定前） */
function makeRaw(overrides: Record<string, unknown> = {}) {
  return {
    id: "wm-contactless-payment-terminal",
    fileName: "Contactless payment terminal.jpg",
    title: "File:Contactless payment terminal.jpg",
    description: "A contactless payment terminal in a shop",
    categories: ["Payment terminals"],
    originalUrl: "https://upload.wikimedia.org/example.jpg",
    commonsPageUrl: "https://commons.wikimedia.org/wiki/File:Example.jpg",
    width: 2400,
    height: 1350,
    aspectRatio: 2400 / 1350,
    authorName: "Example Author",
    authorUrl: null,
    rawLicenses: ["CC0"],
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    wikidataEntityId: null,
    ...overrides,
  };
}

const request = {
  pageKey: "cardport:guide:points-basics",
  slot: "inline",
  query: "contactless payment terminal",
  alternateQueries: ["NFC payment"],
  minimumWidth: 640,
  aspectRatio: 1200 / 800,
};

describe("検索キーワードの生成", () => {
  it("記事の材料から視覚的な英語キーワードを出す", () => {
    const keywords = deriveKeywords({
      title: "タッチ決済の還元率が上がる仕組み",
      lead: "コンビニでのタッチ決済を対象にした施策です",
      tags: ["タッチ決済", "還元率"],
      category: "payment",
    });
    expect(keywords).toContain("contactless payment terminal");
    expect(keywords.length).toBeLessThanOrEqual(3);
  });

  it("同じ記事からは必ず同じキーワードが出る", () => {
    const source = { title: "マイルの貯め方", tags: ["マイル"], category: "mile" };
    expect(deriveKeywords(source)).toEqual(deriveKeywords(source));
  });

  it("写真にできない話題だけの記事では検索しない", () => {
    const source = { title: "年会費と手数料の考え方", lead: "リボ払いの手数料を整理します" };
    expect(deriveKeywords(source)).toEqual([]);
    expect(isNonVisualOnly(source)).toBe(true);
  });

  it("実在ブランド名を検索語にしない", () => {
    const keywords = deriveKeywords({
      title: "Visa と Mastercard のタッチ決済",
      tags: ["タッチ決済"],
    });
    const joined = keywords.join(" ").toLowerCase();
    expect(joined).not.toContain("visa");
    expect(joined).not.toContain("mastercard");
  });

  it("代替テキストは検索語ごとに用意され、未知の語は言い換えない", () => {
    expect(altTextFor("airport lounge", "ja")).toBe("空港のラウンジ");
    expect(altTextFor("airport lounge", "en")).toBe("An airport lounge");
    expect(altTextFor("unlisted term", "ja")).toBe("unlisted term");
  });
});

describe("候補の採点", () => {
  it("関連する候補はしきい値を超える", () => {
    expect(scoreCandidate(makeRaw(), request).total).toBeGreaterThanOrEqual(CANDIDATE_THRESHOLD);
  });

  it("関連の薄い候補はしきい値に届かない", () => {
    const unrelated = makeRaw({
      fileName: "Mountain landscape.jpg",
      title: "File:Mountain landscape.jpg",
      description: "A mountain range at dawn",
      categories: ["Mountains"],
    });
    expect(scoreCandidate(unrelated, request).total).toBeLessThan(CANDIDATE_THRESHOLD);
  });

  it("解像度が足りない候補は落とす", () => {
    const small = makeRaw({ width: 320, height: 180, aspectRatio: 320 / 180 });
    expect(scoreCandidate(small, request).total).toBeLessThan(CANDIDATE_THRESHOLD);
  });

  it("人物・ロゴ・ブランドは減点される", () => {
    const base = scoreCandidate(makeRaw(), request).total;
    for (const description of [
      "Portrait of a person using a contactless payment terminal",
      "Visa logo on a contactless payment terminal",
    ]) {
      expect(scoreCandidate(makeRaw({ description }), request).total).toBeLessThan(base);
    }
  });

  it("同じ入力からは必ず同じ点数になる", () => {
    expect(scoreCandidate(makeRaw(), request)).toEqual(scoreCandidate(makeRaw(), request));
  });
});

describe("自動承認", () => {
  const config = {
    enabled: true,
    licenses: ["PD", "CC0"],
    minScore: 80,
    minWidth: 1200,
    minHeight: 675,
  };

  it("既定では自動承認しない", () => {
    // 環境変数が未設定のリポジトリで、勝手に公開されないこと
    expect(getApprovalConfig().enabled).toBe(false);
    const decision = evaluateAutoApproval({
      raw: makeRaw(),
      licenseCode: "CC0",
      score: 95,
      config: { ...config, enabled: false },
    });
    expect(decision.approved).toBe(false);
  });

  it("PD / CC0 で条件を満たせば承認する", () => {
    const decision = evaluateAutoApproval({
      raw: makeRaw(),
      licenseCode: "CC0",
      score: 95,
      config,
    });
    expect(decision.approved).toBe(true);
    expect(decision.notes.join(" ")).toContain("自動承認");
  });

  it("作者表示が必要なライセンスは自動承認しない", () => {
    for (const code of ["CC-BY-4.0", "CC-BY-SA-4.0", "GFDL"]) {
      expect(
        evaluateAutoApproval({ raw: makeRaw(), licenseCode: code, score: 95, config }).approved,
      ).toBe(false);
    }
  });

  it("点数・解像度が足りなければ自動承認しない", () => {
    expect(
      evaluateAutoApproval({ raw: makeRaw(), licenseCode: "CC0", score: 70, config }).approved,
    ).toBe(false);
    expect(
      evaluateAutoApproval({
        raw: makeRaw({ width: 900, height: 500 }),
        licenseCode: "CC0",
        score: 95,
        config,
      }).approved,
    ).toBe(false);
  });

  it("作者・Commonsページ・ライセンスURLが欠けたら自動承認しない", () => {
    for (const missing of [{ authorName: null }, { commonsPageUrl: "" }, { licenseUrl: null }]) {
      expect(
        evaluateAutoApproval({
          raw: makeRaw(missing),
          licenseCode: "CC0",
          score: 95,
          config,
        }).approved,
      ).toBe(false);
    }
  });

  it("ライセンスが自由でも、被写体の権利が絡めば自動承認しない", () => {
    for (const description of [
      "Portrait of a shop owner",
      "Company logo on the wall",
      "Visa branded terminal",
      "A statue in the plaza",
    ]) {
      const raw = makeRaw({ description });
      expect(detectBlockingSubjects(raw).length).toBeGreaterThan(0);
      expect(evaluateAutoApproval({ raw, licenseCode: "CC0", score: 95, config }).approved).toBe(
        false,
      );
    }
  });

  it("承認・非承認のどちらでも、理由が必ず残る", () => {
    for (const code of ["CC0", "CC-BY-4.0"]) {
      const decision = evaluateAutoApproval({
        raw: makeRaw(),
        licenseCode: code,
        score: 95,
        config,
      });
      expect(decision.notes.length).toBeGreaterThan(0);
    }
  });
});

describe("記事の代表画像", () => {
  /**
   * URL のパスはアンダースコア区切り、API が返すタイトルはスペース区切りです。
   * ここを揃えないと「この候補は代表画像か」を照合できず、
   * 関連度の足切り免除が効かなくなります（実際にそうなっていました）。
   */
  it("URL からファイル名を組み立てるとき、アンダースコアをスペースに戻す", async () => {
    const captured: string[] = [];
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      captured.push(String(input));
      return new Response(
        JSON.stringify({
          originalimage: {
            source: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Sceptre_Rugby_Ball.jpg",
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }) as typeof globalThis.fetch;

    try {
      const { fetchLeadImageTitle, createStats, getClientConfig } =
        await import("../scripts/lib/wikimedia-client.mjs");
      const title = await fetchLeadImageTitle("en", "Rugby ball", getClientConfig(), createStats());
      expect(title).toBe("File:Sceptre Rugby Ball.jpg");
    } finally {
      globalThis.fetch = originalFetch;
    }

    expect(captured[0]).toContain("en.wikipedia.org/api/rest_v1/page/summary/Rugby_ball");
  });

  it("各言語版へのローカルアップロードは採用しない", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          // Commons ではなく ja へのローカルアップロード（非自由を含みます）
          originalimage: { source: "https://upload.wikimedia.org/wikipedia/ja/a/ab/Local.jpg" },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      )) as typeof globalThis.fetch;

    try {
      const { fetchLeadImageTitle, createStats, getClientConfig } =
        await import("../scripts/lib/wikimedia-client.mjs");
      expect(await fetchLeadImageTitle("ja", "何か", getClientConfig(), createStats())).toBeNull();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("SVG は写真枠に使わない", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          originalimage: {
            source: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Diagram.svg",
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      )) as typeof globalThis.fetch;

    try {
      const { fetchLeadImageTitle, createStats, getClientConfig } =
        await import("../scripts/lib/wikimedia-client.mjs");
      expect(
        await fetchLeadImageTitle("en", "Something", getClientConfig(), createStats()),
      ).toBeNull();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
