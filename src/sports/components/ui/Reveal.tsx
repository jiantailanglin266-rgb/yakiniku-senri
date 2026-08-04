"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** 表示の遅延（秒）。並んだカードを少しずつずらすのに使います */
  delay?: number;
  /** 進入方向 */
  from?: "up" | "left" | "right" | "scale";
  className?: string;
};

const offsets = {
  up: { y: 24, x: 0, scale: 1 },
  left: { y: 0, x: -24, scale: 1 },
  right: { y: 0, x: 24, scale: 1 },
  scale: { y: 0, x: 0, scale: 0.96 },
};

/**
 * スクロール連動の表示アニメーション。
 * prefers-reduced-motion では動かさず、最初から最終状態で描画します。
 */
export function Reveal({ children, delay = 0, from = "up", className }: Props) {
  const reduced = useReducedMotion();
  const offset = offsets[from];

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** 数値のカウントアップ。順位表やスタッツの見出し数値に使います。 */
export function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const reduced = useReducedMotion();
  if (reduced) {
    return (
      <span className="tnum">
        {value}
        {suffix}
      </span>
    );
  }
  return (
    <motion.span
      className="tnum"
      initial={{ opacity: 0.2 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {value}
      {suffix}
    </motion.span>
  );
}
