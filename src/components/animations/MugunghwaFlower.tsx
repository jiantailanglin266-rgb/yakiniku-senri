"use client";

import { useId } from "react";
import { FLOWER_PALETTE, type FlowerPose, type FlowerVariant } from "./fallingFlowerConfig";

/**
 * 木槿（ムクゲ）の花。
 *
 * 5枚の花びらが中心から放射状に開き、中心には濃色の花芯（丹心）と
 * そこから伸びる細い金の線を入れています。
 * 写実ではなく、小さく表示しても木槿と分かる装飾イラストとして描いています。
 *
 * グラデーションの id は useId で一意化しているため、
 * 同じページに何輪置いても id が衝突しません。
 */

/** 中心(50,50)から上へ伸びる、丸みのある花びら1枚 */
const PETAL_PATH = "M50 53 C 30 45, 21 25, 33 11 C 41 3, 59 3, 67 11 C 79 25, 70 45, 50 53 Z";

/** ポーズごとの見え方。横向き・半開きを混ぜて単調さを避けます。 */
const POSE_SPEC: Record<FlowerPose, { petals: number; scaleX: number; scaleY: number }> = {
  open: { petals: 5, scaleX: 1, scaleY: 1 },
  half: { petals: 5, scaleX: 1, scaleY: 0.72 },
  side: { petals: 3, scaleX: 0.68, scaleY: 1 },
};

export type MugunghwaFlowerProps = {
  size?: number;
  opacity?: number;
  variant?: FlowerVariant;
  pose?: FlowerPose;
  className?: string;
};

export function MugunghwaFlower({
  size = 40,
  opacity = 1,
  variant = "ivory",
  pose = "open",
  className,
}: MugunghwaFlowerProps) {
  const uid = useId();
  const petalId = `${uid}-petal`;
  const coreId = `${uid}-core`;
  const haloId = `${uid}-halo`;
  const color = FLOWER_PALETTE[variant];
  const { petals, scaleX, scaleY } = POSE_SPEC[pose];

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
        {/* 花びら — 中心から外へ、濃色から淡色へ */}
        <radialGradient id={petalId} cx="50%" cy="52%" r="52%">
          <stop offset="0%" stopColor={color.center} stopOpacity="0.92" />
          <stop offset="38%" stopColor={color.inner} stopOpacity="0.8" />
          <stop offset="82%" stopColor={color.outer} stopOpacity="0.62" />
          <stop offset="100%" stopColor={color.outer} stopOpacity="0.3" />
        </radialGradient>

        {/* 花芯 */}
        <radialGradient id={coreId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color.center} />
          <stop offset="70%" stopColor={color.center} stopOpacity="0.85" />
          <stop offset="100%" stopColor={color.inner} stopOpacity="0" />
        </radialGradient>

        {/* 黒地でも花が沈まないよう、SVG内に光のにじみを持たせています。
            CSS の drop-shadow フィルタを使わないので描画コストがかかりません。 */}
        <radialGradient id={haloId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color.glow} />
          <stop offset="100%" stopColor={color.glow} stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="50" cy="50" r="44" fill={`url(#${haloId})`} opacity="0.42" />

      <g transform={`translate(50 50) scale(${scaleX} ${scaleY}) translate(-50 -50)`}>
        {Array.from({ length: petals }).map((_, index) => (
          <path
            key={index}
            d={PETAL_PATH}
            fill={`url(#${petalId})`}
            stroke={color.rim}
            strokeOpacity="0.28"
            strokeWidth="0.9"
            transform={`rotate(${(360 / petals) * index} 50 50)`}
          />
        ))}

        {/* 丹心から伸びる細い金の線 */}
        <g stroke={color.rim} strokeOpacity="0.62" strokeWidth="0.9" strokeLinecap="round">
          {Array.from({ length: petals }).map((_, index) => (
            <line
              key={index}
              x1="50"
              y1="50"
              x2="50"
              y2="29"
              transform={`rotate(${(360 / petals) * index + 36} 50 50)`}
            />
          ))}
        </g>

        <circle cx="50" cy="50" r="9.5" fill={`url(#${coreId})`} />
        <circle cx="50" cy="50" r="2.6" fill={color.rim} fillOpacity="0.75" />
      </g>
    </svg>
  );
}
