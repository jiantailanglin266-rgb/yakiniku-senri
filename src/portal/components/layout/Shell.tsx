import Link from "next/link";
import type { ReactNode } from "react";
import { localePath } from "@/portal/i18n/config";
import type { Dictionary } from "@/portal/i18n/dictionaries";
import { cx } from "@/portal/components/ui/primitives";

/** ページ共通の横幅。全ページで揃えないと、遷移のたびに文字幅が動いて読みづらくなります。 */
export function Container({
  children,
  className,
  size = "wide",
}: {
  children: ReactNode;
  className?: string;
  size?: "wide" | "text";
}) {
  return (
    <div
      className={cx(
        "mx-auto px-4 sm:px-6",
        size === "wide" ? "max-w-[110rem]" : "max-w-3xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** セクションの縦リズム。ページごとに違うと、継ぎ目が目立ちます。 */
export function Section({
  children,
  className,
  id,
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  labelledBy?: string;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cx("py-14 sm:py-18", className)}>
      {children}
    </section>
  );
}

/** パンくず。構造化データ（BreadcrumbList）とセットで使います。 */
export function Breadcrumbs({
  trail,
  locale,
  dict,
}: {
  trail: { name: string; path: string }[];
  locale: string;
  dict: Dictionary;
}) {
  const items = [{ name: dict.common.home, path: "" }, ...trail];

  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-xs text-(--color-ink-dim)">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={item.path || "home"} className="flex items-center gap-1.5">
              {last ? (
                <span aria-current="page" className="text-(--color-ink-soft)">
                  {item.name}
                </span>
              ) : (
                <>
                  <Link
                    href={localePath(locale, item.path)}
                    className="transition-colors hover:text-(--color-ink)"
                  >
                    {item.name}
                  </Link>
                  <span aria-hidden="true">/</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** 記事・詳細ページの見出しブロック */
export function PageHeader({
  eyebrow,
  title,
  lead,
  meta,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  meta?: ReactNode;
}) {
  return (
    <header className="mb-10">
      {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
      <h1 className="text-3xl font-semibold sm:text-4xl lg:text-5xl">
        <span className="text-gradient">{title}</span>
      </h1>
      {lead ? <p className="mt-4 max-w-3xl text-(--color-ink-soft)">{lead}</p> : null}
      {meta ? <div className="mt-5">{meta}</div> : null}
      <div className="rule-gradient mt-6 w-48" />
    </header>
  );
}
