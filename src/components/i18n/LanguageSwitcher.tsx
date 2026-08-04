"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { findLanguage, flagSrc, languages } from "@/data/languages";
import {
  applyLanguage,
  getServerLanguage,
  readCurrentLanguage,
  subscribeLanguage,
} from "@/lib/translate";
import { cn } from "@/lib/utils";

/**
 * 言語切り替え。
 *
 * 現在の言語は Cookie に入っており、サーバーからは読めません。
 * useSyncExternalStore のサーバー用スナップショットで原文（日本語）を返すため、
 * サーバーと初回クライアントの描画が一致し、ハイドレーション差分が出ません。
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const current = useSyncExternalStore(subscribeLanguage, readCurrentLanguage, getServerLanguage);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // 外側クリックと Escape で閉じます
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
    // translate="no" — 言語名そのものは翻訳されると意味を失うため除外します
    <div ref={containerRef} className={cn("relative", className)} translate="no">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`表示言語を選択（現在：${currentLanguage.labelJa}）`}
        className="text-gray hover:text-gold flex h-11 items-center gap-1.5 rounded px-2 transition-colors duration-500"
      >
        {/* 旗は装飾。読み上げは button の aria-label が担います */}
        <Image
          src={flagSrc(currentLanguage)}
          alt=""
          width={48}
          height={36}
          className="ring-ivory/25 h-3.5 w-[1.15rem] rounded-[1px] object-cover ring-1"
        />
        <span className="font-display text-[0.68rem] tracking-[0.14em]">
          {currentLanguage.code.toUpperCase()}
        </span>
      </button>

      {open ? (
        <div
          ref={listRef}
          role="listbox"
          aria-label="表示言語"
          className="border-gold/25 bg-black-soft/97 absolute right-0 z-[95] mt-1 max-h-[70vh] w-60 overflow-y-auto rounded border py-1.5 shadow-2xl backdrop-blur-md"
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
                  "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-[0.82rem] transition-colors duration-300",
                  selected ? "text-gold" : "text-ivory/85 hover:text-gold hover:bg-white/5",
                )}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Image
                    src={flagSrc(language)}
                    alt=""
                    width={48}
                    height={36}
                    className="ring-ivory/20 h-3.5 w-[1.15rem] shrink-0 rounded-[1px] object-cover ring-1"
                  />
                  <span className="truncate">{language.label}</span>
                </span>
                {selected ? <Check aria-hidden="true" className="size-3.5 shrink-0" /> : null}
              </button>
            );
          })}

          <p className="text-gray-dark border-ivory/10 mt-1 border-t px-4 pt-2.5 pb-1 text-[0.66rem] leading-[1.8]">
            日本語以外は機械翻訳です。正確な情報は日本語表示をご確認ください。
            <br />
            国旗は言語の目印で、国を限定するものではありません。
          </p>
        </div>
      ) : null}
    </div>
  );
}
