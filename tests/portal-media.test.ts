/**
 * CRYPTO PORT と共通メディア基盤（`src/media`）のつなぎ込み。
 *
 * ライセンス判定そのものは `tests/media-license.test.ts` が見ています。
 * ここで守るのは「ポータル側が独自の抜け道を作っていないこと」です。
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { MEDIA_SITE, mediaSeed, newsFallbackTheme, portalPageKey } from "@/portal/lib/media";
import { newsCategories } from "@/portal/data/news";
import { footerNav } from "@/portal/data/site-content";
import { portalSitemap } from "@/portal/lib/sitemap";
import { healthIssues } from "@/portal/lib/admin";
import { wikimediaAssets } from "@/media/data/assets";
import { assetUsages } from "@/media/data/usages";
import { isPublishable } from "@/media/lib/eligibility";
import { pageImagesJsonLd } from "@/media/lib/structured-data";
import { locales } from "@/portal/i18n/config";
import { getMediaLabels } from "@/media/i18n/labels";

describe("掲載枠キー", () => {
  it("サイト識別子から始まり、他サイトの枠と衝突しない", () => {
    expect(portalPageKey("news", "example")).toBe(`${MEDIA_SITE}:news:example`);
    expect(portalPageKey("news", "example").startsWith("cardport:")).toBe(false);
  });

  it("同じ入力からは必ず同じ種が出る（ハイドレーションずれ防止）", () => {
    expect(mediaSeed("bitcoin-etf")).toBe(mediaSeed("bitcoin-etf"));
    expect(mediaSeed("bitcoin-etf")).not.toBe(mediaSeed("ethereum-l2"));
  });
});

describe("装飾テーマ", () => {
  it("すべてのニュースカテゴリに割り当てがある", () => {
    for (const category of newsCategories) {
      expect(newsFallbackTheme(category.id)).toBeTruthy();
    }
  });

  it("カテゴリごとに複数のテーマへ分かれている（一覧が同じ絵柄で埋まらない）", () => {
    const themes = new Set(newsCategories.map((category) => newsFallbackTheme(category.id)));
    expect(themes.size).toBeGreaterThanOrEqual(6);
  });
});

describe("掲載可否", () => {
  it("確認できていない画像は掲載されない", () => {
    for (const asset of wikimediaAssets) {
      if (asset.verificationStatus !== "approved") {
        expect(isPublishable(asset)).toBe(false);
      }
    }
  });

  it("掲載枠は実在する画像だけを指す", () => {
    const ids = new Set(wikimediaAssets.map((asset) => asset.id));
    for (const usage of assetUsages) {
      expect(ids.has(usage.assetId)).toBe(true);
    }
  });

  it("構造化データは掲載可能な画像がなければ何も出さない", () => {
    // 掲載されていない枠から ImageObject が漏れないことの確認です
    expect(pageImagesJsonLd(portalPageKey("news", "does-not-exist"), "ja")).toBeNull();
  });
});

describe("画像サイトマップ", () => {
  it("掲載可能な画像がない間は images を持たない", () => {
    const withImages = portalSitemap().filter(
      (entry) => (entry as { images?: string[] }).images !== undefined,
    );
    const publishable = wikimediaAssets.filter(isPublishable);
    if (publishable.length === 0) {
      expect(withImages).toHaveLength(0);
    } else {
      expect(withImages.length).toBeGreaterThan(0);
    }
  });

  it("出典一覧ページが全言語ぶん含まれる", () => {
    const credits = portalSitemap().filter((entry) => entry.url.includes("/image-credits"));
    expect(credits).toHaveLength(locales.length);
  });
});

describe("出典表示への導線", () => {
  it("フッターから画像の出典一覧へ行ける", () => {
    const hrefs = footerNav.flatMap((group) => group.items.map((item) => item.href));
    expect(hrefs).toContain("/image-credits");
  });

  it("全対応言語に画像まわりのラベルがある", () => {
    for (const locale of locales) {
      const labels = getMediaLabels(locale.code);
      expect(labels.photo.length).toBeGreaterThan(0);
      expect(labels.creditsTitle.length).toBeGreaterThan(0);
    }
  });
});

describe("管理画面", () => {
  it("画像が0件のあいだは、その旨が健全性チェックに出る", () => {
    const imageIssues = healthIssues().filter((issue) => issue.area === "画像");
    if (wikimediaAssets.length === 0) {
      expect(imageIssues.length).toBeGreaterThan(0);
    }
  });
});

describe("取得対象リスト", () => {
  const requests = JSON.parse(
    readFileSync(path.join(process.cwd(), "src/media/data/requests.json"), "utf8"),
  ) as { pageKey: string; slot: string; query: string }[];

  it("CRYPTO PORT の取得対象が登録されている", () => {
    const portal = requests.filter((request) => request.pageKey.startsWith(`${MEDIA_SITE}:`));
    expect(portal.length).toBeGreaterThan(0);
  });

  it("取得対象にライセンスや作者を書き込んでいない（推測の混入防止）", () => {
    for (const request of requests) {
      expect(request).not.toHaveProperty("licenseCode");
      expect(request).not.toHaveProperty("authorName");
      expect(Object.keys(request).sort()).toEqual(
        ["limit", "pageKey", "query", "slot", "wikidataEntityId"].sort(),
      );
    }
  });

  it("掲載枠キーが重複していない", () => {
    const keys = requests.map((request) => `${request.pageKey}#${request.slot}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
