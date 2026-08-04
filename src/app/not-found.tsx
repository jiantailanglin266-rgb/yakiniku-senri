import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ページが見つかりません",
  description: "お探しのページは移動または削除された可能性があります。",
  robots: { index: false, follow: true },
};

/**
 * 404。
 *
 * ルート直下に置きます。各ポータルの中に置くと `/_not-found` から参照されず、
 * 静的書き出しの 404.html が Next.js 既定の英語ページになります。
 *
 * このリポジトリは4サイトを配信しているため、どのサイトの外枠も着せません。
 * どこから来たか分からない状態で片方のヘッダーを出すと、別サイトに
 * 迷い込んだように見えるためです。入口だけを並べます。
 */
const entrances = [
  { href: "/ja/", label: "CRYPTO PORT", note: "暗号資産の総合ポータル" },
  { href: "/ai-port", label: "AI PORT", note: "AIツールの比較と解説" },
  { href: "/card-port/ja/", label: "CARD PORT", note: "クレジットカードの比較" },
  { href: "/sports-port/ja/", label: "SPORTS PORT", note: "スポーツのライブスコアとニュース" },
];

export default function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center bg-[#05070f] px-5 py-24 text-slate-200">
      <div className="w-full max-w-xl text-center">
        <p className="text-[3.5rem] leading-none font-bold tracking-[0.14em] text-cyan-400/70 sm:text-[5rem]">
          404
        </p>
        <h1 className="mt-8 text-[1.4rem] leading-[1.7] sm:text-[1.8rem]">
          お探しのページが
          <br />
          見つかりませんでした。
        </h1>
        <p className="mt-6 text-[0.85rem] leading-[2.1] text-slate-400">
          ページが移動または削除された可能性があります。
        </p>

        <nav aria-label="サイトの入口" className="mt-12">
          <ul className="grid gap-3 text-left">
            {entrances.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-xl border border-slate-700/60 px-4 py-3 transition-colors hover:border-cyan-400/60"
                >
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="mt-0.5 block text-[0.75rem] text-slate-400">{item.note}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  );
}
