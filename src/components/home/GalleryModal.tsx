"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import type { Media } from "@/data/media";

type Props = {
  items: readonly Media[];
  /** null の場合は閉じています */
  index: number | null;
  onClose: () => void;
  onChange: (index: number) => void;
};

/**
 * ギャラリーの拡大表示。
 * ESC で閉じる／← → で前後移動／フォーカストラップ対応。
 */
export function GalleryModal({ items, index, onClose, onChange }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const open = index !== null;

  const goPrev = useCallback(() => {
    if (index === null) return;
    onChange((index - 1 + items.length) % items.length);
  }, [index, items.length, onChange]);

  const goNext = useCallback(() => {
    if (index === null) return;
    onChange((index + 1) % items.length);
  }, [index, items.length, onChange]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
      if (event.key === "Tab" && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>("button"),
        ).filter((el) => el.offsetParent !== null);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose, goPrev, goNext]);

  const current = index === null ? null : items[index];

  return (
    <AnimatePresence>
      {open && current ? (
        <motion.div
          className="fixed inset-0 z-[105] grid place-items-center bg-black/94 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`ギャラリー ${index + 1} / ${items.length}`}
            className="relative flex w-full max-w-5xl flex-col items-center"
          >
            <div className="flex w-full items-center justify-between">
              <p className="font-display text-gold text-[0.7rem] tracking-[0.28em]">
                {String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="text-ivory hover:text-gold grid size-11 place-items-center transition-colors duration-500"
              >
                <X aria-hidden="true" className="size-6" />
                <span className="sr-only">ギャラリーを閉じる</span>
              </button>
            </div>

            <div className="relative mt-4 aspect-[4/3] w-full bg-black">
              {current.src ? (
                <Image
                  src={current.src}
                  alt={current.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  className="object-contain"
                />
              ) : (
                <div className="media-placeholder" aria-hidden="true" />
              )}
            </div>

            <p className="text-gray mt-4 text-center text-[0.78rem]">{current.alt}</p>

            <div className="mt-4 flex items-center gap-4">
              <button
                type="button"
                onClick={goPrev}
                className="border-ivory/20 text-ivory hover:border-gold hover:text-gold grid size-11 place-items-center border transition-colors duration-500"
              >
                <ChevronLeft aria-hidden="true" className="size-5" />
                <span className="sr-only">前の画像</span>
              </button>
              <button
                type="button"
                onClick={goNext}
                className="border-ivory/20 text-ivory hover:border-gold hover:text-gold grid size-11 place-items-center border transition-colors duration-500"
              >
                <ChevronRight aria-hidden="true" className="size-5" />
                <span className="sr-only">次の画像</span>
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
