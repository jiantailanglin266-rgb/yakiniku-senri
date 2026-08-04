"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { brand, brandLogoVideo } from "@/portal/lib/site";

/**
 * ファーストビューの動くロゴ。
 *
 * ■ 継ぎ目のないループにするために
 *   `loop` 属性だけだと、最終フレームから先頭フレームへ瞬時に戻ります。
 *   最初と最後の絵が揃っていない動画では、そこで映像が飛んで見えます。
 *   ここでは同じ動画を2枚重ね、終わりが近づいたら
 *   もう1枚を先頭から再生して**重なりの間に入れ替え**ます。
 *   入れ替えは不透明度のトランジションなので、動画の中身によらず自然につながります。
 *
 * ■ 自動再生を成立させる条件
 *   ブラウザは消音でなければ自動再生を許可しません。
 *   `muted` と `playsInline` は必須です（音声トラックがあっても音は出ません）。
 *
 * ■ prefers-reduced-motion では動かしません
 *   動きを減らす設定の方には、静止したサイト名だけを出します。
 *   ロゴが消えないよう、動画が使えないときも同じ表示に落とします。
 */

/** 入れ替えにかける時間（秒）。長すぎると二重像が見え、短すぎると継ぎ目が出ます */
const CROSSFADE_SEC = 0.7;

export function HeroLogoVideo({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const [front, setFront] = useState(0);
  const first = useRef<HTMLVideoElement>(null);
  const second = useRef<HTMLVideoElement>(null);
  // 毎回新しい配列を作ると、依存配列が毎レンダリング変わってしまいます
  const refs = useMemo(() => [first, second], []);
  const swapping = useRef(false);

  const usable = Boolean(brandLogoVideo) && !failed && !reduced;

  // 読み込み失敗はハイドレーション前に起きることがあります。
  // onError だけに頼ると、失敗しても空の枠が残ります。
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

  if (!usable) {
    return (
      <p className={className}>
        <span className="font-display text-gradient text-3xl font-bold sm:text-4xl">
          {brand.name}
        </span>
      </p>
    );
  }

  return (
    <span className={className} aria-hidden="true">
      <span className="relative block">
        {[0, 1].map((index) => (
          <video
            key={index}
            ref={refs[index]}
            src={brandLogoVideo}
            // 1枚目だけ自動再生し、2枚目は入れ替えのときに再生します
            autoPlay={index === 0}
            muted
            playsInline
            preload="auto"
            onError={() => setFailed(true)}
            onTimeUpdate={onTimeUpdate(index)}
            style={{ transitionDuration: `${CROSSFADE_SEC}s` }}
            className={[
              index === 0 ? "block" : "absolute inset-0",
              "h-full w-full object-contain transition-opacity ease-linear",
              front === index ? "opacity-100" : "opacity-0",
            ].join(" ")}
          />
        ))}
      </span>
      {/* サイト名は必ず読み上げられるようにします */}
      <span className="sr-only">{brand.name}</span>
    </span>
  );
}
