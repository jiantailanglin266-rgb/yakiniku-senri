import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { formatPrice, getPopulatedCategories } from "@/data/menu";

/**
 * トップページのお品書き紹介。
 * 代表メニューのみを表示し、詳細はお品書きページへ誘導します。
 */
export function MenuPreview() {
  const categories = getPopulatedCategories().filter((c) => c.id !== "recommended");

  return (
    <section aria-labelledby="menu-preview-heading" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-[100rem] px-5 sm:px-8">
        <SectionHeading
          id="menu-preview-heading"
          en="MENU"
          ja="受け継いだ味を、心ゆくまで。"
          align="center"
        />

        <ul className="border-ivory/10 bg-ivory/10 mt-16 grid gap-px border sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category, index) => (
            <Reveal as="li" key={category.id} delay={Math.min(index, 6) * 60}>
              <Link
                href={`/menu#${category.id}`}
                className="group flex h-full flex-col bg-black/60 p-7 transition-colors duration-700 hover:bg-black/30"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-ivory text-base">{category.name}</h3>
                  <span className="font-display text-gold/70 text-[0.58rem] tracking-[0.28em] uppercase">
                    {category.nameEn}
                  </span>
                </div>
                <span aria-hidden="true" className="rule-gold mt-4 w-full" />
                <ul className="mt-4 space-y-2">
                  {category.items.slice(0, 3).map((item) => (
                    <li
                      key={item.id}
                      className="text-gray flex items-baseline justify-between gap-4 text-[0.78rem]"
                    >
                      <span className="truncate">{item.name}</span>
                      <span className="font-display text-gold/85 text-[0.85rem] whitespace-nowrap">
                        {formatPrice(item.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Link>
            </Reveal>
          ))}
        </ul>

        <Reveal className="mt-14 flex justify-center">
          <LinkButton href="/menu">すべてのお品書きを見る</LinkButton>
        </Reveal>
      </div>
    </section>
  );
}
