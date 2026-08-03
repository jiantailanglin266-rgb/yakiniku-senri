"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import type { RefObject } from "react";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  /** 上から下へ流すか、下から上へ流すか */
  direction?: "down" | "up";
  /** スクロール進捗の基準となる親要素 */
  targetRef?: RefObject<HTMLElement | null>;
  className?: string;
};

/**
 * 縦書きの装飾文字。
 * 装飾のためスクリーンリーダーからは除外します（本文は別途HTMLで提供）。
 * 移動量は ±5% 相当に抑え、transform のみでGPU負荷を抑制します。
 */
export function VerticalText({ text, direction = "down", targetRef, className }: Props) {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"],
  });

  const range = direction === "down" ? [-40, 40] : [40, -40];
  const y = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : range);

  return (
    <motion.span
      aria-hidden="true"
      style={{ y }}
      className={cn(
        "vertical-rl font-serif-jp text-gold/45 pointer-events-none text-[0.7rem] tracking-[0.5em] select-none sm:text-xs",
        className,
      )}
    >
      {text}
    </motion.span>
  );
}
