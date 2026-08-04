import Image from "next/image";
import { photoCredit, portalPhoto, type PhotoKind } from "@/portal/lib/photos";
import { cx } from "@/portal/components/ui/primitives";

/**
 * ページ上部の写真（mountain-peak 方式）。
 *
 * ■ 表示するもの
 *   `public/images/portal/` に取得済みの画像があるときだけ描画します。
 *   無ければ null を返し、呼び出し側の生成ビジュアルがそのまま残ります。
 *
 * ■ クレジット
 *   画像ごとではなく、サイト共通の一括表記を画像の直下に置きます。
 *   ライセンス名は識別子なので翻訳しません。
 */
export function PortalPhoto({
  kind,
  slug,
  alt,
  locale,
  priority = false,
  className,
  sizes = "(min-width: 1280px) 60rem, 100vw",
}: {
  kind: PhotoKind;
  slug: string;
  /** 画面の内容を説明する代替テキスト。呼び出し側が必ず渡します */
  alt: string;
  locale: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
}) {
  const photo = portalPhoto(kind, slug);
  if (!photo) return null;

  return (
    <figure className={cx("overflow-hidden rounded-2xl", className)}>
      <Image
        src={photo.src}
        alt={alt}
        width={photo.width}
        height={photo.height}
        sizes={sizes}
        priority={priority}
        className="h-auto w-full object-cover"
      />
      <figcaption className="mt-2 px-1 text-xs text-(--color-ink-dim)">
        <span translate="no">{photoCredit(locale)}</span>
      </figcaption>
    </figure>
  );
}
