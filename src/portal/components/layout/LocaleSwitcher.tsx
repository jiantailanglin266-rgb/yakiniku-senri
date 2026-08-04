"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { getLocaleConfig, isLocale, locales } from "@/portal/i18n/config";
import { withBasePath } from "@/lib/base-path";

/**
 * 言語切り替え。
 *
 * ■ 固定要件
 *   - ヘッダーに常時設置する
 *   - 選択肢には必ず国旗を表示する（public/images/flags/<国コード>.webp）
 *   - 旗だけにせず、必ずその言語での言語名を併記する
 *     （言語と国は1対1ではないため、旗だけでは誤解を招きます）
 *   - 並び順は取引ボリュームと関心度の実務順を維持する（アルファベット順にしない）
 *
 * ■ 切り替え方式
 *   このポータルは言語をURLの先頭セグメントに載せているため、
 *   Cookie を書くのではなく **同じページの別言語URLへ遷移** します。
 *   検索エンジンから見ても1URL＝1言語になり、hreflang と矛盾しません。
 */
export function LocaleSwitcher({
  locale,
  label,
  hint,
}: {
  locale: string;
  /** 「言語」に相当する語 */
  label: string;
  /** 旗が国ではなく言語の目安であることの補足 */
  hint: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const current = getLocaleConfig(locale);

  // 外側クリックと Esc で閉じます
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  /** いまのパスの言語部分だけを差し替えます */
  function hrefFor(target: string): string {
    // pathname は basePath を含まない形で渡ってきます
    const segments = (pathname ?? "/").split("/").filter(Boolean);
    if (segments.length > 0 && isLocale(segments[0])) {
      segments[0] = target;
    } else {
      segments.unshift(target);
    }
    return `/${segments.join("/")}`;
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`${label}: ${current.labelJa}`}
        className="glass edge-glow flex items-center gap-2 rounded-full py-1.5 pr-3 pl-1.5 text-sm transition-colors hover:text-white"
      >
        <Image
          src={withBasePath(`/images/flags/${current.country}.webp`)}
          alt=""
          width={22}
          height={16}
          className="h-4 w-[22px] rounded-[2px] object-cover"
        />
        <span className="hidden sm:inline">{current.label}</span>
        <span className="sm:hidden">{current.code.toUpperCase()}</span>
        <svg viewBox="0 0 12 8" className="size-2.5 opacity-60" aria-hidden="true">
          <path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={label}
          className="glass-strong absolute end-0 z-50 mt-2 max-h-[70vh] w-64 overflow-y-auto rounded-xl p-1.5 shadow-2xl"
        >
          <p className="px-3 py-2 text-[0.6875rem] leading-snug text-(--color-ink-dim)">{hint}</p>
          {locales.map((entry) => {
            const active = entry.code === locale;
            return (
              <button
                key={entry.code}
                type="button"
                role="option"
                aria-selected={active}
                lang={entry.hreflang}
                onClick={() => {
                  setOpen(false);
                  router.push(hrefFor(entry.code));
                }}
                className={[
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-sm transition-colors",
                  active ? "bg-white/8 text-white" : "hover:bg-white/5",
                ].join(" ")}
              >
                {/* 旗は「目安」。言語名の併記が本体です */}
                <Image
                  src={withBasePath(`/images/flags/${entry.country}.webp`)}
                  alt=""
                  width={24}
                  height={18}
                  className="h-[18px] w-6 shrink-0 rounded-[2px] object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{entry.label}</span>
                  <span className="block truncate text-[0.6875rem] text-(--color-ink-dim)">
                    {entry.labelJa}
                  </span>
                </span>
                {active ? (
                  <span aria-hidden="true" className="text-(--color-cyan)">
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}

          {/* MIT は著作権表示の保持が条件です。旗を使う画面から辿れるようにしています。 */}
          <p className="px-3 pt-2 pb-1 text-[0.625rem] leading-[1.7] text-(--color-ink-dim)">
            国旗素材：
            <a
              href={withBasePath("/licenses/flag-icons-LICENSE.txt")}
              target="_blank"
              rel="noopener noreferrer license"
              className="underline underline-offset-2"
            >
              flag-icons（MIT）
            </a>
          </p>
        </div>
      ) : null}
    </div>
  );
}
