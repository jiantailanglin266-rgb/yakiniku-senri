/**
 * ライセンス名の正規化。
 *
 * Commons の `extmetadata` が返す文字列は表記が揺れます。
 * 判定を1か所に集約し、少しでも読み取れない場合は UNKNOWN を返します
 * （「たぶん CC BY だろう」という推測はしません）。
 */
import { licenses } from "../config/licenses";
import type { License, LicenseCode } from "../types";

/** 比較用に記号と大小文字を落とします */
function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9.\-+]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** 表記揺れ → LicenseCode の対応表（正規化後のキーで引きます） */
const aliases: Record<string, LicenseCode> = {
  // Public domain
  "public-domain": "PD",
  pd: "PD",
  "pd-old": "PD",
  "pd-old-70": "PD",
  "pd-old-100": "PD",
  "pd-us": "PD",
  "pd-usgov": "PD",
  "pd-self": "PD",
  "pd-art": "PD",
  "public-domain-mark": "PD",
  "no-restrictions": "PD",

  // CC0
  cc0: "CC0",
  "cc0-1.0": "CC0",
  "cc-zero": "CC0",
  "creative-commons-zero": "CC0",
  "creative-commons-cc0-1.0-universal": "CC0",

  // GFDL
  gfdl: "GFDL",
  "gnu-free-documentation-license": "GFDL",
  "gfdl-1.2": "GFDL",
  "gfdl-1.3": "GFDL",

  // 非自由
  "fair-use": "FAIR-USE",
  fairuse: "FAIR-USE",
  "non-free": "FAIR-USE",
  "all-rights-reserved": "ALL-RIGHTS-RESERVED",
  copyrighted: "ALL-RIGHTS-RESERVED",
};

/**
 * CC ライセンスをパターンで拾います。
 * バージョンが取れない場合は最新版と決めつけず、バージョン無しのコードへ寄せます。
 */
function matchCreativeCommons(key: string): LicenseCode | null {
  const nc = /(^|-)nc(-|$)/.test(key) || key.includes("noncommercial");
  const nd = /(^|-)nd(-|$)/.test(key) || key.includes("noderiv");
  const sa = /(^|-)sa(-|$)/.test(key) || key.includes("sharealike");
  const by = /(^|-)by(-|$)/.test(key) || key.includes("attribution");

  if (!by && !sa && !nc && !nd) return null;

  if (nc) return sa ? "CC-BY-NC-SA" : "CC-BY-NC";
  if (nd) return "CC-BY-ND";

  const version = key.match(/(\d\.\d)/)?.[1];
  if (!version) {
    // バージョン不明の CC は自動掲載できません。判定を UNKNOWN に倒します
    return "UNKNOWN";
  }

  const code = (sa ? `CC-BY-SA-${version}` : `CC-BY-${version}`) as LicenseCode;
  return code in licenses ? code : "UNKNOWN";
}

/**
 * ライセンス文字列を LicenseCode へ正規化します。
 * 判定できない場合は必ず UNKNOWN を返します。
 */
export function normalizeLicense(raw: string | null | undefined): LicenseCode {
  if (!raw) return "UNKNOWN";
  const key = normalizeKey(raw);
  if (!key) return "UNKNOWN";

  if (aliases[key]) return aliases[key];

  // "pd-old-70-expired" のような前方一致
  for (const [alias, code] of Object.entries(aliases)) {
    if (key.startsWith(`${alias}-`)) return code;
  }

  const cc = matchCreativeCommons(key);
  if (cc) return cc;

  return "UNKNOWN";
}

export function getLicense(code: LicenseCode): License {
  return licenses[code] ?? licenses.UNKNOWN;
}

/**
 * 複数のライセンス表記（Commons はデュアルライセンスを返すことがあります）から
 * 「もっとも制約の少ないもの」を選びます。
 * ただし、1つでも読み取れないものがあれば、その事実を呼び出し側へ伝えます。
 */
export function pickBestLicense(raws: (string | null | undefined)[]): {
  code: LicenseCode;
  hadUnknown: boolean;
} {
  const codes = raws.filter(Boolean).map((raw) => normalizeLicense(raw));
  if (codes.length === 0) return { code: "UNKNOWN", hadUnknown: true };

  const hadUnknown = codes.includes("UNKNOWN");
  // 自動掲載できるもの → PD/CC0 を優先し、次に継承なし、最後に継承あり
  const rank = (code: LicenseCode): number => {
    const license = getLicense(code);
    if (!license.autoUsable) return 100;
    if (license.isPublicDomain) return 0;
    if (!license.shareAlikeRequired) return 1;
    return 2;
  };
  const best = [...codes].sort((a, b) => rank(a) - rank(b))[0];
  return { code: best, hadUnknown };
}
