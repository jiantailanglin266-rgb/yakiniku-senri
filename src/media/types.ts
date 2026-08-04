/**
 * Wikimedia Commons 画像の共通データモデル。
 *
 * ■ このモジュールの前提
 *   「APIで取得できた」と「サイトに掲載してよい」はまったく別の判定です。
 *   取得結果（`metadataRaw`）と、掲載可否の判定結果（`verificationStatus` ほか）を
 *   別のフィールドとして持ち、判定を通っていない画像は描画側で表示できないようにします。
 *
 * ■ 同じ画像を複数ページで使う場合
 *   画像情報は `WikimediaAsset` に一度だけ持ち、
 *   ページとの結びつきは `WikimediaAssetUsage` で管理します（重複保存しません）。
 */

/** ライセンスの識別子。表記揺れは lib/license.ts で正規化します */
export type LicenseCode =
  | "PD"
  | "CC0"
  | "CC-BY-1.0"
  | "CC-BY-2.0"
  | "CC-BY-2.5"
  | "CC-BY-3.0"
  | "CC-BY-4.0"
  | "CC-BY-SA-1.0"
  | "CC-BY-SA-2.0"
  | "CC-BY-SA-2.5"
  | "CC-BY-SA-3.0"
  | "CC-BY-SA-4.0"
  | "CC-BY-NC"
  | "CC-BY-NC-SA"
  | "CC-BY-ND"
  | "GFDL"
  | "FAIR-USE"
  | "ALL-RIGHTS-RESERVED"
  | "UNKNOWN";

export type License = {
  code: LicenseCode;
  /** 正式名称。多言語ページでも翻訳しません */
  name: string;
  url: string;
  version?: string;
  /** 商用利用が許可されているか */
  commercialUseAllowed: boolean;
  /** 改変が許可されているか */
  derivativeWorksAllowed: boolean;
  /** 継承（ShareAlike）が必要か */
  shareAlikeRequired: boolean;
  /** 作者表示（Attribution）が必要か */
  attributionRequired: boolean;
  /** パブリックドメイン相当か */
  isPublicDomain: boolean;
  /** 自動掲載のホワイトリスト対象か */
  autoUsable: boolean;
};

/**
 * 掲載可否の状態。
 *
 * `approved` 以外は、描画側で画像を表示しません。
 */
export type VerificationStatus =
  | "pending" // 取得直後。未判定
  | "needs_review" // 機械判定は通ったが、人の確認が必要（人物・建築・作品など）
  | "license_unknown" // ライセンスを機械的に特定できなかった
  | "rights_risk" // 追加権利（肖像・商標・建築著作物など）のリスクあり
  | "approved" // 人が承認済み。掲載可
  | "rejected"; // 却下

export type UsageStatus = "unused" | "in_use" | "suspended";

/** 追加権利のリスク種別。ライセンスとは別に判定します */
export type RightsRisk =
  | "living-person"
  | "public-figure"
  | "athlete"
  | "politician"
  | "child"
  | "company-logo"
  | "product"
  | "card-face"
  | "artwork"
  | "sculpture"
  | "building-interior"
  | "architecture"
  | "event-photo"
  | "trademark"
  | "freedom-of-panorama";

/**
 * Wikimedia Commons のファイル1件。
 *
 * ⚠ 作者名・作品名・ライセンス正式名称・ファイル名・Commons URL は、
 *   どの言語のページでも**原文のまま**表示します（翻訳しません）。
 */
export type WikimediaAsset = {
  id: string;
  /** Commons のページID。取得できない場合は null */
  commonsPageId: number | null;
  /** 関連する Wikidata エンティティ（Q番号） */
  wikidataEntityId: string | null;

  /** 例: "Contactless payment terminal.jpg" */
  fileName: string;
  /** ファイルページのタイトル（原文） */
  title: string;
  /** Commons 側の説明（原文・HTMLを剥がしたもの） */
  description: string | null;

  originalUrl: string;
  thumbnailUrl: string | null;
  commonsPageUrl: string;
  /** 自社ストレージへ保存した場合のパス。未保存なら null */
  localPath: string | null;

  mimeType: string;
  width: number;
  height: number;
  /** width / height。CLS 防止のために必ず保持します */
  aspectRatio: number;

  authorName: string | null;
  authorUrl: string | null;
  sourceName: string | null;
  sourceUrl: string | null;

  licenseCode: LicenseCode;
  licenseName: string;
  licenseUrl: string | null;
  licenseVersion: string | null;
  /** Commons が提供する推奨クレジット文（原文） */
  attributionText: string | null;
  copyrightStatus: string | null;

  commercialUseAllowed: boolean;
  derivativeWorksAllowed: boolean;
  shareAlikeRequired: boolean;
  isPublicDomain: boolean;
  /** パブリックドメインの根拠（PD-old-70 など） */
  publicDomainRationale: string | null;

  /** サイト側で加工したか */
  isModified: boolean;
  modificationDescription: string | null;

  /** ISO 8601 */
  retrievedAt: string;
  verifiedAt: string | null;
  verificationStatus: VerificationStatus;
  /** 判定の根拠。管理画面と監査ログに出します */
  verificationNotes: string[];
  rightsRisks: RightsRisk[];

  usageStatus: UsageStatus;

  /** 被写体が切れないための表示位置 */
  objectPosition: ObjectPosition;

  /** API のレスポンス原文（監査用）。表示には使いません */
  metadataRaw: Record<string, unknown> | null;
};

export type ObjectPosition =
  "center" | "top" | "bottom" | "left" | "right" | { x: number; y: number };

/** 言語ごとに翻訳する項目。原文情報（作者名など）はここに入れません */
export type AssetLocalization = {
  assetId: string;
  locale: string;
  /** 代替テキスト。装飾目的なら空文字 */
  altText: string;
  caption: string | null;
  /** 画像の補足説明 */
  description: string | null;
};

/** どのページのどの枠で使うか */
export type AssetUsage = {
  assetId: string;
  /** 掲載先。例: "cardport:guide:points-basics" */
  pageKey: string;
  /** 表示枠 */
  slot: ImageSlot;
  /** 同じ枠に複数候補があるときの優先度（小さいほど優先） */
  priority: number;
};

export type ImageSlot = "hero" | "card" | "thumbnail" | "inline" | "background" | "ogp" | "avatar";

/** 用途別の推奨サイズ。元画像がこれを大きく下回る場合は使いません */
export const slotSizes: Record<ImageSlot, { width: number; height: number; minWidth: number }> = {
  hero: { width: 1920, height: 1080, minWidth: 1280 },
  card: { width: 1200, height: 675, minWidth: 800 },
  thumbnail: { width: 480, height: 270, minWidth: 400 },
  inline: { width: 1200, height: 800, minWidth: 640 },
  background: { width: 1920, height: 1080, minWidth: 1280 },
  ogp: { width: 1200, height: 630, minWidth: 1200 },
  avatar: { width: 800, height: 1000, minWidth: 400 },
};

/** 却下の記録。同じ画像を何度も候補に挙げないために残します */
export type AssetRejection = {
  fileName: string;
  reason: string;
  rejectedAt: string;
};

/** 取得・検証の履歴 */
export type VerificationLog = {
  assetId: string;
  at: string;
  from: VerificationStatus;
  to: VerificationStatus;
  actor: string;
  note: string;
};
