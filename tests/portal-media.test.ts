/**
 * CRYPTO PORT と共通メディア基盤（`src/media`）のつなぎ込み。
 *
 * ライセンス判定そのものは `tests/media-license.test.ts` が見ています。
 * ここで守るのは「ポータル側が独自の抜け道を作っていないこと」です。
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import { MEDIA_SITE, mediaSeed, newsFallbackTheme, portalPageKey } from "@/portal/lib/media";
import { newsCategories } from "@/portal/data/news";
import { coins } from "@/portal/data/coins";
import { learnArticles } from "@/portal/data/learn";
import { photoCredit, portalPhoto } from "@/portal/lib/photos";
import { footerNav } from "@/portal/data/site-content";
import {
  portalNewsSitemapUrls,
  portalSitemap,
  portalVideoSitemapEntries,
} from "@/portal/lib/sitemap";
import { sortedNews } from "@/portal/data/news";
import { videos } from "@/portal/data/videos";
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
    /*
      ここに書いてよいのは「どこを探すか」だけです。
      ライセンス・作者・出典は Commons から取得した値しか使いません
      （手で書けてしまうと、確認済みの画像と区別がつかなくなります）。
      wikipedia は探索の起点（記事タイトル）で、権利情報ではありません。
    */
    const allowedKeys = ["limit", "pageKey", "query", "slot", "wikidataEntityId", "wikipedia"];
    for (const request of requests) {
      expect(request).not.toHaveProperty("licenseCode");
      expect(request).not.toHaveProperty("authorName");
      expect(request).not.toHaveProperty("licenseName");
      for (const key of Object.keys(request)) {
        expect(allowedKeys, `未知のキー: ${key}`).toContain(key);
      }
    }
  });

  it("掲載枠キーが重複していない", () => {
    const keys = requests.map((request) => `${request.pageKey}#${request.slot}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("一括クレジット方式の写真（mountain-peak 方式）", () => {
  const targets = JSON.parse(
    readFileSync(path.join(process.cwd(), "src/portal/data/photo-targets.json"), "utf8"),
  ) as { key: string; query: string }[];
  const manifest = JSON.parse(
    readFileSync(path.join(process.cwd(), "src/portal/data/photo-manifest.json"), "utf8"),
  ) as Record<string, { file: string; commonsFile: string; width: number; height: number }>;

  it("取得対象のキーが重複していない", () => {
    const keys = targets.map((target) => target.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("取得対象は実在する銘柄・記事を指す", () => {
    const known = new Set([
      ...coins.map((coin) => `coin:${coin.slug}`),
      ...learnArticles.map((article) => `learn:${article.slug}`),
    ]);
    for (const target of targets) {
      expect(known.has(target.key), target.key).toBe(true);
    }
  });

  it("マニフェストには実体ファイルがあるものだけが載る", () => {
    // 実体が無いのに <img> を出すと 404 が並ぶため、両者を一致させます
    for (const [key, entry] of Object.entries(manifest)) {
      const file = path.join(process.cwd(), "public/images/portal", entry.file);
      expect(existsSync(file), `${key} -> ${entry.file}`).toBe(true);
    }
  });

  it("マニフェストに無いページは写真を描画しない", () => {
    const missing = coins.find((coin) => !manifest[`coin:${coin.slug}`]);
    if (missing) expect(portalPhoto("coin", missing.slug)).toBeNull();
  });

  it("出所をたどれるよう Commons のファイル名を残している", () => {
    for (const [key, entry] of Object.entries(manifest)) {
      expect(entry.commonsFile, key).toMatch(/^File:/);
    }
  });

  it("一括クレジットにライセンス名と出典が含まれる", () => {
    for (const locale of ["ja", "en"]) {
      expect(photoCredit(locale)).toContain("Wikimedia Commons");
      expect(photoCredit(locale)).toContain("CC BY-SA 4.0");
    }
  });

  it("共通メディア基盤の判定経路とは混ざらない", () => {
    // PortalPhoto は src/media を import しません。
    // 混ざると「個別確認済み」と「未確認」の区別が付かなくなります
    const source = readFileSync(
      path.join(process.cwd(), "src/portal/components/media/PortalPhoto.tsx"),
      "utf8",
    );
    expect(source).not.toContain("@/media");
  });
});

describe("ニュース／動画サイトマップ", () => {
  it("ニュースサイトマップは公開から2日以内の記事だけを載せる", () => {
    // 2日を超えた記事は Google ニュースが受け付けないため、機械的に落とします
    const latest = sortedNews()[0];
    const justAfter = new Date(Date.parse(latest.publishedAt) + 60_000);
    const fresh = portalNewsSitemapUrls("ja", justAfter);
    expect(fresh.length).toBeGreaterThan(0);

    const wayLater = new Date(Date.parse(latest.publishedAt) + 30 * 86_400_000);
    expect(portalNewsSitemapUrls("ja", wayLater)).toHaveLength(0);
  });

  it("ニュースサイトマップの言語が hreflang と一致する", () => {
    const latest = sortedNews()[0];
    const justAfter = new Date(Date.parse(latest.publishedAt) + 60_000);
    expect(portalNewsSitemapUrls("zh-cn", justAfter)[0]?.language).toBe("zh-Hans");
  });

  it("動画サイトマップは再生場所を示せる動画だけを載せる", () => {
    // player_loc は必須項目です。youtubeId が無い動画は載せません
    const entries = portalVideoSitemapEntries("ja");
    expect(entries.length).toBe(videos.filter((video) => video.youtubeId.length > 0).length);
    for (const entry of entries) {
      expect(entry.playerUrl).toMatch(/^https:\/\/www\.youtube\.com\/embed\/.+/);
      expect(entry.durationSec).toBeGreaterThan(0);
    }
  });

  it("同じオリジンで配信しているときは robots.txt が両方を申告する", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    vi.stubEnv("NEXT_PUBLIC_PORTAL_URL", "https://example.com");
    vi.resetModules();
    try {
      const { default: sameOriginRobots } = await import("@/app/robots");
      const result = sameOriginRobots();
      const sitemaps = Array.isArray(result.sitemap) ? result.sitemap : [result.sitemap];
      expect(sitemaps.some((url) => url?.includes("/news-sitemap.xml"))).toBe(true);
      expect(sitemaps.some((url) => url?.includes("/video-sitemap.xml"))).toBe(true);
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });

  it("別ドメインで配信しているときは申告しない（存在しないURLを書かない）", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    vi.stubEnv("NEXT_PUBLIC_PORTAL_URL", "https://crypto.example.net");
    vi.resetModules();
    try {
      const { default: crossOriginRobots } = await import("@/app/robots");
      const result = crossOriginRobots();
      const sitemaps = Array.isArray(result.sitemap) ? result.sitemap : [result.sitemap];
      expect(sitemaps.some((url) => url?.includes("-sitemap.xml"))).toBe(false);
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });
});
