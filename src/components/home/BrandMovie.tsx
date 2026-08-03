"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Play, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Figure } from "@/components/ui/Figure";
import { VerticalText } from "@/components/ui/VerticalText";
import { SmokeLayer } from "@/components/effects/SmokeLayer";
import { brandMovie as defaultMovie } from "@/data/media";

type BrandMovieConfig = {
  youtubeId: string;
  mp4: string;
  poster: { src: string; alt: string; width: number; height: number };
  title: string;
  label: string;
};

/**
 * ファーストビュー直下のブランドムービー枠。
 * - youtubeId / mp4 のいずれかが設定されている場合のみ再生ボタンとモーダルを表示します
 * - どちらも未設定なら、ポスター画像のみを表示します（押せないダミーボタンは出しません）
 * - 自動再生は行いません。モーダル内の再生のみ、ユーザー操作を起点とします
 */
export function BrandMovie({ movie = defaultMovie }: { movie?: BrandMovieConfig }) {
  const [open, setOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hasVideo = Boolean(movie.youtubeId || movie.mp4);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="brand-movie-heading"
      className="relative py-20 sm:py-28"
    >
      <SmokeLayer className="opacity-70" />

      <div className="relative mx-auto grid max-w-[100rem] grid-cols-[auto_1fr_auto] items-center gap-4 px-3 sm:gap-8 sm:px-8">
        <VerticalText text="受け継がれる味" direction="down" targetRef={sectionRef} />

        <div>
          <div className="text-center">
            <p className="font-display text-gold text-[0.68rem] tracking-[0.46em] uppercase">
              {movie.label}
            </p>
            <h2
              id="brand-movie-heading"
              className="font-serif-jp text-ivory mt-5 text-[1.15rem] leading-[1.85] tracking-[0.12em] sm:text-[1.5rem]"
            >
              受け継がれてきた味と、
              <br />
              焼肉 千里の時間。
            </h2>
          </div>

          <div className="mt-10 aspect-[16/9] w-full sm:aspect-[2.35/1]">
            <div className="relative h-full w-full">
              <Figure
                media={movie.poster}
                className="h-full w-full"
                sizes="(max-width: 1024px) 100vw, 1200px"
                label="movie"
                soft
              />
              {hasVideo ? (
                <button
                  ref={triggerRef}
                  type="button"
                  onClick={() => setOpen(true)}
                  className="group absolute inset-0 grid place-items-center"
                >
                  <span className="border-gold/60 group-hover:border-gold grid size-20 place-items-center rounded-full border bg-black/40 backdrop-blur-sm transition-all duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-105 group-hover:bg-black/60 sm:size-24">
                    <Play aria-hidden="true" className="text-gold-light ml-1 size-7" />
                  </span>
                  <span className="sr-only">ブランドムービーを再生する</span>
                </button>
              ) : null}
            </div>
          </div>

          {!hasVideo ? (
            <p className="text-gray-dark mt-5 text-center text-[0.7rem] tracking-[0.16em]">
              ブランドムービーは準備中です。
            </p>
          ) : null}
        </div>

        <VerticalText text="世田谷で六十余年" direction="up" targetRef={sectionRef} />
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[105] grid place-items-center bg-black/92 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              aria-label="動画を閉じる"
              onClick={() => setOpen(false)}
              className="absolute inset-0 h-full w-full"
            />
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label="ブランドムービー"
              className="relative w-full max-w-5xl"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-ivory hover:text-gold absolute -top-14 right-0 grid size-11 place-items-center transition-colors duration-500"
              >
                <X aria-hidden="true" className="size-6" />
                <span className="sr-only">動画を閉じる</span>
              </button>
              <div className="aspect-video w-full overflow-hidden bg-black">
                {movie.youtubeId ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${movie.youtubeId}?autoplay=1&rel=0`}
                    title="焼肉 千里 ブランドムービー"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                  />
                ) : (
                  <video
                    src={movie.mp4}
                    poster={movie.poster.src || undefined}
                    controls
                    autoPlay
                    muted
                    playsInline
                    className="h-full w-full"
                  />
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
