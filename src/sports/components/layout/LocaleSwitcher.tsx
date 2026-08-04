"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { withBasePath } from "@/lib/base-path";
import { getDictionary } from "../../i18n";
import { locales, type Locale } from "../../i18n/locales";
import { swapLocale } from "../../lib/url";

/**
 * 表示言語の切り替え。
 *
 * ■ 国旗だけにしないこと
 *   言語と国は1対1ではありません（英語＝英国とは限らず、スペイン語は中南米でも話されます）。
 *   旗だけを並べると必ず誤解が生まれるため、その言語での言語名を必ず併記します。
 * ■ 並び順
 *   スポーツ視聴人口とターゲットの優先順です。アルファベット順にはしません。
 * ■ 実装
 *   Cookie ではなく URL のロケールセグメントを差し替えます。
 *   ページごとに正しい canonical と hreflang を持たせるためです。
 */
export function LocaleSwitcher({ current }: { current: Locale }) {
  const dict = getDictionary(current.code);
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    // 言語名そのものは機械翻訳させません（訳すと自称でなくなり選べなくなります）
    <div ref={containerRef} className="relative" translate="no">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`${dict.languageSwitchLabel}（${current.labelJa}）`}
        className="border-edge text-ink-dim hover:border-cyan/60 hover:text-cyan flex h-10 items-center gap-1.5 rounded-lg border px-2.5 transition-colors"
      >
        <Image
          src={withBasePath(`/images/flags/${current.country}.webp`)}
          alt=""
          width={48}
          height={36}
          className="ring-ink/25 h-3.5 w-[1.15rem] rounded-[1px] object-cover ring-1"
        />
        <span className="sp-mono text-[0.6875rem] tracking-wider">
          {current.code.toUpperCase()}
        </span>
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={dict.language}
          className="border-edge bg-abyss/97 absolute right-0 z-90 mt-1 max-h-[70vh] w-64 overflow-y-auto rounded-xl border py-1.5 shadow-2xl backdrop-blur-md"
        >
          {locales.map((locale) => {
            const selected = locale.code === current.code;
            return (
              <Link
                key={locale.code}
                href={swapLocale(pathname, locale.code)}
                hrefLang={locale.hreflang}
                role="option"
                aria-selected={selected}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  selected
                    ? "bg-cyan/10 text-cyan"
                    : "text-ink-soft hover:bg-edge/50 hover:text-ink"
                }`}
              >
                <Image
                  src={withBasePath(`/images/flags/${locale.country}.webp`)}
                  alt=""
                  width={48}
                  height={36}
                  className="ring-ink/20 h-3.5 w-[1.15rem] shrink-0 rounded-[1px] object-cover ring-1"
                />
                {/* 旗だけでは言語を特定できないため、必ず言語名を併記します */}
                <span className="min-w-0 flex-1 truncate">{locale.label}</span>
                <span className="sp-mono text-ink-faint shrink-0 text-[0.625rem]">
                  {locale.code.toUpperCase()}
                </span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
