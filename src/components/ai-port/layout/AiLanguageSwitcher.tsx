"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { Check, Globe } from "lucide-react";
import { findLanguage, flagSrc, languages } from "@/data/languages";
import {
  applyLanguage,
  getServerLanguage,
  readCurrentLanguage,
  subscribeLanguage,
} from "@/lib/translate";
import { cn } from "@/lib/utils";

/**
 * AI PORT の言語切り替え。
 *
 * ■ このリポジトリの固定要件（AGENTS.md）
 *   - ヘッダーに常時設置する
 *   - 選択肢には必ず国旗を表示する（public/images/flags/<国コード>.webp）
 *   - 旗だけにせず、必ずその言語での言語名を併記する
 *     （言語と国は1対1ではないため、旗だけでは誤解を招きます）
 *   - 並び順は訪日客の多い言語順を維持する（アルファベット順にしない）
 *
 * 見た目だけが焼肉 千里 側と異なります。
 * 言語データ（src/data/languages.ts）と切り替えの仕組み（src/lib/translate.ts）は共通です。
 */
export function AiLanguageSwitcher({ className }: { className?: string }) {
  // Cookie はサーバーから読めないため、サーバー側は常に原文（日本語）を返します。
  // これでハイドレーション時に表示が食い違いません。
  const current = useSyncExternalStore(subscribeLanguage, readCurrentLanguage, getServerLanguage);
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

  const currentLanguage = findLanguage(current) ?? languages[0];

  return (
    // translate="no" — 言語名そのものが翻訳されると選べなくなります
    <div ref={containerRef} className={cn("relative", className)} translate="no">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`表示言語を選択（現在：${currentLanguage.labelJa}）`}
        className="text-ai-haze hover:text-ai-cyan flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 transition-colors duration-300 hover:border-white/25"
      >
        <Globe aria-hidden="true" className="size-3.5 shrink-0" />
        {/* 旗は装飾。読み上げは button の aria-label が担います */}
        <Image
          src={flagSrc(currentLanguage)}
          alt=""
          width={48}
          height={36}
          className="h-3.5 w-[1.15rem] rounded-[2px] object-cover ring-1 ring-white/25"
        />
        <span className="font-ai-mono text-[0.66rem] tracking-[0.14em]">
          {currentLanguage.code.toUpperCase()}
        </span>
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="表示言語"
          className="border-ai-line/80 bg-ai-abyss/97 absolute right-0 z-[95] mt-2 max-h-[70vh] w-64 overflow-y-auto rounded-xl border py-2 shadow-2xl backdrop-blur-xl"
        >
          {languages.map((language) => {
            const selected = language.code === current;
            return (
              <button
                key={language.code}
                type="button"
                role="option"
                aria-selected={selected}
                lang={language.code}
                dir={language.rtl ? "rtl" : undefined}
                onClick={() => {
                  setOpen(false);
                  if (!selected) applyLanguage(language.code);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-[0.82rem] transition-colors duration-200",
                  selected
                    ? "text-ai-cyan bg-white/[0.06]"
                    : "text-ai-mist hover:text-ai-cyan hover:bg-white/[0.05]",
                )}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Image
                    src={flagSrc(language)}
                    alt=""
                    width={48}
                    height={36}
                    className="h-3.5 w-[1.15rem] shrink-0 rounded-[2px] object-cover ring-1 ring-white/20"
                  />
                  {/* 旗と必ずセットで、その言語での言語名を出します */}
                  <span className="truncate">{language.label}</span>
                </span>
                {selected ? <Check aria-hidden="true" className="size-3.5 shrink-0" /> : null}
              </button>
            );
          })}

          <p className="text-ai-dim mt-1.5 border-t border-white/8 px-4 pt-3 pb-1 text-[0.66rem] leading-[1.8]">
            日本語以外は機械翻訳です。正確な情報は日本語表示をご確認ください。
            <br />
            国旗は言語の目印で、国を限定するものではありません。
          </p>
        </div>
      ) : null}
    </div>
  );
}
