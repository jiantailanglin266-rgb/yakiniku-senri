import Image from "next/image";
import { withBasePath } from "@/lib/base-path";
import { cx } from "@/portal/components/ui/primitives";

/**
 * ページ上部のイメージ画像。
 *
 * ■ 出典と性格
 *   運営側で用意したデザインイメージです（`src/media/data/site-assets.ts` に記録）。
 *   Wikimedia の個別ライセンス判定を通す画像とは別系統なので、
 *   `src/media` のコンポーネントとは混ぜません。
 *
 * ■ 注記を必ず添えます
 *   画像の中には価格・評価・キャンペーン金額が描かれていますが、
 *   いずれも実際のデータではありません。数値として読まれないよう、
 *   画像のすぐ下に注記を出します。注記だけ外せる作りにはしていません。
 *
 * ■ 読み上げ
 *   画面の内容は本文側にあるため、画像は装飾として扱い alt は空にします。
 *   代わりに注記のテキストが読み上げられます。
 */
export function PageVisual({
  name,
  locale,
  priority = false,
  className,
}: {
  /** public/images/portal/pages/<name>.webp */
  name: string;
  locale: string;
  priority?: boolean;
  className?: string;
}) {
  const note =
    locale === "ja"
      ? "イメージ画像です。画像内の価格・評価・キャンペーン内容は実際のデータではありません。"
      : "Illustrative image. The prices, ratings and campaign details shown in it are not real data.";

  return (
    <figure className={cx("mb-10", className)}>
      <div className="overflow-hidden rounded-2xl border border-(--color-hairline)">
        <Image
          src={withBasePath(`/images/portal/pages/${name}.webp`)}
          alt=""
          width={1600}
          height={900}
          priority={priority}
          sizes="(min-width: 1280px) 72rem, 100vw"
          className="h-auto w-full"
        />
      </div>
      <figcaption className="mt-2 px-1 text-xs text-(--color-ink-dim)">{note}</figcaption>
    </figure>
  );
}
