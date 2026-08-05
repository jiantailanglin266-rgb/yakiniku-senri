/**
 * AI PORT — サイト内検索インデックス。
 *
 * 検索ページ（/ai-port/search）、コマンドパレット（⌘K）、
 * AIチャットの根拠検索（RAG）が、すべてこの同じインデックスを使います。
 *
 * ■ なぜ全文検索エンジンを使わないのか
 *   対象は数百件のサイト内コンテンツです。この規模なら、
 *   メモリ上のスコアリングのほうが速く、外部依存もインフラも増えません。
 *   件数が数万件を超えたら、この関数の中身だけを差し替えてください。
 *
 * ■ 日本語の扱い
 *   日本語は空白で区切られません。単語分割は行わず、
 *   「2文字ずつのn-gram」と「元の語の部分一致」を併用しています。
 *   形態素解析を入れずに、実用的な精度を出すための割り切りです。
 */

import { getArticles } from "@/data/ai-port/articles";
import { aiRoles, jobBoards, schools } from "@/data/ai-port/careers";
import { diagnoses } from "@/data/ai-port/diagnosis";
import { aiEvents } from "@/data/ai-port/events";
import { siteFaqs } from "@/data/ai-port/faq";
import { vendors } from "@/data/ai-port/feeds";
import { aiPortPath } from "@/data/ai-port/site";
import { topics } from "@/data/ai-port/taxonomy";
import { pricingLabel, tools } from "@/data/ai-port/tools";

export type SearchKind = "tool" | "article" | "topic" | "diagnosis" | "faq" | "event" | "career";

export type SearchDoc = {
  id: string;
  kind: SearchKind;
  title: string;
  /** 一覧に出す説明 */
  description: string;
  href: string;
  /** 検索対象の本文（画面に出ている内容だけを入れます） */
  body: string;
  /** 追加の一致語（表記ゆれ・英語名など） */
  keywords: string[];
};

export const searchKindLabel: Record<SearchKind, string> = {
  tool: "AIツール",
  article: "解説記事",
  topic: "トピック",
  diagnosis: "AI診断",
  faq: "よくある質問",
  event: "イベント",
  career: "求人・学習",
};

/** インデックスは静的データから作るので、1度だけ組み立てます。 */
let cachedIndex: SearchDoc[] | null = null;

export function getSearchIndex(): SearchDoc[] {
  if (cachedIndex) return cachedIndex;

  const docs: SearchDoc[] = [];

  for (const tool of tools) {
    docs.push({
      id: `tool:${tool.slug}`,
      kind: "tool",
      title: tool.name,
      description: tool.summary,
      href: aiPortPath(`/tools/${tool.slug}`),
      body: [tool.summary, tool.bestFor, ...tool.strengths, pricingLabel[tool.pricing]].join(" "),
      keywords: [tool.maker, tool.slug, ...tool.categories],
    });
  }

  for (const article of getArticles()) {
    docs.push({
      id: `article:${article.slug}`,
      kind: "article",
      title: article.title,
      description: article.description,
      href: aiPortPath(`/guides/${article.slug}`),
      body: [
        article.lead,
        ...article.keyPoints,
        ...article.sections.flatMap((section) => [
          section.heading,
          ...section.paragraphs,
          ...(section.list ?? []),
          ...(section.steps ?? []).flatMap((step) => [step.name, step.text]),
        ]),
        ...article.faq.flatMap((entry) => [entry.q, entry.a]),
      ].join(" "),
      keywords: [article.topic],
    });
  }

  for (const topic of topics) {
    docs.push({
      id: `topic:${topic.slug}`,
      kind: "topic",
      title: topic.name,
      description: topic.summary,
      href: aiPortPath(`/topics/${topic.slug}`),
      body: [topic.summary, ...topic.questions].join(" "),
      keywords: [topic.nameEn, ...topic.queries],
    });
  }

  for (const diagnosis of diagnoses) {
    docs.push({
      id: `diagnosis:${diagnosis.slug}`,
      kind: "diagnosis",
      title: diagnosis.title,
      description: diagnosis.lead,
      href: aiPortPath(`/diagnosis/${diagnosis.slug}`),
      body: [
        diagnosis.description,
        ...diagnosis.questions.map((question) => question.text),
        ...diagnosis.results.flatMap((result) => [result.title, result.catch, result.description]),
      ].join(" "),
      keywords: ["診断", "チェック"],
    });
  }

  for (const faq of siteFaqs) {
    docs.push({
      id: `faq:${faq.id}`,
      kind: "faq",
      title: faq.q,
      description: faq.a,
      href: faq.href ? aiPortPath(faq.href) : aiPortPath("/#faq"),
      body: faq.a,
      keywords: ["FAQ", "よくある質問"],
    });
  }

  for (const event of aiEvents) {
    docs.push({
      id: `event:${event.id}`,
      kind: "event",
      title: event.name,
      description: `${event.season}・${event.summary}`,
      href: aiPortPath("/events"),
      body: [event.summary, event.organizer, event.region, event.season].join(" "),
      keywords: ["イベント", "カンファレンス"],
    });
  }

  for (const role of aiRoles) {
    docs.push({
      id: `career:${role.id}`,
      kind: "career",
      title: role.name,
      description: role.summary,
      href: aiPortPath("/jobs"),
      body: [role.summary, role.entryPath, ...role.requirements].join(" "),
      keywords: ["求人", "転職", "副業"],
    });
  }

  for (const board of jobBoards) {
    docs.push({
      id: `career:board:${board.id}`,
      kind: "career",
      title: board.name,
      description: board.focus,
      href: aiPortPath("/jobs"),
      body: board.focus,
      keywords: ["求人サイト", "転職"],
    });
  }

  for (const school of schools) {
    docs.push({
      id: `career:school:${school.id}`,
      kind: "career",
      title: school.name,
      description: school.summary,
      href: aiPortPath("/schools"),
      body: [school.summary, school.target, school.provider].join(" "),
      keywords: ["スクール", "学習", "講座"],
    });
  }

  for (const vendor of vendors) {
    docs.push({
      id: `topic:vendor:${vendor.id}`,
      kind: "topic",
      title: `${vendor.name}のニュース`,
      description: `${vendor.name}に関する最新ニュースをまとめて表示します。`,
      href: aiPortPath(`/news/${vendor.id}`),
      body: vendor.terms.join(" "),
      keywords: vendor.terms,
    });
  }

  cachedIndex = docs;
  return docs;
}

/* ------------------------------------------------------------
   スコアリング
   ------------------------------------------------------------ */

function normalize(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFKC")
      // 記号は区切りとして扱います
      .replace(/[\p{P}\p{S}]/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/** 日本語を含む語を2文字のn-gramに割ります。英数字は語のまま残します。 */
function tokenize(value: string): string[] {
  const normalized = normalize(value);
  if (!normalized) return [];

  const tokens = new Set<string>();

  for (const word of normalized.split(" ")) {
    if (!word) continue;
    tokens.add(word);

    // 日本語（ひらがな・カタカナ・漢字）を含むならn-gramも足します
    if (/[぀-ヿ一-鿿]/.test(word) && word.length > 1) {
      for (let index = 0; index < word.length - 1; index += 1) {
        tokens.add(word.slice(index, index + 2));
      }
    }
  }

  return [...tokens];
}

export type SearchHit = { doc: SearchDoc; score: number };

/**
 * 検索します。
 * 重みは「タイトル > キーワード > 説明 > 本文」の順です。
 */
export function searchDocs(query: string, limit = 20): SearchHit[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const hits: SearchHit[] = [];

  for (const doc of getSearchIndex()) {
    const title = normalize(doc.title);
    const keywords = normalize(doc.keywords.join(" "));
    const description = normalize(doc.description);
    const body = normalize(doc.body);

    let score = 0;
    for (const token of tokens) {
      if (title.includes(token)) score += 12;
      if (keywords.includes(token)) score += 7;
      if (description.includes(token)) score += 4;
      if (body.includes(token)) score += 1;
    }

    // 検索語がそのままタイトルに入っていれば大きく加点します
    const whole = normalize(query);
    if (whole && title.includes(whole)) {
      score += 30;
      // タイトルが検索語そのものなら、さらに上に出します。
      // 「Claude」で探した人が求めているのは、まずツールそのものの説明であって、
      // 「Claudeのニュース」のような派生ページではないためです。
      if (title === whole) score += 40;
    }

    if (score > 0) hits.push({ doc, score });
  }

  return hits
    .sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title))
    .slice(0, limit);
}
