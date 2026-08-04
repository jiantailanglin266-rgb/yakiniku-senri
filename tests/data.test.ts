import { existsSync } from "node:fs";
import path from "node:path";
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
import { marqueeMiddle, marqueeTop } from "@/data/marquee";

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

describe("英字マーキー", () => {
  const rows = [...marqueeTop, ...marqueeMiddle];

  it("上部・中部とも2段で、各段に語がある", () => {
    for (const band of [marqueeTop, marqueeMiddle]) {
      expect(band).toHaveLength(2);
      for (const row of band) expect(row.length).toBeGreaterThan(2);
    }
  });

  it("同じ段に同じ語を重ねない（繰り返し表示で目立つため）", () => {
    for (const row of rows) {
      expect(new Set(row).size).toBe(row.length);
    }
  });

  it("確認できていない格付け・仕入れの語を含めない", () => {
    // 店に確認できていない主張は、装飾であっても優良誤認になります
    const 禁止語 = [
      "WAGYU",
      "A5",
      "A4",
      "AGED",
      "DRY AGE",
      "BINCHOTAN",
      "KUROGE",
      "MICHELIN",
      "AWARD",
      "BEST",
      "NO.1",
      "LUXURY",
      "FINEST",
    ];
    for (const row of rows) {
      for (const word of row) {
        for (const 禁止 of 禁止語) {
          expect(word.toUpperCase()).not.toContain(禁止);
        }
      }
    }
  });

  it("英字のみで構成されている（英字ロゴタイプとして置いているため）", () => {
    for (const row of rows) {
      for (const word of row) {
        expect(word).toMatch(/^[A-Z0-9 &.'-]+$/);
      }
    }
  });
});

describe("404ページの配置", () => {
  // `(senri)` の中に置くと `/_not-found` から参照されず、静的書き出しの
  // 404.html が Next.js 既定の英語ページになります。GitHub Pages では
  // 未知のURLがすべてこの 404.html を返すため、4サイト共通で影響します。
  it("app 直下にあり、ルートグループの中に重複していない", () => {
    const appDir = path.join(process.cwd(), "src", "app");
    expect(existsSync(path.join(appDir, "not-found.tsx"))).toBe(true);
    expect(existsSync(path.join(appDir, "(senri)", "not-found.tsx"))).toBe(false);
  });
});
