/**
 * 画像コンポーネントの公開窓口。
 *
 * ページ側は原則 `MediaSlot` / `WikimediaFigure` だけを使ってください。
 * `WikimediaImage` を直接呼ぶと、フォールバックの分岐を自分で書くことになり、
 * 「画像が無いときに関連の薄い画像を貼る」抜け道ができます。
 */
export { MediaSlot } from "./MediaSlot";
export { WikimediaFigure } from "./WikimediaFigure";
export { FallbackVisual, type FallbackTheme } from "./FallbackVisual";
export { ImageAttribution, type AttributionLabels } from "./ImageAttribution";
export { ImageLicenseBadge } from "./ImageLicenseBadge";
export { ImageSourceDetails } from "./ImageSourceDetails";
export { MediaReviewQueue } from "./MediaReviewQueue";
export { MediaAdminBrowser } from "./MediaAdminBrowser";
export { WikimediaImage } from "./WikimediaImage";
