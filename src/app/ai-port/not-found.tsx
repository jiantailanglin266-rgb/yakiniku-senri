import type { Metadata } from "next";
import Link from "next/link";

import { GhostLink, GradientText, PrimaryLink } from "@/components/ai-port/ui/Primitives";
import { aiMainNav } from "@/data/ai-port/navigation";
import { aiPortPath } from "@/data/ai-port/site";

export const metadata: Metadata = {
  title: "ページが見つかりません",
  description: "お探しのページは移動または削除された可能性があります。",
  robots: { index: false, follow: true },
};

/**
 * /ai-port 配下の404。
 * ルート直下の404（焼肉 千里 側）とは別に用意し、AI PORTの外枠のまま表示します。
 */
export default function AiPortNotFound() {
  return (
    <section className="mx-auto flex min-h-[70svh] max-w-3xl items-center px-5 py-24 sm:px-8">
      <div className="w-full text-center">
        <p className="font-ai-display text-[3.5rem] leading-none font-bold sm:text-[5rem]">
          <GradientText flow>404</GradientText>
        </p>

        <h1 className="mt-8 text-[1.4rem] leading-[1.6] sm:text-[1.8rem]">
          お探しのページが見つかりませんでした
        </h1>

        <p className="text-ai-haze mt-5 text-[0.88rem] leading-[2]">
          ページが移動または削除された可能性があります。
          <br />
          下のリンクか、サイト内検索からお探しください。
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <PrimaryLink href={aiPortPath("/")}>トップページへ</PrimaryLink>
          <GhostLink href={aiPortPath("/search")}>サイト内を検索</GhostLink>
        </div>

        <nav aria-label="主要ページ" className="mt-12">
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2.5">
            {aiMainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-ai-haze hover:text-ai-cyan text-[0.8rem] transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
