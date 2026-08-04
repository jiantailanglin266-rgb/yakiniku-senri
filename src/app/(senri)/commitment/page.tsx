import type { Metadata } from "next";
import { PageHero } from "@/components/page/PageHero";
import { RelatedLinks } from "@/components/page/RelatedLinks";
import { ReservationCTA } from "@/components/home/ReservationCTA";
import { EmberSection } from "@/components/home/EmberSection";
import { Figure } from "@/components/ui/Figure";
import { JsonLd } from "@/components/ui/JsonLd";
import { Reveal } from "@/components/ui/Reveal";
import { LinkButton } from "@/components/ui/Button";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { commitments } from "@/data/content";
import { media } from "@/data/media";
import { cn } from "@/lib/utils";

const crumbs = [
  { label: "ホーム", href: "/" },
  { label: "こだわり", href: "/commitment" },
];

export const metadata: Metadata = pageMetadata({
  title: "こだわり｜秘伝のタレともみシリーズ",
  description:
    "焼肉 千里が守り続ける四つのこだわり。世田谷で愛され続ける老舗としての歩み、創業より守り続けた秘伝のタレ、名物「もみシリーズ」、ゆったり過ごせるアットホームな空間をご紹介します。",
  path: "/commitment",
});

export default function CommitmentPage() {
  return (
    <>
      <PageHero
        en="OUR CRAFT"
        ja={"千里が守り続ける、\n四つのこだわり。"}
        lead="変わらない味を届けるために、創業から大切にしてきたことがあります。"
        image={media.pageHero.commitment}
        crumbs={crumbs}
      />

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-[100rem] space-y-24 px-5 sm:space-y-32 sm:px-8">
          {commitments.map((commitment, index) => (
            <article
              key={commitment.id}
              id={commitment.id}
              className={cn(
                "grid scroll-mt-32 items-center gap-9 lg:grid-cols-2 lg:gap-16",
                index % 2 === 1 && "lg:[&>*:first-child]:order-2",
              )}
            >
              <Reveal direction={index % 2 === 1 ? "right" : "left"}>
                <Figure
                  media={commitment.image}
                  className="aspect-[4/3] w-full"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  soft
                  label={commitment.headingEn}
                />
              </Reveal>

              <div>
                <Reveal>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-gold text-sm tracking-[0.2em]">
                      {commitment.number}
                    </span>
                    <span aria-hidden="true" className="rule-gold w-10" />
                    <span className="font-display text-gold/75 text-[0.62rem] tracking-[0.34em] uppercase">
                      {commitment.headingEn}
                    </span>
                  </div>
                </Reveal>
                <Reveal delay={110}>
                  <h2 className="text-ivory mt-6 text-[1.4rem] leading-[1.7] sm:text-[1.8rem]">
                    {commitment.heading}
                  </h2>
                </Reveal>
                <Reveal delay={190}>
                  <p className="text-gray mt-7 text-[0.87rem] leading-[2.15]">{commitment.body}</p>
                </Reveal>
              </div>
            </article>
          ))}
        </div>
      </section>

      <EmberSection />

      <Reveal className="flex justify-center px-5">
        <LinkButton href="/menu" variant="gold">
          お品書きを見る
        </LinkButton>
      </Reveal>

      <RelatedLinks currentPath="/commitment" />
      <ReservationCTA />

      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </>
  );
}
