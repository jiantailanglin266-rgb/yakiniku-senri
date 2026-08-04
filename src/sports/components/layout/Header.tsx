"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { brand, features } from "../../config/site";
import { getDictionary } from "../../i18n";
import type { Locale } from "../../i18n/locales";
import { href } from "../../lib/url";
import { LocaleSwitcher } from "./LocaleSwitcher";

/**
 * グローバルヘッダー。
 *
 * スマートフォンでは「ライブスコア」「検索」「言語」を最優先で残し、
 * それ以外をドロワーへ格納します。スコアへの到達時間を最短にするためです。
 */
export function Header({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale.code);
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const nav = [
    { path: "/live", label: dict.navLive },
    { path: "/matches", label: dict.navMatches },
    { path: "/leagues", label: dict.navLeagues },
    { path: "/news", label: dict.navNews },
    { path: "/videos", label: dict.navVideos },
    { path: "/streaming", label: dict.navStreaming },
    ...(features.web3 ? [{ path: "/web3", label: dict.navWeb3 }] : []),
    ...(features.diagnosis ? [{ path: "/diagnosis", label: dict.navDiagnosis }] : []),
    { path: "/guide", label: dict.navGuide },
  ];

  const isActive = (path: string) => pathname.startsWith(href(locale.code, path));

  return (
    <header className="border-edge/80 bg-void/85 sticky top-0 z-80 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[110rem] items-center gap-3 px-4 sm:h-16 sm:px-6">
        <Link href={href(locale.code, "/")} className="flex shrink-0 items-center gap-2">
          <span
            className="sp-mono text-void grid size-8 place-items-center rounded-lg text-xs font-bold"
            style={{
              background: "linear-gradient(135deg, var(--color-cyan), var(--color-indigo))",
            }}
            aria-hidden="true"
          >
            {brand.mark}
          </span>
          <span className="text-ink text-sm font-extrabold tracking-tight sm:text-base">
            {brand.name}
          </span>
        </Link>

        <nav aria-label={dict.menu} className="ml-2 hidden min-w-0 flex-1 lg:block">
          <ul className="flex items-center gap-0.5 overflow-hidden">
            {nav.map((item) => (
              <li key={item.path}>
                <Link
                  href={href(locale.code, item.path)}
                  aria-current={isActive(item.path) ? "page" : undefined}
                  className={`rounded-lg px-2.5 py-2 text-[0.8125rem] whitespace-nowrap transition-colors ${
                    isActive(item.path) ? "text-cyan" : "text-ink-dim hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <Link
            href={href(locale.code, "/search")}
            aria-label={dict.search}
            className="border-edge text-ink-dim hover:border-cyan/60 hover:text-cyan grid size-10 place-items-center rounded-lg border transition-colors"
          >
            <svg
              viewBox="0 0 20 20"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <circle cx="9" cy="9" r="6" />
              <path d="m13.5 13.5 4 4" strokeLinecap="round" />
            </svg>
          </Link>

          <LocaleSwitcher current={locale} />

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? dict.close : dict.menu}
            className="border-edge text-ink-dim hover:border-cyan/60 hover:text-cyan grid size-10 place-items-center rounded-lg border transition-colors lg:hidden"
          >
            <svg
              viewBox="0 0 20 20"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              {open ? (
                <path d="m4 4 12 12M16 4 4 16" strokeLinecap="round" />
              ) : (
                <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-edge bg-abyss/98 border-t backdrop-blur-xl lg:hidden">
          <nav aria-label={dict.menu} className="mx-auto max-w-[110rem] px-4 py-3">
            <ul className="grid grid-cols-2 gap-1.5">
              {nav.map((item) => (
                <li key={item.path}>
                  <Link
                    href={href(locale.code, item.path)}
                    onClick={() => setOpen(false)}
                    className="border-edge text-ink-soft hover:border-cyan/60 hover:text-cyan block rounded-lg border px-3 py-2.5 text-sm transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
