"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * マウス位置に合わせて傾くカード（3D）と、追従するスポットライト。
 *
 * 角度とカーソル位置は CSS カスタムプロパティ（--rx / --ry / --mx / --my）に
 * 書き込むだけにしています。React の再描画を起こさないので、
 * カードが何十枚並んでも描画コストが増えません。
 *
 * タッチ端末では pointermove がほぼ発火しないため、実質無効になります。
 */
export function TiltCard({
  children,
  className,
  /** 最大の傾き（度）。強くしすぎると文字が読みにくくなります。 */
  strength = 5,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const element = ref.current;
      if (!element || event.pointerType === "touch") return;

      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;

      element.style.setProperty("--ry", `${(x - 0.5) * strength * 2}deg`);
      element.style.setProperty("--rx", `${(0.5 - y) * strength * 2}deg`);
      element.style.setProperty("--mx", `${x * 100}%`);
      element.style.setProperty("--my", `${y * 100}%`);
    },
    [strength],
  );

  const reset = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    element.style.setProperty("--ry", "0deg");
    element.style.setProperty("--rx", "0deg");
  }, []);

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      className={cn("ai-tilt ai-spotlight", className)}
    >
      {children}
    </div>
  );
}
