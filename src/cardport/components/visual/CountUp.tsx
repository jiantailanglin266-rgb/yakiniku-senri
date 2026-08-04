"use client";

/**
 * 数字のカウントアップ。
 *
 * ■ React の状態を使わない理由
 *   60fps で state を更新すると、そのたびにコンポーネント全体が再描画されます。
 *   ここで変えたいのは文字列ひとつなので、ref 経由で textContent を書き換えます。
 *
 * ■ 支援技術への配慮
 *   途中の値が読み上げられると誤読につながるため、
 *   アニメーションする要素は `aria-hidden` にし、最終値だけを別途読ませます。
 */
import { useEffect, useRef } from "react";

export function CountUp({
  value,
  duration = 1100,
  format,
  className,
}: {
  value: number;
  duration?: number;
  format: (value: number) => string;
  className?: string;
}) {
  const wrapperRef = useRef<HTMLSpanElement | null>(null);
  const outputRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const output = outputRef.current;
    if (!wrapper || !output) return;

    // モーションを減らす設定では、最初から最終値のままにします
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let start = 0;
    let cancelled = false;

    const step = (timestamp: number) => {
      if (cancelled) return;
      if (!start) start = timestamp;
      const progress = Math.min(1, (timestamp - start) / duration);
      // ease-out。終盤でゆっくり止めると数字が読みやすくなります
      const eased = 1 - Math.pow(1 - progress, 3);
      output.textContent = format(value * eased);
      if (progress < 1) frame = window.requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          output.textContent = format(0);
          frame = window.requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(wrapper);

    return () => {
      cancelled = true;
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
      output.textContent = format(value);
    };
  }, [value, duration, format]);

  return (
    <span ref={wrapperRef} className={className}>
      <span ref={outputRef} aria-hidden="true">
        {format(value)}
      </span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}
