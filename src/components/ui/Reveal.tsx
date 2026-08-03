"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** ms */
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
  as?: "div" | "li" | "section" | "article" | "span";
};

/**
 * 画面に入ったときに一度だけ再生する入場アニメーション。
 * duration 1100ms / cubic-bezier(.22,1,.36,1) — LP質感仕上げの基準値に準拠。
 * prefers-reduced-motion では即時表示します。
 */
export function Reveal({
  children,
  className,
  delay = 0,
  direction = "up",
  as = "div",
}: RevealProps) {
  const reduced = useReducedMotion();
  const MotionTag = motion[as];

  if (reduced) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const offset =
    direction === "up"
      ? { y: 26 }
      : direction === "left"
        ? { x: -32 }
        : direction === "right"
          ? { x: 32 }
          : {};

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, filter: "blur(7px)", scale: 0.988, ...offset }}
      whileInView={{ opacity: 1, filter: "blur(0px)", scale: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.18, margin: "0px 0px -8% 0px" }}
      transition={{
        duration: 1.1,
        delay: delay / 1000,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </MotionTag>
  );
}
