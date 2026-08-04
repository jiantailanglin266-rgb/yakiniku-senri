/**
 * 公開URLの組み立て。
 *
 * ■ なぜ専用のテストが要るのか
 *   canonical・hreflang・サイトマップ・robots.txt は、
 *   環境変数から組み立てた文字列がそのまま検索エンジンへ渡ります。
 *   画面には出ないため、目視では気づけません。
 *
 *   実際、GitHub Pages のワークフローは
 *   `NEXT_PUBLIC_SITE_URL=https://<owner>.github.io/<repo>` と
 *   `NEXT_PUBLIC_BASE_PATH=/<repo>` の両方を渡します。
 *   前者にすでにベースパスが入っているため、後者をそのまま足すと
 *   `/<repo>/<repo>/ja/...` という 404 のURLになります。
 *   静的エクスポートで 20,280 件がこの形で出ていました。
 *
 * ■ 既定のテスト環境では再現しません
 *   NEXT_PUBLIC_BASE_PATH が空のときは二重になりようがないためです。
 *   ここでは配信時と同じ環境変数を与えたうえで、モジュールを読み直します。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGIN = "https://example.github.io";
const BASE_PATH = "/port-network";
const PUBLIC_URL = `${ORIGIN}${BASE_PATH}`;

/** GitHub Pages のワークフローが渡すのと同じ環境変数を与えます */
function stubPagesEnv() {
  vi.stubEnv("NEXT_PUBLIC_BASE_PATH", BASE_PATH);
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", PUBLIC_URL);
  vi.resetModules();
}

/** ベースパスが2回以上出てくるURLを返します */
function doubled(urls: string[]): string[] {
  return urls.filter((url) => url.split(BASE_PATH).length - 1 > 1);
}

beforeEach(() => {
  stubPagesEnv();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("CRYPTO PORT のベースパス", () => {
  it("portalOrigin はベースパスを含まない", async () => {
    const { portalOrigin } = await import("@/portal/lib/site");
    expect(portalOrigin).toBe(ORIGIN);
  });

  it("portalBase はベースパスをちょうど1回だけ含む", async () => {
    const { portalBase } = await import("@/portal/lib/site");
    expect(portalBase).toBe(PUBLIC_URL);
  });

  it("オリジンだけを渡したときもベースパスが1回だけ付く", async () => {
    vi.stubEnv("NEXT_PUBLIC_PORTAL_URL", ORIGIN);
    vi.resetModules();

    const { portalBase, portalOrigin } = await import("@/portal/lib/site");
    expect(portalOrigin).toBe(ORIGIN);
    expect(portalBase).toBe(PUBLIC_URL);
  });

  it("言語別URLのベースパスが二重にならない", async () => {
    const { localeUrl } = await import("@/portal/lib/seo");
    expect(localeUrl("ja", "/coins")).toBe(`${PUBLIC_URL}/ja/coins`);
  });

  it("すでにベースパスを含むパスへ、もう一度足さない", async () => {
    const { absolutePortalUrl } = await import("@/portal/lib/seo");
    // withBasePath() の戻り値を渡す想定の関数です
    expect(absolutePortalUrl(`${BASE_PATH}/images/portal/x.webp`)).toBe(
      `${PUBLIC_URL}/images/portal/x.webp`,
    );
  });
});

describe("CARD PORT の公開URL", () => {
  it("環境変数が無ければ、実際に配信しているURLを使う", async () => {
    const { cardportUrl } = await import("@/cardport/config/site");
    expect(cardportUrl).toBe(PUBLIC_URL);
  });

  it("独自ドメインを渡せば、そちらが優先される", async () => {
    vi.stubEnv("NEXT_PUBLIC_CARDPORT_URL", "https://card-port.jp");
    vi.resetModules();

    const { cardportUrl } = await import("@/cardport/config/site");
    expect(cardportUrl).toBe("https://card-port.jp");
  });

  it("絶対URLのベースパスが二重にならない", async () => {
    const { cardportAbsoluteUrl } = await import("@/cardport/config/site");
    expect(cardportAbsoluteUrl(`${BASE_PATH}/card-port/ja`)).toBe(`${PUBLIC_URL}/card-port/ja`);
  });
});

describe("サイトマップ（配信時と同じ環境変数）", () => {
  it("ベースパスが二重に入ったURLを1件も出さない", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const urls = sitemap().map((entry) => entry.url);

    expect(urls.length).toBeGreaterThan(0);
    expect(doubled(urls)).toEqual([]);
  });

  it("すべてのURLが、実際に配信しているオリジンを指す", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const urls = sitemap().map((entry) => entry.url);

    /*
      プレースホルダーのドメイン（cardport.example など）が混ざると、
      存在しないURLを検索エンジンへ申告することになります。
    */
    const foreign = urls.filter((url) => !url.startsWith(`${PUBLIC_URL}/`));
    expect(foreign).toEqual([]);
  });

  it("hreflang の代替URLも同じオリジンを指す", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const languages = sitemap().flatMap((entry) =>
      Object.values(entry.alternates?.languages ?? {}),
    ) as string[];

    expect(languages.length).toBeGreaterThan(0);
    expect(doubled(languages)).toEqual([]);
    expect(languages.filter((url) => !url.startsWith(`${PUBLIC_URL}/`))).toEqual([]);
  });
});

describe("robots.txt（配信時と同じ環境変数）", () => {
  it("申告するサイトマップのURLが二重にならない", async () => {
    const { default: robots } = await import("@/app/robots");
    const result = robots();
    const sitemaps = (Array.isArray(result.sitemap) ? result.sitemap : [result.sitemap]).filter(
      (url): url is string => typeof url === "string",
    );

    expect(sitemaps).toContain(`${PUBLIC_URL}/sitemap.xml`);
    expect(doubled(sitemaps)).toEqual([]);
  });

  it("CRYPTO PORT のニュース／動画サイトマップを落とさない", async () => {
    /*
      同一オリジンで配信しているときだけ申告する仕様です。
      ここを portalOrigin（ベースパス無し）と比べてしまうと、
      配信先が一致しているのに全部落ちます。
    */
    const { default: robots } = await import("@/app/robots");
    const sitemaps = (
      Array.isArray(robots().sitemap) ? robots().sitemap : [robots().sitemap]
    ) as string[];

    expect(sitemaps.some((url) => url.endsWith("/ja/news-sitemap.xml"))).toBe(true);
    expect(sitemaps.some((url) => url.endsWith("/ja/video-sitemap.xml"))).toBe(true);
  });

  it("別ドメインで配信するときは、他ホストのサイトマップを申告しない", async () => {
    vi.stubEnv("NEXT_PUBLIC_PORTAL_URL", "https://crypto-port.jp");
    vi.resetModules();

    const { default: robots } = await import("@/app/robots");
    const sitemaps = (
      Array.isArray(robots().sitemap) ? robots().sitemap : [robots().sitemap]
    ) as string[];

    expect(sitemaps).toEqual([`${PUBLIC_URL}/sitemap.xml`]);
  });
});
