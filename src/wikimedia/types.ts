/**
 * Wikimedia Commons 画像の取り扱い — ドメインモデル
 *
 * ■ 設計の中心にある考え方
 *   「取得できたこと」と「使ってよいこと」を型のレベルで分離します。
 *   API から画像が返ってきても、それは利用可能を意味しません。
 *   ライセンス・作者・出典が揃って初めて公開候補になります。
 *
 * ■ 表示とクレジットを切り離さない
 *   画像URLだけを持つ型は作りません。WikimediaAsset は常に
 *   ライセンスと作者の情報を同伴し、欠けていれば公開できない状態になります。
 */

/** 正規化後のライセンスコード。表記揺れはすべてここへ寄せます。 */
export type LicenseCode =
  | "PD" // パブリックドメイン（各国法・期間満了・作者放棄など）
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
  | "CC-BY-NC" // 非商用（使用不可）
  | "CC-BY-NC-SA" // 非商用（使用不可）
  | "CC-BY-ND" // 改変不可
  | "GFDL"
  | "FAIR_USE" // 使用不可
  | "ALL_RIGHTS_RESERVED" // 使用不可
  | "UNKNOWN"; // 判定不能 → 公開しない

export type LicensePolicy = {
  code: LicenseCode;
  /** 正式名称（原文のまま。翻訳しません） */
  name: string;
  url?: string;
  /** 商用利用が許可されているか */
  commercialUseAllowed: boolean;
  /** 改変が許可されているか */
  derivativeWorksAllowed: boolean;
  /** 継承（ShareAlike）が必要か */
  shareAlikeRequired: boolean;
  /** クレジット表示が必要か */
  attributionRequired: boolean;
  /** パブリックドメイン相当か */
  isPublicDomain: boolean;
  /** 自動公開の候補にしてよいか（PD / CC0 のみ true） */
  autoApprovable: boolean;
};

/**
 * 画像の検証状態。
 * 公開してよいのは approved だけです。それ以外は必ず代替表示になります。
 */
export type VerificationStatus =
  | "pending" // 取得直後。未検証
  | "approved" // 人間または自動判定で承認済み
  | "rejected" // 却下
  | "needs_review" // 人間の確認が必要（CC BY / 人物 / 建築物 など）
  | "license_unknown" // ライセンス判定不能
  | "rights_risk"; // 追加権利のリスクあり（肖像・商標・建築著作物など）

/** 画像ライセンス以外に発生しうる追加権利。該当したら自動公開しません。 */
export type RightsRiskFlag =
  | "living_person" // 存命人物
  | "public_figure" // 著名人・政治家・スポーツ選手
  | "child" // 子ども
  | "trademark" // 商標・ロゴ
  | "product" // 商品・券面
  | "artwork" // 美術作品・彫刻
  | "architecture" // 建築著作物（パノラマの自由が国により異なる）
  | "event" // イベント会場（撮影条件）
  | "indoor" // 建物内部
  | "unknown_subject"; // 被写体が判別できない

export type UsageStatus = "unused" | "in_use" | "suspended";

/**
 * 1つの Commons ファイルを表す正規化済みレコード。
 *
 * 同じ画像を複数ページで使う場合も、この型は1件だけ保持し、
 * 掲載先は WikimediaAssetUsage 側で管理します（重複保存しない）。
 */
export type WikimediaAsset = {
  id: string;
  /** Commons のページID（数値）。取得できなければ undefined */
  commonsPageId?: number;
  /** 関連する Wikidata エンティティ（Q番号） */
  wikidataEntityId?: string;

  /** 例: "File:Example.jpg" */
  fileName: string;
  title: string;
  description?: string;

  /** 原寸画像のURL */
  originalUrl: string;
  /** サムネイルURL（幅指定で取得したもの） */
  thumbnailUrl?: string;
  /** Commons のファイルページURL。クレジットのリンク先になります */
  commonsPageUrl: string;

  mimeType: string;
  width: number;
  height: number;
  /** width / height。レイアウト確保（CLS防止）に使います */
  aspectRatio: number;

  /** 作者名（原文のまま保持。翻訳しません） */
  authorName?: string;
  authorUrl?: string;
  /** 出典（撮影元・所蔵機関など） */
  sourceName?: string;
  sourceUrl?: string;

  licenseCode: LicenseCode;
  /** ライセンス正式名称（原文のまま） */
  licenseName: string;
  licenseUrl?: string;
  licenseVersion?: string;
  /** パブリックドメインの根拠（PD-old-70 など） */
  publicDomainBasis?: string;
  /** Commons が提示する推奨クレジット文（あれば優先して使います） */
  attributionText?: string;

  commercialUseAllowed: boolean;
  derivativeWorksAllowed: boolean;
  shareAlikeRequired: boolean;
  isPublicDomain: boolean;

  /** 当サイト側で加工したか */
  isModified: boolean;
  modificationDescription?: string;

  /** 取得日時（ISO8601） */
  retrievedAt: string;
  /** 最終確認日時。定期再確認の起点になります */
  verifiedAt?: string;
  verificationStatus: VerificationStatus;
  usageStatus: UsageStatus;

  /** 追加権利のリスク。1つでもあれば自動公開しません */
  rightsRisks: RightsRiskFlag[];
  /** 却下・保留の理由（人間が読む用） */
  reviewNote?: string;

  /** 代替テキスト（言語別）。装飾用途は空文字 */
  altText: Record<string, string>;
  /** キャプション（言語別） */
  caption?: Record<string, string>;

  /**
   * 被写体が切れないための表示位置。
   * 人物なら顔、建物なら全景が残るように指定します。
   */
  objectPosition?: string;

  /** API 応答の生データ（監査・再判定用） */
  metadataRaw?: Record<string, unknown>;
};

/** 画像とページの関連。画像本体は重複保存しません。 */
export type WikimediaAssetUsage = {
  assetId: string;
  /** 掲載ページのパス（ロケールを含まない） */
  path: string;
  /** どのスロットで使うか */
  slot: "hero" | "card" | "thumbnail" | "inline" | "ogp" | "background";
  /** 表示順（同一ページ内で複数使う場合） */
  order: number;
  /** このページ専用のキャプション上書き（言語別） */
  captionOverride?: Record<string, string>;
};

/** 検証ログ。誰がいつ何を判断したかを残します。 */
export type ImageVerificationLog = {
  id: string;
  assetId: string;
  at: string;
  actor: string;
  from: VerificationStatus;
  to: VerificationStatus;
  note?: string;
};

/** 取得に失敗した／却下した候補の記録。同じ画像を何度も拾わないために残します。 */
export type ImageRejection = {
  fileName: string;
  reason:
    | "license_not_allowed"
    | "license_unknown"
    | "author_unknown"
    | "source_unknown"
    | "resolution_too_low"
    | "rights_risk"
    | "irrelevant"
    | "manual";
  detail?: string;
  at: string;
};

/**
 * 画像が無いときに使う代替表現。
 *
 * 「適切な画像が見つからないなら無理に載せない」方針のため、
 * フォールバックは例外処理ではなく通常の表示手段のひとつとして設計します。
 */
export type FallbackVisual = {
  /** 決定的に配色・図形を決めるための種文字列（スラッグなど） */
  seed: string;
  /** 主要色（競技・カテゴリのアクセント） */
  accent: string;
  /** 中央に置く記号（絵文字・イニシャルなど） */
  glyph?: string;
  /** 図形パターン */
  pattern: "orbit" | "grid" | "wave" | "burst" | "mesh";
};
