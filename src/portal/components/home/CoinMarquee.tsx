import Image from "next/image";
import Link from "next/link";
import { withBasePath } from "@/lib/base-path";
import { localePath } from "@/portal/i18n/config";
import { coinBanners } from "@/portal/data/coin-banners";

/**
 * 上部に流れる銘柄バナーの帯。
 *
 * ■ 継ぎ目を出さないために
 *   同じ並びを2組つなげ、1組ぶん（-50%）進んだところで原点へ戻します。
 *   1組だけだと、末尾が画面から抜けるときに空白が見えます。
 *
 * ■ 動きの制御
 *   `.marquee` は既存のティッカーと同じCSSを使います。
 *   hover / フォーカスで停止し、`prefers-reduced-motion` では
 *   流れずに横スクロールで読めるようになります（portal.css 側で一括指定）。
 *
 * ■ 画像は装飾として扱います
 *   バナーの文字は画像内にあり、読み上げでは意味が伝わりません。
 *   `alt` は空にし、リンクの名前は銘柄名（`label`）で与えます。
 *
 * ⚠ 画像はコイン部分だけの正方形です（値動きの示唆を避けるため）
 *   元素材は横長で、右側に上昇チャートと
 *   「THE STANDARD FOR GLOBAL VALUE」「BUILD・TRADE・EARN」のような
 *   キャッチコピーが入っていました。値上がりの示唆や運営者による推奨と
 *   読まれるため、コイン部分だけを切り出しています。
 *   ここに騰落率・順位・チャートを足さないでください。
 *
 * ■ バナーが1件も無いときは、帯そのものを出しません
 *   空の帯だけが残ると、レイアウトに意味のない隙間ができます。
 */
export function CoinMarquee({ locale, label }: { locale: string; label: string }) {
  if (coinBanners.length === 0) return null;

  return (
    <section aria-label={label} className="coin-marquee">
      <div className="marquee" style={{ ["--marquee-duration" as string]: "60s" }}>
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0" aria-hidden={copy === 1 ? "true" : undefined}>
            {coinBanners.map((banner) => (
              <li key={`${copy}-${banner.slug}`} className="px-2">
                <Link
                  href={localePath(locale, `/coins/${banner.slug}`)}
                  aria-label={copy === 1 ? undefined : banner.label}
                  tabIndex={copy === 1 ? -1 : undefined}
                  className="edge-glow block overflow-hidden rounded-xl border border-(--color-hairline)"
                >
                  <Image
                    src={withBasePath(`/images/portal/marquee/${banner.slug}.webp`)}
                    alt=""
                    width={800}
                    height={800}
                    sizes="128px"
                    className="size-24 object-cover sm:size-32"
                  />
                </Link>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}
