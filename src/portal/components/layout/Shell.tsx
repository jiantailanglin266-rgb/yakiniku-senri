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
  display,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  meta?: ReactNode;
  /**
   * 大きく置く英字（例: `News`）。
   *
   * デザイン見本に合わせ、英字を主役の大きさで出し、日本語タイトルを添えます。
   * 見出しの本体は日本語側（h1）で、英字は装飾なので読み上げから外します。
   */
  display?: string;
}) {
  return (
    <header className="mb-10">
      {display ? (
        <p
          aria-hidden="true"
          className="font-display text-gradient text-5xl leading-none font-bold tracking-tight sm:text-6xl lg:text-7xl"
        >
          {display}
        </p>
      ) : eyebrow ? (
        <p className="eyebrow mb-3">{eyebrow}</p>
      ) : null}

      <h1
        className={
          display
            ? "mt-3 text-2xl font-semibold sm:text-3xl"
            : "text-3xl font-semibold sm:text-4xl lg:text-5xl"
        }
      >
        {display ? title : <span className="text-gradient">{title}</span>}
      </h1>

      {lead ? <p className="mt-4 max-w-3xl text-(--color-ink-soft)">{lead}</p> : null}
      {meta ? <div className="mt-5">{meta}</div> : null}
      <div className="rule-gradient mt-6 w-48" />
    </header>
  );
}

/**
 * 本文＋右サイドバーの2カラム。
 *
 * デザイン見本はどのページも右側に補助情報（人気ランキング・関連リンク・
 * 初心者向けCTA）を置いています。狭い画面では縦積みになり、
 * サイドバーは本文の後ろへ回ります（読み上げ順も本文が先）。
 */
export function WithSidebar({
  children,
  aside,
  className,
}: {
  children: ReactNode;
  aside: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10", className)}>
      <div className="min-w-0">{children}</div>
      <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <div className="grid gap-4">{aside}</div>
      </aside>
    </div>
  );
}

/** サイドバーに置く小さなまとまり */
export function AsideCard({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("glass rounded-2xl p-4", className)}>
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}
