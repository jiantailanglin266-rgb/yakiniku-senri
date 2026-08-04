"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { videoBand } from "@/data/media";

/**
 * 横一本の映像帯。金色の英字マーキーと同じ位置に置きます。
 *
 * ■ 帯として見せます
 *   元の映像は 16:9 に近い比率ですが、ここでは高さを抑えた帯に切り出します
 *   （`object-cover` で上下をトリミング）。両端はマスクで溶かし、
 *   マーキーと同じ「切り口を見せない」見え方に揃えています。
 *
 * ■ 自動再生を成立させる条件
 *   ブラウザは消音でなければ自動再生を許可しません。`muted` と `playsInline` は必須です。
 *   この動画には音声トラックがありますが、`muted` で再生するため音は出ません。
 *
 * ■ prefers-reduced-motion では自動再生しません
 *   代わりに操作バーを出し、見たい方が自分で再生できるようにします
 *   （ブランドムービーと同じ扱いです）。枠の高さは変わらないため、レイアウトは動きません。
 *
 * ■ 読み込みを遅らせています
 *   帯が画面に近づくまで <video> を作りません。
 *   ページ上部だけ見て離脱する方に、下の帯のダウンロードを負担させないためです。
 *
 * ■ 読み上げの対象から外しています
 *   置き換え前のマーキーと同じ装飾枠です。意味のある情報は本文側に置いてください。
 *   映像自体に読ませたい情報が入る場合は `aria-hidden` を外し、説明を付けてください。
 */
export function VideoBand({
  src = videoBand.mp4,
  className,
  priority = false,
}: {
  src?: string;
  className?: string;
  /** 最初の1本だけ先に読み込みます（ファーストビューに近いため） */
  priority?: boolean;
}) {
  const reduced = useReducedMotion();
  const [inView, setInView] = useState(priority);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || inView) return;

    if (typeof IntersectionObserver !== "function") {
      const timer = setTimeout(() => setInView(true), 0);
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, [inView]);

  if (!src) return null;

  return (
    <div aria-hidden={!reduced} className={cn("video-band", className)}>
      <div ref={frameRef} className="video-band-frame">
        {inView ? (
          <video
            src={src}
            autoPlay={!reduced}
            controls={Boolean(reduced)}
            loop
            muted
            playsInline
            preload="auto"
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
    </div>
  );
}
