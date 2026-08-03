import type { Metadata } from "next";
import { PageHero } from "@/components/page/PageHero";
import { RelatedLinks } from "@/components/page/RelatedLinks";
import { ReservationCTA } from "@/components/home/ReservationCTA";
import { Figure } from "@/components/ui/Figure";
import { JsonLd } from "@/components/ui/JsonLd";
import { Reveal } from "@/components/ui/Reveal";
import { LinkButton } from "@/components/ui/Button";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { owner } from "@/data/content";
import { media } from "@/data/media";
import { ownerSiteUrl } from "@/data/site";

const crumbs = [
  { label: "ホーム", href: "/" },
  { label: "オーナー紹介", href: "/owner" },
];

export const metadata: Metadata = pageMetadata({
  title: "オーナー紹介",
  description: `焼肉 千里の${owner.role}・${owner.name}（${owner.nameReading}）。先代から受け継いだ味を守りながら、朝鮮半島の伝統弦楽器ソヘグムの奏者としても活動しています。`,
  path: "/owner",
});

export default function OwnerPage() {
  return (
    <>
      <PageHero
        en="OWNER"
        ja={"三代目が受け継ぐ、\n焼肉と音楽の心。"}
        lead={owner.lead}
        image={media.pageHero.owner}
        crumbs={crumbs}
      />

      <section className="py-12 sm:py-16">
        <div className="mx-auto grid max-w-[100rem] items-start gap-10 px-5 sm:px-8 lg:grid-cols-[0.8fr_1fr] lg:gap-16">
          <Reveal direction="left">
            <Figure
              media={owner.image}
              className="aspect-[4/5] w-full"
              sizes="(max-width: 1024px) 100vw, 40vw"
              soft
              label="Owner"
            />
          </Reveal>

          <div>
            <Reveal>
              <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="text-gold/80 text-[0.7rem] tracking-[0.2em]">{owner.role}</span>
                <span className="font-serif-jp text-ivory text-3xl tracking-[0.16em]">
                  {owner.name}
                </span>
                <span className="text-gray text-[0.75rem]">（{owner.nameReading}）</span>
              </p>
            </Reveal>

            <div className="mt-8">
              {owner.body.map((paragraph, index) => (
                <Reveal key={index} delay={index * 90}>
                  <p className="text-gray mb-5 text-[0.87rem] leading-[2.15]">{paragraph}</p>
                </Reveal>
              ))}
            </div>

            <Reveal delay={240}>
              <div className="border-gold/20 mt-10 border-t pt-8">
                <h2 className="font-display text-gold text-[0.64rem] tracking-[0.4em] uppercase">
                  Music Works
                </h2>
                <ul className="mt-6 space-y-5">
                  {owner.works.map((work) => (
                    <li key={work.title} className="border-ivory/8 border-b pb-5 last:border-b-0">
                      <p className="text-ivory/90 text-[0.9rem]">{work.title}</p>
                      <p className="text-gray mt-2 text-[0.78rem] leading-[1.9]">{work.note}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={320}>
              <div className="mt-10">
                <LinkButton href={ownerSiteUrl} external variant="gold">
                  オーナー公式サイトを見る
                </LinkButton>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <RelatedLinks currentPath="/owner" />
      <ReservationCTA />

      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </>
  );
}
