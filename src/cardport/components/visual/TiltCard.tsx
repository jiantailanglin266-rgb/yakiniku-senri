"use client";

/**
 * マウス追従で傾く3Dカード。
 *
 * CSS の `transform: perspective(...) rotate3d(...)` だけで立体感を出します。
 * タッチ端末では傾けず、`prefers-reduced-motion` でも無効化します。
 */
import { useCallback, useRef, useState, type ReactNode } from "react";

export function TiltCard({
  children,
  className,
  maxTilt = 10,
}: {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [transform, setTransform] = useState<string>("");

  const handleMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const node = ref.current;
      if (!node) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      // 粗いポインタ（タッチ）では傾けません
      if (window.matchMedia("(pointer: coarse)").matches) return;

      const rect = node.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      setTransform(
        `perspective(900px) rotateX(${(-y * maxTilt).toFixed(2)}deg) rotateY(${(x * maxTilt).toFixed(2)}deg) translateZ(6px)`,
      );
    },
    [maxTilt],
  );

  const reset = useCallback(() => setTransform(""), []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      className={className}
      style={{
        transform,
        transition: transform ? "transform 120ms linear" : "transform 500ms var(--ease-port)",
      }}
    >
      {children}
    </div>
  );
}
