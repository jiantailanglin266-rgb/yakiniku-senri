"use client";

import type { ReactNode } from "react";
import { EXTERNAL_REL, SPONSORED_REL, type ResolvedLink } from "@/portal/lib/affiliate";
import { cx } from "./primitives";

/**
 * 外部リンク / アフィリエイトリンク。
 *
 * ■ 広告リンクの表示義務
 *   報酬が発生するリンクには、必ず「PR」表記と `rel="sponsored nofollow"` を付けます。
 *   逆に、環境変数が未設定で通常の公式リンクになっている場合は
 *   PR 表記を出しません（事実と異なるため）。
 *
 * ■ クリック計測
 *   設置場所（placement）付きで送ります。同じ取引所でも
 *   「比較表」と「診断結果」でクリック率が大きく変わるため、
 *   場所を分けないと改善に使えません。
 *   計測基盤が無い環境では何も送らず、リンクとしては正常に動きます。
 */

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

function trackClick(program: string | undefined, placement: string, label: string) {
  if (typeof window === "undefined") return;
  if (!Array.isArray(window.dataLayer)) return;
  window.dataLayer.push({
    event: "affiliate_click",
    affiliate_program: program ?? "none",
    placement,
    label,
  });
}

export function OutboundLink({
  link,
  placement,
  label,
  adLabel,
  srExternal,
  className,
  children,
}: {
  link: ResolvedLink;
  /** 設置場所。例: "exchange-compare" / "diagnosis-result" */
  placement: string;
  /** 計測ラベル。取引所名など */
  label: string;
  /** 「PR」に相当する語（言語別） */
  adLabel: string;
  /** 「新しいタブで開きます」に相当する語 */
  srExternal: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={link.href}
      target="_blank"
      rel={link.sponsored ? SPONSORED_REL : EXTERNAL_REL}
      data-placement={placement}
      onClick={() => trackClick(link.program, placement, label)}
      className={cx("group/link inline-flex items-center gap-2", className)}
    >
      {children}
      {link.sponsored ? (
        <span className="rounded border border-(--color-hairline) px-1 text-[0.625rem] leading-4 text-(--color-ink-dim)">
          {adLabel}
        </span>
      ) : null}
      <span className="sr-only"> {srExternal}</span>
    </a>
  );
}
