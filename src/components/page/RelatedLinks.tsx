import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { mainNav } from "@/data/navigation";

/**
 * 下層ページ共通の関連コンテンツ（内部リンク強化）。
 * 現在のページを除いた主要ページへ誘導します。
 */
export function RelatedLinks({ currentPath }: { currentPath: string }) {
  const items = mainNav.filter((item) => item.href !== currentPath);

  return (
    <section aria-labelledby="related-heading" className="py-16 sm:py-20">
      <div className="mx-auto max-w-[100rem] px-5 sm:px-8">
        <Reveal>
          <h2
            id="related-heading"
            className="font-display text-gold text-[0.66rem] tracking-[0.42em] uppercase"
          >
            Related
          </h2>
        </Reveal>
        <ul className="border-ivory/10 bg-ivory/10 mt-8 grid gap-px border sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex items-center justify-between gap-4 bg-black/60 px-6 py-5 transition-colors duration-700 hover:bg-black/25"
              >
                <span className="flex flex-col gap-1.5">
                  <span className="font-display text-gold/70 text-[0.58rem] tracking-[0.28em] uppercase">
                    {item.labelEn}
                  </span>
                  <span className="text-ivory text-[0.88rem]">{item.label}</span>
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="text-gold size-4 shrink-0 transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-x-1"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
