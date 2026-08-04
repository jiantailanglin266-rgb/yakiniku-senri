"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

/**
 * スクロール連動の演出。
 *
 * ■ prefers-reduced-motion
 *   `useReducedMotion` が true のときは、変位量をゼロにして
 *   「最初から見えている」状態にします。透明度だけ動かすと
 *   点滅として知覚されることがあるため、そこも止めます。
 */

type Direction = "up" | "left" | "right" | "none";

const offset: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 24 },
  left: { x: -24, y: 0 },
  right: { x: 24, y: 0 },
  none: { x: 0, y: 0 },
};

export function Reveal({
  children,
  delay = 0,
  direction = "up",
  className,
}: {
  children: ReactNode;
  delay?: number;
  direction?: Direction;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const from = reduced ? offset.none : offset[direction];

  return (
    <motion.div
      className={className}
      initial={{ opacity: reduced ? 1 : 0, ...from }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-64px" }}
      transition={{
        duration: reduced ? 0 : 0.6,
        delay: reduced ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * 数字のカウントアップ。
 *
 * 相場の数値は「読めること」が最優先なので、
 * 画面に入ったとき1回だけ、短時間で終わらせます。
 */
export function CountUp({
  value,
  format,
  durationMs = 900,
  className,
}: {
  value: number;
  /** 表示整形。ロケール依存の整形は呼び出し側で決めます */
  format: (value: number) => string;
  durationMs?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-32px" });
  const [animated, setAnimated] = useState(0);

  // 動きを減らす設定では、状態を経由せず最終値をそのまま描きます。
  // （状態に流し込むと、アニメーションしないのに再レンダーが1回増えます）
  const display = reduced ? value : animated;

  useEffect(() => {
    if (reduced || !inView) return;

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      // ease-out。終盤でゆっくり止まると読み取りやすくなります
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimated(value * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, durationMs, reduced]);

  return (
    <span ref={ref} className={className}>
      {format(display)}
    </span>
  );
}

/**
 * マウス追従の立体傾斜。
 * タッチ端末では何も起きません（hover が無いため）。
 */
export function TiltCard({
  children,
  className,
  max = 6,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(event: React.MouseEvent<HTMLDivElement>) {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.setProperty("--tilt-y", `${px * max * 2}deg`);
    ref.current.style.setProperty("--tilt-x", `${-py * max * 2}deg`);
  }

  function handleLeave() {
    if (!ref.current) return;
    ref.current.style.setProperty("--tilt-y", "0deg");
    ref.current.style.setProperty("--tilt-x", "0deg");
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`tilt ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
