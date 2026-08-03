"use client";

import type { CSSProperties } from "react";
import { FLOWER_PALETTE, type FlowerVariant } from "./fallingFlowerConfig";

/**
 * 花に付随する小さな光の粒。
 *
 * SVG ではなく CSS の放射グラデーションで描いています。
 * 数が多い要素なので、DOM とフィルタのコストを最小にするためです
 * （既存の FireParticleLayer と同じ描き方に揃えています）。
 */

export type GoldenSparkleProps = {
  size?: number;
  opacity?: number;
  variant?: FlowerVariant;
  className?: string;
};

export function GoldenSparkle({
  size = 4,
  opacity = 1,
  variant = "gold",
  className,
}: GoldenSparkleProps) {
  const color = FLOWER_PALETTE[variant];

  return (
    <span
      aria-hidden="true"
      className={className}
      style={
        {
          display: "block",
          width: `${size}px`,
          height: `${size}px`,
          opacity,
          borderRadius: "9999px",
          background: `radial-gradient(circle, ${color.rim} 0%, ${color.outer} 38%, transparent 72%)`,
        } as CSSProperties
      }
    />
  );
}
