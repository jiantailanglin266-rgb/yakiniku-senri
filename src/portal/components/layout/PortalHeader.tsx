"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { localePath } from "@/portal/i18n/config";
import { mainNav } from "@/portal/data/site-content";
import { brand } from "@/portal/lib/site";
import { BrandLogo } from "./BrandLogo";
import { navLabel } from "@/portal/lib/format";
import type { Dictionary } from "@/portal/i18n/dictionaries";
import { GlobalSearch } from "./GlobalSearch";
import { LocaleSwitcher } from "./LocaleSwitcher";

/**
 * グローバルヘッダー。
 *
 * ■ 常時設置するもの
 *   - ロゴ（環境変数で差し替え可能）
 *   - 主要ナビゲーション
 *   - サイト内検索
 *   - 言語切り替え（国旗つき）
 *   - 主要CTA
 *
 * ■ スマートフォン
 *   価格・検索・CTAを優先し、ナビゲーションは折りたたみます。
 */
export function PortalHeader({ locale, dict }: { locale: string; dict: Dictionary }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    // 途中までスクロールした状態で戻ってきた場合に備え、初期値も一度反映します。
    // 描画後に回すのは、effect の中で同期的に状態を更新すると
    // ハイドレーション直後に不要な再レンダーが連鎖するためです。
    const frame = requestAnimationFrame(onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // メニューを開いているあいだは背面をスクロールさせません
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function isActive(href: string): boolean {
    const full = localePath(locale, href);
    return pathname === full || (href !== "/" && (pathname ?? "").startsWith(`${full}/`));
  }

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-40 transition-all duration-300",
        scrolled ? "glass-strong shadow-[0_8px_32px_-16px_#000]" : "bg-transparent",
      ].join(" ")}
    >
      <div className="mx-auto flex h-16 max-w-[110rem] items-center gap-3 px-4 sm:h-18 sm:gap-5 sm:px-6">
        <Link
          href={localePath(locale)}
          className="flex shrink-0 items-center gap-2"
          aria-label={brand.name}
        >
          <BrandLogo
            withMark
            videoClassName="h-10 sm:h-12"
            textClassName="text-sm tracking-tight sm:text-base"
          />
        </Link>

        <nav aria-label={dict.nav.market} className="hidden items-center gap-0.5 xl:flex">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={localePath(locale, item.href)}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={[
                "rounded-full px-3 py-2 text-sm transition-colors",
                isActive(item.href)
                  ? "text-white"
                  : "text-(--color-ink-soft) hover:text-(--color-ink)",
              ].join(" ")}
            >
              {navLabel(item, locale, dict)}
            </Link>
          ))}
        </nav>

        <div className="ms-auto hidden flex-1 justify-end lg:flex">
          <GlobalSearch locale={locale} dict={dict} />
        </div>

        <div className="ms-auto flex items-center gap-2 lg:ms-0">
          <LocaleSwitcher
            locale={locale}
            label={dict.common.language}
            hint={dict.common.languageHint}
          />

          <Link
            href={localePath(locale, "/diagnosis/exchange")}
            className="hidden rounded-full bg-linear-to-r from-(--color-cyan) via-(--color-blue) to-(--color-violet) px-4 py-2 text-sm font-semibold text-(--color-void) transition-[filter] hover:brightness-110 md:inline-flex"
          >
            {dict.nav.diagnosis}
          </Link>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="portal-mobile-nav"
            aria-label={open ? dict.common.close : dict.common.menu}
            className="glass grid size-9 place-items-center rounded-full xl:hidden"
          >
            <span aria-hidden="true" className="relative block h-3 w-4">
              <span
                className={[
                  "absolute inset-x-0 top-0 h-px bg-current transition-transform duration-300",
                  open ? "top-1.5 rotate-45" : "",
                ].join(" ")}
              />
              <span
                className={[
                  "absolute inset-x-0 top-1.5 h-px bg-current transition-opacity duration-200",
                  open ? "opacity-0" : "",
                ].join(" ")}
              />
              <span
                className={[
                  "absolute inset-x-0 top-3 h-px bg-current transition-transform duration-300",
                  open ? "top-1.5 -rotate-45" : "",
                ].join(" ")}
              />
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="portal-mobile-nav"
          className="glass-strong max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-(--color-hairline) px-4 pt-4 pb-8 xl:hidden"
        >
          <div className="mb-4 lg:hidden">
            <GlobalSearch locale={locale} dict={dict} compact />
          </div>
          <ul className="grid gap-1">
            {mainNav.map((item) => (
              <li key={item.href}>
                {/* 遷移でメニューを閉じます（pathname の変化を effect で見るより確実です） */}
                <Link
                  href={localePath(locale, item.href)}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 text-base transition-colors hover:bg-white/5"
                >
                  {navLabel(item, locale, dict)}
                </Link>
                {item.children ? (
                  <ul className="ms-3 mb-1 border-s border-(--color-hairline) ps-3">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={localePath(locale, child.href)}
                          onClick={() => setOpen(false)}
                          className="block rounded-lg px-3 py-2 text-sm text-(--color-ink-soft) transition-colors hover:bg-white/5"
                        >
                          {navLabel(child, locale, dict)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </header>
  );
}
