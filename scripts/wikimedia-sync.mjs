#!/usr/bin/env node
/**
 * Wikimedia Commons 画像の同期スクリプト。
 *
 * ■ このスクリプトがやらないこと（重要）
 *   ライセンスの解釈、利用可否の判定、追加権利の判定は**一切しません**。
 *   ここは「Commons API が返した値をそのまま書き写す」だけの層です。
 *   判定は src/wikimedia/licenses.ts と src/wikimedia/risks.ts が行い、
 *   その結果が src/wikimedia/data/assets.ts で組み立てられます。
 *
 *   取得できたこと（このスクリプト）と、使ってよいこと（TypeScript 側）を
 *   別のファイルに分けているのは、後者だけをテストで固定できるようにするためです。
 *
 * ■ 取得元
 *   Commons の File ページのみを見ます。
 *   Wikipedia 記事本文に表示されている画像を、そのまま拾うことはしません
 *   （記事に載っている＝自由に使える、ではないため）。
 *
 * ■ Wikimedia への作法
 *   - 連絡先の分かる User-Agent を送る（WIKIMEDIA_CONTACT_EMAIL）
 *   - maxlag=5 を付け、サーバー負荷が高いときは待つ
 *   - リクエストの間隔を空け、失敗時は指数バックオフ
 *   https://www.mediawiki.org/wiki/API:Etiquette
 *
 * 使い方:
 *   WIKIMEDIA_CONTACT_EMAIL=you@example.com npm run wikimedia:sync
 *   npm run wikimedia:sync -- --dry-run     出力ファイルを書き換えずに結果だけ表示
 *   npm run wikimedia:sync -- --target=/sports/tennis   1件だけ同期
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const TARGETS_PATH = resolve(root, "src/wikimedia/data/targets.json");
const OUTPUT_PATH = resolve(root, "src/wikimedia/data/assets.generated.json");

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const COMMONS_FILE_BASE = "https://commons.wikimedia.org/wiki/";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const only = args.find((arg) => arg.startsWith("--target="))?.slice("--target=".length);

/* ------------------------------------------------------------------
   HTTP
   ------------------------------------------------------------------ */

function userAgent() {
  const contact = process.env.WIKIMEDIA_CONTACT_EMAIL || "";
  const app = process.env.WIKIMEDIA_APP_NAME || "SportsPort";
  return contact ? `${app}/1.0 (${contact})` : `${app}/1.0`;
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

async function requestJson(url, { timeoutMs = 10_000, retries = 3 } = {}) {
  let lastError = "unknown";
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": userAgent(), Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      // maxlag に引っかかったときは待って再試行します
      if (payload?.error?.code === "maxlag") throw new Error("maxlag");
      return payload;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (attempt < retries) await sleep(2 ** attempt * 800);
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(`request failed (${lastError}): ${url}`);
}

/* ------------------------------------------------------------------
   Commons
   ------------------------------------------------------------------ */

/** File 名前空間だけを検索します（記事本文の画像は見ません） */
async function searchFiles(query, limit) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    maxlag: "5",
    list: "search",
    srsearch: `${query} filetype:bitmap`,
    srnamespace: "6",
    srlimit: String(limit),
  });
  const payload = await requestJson(`${COMMONS_API}?${params}`);
  return (payload?.query?.search ?? []).map((item) => item.title).filter(Boolean);
}

/** ファイルのメタデータを取得します。値は加工せず、そのまま返します */
async function fetchFiles(fileNames, thumbWidth) {
  if (fileNames.length === 0) return [];
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    maxlag: "5",
    prop: "imageinfo|categories",
    iiprop: "url|mime|size|extmetadata",
    iiurlwidth: String(thumbWidth),
    cllimit: "50",
    // API の上限に合わせて 50 件ずつ
    titles: fileNames.slice(0, 50).join("|"),
  });
  const payload = await requestJson(`${COMMONS_API}?${params}`);
  return payload?.query?.pages ?? [];
}

/** 作者欄などの HTML を素のテキストにします（値の意味は変えません） */
function stripHtml(value) {
  if (!value) return null;
  const text = String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text || null;
}

function firstHref(value) {
  if (!value) return null;
  const match = String(value).match(/href="([^"]+)"/);
  if (!match) return null;
  return match[1].startsWith("//") ? `https:${match[1]}` : match[1];
}

/* ------------------------------------------------------------------
   Wikidata（存命人物の判定にのみ使います）
   ------------------------------------------------------------------ */

/**
 * エンティティが存命人物かを判定します（Q5 かつ P570 が無い）。
 * 存命人物の写真はライセンスが自由でも自動公開しません。
 */
async function isLivingPerson(entityId) {
  const params = new URLSearchParams({
    action: "wbgetclaims",
    format: "json",
    formatversion: "2",
    entity: entityId,
    property: "P31|P570",
  });
  const payload = await requestJson(`${WIKIDATA_API}?${params}`);
  const instanceOf = payload?.claims?.P31 ?? [];
  const isHuman = instanceOf.some((claim) => claim?.mainsnak?.datavalue?.value?.id === "Q5");
  if (!isHuman) return false;
  return (payload?.claims?.P570 ?? []).length === 0;
}

/* ------------------------------------------------------------------
   候補の並べ替え（解像度と縦横比のみ。権利の判断は含みません）
   ------------------------------------------------------------------ */

function mechanicalRank(info, minWidth, minHeight) {
  const width = info.width ?? 0;
  const height = info.height ?? 0;
  const ratio = height > 0 ? width / height : 0;
  const pixels = width * height;
  const required = minWidth * minHeight;
  const ratioGap = Math.abs(ratio - 16 / 9);
  return Math.round((required > 0 ? Math.min(3, pixels / required) : 0) * 30 - ratioGap * 40);
}

/* ------------------------------------------------------------------
   本体
   ------------------------------------------------------------------ */

async function main() {
  if (!process.env.WIKIMEDIA_CONTACT_EMAIL) {
    console.warn(
      "! WIKIMEDIA_CONTACT_EMAIL が未設定です。Wikimedia の API 利用方針では\n" +
        "  連絡先の分かる User-Agent が求められます。.env.example を参照してください。",
    );
  }

  const manifest = JSON.parse(await readFile(TARGETS_PATH, "utf8"));
  const defaults = manifest.defaults ?? {};
  const targets = (manifest.targets ?? []).filter((target) => !only || target.path === only);

  const records = [];
  const rejections = [];
  const seen = new Set();

  for (const target of targets) {
    const slot = target.slot ?? defaults.slot ?? "card";
    const minWidth = target.minWidth ?? defaults.minWidth ?? 1000;
    const minHeight = target.minHeight ?? defaults.minHeight ?? 560;
    const limit = target.limit ?? defaults.limit ?? 10;

    /** @type {{page: any, info: any, rank: number}[]} */
    const candidates = [];

    for (const query of target.queries ?? []) {
      let fileNames = [];
      try {
        fileNames = await searchFiles(query, limit);
      } catch (error) {
        console.error(`  検索に失敗: ${query} — ${error.message}`);
        continue;
      }
      await sleep(300);

      let pages = [];
      try {
        pages = await fetchFiles(fileNames, 1600);
      } catch (error) {
        console.error(`  取得に失敗: ${query} — ${error.message}`);
        continue;
      }
      await sleep(300);

      for (const page of pages) {
        const info = page?.imageinfo?.[0];
        const at = new Date().toISOString();
        if (!info?.url) {
          rejections.push({ fileName: page?.title ?? "", reason: "source_unknown", at });
          continue;
        }
        if ((info.width ?? 0) < minWidth || (info.height ?? 0) < minHeight) {
          rejections.push({
            fileName: page.title,
            reason: "resolution_too_low",
            detail: `${info.width}×${info.height} < ${minWidth}×${minHeight}`,
            at,
          });
          continue;
        }
        if (seen.has(page.title)) continue;
        candidates.push({ page, info, rank: mechanicalRank(info, minWidth, minHeight) });
      }
    }

    candidates.sort((a, b) => b.rank - a.rank);
    const chosen = candidates.slice(0, target.keep ?? 1);

    for (const [index, candidate] of chosen.entries()) {
      const { page, info } = candidate;
      const meta = info.extmetadata ?? {};
      seen.add(page.title);

      const categories = (page.categories ?? [])
        .map((category) => category.title)
        .join("|")
        .toLowerCase();

      // 被写体が存命人物かどうかは、判定材料として記録するだけです
      let livingPerson = null;
      if (target.wikidataEntityId) {
        try {
          livingPerson = await isLivingPerson(target.wikidataEntityId);
          await sleep(300);
        } catch {
          livingPerson = null;
        }
      }

      const declared = [...(target.subjectRisk ?? [])];
      if (livingPerson === true) declared.push("living_person");
      // 判定できなかった場合も「安全」とは扱いません
      if (livingPerson === null && target.wikidataEntityId) declared.push("unknown_subject");

      records.push({
        fileName: page.title,
        commonsPageId: page.pageid,
        commonsPageUrl:
          info.descriptionurl ?? `${COMMONS_FILE_BASE}${encodeURIComponent(page.title)}`,
        wikidataEntityId: target.wikidataEntityId ?? undefined,
        originalUrl: info.url,
        thumbnailUrl: info.thumburl ?? undefined,
        mimeType: info.mime ?? undefined,
        width: info.width ?? 0,
        height: info.height ?? 0,

        // --- ここから下は Commons が返した値をそのまま書き写しています ---
        licenseRaw: stripHtml(meta.LicenseShortName?.value) ?? stripHtml(meta.License?.value),
        licenseNameRaw:
          stripHtml(meta.UsageTerms?.value) ?? stripHtml(meta.LicenseShortName?.value),
        licenseUrlRaw: stripHtml(meta.LicenseUrl?.value),
        publicDomainBasis: stripHtml(meta.Copyrighted?.value),
        attributionText: stripHtml(meta.Attribution?.value),
        authorName: stripHtml(meta.Artist?.value),
        authorUrl: firstHref(meta.Artist?.value),
        sourceName: stripHtml(meta.Credit?.value),
        sourceUrl: info.descriptionurl ?? null,
        description: stripHtml(meta.ImageDescription?.value),
        objectName: stripHtml(meta.ObjectName?.value),
        categories: categories || null,
        restrictions: stripHtml(meta.Restrictions?.value),

        retrievedAt: new Date().toISOString(),
        subjectRisk: declared,
        path: target.path,
        slot,
        order: index,
      });
    }

    console.log(
      `${target.path}: 候補 ${candidates.length} 件 / 採用 ${chosen.length} 件` +
        (candidates.length === 0 ? "（画像なし → 生成ビジュアルのまま）" : ""),
    );
  }

  const output = {
    $comment: [
      "npm run wikimedia:sync の出力です。手で編集しないでください。",
      "ここに入るのは Commons API から返ってきた生の値だけで、",
      "ライセンスの解釈・利用可否の判定は一切含まれません（src/wikimedia/licenses.ts が行います）。",
    ],
    generatedAt: new Date().toISOString(),
    records,
    rejections,
  };

  console.log(
    `\n取得 ${records.length} 件 / 除外 ${rejections.length} 件\n` +
      "この時点ではどの画像も公開されません。\n" +
      "PD / CC0 かつ作者・出典が揃い、追加権利の懸念が無いものだけが自動で approved になります。\n" +
      "それ以外は src/wikimedia/data/reviews.json に人間の判断を書くまで保留されます。",
  );

  if (dryRun) {
    console.log("\n--dry-run のためファイルは書き換えていません。");
    return;
  }
  await writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`\n書き出しました: ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
