"use client";

/**
 * スクロール連動の出現。
 *
 * Framer Motion を使わずに IntersectionObserver + CSS アニメーションで行います。
 * 出現アニメーションのためだけにモーションライブラリを全ページへ配るのは、
 * 表示速度の目標に対して割に合わないためです。
 *
 * 状態は React で持たず、交差した時点で class を直接付けます。
 * 「見えたら1回だけクラスを足す」以上のことをしないため、再描画は起きません。
 */
import { useEffect, useRef, type ReactNode } from "react";
import { cx } from "@/cardport/components/ui/primitives";

export function Reveal({
  children,
  className,
  delayIndex = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delayIndex?: number;
  as?: "div" | "li" | "article" | "section";
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // IntersectionObserver が無い環境では、隠したままにせず即座に表示します
    if (typeof IntersectionObserver === "undefined") {
      node.classList.add("is-in");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          node.classList.add("is-in");
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={cx("port-reveal", className)}
      style={{ animationDelay: `${delayIndex * 70}ms` }}
    >
      {children}
    </Tag>
  );
}
