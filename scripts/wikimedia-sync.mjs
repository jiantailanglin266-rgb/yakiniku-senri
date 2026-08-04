#!/usr/bin/env node
/**
 * Wikimedia Commons からの画像メタデータ取得。
 *
 * ■ このスクリプトがしないこと
 *   - Wikipedia の記事本文に出ている画像を、そのまま採用すること
 *     （記事の画像はフェアユースや各言語版ローカルアップロードを含みます。
 *       Commons に登録されたファイルだけを対象にします）
 *   - ライセンスが読み取れない画像を公開扱いにすること
 *   - 取得できた項目から、取得できなかった項目を推測すること
 *
 * ■ 取得と判定は別
 *   取得結果は `metadataRaw` にそのまま残し、
 *   掲載可否は `evaluateEligibility()` が別に判定します。
 *   API が 200 を返したことは、掲載してよい根拠になりません。
 *
 * ■ 既定は「書き込まない」
 *   --write を付けたときだけ src/media/data/assets.generated.json を更新します。
 *   既存の画像を削除することはありません（追記と更新のみ）。
 *
 * 使い方:
 *   node scripts/wikimedia-sync.mjs --dry-run
 *   node scripts/wikimedia-sync.mjs --write
 *   node scripts/wikimedia-sync.mjs --write --only=cardport:guide:points-basics
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT =
  process.env.MEDIA_SYNC_USER_AGENT ??
  "CardPortMediaSync/1.0 (https://github.com/; contact via repository issues)";

/** 1件ずつ、間隔を空けて取得します（Wikimedia の負荷にならないように） */
const REQUEST_INTERVAL_MS = Number(process.env.MEDIA_SYNC_INTERVAL_MS ?? 1200);

const OUTPUT_PATH = path.join(process.cwd(), "src/media/data/assets.generated.json");
const REQUEST_PATH = path.join(process.cwd(), "src/media/data/requests.json");

/* ------------------------------------------------------------------ */
/* 引数                                                                */
/* ------------------------------------------------------------------ */
const args = process.argv.slice(2);
const shouldWrite = args.includes("--write");
const only = args.find((arg) => arg.startsWith("--only="))?.slice("--only=".length) ?? null;

/* ------------------------------------------------------------------ */
/* HTTP                                                                */
/* ------------------------------------------------------------------ */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText} — ${url}`);
  }
  return response.json();
}

/* ------------------------------------------------------------------ */
/* Commons の検索・詳細取得                                            */
/* ------------------------------------------------------------------ */

/**
 * Commons の全文検索。
 * `srnamespace=6` はファイル名前空間で、Commons に登録されたファイルだけが対象です。
 */
async function searchCommons(query, limit) {
  const url = new URL(COMMONS_API);
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  url.searchParams.set("list", "search");
  url.searchParams.set("srsearch", `${query} filetype:bitmap`);
  url.searchParams.set("srnamespace", "6");
  url.searchParams.set("srlimit", String(limit));

  const json = await fetchJson(url);
  return (json?.query?.search ?? []).map((hit) => hit.title);
}

/**
 * ファイルの詳細（サイズ・URL・extmetadata）。
 *
 * extmetadata は「Commons のページに書かれている内容」であって、
 * 常に正確・完全とは限りません。欠けている項目は欠けたまま扱います。
 */
async function fetchImageInfo(titles) {
  const url = new URL(COMMONS_API);
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  url.searchParams.set("prop", "imageinfo|categories");
  url.searchParams.set("titles", titles.join("|"));
  url.searchParams.set("iiprop", "url|size|mime|extmetadata|user");
  url.searchParams.set("cllimit", "50");

  const json = await fetchJson(url);
  return Object.values(json?.query?.pages ?? {});
}

/* ------------------------------------------------------------------ */
/* 正規化（判定はしません）                                            */
/* ------------------------------------------------------------------ */

/** extmetadata の値は HTML を含みます。表示前にタグを落とします */
function plainText(value) {
  if (typeof value !== "string") return null;
  const text = value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 0 ? text : null;
}

/** extmetadata の HTML から、最初のリンク先を作者URLとして拾います */
function firstHref(value) {
  if (typeof value !== "string") return null;
  const match = value.match(/href="([^"]+)"/);
  if (!match) return null;
  const href = match[1];
  if (href.startsWith("//")) return `https:${href}`;
  if (href.startsWith("/")) return `https://commons.wikimedia.org${href}`;
  return href.startsWith("http") ? href : null;
}

function meta(extmetadata, key) {
  return extmetadata?.[key]?.value ?? null;
}

/**
 * API のレスポンスを、判定前の素の形へ整えます。
 * ここでは「掲載してよいか」を一切決めません。
 */
function toRawAsset(page, request) {
  const info = page?.imageinfo?.[0];
  if (!info) return null;
  const ext = info.extmetadata ?? {};

  const width = Number(info.width ?? 0);
  const height = Number(info.height ?? 0);

  return {
    id: `wm-${String(page.title)
      .replace(/^File:/, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .toLowerCase()
      .replace(/^-|-$/g, "")
      .slice(0, 60)}`,
    commonsPageId: typeof page.pageid === "number" ? page.pageid : null,
    wikidataEntityId: request.wikidataEntityId ?? null,

    fileName: String(page.title).replace(/^File:/, ""),
    title: String(page.title),
    description: plainText(meta(ext, "ImageDescription")),

    originalUrl: info.url ?? "",
    thumbnailUrl: info.thumburl ?? null,
    commonsPageUrl: info.descriptionurl ?? "",
    localPath: null,

    mimeType: info.mime ?? "",
    width,
    height,
    aspectRatio: height > 0 ? width / height : 0,

    // 取得できなければ null。ここで推測しません
    authorName: plainText(meta(ext, "Artist")),
    authorUrl: firstHref(meta(ext, "Artist")),
    sourceName: plainText(meta(ext, "Credit")),
    sourceUrl: firstHref(meta(ext, "Credit")),

    /** 判定前の生のライセンス表記。複数返ることがあります */
    rawLicenses: [
      meta(ext, "LicenseShortName"),
      meta(ext, "License"),
      meta(ext, "UsageTerms"),
    ].filter(Boolean),
    licenseUrl: plainText(meta(ext, "LicenseUrl")),
    attributionText: plainText(meta(ext, "Attribution")),
    copyrightStatus: plainText(meta(ext, "Copyrighted")),
    publicDomainRationale: plainText(meta(ext, "PublicDomain")),

    categories: (page.categories ?? []).map((category) =>
      String(category.title).replace(/^Category:/, ""),
    ),

    retrievedAt: new Date().toISOString(),
    metadataRaw: ext,
  };
}

/* ------------------------------------------------------------------ */
/* 判定（src/media のロジックと同じ規則を、依存なしで再実装）          */
/* ------------------------------------------------------------------ */
/*
 * このスクリプトは .mjs で、TypeScript を直接 import できません。
 * そのため判定は「保守的な側」だけをここに置き、最終的な承認は
 * 管理画面（人の目）に委ねます。ここで approved を付けることはしません。
 */

/** 明らかに掲載できないライセンス表記。1つでも当たれば候補から外します */
const BLOCKING_PATTERNS = [
  /non-?commercial/i,
  /\bnc\b/i,
  /no-?deriv/i,
  /\bnd\b/i,
  /fair\s*use/i,
  /all\s*rights\s*reserved/i,
  /non-?free/i,
];

/** 機械的に読み取れるライセンス表記 */
const READABLE_PATTERNS = [
  /^cc[\s_-]?0/i,
  /^public\s*domain/i,
  /^pd[-\s]/i,
  /^cc\s*by(-sa)?\s*\d\.\d$/i,
];

function classify(raw) {
  const notes = [];
  const licenses = raw.rawLicenses ?? [];

  if (licenses.length === 0) {
    notes.push("ライセンス表記を取得できませんでした。推測せず保留します。");
    return { status: "license_unknown", notes };
  }

  if (licenses.some((value) => BLOCKING_PATTERNS.some((pattern) => pattern.test(value)))) {
    notes.push(`掲載できないライセンス表記が含まれています: ${licenses.join(" / ")}`);
    return { status: "rejected", notes };
  }

  if (!licenses.some((value) => READABLE_PATTERNS.some((pattern) => pattern.test(value.trim())))) {
    notes.push(`ライセンス表記を機械的に特定できませんでした: ${licenses.join(" / ")}`);
    return { status: "license_unknown", notes };
  }

  if (!raw.commonsPageUrl) {
    notes.push("Commons のファイルページURLを取得できませんでした。");
    return { status: "needs_review", notes };
  }

  if (!raw.authorName) {
    notes.push("作者情報を取得できませんでした。作者表示が必要か人が確認してください。");
    return { status: "needs_review", notes };
  }

  // ここまで通っても approved にはしません。
  // 肖像・商標・建築著作物などライセンス外の権利は、人が確認する必要があります。
  notes.push(
    "ライセンス表記は読み取れました。掲載可否（被写体の権利を含む）は管理画面で確認してください。",
  );
  return { status: "needs_review", notes };
}

/* ------------------------------------------------------------------ */
/* 実行                                                                */
/* ------------------------------------------------------------------ */
async function loadRequests() {
  try {
    const text = await readFile(REQUEST_PATH, "utf8");
    return JSON.parse(text);
  } catch {
    console.error(
      `取得したい画像の一覧が見つかりません: ${path.relative(process.cwd(), REQUEST_PATH)}`,
    );
    console.error(
      '書式: [{ "pageKey": "cardport:guide:points-basics", "slot": "inline", ' +
        '"query": "contactless payment terminal", "wikidataEntityId": null }]',
    );
    return [];
  }
}

async function loadExisting() {
  try {
    return JSON.parse(await readFile(OUTPUT_PATH, "utf8"));
  } catch {
    return { assets: [], generatedAt: null };
  }
}

async function main() {
  const requests = await loadRequests();
  const targets = only ? requests.filter((request) => request.pageKey === only) : requests;

  if (targets.length === 0) {
    console.log("対象がありません。");
    return;
  }

  const existing = await loadExisting();
  // 既存を消しません。同じIDが来たら更新、来なければそのまま残します
  const byId = new Map(existing.assets.map((asset) => [asset.id, asset]));

  const summary = { fetched: 0, skipped: 0, byStatus: {} };

  for (const request of targets) {
    console.log(`\n▸ ${request.pageKey} (${request.slot}) — "${request.query}"`);

    let titles = [];
    try {
      titles = await searchCommons(request.query, request.limit ?? 5);
    } catch (error) {
      console.error(`  検索に失敗しました: ${error.message}`);
      continue;
    }
    await sleep(REQUEST_INTERVAL_MS);

    if (titles.length === 0) {
      console.log("  候補が見つかりませんでした（フォールバック装飾のままになります）");
      continue;
    }

    let pages = [];
    try {
      pages = await fetchImageInfo(titles);
    } catch (error) {
      console.error(`  詳細の取得に失敗しました: ${error.message}`);
      continue;
    }
    await sleep(REQUEST_INTERVAL_MS);

    for (const page of pages) {
      const raw = toRawAsset(page, request);
      if (!raw) {
        summary.skipped += 1;
        continue;
      }

      const { status, notes } = classify(raw);
      summary.fetched += 1;
      summary.byStatus[status] = (summary.byStatus[status] ?? 0) + 1;

      const previous = byId.get(raw.id);
      byId.set(raw.id, {
        ...raw,
        // 一度人が承認した画像の状態は、再取得で巻き戻しません
        verificationStatus: previous?.verificationStatus === "approved" ? "approved" : status,
        verificationNotes: notes,
        verifiedAt: previous?.verifiedAt ?? null,
        rightsRisks: previous?.rightsRisks ?? [],
        usageStatus: previous?.usageStatus ?? "unused",
        objectPosition: previous?.objectPosition ?? "center",
        isModified: previous?.isModified ?? false,
        modificationDescription: previous?.modificationDescription ?? null,
        requestedFor: [{ pageKey: request.pageKey, slot: request.slot }],
      });

      console.log(`  - ${raw.fileName} → ${status}`);
      for (const note of notes) console.log(`      ${note}`);
    }
  }

  console.log("\n=== 集計 ===");
  console.log(`取得: ${summary.fetched} 件 / スキップ: ${summary.skipped} 件`);
  for (const [status, count] of Object.entries(summary.byStatus)) {
    console.log(`  ${status}: ${count}`);
  }
  console.log("\n※ このスクリプトは approved を付けません。掲載は管理画面で人が承認してください。");

  if (!shouldWrite) {
    console.log("\n--write が指定されていないため、ファイルは更新していません。");
    return;
  }

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(
    OUTPUT_PATH,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), assets: [...byId.values()] }, null, 2)}\n`,
    "utf8",
  );
  console.log(`\n更新しました: ${path.relative(process.cwd(), OUTPUT_PATH)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
