#!/usr/bin/env node
/**
 * 生成物の検証。
 *
 * ■ ここで落とす目的
 *   自動生成されたデータを、そのまま main に入れないためです。
 *   「取得できた」ことと「掲載してよい」ことは別、という前提を
 *   データの形でも守れているか、機械的に確かめます。
 *
 * ■ 落とす条件（承認済みの画像に限る）
 *   - ライセンスが不明
 *   - Commons のファイルページが無い
 *   - 作者表示が必要なのに作者が無い
 *   - 商用利用・改変が許可されていないライセンス
 *   - 検証日時が無い
 *   - 代替テキスト（日本語）が無い
 *
 * 承認されていない画像は表示されないので、ここでは警告に留めます。
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const ASSETS_PATH = path.join(ROOT, "src/media/data/assets.generated.json");
const USAGES_PATH = path.join(ROOT, "src/media/data/usages.generated.json");

/** 商用利用・改変が可能なライセンス */
const USABLE = new Set([
  "PD",
  "CC0",
  "CC-BY-1.0",
  "CC-BY-2.0",
  "CC-BY-2.5",
  "CC-BY-3.0",
  "CC-BY-4.0",
  "CC-BY-SA-1.0",
  "CC-BY-SA-2.0",
  "CC-BY-SA-2.5",
  "CC-BY-SA-3.0",
  "CC-BY-SA-4.0",
]);

/** 作者表示が不要なもの */
const NO_ATTRIBUTION = new Set(["PD", "CC0"]);

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

async function main() {
  const assetsFile = await readJson(ASSETS_PATH, { assets: [], localizations: [] });
  const usagesFile = await readJson(USAGES_PATH, { usages: [] });

  const assets = assetsFile.assets ?? [];
  const localizations = assetsFile.localizations ?? [];
  const usages = usagesFile.usages ?? [];

  const errors = [];
  const warnings = [];

  const localizedJa = new Set(
    localizations.filter((entry) => entry.locale === "ja").map((entry) => entry.assetId),
  );
  const assetIds = new Set(assets.map((asset) => asset.id));

  for (const asset of assets) {
    const where = `${asset.id} (${asset.fileName})`;

    if (asset.verificationStatus !== "approved") {
      // 承認されていない画像は表示されません。形式だけ確認します
      if (!asset.commonsPageUrl) warnings.push(`${where}: Commons のURLがありません`);
      continue;
    }

    if (!asset.licenseCode || asset.licenseCode === "UNKNOWN") {
      errors.push(`${where}: 承認済みなのにライセンスが不明です`);
    } else if (!USABLE.has(asset.licenseCode)) {
      errors.push(`${where}: ${asset.licenseCode} は商用利用または改変が許可されていません`);
    }

    if (!asset.commonsPageUrl?.startsWith("https://commons.wikimedia.org/")) {
      errors.push(`${where}: Commons のファイルページURLがありません`);
    }

    if (!NO_ATTRIBUTION.has(asset.licenseCode) && !asset.authorName) {
      errors.push(`${where}: 作者表示が必要なライセンスですが、作者が空です`);
    }

    if (!asset.verifiedAt) {
      errors.push(`${where}: 承認済みなのに検証日時がありません`);
    }

    if (!localizedJa.has(asset.id)) {
      errors.push(`${where}: 日本語の代替テキストがありません`);
    }

    if (!asset.width || !asset.height) {
      errors.push(`${where}: 寸法がありません（CLS の原因になります）`);
    }
  }

  for (const usage of usages) {
    if (!assetIds.has(usage.assetId)) {
      errors.push(`掲載指定 ${usage.pageKey} (${usage.slot}) が存在しない画像を指しています`);
    }
  }

  const approved = assets.filter((asset) => asset.verificationStatus === "approved").length;
  const pending = assets.length - approved;

  console.log("=== 生成物の検証 ===");
  console.log(`画像: ${assets.length} 件（承認済み ${approved} / 未承認 ${pending}）`);
  console.log(`掲載指定: ${usages.length} 件 / 代替テキスト: ${localizations.length} 件`);

  for (const warning of warnings.slice(0, 20)) console.log(`  ! ${warning}`);
  for (const error of errors) console.error(`  ✗ ${error}`);

  if (errors.length > 0) {
    console.error(`\n${errors.length} 件の問題があります。掲載できません。`);
    process.exitCode = 1;
    return;
  }
  console.log("\n問題ありません。");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
