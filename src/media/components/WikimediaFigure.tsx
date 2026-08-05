/**
 * 記事本文の中に置く図版。
 *
 * ■ MediaSlot との違い
 *   MediaSlot は「枠が必ず埋まる」用途（カード・ヒーロー）です。
 *   本文中の図版は、画像が無ければ**何も出しません**。
 *   意味のない装飾を本文に挟むと、読者に無関係な情報を見せることになるためです。
 *
 * ■ クレジット
 *   本文中の図版は、画像直下にクレジットを置き（`tone="block"`）、
 *   さらに出典・ライセンスの詳細を開けるようにします。
 */
import { resolveImage } from "../lib/resolve";
import { getMediaLabels } from "../i18n/labels";
import type { ImageSlot } from "../types";
import { ImageSourceDetails } from "./ImageSourceDetails";
import { WikimediaImage } from "./WikimediaImage";

export function WikimediaFigure({
  pageKey,
  locale,
  slot = "inline",
  className,
  sizes,
}: {
  pageKey: string;
  locale: string;
  slot?: ImageSlot;
  className?: string;
  sizes?: string;
}) {
  const resolved = resolveImage(pageKey, slot, locale);
  // 画像が無い本文図版は、そのまま出しません
  if (!resolved) return null;

  const labels = getMediaLabels(locale);

  return (
    <div className={["my-6", className ?? ""].join(" ")}>
      <WikimediaImage
        asset={resolved.asset}
        alt={resolved.altText}
        caption={resolved.caption}
        slot={slot}
        labels={labels}
        sizes={sizes ?? "(min-width: 1024px) 720px, 100vw"}
        attributionTone="block"
        className="border-media-line/40 rounded-xl border"
      />
      <ImageSourceDetails asset={resolved.asset} labels={labels} className="mt-2 px-1" />
    </div>
  );
}
