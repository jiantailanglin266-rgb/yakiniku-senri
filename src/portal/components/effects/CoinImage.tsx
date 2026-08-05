import Image from "next/image";
import { withBasePath } from "@/lib/base-path";

/**
 * ファーストビューに浮かぶコイン。
 *
 * ■ CSS で描いた円盤（`Coin3D`）との違い
 *   `Coin3D` はグラデーションで作った記号的な円盤です。
 *   こちらは運営者から提供された画像を、円形に切り抜いて使います。
 *   質感が出るぶん、1枚あたり70KB前後の転送が増えます。
 *   そのため**装飾として置ける枚数を絞り**、狭い画面では枚数を減らします。
 *
 * ■ 装飾です
 *   価格や順位を示すものではないので `aria-hidden` にし、`alt` は空にします。
 *   銘柄名は本文とナビゲーションから辿れます。
 *
 * ■ サーバーコンポーネント
 *   状態を持たないため、クライアントJSは出ません。
 *   浮遊は CSS（`.float-slow`）だけで、`prefers-reduced-motion` では止まります。
 */
export function CoinImage({
  slug,
  size,
  className,
  delay = 0,
  priority = false,
}: {
  /** `public/images/portal/coins/<slug>.webp` */
  slug: string;
  size: number;
  className?: string;
  /** 複数枚並べるときに浮遊の位相をずらします */
  delay?: number;
  priority?: boolean;
}) {
  return (
    <div className={className} aria-hidden="true">
      <div className="float-slow" style={{ animationDelay: `${delay}s` }}>
        <Image
          src={withBasePath(`/images/portal/coins/${slug}.webp`)}
          alt=""
          width={size}
          height={size}
          sizes={`${size}px`}
          priority={priority}
          className="h-auto w-full select-none"
          style={{
            width: size,
            height: size,
            // 円の外側へ広がる光。画像自体には影を焼き込んでいません
            filter: `drop-shadow(0 ${size * 0.06}px ${size * 0.14}px rgba(0,0,0,0.55))`,
          }}
        />
      </div>
    </div>
  );
}
