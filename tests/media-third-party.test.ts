/**
 * 第三者素材のクレジットが消えていないことを確認します。
 *
 * MIT のように「著作権表示とライセンス文の保持」を条件とするライセンスでは、
 * 表示を省いた時点で違反になります。コードの整理で消えないよう固定します。
 */
import { describe, expect, it } from "vitest";

import { thirdPartyAssets, getThirdPartyAsset } from "@/media/data/third-party";

describe("第三者素材のクレジット", () => {
  it("国旗（flag-icons / MIT）の著作権表示を保持している", () => {
    const flags = getThirdPartyAsset("flag-icons");
    expect(flags).toBeDefined();
    expect(flags?.licenseName).toContain("MIT");
    // MIT が保持を要求する著作権表示。1文字も変えずに載せます
    expect(flags?.copyrightNotice).toBe("Copyright (c) 2013 Panayiotis Lipiridis");
    expect(flags?.licenseUrl).toMatch(/^https:\/\//);
    expect(flags?.sourceUrl).toMatch(/^https:\/\//);
    // 加工しているので、その内容も示します
    expect(flags?.modification).toBeDefined();
  });

  it("すべての第三者素材に、ライセンス・著作権表示・配布元がある", () => {
    for (const asset of thirdPartyAssets) {
      expect(asset.name, asset.id).toBeTruthy();
      expect(asset.licenseName, asset.id).toBeTruthy();
      expect(asset.licenseUrl, asset.id).toMatch(/^https:\/\//);
      expect(asset.copyrightNotice, asset.id).toBeTruthy();
      expect(asset.sourceUrl, asset.id).toMatch(/^https:\/\//);
      expect(asset.usage.ja, asset.id).toBeTruthy();
      expect(asset.usage.en, asset.id).toBeTruthy();
    }
  });
});
