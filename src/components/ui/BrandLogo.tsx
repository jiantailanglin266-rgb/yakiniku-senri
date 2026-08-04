import Image from "next/image";

import { media } from "@/data/media";
import { cn } from "@/lib/utils";

/**
 * 店名ロゴ。動くロゴ（動画）を、静止画のロゴと同じ大きさで表示します。
 *
 * ============================================================
 * ⚠ 動画が出せないときも、必ずロゴが見えるようにしています。
 *   - `poster` に静止画のロゴを指定 … 読み込み前・再生前はこれが出ます
 *   - <video> の中に <img> を置く   … 動画に対応していない環境で出ます
 *   どちらも同じロゴなので、「ロゴが消える」状態になりません。
 *
 * ⚠ prefers-reduced-motion では静止画に切り替えます。
 *   動きを抑える設定の人に、繰り返し動くロゴを見せないためです。
 *   JavaScript は使わず、Tailwind の motion-reduce 変種で切り替えます。
 *
 * ⚠ 枠の比率は静止画ロゴ（514:303）に固定しています。
 *   動画の実比率がこれと違っても object-contain で内側に収まるため、
 *   ヘッダーの高さが動画次第で変わることはありません（CLSなし）。
 * ============================================================
 *
 * ■ 音声について
 *   `muted` は自動再生の条件です（多くのブラウザは音の出る自動再生を止めます）。
 *   ロゴに音は不要なので、音声トラックの有無に関わらず常に消音します。
 */

/** 動くロゴの置き場所。差し替えるときはこのファイルを上書きしてください。 */
export const BRAND_LOGO_VIDEO = "/videos/logo.mp4";

export function BrandLogo({
  /** 高さの指定（例: "h-11 sm:h-14"）。幅は比率から決まります。 */
  className,
  /** 装飾として置く場合は空文字。リンク側に aria-label があるときはこちら。 */
  alt = media.logo.alt,
  /** ファーストビューに出る場合だけ true（ヘッダー） */
  priority = false,
}: {
  className?: string;
  alt?: string;
  priority?: boolean;
}) {
  return (
    <span
      className={cn("relative block aspect-[514/303] w-auto shrink-0", className)}
      /* 読み上げは中の要素が担います */
    >
      {/* 動くロゴ。動きを抑える設定では隠します */}
      <video
        className="size-full object-contain motion-reduce:hidden"
        src={BRAND_LOGO_VIDEO}
        poster={media.logo.src}
        autoPlay
        loop
        muted
        playsInline
        /* 装飾ではないので、読み上げ環境には下の画像を見せます */
        aria-hidden="true"
        tabIndex={-1}
      >
        {/*
          動画に対応していない環境ではこちらが出ます。
          <video> の代替内容は素の <img> でなければならず、
          next/image はラッパー要素を挟むため使えません。
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={media.logo.src} alt={alt} width={media.logo.width} height={media.logo.height} />
      </video>

      {/* 動きを抑える設定のときだけ出る静止版。読み上げも常にこちらが担います */}
      <Image
        src={media.logo.src}
        alt={alt}
        width={media.logo.width}
        height={media.logo.height}
        priority={priority}
        className="absolute inset-0 size-full object-contain opacity-0 motion-reduce:opacity-100"
      />
    </span>
  );
}
