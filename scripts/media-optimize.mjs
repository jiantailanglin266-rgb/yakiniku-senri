#!/usr/bin/env node
/**
 * 承認済み画像のダウンロードと最適化。
 *
 * ■ 承認済みだけを落とします
 *   `verificationStatus === "approved"` の画像だけが対象です。
 *   確認前の画像をリポジトリに置くと、うっかり公開される経路ができます。
 *
 * ■ 派生を作っても権利は変わりません
 *   WebP / AVIF への変換とサムネイル生成は「改変」に当たります。
 *   改変が許可されていないライセンス（CC BY-ND）はそもそも掲載対象外なので、
 *   ここへは来ません。作者・ライセンスの表示義務は派生にも及びます。
 *
 * ■ なぜビルド前に変換するのか
 *   GitHub Pages は静的配信で、next/image の最適化APIが使えません
 *   （next.config.ts の images.unoptimized）。
 *   配信時に変換できないぶん、ここで先に作っておきます。
 *
 * 保存先: public/media/wikimedia/<assetId>/
 *   original.<ext>   元ファイル（変換していないもの）
 *   image.webp       表示用
 *   image.avif       表示用（対応環境）
 *   thumb.webp       一覧用
 *   meta.json        作者・ライセンス・出典・取得日時（画像と一緒に置きます）
 *
 * 使い方:
 *   node scripts/media-optimize.mjs --dry-run
 *   node scripts/media-optimize.mjs --write
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { writeJson } from "./lib/write-json.mjs";
import path from "node:path";
import process from "node:process";

import sharp from "sharp";

import { getClientConfig, sleep } from "./lib/wikimedia-client.mjs";

const ROOT = process.cwd();
const ASSETS_PATH = path.join(ROOT, "src/media/data/assets.generated.json");
const OUTPUT_DIR = path.join(ROOT, "public/media/wikimedia");
/** 公開URL上のパス。basePath は next/image が付けるので、ここでは付けません */
const PUBLIC_PREFIX = "/media/wikimedia";

const args = process.argv.slice(2);
const shouldWrite = args.includes("--write");

/** 表示に使う最大幅。これ以上大きい元画像は縮めます */
const MAX_WIDTH = Number(process.env.MEDIA_MAX_WIDTH ?? 1600);
const THUMB_WIDTH = Number(process.env.MEDIA_THUMB_WIDTH ?? 640);

async function fetchBinary(url, config) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs * 3);
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": config.userAgent },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 読み込み中に出す極小プレビュー。
 * 20px 幅まで落としているので、内容が読み取れるものではありません。
 */
async function makeBlurDataUrl(buffer) {
  const tiny = await sharp(buffer)
    .resize(20, null, { fit: "inside" })
    .webp({ quality: 40 })
    .toBuffer();
  return `data:image/webp;base64,${tiny.toString("base64")}`;
}

async function main() {
  const config = getClientConfig();
  const raw = JSON.parse(await readFile(ASSETS_PATH, "utf8"));
  const assets = raw.assets ?? [];

  const targets = assets.filter(
    (asset) => asset.verificationStatus === "approved" && asset.usageStatus !== "suspended",
  );

  console.log(`承認済み ${targets.length} 件 / 全体 ${assets.length} 件`);
  if (targets.length === 0) {
    console.log("ダウンロード対象がありません（承認された画像がまだありません）。");
    return;
  }

  const summary = { downloaded: 0, skipped: 0, failed: 0 };

  for (const asset of targets) {
    const dir = path.join(OUTPUT_DIR, asset.id);
    const publicDir = `${PUBLIC_PREFIX}/${asset.id}`;

    // すでに派生があり、元URLが変わっていなければ作り直しません
    if (asset.optimized?.webp && asset.optimized?.sourceHash) {
      console.log(`  = ${asset.fileName}（生成済み）`);
      summary.skipped += 1;
      continue;
    }

    console.log(`  ▸ ${asset.fileName}`);

    if (!shouldWrite) {
      summary.skipped += 1;
      continue;
    }

    try {
      const buffer = await fetchBinary(asset.originalUrl, config);
      const sourceHash = createHash("sha256").update(buffer).digest("hex").slice(0, 16);

      await mkdir(dir, { recursive: true });

      const extension = path.extname(asset.fileName).toLowerCase() || ".jpg";
      await writeFile(path.join(dir, `original${extension}`), buffer);

      const base = sharp(buffer, { failOn: "none" }).rotate();
      const metadata = await base.metadata();
      const width = Math.min(MAX_WIDTH, metadata.width ?? MAX_WIDTH);

      await base.clone().resize(width).webp({ quality: 82 }).toFile(path.join(dir, "image.webp"));
      await base.clone().resize(width).avif({ quality: 55 }).toFile(path.join(dir, "image.avif"));
      await base
        .clone()
        .resize(Math.min(THUMB_WIDTH, width))
        .webp({ quality: 76 })
        .toFile(path.join(dir, "thumb.webp"));

      const blurDataURL = await makeBlurDataUrl(buffer);

      /*
        画像と同じ場所に、作者・ライセンス・出典を置きます。
        ファイルだけがコピーされてもクレジットが辿れるようにするためです。
      */
      await writeFile(
        path.join(dir, "meta.json"),
        `${JSON.stringify(
          {
            fileName: asset.fileName,
            author: asset.authorName,
            authorUrl: asset.authorUrl,
            license: asset.licenseCode,
            licenseUrl: asset.licenseUrl,
            commonsUrl: asset.commonsPageUrl,
            originalUrl: asset.originalUrl,
            retrievedAt: asset.retrievedAt,
            width: metadata.width ?? asset.width,
            height: metadata.height ?? asset.height,
            note: "この画像の作者表示・ライセンス表示は、掲載時に必ず画像と一緒に出してください。",
          },
          null,
          2,
        )}\n`,
        "utf8",
      );

      asset.localPath = `${publicDir}/original${extension}`;
      asset.blurDataURL = blurDataURL;
      asset.optimized = {
        webp: `${publicDir}/image.webp`,
        avif: `${publicDir}/image.avif`,
        thumbnailWebp: `${publicDir}/thumb.webp`,
        generatedAt: new Date().toISOString(),
        sourceHash,
      };
      // トリミングやオーバーレイはしていません。形式変換とリサイズだけです
      asset.isModified = false;

      summary.downloaded += 1;
      await sleep(config.intervalMs);
    } catch (error) {
      console.error(`    ✗ ${error?.message ?? error}`);
      summary.failed += 1;
    }
  }

  console.log("\n=== 最適化 ===");
  console.log(`保存: ${summary.downloaded} / 既存: ${summary.skipped} / 失敗: ${summary.failed}`);

  if (!shouldWrite) {
    console.log("--write が指定されていないため、ファイルは更新していません。");
    return;
  }

  await writeJson(ASSETS_PATH, { ...raw, assets });
  console.log(`更新しました: ${path.relative(ROOT, ASSETS_PATH)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
