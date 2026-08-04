#!/usr/bin/env node
/**
 * Wikimedia Commons からの画像メタデータ取得。
 *
 * ■ このスクリプトがしないこと
 *   - Wikipedia の記事本文に出ている画像を、そのまま採用すること
 *     （記事の画像はフェアユースや各言語版ローカルアップロードを含みます。
 *       `srnamespace=6` で Commons に登録されたファイルだけを対象にします）
 *   - ライセンスが読み取れない画像を公開扱いにすること
 *   - 取得できた項目から、取得できなかった項目を推測すること
 *   - 既存の画像を消すこと（追記と更新のみ）
 *   - 一度人が承認・却下した状態を、再取得で巻き戻すこと
 *
 * ■ 取得と判定は別
 *   取得結果は `metadataRaw` にそのまま残し、掲載可否は別に判定します。
 *   API が 200 を返したことは、掲載してよい根拠になりません。
 *
 * ■ 自動承認
 *   既定では **1件も自動承認しません**（`MEDIA_AUTO_APPROVE` 未設定時）。
 *   有効にしても、パブリックドメインと CC0 だけ、かつ被写体の権利リスクが
 *   検出されないものに限ります（scripts/lib/media-approval.mjs）。
 *
 * ■ 既定は「書き込まない」
 *   --write を付けたときだけ生成ファイルを更新します。
 *
 * 使い方:
 *   node scripts/wikimedia-sync.mjs --dry-run
 *   node scripts/wikimedia-sync.mjs --write
 *   node scripts/wikimedia-sync.mjs --write --only=cardport:guide:points-basics
 *   node scripts/wikimedia-sync.mjs --write --limit=20
 */
import { readFile, mkdir } from "node:fs/promises";
import { writeJsonFormatted } from "./lib/write-json.mjs";
import path from "node:path";
import process from "node:process";

import {
  createStats,
  fetchImageInfo,
  fetchLeadImageTitle,
  getClientConfig,
  safeCall,
  searchCommons,
  sleep,
} from "./lib/wikimedia-client.mjs";
import {
  CANDIDATE_THRESHOLD,
  detectExcludedSubjects,
  rankCandidates,
  scoreCandidate,
} from "./lib/candidate-score.mjs";
import { evaluateAutoApproval, getApprovalConfig } from "./lib/media-approval.mjs";
import { altTextFor, wikipediaTitlesFor } from "./lib/media-keywords.mjs";

const ROOT = process.cwd();
const ASSETS_PATH = path.join(ROOT, "src/media/data/assets.generated.json");
const USAGES_PATH = path.join(ROOT, "src/media/data/usages.generated.json");
const MANUAL_REQUESTS = path.join(ROOT, "src/media/data/requests.json");
const GENERATED_REQUESTS = path.join(ROOT, "src/media/data/requests.generated.json");

/* ------------------------------------------------------------------ */
/* 引数                                                                */
/* ------------------------------------------------------------------ */
const args = process.argv.slice(2);
const shouldWrite = args.includes("--write");
const only = args.find((arg) => arg.startsWith("--only="))?.slice("--only=".length) ?? null;
const maxRequests = Number(
  args.find((arg) => arg.startsWith("--limit="))?.slice("--limit=".length),
);

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
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 0 ? text : null;
}

/**
 * 作者名の整理。
 *
 * ■ 重複を畳みます
 *   Commons の Artist は表示用と非表示用を重ねて持つことがあります。
 *     Unknown author<span style="display:none">Unknown author</span>
 *   タグを剥がすと「Unknown author Unknown author」になります。
 *
 * ■ 「作者不明」を作者名として扱いません
 *   "Unknown author" を authorName に入れると、
 *   作者が判明しているかのように見え、自動承認の条件も通ってしまいます。
 *   分からないものは null のままにします。
 */
function normalizeAuthor(value) {
  const text = plainText(value);
  if (!text) return null;

  // 同じ語が2回続く場合は1回に畳みます
  const half = Math.floor(text.length / 2);
  const collapsed =
    text.length % 2 === 1 && text.slice(0, half) === text.slice(half + 1)
      ? text.slice(0, half)
      : text;

  const lower = collapsed.toLowerCase().replace(/[.\s]+$/, "");
  const unknownPatterns = [
    "unknown",
    "unknown author",
    "author unknown",
    "anonymous",
    "not provided",
    "no author",
    "作者不明",
    "不明",
  ];
  if (unknownPatterns.includes(lower)) return null;

  return collapsed;
}

/** extmetadata の HTML から、最初のリンク先を拾います */
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
 * ファイルURLから追跡パラメータを落とします。
 * Commons は utm_source などを付けて返しますが、
 * 保存して掲載URLに使う値としては不要です（画像は付けなくても取得できます）。
 */
function cleanUrl(value) {
  if (typeof value !== "string" || !value) return "";
  const index = value.indexOf("?");
  return index === -1 ? value : value.slice(0, index);
}

function assetIdFor(title) {
  return `wm-${String(title)
    .replace(/^File:/, "")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase()
    .replace(/^-|-$/g, "")
    .slice(0, 60)}`;
}

/**
 * API のレスポンスを、判定前の素の形へ整えます。
 * ここでは「掲載してよいか」を一切決めません。
 */
function toRawAsset(page) {
  const info = page?.imageinfo?.[0];
  if (!info) return null;
  const ext = info.extmetadata ?? {};

  const width = Number(info.width ?? 0);
  const height = Number(info.height ?? 0);
  if (!width || !height) return null;

  return {
    id: assetIdFor(page.title),
    commonsPageId: typeof page.pageid === "number" ? page.pageid : null,
    wikidataEntityId: null,

    fileName: String(page.title).replace(/^File:/, ""),
    title: String(page.title),
    description: plainText(meta(ext, "ImageDescription")),

    originalUrl: cleanUrl(info.url),
    thumbnailUrl: info.thumburl ? cleanUrl(info.thumburl) : null,
    commonsPageUrl: cleanUrl(info.descriptionurl),

    mimeType: info.mime ?? "",
    width,
    height,
    aspectRatio: width / height,

    // 取得できなければ null。ここで推測しません
    authorName: normalizeAuthor(meta(ext, "Artist")),
    authorUrl: firstHref(meta(ext, "Artist")),
    sourceName: plainText(meta(ext, "Credit")),
    sourceUrl: firstHref(meta(ext, "Credit")),

    /** 判定前の生のライセンス表記。複数返ることがあります */
    rawLicenses: [meta(ext, "LicenseShortName"), meta(ext, "License"), meta(ext, "UsageTerms")]
      .map(plainText)
      .filter(Boolean),
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
/* ライセンス判定（src/media/lib/license.ts と同じ規則）                */
/* ------------------------------------------------------------------ */
/*
 * このスクリプトは .mjs で、TypeScript の実装をそのまま呼べません。
 * 判定が食い違わないよう、規則をテストで突き合わせています
 * （tests/media-pipeline.test.ts）。
 * 少しでも読めない場合は UNKNOWN に倒し、掲載しない側へ寄せます。
 */
const BLOCKING_PATTERNS = [
  /non-?commercial/i,
  /\bnc\b/i,
  /no-?deriv/i,
  /\bnd\b/i,
  /fair\s*use/i,
  /all\s*rights\s*reserved/i,
  /non-?free/i,
];

function normalizeLicense(raw) {
  if (!raw) return "UNKNOWN";
  const key = String(raw)
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9.\-+]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (!key) return "UNKNOWN";

  if (BLOCKING_PATTERNS.some((pattern) => pattern.test(key))) {
    if (/nc/.test(key)) return /sa/.test(key) ? "CC-BY-NC-SA" : "CC-BY-NC";
    if (/nd/.test(key)) return "CC-BY-ND";
    if (/fair/.test(key)) return "FAIR-USE";
    return "ALL-RIGHTS-RESERVED";
  }

  if (/^cc0/.test(key) || /cc-zero/.test(key) || /creative-commons-zero/.test(key)) return "CC0";
  if (/^public-domain/.test(key) || /^pd(-|$)/.test(key) || key === "no-restrictions") return "PD";
  if (/^gfdl/.test(key) || /gnu-free-documentation/.test(key)) return "GFDL";

  const sa = /(^|-)sa(-|$)/.test(key) || key.includes("sharealike");
  const by = /(^|-)by(-|$)/.test(key) || key.includes("attribution");
  if (by || sa) {
    const version = key.match(/(\d\.\d)/)?.[1];
    // バージョンが読めない CC は最新版と決めつけません
    if (!version) return "UNKNOWN";
    return sa ? `CC-BY-SA-${version}` : `CC-BY-${version}`;
  }

  return "UNKNOWN";
}

const AUTO_USABLE = new Set([
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

/** 複数表記から、もっとも制約の少ないものを選びます */
function pickLicense(rawLicenses) {
  const codes = rawLicenses.map(normalizeLicense);
  if (codes.length === 0) return { code: "UNKNOWN", hadUnknown: true };
  /*
    表記が食い違ったときは、緩いほうではなく**厳しいほう**を採ります。

    以前は PD/CC0 → CC BY → CC BY-SA の順に「使いやすいもの」を選んでいました。
    しかし3つの表記は同じライセンスの言い換えであることがほとんどで、
    食い違いは解析の取りこぼしを意味します。
    そこで緩いほうを選ぶと、継承義務や非商用条件を落としたまま公開されます。

    使えないライセンス（NC / ND / 不明）が1つでもあれば、それを採用して止めます。
  */
  const rank = (code) => {
    if (!AUTO_USABLE.has(code)) return 0;
    if (code.startsWith("CC-BY-SA")) return 1;
    if (code === "PD" || code === "CC0") return 3;
    return 2;
  };
  const best = [...codes].sort((a, b) => rank(a) - rank(b))[0];
  return { code: best, hadUnknown: codes.includes("UNKNOWN") };
}

/**
 * 掲載可否の初期状態。approved はここでは付けません
 * （自動承認は evaluateAutoApproval が別に判断します）。
 */
function classify(raw, licenseCode) {
  const notes = [];

  if (licenseCode === "UNKNOWN") {
    notes.push(
      `ライセンス表記を機械的に特定できませんでした（${raw.rawLicenses.join(" / ") || "表記なし"}）。推測で公開しません。`,
    );
    return { status: "license_unknown", notes };
  }
  if (!AUTO_USABLE.has(licenseCode)) {
    notes.push(`${licenseCode} は商用利用または改変が許可されていません。`);
    return { status: "rejected", notes };
  }
  if (!raw.commonsPageUrl) {
    notes.push("Commons のファイルページURLを取得できませんでした。");
    return { status: "needs_review", notes };
  }
  if (!raw.authorName && licenseCode !== "PD" && licenseCode !== "CC0") {
    notes.push("作者表示が必要なライセンスですが、作者情報を取得できませんでした。");
    return { status: "needs_review", notes };
  }

  notes.push(
    "ライセンス表記は読み取れました。被写体の権利（肖像・商標・建築）を含む掲載可否は、管理画面で確認してください。",
  );
  return { status: "needs_review", notes };
}

/* ------------------------------------------------------------------ */
/* 入出力                                                              */
/* ------------------------------------------------------------------ */
async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

async function loadRequests() {
  const manual = await readJson(MANUAL_REQUESTS, []);
  const generated = await readJson(GENERATED_REQUESTS, { requests: [] });

  const manualList = (Array.isArray(manual) ? manual : []).map((entry) => ({
    limit: 6,
    priority: 0,
    slot: "inline",
    ...entry,
    // 手書きに最低幅の指定が無ければ、枠の要件を使います
    minimumWidth: entry.minimumWidth ?? 800,
    aspectRatio: entry.aspectRatio ?? 16 / 9,
    manual: true,
  }));

  const manualKeys = new Set(manualList.map((entry) => `${entry.pageKey}::${entry.slot}`));
  const generatedList = (generated.requests ?? []).filter(
    (entry) => !manualKeys.has(`${entry.pageKey}::${entry.slot}`),
  );

  // 手書きを先に処理します（同じ画像が競合したとき、手書き側が先に確保します）
  return [...manualList, ...generatedList];
}

/* ------------------------------------------------------------------ */
/* 実行                                                                */
/* ------------------------------------------------------------------ */
async function main() {
  const clientConfig = getClientConfig();
  const approvalConfig = getApprovalConfig();
  const stats = createStats();

  const allRequests = await loadRequests();
  let targets = only ? allRequests.filter((request) => request.pageKey === only) : allRequests;
  if (Number.isFinite(maxRequests) && maxRequests > 0) targets = targets.slice(0, maxRequests);

  if (targets.length === 0) {
    console.log("対象がありません。npm run media:requests で一覧を生成してください。");
    return;
  }

  console.log(`対象 ${targets.length} 件 / 候補しきい値 ${CANDIDATE_THRESHOLD} 点`);
  console.log(
    approvalConfig.enabled
      ? `自動承認: 有効（${approvalConfig.licenses.join(", ")} / ${approvalConfig.minScore}点以上 / ${approvalConfig.minWidth}×${approvalConfig.minHeight}以上）`
      : "自動承認: 無効（すべて人の確認へ回します）",
  );

  const existingAssets = await readJson(ASSETS_PATH, { assets: [], localizations: [] });
  const existingUsages = await readJson(USAGES_PATH, { usages: [] });

  // 既存を消しません。同じIDが来たら更新、来なければそのまま残します
  const assetById = new Map((existingAssets.assets ?? []).map((asset) => [asset.id, asset]));
  const localizationByKey = new Map(
    (existingAssets.localizations ?? []).map((entry) => [
      `${entry.assetId}::${entry.locale}`,
      entry,
    ]),
  );
  const usageByKey = new Map(
    (existingUsages.usages ?? []).map((usage) => [
      `${usage.pageKey}::${usage.slot}::${usage.assetId}`,
      usage,
    ]),
  );

  // 同じ画像が並ばないよう、この実行で採用したファイル名を覚えます
  const usedFileNames = new Set(
    (existingUsages.usages ?? [])
      .map((usage) => assetById.get(usage.assetId)?.fileName)
      .filter(Boolean),
  );

  const summary = {
    searched: 0,
    candidates: 0,
    belowThreshold: 0,
    autoApproved: 0,
    needsReview: 0,
    rejected: 0,
    licenseUnknown: 0,
    placed: 0,
    noResult: 0,
  };

  for (const request of targets) {
    const label = `${request.pageKey} (${request.slot})`;
    console.log(`\n▸ ${label} — "${request.query}"`);
    summary.searched += 1;

    const queries = [request.query, ...(request.alternateQueries ?? [])].filter(Boolean);
    const titles = new Set();
    /** タイトル直指定で得たファイル。検索結果より優先します */
    const leadTitles = new Set();

    /*
      1. まず Wikipedia の記事タイトルから代表画像を取ります。
         その概念を説明するために選ばれた1枚なので、狙った内容に当たります。
         ただし各言語版ローカルの非自由ファイルは fetchLeadImageTitle が捨てます
         （Commons にあるファイルだけが返ります）。
    */
    /*
      代表画像を使わない枠。

      記事の代表画像は「その記事を説明する1枚」なので、対象によって性質が変わります。
      山や用具の記事なら風景や物ですが、競技の記事は試合中の選手写真です。
      実際、run 30920868384 では「無人のコート」を狙った競技20枠に対し、
      MotoGP に実在選手の写真、ボクシング・クリケット・バレーボールにも
      人物写真が割り当たりました（いずれも保留され公開はされていません）。

      人物が写る候補は肖像権の確認が必要で、そもそも承認できません。
      拾ってから落とすより、最初から検索だけに任せるほうが無駄がありません。
    */
    const useLeadImage = request.leadImage !== false;

    // 検索語が無くても、記事タイトルの指定だけで取得できるようにします
    for (const query of useLeadImage ? (queries.length > 0 ? queries : [null]) : []) {
      /*
        指定の優先順位:
          1. requests.json に人が書いた `wikipedia`（main で運用中の書式）
          2. 自動生成が付けた `wikipediaTitles`
          3. 検索語からの対応表
        人が指定したものを最優先にします。
      */
      const mapping =
        request.wikipedia ?? request.wikipediaTitles ?? (query ? wikipediaTitlesFor(query) : null);
      if (!mapping?.titles?.length) continue;

      for (const articleTitle of mapping.titles) {
        const fileTitle = await safeCall(
          `代表画像 "${articleTitle}"`,
          () => fetchLeadImageTitle(mapping.lang, articleTitle, clientConfig, stats),
          stats,
        );
        await sleep(clientConfig.intervalMs);
        if (fileTitle) {
          leadTitles.add(fileTitle);
          titles.add(fileTitle);
          break;
        }
      }
      if (leadTitles.size > 0) break;
    }

    /*
      2. 記事タイトルの対応が無い、または代表画像を取れなかったときだけ全文検索します。
         検索は当たりが悪いぶん、後段の 80 点足切りで落ちる割合が高くなります。
    */
    if (leadTitles.size === 0) {
      for (const query of queries) {
        const found = await safeCall(
          `検索 "${query}"`,
          () => searchCommons(query, request.limit ?? 6, clientConfig, stats),
          stats,
        );
        for (const title of found ?? []) titles.add(title);
        await sleep(clientConfig.intervalMs);
        // 十分な候補が集まったら、予備キーワードは使いません
        if (titles.size >= (request.limit ?? 6)) break;
      }
    }

    if (titles.size === 0) {
      console.log("  候補が見つかりませんでした（装飾表示のまま残ります）");
      summary.noResult += 1;
      continue;
    }

    const pages = await safeCall(
      "詳細の取得",
      () => fetchImageInfo([...titles].slice(0, 20), clientConfig, stats),
      stats,
    );
    await sleep(clientConfig.intervalMs);
    if (!pages) continue;

    /*
      SVG は図版であって写真ではありません。写真枠に入れると、
      拡大しても内容が変わらない模式図が本文の図版として並びます。
      検索経由でも混ざるため、ここで一律に落とします。
    */
    const raws = pages
      .map(toRawAsset)
      .filter(Boolean)
      .filter((raw) => !/\.svg$/i.test(raw.fileName) && raw.mimeType !== "image/svg+xml");

    /*
      記事の代表画像は、関連度の足切りを免除します。
      「その記事を説明する画像」として人が選んだものなので、
      全文検索のヒットと同じ基準で機械的に落とすのは不適切です。
      ただし解像度・ライセンス・被写体リスクの判定は、このあと同じように通します。
    */
    const leadRaws = raws
      .filter((raw) => leadTitles.has(raw.title))
      // 代表画像でも、実在ブランド・ロゴ・人物は候補にしません
      .filter((raw) => detectExcludedSubjects(raw).length === 0);
    const ranked = rankCandidates(raws, request, { usedFileNames });
    summary.belowThreshold += raws.length - ranked.length - leadRaws.length;

    let best;
    if (leadRaws.length > 0) {
      const scored = leadRaws.map((raw) => ({ raw, ...scoreCandidate(raw, request) }));
      best = scored.sort((a, b) => b.total - a.total)[0];
      best.viaLeadImage = true;
    } else if (ranked.length > 0) {
      best = ranked[0];
    } else {
      console.log(
        `  ${raws.length} 件のうち、${CANDIDATE_THRESHOLD} 点以上の候補はありませんでした`,
      );
      summary.noResult += 1;
      continue;
    }

    const raw = best.raw;
    summary.candidates += 1;

    const { code: licenseCode } = pickLicense(raw.rawLicenses);
    const { status, notes } = classify(raw, licenseCode);

    const previous = assetById.get(raw.id);
    // 一度人が決めた状態は、再取得で巻き戻しません
    const humanDecided =
      previous?.verificationStatus === "approved" || previous?.verificationStatus === "rejected";

    let finalStatus = status;
    const finalNotes = [
      ...notes,
      best.viaLeadImage
        ? `Wikipedia 記事の代表画像として取得（関連度 ${best.total} 点）`
        : `Commons の全文検索から採用（関連度 ${best.total} 点）`,
      `採点の内訳: ${JSON.stringify(best.breakdown)}`,
    ];

    if (!humanDecided && status === "needs_review") {
      const decision = evaluateAutoApproval({
        raw,
        licenseCode,
        score: best.total,
        config: approvalConfig,
        viaLeadImage: Boolean(best.viaLeadImage),
      });
      finalNotes.push(...decision.notes);
      if (decision.approved) finalStatus = "approved";
    }

    if (humanDecided) finalStatus = previous.verificationStatus;

    assetById.set(raw.id, {
      ...raw,
      licenseCode,
      licenseUrl: raw.licenseUrl,
      localPath: previous?.localPath ?? null,
      optimized: previous?.optimized ?? null,
      blurDataURL: previous?.blurDataURL ?? null,
      isModified: previous?.isModified ?? false,
      modificationDescription: previous?.modificationDescription ?? null,
      objectPosition: previous?.objectPosition ?? "center",
      rightsRisks: previous?.rightsRisks ?? [],
      usageStatus: previous?.usageStatus ?? "in_use",
      verificationStatus: finalStatus,
      verificationNotes: finalNotes,
      verifiedAt:
        finalStatus === "approved" ? (previous?.verifiedAt ?? new Date().toISOString()) : null,
      relevanceScore: best.total,
    });

    // 代替テキスト。手書きの指定があればそちらを優先します
    for (const locale of ["ja", "en"]) {
      const key = `${raw.id}::${locale}`;
      const manualAlt = locale === "ja" ? request.altJa : request.altEn;
      const existing = localizationByKey.get(key);
      localizationByKey.set(key, {
        assetId: raw.id,
        locale,
        altText: manualAlt ?? existing?.altText ?? altTextFor(request.query, locale),
        caption: existing?.caption ?? null,
        description: existing?.description ?? null,
      });
    }

    // 掲載先
    const usageKey = `${request.pageKey}::${request.slot}::${raw.id}`;
    usageByKey.set(usageKey, {
      assetId: raw.id,
      pageKey: request.pageKey,
      slot: request.slot,
      priority: request.priority ?? 0,
    });
    usedFileNames.add(raw.fileName);
    summary.placed += 1;

    if (finalStatus === "approved") summary.autoApproved += 1;
    else if (finalStatus === "rejected") summary.rejected += 1;
    else if (finalStatus === "license_unknown") summary.licenseUnknown += 1;
    else summary.needsReview += 1;

    console.log(
      `  ✓ ${raw.fileName} — ${best.viaLeadImage ? "代表画像" : "検索"} / ${best.total}点 / ${licenseCode} / ${finalStatus}`,
    );
  }

  /* ---------------------------------------------------------------- */
  /* 集計                                                              */
  /* ---------------------------------------------------------------- */
  console.log("\n=== 通信 ===");
  console.log(`リクエスト ${stats.requests} / 成功 ${stats.ok} / 失敗 ${stats.failed}`);
  console.log(`再試行 ${stats.retried} / 429 ${stats.rateLimited} / 403 ${stats.blocked403}`);
  if (stats.blocked403 > 0) {
    console.log(
      "  403 が出ています。ネットワークポリシーで遮断されている可能性があります（GitHub Actions 上で実行してください）。",
    );
  }
  for (const error of stats.errors.slice(0, 5)) {
    console.log(`  - ${error.label ?? error.url}: ${error.message}`);
  }
  if (stats.errors.length > 5) console.log(`  … ほか ${stats.errors.length - 5} 件`);

  console.log("\n=== 結果 ===");
  console.log(`検索した枠: ${summary.searched}`);
  console.log(`候補が見つからなかった枠: ${summary.noResult}`);
  console.log(`しきい値未満で不採用: ${summary.belowThreshold}`);
  console.log(`掲載先を割り当てた: ${summary.placed}`);
  console.log(`  成功（自動承認・表示されます）: ${summary.autoApproved}`);
  console.log(`  保留（要確認・表示されません）: ${summary.needsReview}`);
  console.log(`  ライセンス不明（表示されません）: ${summary.licenseUnknown}`);
  console.log(`  却下（表示されません）: ${summary.rejected}`);

  if (!shouldWrite) {
    console.log("\n--write が指定されていないため、ファイルは更新していません。");
    return;
  }

  await mkdir(path.dirname(ASSETS_PATH), { recursive: true });
  const generatedAt = new Date().toISOString();

  await writeJsonFormatted(ASSETS_PATH, {
    generatedAt,
    note: "scripts/wikimedia-sync.mjs が生成します。手で編集しないでください。",
    assets: [...assetById.values()].sort((a, b) => a.id.localeCompare(b.id)),
    localizations: [...localizationByKey.values()].sort(
      (a, b) => a.assetId.localeCompare(b.assetId) || a.locale.localeCompare(b.locale),
    ),
  });

  await writeJsonFormatted(USAGES_PATH, {
    generatedAt,
    note: "scripts/wikimedia-sync.mjs が生成します。手で編集しないでください。",
    usages: [...usageByKey.values()].sort(
      (a, b) =>
        a.pageKey.localeCompare(b.pageKey) ||
        a.slot.localeCompare(b.slot) ||
        a.priority - b.priority,
    ),
  });

  console.log(`\n更新しました:`);
  console.log(`  ${path.relative(ROOT, ASSETS_PATH)}`);
  console.log(`  ${path.relative(ROOT, USAGES_PATH)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
