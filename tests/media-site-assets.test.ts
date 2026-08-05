import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  getCreditsRequiringLicenseText,
  getThirdPartyCredits,
  getUnverifiedCredits,
  siteAssetCredits,
} from "@/media/data/site-assets";

/* ============================================================
   Wikimedia 以外の素材の記録。
   ライセンスが自由でも条件はあります。ここが崩れると、
   気づかないまま条件違反の状態でサイトを配信することになります。
   ============================================================ */

describe("外部素材のクレジット", () => {
  it("外部素材には作者・出典・ライセンスが記録されている", () => {
    const thirdParty = getThirdPartyCredits();
    expect(thirdParty.length).toBeGreaterThan(0);

    for (const credit of thirdParty) {
      expect(credit.authorName?.trim(), credit.id).toBeTruthy();
      expect(credit.sourceUrl, credit.id).toBeTruthy();
      expect(credit.licenseName.trim(), credit.id).not.toBe("");
      expect(credit.licenseUrl, credit.id).toBeTruthy();
      expect(credit.verifiedAt, credit.id).toBeTruthy();
    }
  });

  it("国旗素材（MIT）の著作権表示を保持している", () => {
    const flags = siteAssetCredits.find((credit) => credit.id === "flag-icons");
    expect(flags).toBeDefined();
    expect(flags?.origin).toBe("third-party");
    expect(flags?.authorName).toBe("Panayiotis Lipiridis");
    // MIT は著作権表示と許諾表示の保持が条件です。全文の置き場所が必ず要ります。
    expect(flags?.licenseTextPath).toBe("/licenses/flag-icons-LICENSE.txt");
  });

  it("全文の保持が必要な素材には、公開場所が指定されている", () => {
    const needsText = getCreditsRequiringLicenseText();
    expect(needsText.length).toBeGreaterThan(0);

    for (const credit of needsText) {
      expect(credit.licenseTextPath, credit.id).toMatch(/^\/licenses\//);

      // 指定した場所に、実際にファイルがあること
      const path = resolve(process.cwd(), "public", credit.licenseTextPath!.replace(/^\//, ""));
      expect(existsSync(path), `${credit.id}: ${path} がありません`).toBe(true);
    }
  });

  it("flag-icons の MIT 全文が公開ディレクトリにある", () => {
    const text = readFileSync(
      resolve(process.cwd(), "public/licenses/flag-icons-LICENSE.txt"),
      "utf8",
    );

    expect(text).toContain("Copyright (c) 2013 Panayiotis Lipiridis");
    expect(text).toContain(
      "The above copyright notice and this permission notice shall be included in all",
    );
  });

  it("出所未確認の素材を「自作」と書いていない", () => {
    for (const credit of getUnverifiedCredits()) {
      // 推測を記録に書くと、記録そのものが信用できなくなります
      expect(credit.authorName, credit.id).toBeNull();
      expect(credit.verifiedAt, credit.id).toBeNull();
      expect(credit.verificationNote.trim(), credit.id).not.toBe("");
    }
  });

  it("すべての素材に使用箇所が書かれている", () => {
    for (const credit of siteAssetCredits) {
      expect(credit.usedOn.length, credit.id).toBeGreaterThan(0);
      expect(credit.fileCount, credit.id).toBeGreaterThan(0);
    }
  });
});

describe("ライセンス表記への導線", () => {
  /**
   * MIT は複製物に著作権表示を含めることが条件です。
   * 国旗を表示している画面から辿れないと、条件を満たしません。
   */
  // 分離前は5サイトぶんの言語切り替えがありました。
  // このリポジトリに残っているのは AI PORT の1つだけです。
  const switchers = ["src/components/ai-port/layout/AiLanguageSwitcher.tsx"];

  it.each(switchers)("%s から国旗のライセンス表記へ辿れる", (file) => {
    const source = readFileSync(resolve(process.cwd(), file), "utf8");

    expect(source).toContain("/licenses/flag-icons-LICENSE.txt");
    expect(source).toContain("flag-icons（MIT）");
  });

  it("一覧に挙げた画面は、実際に国旗を表示している", () => {
    // 旗を出す画面が増えたら、この一覧にも足してください（表記が欠けるためです）
    for (const file of switchers) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");
      // 直接パスを書くものと、ヘルパー経由のものがあります
      expect(source, file).toMatch(/images\/flags\/|flagSrc|localeFlagSrc/);
    }
  });
});
