/**
 * アフィリエイトリンクの一元管理。
 *
 * ■ ここに集約する理由
 *   `rel` の付け忘れ、計測パラメータの抜け、期限切れリンクの放置は、
 *   個別のコンポーネントに分散させると必ず起きます。
 *   広告リンクは必ずこのモジュールを通してください。
 *
 * ■ ランキングとの分離
 *   このモジュールは順位算出（scoring.ts）から参照されません。
 *   報酬額が順位に影響しない構造を、コードの依存関係で担保しています。
 */
import { affiliateSiteId } from "@/cardport/config/site";
import type { Locale } from "@/cardport/i18n/locales";

export type AffiliateLink = {
  id: string;
  /** 提携先の名称（表示用） */
  program: string;
  /** 実際の遷移先。未提携なら空文字にして公式サイトへフォールバックします */
  url: string;
  /** 掲載終了日（ISO 8601）。過ぎたら公式サイトへ自動で切り替えます */
  expiresOn?: string;
  /** 地域別リンク。キーは ISO 3166-1 alpha-2 */
  regionUrls?: Record<string, string>;
  /** ABテスト用のバリアント */
  variants?: { id: string; url: string }[];
};

/**
 * 提携リンク定義（初期値はすべて未提携）。
 *
 * ⚠ `url` が空のあいだは、カードの `officialUrl` へ通常リンク（rel="nofollow"）で遷移します。
 *   広告リンクとして計測・表示されるのは、実際に提携が成立してからです。
 */
export const affiliateLinks: Record<string, AffiliateLink> = {
  "nova-zero": { id: "nova-zero", program: "Nova Financial", url: "" },
  "nova-flux": { id: "nova-flux", program: "Nova Financial", url: "" },
  "nova-travel": { id: "nova-travel", program: "Nova Financial", url: "" },
  "nova-student": { id: "nova-student", program: "Nova Financial", url: "" },
  "meridian-gold": { id: "meridian-gold", program: "Meridian Bank", url: "" },
  "meridian-classic": { id: "meridian-classic", program: "Meridian Bank", url: "" },
  "meridian-sky": { id: "meridian-sky", program: "Meridian Bank", url: "" },
  "aurum-platinum": { id: "aurum-platinum", program: "Aurum Club", url: "" },
  "orbit-business": { id: "orbit-business", program: "Orbit Payments", url: "" },
  "orbit-business-gold": { id: "orbit-business-gold", program: "Orbit Payments", url: "" },
  "orbit-solo": { id: "orbit-solo", program: "Orbit Payments", url: "" },
  "orbit-virtual": { id: "orbit-virtual", program: "Orbit Payments", url: "" },
  "hoshimart-plus": { id: "hoshimart-plus", program: "Hoshi Mart", url: "" },
  "hoshimart-gold": { id: "hoshimart-gold", program: "Hoshi Mart", url: "" },
  "linkmobile-one": { id: "linkmobile-one", program: "Link Mobile", url: "" },
  "chainbridge-flow": { id: "chainbridge-flow", program: "ChainBridge", url: "" },
  "chainbridge-nova": { id: "chainbridge-nova", program: "ChainBridge", url: "" },
};

/** 掲載位置。クリック計測の粒度になります */
export type Placement =
  | "hero"
  | "ranking"
  | "card-list"
  | "card-detail"
  | "comparison"
  | "diagnosis-result"
  | "simulator-result"
  | "campaign"
  | "feature"
  | "news"
  | "video"
  | "business"
  | "web3"
  | "tools"
  | "chatbot";

export type ResolvedLink = {
  href: string;
  /** 広告リンクか（表示ラベルの出し分けに使います） */
  isSponsored: boolean;
  rel: string;
  target: "_blank";
  /** 計測用のデータ属性 */
  data: Record<string, string>;
};

export type ResolveInput = {
  affiliateId?: string;
  officialUrl: string;
  placement: Placement;
  locale: Locale;
  /** カード・サービスの識別子 */
  itemId: string;
  /** 表示していた順位（ランキング内など）。無ければ 0 */
  position?: number;
  /** 利用者の地域（ISO 3166-1 alpha-2）。未指定なら既定リンク */
  region?: string;
  today?: Date;
};

/**
 * リンクを解決します。
 *
 * - 提携リンクが無い / 期限切れ → 公式サイトへ `nofollow`（広告ではないので `sponsored` を付けません）
 * - 提携リンクがある → `sponsored nofollow noopener` を付与し、計測パラメータを付ける
 */
export function resolveLink({
  affiliateId,
  officialUrl,
  placement,
  locale,
  itemId,
  position = 0,
  region,
  today = new Date(),
}: ResolveInput): ResolvedLink {
  const link = affiliateId ? affiliateLinks[affiliateId] : undefined;
  const expired = link?.expiresOn
    ? new Date(`${link.expiresOn}T23:59:59Z`).getTime() < today.getTime()
    : false;
  const regional = region && link?.regionUrls ? link.regionUrls[region] : undefined;
  const target = regional ?? link?.url ?? "";
  const isSponsored = Boolean(target) && !expired;

  const data: Record<string, string> = {
    "data-cp-item": itemId,
    "data-cp-placement": placement,
    "data-cp-locale": locale,
    "data-cp-position": String(position),
    "data-cp-sponsored": String(isSponsored),
  };

  if (!isSponsored) {
    return {
      href: officialUrl,
      isSponsored: false,
      rel: "nofollow noopener noreferrer",
      target: "_blank",
      data,
    };
  }

  return {
    href: withTracking(target, { placement, locale, itemId, position }),
    isSponsored: true,
    rel: "sponsored nofollow noopener noreferrer",
    target: "_blank",
    data,
  };
}

function withTracking(
  url: string,
  params: { placement: Placement; locale: Locale; itemId: string; position: number },
): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("utm_source", affiliateSiteId);
    parsed.searchParams.set("utm_medium", "affiliate");
    parsed.searchParams.set("utm_campaign", params.placement);
    parsed.searchParams.set("utm_content", params.itemId);
    parsed.searchParams.set("cp_lang", params.locale);
    if (params.position > 0) parsed.searchParams.set("cp_pos", String(params.position));
    return parsed.toString();
  } catch {
    // 相対パスや不正なURLはそのまま返します（計測より遷移を優先）
    return url;
  }
}

/** 掲載中の提携リンクがあるか（PRラベルの表示判定） */
export function hasActiveAffiliate(affiliateId: string | undefined, today = new Date()): boolean {
  if (!affiliateId) return false;
  const link = affiliateLinks[affiliateId];
  if (!link || !link.url) return false;
  if (!link.expiresOn) return true;
  return new Date(`${link.expiresOn}T23:59:59Z`).getTime() >= today.getTime();
}

/** 未設定・期限切れのリンクを洗い出します（管理画面のリンク切れ検知） */
export function auditAffiliateLinks(today = new Date()) {
  return Object.values(affiliateLinks).map((link) => ({
    id: link.id,
    program: link.program,
    status: !link.url
      ? ("unset" as const)
      : link.expiresOn && new Date(`${link.expiresOn}T23:59:59Z`).getTime() < today.getTime()
        ? ("expired" as const)
        : ("active" as const),
  }));
}
