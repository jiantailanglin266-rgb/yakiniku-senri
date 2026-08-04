import type { MarqueeRows } from "@/data/marquee";
import { cn } from "@/lib/utils";

/**
 * 英字が横に流れる装飾の帯。上段と下段が逆方向へ進みます。
 *
 * ■ 読み上げ・翻訳の対象から外しています
 *   同じ語を何度も繰り返す装飾なので、読み上げられると邪魔になります（aria-hidden）。
 *   また、英字のロゴタイプとして置いているため翻訳もしません（translate="no"）。
 *   店名・住所・電話番号と同じ理由で、意味ではなく見た目を保つための指定です。
 *
 * ■ JavaScript を使いません
 *   CSSアニメーションだけで動きます。prefers-reduced-motion では
 *   globals.css 側の一括指定で停止します。
 *
 * ■ 継ぎ目を出さないために
 *   同じ並びを REPEAT 回ぶん並べ、1回ぶん（-25%）だけ動かして原点に戻します。
 *   画面幅より短いと隙間が見えるため、余裕をもって繰り返しています。
 */

const REPEAT = 4;

type Props = {
  rows: MarqueeRows;
  className?: string;
};

export function MarqueeBand({ rows, className }: Props) {
  return (
    <div aria-hidden="true" translate="no" className={cn("marquee-band", className)}>
      {rows.map((items, rowIndex) => (
        <div
          key={rowIndex}
          className="marquee-x"
          data-direction={rowIndex === 0 ? "left" : "right"}
        >
          <div className={cn("marquee-x-track", rowIndex === 1 && "marquee-x-track--outline")}>
            {Array.from({ length: REPEAT }, (_, copy) => (
              <span key={copy} className="marquee-x-group">
                {items.map((item) => (
                  <span key={item} className="marquee-x-item">
                    {item}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
