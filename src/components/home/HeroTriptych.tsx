"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import type { Media } from "@/data/media";
import { cn } from "@/lib/utils";

/**
 * ファーストビューの背景（3枚組）。
 *
 * 横に3分割したパネルを並べ、細い黒の目地で区切ります。
 * パネルごとにごくゆっくり縮小させ、静止画に見えないようにしています
 * （動きは transform のみ。prefers-reduced-motion では停止します）。
 *
 * スマートフォンでは3列が細くなりすぎるため、中央の1枚のみを全面表示します。
 */

/** スマートフォンで表示するパネルの番号（0始まり）。 */
const MOBILE_PANEL_INDEX = 1;

export function HeroTriptych({ panels }: { panels: readonly Media[] }) {
  const reduced = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 目地の色。gap から透けて見えます */}
      <div className="grid h-full w-full grid-cols-1 gap-[3px] bg-black sm:grid-cols-3">
        {panels.map((panel, index) => (
          <div
            key={panel.src || index}
            className={cn(
              "relative h-full overflow-hidden",
              // スマートフォンでは中央の1枚だけを残します
              index !== MOBILE_PANEL_INDEX && "hidden sm:block",
            )}
          >
            {panel.src ? (
              <motion.div
                className="absolute inset-0"
                initial={reduced ? false : { scale: 1.08 }}
                animate={reduced ? undefined : { scale: 1 }}
                transition={{
                  duration: 22,
                  delay: index * 1.2,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Image
                  src={panel.src}
                  alt={panel.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, 34vw"
                  // スマートフォンで唯一表示される中央のパネルだけ先読みします。
                  // 他の2枚は遅延読み込みにしているため、非表示のスマートフォンでは
                  // ダウンロード自体が発生しません（display:none は交差しないため）。
                  priority={index === MOBILE_PANEL_INDEX}
                  className="object-cover"
                  style={{ filter: "saturate(0.92) contrast(1.04) brightness(0.98)" }}
                />
              </motion.div>
            ) : (
              <div className="media-placeholder" aria-hidden="true" />
            )}
          </div>
        ))}
      </div>

      {/* 可読性のための黒グラデーション（既存のヒーローと同じ配合） */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,8,8,0.72) 0%, rgba(8,8,8,0.38) 34%, rgba(8,8,8,0.55) 68%, rgba(8,8,8,0.95) 100%)",
        }}
      />
      {/* 見出しが乗る左側だけ、もう一段沈めます */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(8,8,8,0.66) 0%, rgba(8,8,8,0.28) 38%, rgba(8,8,8,0) 62%)",
        }}
      />
      <div aria-hidden="true" className="ember-glow absolute inset-x-0 bottom-0 h-1/3" />
    </div>
  );
}
