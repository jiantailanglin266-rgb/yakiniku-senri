/**
 * 画像ライセンスの正規化と掲載可否の判定。
 *
 * ここで守っているのは次の1点です。
 *   「APIで取得できた」ことと「サイトに掲載してよい」ことは別である。
 *
 * ライセンスを機械的に読み取れない画像は、推測で公開せず必ず保留になること、
 * ライセンス情報の無い画像はコンポーネントが描画しないことを、機械的に確認します。
 */
import { describe, expect, it } from "vitest";

import { licenses, getWhitelist } from "@/media/config/licenses";
import { normalizeLicense, getLicense, pickBestLicense } from "@/media/lib/license";
import { detectRightsRisks, evaluateEligibility, isPublishable } from "@/media/lib/eligibility";
import {
  buildAttributionParts,
  buildAttributionText,
  requiresNearbyAttribution,
  requiresShareAlikeOnDerivative,
} from "@/media/lib/attribution";
import { pickBestCandidate, scoreCandidate, RELEVANCE_THRESHOLD } from "@/media/lib/scoring";
import { resolveImage } from "@/media/lib/resolve";
import { assetUsages, pageKey } from "@/media/data/usages";
import {
  imageObjectJsonLd,
  pageImageSitemapEntries,
  pageImagesJsonLd,
} from "@/media/lib/structured-data";
import { buildSitemapXml } from "@/cardport/lib/feeds";
import { wikimediaAssets, assetLocalizations } from "@/media/data/assets";
import { getMediaLabels } from "@/media/i18n/labels";
import { slotSizes, type LicenseCode, type WikimediaAsset } from "@/media/types";

/** テスト用の下地。個々のテストで必要なフィールドだけ上書きします */
function makeAsset(overrides: Partial<WikimediaAsset> = {}): WikimediaAsset {
  return {
    id: "test-asset",
    commonsPageId: 1,
    wikidataEntityId: null,
    fileName: "Example.jpg",
    title: "File:Example.jpg",
    description: null,
    originalUrl: "https://upload.wikimedia.org/example.jpg",
    thumbnailUrl: null,
    commonsPageUrl: "https://commons.wikimedia.org/wiki/File:Example.jpg",
    localPath: null,
    optimized: null,
    blurDataURL: null,
    mimeType: "image/jpeg",
    width: 2000,
    height: 1200,
    aspectRatio: 2000 / 1200,
    authorName: "Example Author",
    authorUrl: null,
    sourceName: null,
    sourceUrl: null,
    licenseCode: "CC-BY-SA-4.0",
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    licenseVersion: "4.0",
    attributionText: null,
    copyrightStatus: null,
    commercialUseAllowed: true,
    derivativeWorksAllowed: true,
    shareAlikeRequired: true,
    isPublicDomain: false,
    publicDomainRationale: null,
    isModified: false,
    modificationDescription: null,
    retrievedAt: "2026-01-01T00:00:00.000Z",
    verifiedAt: "2026-01-02T00:00:00.000Z",
    verificationStatus: "approved",
    verificationNotes: [],
    rightsRisks: [],
    usageStatus: "in_use",
    objectPosition: "center",
    metadataRaw: null,
    ...overrides,
  };
}

describe("ライセンスの正規化", () => {
  it("代表的な表記を正しく判定する", () => {
    expect(normalizeLicense("CC BY-SA 4.0")).toBe("CC-BY-SA-4.0");
    expect(normalizeLicense("cc_by_3.0")).toBe("CC-BY-3.0");
    expect(normalizeLicense("CC0 1.0")).toBe("CC0");
    expect(normalizeLicense("PD-old-70")).toBe("PD");
    expect(normalizeLicense("GFDL")).toBe("GFDL");
  });

  it("読み取れない表記は推測せず UNKNOWN にする", () => {
    expect(normalizeLicense(null)).toBe("UNKNOWN");
    expect(normalizeLicense("")).toBe("UNKNOWN");
    expect(normalizeLicense("see file page")).toBe("UNKNOWN");
    expect(normalizeLicense("使用条件は要問い合わせ")).toBe("UNKNOWN");
  });

  it("バージョンが読めない CC は最新版と決めつけない", () => {
    // 「CC BY」だけでは 1.0〜4.0 のどれか分からないため、UNKNOWN に倒します
    expect(normalizeLicense("CC BY")).toBe("UNKNOWN");
    expect(normalizeLicense("Creative Commons Attribution-ShareAlike")).toBe("UNKNOWN");
  });

  it("非商用・改変禁止を取りこぼさない", () => {
    expect(normalizeLicense("CC BY-NC 4.0")).toBe("CC-BY-NC");
    expect(normalizeLicense("CC BY-NC-SA 3.0")).toBe("CC-BY-NC-SA");
    expect(normalizeLicense("CC BY-ND 4.0")).toBe("CC-BY-ND");
    expect(normalizeLicense("fair use")).toBe("FAIR-USE");
    expect(normalizeLicense("All rights reserved")).toBe("ALL-RIGHTS-RESERVED");
  });

  it("ライセンス定義の整合が取れている", () => {
    for (const [code, license] of Object.entries(licenses)) {
      expect(license.code).toBe(code as LicenseCode);
      expect(license.name.length).toBeGreaterThan(0);
      // パブリックドメインは作者表示・継承を要求しません
      if (license.isPublicDomain) {
        expect(license.shareAlikeRequired).toBe(false);
      }
      // 自動掲載できるものは、必ず商用利用と改変が可能
      if (license.autoUsable) {
        expect(license.commercialUseAllowed).toBe(true);
        expect(license.derivativeWorksAllowed).toBe(true);
      }
    }
    expect(getLicense("UNKNOWN").autoUsable).toBe(false);
    expect(getLicense("CC-BY-ND").derivativeWorksAllowed).toBe(false);
    expect(getLicense("CC-BY-NC").commercialUseAllowed).toBe(false);
  });

  it("ホワイトリストは商用利用可のライセンスだけ", () => {
    for (const code of getWhitelist()) {
      const license = getLicense(code);
      expect(license.commercialUseAllowed).toBe(true);
      expect(license.derivativeWorksAllowed).toBe(true);
    }
  });

  it("複数表記からは制約の少ないものを選び、読めない表記があれば申告する", () => {
    expect(pickBestLicense(["CC BY-SA 4.0", "CC0"])).toEqual({ code: "CC0", hadUnknown: false });
    expect(pickBestLicense(["CC BY-SA 4.0", "see file page"]).hadUnknown).toBe(true);
    expect(pickBestLicense([])).toEqual({ code: "UNKNOWN", hadUnknown: true });
  });
});

describe("追加権利のリスク検出", () => {
  it("ライセンスとは別の権利が絡む語彙を拾う", () => {
    expect(detectRightsRisks("Portrait of a CEO")).toContain("living-person");
    expect(detectRightsRisks("Company logo on a wall")).toContain("company-logo");
    expect(detectRightsRisks("Credit card close-up")).toContain("card-face");
    expect(detectRightsRisks("Statue in a park")).toContain("sculpture");
  });

  it("パノラマの自由が制限される国を拾う", () => {
    expect(detectRightsRisks("Night view in France")).toContain("freedom-of-panorama");
  });

  it("無関係な説明ではリスクを出さない", () => {
    expect(detectRightsRisks("abstract blue gradient texture")).toEqual([]);
  });
});

describe("掲載可否の判定順序", () => {
  const base = {
    authorName: "Example Author",
    sourceUrl: "https://example.org/",
    commonsPageUrl: "https://commons.wikimedia.org/wiki/File:Example.jpg",
    searchableText: "abstract texture",
    width: 2000,
    height: 1200,
  };

  it("ライセンス不明は license_unknown で保留（自動公開しない）", () => {
    const result = evaluateEligibility({ ...base, licenseCode: "UNKNOWN" });
    expect(result.status).toBe("license_unknown");
    expect(result.autoApprovable).toBe(false);
  });

  it("非商用・改変禁止は却下", () => {
    expect(evaluateEligibility({ ...base, licenseCode: "CC-BY-NC" }).status).toBe("rejected");
    expect(evaluateEligibility({ ...base, licenseCode: "CC-BY-ND" }).status).toBe("rejected");
  });

  it("作者表示が必要なのに作者不明なら needs_review", () => {
    const result = evaluateEligibility({
      ...base,
      licenseCode: "CC-BY-SA-4.0",
      authorName: null,
    });
    expect(result.status).toBe("needs_review");
    expect(result.autoApprovable).toBe(false);
  });

  it("Commons のページURLが無ければ needs_review", () => {
    const result = evaluateEligibility({ ...base, licenseCode: "PD", commonsPageUrl: null });
    expect(result.status).toBe("needs_review");
  });

  it("解像度が枠の要件に足りなければ却下", () => {
    const result = evaluateEligibility({
      ...base,
      licenseCode: "CC0",
      width: 400,
      requiredMinWidth: slotSizes.hero.minWidth,
    });
    expect(result.status).toBe("rejected");
  });

  it("追加権利のリスクがあれば、ライセンスが自由でも人の確認へ回す", () => {
    const result = evaluateEligibility({
      ...base,
      licenseCode: "CC0",
      searchableText: "Portrait of the company president",
    });
    expect(result.status).toBe("rights_risk");
    expect(result.autoApprovable).toBe(false);
  });

  it("ホワイトリスト外のライセンスは、条件を満たしても自動承認しない", () => {
    const result = evaluateEligibility({ ...base, licenseCode: "CC-BY-SA-4.0" });
    expect(result.status).toBe("needs_review");
    expect(result.autoApprovable).toBe(false);
  });

  it("ホワイトリスト対象かつ条件を満たす場合だけ approved", () => {
    const result = evaluateEligibility({ ...base, licenseCode: "CC0" });
    expect(result.status).toBe("approved");
    expect(result.autoApprovable).toBe(true);
  });

  it("判定結果には必ず根拠が残る", () => {
    for (const code of ["UNKNOWN", "CC-BY-NC", "CC0", "CC-BY-SA-4.0"] as LicenseCode[]) {
      expect(evaluateEligibility({ ...base, licenseCode: code }).notes.length).toBeGreaterThan(0);
    }
  });
});

describe("isPublishable（描画の最終関門）", () => {
  it("承認済み・ライセンス既知・作者ありなら表示できる", () => {
    expect(isPublishable(makeAsset())).toBe(true);
  });

  it("承認前の状態はすべて表示しない", () => {
    for (const status of [
      "pending",
      "needs_review",
      "license_unknown",
      "rights_risk",
      "rejected",
    ] as const) {
      expect(isPublishable(makeAsset({ verificationStatus: status }))).toBe(false);
    }
  });

  it("使用停止中は表示しない", () => {
    expect(isPublishable(makeAsset({ usageStatus: "suspended" }))).toBe(false);
  });

  it("ライセンス情報が無い画像は表示しない", () => {
    expect(isPublishable(makeAsset({ licenseCode: "UNKNOWN" }))).toBe(false);
  });

  it("作者表示が必要なのに作者が無い画像は表示しない", () => {
    expect(isPublishable(makeAsset({ authorName: null }))).toBe(false);
    // パブリックドメインは作者表示が不要なので、作者が無くても表示できます
    expect(isPublishable(makeAsset({ licenseCode: "CC0", authorName: null }))).toBe(true);
  });

  it("出典（Commons ページ）が無い画像は表示しない", () => {
    expect(isPublishable(makeAsset({ commonsPageUrl: "" }))).toBe(false);
  });

  it("商用利用不可のライセンスは表示しない", () => {
    expect(isPublishable(makeAsset({ licenseCode: "CC-BY-NC" }))).toBe(false);
  });
});

describe("クレジット表示", () => {
  const labels = getMediaLabels("ja");

  it("作者・出典・ライセンスが必ず含まれる", () => {
    const text = buildAttributionText(makeAsset(), labels);
    expect(text).toContain("Example Author");
    expect(text).toContain("Wikimedia Commons");
    expect(text).toContain("CC BY-SA 4.0");
  });

  it("作者名・出典名・ライセンス名は翻訳しない扱いになっている", () => {
    const parts = buildAttributionParts(makeAsset(), labels);
    const verbatim = parts.filter((part) => part.verbatim).map((part) => part.text);
    expect(verbatim).toContain("Example Author");
    expect(verbatim).toContain("Wikimedia Commons");
    expect(verbatim).toContain("CC BY-SA 4.0");
    // ラベル（「写真」）は翻訳対象
    expect(parts[0]).toMatchObject({ text: labels.photo, verbatim: false });
  });

  it("加工した画像には加工の明示が入る", () => {
    const parts = buildAttributionParts(makeAsset({ isModified: true }), labels);
    expect(parts.some((part) => part.text === labels.modified)).toBe(true);
  });

  it("継承ライセンスを加工した場合は、生成物にも継承が必要と判定する", () => {
    expect(requiresShareAlikeOnDerivative(makeAsset({ isModified: true }))).toBe(true);
    expect(requiresShareAlikeOnDerivative(makeAsset({ isModified: false }))).toBe(false);
    expect(
      requiresShareAlikeOnDerivative(makeAsset({ licenseCode: "CC0", isModified: true })),
    ).toBe(false);
  });

  it("作者表示が必要なライセンスは、画像の近くにクレジットが要る", () => {
    expect(requiresNearbyAttribution(makeAsset())).toBe(true);
    expect(requiresNearbyAttribution(makeAsset({ licenseCode: "CC0" }))).toBe(false);
  });

  it("すべての言語でラベルが揃っている（空欄を作らない）", () => {
    for (const locale of [
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
      "hi",
    ]) {
      const set = getMediaLabels(locale);
      for (const value of Object.values(set)) {
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  it("ラベルにライセンス正式名称や『Wikimedia Commons』の訳語を持ち込まない", () => {
    // これらは原文のまま出す項目であり、翻訳テーブルに入れてはいけません
    for (const locale of ["ja", "ko", "zh-cn", "ar"]) {
      const set = getMediaLabels(locale);
      const joined = Object.values(set).join(" ");
      expect(joined).not.toMatch(/CC BY(-SA)? \d/);
    }
  });
});

describe("候補画像の関連度スコア", () => {
  const relevant = makeAsset({
    id: "relevant",
    title: "Contactless payment terminal",
    fileName: "Contactless payment terminal.jpg",
    description: "A contactless payment terminal in a shop",
    licenseCode: "CC0",
    isPublicDomain: true,
    shareAlikeRequired: false,
    wikidataEntityId: "Q1",
    width: 2400,
    height: 1350,
    aspectRatio: 2400 / 1350,
  });

  const unrelated = makeAsset({
    id: "unrelated",
    title: "Mountain landscape at dawn",
    fileName: "Mountain landscape.jpg",
    description: "A mountain range",
    wikidataEntityId: null,
    width: 900,
    height: 1600,
    aspectRatio: 900 / 1600,
    rightsRisks: ["architecture"],
  });

  const input = {
    pageTitle: "Contactless payment terminal",
    pageKeywords: ["contactless", "payment", "terminal"],
    slot: "card" as const,
    wikidataEntityId: "Q1",
  };

  it("関連する候補はしきい値を超える", () => {
    expect(scoreCandidate(relevant, input).score).toBeGreaterThanOrEqual(RELEVANCE_THRESHOLD);
  });

  it("関連の薄い候補は採用しない（しきい値未満は null＝装飾へ落ちる）", () => {
    expect(scoreCandidate(unrelated, input).score).toBeLessThan(RELEVANCE_THRESHOLD);
    expect(pickBestCandidate([unrelated], input)).toBeNull();
  });

  it("候補が空でも落ちず、null を返す", () => {
    expect(pickBestCandidate([], input)).toBeNull();
  });

  it("採用理由を説明できるよう、内訳が残る", () => {
    const scored = scoreCandidate(relevant, input);
    expect(Object.keys(scored.breakdown)).toEqual(
      expect.arrayContaining(["title", "wikidata", "keywords", "resolution", "aspect", "license"]),
    );
  });

  it("追加権利のリスクは減点される", () => {
    const risky = makeAsset({ ...relevant, id: "risky", rightsRisks: ["living-person"] });
    expect(scoreCandidate(risky, input).breakdown.riskPenalty).toBeLessThan(
      scoreCandidate(relevant, input).breakdown.riskPenalty,
    );
  });

  it("同じ入力からは必ず同じ結果になる", () => {
    expect(scoreCandidate(relevant, input)).toEqual(scoreCandidate(relevant, input));
  });
});

describe("掲載データの状態", () => {
  it("登録済みの画像は、すべてライセンス情報を持っている", () => {
    // 空でも通ります。データが入ったときに、推測値の混入を止めるための番人です
    for (const asset of wikimediaAssets) {
      expect(asset.licenseCode).not.toBe("UNKNOWN");
      expect(asset.commonsPageUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
      expect(asset.fileName.length).toBeGreaterThan(0);
      expect(asset.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}/);
      if (getLicense(asset.licenseCode).attributionRequired) {
        expect(asset.authorName).toBeTruthy();
      }
    }
  });

  it("承認済みの画像には検証日時と根拠が残っている", () => {
    for (const asset of wikimediaAssets.filter((a) => a.verificationStatus === "approved")) {
      expect(asset.verifiedAt).toBeTruthy();
    }
  });

  it("掲載指定は、実在する画像だけを指している", () => {
    const ids = new Set(wikimediaAssets.map((asset) => asset.id));
    for (const usage of assetUsages) {
      expect(ids.has(usage.assetId)).toBe(true);
    }
  });

  it("代替テキストの無い画像は表示に回らない", () => {
    const localized = new Set(assetLocalizations.map((l) => `${l.assetId}:${l.locale}`));
    for (const usage of assetUsages) {
      const asset = wikimediaAssets.find((a) => a.id === usage.assetId);
      if (!asset || !isPublishable(asset)) continue;
      // 日本語の alt は必須。無ければ resolveImage が null を返します
      if (!localized.has(`${usage.assetId}:ja`)) {
        expect(resolveImage(usage.pageKey, usage.slot, "ja")).toBeNull();
      }
    }
  });

  it("画像が割り当てられていない枠は null を返す（＝装飾へ落ちる）", () => {
    expect(
      resolveImage(pageKey("cardport", "news", "does-not-exist"), "thumbnail", "ja"),
    ).toBeNull();
  });
});

describe("構造化データ・サイトマップへの漏れ", () => {
  it("掲載可能な画像が無いページでは、ImageObject を出力しない", () => {
    /*
      実在しないページキーを使います。
      実在するページを指すと、画像が承認された時点でこのテストが落ちます。
      ここで確かめたいのは「画像が無ければ何も出さない」という性質です。
    */
    const empty = pageKey("cardport", "guide", "no-such-guide-for-test");
    expect(pageImagesJsonLd(empty, "ja")).toBeNull();
    expect(pageImageSitemapEntries(empty, "ja")).toEqual([]);
  });

  it("構造化データにも作者・ライセンス・出典を含める", () => {
    const asset = makeAsset();
    const json = imageObjectJsonLd(asset, "ja", "決済端末", null);
    expect(json.creditText).toContain("Example Author");
    expect(json.creditText).toContain("CC BY-SA 4.0");
    expect(json.acquireLicensePage).toBe(asset.commonsPageUrl);
    expect(json.license).toBe(asset.licenseUrl);
    expect(json.creator).toMatchObject({ name: "Example Author" });
  });

  it("サイトマップXMLは image 名前空間を宣言している（画像0件でも整合する）", () => {
    const xml = buildSitemapXml();
    expect(xml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
    // 掲載可能な画像が0件のうちは <image:image> を1件も出しません
    expect(xml).not.toContain("<image:image>");
  });
});
