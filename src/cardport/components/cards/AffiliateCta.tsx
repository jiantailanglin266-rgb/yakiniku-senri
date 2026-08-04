"use client";

/**
 * 公式サイトへのCTA。
 *
 * リンクの解決（rel・計測・地域別・期限切れ）は `lib/affiliate.ts` に集約し、
 * ここでは表示とクリック計測だけを行います。
 *
 * ■ クリック計測
 *   静的配信でも動くよう、既定では `dataLayer` / `gtag` があればそこへ送り、
 *   無ければ何もしません（計測のために外部スクリプトを強制読み込みしません）。
 */
import { resolveLink, type Placement } from "@/cardport/lib/affiliate";
import type { Locale } from "@/cardport/i18n/locales";
import { AdLabel, cx } from "@/cardport/components/ui/primitives";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function AffiliateCta({
  itemId,
  officialUrl,
  affiliateId,
  placement,
  locale,
  label,
  adLabel,
  adTitle,
  position = 0,
  variant = "primary",
  className,
}: {
  itemId: string;
  officialUrl: string;
  affiliateId?: string;
  placement: Placement;
  locale: Locale;
  label: string;
  adLabel: string;
  adTitle: string;
  position?: number;
  variant?: "primary" | "outline";
  className?: string;
}) {
  const link = resolveLink({ affiliateId, officialUrl, placement, locale, itemId, position });

  const handleClick = () => {
    const payload = {
      event: "affiliate_click",
      item_id: itemId,
      placement,
      locale,
      position,
      sponsored: link.isSponsored,
    };
    if (typeof window === "undefined") return;
    if (Array.isArray(window.dataLayer)) window.dataLayer.push(payload);
    else if (typeof window.gtag === "function") window.gtag("event", "affiliate_click", payload);
  };

  const styles =
    variant === "primary"
      ? "bg-gradient-to-r from-cyan to-electric text-void font-semibold hover:brightness-110"
      : "glass text-ink hover:border-cyan/60";

  return (
    <span className="inline-flex items-center gap-2">
      <a
        href={link.href}
        target={link.target}
        rel={link.rel}
        onClick={handleClick}
        {...link.data}
        className={cx(
          "inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[0.8rem] transition-all duration-300",
          styles,
          className,
        )}
      >
        {label}
        <svg viewBox="0 0 14 14" className="h-3 w-3" aria-hidden="true">
          <path
            d="M5 2h7v7M12 2L3 11"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </a>
      {/* 広告リンクのときだけ PR を出します。未提携の公式リンクは広告ではありません */}
      {link.isSponsored ? <AdLabel label={adLabel} title={adTitle} /> : null}
    </span>
  );
}
