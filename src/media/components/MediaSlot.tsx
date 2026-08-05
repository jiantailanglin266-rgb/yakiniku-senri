/**
 * ページ側から使う唯一の入口。
 *
 * 掲載枠（pageKey + slot）に対して
 *   - ライセンス確認済みの Wikimedia 画像があれば、クレジット付きで表示
 *   - 無ければフォールバック装飾（外部素材を使わない CSS/SVG）を表示
 * します。
 *
 * ページ側が `WikimediaImage` を直接呼ばずこれを経由することで、
 * 「画像が無いときに関連の薄い画像を貼る」経路が生まれないようにしています。
 */
import { resolveImage } from "../lib/resolve";
import { getMediaLabels } from "../i18n/labels";
import type { ImageSlot } from "../types";
import { FallbackVisual, type FallbackTheme } from "./FallbackVisual";
import { WikimediaImage } from "./WikimediaImage";

export type MediaSlotProps = {
  /** 例: "cardport:guide:points-basics" */
  pageKey: string;
  slot: ImageSlot;
  locale: string;
  /** 画像が無いときの装飾テーマ */
  theme?: FallbackTheme;
  /** 同じテーマの枠が並ぶときに見た目を変える種 */
  seed?: number;
  className?: string;
  /** 装飾の上に重ねる要素（見出しなど）。画像がある場合は表示しません */
  fallbackChildren?: React.ReactNode;
  priority?: boolean;
  sizes?: string;
  attributionTone?: "overlay" | "block";
  /** キャプションを出すか。カード一覧など狭い枠では false */
  showCaption?: boolean;
};

export function MediaSlot({
  pageKey,
  slot,
  locale,
  theme = "neutral",
  seed = 0,
  className,
  fallbackChildren,
  priority = false,
  sizes,
  attributionTone = "overlay",
  showCaption = true,
}: MediaSlotProps) {
  const resolved = resolveImage(pageKey, slot, locale);

  if (!resolved) {
    return (
      <FallbackVisual theme={theme} seed={seed} className={className}>
        {fallbackChildren}
      </FallbackVisual>
    );
  }

  return (
    <WikimediaImage
      asset={resolved.asset}
      alt={resolved.altText}
      caption={showCaption ? resolved.caption : null}
      slot={slot}
      labels={getMediaLabels(locale)}
      priority={priority}
      sizes={sizes}
      className={className}
      attributionTone={attributionTone}
    />
  );
}
