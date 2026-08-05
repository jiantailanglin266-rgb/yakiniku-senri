import Link from "next/link";

import { ja } from "@/cardport/i18n";
import { routes } from "@/cardport/lib/routes";

/**
 * CARD PORT 内の 404。
 *
 * 言語セグメントの下にあるため、レイアウト（ヘッダー・フッター）は保たれます。
 * ここでは表示中の言語を受け取れないため、日本語と英語を併記します。
 */
export default function CardPortNotFound() {
  return (
    <section className="mx-auto grid min-h-[60svh] max-w-3xl place-items-center px-4 py-24 text-center">
      <div>
        <p className="text-aurora font-cp-display text-[3.5rem] leading-none font-semibold">404</p>
        <h1 className="text-cp-ink mt-6 text-[1.2rem] font-semibold">
          お探しのページが見つかりませんでした
        </h1>
        <p className="text-cp-mist mt-2 text-[0.85rem]">
          The page you are looking for could not be found.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={routes.home("ja")}
            className="from-cp-cyan to-cp-electric text-cp-void rounded-full bg-gradient-to-r px-5 py-2.5 text-[0.82rem] font-semibold"
          >
            {ja.nav.home}
          </Link>
          <Link
            href={routes.cards("ja")}
            className="glass text-cp-ink rounded-full px-5 py-2.5 text-[0.82rem]"
          >
            {ja.nav.cards}
          </Link>
          <Link
            href={routes.home("en")}
            className="glass text-cp-ink rounded-full px-5 py-2.5 text-[0.82rem]"
          >
            English
          </Link>
        </div>
      </div>
    </section>
  );
}
