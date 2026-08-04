"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cx } from "@/portal/components/ui/primitives";
import { portalBandVideo } from "@/portal/lib/site";

/**
 * 横一本の映像帯。ヘッダーの下とフッターの上に置きます。
 *
 * ■ 帯として見せます
 *   元の映像は 16:9 に近い比率ですが、ここでは高さを抑えた帯に切り出します
 *   （`object-cover` で上下をトリミング）。両端はマスクで溶かし、
 *   ページ全体の連続した背景から浮かないようにしています。
 *
 * ■ 自動再生を成立させる条件
 *   ブラウザは消音でなければ自動再生を許可しません。`muted` と `playsInline` は必須です。
 *   この動画には音声トラックがありますが、`muted` で再生するため音は出ません。
 *
 * ■ prefers-reduced-motion では自動再生しません
 *   代わりに操作バーを出し、見たい方が自分で再生できるようにします。
 *   枠の高さは変わらないため、レイアウトは動きません。
 *
 * ■ 読み込みを遅らせています
 *   帯が画面に近づくまで <video> を作りません。
 *   フッター側の帯を、上部だけ見て離脱する方に負担させないためです。
 *
 * ■ 読み上げの対象から外しています
 *   装飾枠なので、意味のある情報は本文側に置いてください。
 *   映像自体に読ませたい情報が入る場合は `aria-hidden` を外し、説明を付けてください。
 */
export function VideoBand({
  src = portalBandVideo,
  className,
  priority = false,
}: {
  src?: string;
  className?: string;
  /** ヘッダー直下の1本だけ先に読み込みます */
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
    <div aria-hidden={!reduced} className={cx("video-band", className)}>
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
