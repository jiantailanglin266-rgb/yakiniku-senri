#!/usr/bin/env node
/**
 * CRYPTO PORT の写真取得（mountain-peak 方式）。
 *
 * ■ 方式
 *   Wikimedia Commons を検索し、上位の1枚を `public/images/portal/<slug>.jpg` へ
 *   ダウンロードして、リポジトリに直接コミットします。
 *   表示時に外部ホストを参照しないため、配信が Wikimedia の可用性に左右されません。
 *
 * ■ クレジット
 *   画像ごとの作者名は保持せず、サイト共通の一括表記
 *   （「画像: Wikimedia Commons / CC BY-SA 4.0」）で表示します。
 *   これは運営判断による方式です。docs/portal/06-photos.md に経緯を残しています。
 *
 * ■ 取得できた画像の記録
 *   `src/portal/data/photo-manifest.json` に、実際に保存できたファイルだけを書きます。
 *   マニフェストに無いページは、写真ではなく生成ビジュアルを表示します。
 *   ファイルが無いのに <img> を出して 404 を並べないための仕組みです。
 *
 * 使い方:
 *   node scripts/portal-photos.mjs --dry-run     # 検索だけ行い、保存しない
 *   node scripts/portal-photos.mjs --write       # 保存してマニフェストを更新
 *   node scripts/portal-photos.mjs --write --only=coin:bitcoin
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT =
  "crypto-port-photos/1.0 (https://github.com/jiantailanglin266-rgb/yakiniku-senri)";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "images", "portal");
const MANIFEST_PATH = path.join(ROOT, "src", "portal", "data", "photo-manifest.json");
const TARGETS_PATH = path.join(ROOT, "src", "portal", "data", "photo-targets.json");

const args = process.argv.slice(2);
const write = args.includes("--write");
const only = args.find((arg) => arg.startsWith("--only="))?.slice("--only=".length) ?? null;

/** 横幅がこれ未満の画像は、カードやヒーローに使うと粗いので採用しません */
const MIN_WIDTH = 1000;
/** 1枚あたりの上限。重い画像をリポジトリへ入れないための歯止めです */
const MAX_BYTES = 900_000;
/** 保存する横幅。Commons のサムネイル生成に任せます */
const TARGET_WIDTH = 1600;

async function api(params) {
  const url = new URL(COMMONS_API);
  for (const [key, value] of Object.entries({ ...params, format: "json", origin: "*" })) {
    url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

/** 検索語に合う画像ファイルの候補を、Commons のファイル名で返します */
async function search(query, limit) {
  const data = await api({
    action: "query",
    list: "search",
    srsearch: `${query} filetype:bitmap`,
    srnamespace: 6,
    srlimit: limit,
  });
  return (data?.query?.search ?? []).map((hit) => hit.title);
}

/** ファイルの実体URL・寸法を取得します */
async function imageInfo(titles) {
  const data = await api({
    action: "query",
    titles: titles.join("|"),
    prop: "imageinfo",
    iiprop: "url|size|mime",
    iiurlwidth: TARGET_WIDTH,
  });
  const pages = Object.values(data?.query?.pages ?? {});
  return pages
    .map((page) => {
      const info = page?.imageinfo?.[0];
      if (!info) return null;
      return {
        title: page.title,
        width: info.width,
        height: info.height,
        mime: info.mime,
        // サムネイルURLがあればそちらを使い、元の巨大ファイルは落としません
        url: info.thumburl ?? info.url,
      };
    })
    .filter(Boolean);
}

/** 横長・十分な解像度・JPEG/PNG のものだけを候補に残します */
function usable(candidate) {
  if (!candidate.url) return false;
  if (candidate.width < MIN_WIDTH) return false;
  if (candidate.width < candidate.height) return false; // 縦長はカードで破綻します
  return candidate.mime === "image/jpeg" || candidate.mime === "image/png";
}

async function download(url) {
  const response = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > MAX_BYTES) {
    throw new Error(`サイズ超過 ${(buffer.byteLength / 1024).toFixed(0)}KB`);
  }
  return buffer;
}

async function loadJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

async function main() {
  const targets = await loadJson(TARGETS_PATH, []);
  const manifest = await loadJson(MANIFEST_PATH, {});
  const queue = only ? targets.filter((target) => target.key === only) : targets;

  if (queue.length === 0) {
    console.log("対象がありません。");
    return;
  }

  console.log(`対象 ${queue.length} 件${write ? "" : "（--dry-run 相当。保存しません）"}`);
  if (write) await mkdir(OUT_DIR, { recursive: true });

  let saved = 0;
  let skipped = 0;

  for (const target of queue) {
    const label = target.key;
    try {
      const titles = await search(target.query, 8);
      if (titles.length === 0) {
        console.log(`- ${label}: 該当なし（${target.query}）`);
        skipped += 1;
        continue;
      }

      const candidates = (await imageInfo(titles)).filter(usable);
      if (candidates.length === 0) {
        console.log(`- ${label}: 条件を満たす画像なし`);
        skipped += 1;
        continue;
      }

      // 検索順（関連度順）を尊重し、条件を満たした最初の1枚を使います
      const picked = candidates[0];
      console.log(`- ${label}: ${picked.title} (${picked.width}x${picked.height})`);

      if (!write) continue;

      const buffer = await download(picked.url);
      const fileName = `${target.key.replace(":", "-")}.jpg`;
      await writeFile(path.join(OUT_DIR, fileName), buffer);

      manifest[target.key] = {
        file: fileName,
        // 一括クレジット方式のため、作者名は保持しません。
        // 元ファイル名だけは、後から出所をたどれるように残します。
        commonsFile: picked.title,
        width: picked.width,
        height: picked.height,
      };
      saved += 1;
    } catch (error) {
      console.log(`- ${label}: 失敗 (${error.message})`);
      skipped += 1;
    }
  }

  if (write) {
    const sorted = Object.fromEntries(
      Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)),
    );
    await writeFile(MANIFEST_PATH, `${JSON.stringify(sorted, null, 2)}\n`);
    console.log(`\n保存 ${saved} 件 / 見送り ${skipped} 件`);
    console.log(`マニフェスト: ${path.relative(ROOT, MANIFEST_PATH)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
