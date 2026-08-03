import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", async () => (await import("./helpers/next-mocks")).fontMock());

import { pageMetadata } from "@/lib/seo";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  organizationJsonLd,
  restaurantJsonLd,
  websiteJsonLd,
} from "@/lib/structured-data";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { metadata as rootMetadata } from "@/app/layout";
import { siteUrl } from "@/data/site";
import { store } from "@/data/store";
import { faqs } from "@/data/content";
import { getNews } from "@/data/news";

describe("メタデータ", () => {
  it("トップページに title と description が設定されている", () => {
    expect(rootMetadata.title).toBeTruthy();
    expect(String(rootMetadata.description).length).toBeGreaterThan(50);
  });

  it("noindex / nofollow を設定していない", () => {
    expect(rootMetadata.robots).toEqual({ index: true, follow: true });
  });

  it("下層ページに canonical と OGP が設定される", () => {
    const meta = pageMetadata({
      title: "お品書き",
      description: "焼肉 千里のお品書き。",
      path: "/menu",
    });
    expect(meta.alternates?.canonical).toBe(`${siteUrl}/menu`);
    expect(meta.openGraph?.title).toContain("お品書き");
    expect(meta.twitter).toBeTruthy();
    expect(meta.robots).toEqual({ index: true, follow: true });
  });
});

describe("構造化データ", () => {
  it("Restaurant に表示している情報のみが含まれる", () => {
    expect(restaurantJsonLd["@type"]).toBe("Restaurant");
    expect(restaurantJsonLd.telephone).toBe(store.phone);
    expect(restaurantJsonLd.address.postalCode).toBe(store.postalCode);
    // 画面に出していない座標や価格帯は含めない
    expect(restaurantJsonLd).not.toHaveProperty("geo");
    expect(restaurantJsonLd).not.toHaveProperty("priceRange");
  });

  it("営業時間が定休日を除いて出力される", () => {
    const days = restaurantJsonLd.openingHoursSpecification.flatMap((spec) => spec.dayOfWeek);
    expect(days).not.toContain("https://schema.org/Thursday");
  });

  it("Organization / WebSite が出力される", () => {
    expect(organizationJsonLd["@type"]).toBe("Organization");
    expect(websiteJsonLd["@type"]).toBe("WebSite");
    expect(websiteJsonLd.url).toBe(siteUrl);
  });

  it("FAQPage が画面表示の内容と一致する", () => {
    expect(faqJsonLd.mainEntity).toHaveLength(faqs.length);
    expect(faqJsonLd.mainEntity[0].name).toBe(faqs[0].question);
    expect(faqJsonLd.mainEntity[0].acceptedAnswer.text).toBe(faqs[0].answer);
  });

  it("BreadcrumbList の position が 1 から連番になる", () => {
    const crumbs = breadcrumbJsonLd([
      { label: "ホーム", href: "/" },
      { label: "お知らせ", href: "/news" },
    ]);
    expect(crumbs.itemListElement.map((item) => item.position)).toEqual([1, 2]);
    expect(crumbs.itemListElement[0].item).toBe(siteUrl);
  });
});

describe("sitemap / robots", () => {
  it("sitemap に主要ページとお知らせ詳細が含まれる", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toContain(`${siteUrl}/`);
    expect(urls).toContain(`${siteUrl}/menu`);
    expect(urls).toContain(`${siteUrl}/access`);
    for (const post of getNews()) {
      expect(urls).toContain(`${siteUrl}/news/${post.slug}`);
    }
  });

  it("sitemap に重複URLがない", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("robots.txt が全ページを許可し sitemap を指す", () => {
    const result = robots();
    expect(result.rules).toEqual([{ userAgent: "*", allow: "/" }]);
    expect(result.sitemap).toBe(`${siteUrl}/sitemap.xml`);
  });
});
