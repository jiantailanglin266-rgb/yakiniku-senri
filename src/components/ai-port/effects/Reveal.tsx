"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * スクロールで現れる要素。
 *
 * Framer Motion ではなく IntersectionObserver + CSS にしているのは、
 * 「一度出したら終わり」の演出にJSアニメーションを使う必要がないためです。
 * 実際の見た目は .ai-reveal / .is-in（src/styles/ai-port.css）が持ちます。
 * モーション削減時は最初から表示された状態になります。
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  /** ミリ秒。並んだカードを少しずつずらすために使います。 */
  delay?: number;
  as?: "div" | "section" | "li" | "article";
}) {
  // タグを差し替えられるようにしているため、要素の型は HTMLElement で受けます
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || shown) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      // 少し早めに出し始めて、スクロール中に「間に合わない」感じを消します
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <Tag
      ref={(node: HTMLElement | null) => {
        ref.current = node;
      }}
      className={cn("ai-reveal", shown && "is-in", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
