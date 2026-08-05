"use client";

import { useEffect, useRef } from "react";

/**
 * ページ上端のスクロール進捗バー。
 *
 * 進捗は CSS 変数（--ai-progress）に書き込み、transform:scaleX で描きます。
 * width を変えるとレイアウトの再計算が毎フレーム走るため使いません。
 * 更新は requestAnimationFrame で1フレーム1回にまとめます。
 */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let ticking = false;

    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      element.style.setProperty("--ai-progress", String(Math.min(Math.max(progress, 0), 1)));
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2px] bg-transparent"
    >
      <div
        ref={ref}
        className="ai-progress-bar from-ai-cyan via-ai-violet to-ai-pink h-full w-full bg-gradient-to-r"
      />
    </div>
  );
}
