"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
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
 *
 * ■ 再生ボタンを押さずにループ再生します
 *   枠の中でそのまま流し続けます。モーダルもオーバーレイも開かないため、
 *   再生中もページの見た目・スクロール・レイアウトは一切変わりません。
 *
 * ■ 自動再生を成立させる条件
 *   ブラウザは「消音」でなければ自動再生を許可しません（muted / playsInline は必須）。
 *   動画ファイル自体も音声トラックなしで書き出しています。
 *
 * ■ 読み込みを遅らせています
 *   枠が画面に近づくまで <video> を作りません。
 *   ファーストビューだけ見て離脱する方に動画のダウンロードを負担させないためです。
 *
 * ■ prefers-reduced-motion では自動再生しません
 *   代わりに操作バーを出し、見たい方が自分で再生できるようにします。
 *   枠の大きさは変わらないため、レイアウトは同じです。
 */
export function BrandMovie({ movie = defaultMovie }: { movie?: BrandMovieConfig }) {
  const reduced = useReducedMotion();
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const hasVideo = Boolean(movie.youtubeId || movie.mp4);

  // 枠が画面に近づいたときだけ動画を読み込みます
  useEffect(() => {
    const frame = frameRef.current;
    if (!hasVideo || !frame || inView) return;

    if (typeof IntersectionObserver !== "function") {
      // 未対応環境では遅延読み込みをあきらめ、通常どおり再生します
      const timer = setTimeout(() => setInView(true), 0);
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      // 画面に入る少し手前から読み始め、到達時には映像が出ている状態にします
      { rootMargin: "300px 0px" },
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, [hasVideo, inView]);

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

          <div ref={frameRef} className="mt-10 aspect-[16/9] w-full sm:aspect-[2.35/1]">
            {/* 枠の見た目（色調整・縁のマスク）は画像のときと共通です */}
            <div className="media-frame media-soft h-full w-full">
              {hasVideo && inView ? (
                movie.youtubeId ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${movie.youtubeId}?autoplay=1&mute=1&loop=1&playlist=${movie.youtubeId}&controls=0&rel=0&playsinline=1&modestbranding=1`}
                    title="焼肉 千里 ブランドムービー"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    className="absolute inset-0 h-full w-full border-0"
                  />
                ) : (
                  <video
                    src={movie.mp4}
                    poster={movie.poster.src || undefined}
                    aria-label={movie.title}
                    autoPlay={!reduced}
                    controls={Boolean(reduced)}
                    loop
                    muted
                    playsInline
                    preload="auto"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )
              ) : (
                /* 読み込み前・動画未設定のときはポスター画像を出します */
                <Figure
                  media={movie.poster}
                  className="absolute inset-0 h-full w-full"
                  sizes="(max-width: 1024px) 100vw, 1200px"
                  label="movie"
                  plain
                />
              )}
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
    </section>
  );
}
