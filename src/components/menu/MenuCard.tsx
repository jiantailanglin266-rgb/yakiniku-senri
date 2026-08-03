import Link from "next/link";
import { Figure } from "@/components/ui/Figure";
import { formatPrice, type MenuItem } from "@/data/menu";

/**
 * 写真付きの商品カード。おすすめ／限定ラベルに対応します。
 */
export function MenuCard({ item, href = "/menu" }: { item: MenuItem; href?: string }) {
  return (
    <article className="group h-full">
      <Link
        href={href}
        className="border-ivory/10 hover:border-gold/55 flex h-full flex-col border transition-colors duration-700 ease-[cubic-bezier(.22,1,.36,1)]"
      >
        <div className="relative">
          <Figure
            media={{
              src: item.image ?? "",
              alt: item.name,
              width: 1200,
              height: 900,
            }}
            className="aspect-[4/3] w-full"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            imageClassName="transition-transform duration-[1400ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.06]"
            label={item.nameEn ?? item.name}
          />
          <div className="absolute top-4 left-4 z-10 flex flex-col items-start gap-2">
            {item.recommended ? (
              <span className="bg-gold px-3 py-1 text-[0.6rem] font-medium tracking-[0.2em] text-black">
                おすすめ
              </span>
            ) : null}
            {item.limited ? (
              <span className="border-gold/60 text-gold border bg-black/70 px-3 py-1 text-[0.6rem] tracking-[0.2em]">
                限定
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-6 sm:p-7">
          <h3 className="text-ivory text-base leading-[1.7] sm:text-lg">{item.name}</h3>
          {item.nameEn ? (
            <p className="font-display text-gold/70 mt-2 text-[0.6rem] tracking-[0.3em] uppercase">
              {item.nameEn}
            </p>
          ) : null}
          {item.description ? (
            <p className="text-gray mt-4 flex-1 text-[0.8rem] leading-[2.05]">{item.description}</p>
          ) : (
            <div className="flex-1" />
          )}
          <p className="mt-6 flex items-baseline gap-2">
            <span className="font-display text-gold-light text-xl tracking-[0.06em]">
              {formatPrice(item.price)}
            </span>
            <span className="text-gray-dark text-[0.65rem]">
              {item.taxIncluded ? "税込" : "税別"}
            </span>
          </p>
        </div>
      </Link>
    </article>
  );
}
