import { Figure } from "@/components/ui/Figure";
import { Reveal } from "@/components/ui/Reveal";
import { formatPrice, type MenuCategory as Category, type MenuItem } from "@/data/menu";

export function MenuItemRow({ item }: { item: MenuItem }) {
  return (
    <li className="group border-ivory/8 border-b last:border-b-0">
      <div className="flex items-start gap-5 py-6">
        {item.image ? (
          <Figure
            media={{ src: item.image, alt: item.name, width: 400, height: 400 }}
            className="size-20 shrink-0 sm:size-24"
            sizes="96px"
            label=""
          />
        ) : null}

        <div className="flex flex-1 flex-wrap items-baseline gap-x-4 gap-y-1">
          <div className="min-w-[12rem] flex-1">
            <h3 className="text-ivory flex flex-wrap items-center gap-2.5 text-[0.95rem] leading-[1.8]">
              {item.name}
              {item.recommended ? (
                <span className="bg-gold px-2 py-0.5 text-[0.55rem] font-medium tracking-[0.16em] text-black">
                  おすすめ
                </span>
              ) : null}
              {item.limited ? (
                <span className="border-gold/60 text-gold border px-2 py-0.5 text-[0.55rem] tracking-[0.16em]">
                  限定
                </span>
              ) : null}
            </h3>
            {item.nameEn ? (
              <p className="font-display text-gold/60 mt-1 text-[0.58rem] tracking-[0.28em] uppercase">
                {item.nameEn}
              </p>
            ) : null}
            {item.description ? (
              <p className="text-gray mt-2.5 max-w-2xl text-[0.78rem] leading-[2]">
                {item.description}
              </p>
            ) : null}
            {item.allergens && item.allergens.length > 0 ? (
              <p className="text-gray-dark mt-2 text-[0.68rem]">
                アレルゲン：{item.allergens.join("・")}
              </p>
            ) : null}
          </div>

          <p className="flex items-baseline gap-1.5 whitespace-nowrap">
            <span className="font-display text-gold-light text-lg tracking-[0.06em]">
              {formatPrice(item.price)}
            </span>
            <span className="text-gray-dark text-[0.62rem]">
              {item.taxIncluded ? "税込" : "税別"}
            </span>
          </p>
        </div>
      </div>
    </li>
  );
}

export function MenuCategorySection({
  category,
  items,
}: {
  category: Category;
  items: MenuItem[];
}) {
  return (
    <section id={category.id} aria-labelledby={`${category.id}-heading`} className="scroll-mt-32">
      <Reveal>
        <div className="border-gold/25 flex flex-wrap items-baseline gap-x-5 gap-y-1 border-b pb-4">
          <h2 id={`${category.id}-heading`} className="text-ivory text-xl sm:text-2xl">
            {category.name}
          </h2>
          <p className="font-display text-gold/70 text-[0.62rem] tracking-[0.36em] uppercase">
            {category.nameEn}
          </p>
        </div>
      </Reveal>
      {category.description ? (
        <Reveal delay={80}>
          <p className="text-gray mt-4 text-[0.8rem] leading-[2]">{category.description}</p>
        </Reveal>
      ) : null}
      <ul className="mt-2">
        {items.map((item) => (
          <MenuItemRow key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}
