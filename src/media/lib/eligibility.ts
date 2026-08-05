/**
 * 掲載可否の判定。
 *
 * ■ 判定の順序
 *   1. ライセンスを読み取れたか        → 読めなければ license_unknown
 *   2. 商用利用・改変が許可されているか → 不可なら rejected
 *   3. 作者・出典が揃っているか        → 欠けていれば needs_review
 *   4. 追加権利のリスクがあるか        → あれば rights_risk
 *   5. ホワイトリスト対象か            → 対象なら approved 候補、それ以外は needs_review
 *
 * ■ 「ライセンスが自由 ＝ 掲載してよい」ではありません
 *   肖像権・商標・建築著作物・美術作品などは、画像のライセンスとは別の権利です。
 *   ここでは語彙による機械判定でリスクを拾い、必ず人の確認へ回します。
 */
import { getLicense } from "./license";
import { getWhitelist } from "../config/licenses";
import type { RightsRisk, VerificationStatus, WikimediaAsset } from "../types";

/**
 * 追加権利のリスクを示す語彙。
 *
 * ファイル名・説明・カテゴリに含まれていたら、人の確認へ回します。
 * 取りこぼしより「余分に確認へ回す」ほうが安全なので、広めに取っています。
 */
const riskVocabulary: { risk: RightsRisk; terms: string[] }[] = [
  {
    risk: "living-person",
    terms: ["portrait", "headshot", "selfie", "人物", "肖像", "ポートレート"],
  },
  {
    risk: "public-figure",
    terms: ["ceo", "president", "founder", "chairman", "celebrity", "著名", "社長", "会長"],
  },
  { risk: "athlete", terms: ["player", "athlete", "footballer", "選手", "アスリート"] },
  { risk: "politician", terms: ["politician", "minister", "senator", "議員", "大臣", "政治家"] },
  { risk: "child", terms: ["child", "children", "kid", "student portrait", "子ども", "児童"] },
  { risk: "company-logo", terms: ["logo", "wordmark", "brandmark", "ロゴ", "商標"] },
  { risk: "product", terms: ["product", "packaging", "商品", "パッケージ"] },
  {
    risk: "card-face",
    terms: ["credit card", "debit card", "bank card", "クレジットカード", "券面"],
  },
  { risk: "artwork", terms: ["painting", "artwork", "illustration by", "絵画", "作品"] },
  { risk: "sculpture", terms: ["sculpture", "statue", "monument", "彫刻", "銅像"] },
  { risk: "building-interior", terms: ["interior", "lobby", "内装", "館内"] },
  { risk: "architecture", terms: ["building", "tower", "architecture", "建築", "ビル"] },
  {
    risk: "event-photo",
    terms: ["conference", "concert", "match", "ceremony", "イベント", "式典"],
  },
  { risk: "trademark", terms: ["trademark", "™", "®"] },
];

/** 撮影地によって建築物の自由（パノラマの自由）が異なる国 */
const restrictedPanoramaCountries = ["france", "italy", "belgium", "greece", "iceland", "ukraine"];

export type EligibilityInput = {
  licenseCode: WikimediaAsset["licenseCode"];
  authorName: string | null;
  sourceUrl: string | null;
  commonsPageUrl: string | null;
  /** 判定材料。ファイル名・説明・Commons のカテゴリなど */
  searchableText: string;
  width: number;
  height: number;
  /** 掲載予定の枠に必要な最小幅 */
  requiredMinWidth?: number;
};

export type EligibilityResult = {
  status: VerificationStatus;
  risks: RightsRisk[];
  notes: string[];
  /** 人の確認なしで公開してよいか */
  autoApprovable: boolean;
};

export function detectRightsRisks(text: string): RightsRisk[] {
  const haystack = text.toLowerCase();
  const found = new Set<RightsRisk>();

  for (const { risk, terms } of riskVocabulary) {
    if (terms.some((term) => haystack.includes(term.toLowerCase()))) found.add(risk);
  }
  if (restrictedPanoramaCountries.some((country) => haystack.includes(country))) {
    found.add("freedom-of-panorama");
  }
  return [...found];
}

export function evaluateEligibility(input: EligibilityInput): EligibilityResult {
  const notes: string[] = [];
  const license = getLicense(input.licenseCode);
  const risks = detectRightsRisks(input.searchableText);

  // 1. ライセンスを読み取れたか
  if (input.licenseCode === "UNKNOWN") {
    notes.push("ライセンスを機械的に特定できませんでした。推測で公開しません。");
    return { status: "license_unknown", risks, notes, autoApprovable: false };
  }

  // 2. 商用利用・改変
  if (!license.commercialUseAllowed) {
    notes.push(`${license.name} は商用利用が許可されていません。`);
    return { status: "rejected", risks, notes, autoApprovable: false };
  }
  if (!license.derivativeWorksAllowed) {
    notes.push(
      `${license.name} は改変が許可されていません。当サイトはトリミングとオーバーレイを行うため使用できません。`,
    );
    return { status: "rejected", risks, notes, autoApprovable: false };
  }

  // 3. 作者・出典
  if (license.attributionRequired && !input.authorName) {
    notes.push("作者表示が必要なライセンスですが、作者情報を取得できませんでした。");
    return { status: "needs_review", risks, notes, autoApprovable: false };
  }
  if (!input.commonsPageUrl) {
    notes.push("Wikimedia Commons のファイルページURLを取得できませんでした。");
    return { status: "needs_review", risks, notes, autoApprovable: false };
  }

  // 4. 解像度
  const minWidth = input.requiredMinWidth ?? 0;
  if (minWidth > 0 && input.width < minWidth) {
    notes.push(`解像度が不足しています（${input.width}px < 必要 ${minWidth}px）。`);
    return { status: "rejected", risks, notes, autoApprovable: false };
  }

  // 5. 追加権利のリスク
  if (risks.length > 0) {
    notes.push(
      `追加権利の確認が必要です（${risks.join(", ")}）。ライセンスとは別の権利のため、人が確認してください。`,
    );
    return { status: "rights_risk", risks, notes, autoApprovable: false };
  }

  // 6. ホワイトリスト
  const whitelist = getWhitelist();
  if (whitelist.includes(input.licenseCode)) {
    notes.push(`${license.name} はホワイトリスト対象です。作者・出典も揃っています。`);
    return { status: "approved", risks, notes, autoApprovable: true };
  }

  notes.push(
    `${license.name} は掲載可能なライセンスですが、作者表示${license.shareAlikeRequired ? "と継承条件" : ""}の運用確認のため人の承認が必要です。`,
  );
  return { status: "needs_review", risks, notes, autoApprovable: false };
}

/**
 * 実際に画面へ出してよいか。
 * コンポーネント側はこの関数だけを見ます。
 */
export function isPublishable(asset: WikimediaAsset): boolean {
  if (asset.verificationStatus !== "approved") return false;
  if (asset.usageStatus === "suspended") return false;
  if (!asset.commonsPageUrl) return false;
  if (asset.licenseCode === "UNKNOWN") return false;

  const license = getLicense(asset.licenseCode);
  if (!license.commercialUseAllowed) return false;
  // 作者表示が必要なのに作者が無い画像は、クレジットを出せないので表示しません
  if (license.attributionRequired && !asset.authorName) return false;
  return true;
}
