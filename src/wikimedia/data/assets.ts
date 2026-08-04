/**
 * 画像レジストリ。
 *
 * ■ 取得と判定を分けています
 *   `npm run wikimedia:sync` は Commons API の**生の値**を
 *   assets.generated.json へ書くだけで、利用可否を一切決めません。
 *   ライセンスの解釈・追加権利の判定・公開可否は、すべてこのファイルと
 *   licenses.ts が行います。判定ロジックが1か所にしか無い状態を保つためです。
 *
 * ■ 推測でメタデータを書きません
 *   実在の Commons ファイルに対して作者名やライセンスを手で書き足すことは
 *   「確認済み」という嘘をコードに埋め込む行為なので、絶対にしません。
 *   generated.json に無い情報は、無いまま扱います（＝公開されません）。
 *
 * ■ 公開される条件
 *   verificationStatus === "approved" かつ evaluateAsset() の blockers が空。
 *   PD / CC0 で作者・出典まで揃っている場合だけ自動で approved になります。
 *   それ以外は reviews.json に人間の判断を書くまで公開されません。
 */
import type {
  ImageRejection,
  RightsRiskFlag,
  VerificationStatus,
  WikimediaAsset,
  WikimediaAssetUsage,
} from "../types";
import { initialStatus, normalizeLicense } from "../licenses";
import { detectRightsRisks, toRightsRisk } from "../risks";
import generated from "./assets.generated.json";
import reviews from "./reviews.json";

/** sync スクリプトが書き出す生レコード（解釈前） */
type RawRecord = {
  fileName: string;
  commonsPageId?: number;
  commonsPageUrl?: string;
  wikidataEntityId?: string;
  originalUrl?: string;
  thumbnailUrl?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  /** extmetadata の LicenseShortName / License。文字列のまま保持します */
  licenseRaw?: string | null;
  licenseNameRaw?: string | null;
  licenseUrlRaw?: string | null;
  publicDomainBasis?: string | null;
  attributionText?: string | null;
  authorName?: string | null;
  authorUrl?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  description?: string | null;
  objectName?: string | null;
  /** Commons のカテゴリ（"|" 区切り） */
  categories?: string | null;
  /** Commons が付けている追加制限（"trademarked" など） */
  restrictions?: string | null;
  retrievedAt?: string;
  /** targets.json 由来 + 本文から推定した被写体リスク */
  subjectRisk?: string[];
  /** 割り当て先 */
  path?: string;
  slot?: WikimediaAssetUsage["slot"];
  order?: number;
  metadataRaw?: Record<string, unknown>;
};

type ReviewDecision = {
  status?: string;
  actor?: string;
  at?: string;
  note?: string;
  clearedRisks?: string[];
};

const rawRecords = (generated.records ?? []) as RawRecord[];
const decisions = (reviews.decisions ?? {}) as Record<string, ReviewDecision>;

const statuses: VerificationStatus[] = [
  "pending",
  "approved",
  "rejected",
  "needs_review",
  "license_unknown",
  "rights_risk",
];

function toStatus(value: string | undefined): VerificationStatus | undefined {
  return statuses.find((status) => status === value);
}

/**
 * 生レコードを WikimediaAsset へ変換します。
 * 表示に必要な情報が欠けているレコードは undefined を返し、レジストリへ入りません。
 */
function toAsset(raw: RawRecord): WikimediaAsset | undefined {
  // ファイル名・画像URL・出典ページが無いものは、そもそも表示もクレジットもできません
  if (!raw.fileName || !raw.originalUrl || !raw.commonsPageUrl) return undefined;

  const policy = normalizeLicense(raw.licenseRaw ?? raw.licenseNameRaw);
  const width = raw.width ?? 0;
  const height = raw.height ?? 0;

  const risks = new Set<RightsRiskFlag>(
    detectRightsRisks({
      description: raw.description,
      objectName: raw.objectName,
      categories: raw.categories,
      restrictions: raw.restrictions,
      declared: raw.subjectRisk,
    }),
  );

  // 人間が確認して問題ないと判断した懸念だけ、明示的に外します
  const decision = decisions[raw.fileName];
  for (const value of decision?.clearedRisks ?? []) {
    const flag = toRightsRisk(value);
    if (flag) risks.delete(flag);
  }

  const asset: WikimediaAsset = {
    id: raw.fileName
      .replace(/^File:/, "")
      .replace(/[^A-Za-z0-9]+/g, "-")
      .toLowerCase(),
    commonsPageId: raw.commonsPageId,
    wikidataEntityId: raw.wikidataEntityId,
    fileName: raw.fileName,
    title: raw.fileName.replace(/^File:/, "").replace(/\.[a-z0-9]+$/i, ""),
    description: raw.description ?? undefined,
    originalUrl: raw.originalUrl,
    thumbnailUrl: raw.thumbnailUrl,
    commonsPageUrl: raw.commonsPageUrl,
    mimeType: raw.mimeType ?? "image/jpeg",
    width,
    height,
    aspectRatio: height > 0 ? width / height : 0,
    authorName: raw.authorName ?? undefined,
    authorUrl: raw.authorUrl ?? undefined,
    sourceName: raw.sourceName ?? undefined,
    sourceUrl: raw.sourceUrl ?? undefined,
    licenseCode: policy.code,
    licenseName: raw.licenseNameRaw ?? policy.name,
    licenseUrl: raw.licenseUrlRaw ?? policy.url,
    publicDomainBasis: raw.publicDomainBasis ?? undefined,
    attributionText: raw.attributionText ?? undefined,
    commercialUseAllowed: policy.commercialUseAllowed,
    derivativeWorksAllowed: policy.derivativeWorksAllowed,
    shareAlikeRequired: policy.shareAlikeRequired,
    isPublicDomain: policy.isPublicDomain,
    isModified: false,
    retrievedAt: raw.retrievedAt ?? "",
    verificationStatus: "pending",
    usageStatus: raw.path ? "in_use" : "unused",
    rightsRisks: Array.from(risks),
    // 代替テキストは同期時に作れないため、説明文から作れる分だけ入れます
    altText: raw.description ? { ja: raw.description, en: raw.description } : {},
  };

  // 自動判定 → その後に人間の判断で上書きします（人間は承認も却下もできます）
  const auto = initialStatus(asset);
  const reviewed = toStatus(decision?.status);
  asset.verificationStatus = reviewed ?? auto;
  asset.verifiedAt = decision?.at ?? (auto === "approved" ? asset.retrievedAt : undefined);
  asset.reviewNote = decision?.note;

  return asset;
}

/** 取得済み・判定済みの画像 */
export const wikimediaAssets: WikimediaAsset[] = rawRecords
  .map(toAsset)
  .filter((asset): asset is WikimediaAsset => Boolean(asset));

/** 画像とページの対応。画像本体は上の配列に1件だけ持ちます */
export const wikimediaUsages: WikimediaAssetUsage[] = rawRecords
  .filter((raw) => Boolean(raw.path))
  .map((raw, index) => ({
    assetId: raw.fileName
      .replace(/^File:/, "")
      .replace(/[^A-Za-z0-9]+/g, "-")
      .toLowerCase(),
    path: raw.path as string,
    slot: raw.slot ?? "card",
    order: raw.order ?? index,
  }));

/** 同期時に弾いた候補。同じ画像を何度も拾わないために残します */
export const wikimediaRejections: ImageRejection[] = (generated.rejections ??
  []) as ImageRejection[];

/** 最後に同期した日時（未同期なら null） */
export const wikimediaSyncedAt: string | null = generated.generatedAt ?? null;

/* ------------------------------------------------------------------
   参照ヘルパー
   ------------------------------------------------------------------ */

const byId = new Map(wikimediaAssets.map((asset) => [asset.id, asset]));

export function getAsset(id: string | undefined): WikimediaAsset | undefined {
  if (!id) return undefined;
  return byId.get(id);
}

/** 指定ページ・スロットに割り当てられた画像を返します */
export function assetsForPage(path: string, slot?: WikimediaAssetUsage["slot"]): WikimediaAsset[] {
  return wikimediaUsages
    .filter((usage) => usage.path === path && (slot ? usage.slot === slot : true))
    .sort((a, b) => a.order - b.order)
    .map((usage) => byId.get(usage.assetId))
    .filter((asset): asset is WikimediaAsset => Boolean(asset));
}

/** 1枚だけ欲しい場合。無ければ undefined（呼び出し側はフォールバックへ） */
export function assetForPage(
  path: string,
  slot: WikimediaAssetUsage["slot"],
): WikimediaAsset | undefined {
  return assetsForPage(path, slot)[0];
}

/** 掲載ページの一覧（画像出典ページで使います） */
export function usagesForAsset(assetId: string): WikimediaAssetUsage[] {
  return wikimediaUsages.filter((usage) => usage.assetId === assetId);
}
