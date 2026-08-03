"use client";

import { useId } from "react";
import { FLOWER_PALETTE, type FlowerVariant } from "./fallingFlowerConfig";

/**
 * 木槿の花びら。1〜3枚を束ねて表示できます。
 * 花だけを大量に降らせると重くなるため、軽さを出す役割で混ぜて使います。
 */

const PETAL_PATH = "M50 92 C 26 74, 18 44, 33 20 C 40 8, 60 8, 67 20 C 82 44, 74 74, 50 92 Z";

/** 2枚・3枚のときの散らし方（回転角と位置のずれ） */
const CLUSTER: Record<number, { rotate: number; x: number; y: number; scale: number }[]> = {
  1: [{ rotate: 0, x: 0, y: 0, scale: 1 }],
  2: [
    { rotate: -18, x: -12, y: 4, scale: 0.94 },
    { rotate: 22, x: 14, y: -6, scale: 0.82 },
  ],
  3: [
    { rotate: -26, x: -16, y: 6, scale: 0.9 },
    { rotate: 4, x: 2, y: -8, scale: 1 },
    { rotate: 30, x: 18, y: 8, scale: 0.76 },
  ],
};

export type MugunghwaPetalProps = {
  size?: number;
  opacity?: number;
  variant?: FlowerVariant;
  count?: 1 | 2 | 3;
  className?: string;
};

export function MugunghwaPetal({
  size = 20,
  opacity = 1,
  variant = "ivory",
  count = 1,
  className,
}: MugunghwaPetalProps) {
  const uid = useId();
  const fillId = `${uid}-fill`;
  const color = FLOWER_PALETTE[variant];

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ opacity }}
      className={className}
    >
      <defs>
        <linearGradient id={fillId} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor={color.outer} stopOpacity="0.28" />
          <stop offset="55%" stopColor={color.inner} stopOpacity="0.7" />
          <stop offset="100%" stopColor={color.center} stopOpacity="0.85" />
        </linearGradient>
      </defs>

      {CLUSTER[count].map((item, index) => (
        <path
          key={index}
          d={PETAL_PATH}
          fill={`url(#${fillId})`}
          stroke={color.rim}
          strokeOpacity="0.24"
          strokeWidth="1"
          transform={`translate(${item.x} ${item.y}) rotate(${item.rotate} 50 50) translate(50 50) scale(${item.scale}) translate(-50 -50)`}
        />
      ))}
    </svg>
  );
}
