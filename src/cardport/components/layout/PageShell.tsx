/**
 * 下層ページ共通の見出し部。
 *
 * パンくず・見出し・リード・注意書きの並びを1か所に固定し、
 * ページごとに構造がばらつかないようにしています。
 */
import type { ReactNode } from "react";

import { Breadcrumbs, type Crumb } from "./Breadcrumbs";
import { Notice, cx } from "@/cardport/components/ui/primitives";

export function PageShell({
  crumbs,
  breadcrumbLabel,
  eyebrow,
  title,
  lead,
  notice,
  meta,
  children,
  wide = false,
}: {
  crumbs: Crumb[];
  breadcrumbLabel: string;
  eyebrow?: string;
  title: string;
  lead?: string;
  /** 法務上の注意書き（地域制限・情報確認など） */
  notice?: ReactNode;
  /** 執筆者・更新日など */
  meta?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <>
      <Breadcrumbs items={crumbs} label={breadcrumbLabel} />

      <header className="mx-auto w-full max-w-[88rem] px-4 pt-6 pb-2 sm:px-6">
        {eyebrow ? (
          <p className="text-cp-cyan font-cp-mono mb-2 text-[0.68rem] tracking-[0.24em] uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-cp-ink text-[1.6rem] leading-tight font-semibold sm:text-[2.2rem]">
          {title}
        </h1>
        {lead ? (
          <p className="text-cp-mist mt-3 max-w-3xl text-[0.88rem] leading-relaxed">{lead}</p>
        ) : null}
        {meta ? <div className="text-cp-dim mt-4 text-[0.72rem]">{meta}</div> : null}
        {notice ? <div className="mt-5 max-w-4xl">{notice}</div> : null}
      </header>

      <div
        className={cx(
          "mx-auto w-full px-4 py-8 sm:px-6 sm:py-10",
          wide ? "max-w-[100rem]" : "max-w-[88rem]",
        )}
      >
        {children}
      </div>
    </>
  );
}

export { Notice };
