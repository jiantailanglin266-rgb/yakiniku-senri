/**
 * ライセンスのホワイトリストと正規化辞書。
 *
 * ■ 表記揺れを1つに寄せる
 *   Commons の `extmetadata.LicenseShortName` は
 *   "CC BY-SA 4.0" / "Creative Commons Attribution-ShareAlike 4.0" /
 *   "cc-by-sa-4.0" のように揺れます。すべて同じコードへ正規化します。
 *
 * ■ 自動掲載の対象
 *   `autoUsable: true` は「ライセンスとして自動掲載を許可しうる」という意味であり、
 *   これだけで掲載が決まるわけではありません。
 *   作者・出典が揃っていること、追加権利のリスクが無いことを別途判定します
 *   （lib/eligibility.ts）。
 */
import type { License, LicenseCode } from "../types";

const CC = "https://creativecommons.org/licenses";

export const licenses: Record<LicenseCode, License> = {
  PD: {
    code: "PD",
    name: "Public domain",
    url: "https://en.wikipedia.org/wiki/Public_domain",
    commercialUseAllowed: true,
    derivativeWorksAllowed: true,
    shareAlikeRequired: false,
    attributionRequired: false,
    isPublicDomain: true,
    autoUsable: true,
  },
  CC0: {
    code: "CC0",
    name: "CC0 1.0 Universal",
    url: "https://creativecommons.org/publicdomain/zero/1.0/",
    version: "1.0",
    commercialUseAllowed: true,
    derivativeWorksAllowed: true,
    shareAlikeRequired: false,
    attributionRequired: false,
    isPublicDomain: true,
    autoUsable: true,
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

  // --- 以下はいずれも自動掲載しません ---
  "CC-BY-NC": {
    code: "CC-BY-NC",
    name: "CC BY-NC",
    url: `${CC}/by-nc/4.0/`,
    commercialUseAllowed: false,
    derivativeWorksAllowed: true,
    shareAlikeRequired: false,
    attributionRequired: true,
    isPublicDomain: false,
    autoUsable: false,
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
    autoUsable: false,
  },
  "CC-BY-ND": {
    code: "CC-BY-ND",
    name: "CC BY-ND",
    url: `${CC}/by-nd/4.0/`,
    commercialUseAllowed: true,
    // 改変不可のため、トリミング・オーバーレイを伴う当サイトの表示には使えません
    derivativeWorksAllowed: false,
    shareAlikeRequired: false,
    attributionRequired: true,
    isPublicDomain: false,
    autoUsable: false,
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
    // ライセンス全文の同梱義務があり、Webでの運用が煩雑なため自動掲載しません
    autoUsable: false,
  },
  "FAIR-USE": {
    code: "FAIR-USE",
    name: "Fair use",
    url: "https://en.wikipedia.org/wiki/Fair_use",
    commercialUseAllowed: false,
    derivativeWorksAllowed: false,
    shareAlikeRequired: false,
    attributionRequired: true,
    isPublicDomain: false,
    autoUsable: false,
  },
  "ALL-RIGHTS-RESERVED": {
    code: "ALL-RIGHTS-RESERVED",
    name: "All rights reserved",
    url: "",
    commercialUseAllowed: false,
    derivativeWorksAllowed: false,
    shareAlikeRequired: false,
    attributionRequired: true,
    isPublicDomain: false,
    autoUsable: false,
  },
  UNKNOWN: {
    code: "UNKNOWN",
    name: "Unknown",
    url: "",
    commercialUseAllowed: false,
    derivativeWorksAllowed: false,
    shareAlikeRequired: false,
    attributionRequired: true,
    isPublicDomain: false,
    autoUsable: false,
  },
};

function ccBy(version: string): License {
  return {
    code: `CC-BY-${version}` as LicenseCode,
    name: `CC BY ${version}`,
    url: `${CC}/by/${version}/`,
    version,
    commercialUseAllowed: true,
    derivativeWorksAllowed: true,
    shareAlikeRequired: false,
    attributionRequired: true,
    isPublicDomain: false,
    autoUsable: true,
  };
}

function ccBySa(version: string): License {
  return {
    code: `CC-BY-SA-${version}` as LicenseCode,
    name: `CC BY-SA ${version}`,
    url: `${CC}/by-sa/${version}/`,
    version,
    commercialUseAllowed: true,
    derivativeWorksAllowed: true,
    shareAlikeRequired: true,
    attributionRequired: true,
    isPublicDomain: false,
    autoUsable: true,
  };
}

/**
 * 自動掲載を許可するライセンス。
 *
 * 環境変数 `MEDIA_LICENSE_WHITELIST`（カンマ区切り）で上書きできます。
 * 既定は Public Domain と CC0 のみ。
 * CC BY / CC BY-SA は作者表示と継承の運用が要るため、
 * 既定では「人の確認を挟む」扱いにしています。
 */
export function getWhitelist(): LicenseCode[] {
  const override = process.env.MEDIA_LICENSE_WHITELIST;
  if (override) {
    return override
      .split(",")
      .map((value) => value.trim().toUpperCase())
      .filter((value): value is LicenseCode => value in licenses);
  }
  return ["PD", "CC0"];
}

/**
 * 人の確認を挟んだうえで掲載を許可しうるライセンス。
 * ここに無いライセンスは、確認しても掲載しません。
 */
export function getReviewableLicenses(): LicenseCode[] {
  return (Object.keys(licenses) as LicenseCode[]).filter((code) => licenses[code].autoUsable);
}
