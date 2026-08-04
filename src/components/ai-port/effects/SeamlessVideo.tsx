"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { withBasePath } from "@/lib/base-path";

/**
 * 継ぎ目なくループする動画。
 *
 * ■ なぜ `loop` 属性だけでは足りないのか
 *   `loop` は最終フレームから先頭フレームへ**瞬時に**戻ります。
 *   最初と最後の絵が揃っていない動画では、そこで映像が飛んで見えます。
 *   ここでは同じ動画を2枚重ね、終わりが近づいたらもう1枚を先頭から再生し、
 *   **重なっている間に不透明度で入れ替え**ます。
 *   動画の中身によらず自然につながります。
 *
 * ■ 自動再生を成立させる条件
 *   ブラウザは消音でなければ自動再生を許可しません。
 *   `muted` と `playsInline` は必須です（音声トラックがあっても音は出ません）。
 *
 * ■ 出せないときは `fallback` に落とします
 *   動きを抑える設定・読み込み失敗・動画未対応のいずれでも同じ経路です。
 *   読み込み失敗はハイドレーション前に起きることがあるため、
 *   `onError` だけでなくマウント時にも `video.error` を見ます。
 */

/** 入れ替えにかける時間（秒）。長すぎると二重像が見え、短すぎると継ぎ目が出ます */
const CROSSFADE_SEC = 0.7;

export function SeamlessVideo({
  src,
  className,
  videoClassName,
  fallback = null,
}: {
  /** public/ からの絶対パス。ベースパスはこの中で付けます */
  src: string;
  className?: string;
  videoClassName?: string;
  /** 動画を出せないときに代わりに描くもの */
  fallback?: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const [front, setFront] = useState(0);
  const first = useRef<HTMLVideoElement>(null);
  const second = useRef<HTMLVideoElement>(null);
  // 毎回新しい配列を作ると、依存配列が毎レンダリング変わってしまいます
  const refs = useMemo(() => [first, second], []);
  const swapping = useRef(false);

  const usable = !failed && !reduced;

  useEffect(() => {
    if (!usable) return;
    for (const ref of refs) {
      if (ref.current?.error) {
        setFailed(true);
        return;
      }
    }
  }, [usable, refs]);

  /** 終わりが近づいたら、裏の1枚を先頭から流して入れ替えます */
  const onTimeUpdate = useCallback(
    (index: number) => () => {
      if (index !== front || swapping.current) return;
      const current = refs[index].current;
      const other = refs[1 - index].current;
      if (!current || !other || !Number.isFinite(current.duration)) return;

      if (current.duration - current.currentTime > CROSSFADE_SEC) return;

      swapping.current = true;
      other.currentTime = 0;
      void other.play().catch(() => {
        // 自動再生が拒否された場合は入れ替えをあきらめ、通常のループに任せます
      });
      setFront(1 - index);
      // 入れ替え完了までは再判定しません（往復して点滅するのを防ぎます）
      window.setTimeout(() => {
        swapping.current = false;
      }, CROSSFADE_SEC * 1000);
    },
    [front, refs],
  );

  if (!usable) return <>{fallback}</>;

  return (
    <span aria-hidden="true" className={cn("relative block", className)}>
      {[0, 1].map((index) => (
        <video
          key={index}
          ref={refs[index]}
          src={withBasePath(src)}
          // 1枚目だけ自動再生し、2枚目は入れ替えのときに再生します
          autoPlay={index === 0}
          muted
          playsInline
          preload="auto"
          tabIndex={-1}
          onError={() => setFailed(true)}
          onTimeUpdate={onTimeUpdate(index)}
          style={{ transitionDuration: `${CROSSFADE_SEC}s` }}
          className={cn(
            index === 0 ? "block" : "absolute inset-0",
            "h-full w-full transition-opacity ease-linear",
            front === index ? "opacity-100" : "opacity-0",
            videoClassName,
          )}
        />
      ))}
    </span>
  );
}
