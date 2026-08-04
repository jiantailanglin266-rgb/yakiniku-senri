import { describe, expect, it } from "vitest";

import { getArticles } from "@/data/ai-port/articles";
import { aiRoles, jobBoards, schools } from "@/data/ai-port/careers";
import { diagnoses } from "@/data/ai-port/diagnosis";
import { aiEvents } from "@/data/ai-port/events";
import { siteFaqs } from "@/data/ai-port/faq";
import { vendors, googleNewsFeed, officialFeeds, vendorQuery } from "@/data/ai-port/feeds";
import { aiMainNav, aiTabNav } from "@/data/ai-port/navigation";
import { aiPortPath, aiPortUrl } from "@/data/ai-port/site";
import { findToolCategory, toolCategories, topics } from "@/data/ai-port/taxonomy";
import { findTool, tools } from "@/data/ai-port/tools";
import { adSlots, toolOutboundUrl } from "@/data/ai-port/ads";
import { youtubeChannels } from "@/data/ai-port/youtube";

/* ============================================================
   このリポジトリの固定要件（AGENTS.md §3 事実性）を、
   テストで機械的に守れるようにしています。
   ============================================================ */

describe("事実性のルール", () => {
  it("ツールデータに料金の金額を書かない", () => {
    // 「1,980円」「$20/month」のような金額表記が紛れ込んでいないこと。
    // 料金は変動が速く、古い数字は読者への実害になります。
    const pricePattern = /(¥|\$|円|ドル)\s?\d|(\d[\d,]*\s?(円|ドル|USD|JPY))|\/\s?(月|mo|month)/i;

    for (const tool of tools) {
      const text = [tool.summary, tool.bestFor, ...tool.strengths].join(" ");
      expect(text, `${tool.name} に金額らしき表記があります`).not.toMatch(pricePattern);
    }
  });

  it("ツールデータに評価点・星の数を持たせない", () => {
    for (const tool of tools) {
      // 実データのない AggregateRating / Review は出力できないため、
      // そもそもデータ側に点数のフィールドを作らない設計にしています。
      expect(tool).not.toHaveProperty("rating");
      expect(tool).not.toHaveProperty("score");
      expect(tool).not.toHaveProperty("reviewCount");
    }
  });

  it("未確認の項目は null で表現され、推測で埋められていない", () => {
    // null を許容する型であることを、実データ側でも確認します
    const hasUnknown = tools.some(
      (tool) =>
        tool.japaneseUi === null ||
        tool.api === null ||
        tool.mobileApp === null ||
        tool.team === null,
    );
    expect(hasUnknown).toBe(true);
  });

  it("イベントに日付を持たせない（季節の目安のみ）", () => {
    const datePattern = /\d{4}[-/年]\d{1,2}[-/月]\d{1,2}/;
    for (const event of aiEvents) {
      expect(event.season, `${event.name} に具体的な日付が入っています`).not.toMatch(datePattern);
      expect(event).not.toHaveProperty("startDate");
    }
  });

  it("初期状態で実在しない広告枠を持たない", () => {
    // ダミー広告の掲載は不当表示にあたるため、初期値は空です
    expect(adSlots).toEqual([]);
  });

  it("アフィリエイト未設定でも公式URLへ遷移する", () => {
    const outbound = toolOutboundUrl("chatgpt");
    expect(outbound.href).toBe(findTool("chatgpt")?.url);
    expect(outbound.sponsored).toBe(false);
  });
});

describe("AIツールのデータ", () => {
  it("slug が重複していない", () => {
    const slugs = tools.map((tool) => tool.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("すべてのカテゴリーが taxonomy に定義されている", () => {
    for (const tool of tools) {
      for (const categoryId of tool.categories) {
        expect(
          findToolCategory(categoryId),
          `${tool.slug}: 未定義のカテゴリー ${categoryId}`,
        ).toBeTruthy();
      }
    }
  });

  it("公式URLが https である", () => {
    for (const tool of tools) {
      expect(tool.url.startsWith("https://"), `${tool.slug}: ${tool.url}`).toBe(true);
    }
  });

  it("すべてのカテゴリーに最低1件のツールがある（空の一覧を作らない）", () => {
    for (const category of toolCategories) {
      const count = tools.filter((tool) => tool.categories.includes(category.id)).length;
      expect(count, `${category.name} に該当するツールがありません`).toBeGreaterThan(0);
    }
  });
});

describe("参照整合性", () => {
  it("診断が参照するツールがすべて存在する", () => {
    for (const diagnosis of diagnoses) {
      for (const result of diagnosis.results) {
        for (const slug of result.toolSlugs) {
          expect(
            findTool(slug),
            `${diagnosis.slug}/${result.id}: ${slug} が存在しません`,
          ).toBeTruthy();
        }
      }
    }
  });

  it("記事が参照するツールとトピックがすべて存在する", () => {
    const topicSlugs = new Set(topics.map((topic) => topic.slug));

    for (const article of getArticles()) {
      expect(topicSlugs.has(article.topic), `${article.slug}: トピック ${article.topic}`).toBe(
        true,
      );
      for (const slug of article.toolSlugs) {
        expect(findTool(slug), `${article.slug}: ツール ${slug}`).toBeTruthy();
      }
    }
  });

  it("職種ガイドが参照するツールがすべて存在する", () => {
    for (const role of aiRoles) {
      for (const slug of role.toolSlugs) {
        expect(findTool(slug), `${role.id}: ${slug}`).toBeTruthy();
      }
    }
  });

  it("トピックが参照するツールカテゴリーがすべて存在する", () => {
    for (const topic of topics) {
      for (const categoryId of topic.toolCategories) {
        expect(findToolCategory(categoryId), `${topic.slug}: ${categoryId}`).toBeTruthy();
      }
    }
  });

  it("FAQ のリンク先がすべて AI PORT 内のパスである", () => {
    for (const faq of siteFaqs) {
      if (!faq.href) continue;
      expect(faq.href.startsWith("/"), `${faq.id}: ${faq.href}`).toBe(true);
    }
  });
});

describe("診断データ", () => {
  it("すべての選択肢の加点先が、結果として定義された軸である", () => {
    for (const diagnosis of diagnoses) {
      const axes = new Set(diagnosis.results.map((result) => result.id));

      for (const question of diagnosis.questions) {
        for (const choice of question.choices) {
          for (const axis of Object.keys(choice.scores)) {
            expect(axes.has(axis), `${diagnosis.slug}/${question.id}/${choice.id}: ${axis}`).toBe(
              true,
            );
          }
        }
      }
    }
  });

  it("すべての結果に到達しうる（得点されない結果を作らない）", () => {
    for (const diagnosis of diagnoses) {
      const scored = new Set(
        diagnosis.questions.flatMap((question) =>
          question.choices.flatMap((choice) => Object.keys(choice.scores)),
        ),
      );

      for (const result of diagnosis.results) {
        expect(
          scored.has(result.id),
          `${diagnosis.slug}: ${result.id} に加点する選択肢がありません`,
        ).toBe(true);
      }
    }
  });

  it("質問の選択肢IDが質問内で重複していない", () => {
    for (const diagnosis of diagnoses) {
      for (const question of diagnosis.questions) {
        const ids = question.choices.map((choice) => choice.id);
        expect(new Set(ids).size, `${diagnosis.slug}/${question.id}`).toBe(ids.length);
      }
    }
  });
});

describe("フィード設定", () => {
  it("Googleニュースの検索RSSが正しい形式で組み立てられる", () => {
    const url = googleNewsFeed('"OpenAI" OR "ChatGPT"');
    expect(url.startsWith("https://news.google.com/rss/search?q=")).toBe(true);
    expect(url).toContain("hl=ja&gl=JP&ceid=JP:ja");
    // クエリはURLエンコードされていること
    expect(url).not.toContain(" ");
  });

  it("ベンダーの検索クエリが OR で束ねられる", () => {
    const vendor = vendors.find((entry) => entry.id === "openai");
    expect(vendor).toBeTruthy();
    expect(vendorQuery(vendor!)).toBe('"OpenAI" OR "ChatGPT"');
  });

  it("ベンダーIDが重複していない", () => {
    const ids = vendors.map((vendor) => vendor.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("フィードURLがすべて https である", () => {
    for (const feed of officialFeeds) {
      expect(feed.url.startsWith("https://"), feed.id).toBe(true);
    }
  });
});

describe("外部リンク", () => {
  it("求人サイト・スクール・YouTubeチャンネルのURLが https である", () => {
    for (const board of jobBoards) {
      expect(board.url.startsWith("https://"), board.id).toBe(true);
    }
    for (const school of schools) {
      expect(school.url.startsWith("https://"), school.id).toBe(true);
    }
    for (const event of aiEvents) {
      expect(event.url.startsWith("https://"), event.id).toBe(true);
    }
    for (const channel of youtubeChannels) {
      expect(channel.handle).not.toContain("@");
    }
  });
});

describe("URLの組み立て", () => {
  it("aiPortPath が /ai-port から始まる", () => {
    expect(aiPortPath("/")).toBe("/ai-port");
    expect(aiPortPath("/tools")).toBe("/ai-port/tools");
  });

  it("aiPortUrl が絶対URLを返し、末尾スラッシュが重複しない", () => {
    expect(aiPortUrl("/")).toMatch(/^https?:\/\/.+\/ai-port$/);
    expect(aiPortUrl("/tools")).toMatch(/\/ai-port\/tools$/);
    expect(aiPortUrl("/tools/")).toMatch(/\/ai-port\/tools$/);
  });

  it("ナビゲーションのリンクがすべて AI PORT 配下を指す", () => {
    for (const item of [...aiMainNav, ...aiTabNav]) {
      expect(item.href.startsWith("/ai-port"), item.label).toBe(true);
    }
  });
});
