"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cx } from "@/portal/components/ui/primitives";
import { brand, brandLogoVideo } from "@/portal/lib/site";

/**
 * CRYPTO PORT のロゴ。
 *
 * ■ 動画ロゴを再生します
 *   `brandLogoVideo` に指定した mp4 を、消音でループ再生します。
 *   ブラウザは消音でなければ自動再生を許可しないため、
 *   `muted` と `playsInline` は必須です（音声トラックがあっても音は出ません）。
 *
 * ■ 文字ロゴへ確実に戻れるようにしています
 *   次の場合は、これまでどおりの文字ロゴを出します。
 *     - 動画が未設定
 *     - 再生できなかった（対応していないコーデック・読み込み失敗）
 *       ※ 読み込み失敗はハイドレーション前に起きることがあるため、
 *          `onError` だけでなくマウント時にも `video.error` を見ます。
 *          これが無いと、失敗したときに空の枠だけが残ります。
 *     - `prefers-reduced-motion` が有効
 *   ロゴが消えたまま何も出ない状態を作らないための作りです。
 *
 * ■ 読み上げ
 *   動画自体は装飾なので `aria-hidden` にし、
 *   サイト名は視覚的に隠したテキスト（`sr-only`）で必ず読ませます。
 *   ヘッダーではリンク側に `aria-label` も付いています。
 */
export function BrandLogo({
  className,
  videoClassName,
  textClassName,
  withMark = false,
}: {
  className?: string;
  /** 動画ロゴの大きさ。置き場所ごとに変えます */
  videoClassName?: string;
  /** 文字ロゴに落ちたときの大きさ */
  textClassName?: string;
  /** 文字ロゴに落ちたとき、頭の「CP」マークも出すか（ヘッダー用） */
  withMark?: boolean;
}) {
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // ハイドレーション前に読み込みが失敗していると onError を受け取れません。
  // マウント時の状態も確認して、取りこぼさないようにします。
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.error) {
      setFailed(true);
      return;
    }
    const onError = () => setFailed(true);
    video.addEventListener("error", onError);
    return () => video.removeEventListener("error", onError);
  }, []);

  const useVideo = Boolean(brandLogoVideo) && !failed && !reduced;

  if (!useVideo) {
    // 差し替え前とまったく同じ見た目に戻します
    return (
      <span className={cx("inline-flex items-center gap-2", className)}>
        {withMark ? <BrandMark /> : null}
        <BrandWordmark className={textClassName} />
      </span>
    );
  }

  return (
    <span className={cx("inline-flex items-center", className)}>
      <video
        ref={videoRef}
        src={brandLogoVideo}
        aria-hidden="true"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        // 再生できなければ文字ロゴへ戻します
        onError={() => setFailed(true)}
        // 高さは呼び出し側で決めます（h-auto をここに置くと指定が競合します）
        className={cx("block w-auto object-contain", videoClassName)}
      />
      {/* サイト名は必ず読み上げられるようにします */}
      <span className="sr-only">{brand.name}</span>
    </span>
  );
}

/** 頭の「CP」マーク。ヘッダーの文字ロゴに添えます */
function BrandMark() {
  return (
    <span aria-hidden="true" className="relative grid size-8 place-items-center">
      <span className="absolute inset-0 rounded-lg bg-linear-to-br from-(--color-cyan) via-(--color-blue) to-(--color-magenta) opacity-90" />
      <span className="absolute inset-[2px] rounded-[6px] bg-(--color-void)" />
      <span className="relative font-mono text-xs font-bold text-(--color-cyan)">CP</span>
    </span>
  );
}

/** これまでの文字ロゴ。動画が使えないときの表示です */
export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cx("font-display font-semibold", className)}>
      <span className="text-gradient">{brand.nameParts[0]}</span>
      {brand.nameParts[1] ? (
        <span className="ms-1 text-(--color-ink-soft)">{brand.nameParts.slice(1).join(" ")}</span>
      ) : null}
    </span>
  );
}
