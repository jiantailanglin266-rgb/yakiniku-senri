import Image from "next/image";
import type { Media } from "@/data/media";
import { cn } from "@/lib/utils";

type FigureProps = {
  media: Media;
  /** ラッパー（アスペクト比はここで指定します） */
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
  /** 矩形の縁を立たせないマスクフェードを適用 */
  soft?: boolean;
  /** 画像未設定時にプレースホルダー内へ表示するラベル */
  label?: string;
  /** カラーグレード用オーバーレイを外す */
  plain?: boolean;
};

/**
 * サイト内のすべての画像はこのコンポーネントを経由します。
 * media.src が空文字の場合は、レイアウトを崩さずプレースホルダーを表示します。
 */
export function Figure({
  media,
  className,
  imageClassName,
  sizes = "100vw",
  priority = false,
  soft = false,
  label,
  plain = false,
}: FigureProps) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden",
        !plain && "media-frame",
        soft && "media-soft",
        className,
      )}
    >
      {media.src ? (
        <Image
          src={media.src}
          alt={media.alt}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          className={cn("object-cover", imageClassName)}
        />
      ) : (
        <div className="media-placeholder" aria-hidden="true">
          <span className="font-display text-gold/45 text-[0.7rem] tracking-[0.42em] uppercase">
            {label ?? "image"}
          </span>
        </div>
      )}
    </div>
  );
}
