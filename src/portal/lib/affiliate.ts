/**
 * アフィリエイトリンクの解決。
 *
 * ■ 方針
 *   - 実URLはコードに書かず、環境変数で差し替えます（`AFF_*`）。
 *   - 環境変数が未設定なら公式URLへ通常リンクし、広告表記も出しません。
 *     設定していないのに「PR」と表示するのは、事実と異なるためです。
 *   - 広告リンクには必ず `rel="sponsored nofollow noopener"` を付けます。
 *   - 掲載期間を過ぎたリンクは自動で通常リンクへ落とし、リンク切れを防ぎます。
 *   - クリックは設置場所（placement）付きで計測します。
 */

import type { AffiliateLinkDef } from "./types";

export const affiliateLinks: AffiliateLinkDef[] = [
  {
    id: "aff-bitbank",
    envKey: "AFF_BITBANK",
    fallbackUrl: "https://bitbank.cc/",
    program: "bitbank",
  },
  {
    id: "aff-bitflyer",
    envKey: "AFF_BITFLYER",
    fallbackUrl: "https://bitflyer.com/ja-jp/",
    program: "bitflyer",
  },
  {
    id: "aff-coincheck",
    envKey: "AFF_COINCHECK",
    fallbackUrl: "https://coincheck.com/ja/",
    program: "coincheck",
  },
  {
    id: "aff-gmo-coin",
    envKey: "AFF_GMO_COIN",
    fallbackUrl: "https://coin.z.com/jp/",
    program: "gmo-coin",
  },
  {
    id: "aff-sbi-vc",
    envKey: "AFF_SBI_VC",
    fallbackUrl: "https://www.sbivc.co.jp/",
    program: "sbi-vc",
  },
];

const linkById = new Map(affiliateLinks.map((link) => [link.id, link]));

/**
 * 環境変数の読み取り。
 *
 * ⚠ `process.env` は Next.js のビルド時に静的置換されるため、
 *   `process.env[variable]` のような動的アクセスは値が入りません。
 *   そのため、参照するキーをここで明示的に列挙しています。
 *   アフィリエイト先を追加したら、この表にも1行足してください。
 */
const affiliateEnv: Record<string, string | undefined> = {
  AFF_BITBANK: process.env.AFF_BITBANK,
  AFF_BITFLYER: process.env.AFF_BITFLYER,
  AFF_COINCHECK: process.env.AFF_COINCHECK,
  AFF_GMO_COIN: process.env.AFF_GMO_COIN,
  AFF_SBI_VC: process.env.AFF_SBI_VC,
};

export type ResolvedLink = {
  href: string;
  /** 広告リンクかどうか。true のときだけ PR 表記と rel="sponsored" を出します */
  sponsored: boolean;
  /** 計測用のプログラム名 */
  program?: string;
};

/**
 * リンクを解決します。
 * @param affiliateId アフィリエイト定義のID（未設定なら通常リンク）
 * @param fallbackUrl 公式サイトのURL
 */
export function resolveLink(
  affiliateId: string | undefined,
  fallbackUrl: string,
  now = Date.now(),
): ResolvedLink {
  if (!affiliateId) return { href: fallbackUrl, sponsored: false };

  const def = linkById.get(affiliateId);
  if (!def) return { href: fallbackUrl, sponsored: false };

  // 掲載期間外は通常リンクに落とします
  if (def.startsAt && Date.parse(def.startsAt) > now) {
    return { href: def.fallbackUrl || fallbackUrl, sponsored: false };
  }
  if (def.endsAt && Date.parse(def.endsAt) < now) {
    return { href: def.fallbackUrl || fallbackUrl, sponsored: false };
  }

  const configured = affiliateEnv[def.envKey];
  if (!configured) {
    // 未設定なら公式サイトへ。広告ではないので PR 表記も出しません
    return { href: def.fallbackUrl || fallbackUrl, sponsored: false };
  }
  return { href: configured, sponsored: true, program: def.program };
}

/** 広告リンクに付ける rel。noopener は必須（タブナビング対策） */
export const SPONSORED_REL = "sponsored nofollow noopener noreferrer";
export const EXTERNAL_REL = "noopener noreferrer";
