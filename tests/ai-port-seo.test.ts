import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", async () => (await import("./helpers/next-mocks")).fontMock());

import { GET as llmsTxt } from "@/app/ai-port/llms.txt/route";
import { GET as rssXml } from "@/app/ai-port/rss.xml/route";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { getArticles } from "@/data/ai-port/articles";
import { diagnoses } from "@/data/ai-port/diagnosis";
import { siteFaqs } from "@/data/ai-port/faq";
import { vendors } from "@/data/ai-port/feeds";
import { AI_PORT_BASE, aiPortUrl } from "@/data/ai-port/site";
import { topics } from "@/data/ai-port/taxonomy";
import { findTool, tools } from "@/data/ai-port/tools";
import { aiPortMetadata } from "@/lib/ai-port/seo";
import {
  aiPortBreadcrumbJsonLd,
  aiPortOrganizationJsonLd,
  aiPortWebsiteJsonLd,
  articleJsonLd,
  diagnosisJsonLd,
  howToJsonLd,
  newsItemListJsonLd,
  siteFaqJsonLd,
  softwareApplicationJsonLd,
  toolItemListJsonLd,
} from "@/lib/ai-port/structured-data";

describe("メタデータ", () => {
  it("canonical と hreflang が実在するURLだけを指す", () => {
    const meta = aiPortMetadata({
      title: "AIツール",
      description: "AIツールの一覧です。".repeat(4),
      path: "/tools",
    });

    expect(meta.alternates?.canonical).toBe(aiPortUrl("/tools"));

    // 翻訳版の実URLを持たないため、ja と x-default だけを申告します。
    // 存在しないURL（/en/... など）を hreflang に書くと評価を落とします。
    const languages = meta.alternates?.languages as Record<string, string>;
    expect(Object.keys(languages).sort()).toEqual(["ja", "x-default"]);
    expect(languages.ja).toBe(aiPortUrl("/tools"));
  });

  it("OGP と Twitter Card が絶対URLの画像を持つ", () => {
    const meta = aiPortMetadata({
      title: "テスト",
      description: "説明文です。".repeat(6),
      path: "/",
    });

    const images = meta.openGraph?.images as { url: string }[];
    expect(images[0].url.startsWith("http")).toBe(true);
    expect(meta.twitter).toBeTruthy();
  });

  it("検索結果ページは noindex、通常ページは index される", () => {
    const search = aiPortMetadata({
      title: "検索",
      description: "サイト内を検索します。".repeat(3),
      path: "/search",
      noindex: true,
    });
    expect(search.robots).toMatchObject({ index: false, follow: true });

    const normal = aiPortMetadata({
      title: "AIツール",
      description: "AIツールの一覧です。".repeat(4),
      path: "/tools",
    });
    expect(normal.robots).toMatchObject({ index: true, follow: true });
  });

  it("RSS を alternate として申告している", () => {
    const meta = aiPortMetadata({
      title: "AIニュース",
      description: "最新のAIニュースです。".repeat(3),
      path: "/news",
    });
    expect(meta.alternates?.types).toMatchObject({
      "application/rss+xml": aiPortUrl("/rss.xml"),
    });
  });
});

describe("構造化データ（出してはいけないもの）", () => {
  /** JSON-LD を丸ごと文字列化して、禁止プロパティが混ざっていないか調べます。 */
  const serialize = (data: unknown) => JSON.stringify(data);

  const everything = [
    aiPortOrganizationJsonLd,
    aiPortWebsiteJsonLd,
    siteFaqJsonLd(siteFaqs),
    toolItemListJsonLd(tools, "一覧", "/tools"),
    ...tools.map((tool) => softwareApplicationJsonLd(tool)),
    ...getArticles().map((article) => articleJsonLd(article)),
    ...diagnoses.map((diagnosis) => diagnosisJsonLd(diagnosis)),
  ];

  it("AggregateRating / Review / award を一切出力しない", () => {
    // 実データがないのに出すと Google のポリシー違反かつ優良誤認になります
    for (const entry of everything) {
      const json = serialize(entry);
      expect(json).not.toContain("aggregateRating");
      expect(json).not.toContain("AggregateRating");
      expect(json).not.toContain('"Review"');
      expect(json).not.toContain('"award"');
      expect(json).not.toContain("ratingValue");
    }
  });

  it("価格を含む offers を出力しない（画面に金額を出していないため）", () => {
    for (const tool of tools) {
      const json = serialize(softwareApplicationJsonLd(tool));
      expect(json).not.toContain('"offers"');
      expect(json).not.toContain("priceCurrency");
    }
  });

  it("外部ニュースの一覧は NewsArticle ではなく ItemList で出す", () => {
    const jsonLd = newsItemListJsonLd(
      [
        {
          title: "外部記事",
          link: "https://example.com/a",
          isoDate: "2026-08-01T00:00:00.000Z",
          summary: "",
          feedId: "x",
          vendorIds: [],
        },
      ],
      "ニュース",
      "/news",
    );

    expect(jsonLd["@type"]).toBe("ItemList");
    expect(serialize(jsonLd)).not.toContain("NewsArticle");
    // 各項目は配信元のURLを指す（自社コンテンツと誤認させない）
    const items = jsonLd.itemListElement as { url: string }[];
    expect(items[0].url).toBe("https://example.com/a");
  });
});

describe("構造化データ（出すもの）", () => {
  it("WebSite に検索アクションが含まれる", () => {
    const action = aiPortWebsiteJsonLd.potentialAction as { target: { urlTemplate: string } };
    expect(action.target.urlTemplate).toContain("/search?q=");
  });

  it("SoftwareApplication が画面表示と一致する項目だけを持つ", () => {
    const tool = findTool("chatgpt")!;
    const jsonLd = softwareApplicationJsonLd(tool);

    expect(jsonLd.name).toBe(tool.name);
    expect(jsonLd.url).toBe(tool.url);

    // 未確認（null）の項目は additionalProperty に出さない
    const unknownTool = tools.find((entry) => entry.api === null)!;
    const properties = softwareApplicationJsonLd(unknownTool).additionalProperty as {
      name: string;
    }[];
    expect(properties.some((property) => property.name === "API")).toBe(false);
  });

  it("FAQPage が画面に出している質問と同数になる", () => {
    const jsonLd = siteFaqJsonLd(siteFaqs);
    expect((jsonLd.mainEntity as unknown[]).length).toBe(siteFaqs.length);
  });

  it("手順のある記事だけ HowTo を出力する", () => {
    const withSteps = getArticles().find((article) =>
      article.sections.some((section) => section.steps && section.steps.length > 0),
    )!;
    expect(howToJsonLd(withSteps)).toBeTruthy();

    const withoutSteps = {
      ...withSteps,
      sections: withSteps.sections.map((section) => ({ ...section, steps: undefined })),
    };
    expect(howToJsonLd(withoutSteps)).toBeNull();
  });

  it("パンくずが渡した順に position を振る", () => {
    const jsonLd = aiPortBreadcrumbJsonLd([
      { name: "AI PORT", path: "/" },
      { name: "AIツール", path: "/tools" },
    ]);
    const items = jsonLd.itemListElement as { position: number; item: string }[];
    expect(items[0].position).toBe(1);
    expect(items[1].item).toBe(aiPortUrl("/tools"));
  });
});

describe("サイトマップ", () => {
  const entries = sitemap();
  const urls = entries.map((entry) => entry.url);

  it("AI PORT の主要ページがすべて含まれる", () => {
    for (const path of ["/", "/news", "/tools", "/ranking", "/compare", "/guides", "/diagnosis"]) {
      expect(urls, path).toContain(aiPortUrl(path));
    }
  });

  it("すべてのツール・トピック・記事・診断・ベンダーページが含まれる", () => {
    for (const tool of tools) expect(urls).toContain(aiPortUrl(`/tools/${tool.slug}`));
    for (const topic of topics) expect(urls).toContain(aiPortUrl(`/topics/${topic.slug}`));
    for (const article of getArticles())
      expect(urls).toContain(aiPortUrl(`/guides/${article.slug}`));
    for (const diagnosis of diagnoses)
      expect(urls).toContain(aiPortUrl(`/diagnosis/${diagnosis.slug}`));
    for (const vendor of vendors) expect(urls).toContain(aiPortUrl(`/news/${vendor.id}`));
  });

  it("検索結果ページとAPIを含めない", () => {
    expect(urls).not.toContain(aiPortUrl("/search"));
    expect(urls.some((url) => url.includes("/api/"))).toBe(false);
  });

  it("焼肉 千里 側のURLも従来どおり含まれる（既存を壊していない）", () => {
    expect(urls.some((url) => url.endsWith("/menu"))).toBe(true);
    expect(urls.some((url) => url.endsWith("/access"))).toBe(true);
  });

  it("URLが重複していない", () => {
    expect(new Set(urls).size).toBe(urls.length);
  });
});

describe("robots.txt", () => {
  const result = robots();

  it("検索結果ページとAPIをクロール対象から外す", () => {
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect(rule?.disallow).toContain(`${AI_PORT_BASE}/search`);
    expect(rule?.disallow).toContain(`${AI_PORT_BASE}/api/`);
  });

  it("それ以外は許可し、サイトマップを申告する", () => {
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect(rule?.allow).toBe("/");
    expect(result.sitemap).toContain("/sitemap.xml");
  });
});

describe("RSS フィード", () => {
  it("自社の解説記事だけを配信する", async () => {
    const xml = await rssXml().text();

    expect(xml).toContain("<?xml");
    expect(xml).toContain('<rss version="2.0"');

    for (const article of getArticles()) {
      expect(xml).toContain(aiPortUrl(`/guides/${article.slug}`));
    }

    // 外部から集めたニュースを自社フィードとして再配信しない
    const itemCount = (xml.match(/<item>/g) ?? []).length;
    expect(itemCount).toBe(getArticles().length);
  });

  it("XMLに使えない文字をエスケープする", async () => {
    const xml = await rssXml().text();
    // タイトル・説明の中に生の & が残っていないこと
    const insideTitles = xml.match(/<title>[\s\S]*?<\/title>/g) ?? [];
    for (const title of insideTitles) {
      expect(title).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;)/);
    }
  });
});

describe("llms.txt", () => {
  it("サイトの構造と主要ページを含む", async () => {
    const text = await llmsTxt().text();

    expect(text.startsWith("# AI PORT")).toBe(true);
    expect(text).toContain(aiPortUrl("/tools"));
    expect(text).toContain(aiPortUrl("/about"));

    for (const topic of topics) expect(text).toContain(aiPortUrl(`/topics/${topic.slug}`));
    for (const article of getArticles()) expect(text).toContain(article.title);
  });

  it("料金を載せていない方針を明記している（AIに誤って引用させない）", async () => {
    const text = await llmsTxt().text();
    expect(text).toContain("料金の金額は掲載していません");
    expect(text).toContain("レビュー点数・星の数・PV・会員数は扱っていません");
  });
});
