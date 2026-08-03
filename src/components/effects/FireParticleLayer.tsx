import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * 炭火の火の粉。
 * Canvas/JS を使わない純CSSアニメーションのため、追加のJSバンドルは0です。
 * 位置・遅延は固定値（ハイドレーション差分なし）。モバイルでは粒子数を減らします。
 * prefers-reduced-motion では globals.css 側で全アニメーションが停止します。
 */

type Particle = {
  left: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  opacity: number;
  /** true の場合は sm 未満で非表示（モバイル軽量化） */
  desktopOnly?: boolean;
};

const particles: Particle[] = [
  { left: 6, size: 2, delay: 0, duration: 9, drift: 18, opacity: 0.55 },
  { left: 14, size: 3, delay: 2.4, duration: 11, drift: -14, opacity: 0.45, desktopOnly: true },
  { left: 23, size: 2, delay: 4.1, duration: 10, drift: 22, opacity: 0.6 },
  { left: 31, size: 1, delay: 1.2, duration: 8, drift: -10, opacity: 0.7, desktopOnly: true },
  { left: 42, size: 3, delay: 5.6, duration: 12, drift: 16, opacity: 0.4 },
  { left: 50, size: 2, delay: 3.3, duration: 9.5, drift: -20, opacity: 0.55, desktopOnly: true },
  { left: 58, size: 1, delay: 6.8, duration: 8.5, drift: 12, opacity: 0.65 },
  { left: 67, size: 3, delay: 0.8, duration: 11.5, drift: -16, opacity: 0.42, desktopOnly: true },
  { left: 75, size: 2, delay: 4.9, duration: 10.5, drift: 20, opacity: 0.5 },
  { left: 84, size: 2, delay: 2.1, duration: 9, drift: -12, opacity: 0.6, desktopOnly: true },
  { left: 92, size: 1, delay: 6.2, duration: 8.8, drift: 14, opacity: 0.68 },
];

export function FireParticleLayer({
  className,
  intensity = "normal",
}: {
  className?: string;
  intensity?: "normal" | "soft";
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {particles.map((particle, index) => (
        <span
          key={index}
          className={cn(
            "absolute bottom-0 rounded-full",
            particle.desktopOnly && "hidden sm:block",
          )}
          style={
            {
              left: `${particle.left}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background:
                index % 3 === 0
                  ? "radial-gradient(circle, #e5ca83 0%, rgba(199,162,83,0) 70%)"
                  : index % 3 === 1
                    ? "radial-gradient(circle, #b9381e 0%, rgba(185,56,30,0) 70%)"
                    : "radial-gradient(circle, #c7a253 0%, rgba(143,107,40,0) 70%)",
              animation: `ember-rise ${particle.duration}s linear ${particle.delay}s infinite`,
              "--ember-drift": `${particle.drift}px`,
              "--ember-opacity": intensity === "soft" ? particle.opacity * 0.55 : particle.opacity,
              willChange: "transform, opacity",
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
