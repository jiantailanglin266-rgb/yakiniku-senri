/**
 * 生成ファイル（JSON）を、型のついたデータへ変換します。
 *
 * ■ なぜ検証してから取り込むのか
 *   `assets.generated.json` は自動生成物です。スクリプトの不具合や、
 *   途中で壊れたファイルが混ざる可能性があります。
 *   「取得できた」ことを「掲載してよい」に読み替えないという方針は、
 *   ここでも同じです。**必須項目が欠けている行は取り込みません。**
 *
 * ■ ここで承認状態を作りません
 *   `verificationStatus` は生成側が入れた値をそのまま使い、
 *   読めない値なら `pending`（＝非表示）に倒します。
 *   欠損を「たぶん approved」で埋めることはしません。
 */
import type {
  AssetLocalization,
  AssetUsage,
  ImageSlot,
  LicenseCode,
  ObjectPosition,
  OptimizedVariants,
  RightsRisk,
  UsageStatus,
  VerificationStatus,
  WikimediaAsset,
} from "../types";
import { slotSizes } from "../types";
import { licenses } from "../config/licenses";

type Row = Record<string, unknown>;

function str(row: Row, key: string): string | null {
  const value = row[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function num(row: Row, key: string): number | null {
  const value = row[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function bool(row: Row, key: string): boolean {
  return row[key] === true;
}

function strArray(row: Row, key: string): string[] {
  const value = row[key];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

const verificationStatuses: VerificationStatus[] = [
  "pending",
  "needs_review",
  "license_unknown",
  "rights_risk",
  "approved",
  "rejected",
];

const usageStatuses: UsageStatus[] = ["unused", "in_use", "suspended"];

function toObjectPosition(value: unknown): ObjectPosition {
  if (
    value === "center" ||
    value === "top" ||
    value === "bottom" ||
    value === "left" ||
    value === "right"
  ) {
    return value;
  }
  if (value && typeof value === "object") {
    const point = value as Record<string, unknown>;
    if (typeof point.x === "number" && typeof point.y === "number") {
      return { x: point.x, y: point.y };
    }
  }
  return "center";
}

function toOptimized(value: unknown): OptimizedVariants | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Row;
  const generatedAt = str(row, "generatedAt");
  if (!generatedAt) return null;
  return {
    webp: str(row, "webp"),
    avif: str(row, "avif"),
    thumbnailWebp: str(row, "thumbnailWebp"),
    generatedAt,
    sourceHash: str(row, "sourceHash"),
  };
}

/**
 * 1件を `WikimediaAsset` に変換します。
 * 掲載に不可欠な項目（ID・ファイル名・Commons ページ・寸法）が欠けていたら `null`。
 */
export function toAsset(value: unknown): WikimediaAsset | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Row;

  const id = str(row, "id");
  const fileName = str(row, "fileName");
  const commonsPageUrl = str(row, "commonsPageUrl");
  const originalUrl = str(row, "originalUrl");
  const width = num(row, "width");
  const height = num(row, "height");
  const retrievedAt = str(row, "retrievedAt");

  if (!id || !fileName || !commonsPageUrl || !originalUrl || !width || !height || !retrievedAt) {
    return null;
  }

  const rawLicense = str(row, "licenseCode");
  // 知らないライセンスコードは UNKNOWN に倒します（＝掲載されません）
  const licenseCode: LicenseCode =
    rawLicense && rawLicense in licenses ? (rawLicense as LicenseCode) : "UNKNOWN";
  const license = licenses[licenseCode];

  const rawStatus = str(row, "verificationStatus");
  const verificationStatus: VerificationStatus = verificationStatuses.includes(
    rawStatus as VerificationStatus,
  )
    ? (rawStatus as VerificationStatus)
    : "pending";

  const rawUsage = str(row, "usageStatus");
  const usageStatus: UsageStatus = usageStatuses.includes(rawUsage as UsageStatus)
    ? (rawUsage as UsageStatus)
    : "unused";

  return {
    id,
    commonsPageId: num(row, "commonsPageId"),
    wikidataEntityId: str(row, "wikidataEntityId"),

    fileName,
    title: str(row, "title") ?? fileName,
    description: str(row, "description"),

    originalUrl,
    thumbnailUrl: str(row, "thumbnailUrl"),
    commonsPageUrl,
    localPath: str(row, "localPath"),
    optimized: toOptimized(row.optimized),
    blurDataURL: str(row, "blurDataURL"),

    mimeType: str(row, "mimeType") ?? "",
    width,
    height,
    aspectRatio: num(row, "aspectRatio") ?? width / height,

    authorName: str(row, "authorName"),
    authorUrl: str(row, "authorUrl"),
    sourceName: str(row, "sourceName"),
    sourceUrl: str(row, "sourceUrl"),

    licenseCode,
    licenseName: str(row, "licenseName") ?? license.name,
    licenseUrl: str(row, "licenseUrl") ?? (license.url || null),
    licenseVersion: str(row, "licenseVersion") ?? license.version ?? null,
    attributionText: str(row, "attributionText"),
    copyrightStatus: str(row, "copyrightStatus"),

    // ライセンス定義を正とします。生成側の値で上書きさせません
    commercialUseAllowed: license.commercialUseAllowed,
    derivativeWorksAllowed: license.derivativeWorksAllowed,
    shareAlikeRequired: license.shareAlikeRequired,
    isPublicDomain: license.isPublicDomain,
    publicDomainRationale: str(row, "publicDomainRationale"),

    isModified: bool(row, "isModified"),
    modificationDescription: str(row, "modificationDescription"),

    retrievedAt,
    verifiedAt: str(row, "verifiedAt"),
    verificationStatus,
    verificationNotes: strArray(row, "verificationNotes"),
    rightsRisks: strArray(row, "rightsRisks") as RightsRisk[],

    usageStatus,
    objectPosition: toObjectPosition(row.objectPosition),
    metadataRaw: (row.metadataRaw as Record<string, unknown> | null) ?? null,
  };
}

export function toLocalization(value: unknown): AssetLocalization | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Row;
  const assetId = str(row, "assetId");
  const locale = str(row, "locale");
  const altText = str(row, "altText");
  // alt が無い行は取り込みません。読み上げ環境で意味が伝わらないためです
  if (!assetId || !locale || !altText) return null;
  return {
    assetId,
    locale,
    altText,
    caption: str(row, "caption"),
    description: str(row, "description"),
  };
}

export function toUsage(value: unknown): AssetUsage | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Row;
  const assetId = str(row, "assetId");
  const pageKey = str(row, "pageKey");
  const slot = str(row, "slot");
  if (!assetId || !pageKey || !slot || !(slot in slotSizes)) return null;
  return {
    assetId,
    pageKey,
    slot: slot as ImageSlot,
    priority: num(row, "priority") ?? 0,
  };
}

/** 配列を1件ずつ変換し、取り込めなかった行は落とします */
export function mapValid<T>(rows: unknown, convert: (value: unknown) => T | null): T[] {
  if (!Array.isArray(rows)) return [];
  const result: T[] = [];
  for (const row of rows) {
    const converted = convert(row);
    if (converted) result.push(converted);
  }
  return result;
}
