"use client";

/**
 * グローバルヘッダー。
 *
 * 言語切り替えは常時設置します（スマートフォンでも隠しません）。
 * 比較リストの件数をここに出すことで、どのページからでも比較へ戻れるようにしています。
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { brand } from "@/cardport/config/site";
import { primaryNav, secondaryNav } from "@/cardport/data/navigation";
import type { Dictionary } from "@/cardport/i18n";
import type { Locale } from "@/cardport/i18n/locales";
import { routes } from "@/cardport/lib/routes";
import { useCompare } from "@/cardport/hooks/useCompare";
import { cx } from "@/cardport/components/ui/primitives";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header({ locale, dictionary }: { locale: Locale; dictionary: Dictionary }) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { ids } = useCompare();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cx(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "glass-solid border-line/70 border-b" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-[88rem] items-center gap-3 px-4 py-3 sm:px-6">
        <Link
          href={routes.home(locale)}
          className="flex shrink-0 items-baseline gap-1 text-[1.05rem] font-semibold tracking-[0.08em]"
        >
          <span className="text-aurora">{brand.wordmark.lead}</span>
          <span className="text-ink">{brand.wordmark.tail}</span>
        </Link>

        <nav aria-label={dictionary.nav.home} className="ms-4 hidden flex-1 lg:block">
          <ul className="flex items-center gap-1">
            {primaryNav.map((item) => {
              const href = item.href(locale);
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={item.key}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "rounded-full px-3 py-1.5 text-[0.8rem] transition-colors",
                      active ? "bg-cyan/12 text-cyan" : "text-mist hover:text-ink",
                    )}
                  >
                    {dictionary.nav[item.key]}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <Link
            href={routes.compare(locale)}
            className="glass text-ink hover:border-cyan/50 relative hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.78rem] transition-colors sm:inline-flex"
          >
            {dictionary.sections.comparison}
            {ids.length > 0 ? (
              <span className="bg-cyan text-void numeric inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[0.62rem] font-bold">
                {ids.length}
              </span>
            ) : null}
          </Link>

          <LanguageSwitcher locale={locale} label={dictionary.common.languageSwitch} />

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="cardport-mobile-nav"
            aria-label={open ? dictionary.common.close : dictionary.common.menu}
            className="glass text-ink rounded-full p-2 lg:hidden"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
              {open ? (
                <path
                  d="M4 4l12 12M16 4L4 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
              ) : (
                <path
                  d="M3 6h14M3 10h14M3 14h14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <nav
          id="cardport-mobile-nav"
          aria-label={dictionary.nav.home}
          className="glass-solid border-line/70 max-h-[75vh] overflow-y-auto border-t px-4 pt-3 pb-6 lg:hidden"
        >
          <ul className="grid grid-cols-2 gap-1.5">
            {[...primaryNav, ...secondaryNav].map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href(locale)}
                  onClick={() => setOpen(false)}
                  className="text-mist hover:text-ink block rounded-lg px-3 py-2.5 text-[0.82rem] transition-colors"
                >
                  {dictionary.nav[item.key]}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={routes.compare(locale)}
                onClick={() => setOpen(false)}
                className="text-cyan block rounded-lg px-3 py-2.5 text-[0.82rem]"
              >
                {dictionary.sections.comparison}
                {ids.length > 0 ? `（${ids.length}）` : ""}
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
