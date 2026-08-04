/**
 * Wikipedia の記事代表画像を取得して、リポジトリ内に保存します。
 *
 *   node scripts/wikipedia-photos.mjs            # 取得（既存はスキップ）
 *   node scripts/wikipedia-photos.mjs --dry-run  # 取得先URLの確認だけ
 *   node scripts/wikipedia-photos.mjs --index-only  # 一覧の作り直しだけ
 *                                                   （PowerShell で取得した後に使います）
 *   node scripts/wikipedia-photos.mjs --only=topic-ai-agent
 *   node scripts/wikipedia-photos.mjs --force    # 既存も取り直す
 *
 * ============================================================
 * ⚠⚠⚠ この経路はライセンス確認をしていません ⚠⚠⚠
 *
 *   mountain-peak-demo の tools/download-photos.ps1 と同じ方式です。
 *   Wikipedia REST API の `originalimage.source`（＝記事に表示されている画像）を
 *   そのまま取得します。この値は**ライセンスを問わず**返ります。
 *
 *   したがって取得物には次が混ざりえます。
 *     - CC BY / CC BY-SA（作品ごとの作者表示が条件。本経路は表示しません）
 *     - フェアユース等、そもそも再利用できないもの
 *     - 人物・商標・建築著作物など、ライセンス以外の権利が残るもの
 *
 *   `src/media/` の判定（取得と掲載可否の分離、クレジット同梱、承認キュー）は
 *   一切通りません。両者を取り違えないでください。
 *
 *   ライセンスを確認したうえで掲載する経路が必要な場合は、
 *   `npm run media:sync`（`scripts/wikimedia-sync.mjs`）を使ってください。
 *   そちらは Commons の extmetadata から作者・ライセンス・出典を取得し、
 *   人が承認するまで画面に出しません。
 * ============================================================
 *
 * ■ 相手のサーバーへの配慮（mountainpeak と同じ）
 *   - User-Agent に連絡先を入れる（Wikimedia の利用方針）
 *   - 逐次アクセスし、リクエスト間に待ちを入れる
 *   - 429 が返ったら長めに待つ
 */
import { mkdir, readFile, readdir, writeFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = join(ROOT, "scripts", "wikipedia-photo-manifest.json");
const OUT_DIR = join(ROOT, "public", "images", "ai-port", "photos");
const INDEX_PATH = join(ROOT, "src", "data", "ai-port", "photos.ts");

/** 連絡先を含めること。Wikimedia の利用方針が求めています。 */
const USER_AGENT =
  process.env.WIKIPEDIA_PHOTOS_USER_AGENT ??
  "AiPortPhotoBot/1.0 (https://github.com/jiantailanglin266-rgb/yakiniku-senri; jiantailanglin266@gmail.com)";

/** 相手のサーバーに負荷をかけないための待ち時間 */
const SUMMARY_INTERVAL_MS = 3000;
const DOWNLOAD_INTERVAL_MS = 2000;
const RATE_LIMIT_WAIT_MS = 20000;

/** 表示サイズに合わせて縮小します（原寸のまま置くと配信が重くなります） */
const MAX_EDGE = 1280;
const JPEG_QUALITY = 82;
/** これより小さいものは取得失敗とみなします（アイコン等をつかんだ場合） */
const MIN_BYTES = 5000;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");
const indexOnly = args.includes("--index-only");
const only = args.find((arg) => arg.startsWith("--only="))?.slice("--only=".length) ?? null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * 記事の代表画像URLを引きます。
 * ⚠ 返ってくるURLにライセンス情報は付いていません。
 */
async function findImageUrl(lang, title) {
  const encoded = encodeURIComponent(title.replace(/ /g, "_"));
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encoded}`;

  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  });

  if (response.status === 429) {
    await sleep(RATE_LIMIT_WAIT_MS);
    return null;
  }
  if (!response.ok) return null;

  const data = await response.json();
  const source = data?.originalimage?.source ?? null;
  if (!source) return null;
  // SVG は写真ではないため除外します（mountainpeak と同じ判断）
  if (/\.svg(\?|$)/i.test(source)) return null;

  return { source, pageUrl: data?.content_urls?.desktop?.page ?? null };
}

async function download(source) {
  const response = await fetch(source, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(120000),
  });
  if (!response.ok) return null;

  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer.byteLength > MIN_BYTES ? buffer : null;
}

/** 表示サイズへ縮小して JPEG で保存します。 */
async function saveResized(buffer, destination) {
  await sharp(buffer)
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toFile(destination);
}

/**
 * 取得できたスラッグの一覧をTypeScriptへ書き出します。
 * （mountainpeak の update-photos.mjs が MT_PHOTOS を書き換えるのと同じ役割）
 */
async function writeIndex() {
  const files = (await readdir(OUT_DIR)).filter((name) => name.endsWith(".jpg")).sort();
  const slugs = files.map((name) => name.replace(/\.jpg$/, ""));

  const body = `/**
 * 取得済みの写真の一覧（自動生成）。
 *
 * ⚠ このファイルは手で編集しないでください。
 *   \`node scripts/wikipedia-photos.mjs\` が public/images/ai-port/photos/ を
 *   走査して書き出します。
 *
 * ⚠⚠ ここに並ぶ画像はライセンス確認をしていません。
 *   Wikipedia の記事代表画像をそのまま取得したもので、作者・ライセンス・出典を
 *   保持していません。詳細は docs/ai-port/wikipedia-photos.md を読んでください。
 */
${
  slugs.length === 0
    ? `
/*
 * ■ 現在0件です
 *   取得を実行していないか、Wikipedia のホストへ到達できていません。
 *   0件のあいだ、各枠は外部素材を使わない装飾表現を表示します。
 */
`
    : ""
}
const PHOTO_SLUGS = new Set<string>([
${slugs.map((slug) => `  ${JSON.stringify(slug)},`).join("\n")}
]);

/** 掲載枠に対応する写真があるか。 */
export function hasPhoto(slug: string): boolean {
  return PHOTO_SLUGS.has(slug);
}

/** 写真のパス（存在しない場合は null）。 */
export function photoPath(slug: string): string | null {
  return PHOTO_SLUGS.has(slug) ? \`/images/ai-port/photos/\${slug}.jpg\` : null;
}

/** 取得済みの点数（画面の注記に使います）。 */
export const photoCount = ${slugs.length};
`;

  await writeFile(INDEX_PATH, body, "utf8");
  console.log(`一覧を更新しました: ${slugs.length} 件 → src/data/ai-port/photos.ts`);
}

async function main() {
  // PowerShell 版（scripts/wikipedia-photos.ps1）で取得した後は、一覧の更新だけ行います
  if (indexOnly) {
    await mkdir(OUT_DIR, { recursive: true });
    await writeIndex();
    return;
  }

  const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
  const targets = only ? manifest.filter((entry) => entry.slug === only) : manifest;

  if (targets.length === 0) {
    console.error(`対象がありません（--only=${only}）`);
    process.exitCode = 1;
    return;
  }

  console.log("⚠ この経路はライセンス確認をしていません。");
  console.log("  掲載前に docs/ai-port/wikipedia-photos.md を読んでください。\n");
  console.log(`User-Agent: ${USER_AGENT}`);
  console.log(`対象: ${targets.length} 件${dryRun ? "（dry-run）" : ""}\n`);

  await mkdir(OUT_DIR, { recursive: true });

  let saved = 0;
  let skipped = 0;
  const failed = [];

  for (const entry of targets) {
    const destination = join(OUT_DIR, `${entry.slug}.jpg`);

    if (!force && (await exists(destination))) {
      skipped += 1;
      continue;
    }

    let done = false;

    for (const title of entry.titles) {
      await sleep(SUMMARY_INTERVAL_MS);

      try {
        const found = await findImageUrl(entry.lang, title);
        if (!found) continue;

        if (dryRun) {
          console.log(`- ${entry.slug} ← ${title}\n    ${found.source}`);
          done = true;
          break;
        }

        await sleep(DOWNLOAD_INTERVAL_MS);
        const buffer = await download(found.source);
        if (!buffer) continue;

        await saveResized(buffer, destination);
        console.log(`- ${entry.slug} ← ${title}`);
        saved += 1;
        done = true;
        break;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("429")) await sleep(RATE_LIMIT_WAIT_MS);
      }
    }

    if (!done && !dryRun) failed.push(entry.slug);
  }

  console.log("\n=== 集計 ===");
  console.log(`保存: ${saved} 件 / 既存スキップ: ${skipped} 件 / 取得できず: ${failed.length} 件`);
  if (failed.length > 0) console.log(`取得できず: ${failed.join(", ")}`);

  if (!dryRun) await writeIndex();

  console.log(
    "\n⚠ 取得した画像は、作者・ライセンス・出典を保持していません。" +
      "\n  掲載する場合は /ai-port/image-credits の注記が出ることを確認してください。",
  );
}

await main();
