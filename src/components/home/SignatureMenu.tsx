import { MenuCard } from "@/components/menu/MenuCard";
import { LinkButton } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { recommendedItems } from "@/data/menu";

export function SignatureMenu() {
  return (
    <section aria-labelledby="signature-heading" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-[100rem] px-5 sm:px-8">
        <SectionHeading
          id="signature-heading"
          en="SIGNATURE"
          ja="千里を代表する逸品。"
          align="center"
        />

        <ul className="mt-16 grid gap-6 md:grid-cols-3">
          {recommendedItems.map((item, index) => (
            <Reveal as="li" key={item.id} delay={index * 80} className="h-full">
              <MenuCard item={item} href={`/menu#${item.category}`} />
            </Reveal>
          ))}
        </ul>

        <Reveal className="mt-14 flex justify-center">
          <LinkButton href="/menu" variant="gold">
            すべてのお品書きを見る
          </LinkButton>
        </Reveal>
      </div>
    </section>
  );
}
