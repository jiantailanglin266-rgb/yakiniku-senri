/**
 * 画像の権利まわりのテスト。
 *
 * ここで守っているのは「表示できてしまわないこと」です。
 * ライセンス不明・作者不明・出典不明の画像が1枚でも描画できるようになったら、
 * このファイルのどれかが必ず落ちます。
 */
import { describe, expect, it } from "vitest";

import {
  normalizeLicense,
  evaluateAsset,
  initialStatus,
  allowedLicenses,
} from "@/wikimedia/licenses";
import { detectRightsRisks } from "@/wikimedia/risks";
import { attributionLine, creditParts, altFor } from "@/wikimedia/credit";
import { seedHash, fallbackVisual, fallbackGeometry, derivedPalette } from "@/wikimedia/fallback";
import { scoreCandidate, selectBest, publishable, RELEVANCE_THRESHOLD } from "@/wikimedia/select";
import { wikimediaAssets, wikimediaUsages, assetForPage } from "@/wikimedia/data/assets";
import { thirdPartyAssets } from "@/wikimedia/data/third-party";
import type { WikimediaAsset } from "@/wikimedia/types";

/** 検証用の完全なアセット。テストごとに一部を壊して挙動を見ます */
function asset(overrides: Partial<WikimediaAsset> = {}): WikimediaAsset {
  return {
    id: "test-asset",
    fileName: "File:Test.jpg",
    title: "Test",
    originalUrl: "https://upload.wikimedia.org/test.jpg",
    commonsPageUrl: "https://commons.wikimedia.org/wiki/File:Test.jpg",
    mimeType: "image/jpeg",
    width: 2400,
    height: 1350,
    aspectRatio: 2400 / 1350,
    authorName: "Jane Doe",
    licenseCode: "CC0",
    licenseName: "CC0 1.0 Universal",
    commercialUseAllowed: true,
    derivativeWorksAllowed: true,
    shareAlikeRequired: false,
    isPublicDomain: true,
    isModified: false,
    retrievedAt: "2026-01-01T00:00:00.000Z",
    verificationStatus: "approved",
    usageStatus: "in_use",
    rightsRisks: [],
    altText: { ja: "テスト画像", en: "Test image" },
    ...overrides,
  };
}

describe("ライセンスの正規化", () => {
  it("表記の揺れを同じコードへ寄せる", () => {
    for (const raw of [
      "CC BY-SA 4.0",
      "cc-by-sa-4.0",
      "CC_BY_SA_4.0",
      "Creative Commons Attribution-ShareAlike 4.0 International",
    ]) {
      expect(normalizeLicense(raw).code, raw).toBe("CC-BY-SA-4.0");
    }
  });

  it("非商用・改変不可を CC BY と取り違えない", () => {
    // "by" を含むため、順序を間違えると CC BY として通ってしまいます
    expect(normalizeLicense("CC BY-NC 4.0").code).toBe("CC-BY-NC");
    expect(normalizeLicense("CC BY-NC-SA 3.0").code).toBe("CC-BY-NC-SA");
    expect(normalizeLicense("CC BY-ND 4.0").code).toBe("CC-BY-ND");
  });

  it("判定できない文字列は UNKNOWN にする（推測しない）", () => {
    for (const raw of ["", null, undefined, "自由に使えます", "no license tag", "???"]) {
      expect(normalizeLicense(raw).code).toBe("UNKNOWN");
    }
  });

  it("自動承認できるのは PD と CC0 だけ", () => {
    expect(normalizeLicense("Public domain").autoApprovable).toBe(true);
    expect(normalizeLicense("CC0").autoApprovable).toBe(true);
    expect(normalizeLicense("CC BY 4.0").autoApprovable).toBe(false);
    expect(normalizeLicense("CC BY-SA 4.0").autoApprovable).toBe(false);
    expect(normalizeLicense("GFDL").autoApprovable).toBe(false);
  });

  it("許可リストに非商用・改変不可・不明を含めない", () => {
    const allowed = allowedLicenses();
    for (const code of ["CC-BY-NC", "CC-BY-NC-SA", "CC-BY-ND", "UNKNOWN", "FAIR_USE"]) {
      expect(allowed).not.toContain(code);
    }
  });
});

describe("公開可否の判定", () => {
  it("ライセンス・作者・出典が揃っていれば公開できる", () => {
    expect(evaluateAsset(asset()).allowed).toBe(true);
  });

  it("ライセンス不明は公開できない", () => {
    const decision = evaluateAsset(asset({ licenseCode: "UNKNOWN" }));
    expect(decision.allowed).toBe(false);
    expect(decision.blockers.join()).toContain("ライセンス");
  });

  it("商用不可・改変不可は公開できない", () => {
    expect(evaluateAsset(asset({ licenseCode: "CC-BY-NC" })).allowed).toBe(false);
    expect(evaluateAsset(asset({ licenseCode: "CC-BY-ND" })).allowed).toBe(false);
    expect(evaluateAsset(asset({ licenseCode: "FAIR_USE" })).allowed).toBe(false);
  });

  it("クレジット必須なのに作者不明なら公開できない", () => {
    const decision = evaluateAsset(
      asset({ licenseCode: "CC-BY-4.0", licenseName: "CC BY 4.0", authorName: undefined }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.blockers.join()).toContain("作者");
  });

  it("出典（Commons ファイルページ）が無ければ公開できない", () => {
    expect(evaluateAsset(asset({ commonsPageUrl: "" })).allowed).toBe(false);
  });

  it("未承認の画像は、ライセンスが問題なくても公開されない", () => {
    for (const status of ["pending", "needs_review", "license_unknown", "rights_risk"] as const) {
      expect(evaluateAsset(asset({ verificationStatus: status })).allowed, status).toBe(false);
    }
  });

  it("追加権利があるものは自動承認しない（人間が承認すれば公開できる）", () => {
    const risky = asset({ rightsRisks: ["living_person"] });
    expect(evaluateAsset(risky).autoApprovable).toBe(false);
    expect(evaluateAsset(risky).risks).not.toHaveLength(0);
    // 人間が確認して approved にしたものは公開できます
    expect(evaluateAsset(risky).allowed).toBe(true);
  });

  it("CC BY は自動承認しない", () => {
    expect(
      evaluateAsset(asset({ licenseCode: "CC-BY-4.0", licenseName: "CC BY 4.0" })).autoApprovable,
    ).toBe(false);
  });
});

describe("取得直後の状態", () => {
  it("PD / CC0 かつ作者・出典が揃っていれば approved", () => {
    expect(initialStatus(asset({ verificationStatus: "pending" }))).toBe("approved");
  });

  it("作者が取得できていなければ needs_review で保留する", () => {
    expect(initialStatus(asset({ authorName: undefined }))).toBe("needs_review");
  });

  it("ライセンス不明は license_unknown（推測で公開しない）", () => {
    expect(initialStatus(asset({ licenseCode: "UNKNOWN" }))).toBe("license_unknown");
  });

  it("追加権利があれば rights_risk", () => {
    expect(initialStatus(asset({ rightsRisks: ["trademark"] }))).toBe("rights_risk");
  });

  it("CC BY / CC BY-SA は needs_review", () => {
    expect(initialStatus(asset({ licenseCode: "CC-BY-4.0" }))).toBe("needs_review");
    expect(initialStatus(asset({ licenseCode: "CC-BY-SA-4.0" }))).toBe("needs_review");
  });

  it("許可リスト外は rejected", () => {
    expect(initialStatus(asset({ licenseCode: "CC-BY-NC" }))).toBe("rejected");
  });
});

describe("追加権利の推定", () => {
  it("手がかりが無ければ unknown_subject（安全側に倒す）", () => {
    expect(detectRightsRisks({})).toContain("unknown_subject");
  });

  it("人物・商標・建築を検出する", () => {
    expect(detectRightsRisks({ description: "Portrait of a player" })).toContain("living_person");
    expect(detectRightsRisks({ categories: "Category:Team logos" })).toContain("trademark");
    expect(detectRightsRisks({ description: "The stadium exterior" })).toContain("architecture");
  });

  it("Commons が制限を明示していれば内容を問わず拾う", () => {
    expect(detectRightsRisks({ description: "a ball", restrictions: "trademarked" })).toContain(
      "trademark",
    );
  });

  it("targets.json で宣言したリスクを引き継ぐ", () => {
    expect(detectRightsRisks({ description: "a ball", declared: ["event"] })).toContain("event");
  });
});

describe("クレジット", () => {
  it("Commons の推奨クレジット文があればそれを使う", () => {
    expect(attributionLine(asset({ attributionText: "Photo by Jane Doe" }), "ja")).toBe(
      "Photo by Jane Doe",
    );
  });

  it("作者名とライセンス名を原文のまま含める", () => {
    const line = attributionLine(asset({ licenseName: "CC BY-SA 4.0" }), "ja");
    expect(line).toContain("Jane Doe");
    expect(line).toContain("CC BY-SA 4.0");
    expect(line).toContain("Wikimedia Commons");
  });

  it("加工した場合はその旨を出す", () => {
    expect(attributionLine(asset({ isModified: true }), "ja")).toContain("加工あり");
  });

  it("出典URLは必ず埋まる（クレジットのリンク切れを作らない）", () => {
    const parts = creditParts(asset({ sourceUrl: undefined }));
    expect(parts.sourceUrl).toBe("https://commons.wikimedia.org/wiki/File:Test.jpg");
  });

  it("装飾用途の alt は空にする", () => {
    expect(altFor(asset(), "ja", true)).toBe("");
    expect(altFor(asset(), "ja")).toBe("テスト画像");
  });
});

describe("フォールバックの決定性", () => {
  it("同じ種からは必ず同じ結果になる（ハイドレーションのずれを作らない）", () => {
    for (const seed of ["tennis", "news-1", "とても長い日本語のスラッグ"]) {
      expect(seedHash(seed)).toBe(seedHash(seed));
      expect(fallbackVisual(seed, "#fff")).toEqual(fallbackVisual(seed, "#fff"));
      expect(fallbackGeometry(seed)).toEqual(fallbackGeometry(seed));
      expect(derivedPalette("#22d3ee", seed)).toEqual(derivedPalette("#22d3ee", seed));
    }
  });

  it("種が違えば絵柄も変わりうる", () => {
    const seeds = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const patterns = new Set(seeds.map((seed) => fallbackVisual(seed, "#fff").pattern));
    expect(patterns.size).toBeGreaterThan(1);
  });
});

describe("候補の選定", () => {
  const candidate = (overrides: Partial<WikimediaAsset> = {}, relevance = "wikidata_entity") =>
    ({ asset: asset(overrides), relevance }) as Parameters<typeof scoreCandidate>[0];

  it("関連性が低い候補は採用しない（装飾目的で無関係な画像を出さない）", () => {
    const scored = scoreCandidate(candidate({}, "generic"), "hero");
    expect(scored.rejections.join()).toContain("関連性");
    expect(selectBest([candidate({}, "generic")], "hero")).toBeNull();
  });

  it("解像度が足りない候補は採用しない", () => {
    const scored = scoreCandidate(candidate({ width: 400, height: 225 }), "hero");
    expect(scored.rejections.join()).toContain("解像度");
  });

  it("採用できる候補が無ければ null（無理に画像を出さない）", () => {
    expect(selectBest([], "hero")).toBeNull();
  });

  it("公開できない画像は publishable に残らない", () => {
    expect(publishable([asset({ licenseCode: "UNKNOWN" })], "card")).toHaveLength(0);
    expect(publishable([asset()], "card")).toHaveLength(1);
  });

  it("しきい値は category 相当以上", () => {
    expect(RELEVANCE_THRESHOLD).toBeGreaterThanOrEqual(35);
  });
});

describe("レジストリ", () => {
  it("登録済みの画像は、すべてライセンス・作者・出典が揃っている", () => {
    for (const item of wikimediaAssets) {
      if (item.verificationStatus !== "approved") continue;
      expect(item.licenseCode, item.fileName).not.toBe("UNKNOWN");
      expect(item.commonsPageUrl, item.fileName).toBeTruthy();
      expect(item.originalUrl, item.fileName).toBeTruthy();
      expect(item.authorName, item.fileName).toBeTruthy();
      expect(evaluateAsset(item).allowed, item.fileName).toBe(true);
    }
  });

  it("掲載先の指定は、実在する画像だけを指す", () => {
    const ids = new Set(wikimediaAssets.map((item) => item.id));
    for (const usage of wikimediaUsages) {
      expect(ids.has(usage.assetId), usage.assetId).toBe(true);
    }
  });

  it("未登録のページを引いても落ちない（フォールバックへ）", () => {
    expect(assetForPage("/does-not-exist", "hero")).toBeUndefined();
  });
});

describe("第三者素材のクレジット", () => {
  it("国旗（flag-icons / MIT）の著作権表示を保持している", () => {
    const flags = thirdPartyAssets.find((item) => item.id === "flag-icons");
    expect(flags).toBeDefined();
    // MIT は著作権表示の保持を要求します。省略するとライセンス違反になります
    expect(flags?.copyrightNotice).toContain("Copyright");
    expect(flags?.licenseName).toContain("MIT");
    expect(flags?.licenseUrl).toMatch(/^https:\/\//);
    expect(flags?.sourceUrl).toMatch(/^https:\/\//);
  });

  it("すべての第三者素材に、ライセンス・著作権表示・配布元がある", () => {
    for (const item of thirdPartyAssets) {
      expect(item.licenseName, item.id).toBeTruthy();
      expect(item.licenseUrl, item.id).toMatch(/^https:\/\//);
      expect(item.copyrightNotice, item.id).toBeTruthy();
      expect(item.sourceUrl, item.id).toMatch(/^https:\/\//);
    }
  });
});
