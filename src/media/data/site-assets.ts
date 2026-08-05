/**
 * Wikimedia 以外の画像素材の出所台帳。
 *
 * ============================================================
 * ⚠ ライセンスが自由な素材でも、条件はあります。
 *   MIT は「著作権表示と許諾表示を複製物に含めること」が条件です。
 *   条件を満たしているかを人が確認できるよう、
 *   作者・出典・ライセンス・全文の置き場所をここに残します。
 *
 * ⚠ 推測を書きません。
 *   出所を確認できていないものは `verifiedAt: null` とし、
 *   「未確認」であることをそのまま画面に出します。
 *   出所不明を「自作」と書くと、記録として意味を失います。
 * ============================================================
 *
 * Wikimedia Commons から取得した画像はここに入りません。
 * そちらは `src/media/data/assets.ts` が唯一の情報源です
 * （取得日・検証日をスクリプトが管理するため、手書きと混ぜません）。
 */

export type SiteAssetOrigin =
  /** このリポジトリで生成・撮影したもの */
  | "first-party"
  /** 他者の素材を、ライセンスに従って使っているもの */
  | "third-party"
  /** 出所の記録が無く、確認が必要なもの */
  | "unverified";

export type SiteAssetCredit = {
  id: string;
  /** 画面に出す名前 */
  label: string;
  origin: SiteAssetOrigin;
  /** 素材の置き場所（リポジトリ内のパス） */
  path: string;
  fileCount: number;

  /* --- 作者・出典 --- */
  authorName: string | null;
  authorUrl: string | null;
  sourceName: string | null;
  sourceUrl: string | null;

  /* --- ライセンス --- */
  licenseCode: string;
  licenseName: string;
  licenseUrl: string | null;
  /**
   * ライセンス全文をサイト内に置いた場所。
   * MIT のように「著作権表示と許諾表示の保持」が条件のものは必須です。
   */
  licenseTextPath: string | null;

  /* --- 改変 --- */
  isModified: boolean;
  modificationDescription: string | null;

  /* --- 使用箇所と確認 --- */
  usedOn: string[];
  /** 確認日（YYYY-MM-DD）。null は未確認。 */
  verifiedAt: string | null;
  /** 何をもって確認としたか。未確認なら、何が分かっていないかを書きます。 */
  verificationNote: string;
};

export const siteAssetCredits: SiteAssetCredit[] = [
  {
    id: "flag-icons",
    label: "言語切り替えの国旗（42点）",
    origin: "third-party",
    path: "public/images/flags/",
    fileCount: 42,
    authorName: "Panayiotis Lipiridis",
    authorUrl: "https://github.com/lipis",
    sourceName: "flag-icons",
    sourceUrl: "https://github.com/lipis/flag-icons",
    licenseCode: "MIT",
    licenseName: "The MIT License (MIT)",
    licenseUrl: "https://github.com/lipis/flag-icons/blob/main/LICENSE",
    licenseTextPath: "/licenses/flag-icons-LICENSE.txt",
    isModified: true,
    modificationDescription:
      "表示サイズに合わせ、SVG を 48×36 の WebP へ変換（リサイズと形式変換のみ。意匠は変更していません）",
    usedOn: ["CARD PORT の全ページ（言語切り替え）"],
    verifiedAt: "2026-08-04",
    verificationNote:
      "リポジトリの履歴（コミット 27f0552）に flag-icons を変換した記録があり、配布元の LICENSE 原文を取得して著作権者名と本文を照合しました。全文は /licenses/flag-icons-LICENSE.txt に掲載しています。",
  },
  {
    id: "cardport-generated",
    label: "CARD PORT の OGP・アイコン",
    origin: "first-party",
    path: "public/images/cardport/",
    fileCount: 6,
    authorName: "サイト運営者",
    authorUrl: null,
    sourceName: "自作（scripts/generate-cardport-assets.mjs で生成）",
    sourceUrl: null,
    licenseCode: "自作",
    licenseName: "サイト運営者が権利を持つ素材",
    licenseUrl: null,
    licenseTextPath: null,
    isModified: false,
    modificationDescription: null,
    usedOn: ["CARD PORT の各ページ", "SNS シェア時のサムネイル"],
    verifiedAt: "2026-08-04",
    verificationNote:
      "生成スクリプトがリポジトリ内にあり、同じ出力を再現できます。外部素材・外部フォントを含みません。",
  },
];

/** 他者の素材だけを返します（クレジット表示が必要なもの）。 */
export function getThirdPartyCredits(): SiteAssetCredit[] {
  return siteAssetCredits.filter((credit) => credit.origin === "third-party");
}

/** ライセンス全文の保持が条件になっている素材。 */
export function getCreditsRequiringLicenseText(): SiteAssetCredit[] {
  return siteAssetCredits.filter((credit) => credit.licenseTextPath !== null);
}

/** 出所が確認できていない素材（棚卸しの残件）。 */
export function getUnverifiedCredits(): SiteAssetCredit[] {
  return siteAssetCredits.filter((credit) => credit.origin === "unverified");
}
