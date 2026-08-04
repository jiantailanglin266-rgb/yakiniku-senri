#!/usr/bin/env node
/**
 * 「どのページにどんな画像が要るか」の一覧を、記事データから組み立てます。
 *
 * ■ 手で書いた指示を優先します
 *   `src/media/data/requests.json` に人が書いた行は、そのまま残します。
 *   同じ pageKey + slot が自動生成側にもある場合、**手書きが勝ちます**。
 *   自動生成は「まだ指示が無い枠を埋める」ためのものです。
 *
 * ■ 画像を探さないページ
 *   規約・プライバシー・問い合わせ・検索・出典一覧・管理画面は対象外です。
 *   写真にできない話題だけの記事も対象外にします
 *   （無理に画像を当てると、関連の薄い装飾になります）。
 *
 * ■ 実行方法
 *   TypeScript のデータをそのまま読むため、型の除去を有効にして実行します。
 *     node --experimental-strip-types scripts/generate-media-requests.mjs
 *   npm run media:requests でも同じです。
 *
 * 出力: src/media/data/requests.generated.json
 */
import { readFile } from "node:fs/promises";
import { writeJsonFormatted } from "./lib/write-json.mjs";
import path from "node:path";
import process from "node:process";

import { deriveKeywords, isNonVisualOnly, wikipediaTitlesFor } from "./lib/media-keywords.mjs";

const ROOT = process.cwd();
const MANUAL_PATH = path.join(ROOT, "src/media/data/requests.json");
const OUTPUT_PATH = path.join(ROOT, "src/media/data/requests.generated.json");

const args = process.argv.slice(2);
const shouldWrite = args.includes("--write");

/* ------------------------------------------------------------------ */
/* 画像を探さないページ                                                */
/* ------------------------------------------------------------------ */
/**
 * 種別（pageKey の真ん中）で除外します。
 * 迷ったら除外側に倒します。載せない判断はいつでも取り消せますが、
 * 関連の薄い画像を載せた事実は取り消せません。
 */
const EXCLUDED_KINDS = new Set([
  "policy",
  "policies",
  "privacy",
  "terms",
  "contact",
  "search",
  "image-credits",
  "admin",
  "sitemap",
  "faq",
]);

/* ------------------------------------------------------------------ */
/* 出力の形                                                            */
/* ------------------------------------------------------------------ */
/**
 * @param {object} input
 * @returns {object} requests の1行
 */
function makeRequest(input) {
  const size = SLOT_SIZES[input.slot];
  return {
    pageKey: input.pageKey,
    slot: input.slot,
    // 先頭を主キーワード、残りを予備にします
    query: input.keywords[0],
    alternateQueries: input.keywords.slice(1),
    locale: "ja",
    limit: input.limit ?? 6,
    priority: input.priority ?? 0,
    contentType: input.contentType,
    minimumWidth: size.minWidth,
    minimumHeight: Math.round((size.minWidth * size.height) / size.width),
    aspectRatio: Number((size.width / size.height).toFixed(3)),
    /*
      対応する Wikipedia 記事があれば、その代表画像を優先して取ります
      （全文検索より狙った内容に当たります）。
      ここに書き出しておくことで、あとから「なぜこの画像が来たのか」を辿れます。
    */
    wikipediaTitles: wikipediaTitlesFor(input.keywords[0]),
    wikidataEntityId: null,
    generated: true,
  };
}

/** types.ts の slotSizes と同じ値。スクリプトからは TS を読まないので写しています */
const SLOT_SIZES = {
  hero: { width: 1920, height: 1080, minWidth: 1280 },
  card: { width: 1200, height: 675, minWidth: 800 },
  thumbnail: { width: 480, height: 270, minWidth: 400 },
  inline: { width: 1200, height: 800, minWidth: 640 },
  background: { width: 1920, height: 1080, minWidth: 1280 },
  ogp: { width: 1200, height: 630, minWidth: 1200 },
  avatar: { width: 800, height: 1000, minWidth: 400 },
  gallery: { width: 900, height: 600, minWidth: 600 },
  comparison: { width: 1200, height: 675, minWidth: 800 },
  related: { width: 480, height: 270, minWidth: 400 },
};

/** 日本語テキストを取り出します（LocalizedText は ja が必須） */
function ja(text) {
  if (!text) return "";
  return typeof text === "string" ? text : (text.ja ?? "");
}

function jaList(list) {
  if (!list) return [];
  return Array.isArray(list) ? list.map(ja) : (list.ja ?? []);
}

/* ------------------------------------------------------------------ */
/* 収集                                                                */
/* ------------------------------------------------------------------ */
async function collect() {
  const [news, guides, categories, web3, videos, cards, payments] = await Promise.all([
    import("../src/cardport/data/news.ts"),
    import("../src/cardport/data/guides.ts"),
    import("../src/cardport/data/categories.ts"),
    import("../src/cardport/data/web3.ts"),
    import("../src/cardport/data/videos.ts"),
    import("../src/cardport/data/cards.ts"),
    import("../src/cardport/data/payments.ts"),
  ]);

  const requests = [];
  const skipped = [];

  const push = (source, spec) => {
    const keywords = deriveKeywords(source);
    if (keywords.length === 0 || isNonVisualOnly(source)) {
      skipped.push({ pageKey: spec.pageKey, reason: "視覚的に表現できる語がありません" });
      return;
    }
    requests.push(makeRequest({ ...spec, keywords }));
  };

  // ニュース（比較記事・広告記事を含む）
  for (const article of news.news) {
    if (EXCLUDED_KINDS.has("news")) break;
    const source = {
      title: ja(article.title),
      lead: ja(article.summary),
      body: jaList(article.body),
      tags: article.tags,
      category: article.category,
      kind: article.kind,
    };
    // 比較記事は見出し脇にも1枚置けるようにします
    const slot = article.kind === "comparison" ? "comparison" : "thumbnail";
    push(source, {
      pageKey: `cardport:news:${article.slug}`,
      slot,
      contentType: `news:${article.kind}`,
      priority: 10,
    });
    push(source, {
      pageKey: `cardport:news:${article.slug}`,
      slot: "inline",
      contentType: `news:${article.kind}`,
      priority: 20,
    });
  }

  // ガイド記事
  for (const guide of guides.guides) {
    const source = {
      title: ja(guide.title),
      lead: ja(guide.lead),
      headings: guide.sections.map((section) => ja(section.heading)),
      body: guide.sections.flatMap((section) => jaList(section.body)),
      category: guide.level,
    };
    push(source, {
      pageKey: `cardport:guide:${guide.slug}`,
      slot: "inline",
      contentType: "guide",
      priority: 10,
    });
    push(source, {
      pageKey: `cardport:guide:${guide.slug}`,
      slot: "gallery",
      contentType: "guide",
      priority: 20,
      limit: 4,
    });
  }

  // カテゴリ
  for (const category of categories.cardCategories) {
    push(
      {
        title: ja(category.title),
        lead: ja(category.lead),
        category: category.id,
      },
      {
        pageKey: `cardport:category:${category.id}`,
        slot: "hero",
        contentType: "category",
        priority: 10,
      },
    );
  }

  // カード解説
  for (const card of cards.cards) {
    push(
      {
        title: ja(card.name),
        lead: ja(card.maxRateCondition),
        tags: card.categories,
        category: card.categories[0],
      },
      {
        pageKey: `cardport:card:${card.slug}`,
        slot: "inline",
        contentType: "card",
        priority: 10,
      },
    );
  }

  // Web3
  for (const service of web3.web3Services) {
    push(
      {
        title: ja(service.name),
        lead: ja(service.summary),
        tags: service.cryptoAssets,
        category: service.category,
      },
      {
        pageKey: `cardport:web3:${service.slug}`,
        slot: "inline",
        contentType: "web3",
        priority: 10,
      },
    );
  }

  // キャッシュレス決済
  for (const service of payments.paymentServices) {
    push(
      {
        title: ja(service.name),
        lead: ja(service.summary),
        category: "payment",
      },
      {
        pageKey: `cardport:payment:${service.id}`,
        slot: "inline",
        contentType: "payment",
        priority: 10,
      },
    );
  }

  // 動画ページ
  for (const video of videos.videos) {
    push(
      {
        title: ja(video.title),
        lead: ja(video.description),
        body: jaList(video.aiSummary),
        category: "payment",
      },
      {
        pageKey: `cardport:video:${video.slug}`,
        slot: "thumbnail",
        contentType: "video",
        priority: 10,
      },
    );
  }

  return { requests, skipped };
}

/* ------------------------------------------------------------------ */
/* 実行                                                                */
/* ------------------------------------------------------------------ */
async function loadManual() {
  try {
    const parsed = JSON.parse(await readFile(MANUAL_PATH, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function main() {
  const manual = await loadManual();
  const { requests, skipped } = await collect();

  // 手書きが勝ちます
  const manualKeys = new Set(manual.map((entry) => `${entry.pageKey}::${entry.slot}`));
  const generated = requests.filter((entry) => !manualKeys.has(`${entry.pageKey}::${entry.slot}`));

  const excluded = generated.filter((entry) => {
    const kind = entry.pageKey.split(":")[1];
    return EXCLUDED_KINDS.has(kind);
  });
  const kept = generated.filter((entry) => {
    const kind = entry.pageKey.split(":")[1];
    return !EXCLUDED_KINDS.has(kind);
  });

  // pageKey → slot の順で安定させます（差分が読めるように）
  kept.sort((a, b) => a.pageKey.localeCompare(b.pageKey) || a.slot.localeCompare(b.slot));

  console.log("=== 画像リクエストの生成 ===");
  console.log(`手書き: ${manual.length} 件（そのまま使用）`);
  console.log(`自動生成: ${kept.length} 件`);
  console.log(`除外（対象外ページ）: ${excluded.length} 件`);
  console.log(`除外（視覚化できない話題）: ${skipped.length} 件`);
  for (const entry of skipped.slice(0, 10)) {
    console.log(`  - ${entry.pageKey}: ${entry.reason}`);
  }
  if (skipped.length > 10) console.log(`  … ほか ${skipped.length - 10} 件`);

  if (!shouldWrite) {
    console.log("\n--write が指定されていないため、ファイルは更新していません。");
    return;
  }

  await writeJsonFormatted(OUTPUT_PATH, {
    generatedAt: new Date().toISOString(),
    note: "scripts/generate-media-requests.mjs が生成します。手で編集しないでください。手書きの指示は requests.json に書いてください。",
    requests: kept,
  });
  console.log(`\n更新しました: ${path.relative(ROOT, OUTPUT_PATH)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
