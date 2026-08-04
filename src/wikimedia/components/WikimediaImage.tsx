/**
 * Wikimedia Commons 画像の表示コンポーネント。
 *
 * ■ このコンポーネントの最も重要な仕事
 *   「ライセンス情報が無い画像を描画できないようにすること」です。
 *   evaluateAsset() を通らない asset を渡すと、画像ではなくフォールバックを返します。
 *   呼び出し側がクレジットを外すこともできません（内部で必ず描画します）。
 *
 * ■ 加工について
 *   グラデーションの重ね・角丸・トリミングは「改変」にあたりうるため、
 *   derivativeWorksAllowed が false のライセンス（CC BY-ND）は
 *   そもそも公開候補から除外されています（licenses.ts）。
 *   人物写真・報道写真・歴史資料は overlay を弱める運用にしてください。
 */
import Image from "next/image";
import type { WikimediaAsset } from "../types";
import { evaluateAsset } from "../licenses";
import { altFor, captionFor } from "../credit";
import { ImageAttribution } from "./ImageAttribution";
import { FallbackVisual } from "./FallbackVisual";

export type WikimediaImageProps = {
  asset: WikimediaAsset | undefined;
  locale: string;
  /** 表示比率。元画像を引き伸ばさないため、必ず指定します */
  ratio?: "16/9" | "1/1" | "4/5" | "21/9";
  /** レスポンシブの sizes 属性 */
  sizes?: string;
  /** LCP 対象なら true（ヒーローのみ） */
  priority?: boolean;
  /** 装飾用途なら true（alt="" になります） */
  decorative?: boolean;
  /** 画像の上に暗いグラデーションを重ねるか（文字を載せる場合） */
  overlay?: "none" | "soft" | "strong";
  /** クレジットの位置 */
  creditPlacement?: "below" | "overlay" | "none-hover";
  /** キャプションを表示するか */
  showCaption?: boolean;
  /** フォールバック時の種と色 */
  fallbackSeed: string;
  fallbackAccent: string;
  fallbackGlyph?: string;
  className?: string;
};

export function WikimediaImage({
  asset,
  locale,
  ratio = "16/9",
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  priority = false,
  decorative = false,
  overlay = "soft",
  creditPlacement = "below",
  showCaption = false,
  fallbackSeed,
  fallbackAccent,
  fallbackGlyph,
  className = "",
}: WikimediaImageProps) {
  // ライセンス・作者・出典が揃っていない画像は描画しません
  const decision = asset ? evaluateAsset(asset) : { allowed: false };

  if (!asset || !decision.allowed) {
    return (
      <FallbackVisual
        seed={fallbackSeed}
        accent={fallbackAccent}
        glyph={fallbackGlyph}
        ratio={ratio}
        className={className}
      />
    );
  }

  const alt = altFor(asset, locale, decorative);
  const caption = captionFor(asset, locale);
  const overlayClass =
    overlay === "strong"
      ? "bg-linear-to-t from-void via-void/45 to-transparent"
      : overlay === "soft"
        ? "bg-linear-to-t from-void/85 via-void/15 to-transparent"
        : "";

  return (
    <figure className={className}>
      <div
        className="group/img relative isolate overflow-hidden rounded-[inherit]"
        style={{ aspectRatio: ratio.replace("/", " / ") }}
      >
        <Image
          src={asset.thumbnailUrl ?? asset.originalUrl}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          // 被写体が切れないように、画像ごとの位置指定を尊重します
          style={{ objectFit: "cover", objectPosition: asset.objectPosition ?? "center" }}
        />

        {overlayClass ? (
          <span
            className={`pointer-events-none absolute inset-0 ${overlayClass}`}
            aria-hidden="true"
          />
        ) : null}

        {/* ホバー時にクレジットを出す方式。常時表示が難しいカードで使います */}
        {creditPlacement === "none-hover" ? (
          <span className="bg-void/90 pointer-events-none absolute inset-x-0 bottom-0 translate-y-full px-2 py-1 transition-transform duration-300 group-focus-within/img:translate-y-0 group-hover/img:translate-y-0">
            <ImageAttribution asset={asset} locale={locale} />
          </span>
        ) : null}

        {creditPlacement === "overlay" ? (
          <span className="bg-void/80 absolute right-1.5 bottom-1.5 max-w-[90%] rounded px-1.5 py-0.5 backdrop-blur-sm">
            <ImageAttribution asset={asset} locale={locale} />
          </span>
        ) : null}
      </div>

      {showCaption && caption ? (
        <figcaption className="text-ink-dim mt-2 text-xs leading-relaxed">{caption}</figcaption>
      ) : null}

      {creditPlacement === "below" ? (
        <ImageAttribution asset={asset} locale={locale} className="mt-1.5" />
      ) : null}
    </figure>
  );
}

/**
 * 記事内の図版。キャプションとクレジットを必ず併記します。
 */
export function WikimediaFigure(
  props: Omit<WikimediaImageProps, "showCaption" | "creditPlacement">,
) {
  return <WikimediaImage {...props} showCaption creditPlacement="below" />;
}

/**
 * ヒーロー用。文字を載せるため overlay を強めにします。
 * 低解像度の画像はヒーローに使いません（select.ts が弾きます）。
 */
export function WikimediaHero(props: Omit<WikimediaImageProps, "overlay" | "priority">) {
  return (
    <WikimediaImage {...props} overlay="strong" priority creditPlacement="overlay" ratio="21/9" />
  );
}

/**
 * カード用。クレジットはホバー／フォーカスで出します。
 * カード内は面積が限られるため常時表示だと情報が潰れますが、
 * 記事末尾だけの表示にはせず、画像のすぐそばに出せる形を保ちます。
 */
export function WikimediaCardImage(props: Omit<WikimediaImageProps, "creditPlacement">) {
  return <WikimediaImage {...props} creditPlacement="none-hover" />;
}
