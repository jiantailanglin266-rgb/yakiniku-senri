/**
 * ライセンスの正規化と利用可否判定。
 *
 * ■ なぜ正規化が必要か
 *   Commons のライセンス表記は揺れます。
 *     "CC BY-SA 4.0" / "Creative Commons Attribution-ShareAlike 4.0 International"
 *     / "cc-by-sa-4.0" / "CC_BY_SA_4.0"
 *   これらを別物として扱うと、ホワイトリスト判定が素通りします。
 *
 * ■ 判定できないものは「使えない」に倒す
 *   未知の文字列は UNKNOWN にし、公開候補から外します。
 *   「たぶん CC BY だろう」という推測はしません。
 */
import type { LicenseCode, LicensePolicy, WikimediaAsset } from "./types";

/* ------------------------------------------------------------------
   ライセンス定義
   ------------------------------------------------------------------ */

const CC = "https://creativecommons.org/licenses";

export const licensePolicies: Record<LicenseCode, LicensePolicy> = {
  PD: {
    code: "PD",
    name: "Public domain",
    url: "https://commons.wikimedia.org/wiki/Commons:Licensing#Public_domain",
    commercialUseAllowed: true,
    derivativeWorksAllowed: true,
    shareAlikeRequired: false,
    // 法的には不要ですが、当サイトでは出典として作者を表示します
    attributionRequired: false,
    isPublicDomain: true,
    autoApprovable: true,
  },
  CC0: {
    code: "CC0",
    name: "CC0 1.0 Universal",
    url: "https://creativecommons.org/publicdomain/zero/1.0/",
    commercialUseAllowed: true,
    derivativeWorksAllowed: true,
    shareAlikeRequired: false,
    attributionRequired: false,
    isPublicDomain: true,
    autoApprovable: true,
  },

  "CC-BY-1.0": ccBy("1.0"),
  "CC-BY-2.0": ccBy("2.0"),
  "CC-BY-2.5": ccBy("2.5"),
  "CC-BY-3.0": ccBy("3.0"),
  "CC-BY-4.0": ccBy("4.0"),

  "CC-BY-SA-1.0": ccBySa("1.0"),
  "CC-BY-SA-2.0": ccBySa("2.0"),
  "CC-BY-SA-2.5": ccBySa("2.5"),
  "CC-BY-SA-3.0": ccBySa("3.0"),
  "CC-BY-SA-4.0": ccBySa("4.0"),

  "CC-BY-NC": {
    code: "CC-BY-NC",
    name: "CC BY-NC",
    url: `${CC}/by-nc/4.0/`,
    commercialUseAllowed: false,
    derivativeWorksAllowed: true,
    shareAlikeRequired: false,
    attributionRequired: true,
    isPublicDomain: false,
    autoApprovable: false,
  },
  "CC-BY-NC-SA": {
    code: "CC-BY-NC-SA",
    name: "CC BY-NC-SA",
    url: `${CC}/by-nc-sa/4.0/`,
    commercialUseAllowed: false,
    derivativeWorksAllowed: true,
    shareAlikeRequired: true,
    attributionRequired: true,
    isPublicDomain: false,
    autoApprovable: false,
  },
  "CC-BY-ND": {
    code: "CC-BY-ND",
    name: "CC BY-ND",
    url: `${CC}/by-nd/4.0/`,
    commercialUseAllowed: true,
    // 改変不可。トリミングやオーバーレイが改変にあたるため使いません
    derivativeWorksAllowed: false,
    shareAlikeRequired: false,
    attributionRequired: true,
    isPublicDomain: false,
    autoApprovable: false,
  },
  GFDL: {
    code: "GFDL",
    name: "GNU Free Documentation License",
    url: "https://www.gnu.org/licenses/fdl-1.3.html",
    commercialUseAllowed: true,
    derivativeWorksAllowed: true,
    shareAlikeRequired: true,
    attributionRequired: true,
    isPublicDomain: false,
    // ライセンス全文の同梱が必要で、Web掲載の要件が重いため人間の確認必須
    autoApprovable: false,
  },
  FAIR_USE: {
    code: "FAIR_USE",
    name: "Fair use",
    commercialUseAllowed: false,
    derivativeWorksAllowed: false,
    shareAlikeRequired: false,
    attributionRequired: true,
    isPublicDomain: false,
    autoApprovable: false,
  },
  ALL_RIGHTS_RESERVED: {
    code: "ALL_RIGHTS_RESERVED",
    name: "All rights reserved",
    commercialUseAllowed: false,
    derivativeWorksAllowed: false,
    shareAlikeRequired: false,
    attributionRequired: true,
    isPublicDomain: false,
    autoApprovable: false,
  },
  UNKNOWN: {
    code: "UNKNOWN",
    name: "Unknown",
    commercialUseAllowed: false,
    derivativeWorksAllowed: false,
    shareAlikeRequired: false,
    attributionRequired: true,
    isPublicDomain: false,
    autoApprovable: false,
  },
};

function ccBy(version: string): LicensePolicy {
  return {
    code: `CC-BY-${version}` as LicenseCode,
    name: `CC BY ${version}`,
    url: `${CC}/by/${version}/`,
    commercialUseAllowed: true,
    derivativeWorksAllowed: true,
    shareAlikeRequired: false,
    attributionRequired: true,
    isPublicDomain: false,
    // 作者表示が必須で、被写体の権利も絡みやすいため人間の確認を挟みます
    autoApprovable: false,
  };
}

function ccBySa(version: string): LicensePolicy {
  return {
    code: `CC-BY-SA-${version}` as LicenseCode,
    name: `CC BY-SA ${version}`,
    url: `${CC}/by-sa/${version}/`,
    commercialUseAllowed: true,
    derivativeWorksAllowed: true,
    shareAlikeRequired: true,
    attributionRequired: true,
    isPublicDomain: false,
    autoApprovable: false,
  };
}

/* ------------------------------------------------------------------
   ホワイトリスト（設定で変更できます）
   ------------------------------------------------------------------ */

/**
 * 掲載を許可するライセンス。
 * 環境変数 WIKIMEDIA_ALLOWED_LICENSES で上書きできます（カンマ区切り）。
 */
export function allowedLicenses(): LicenseCode[] {
  const configured = process.env.WIKIMEDIA_ALLOWED_LICENSES?.trim();
  if (configured) {
    return configured
      .split(",")
      .map((code) => normalizeLicense(code).code)
      .filter((code) => code !== "UNKNOWN");
  }
  return [
    "PD",
    "CC0",
    "CC-BY-2.0",
    "CC-BY-2.5",
    "CC-BY-3.0",
    "CC-BY-4.0",
    "CC-BY-SA-2.0",
    "CC-BY-SA-2.5",
    "CC-BY-SA-3.0",
    "CC-BY-SA-4.0",
  ];
}

/* ------------------------------------------------------------------
   正規化
   ------------------------------------------------------------------ */

/** 比較用に、記号と大小文字の揺れを落とします */
function canonical(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[（）()[\]]/g, "")
    .replace(/-+/g, "-")
    .trim();
}

const versionPattern = /(\d(?:\.\d)?)/;

/**
 * ライセンス文字列を正規化します。
 *
 * 判定できない場合は UNKNOWN を返します。
 * 「それっぽい」推測はしません（誤って商用不可の画像を通すため）。
 */
export function normalizeLicense(raw: string | null | undefined): LicensePolicy {
  if (!raw) return licensePolicies.UNKNOWN;
  const value = canonical(raw);

  // --- パブリックドメイン系 ---
  if (
    value === "cc0" ||
    value.startsWith("cc0-") ||
    value.includes("creative-commons-zero") ||
    value.includes("publicdomain/zero")
  ) {
    return licensePolicies.CC0;
  }
  if (
    value.includes("public-domain") ||
    value.startsWith("pd-") ||
    value === "pd" ||
    value.includes("no-known-copyright") ||
    value.includes("copyrighted-free-use")
  ) {
    return licensePolicies.PD;
  }

  // --- 使用不可を先に弾く（NC/ND は BY を含むため順序が重要） ---
  if (value.includes("nc-sa") || (value.includes("nc") && value.includes("sa"))) {
    return licensePolicies["CC-BY-NC-SA"];
  }
  if (value.includes("noncommercial") || /\bnc\b/.test(value) || value.includes("-nc-")) {
    return licensePolicies["CC-BY-NC"];
  }
  if (value.includes("noderiv") || value.includes("-nd-") || /\bnd\b/.test(value)) {
    return licensePolicies["CC-BY-ND"];
  }
  if (value.includes("fair-use") || value.includes("fairuse") || value.includes("non-free")) {
    return licensePolicies.FAIR_USE;
  }
  if (value.includes("all-rights-reserved") || value.includes("copyright")) {
    return licensePolicies.ALL_RIGHTS_RESERVED;
  }
  if (value.includes("gfdl") || value.includes("free-documentation")) {
    return licensePolicies.GFDL;
  }

  // --- CC BY-SA ---
  const isShareAlike = value.includes("sharealike") || value.includes("-sa-") || /-sa$/.test(value);
  const isAttribution =
    value.includes("attribution") || value.includes("cc-by") || /^by-/.test(value);

  if (isAttribution && isShareAlike) {
    const version = value.match(versionPattern)?.[1];
    const code = `CC-BY-SA-${version ?? "4.0"}` as LicenseCode;
    return licensePolicies[code] ?? licensePolicies.UNKNOWN;
  }
  if (isAttribution) {
    const version = value.match(versionPattern)?.[1];
    const code = `CC-BY-${version ?? "4.0"}` as LicenseCode;
    return licensePolicies[code] ?? licensePolicies.UNKNOWN;
  }

  return licensePolicies.UNKNOWN;
}

/* ------------------------------------------------------------------
   利用可否の判定
   ------------------------------------------------------------------ */

export type PublishDecision = {
  /** 公開してよいか */
  allowed: boolean;
  /** 自動承認の候補にしてよいか */
  autoApprovable: boolean;
  /**
   * 人間が承認しても解消できない障害。
   * ライセンス・作者・出典が欠けている場合はここに入り、公開できません。
   */
  blockers: string[];
  /**
   * 人間の確認で解消できる懸念（存命人物・商標・建築著作物など）。
   * 自動公開は止めますが、確認のうえ承認すれば公開できます。
   */
  risks: string[];
  /** 判定理由すべて（管理画面に出します） */
  reasons: string[];
};

/**
 * 画像を公開してよいかを判定します。
 *
 * 「取得できた」と「使ってよい」を分ける関数です。
 * ここを通らない画像は、UI 側で描画できません（WikimediaImage が拒否します）。
 */
export function evaluateAsset(asset: WikimediaAsset): PublishDecision {
  const blockers: string[] = [];
  const risks: string[] = [];
  const policy = licensePolicies[asset.licenseCode] ?? licensePolicies.UNKNOWN;
  const whitelist = allowedLicenses();

  if (policy.code === "UNKNOWN") {
    blockers.push("ライセンスを判定できません");
  } else if (!whitelist.includes(policy.code)) {
    blockers.push(`許可リストにないライセンスです（${policy.name}）`);
  }
  if (!policy.commercialUseAllowed) {
    blockers.push("商用利用が許可されていません");
  }
  if (!policy.derivativeWorksAllowed) {
    blockers.push("改変が許可されていません（トリミング・オーバーレイができません）");
  }

  // クレジット必須なのに作者が分からない画像は出せません
  if (policy.attributionRequired && !asset.authorName) {
    blockers.push("作者情報が取得できていません");
  }
  if (!asset.commonsPageUrl) {
    blockers.push("出典（Commons ファイルページ）が取得できていません");
  }
  // 画像URLが無ければ、そもそも表示できません
  if (!asset.originalUrl) {
    blockers.push("画像URLが取得できていません");
  }

  /**
   * 追加権利は「画像ライセンスとは別の権利」です。
   * 自動公開は止めますが、人間が確認して approved にした場合は公開できます。
   * （ここを恒久的な禁止にすると、確認済みの写真も永久に出せなくなります）
   */
  if (asset.rightsRisks.length > 0) {
    risks.push(`追加権利の確認が必要です（${asset.rightsRisks.join(", ")}）`);
  }

  const allowed = blockers.length === 0 && asset.verificationStatus === "approved";
  const autoApprovable =
    blockers.length === 0 &&
    risks.length === 0 &&
    policy.autoApprovable &&
    Boolean(asset.commonsPageUrl);

  return { allowed, autoApprovable, blockers, risks, reasons: [...blockers, ...risks] };
}

/**
 * 承認前の状態を、判定結果から決めます。
 *
 * 自動で approved になるのは
 *   「PD または CC0」かつ「作者・出典が取得できている」かつ「追加権利の懸念が無い」
 * ときだけです。1つでも欠けたら needs_review で保留し、推測で埋めません。
 */
export function initialStatus(asset: WikimediaAsset): WikimediaAsset["verificationStatus"] {
  const policy = licensePolicies[asset.licenseCode] ?? licensePolicies.UNKNOWN;
  if (policy.code === "UNKNOWN") return "license_unknown";
  if (!allowedLicenses().includes(policy.code)) return "rejected";
  if (asset.rightsRisks.length > 0) return "rights_risk";
  if (!asset.authorName || !asset.commonsPageUrl) return "needs_review";
  if (policy.autoApprovable) return "approved";
  return "needs_review";
}
