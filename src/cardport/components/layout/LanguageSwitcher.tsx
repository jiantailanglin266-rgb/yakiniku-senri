"use client";

/**
 * 言語切り替え。
 *
 * ■ 国旗と言語名を必ず併記します
 *   言語と国は1対1ではありません（英語＝英国だけではない、スペイン語＝スペインだけではない）。
 *   旗だけの表示は誤解を招くため、言語名を省略しないでください。
 *
 * ■ URL で言語を切り替えます
 *   このサイトは言語ごとに実URLを持つため、Cookie ではなくリンクで移動します。
 *   いま見ているページの同じ言語版へ遷移し、トップに戻されません。
 */
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { cardportBasePath } from "@/cardport/config/site";
import {
  getLocaleDefinition,
  localeDefinitions,
  localeFlagSrc,
  type Locale,
} from "@/cardport/i18n/locales";
import { swapLocale } from "@/cardport/lib/routes";
import { cx } from "@/cardport/components/ui/primitives";

export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname() ?? `/${locale}`;
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const current = getLocaleDefinition(locale);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
        className="glass text-cp-ink hover:border-cp-cyan/50 flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.78rem] transition-colors"
      >
        <Image
          src={localeFlagSrc(locale)}
          alt=""
          width={20}
          height={14}
          className="h-3.5 w-5 rounded-[2px] object-cover"
          unoptimized
        />
        <span>{current.label}</span>
        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 opacity-70" aria-hidden="true">
          <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={label}
          className="glass-solid absolute right-0 z-50 mt-2 max-h-[70vh] w-60 overflow-y-auto rounded-xl p-1.5 shadow-2xl"
        >
          <ul>
            {localeDefinitions.map((definition) => {
              const active = definition.code === locale;
              return (
                <li key={definition.code}>
                  <Link
                    href={swapLocale(pathname, definition.code, cardportBasePath)}
                    hrefLang={definition.hreflang}
                    lang={definition.hreflang}
                    dir={definition.rtl ? "rtl" : "ltr"}
                    role="menuitem"
                    aria-current={active ? "true" : undefined}
                    onClick={() => setOpen(false)}
                    className={cx(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.8rem] transition-colors",
                      active
                        ? "bg-cp-cyan/12 text-cp-cyan"
                        : "text-cp-mist hover:text-cp-ink hover:bg-white/6",
                    )}
                  >
                    <Image
                      src={localeFlagSrc(definition.code)}
                      alt=""
                      width={22}
                      height={16}
                      className="h-4 w-[22px] shrink-0 rounded-[2px] object-cover"
                      unoptimized
                    />
                    {/* 旗だけでは言語が特定できないため、言語名を必ず併記します */}
                    <span className="flex-1">{definition.label}</span>
                    <span className="text-cp-dim text-[0.66rem]">{definition.code}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
