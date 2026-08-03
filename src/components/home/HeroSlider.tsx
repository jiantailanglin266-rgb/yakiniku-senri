"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { Media } from "@/data/media";
import { cn } from "@/lib/utils";

const INTERVAL_MS = 6500;

/**
 * ファーストビューの背景。
 * 横スライドではなくクロスフェードで切り替え、ゆっくり拡大させます。
 * 手動操作（インジケーター）にも対応。prefers-reduced-motion では自動切替も拡大も行いません。
 */
export function HeroSlider({ slides }: { slides: readonly Media[] }) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduced || paused || slides.length < 2) return;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % slides.length),
      INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, [reduced, paused, slides.length]);

  const active = slides[index];

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 1.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {active.src ? (
            <motion.div
              className="absolute inset-0"
              initial={reduced ? false : { scale: 1 }}
              animate={reduced ? undefined : { scale: 1.1 }}
              transition={{ duration: 18, ease: "linear" }}
            >
              <Image
                src={active.src}
                alt={active.alt}
                fill
                sizes="100vw"
                priority={index === 0}
                className="object-cover"
                style={{ filter: "saturate(0.92) contrast(1.04) brightness(0.98)" }}
              />
            </motion.div>
          ) : (
            <div className="media-placeholder" aria-hidden="true" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* 可読性のための黒グラデーション */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,8,8,0.72) 0%, rgba(8,8,8,0.38) 34%, rgba(8,8,8,0.55) 68%, rgba(8,8,8,0.95) 100%)",
        }}
      />
      <div aria-hidden="true" className="ember-glow absolute inset-x-0 bottom-0 h-1/3" />

      {slides.length > 1 ? (
        <div className="absolute right-5 bottom-28 z-10 flex flex-col gap-3 sm:right-8 sm:bottom-32">
          {slides.map((slide, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setIndex(i);
                setPaused(true);
              }}
              aria-label={`背景画像 ${i + 1} を表示`}
              aria-current={i === index}
              className="group grid size-11 place-items-center"
            >
              <span
                className={cn(
                  "block h-px transition-all duration-700 ease-[cubic-bezier(.22,1,.36,1)]",
                  i === index
                    ? "bg-gold w-9"
                    : "bg-ivory/35 group-hover:bg-gold/70 w-4 group-hover:w-7",
                )}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
