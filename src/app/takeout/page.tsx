import type { Metadata } from "next";
import { PageHero } from "@/components/page/PageHero";
import { RelatedLinks } from "@/components/page/RelatedLinks";
import { ReservationCTA } from "@/components/home/ReservationCTA";
import { Figure } from "@/components/ui/Figure";
import { JsonLd } from "@/components/ui/JsonLd";
import { Reveal } from "@/components/ui/Reveal";
import { ReservationButton } from "@/components/ui/ReservationButton";
import { BusinessHours } from "@/components/ui/BusinessHours";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { takeout } from "@/data/content";
import { media } from "@/data/media";
import { store } from "@/data/store";

const crumbs = [
  { label: "ホーム", href: "/" },
  { label: "テイクアウト", href: "/takeout" },
];

export const metadata: Metadata = pageMetadata({
  title: "テイクアウト",
  description:
    "焼肉 千里のテイクアウト。バーベキューやホームパーティー、誕生日会、ご家族でのお食事に。ご注文・ご相談はお電話にて承っております。",
  path: "/takeout",
});

export default function TakeoutPage() {
  return (
    <>
      <PageHero
        en="TAKEOUT"
        ja={"千里の味を、\nご家庭でも。"}
        lead={takeout.lead}
        image={media.pageHero.takeout}
        crumbs={crumbs}
      />

      <section className="py-12 sm:py-16">
        <div className="mx-auto grid max-w-[100rem] items-start gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16">
          <Reveal direction="left">
            <Figure
              media={media.takeout}
              className="aspect-[4/3] w-full"
              sizes="(max-width: 1024px) 100vw, 50vw"
              soft
              label="Takeout"
            />
          </Reveal>

          <div>
            {takeout.body.map((paragraph, index) => (
              <Reveal key={index} delay={index * 90}>
                <p className="text-gray mb-5 text-[0.87rem] leading-[2.15]">{paragraph}</p>
              </Reveal>
            ))}

            <Reveal delay={220}>
              <h2 className="font-display text-gold mt-10 text-[0.64rem] tracking-[0.4em] uppercase">
                Scenes
              </h2>
            </Reveal>
            <ul className="border-ivory/10 bg-ivory/10 mt-6 grid gap-px border sm:grid-cols-2">
              {takeout.scenes.map((scene, index) => (
                <Reveal as="li" key={scene.label} delay={260 + index * 60}>
                  <div className="h-full bg-black/60 px-6 py-5">
                    <p className="text-ivory text-[0.9rem]">{scene.label}</p>
                    <p className="text-gray mt-1.5 text-[0.75rem]">{scene.note}</p>
                  </div>
                </Reveal>
              ))}
            </ul>

            <Reveal delay={420}>
              <div className="border-gold/25 mt-10 border p-7">
                <h2 className="text-ivory text-[0.95rem]">ご注文について</h2>
                <p className="text-gray mt-4 text-[0.82rem] leading-[2.05]">
                  ご注文・ご相談はお電話にて承っております。ご希望の品目とお受け取り時間をお知らせください。
                </p>
                <div className="mt-6">
                  <BusinessHours />
                </div>
                <ReservationButton
                  variant="gold"
                  label="電話で相談する"
                  className="mt-7 w-full sm:w-auto"
                />
                <p className="text-gray-dark mt-4 text-[0.7rem]">定休日：{store.closed}</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <RelatedLinks currentPath="/takeout" />
      <ReservationCTA />

      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </>
  );
}
