#!/usr/bin/env node
/**
 * 掲載中の画像を、Commons 側の現在の状態と突き合わせます。
 *
 * ■ なぜ定期的に見直すのか
 *   一度確認したライセンスは、あとから変わることがあります。
 *   ファイルが削除される、ライセンスが訂正される、URL が変わる——
 *   いずれも「掲載してよい」という前提が崩れます。
 *   確認した時点の判断を、無期限に有効とは扱いません。
 *
 * ■ 問題が見つかった画像だけを戻します
 *   `needs_review` に戻すと、その時点で画面から消えます。
 *   問題のない画像には触りません（無駄に承認を落としません）。
 *
 * ■ 取得できなかっただけでは戻しません
 *   ネットワークの一時的な失敗と、ファイルの削除は別です。
 *   取得に失敗した画像は「確認できなかった」として報告するだけにします。
 *
 * 使い方:
 *   node scripts/media-revalidate.mjs --dry-run
 *   node scripts/media-revalidate.mjs --write
 */
import { readFile } from "node:fs/promises";
import { writeJson } from "./lib/write-json.mjs";
import path from "node:path";
import process from "node:process";

import {
  createStats,
  fetchImageInfo,
  getClientConfig,
  safeCall,
  sleep,
} from "./lib/wikimedia-client.mjs";

const ROOT = process.cwd();
const ASSETS_PATH = path.join(ROOT, "src/media/data/assets.generated.json");

const args = process.argv.slice(2);
const shouldWrite = args.includes("--write");

function plainText(value) {
  if (typeof value !== "string") return null;
  const text = value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 0 ? text : null;
}

function licenseTexts(page) {
  const ext = page?.imageinfo?.[0]?.extmetadata ?? {};
  return [ext.LicenseShortName?.value, ext.License?.value, ext.UsageTerms?.value]
    .map(plainText)
    .filter(Boolean);
}

async function main() {
  const config = getClientConfig();
  const stats = createStats();

  const raw = JSON.parse(await readFile(ASSETS_PATH, "utf8"));
  const assets = raw.assets ?? [];
  const targets = assets.filter((asset) => asset.verificationStatus === "approved");

  console.log(`再確認の対象: ${targets.length} 件（承認済みのみ）`);
  if (targets.length === 0) return;

  const summary = { checked: 0, unchanged: 0, reverted: 0, unreachable: 0 };
  const findings = [];

  // 一度に多く問い合わせないよう、20件ずつに分けます
  for (let index = 0; index < targets.length; index += 20) {
    const batch = targets.slice(index, index + 20);
    const pages = await safeCall(
      `再確認 ${index + 1}-${index + batch.length}`,
      () =>
        fetchImageInfo(
          batch.map((asset) => asset.title),
          config,
          stats,
        ),
      stats,
    );
    await sleep(config.intervalMs);

    if (!pages) {
      summary.unreachable += batch.length;
      continue;
    }

    const byTitle = new Map(pages.map((page) => [page.title, page]));

    for (const asset of batch) {
      summary.checked += 1;
      const page = byTitle.get(asset.title);
      const reasons = [];

      if (!page || page.missing) {
        reasons.push("Commons 上でファイルが見つかりません（削除・改名の可能性）");
      } else {
        const info = page.imageinfo?.[0];
        if (!info) {
          reasons.push("ファイル情報を取得できませんでした");
        } else {
          if (info.url && info.url !== asset.originalUrl) {
            reasons.push(`画像URLが変わりました（${asset.originalUrl} → ${info.url}）`);
          }
          const current = licenseTexts(page).join(" / ");
          const recorded = (asset.rawLicenses ?? []).join(" / ");
          if (current && recorded && current !== recorded) {
            reasons.push(`ライセンス表記が変わりました（${recorded} → ${current}）`);
          }
          if (!current) {
            reasons.push("ライセンス表記を読み取れなくなりました");
          }
        }
      }

      if (reasons.length === 0) {
        summary.unchanged += 1;
        continue;
      }

      // 問題があった画像だけ、確認待ちへ戻します（＝画面から消えます）
      asset.verificationStatus = "needs_review";
      asset.verifiedAt = null;
      asset.verificationNotes = [
        ...(asset.verificationNotes ?? []),
        `[${new Date().toISOString()}] 定期確認で差異を検出: ${reasons.join(" / ")}`,
      ];
      summary.reverted += 1;
      findings.push({ fileName: asset.fileName, reasons });
    }
  }

  console.log("\n=== 定期確認 ===");
  console.log(`確認: ${summary.checked} / 変化なし: ${summary.unchanged}`);
  console.log(`確認待ちへ戻した: ${summary.reverted} / 到達できず: ${summary.unreachable}`);
  for (const finding of findings) {
    console.log(`  - ${finding.fileName}: ${finding.reasons.join(" / ")}`);
  }
  if (stats.blocked403 > 0) {
    console.log("  403 が出ています。GitHub Actions 上で実行してください。");
  }

  if (!shouldWrite) {
    console.log("\n--write が指定されていないため、ファイルは更新していません。");
    return;
  }

  if (summary.reverted === 0) {
    console.log("\n変更はありません。");
    return;
  }

  await writeJson(ASSETS_PATH, { ...raw, assets });
  console.log(`\n更新しました: ${path.relative(ROOT, ASSETS_PATH)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
