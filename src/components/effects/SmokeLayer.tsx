import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * 薄い煙のレイヤー。ぼかした放射グラデーションをゆっくり流します。
 * transform / opacity のみで動かすため、レイアウトの再計算は発生しません。
 */
const plumes = [
  { left: "8%", size: 420, delay: 0, duration: 26, desktopOnly: false },
  { left: "38%", size: 520, delay: 8, duration: 32, desktopOnly: true },
  { left: "68%", size: 460, delay: 14, duration: 29, desktopOnly: false },
  { left: "88%", size: 380, delay: 20, duration: 34, desktopOnly: true },
];

export function SmokeLayer({
  className,
  from = "bottom",
}: {
  className?: string;
  from?: "bottom" | "top";
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {plumes.map((plume, index) => (
        <span
          key={index}
          className={cn("absolute rounded-full blur-3xl", plume.desktopOnly && "hidden md:block")}
          style={
            {
              left: plume.left,
              top: from === "top" ? `-${plume.size / 3}px` : undefined,
              bottom: from === "bottom" ? `-${plume.size / 3}px` : undefined,
              width: `${plume.size}px`,
              height: `${plume.size}px`,
              background:
                "radial-gradient(circle, rgba(199,162,83,0.10) 0%, rgba(167,167,167,0.06) 40%, rgba(8,8,8,0) 72%)",
              animation: `smoke-drift ${plume.duration}s ease-in-out ${plume.delay}s infinite`,
              willChange: "transform, opacity",
            } satisfies CSSProperties
          }
        />
      ))}
    </div>
  );
}
