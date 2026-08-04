/**
 * Wikimedia Commons 画像の描画。
 *
 * ■ 画像とクレジットを分離しません
 *   このコンポーネントは `<figure>` を返し、画像とクレジットを必ず同じ要素に含めます。
 *   クレジットだけを外して画像を使う経路を、意図的に用意していません。
 *
 * ■ 表示できない画像は描画しません
 *   `isPublishable()` が偽の画像（未承認・ライセンス不明・作者不明・使用停止）は
 *   `null` を返します。呼び出し側はフォールバック装飾を出してください。
 *
 * ■ 加工について
 *   トリミング（object-fit / object-position）とオーバーレイは「改変」に当たります。
 *   改変が許可されていないライセンスの画像は、そもそも掲載対象外にしています
 *   （lib/eligibility.ts）。
 */
import Image from "next/image";

import { isPublishable } from "../lib/eligibility";
import type { ImageSlot, ObjectPosition, WikimediaAsset } from "../types";
import { slotSizes } from "../types";
import { ImageAttribution, type AttributionLabels } from "./ImageAttribution";

function toObjectPosition(position: ObjectPosition): string {
  if (typeof position === "string") return position;
  return `${position.x}% ${position.y}%`;
}

export type WikimediaImageProps = {
  asset: WikimediaAsset;
  /** 代替テキスト。装飾目的なら空文字（読み上げ対象から外れます） */
  alt: string;
  caption?: string | null;
  slot: ImageSlot;
  labels: AttributionLabels;
  /** ファーストビューなど、先に読み込むべき画像 */
  priority?: boolean;
  sizes?: string;
  className?: string;
  /** クレジットの出し方。overlay は画像の上、block は画像の直下 */
  attributionTone?: "overlay" | "block";
};

export function WikimediaImage({
  asset,
  alt,
  caption,
  slot,
  labels,
  priority = false,
  sizes,
  className,
  attributionTone = "overlay",
}: WikimediaImageProps) {
  // ライセンス情報が揃っていない画像は、そもそも描画しません
  if (!isPublishable(asset)) return null;

  const target = slotSizes[slot];
  /*
    表示に使うファイルの優先順位。
      1. 生成済み WebP（静的書き出しでは next/image の最適化APIが使えないため）
      2. ローカルへ保存した原本
      3. Wikimedia の原本（未保存のとき）
    どれを使っても、作者・ライセンスの表示義務は変わりません。
  */
  const src = asset.optimized?.webp ?? asset.localPath ?? asset.originalUrl;

  return (
    <figure className={["relative m-0 overflow-hidden", className ?? ""].join(" ")}>
      <div className="relative" style={{ aspectRatio: `${target.width} / ${target.height}` }}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          loading={priority ? undefined : "lazy"}
          sizes={sizes ?? "(min-width: 1024px) 50vw, 100vw"}
          // 読み込み中の下地。寸法は aspectRatio で確保済みなので CLS は起きません
          placeholder={asset.blurDataURL ? "blur" : undefined}
          blurDataURL={asset.blurDataURL ?? undefined}
          className="object-cover"
          style={{ objectPosition: toObjectPosition(asset.objectPosition) }}
        />

        {/* 画像の上に文字やクレジットを載せても読めるようにするグラデーション */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(5,7,15,0) 40%, rgba(5,7,15,0.55) 78%, rgba(5,7,15,0.82) 100%)",
          }}
        />

        {attributionTone === "overlay" ? (
          <ImageAttribution
            asset={asset}
            labels={labels}
            tone="overlay"
            className="absolute inset-x-0 bottom-0"
          />
        ) : null}
      </div>

      {attributionTone === "block" ? (
        <ImageAttribution asset={asset} labels={labels} tone="block" />
      ) : null}

      {caption ? (
        <figcaption className="text-media-mist px-1 pt-2 text-[0.76rem] leading-relaxed">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
