"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import { aiMainNav, aiSecondaryNav } from "@/data/ai-port/navigation";
import { aiPortName, aiPortPath, aiPortTagline } from "@/data/ai-port/site";
import { cn } from "@/lib/utils";
import { AiLanguageSwitcher } from "./AiLanguageSwitcher";
import { CommandPalette, useCommandPalette } from "./CommandPalette";
import { PortalLogo } from "./PortalLogo";

/**
 * AI PORT のヘッダー。
 *
 * ■ 上に固定するが、最初は透明
 *   ヒーローの上では枠線を出さず、少しスクロールしたらガラス板に変わります。
 *   スクロール量の判定は「64px を超えたかどうか」だけなので、状態更新は最小限です。
 *
 * ■ 言語切り替えは常時表示（このリポジトリの固定要件）
 *   デスクトップでもモバイルでもヘッダーから消しません。
 */
export function PortalHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 64);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ページを移動したらメニューを閉じます。
  // effect で閉じると「開いたまま新しいページが一瞬見える」ため、描画中に畳みます
  // （React が推奨する「レンダー中の状態調整」パターン）。
  const [renderedPath, setRenderedPath] = useState(pathname);
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  const isActive = (href: string) =>
    href === aiPortPath("/") ? pathname === href : pathname.startsWith(href);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[90] transition-all duration-500",
          scrolled
            ? "border-b border-white/8 bg-[#04060f]/78 backdrop-blur-xl"
            : "border-b border-transparent",
        )}
      >
        <div className="mx-auto flex h-[4.25rem] max-w-[88rem] items-center gap-4 px-5 sm:px-8">
          <Link
            href={aiPortPath("/")}
            className="group flex shrink-0 items-center gap-2.5"
            aria-label={`${aiPortName} ホーム`}
          >
            <PortalLogo className="size-8" />
            <span className="min-w-0">
              <span className="font-ai-display text-ai-white block text-[0.95rem] leading-none font-semibold tracking-[0.14em]">
                AI PORT
              </span>
              <span className="text-ai-dim mt-1 hidden text-[0.6rem] leading-none tracking-[0.08em] sm:block">
                {aiPortTagline}
              </span>
            </span>
          </Link>

          <nav aria-label="主要ナビゲーション" className="ml-4 hidden min-w-0 flex-1 lg:block">
            <ul className="flex items-center gap-1">
              {aiMainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "relative rounded-full px-3 py-2 text-[0.8rem] transition-colors duration-300",
                      isActive(item.href)
                        ? "text-ai-cyan"
                        : "text-ai-haze hover:text-ai-white hover:bg-white/[0.05]",
                    )}
                  >
                    {item.label}
                    {isActive(item.href) ? (
                      <span
                        aria-hidden="true"
                        className="from-ai-cyan to-ai-violet absolute inset-x-3 -bottom-0.5 h-px bg-gradient-to-r"
                      />
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              aria-label="サイト内を検索"
              className="text-ai-haze hover:text-ai-cyan flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 transition-colors duration-300 hover:border-white/25"
            >
              <Search aria-hidden="true" className="size-3.5" />
              <span className="font-ai-mono hidden text-[0.62rem] tracking-[0.12em] xl:inline">
                ⌘K
              </span>
            </button>

            {/* 言語切り替えは常時設置（固定要件） */}
            <AiLanguageSwitcher />

            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
              className="text-ai-mist hover:text-ai-cyan flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] transition-colors duration-300 lg:hidden"
            >
              {menuOpen ? (
                <X aria-hidden="true" className="size-4" />
              ) : (
                <Menu aria-hidden="true" className="size-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div
          id="ai-mobile-menu"
          className="fixed inset-0 z-[89] overflow-y-auto bg-[#04060f]/96 pt-[4.25rem] pb-24 backdrop-blur-xl lg:hidden"
        >
          <nav aria-label="モバイルナビゲーション" className="px-5 py-6 sm:px-8">
            <ul className="grid gap-2">
              {aiMainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="ai-glass block rounded-xl px-4 py-3.5 transition-colors"
                  >
                    <span className="font-ai-mono text-ai-dim block text-[0.6rem] tracking-[0.2em]">
                      {item.labelEn}
                    </span>
                    <span className="text-ai-white mt-1 block text-[0.95rem]">{item.label}</span>
                    {item.description ? (
                      <span className="text-ai-haze mt-0.5 block text-[0.74rem]">
                        {item.description}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>

            <ul className="mt-6 grid grid-cols-2 gap-2">
              {aiSecondaryNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-ai-mist block rounded-lg border border-white/8 bg-white/[0.03] px-3.5 py-3 text-[0.82rem]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      ) : null}

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
}
