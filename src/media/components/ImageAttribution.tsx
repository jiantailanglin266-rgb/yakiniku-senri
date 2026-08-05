/**
 * 画像のクレジット表示。
 *
 * ■ 小さすぎる表示・見えない表示は禁止
 *   文字サイズは 0.68rem を下限とし、コントラストは背景に対して確保します。
 *   `sr-only` や `display:none` でクレジットを隠す実装をしてはいけません。
 *
 * ■ 原文を保持する項目
 *   作者名・ライセンス正式名称・"Wikimedia Commons" は翻訳しません。
 */
import { buildAttributionParts } from "../lib/attribution";
import { getLicense } from "../lib/license";
import type { WikimediaAsset } from "../types";

export type AttributionLabels = {
  /** 例: 「写真」 */
  photo: string;
  /** 例: 「（トリミング済み）」 */
  modified: string;
  /** 例: 「画像の出典とライセンスを表示」 */
  detailsLabel: string;
  /** 継承（ShareAlike）の告知 */
  shareAlikeNotice: string;
};

export function ImageAttribution({
  asset,
  labels,
  className,
  tone = "overlay",
  renderedAsDerivative = false,
}: {
  asset: WikimediaAsset;
  labels: AttributionLabels;
  className?: string;
  /** overlay: 画像の上に重ねる / block: 画像の直下に置く */
  tone?: "overlay" | "block";
  /**
   * 表示の時点で加工しているか（トリミング・オーバーレイ）。
   *
   * 加工は素材そのものではなく**描画側**で起きます。
   * WikimediaImage は全画像にグラデーションを重ね object-fit: cover で
   * 切り抜くため、asset.isModified を手で立てる運用では実態とずれます。
   * 描画側から渡してもらい、継承の告知漏れを防ぎます。
   */
  renderedAsDerivative?: boolean;
}) {
  const parts = buildAttributionParts(asset, labels);

  /*
    CC BY-SA の画像に手を加えて出す場合、改変版も同じ条件で提供している
    ことを示す必要があります（4.0 の場合 §3(b)）。
    告知を省くと、クレジットが揃っていても条件違反になります。
  */
  const showShareAlike =
    getLicense(asset.licenseCode).shareAlikeRequired && (renderedAsDerivative || asset.isModified);

  const base =
    tone === "overlay"
      ? "bg-black/65 text-white/85 backdrop-blur-sm"
      : "text-media-dim border-media-line/50 border-t";

  return (
    <p
      className={[
        "flex flex-wrap items-center gap-x-1.5 gap-y-0.5 px-2.5 py-1.5 text-[0.68rem] leading-snug",
        base,
        className ?? "",
      ].join(" ")}
    >
      {parts.map((part, index) => (
        <span key={`${part.text}-${index}`} className="inline-flex items-center gap-1.5">
          {index > 0 ? (
            <span aria-hidden="true" className="opacity-50">
              /
            </span>
          ) : null}
          {part.href ? (
            <a
              href={part.href}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="underline decoration-dotted underline-offset-2 hover:no-underline"
              // 作者名・ライセンス名は原文のまま。翻訳ツールにも触らせません
              translate={part.verbatim ? "no" : undefined}
            >
              {part.text}
            </a>
          ) : (
            <span translate={part.verbatim ? "no" : undefined}>{part.text}</span>
          )}
        </span>
      ))}

      {/* 継承の告知。クレジットと同じ場所に出します（別ページ送りにしません） */}
      {showShareAlike ? (
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="opacity-50">
            /
          </span>
          <span>{labels.shareAlikeNotice}</span>
        </span>
      ) : null}
    </p>
  );
}
