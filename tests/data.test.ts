import { describe, expect, it } from "vitest";
import { store } from "@/data/store";
import { socialLinks, ownerSiteUrl, googleMapsUrl } from "@/data/site";
import {
  formatPrice,
  getPopulatedCategories,
  menuCategories,
  menuItems,
  recommendedItems,
} from "@/data/menu";
import { getAllNewsSlugs, getNews, getNewsBySlug } from "@/data/news";
import { commitments, faqs, storyBlocks } from "@/data/content";

describe("店舗情報", () => {
  it("電話リンクが国番号付きの正しい形式である", () => {
    expect(store.phone).toBe("03-3418-7496");
    expect(store.phoneHref).toBe("tel:+81334187496");
    // 表示用の電話番号と tel: リンクの数字が一致していること
    expect(store.phoneHref.replace(/\D/g, "")).toBe(`81${store.phone.replace(/\D/g, "").slice(1)}`);
  });

  it("住所表記がサイト内で統一されている", () => {
    expect(store.addressFull).toContain(store.postalCode);
    expect(store.addressFull).toContain(store.address);
    expect(store.address).toBe(
      `${store.addressParts.region}${store.addressParts.locality}${store.addressParts.street}`,
    );
  });

  it("営業時間に定休日（木曜）が含まれていない", () => {
    const days = store.businessHours.flatMap((hour) => hour.days);
    expect(days).not.toContain("Thursday");
    expect(store.closed).toBe("木曜日");
  });

  it("すべての営業時間に開始・終了時刻が設定されている", () => {
    for (const hour of store.businessHours) {
      expect(hour.opens).toMatch(/^\d{2}:\d{2}$/);
      expect(hour.closes).toMatch(/^\d{2}:\d{2}$/);
      expect(hour.days.length).toBeGreaterThan(0);
    }
  });
});

describe("外部リンク", () => {
  it("すべて https の絶対URLである", () => {
    for (const link of socialLinks) {
      expect(link.href).toMatch(/^https:\/\//);
    }
    expect(ownerSiteUrl).toMatch(/^https:\/\//);
    expect(googleMapsUrl).toMatch(/^https:\/\//);
  });
});

describe("お品書きデータ", () => {
  it("すべての品目が既知のカテゴリーに属している", () => {
    const ids = new Set(menuCategories.map((category) => category.id));
    for (const item of menuItems) {
      expect(ids.has(item.category)).toBe(true);
    }
  });

  it("品目IDが重複していない", () => {
    const ids = menuItems.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("おすすめが3件登録されている", () => {
    expect(recommendedItems).toHaveLength(3);
  });

  it("品目が0件のカテゴリーは表示対象に含まれない", () => {
    const populated = getPopulatedCategories();
    expect(populated.length).toBeGreaterThan(0);
    for (const category of populated) {
      expect(category.items.length).toBeGreaterThan(0);
    }
    expect(populated.some((category) => category.id === "seafood")).toBe(false);
  });

  it("価格が日本円表記に整形される", () => {
    expect(formatPrice(5600)).toBe("¥5,600");
    expect(formatPrice(935)).toBe("¥935");
  });
});

describe("お知らせデータ", () => {
  it("新しい順に並ぶ", () => {
    const dates = getNews().map((post) => post.date);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("件数制限が効く", () => {
    expect(getNews(2)).toHaveLength(2);
  });

  it("slug から記事を取得できる", () => {
    const slugs = getAllNewsSlugs();
    expect(slugs.length).toBeGreaterThan(0);
    for (const slug of slugs) {
      expect(getNewsBySlug(slug)?.slug).toBe(slug);
    }
    expect(getNewsBySlug("does-not-exist")).toBeUndefined();
  });
});

describe("本文コンテンツ", () => {
  it("こだわりが4件ある", () => {
    expect(commitments).toHaveLength(4);
  });

  it("ストーリーブロックに本文がある", () => {
    for (const block of storyBlocks) {
      expect(block.body.length).toBeGreaterThan(0);
    }
  });

  it("FAQに空の回答がない", () => {
    for (const faq of faqs) {
      expect(faq.question.length).toBeGreaterThan(0);
      expect(faq.answer.length).toBeGreaterThan(0);
    }
  });
});
