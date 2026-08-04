import { describe, expect, it } from "vitest";

import { decodeEntities, parseFeed, splitGoogleNewsTitle, stripTags } from "@/lib/ai-port/rss";
import {
  dedupe,
  relativeTime,
  sortByDate,
  countVendorMentions,
  type NewsItem,
} from "@/lib/ai-port/news";
import { MAX_SCORE, SCORE_WEIGHTS, rankTools, scoreTool } from "@/lib/ai-port/ranking";
import {
  decodeAnswers,
  encodeAnswers,
  isComplete,
  scoreDiagnosis,
  tallyScores,
} from "@/lib/ai-port/diagnosis";
import { getSearchIndex, searchDocs } from "@/lib/ai-port/search";
import { buildFallbackAnswer, buildGrounding, buildSystemPrompt } from "@/lib/ai-port/rag";
import { diagnoses, findDiagnosis } from "@/data/ai-port/diagnosis";
import { findTool, tools } from "@/data/ai-port/tools";

/* ============================================================
   RSS パーサー
   ============================================================ */

const RSS_SAMPLE = `<?xml version="1.0"?>
<rss version="2.0"><channel>
  <title>Sample</title>
  <item>
    <title><![CDATA[新モデルを発表 - Example News]]></title>
    <link>https://example.com/a</link>
    <pubDate>Mon, 03 Aug 2026 09:00:00 GMT</pubDate>
    <description>&lt;p&gt;本文の&lt;b&gt;一部&lt;/b&gt;です&lt;/p&gt;</description>
    <source url="https://example.com">Example News</source>
  </item>
  <item>
    <title>日付が壊れている記事</title>
    <link>https://example.com/b</link>
    <pubDate>not-a-date</pubDate>
  </item>
  <item>
    <title>リンクが無い記事</title>
    <pubDate>Mon, 03 Aug 2026 10:00:00 GMT</pubDate>
  </item>
</channel></rss>`;

const ATOM_SAMPLE = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <entry>
    <title>Atom の記事</title>
    <link rel="alternate" href="https://www.youtube.com/watch?v=abc123"/>
    <published>2026-08-01T12:00:00+00:00</published>
    <media:group>
      <media:thumbnail url="https://i.ytimg.com/vi/abc123/hqdefault.jpg"/>
    </media:group>
  </entry>
</feed>`;

describe("RSS / Atom パーサー", () => {
  it("RSS 2.0 を読み込める", () => {
    const items = parseFeed(RSS_SAMPLE);
    expect(items).toHaveLength(1); // 日付が壊れた記事とリンクが無い記事は捨てる

    const [item] = items;
    expect(item.title).toBe("新モデルを発表 - Example News");
    expect(item.link).toBe("https://example.com/a");
    expect(item.source).toBe("Example News");
    // description の HTML タグは除去され、実体参照は戻る
    expect(item.summary).toBe("本文の 一部 です");
    expect(new Date(item.isoDate).getUTCFullYear()).toBe(2026);
  });

  it("Atom を読み込め、サムネイルを拾える", () => {
    const [item] = parseFeed(ATOM_SAMPLE);
    expect(item.title).toBe("Atom の記事");
    expect(item.link).toContain("watch?v=abc123");
    expect(item.image).toContain("i.ytimg.com");
  });

  it("壊れた入力でも例外を投げない", () => {
    expect(parseFeed("")).toEqual([]);
    expect(parseFeed("<html>not a feed</html>")).toEqual([]);
    expect(parseFeed("<rss><channel><item><title>x</title>")).toEqual([]);
  });

  it("実体参照を戻す", () => {
    expect(decodeEntities("A &amp; B &lt;c&gt; &#39;d&#39; &#x41;")).toBe("A & B <c> 'd' A");
  });

  it("script / style の中身ごとタグを落とす", () => {
    expect(stripTags("<script>alert(1)</script>本文<style>a{}</style>")).toBe("本文");
  });

  it("Googleニュースの見出しから媒体名の接尾辞を取り除く", () => {
    expect(splitGoogleNewsTitle("新モデルを発表 - Example News", "Example News")).toBe(
      "新モデルを発表",
    );
    // 媒体名が不明なときはそのまま
    expect(splitGoogleNewsTitle("新モデルを発表 - Example News")).toBe(
      "新モデルを発表 - Example News",
    );
  });
});

/* ============================================================
   ニュースの整形
   ============================================================ */

function newsItem(overrides: Partial<NewsItem>): NewsItem {
  return {
    title: "見出し",
    link: "https://example.com/1",
    isoDate: "2026-08-01T00:00:00.000Z",
    summary: "",
    feedId: "test",
    vendorIds: [],
    ...overrides,
  };
}

describe("ニュースの整形", () => {
  it("見出しが実質同じ記事をまとめる", () => {
    const items = [
      newsItem({
        title: "OpenAI、新モデルを発表。",
        link: "https://a.example/1",
        vendorIds: ["openai"],
      }),
      newsItem({
        title: "OpenAI 新モデルを発表",
        link: "https://b.example/2",
        vendorIds: ["openai", "google"],
      }),
      newsItem({ title: "まったく別の記事", link: "https://c.example/3" }),
    ];

    const result = dedupe(items);
    expect(result).toHaveLength(2);
    // まとめる際、ベンダー情報は失わない
    const merged = result.find((item) => item.title.startsWith("OpenAI"));
    expect(merged?.vendorIds.sort()).toEqual(["google", "openai"]);
  });

  it("新しい順に並べる", () => {
    const sorted = sortByDate([
      newsItem({ isoDate: "2026-01-01T00:00:00.000Z", link: "https://a/1" }),
      newsItem({ isoDate: "2026-08-01T00:00:00.000Z", link: "https://a/2" }),
    ]);
    expect(sorted[0].isoDate).toContain("2026-08");
  });

  it("ベンダーごとの言及数を数える", () => {
    const counts = countVendorMentions([
      newsItem({ vendorIds: ["openai"], link: "https://a/1" }),
      newsItem({ vendorIds: ["openai", "google"], link: "https://a/2" }),
    ]);
    expect(counts).toEqual({ openai: 2, google: 1 });
  });

  it("相対時刻を日本語で返す", () => {
    const now = Date.parse("2026-08-04T12:00:00.000Z");
    expect(relativeTime("2026-08-04T11:59:30.000Z", now)).toBe("たった今");
    expect(relativeTime("2026-08-04T11:30:00.000Z", now)).toBe("30分前");
    expect(relativeTime("2026-08-04T09:00:00.000Z", now)).toBe("3時間前");
    expect(relativeTime("2026-08-01T12:00:00.000Z", now)).toBe("3日前");
    expect(relativeTime("壊れた日付", now)).toBe("");
  });
});

/* ============================================================
   ランキング
   ============================================================ */

describe("注目度スコア", () => {
  it("アフィリエイト設定はスコアに影響しない", () => {
    // 計算式が参照しているのは、ツールの属性とニュース言及数だけです
    const tool = findTool("chatgpt")!;
    const before = scoreTool(tool, {}).score;

    process.env.AI_PORT_AFFILIATE_CHATGPT = "https://example.com/aff";
    const after = scoreTool(tool, {}).score;
    delete process.env.AI_PORT_AFFILIATE_CHATGPT;

    expect(after).toBe(before);
  });

  it("ニュース言及が増えるとスコアが上がり、上限で頭打ちになる", () => {
    const tool = findTool("chatgpt")!;
    const none = scoreTool(tool, {}).score;
    const some = scoreTool(tool, { openai: 3 }).score;
    const many = scoreTool(tool, { openai: 999 }).score;

    expect(some).toBeGreaterThan(none);
    expect(many - none).toBe(SCORE_WEIGHTS.mentionCap);
  });

  it("内訳の合計がスコアと一致する", () => {
    const scored = scoreTool(findTool("claude")!, { anthropic: 2 });
    const total = scored.breakdown.reduce((sum, row) => sum + row.value, 0);
    expect(total).toBe(scored.score);
  });

  it("どのツールも満点を超えない", () => {
    for (const scored of rankTools(tools, { openai: 99, google: 99, anthropic: 99 })) {
      expect(scored.score).toBeLessThanOrEqual(MAX_SCORE);
    }
  });

  it("同点でも並び順が毎回同じになる（乱数を使わない）", () => {
    const first = rankTools(tools, {}).map((entry) => entry.tool.slug);
    const second = rankTools(tools, {}).map((entry) => entry.tool.slug);
    expect(first).toEqual(second);
  });
});

/* ============================================================
   AI診断の採点
   ============================================================ */

describe("AI診断の採点", () => {
  const diagnosis = findDiagnosis("tool-match")!;

  it("選んだ選択肢の加点が集計される", () => {
    const scores = tallyScores(diagnosis, { q1: "d", q5: "d" });
    // q1-d と q5-d はどちらも coding に +3
    expect(scores.coding).toBe(6);
  });

  it("同じ回答なら必ず同じ結果になる", () => {
    const answers = { q1: "a", q2: "a", q3: "b", q4: "b", q5: "a", q6: "b" };
    const first = scoreDiagnosis(diagnosis, answers);
    const second = scoreDiagnosis(diagnosis, answers);
    expect(first.result.id).toBe(second.result.id);
    expect(first.confidence).toBe(second.confidence);
  });

  it("未回答があっても落ちず、confidence が 0〜1 に収まる", () => {
    const scored = scoreDiagnosis(diagnosis, {});
    expect(scored.result).toBeTruthy();
    expect(scored.confidence).toBeGreaterThanOrEqual(0);
    expect(scored.confidence).toBeLessThanOrEqual(1);
  });

  it("全問回答したかを判定できる", () => {
    expect(isComplete(diagnosis, {})).toBe(false);
    const full = Object.fromEntries(diagnosis.questions.map((question) => [question.id, "a"]));
    expect(isComplete(diagnosis, full)).toBe(true);
  });

  it("回答を文字列へ往復できる", () => {
    const answers = { q1: "b", q3: "a" };
    const encoded = encodeAnswers(diagnosis, answers);
    expect(encoded).toHaveLength(diagnosis.questions.length);
    expect(decodeAnswers(diagnosis, encoded)).toEqual(answers);
  });

  it("存在しない選択肢IDは復元時に無視される", () => {
    expect(decodeAnswers(diagnosis, "zzzzzz")).toEqual({});
  });

  it("すべての診断で、代表的な回答から結果が出る", () => {
    for (const entry of diagnoses) {
      const answers = Object.fromEntries(
        entry.questions.map((question) => [question.id, question.choices[0].id]),
      );
      const scored = scoreDiagnosis(entry, answers);
      expect(scored.result.actions.length, entry.slug).toBeGreaterThan(0);
    }
  });
});

/* ============================================================
   サイト内検索・RAG
   ============================================================ */

describe("サイト内検索", () => {
  it("インデックスにすべての種類が含まれる", () => {
    const kinds = new Set(getSearchIndex().map((doc) => doc.kind));
    expect(kinds).toContain("tool");
    expect(kinds).toContain("article");
    expect(kinds).toContain("topic");
    expect(kinds).toContain("diagnosis");
    expect(kinds).toContain("faq");
  });

  it("ツール名で該当ツールが最上位に来る", () => {
    const [top] = searchDocs("Claude");
    expect(top.doc.id).toBe("tool:claude");
  });

  it("日本語の部分一致でも見つかる（n-gram）", () => {
    const hits = searchDocs("画像生成");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((hit) => hit.doc.title.includes("AI画像") || hit.doc.kind === "tool")).toBe(
      true,
    );
  });

  it("空の検索語では何も返さない", () => {
    expect(searchDocs("")).toEqual([]);
    expect(searchDocs("   ")).toEqual([]);
  });

  it("該当しない語では空になる", () => {
    expect(searchDocs("ぬりかべこんにゃくばなな")).toEqual([]);
  });
});

describe("AIチャットの根拠づくり", () => {
  it("質問に関連する社内文書を根拠として集める", () => {
    const { docs, context } = buildGrounding("無料で使える画像生成AIは？");
    expect(docs.length).toBeGreaterThan(0);
    expect(context).toContain("URL:");
  });

  it("システムプロンプトが「根拠の外を答えない」と指示している", () => {
    const prompt = buildSystemPrompt("（根拠）");
    expect(prompt).toContain("だけを使って答えます");
    expect(prompt).toContain("料金の金額は答えません");
  });

  it("モデルが使えないときも、検索結果で回答を組み立てる", () => {
    const { docs } = buildGrounding("AIエージェント");
    const answer = buildFallbackAnswer("AIエージェント", docs);
    expect(answer).toContain("関連するページ");
    expect(answer).toContain("サイト内検索");
  });

  it("該当が無いときは、無いと正直に返す", () => {
    const answer = buildFallbackAnswer("該当なし", []);
    expect(answer).toContain("見つかりませんでした");
  });
});
