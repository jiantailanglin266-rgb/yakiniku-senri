import { Clock, MapPin } from "lucide-react";
import { FireParticleLayer } from "@/components/effects/FireParticleLayer";
import { LinkButton } from "@/components/ui/Button";
import { ReservationButton } from "@/components/ui/ReservationButton";
import { Reveal } from "@/components/ui/Reveal";
import { store } from "@/data/store";

export function ReservationCTA() {
  return (
    <section
      aria-labelledby="reservation-heading"
      className="section-bleed relative overflow-hidden py-24 sm:py-32"
    >
      <FireParticleLayer intensity="soft" />

      <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
        <Reveal>
          <p className="font-display text-gold text-[0.68rem] tracking-[0.46em] uppercase">
            Reservation
          </p>
        </Reveal>
        <Reveal delay={110}>
          <h2
            id="reservation-heading"
            className="text-ivory mt-7 text-[1.6rem] leading-[1.75] sm:text-[2.2rem]"
          >
            大切な方とのひとときを、
            <br />
            焼肉 千里で。
          </h2>
        </Reveal>
        <Reveal delay={200}>
          <p className="text-gray mt-7 text-[0.85rem] leading-[2.1]">
            ご予約はお電話にて承っております。
          </p>
        </Reveal>
        <Reveal delay={250}>
          <a
            href={store.phoneHref}
            className="font-display text-gold-light hover:text-gold mt-6 inline-block text-[2.1rem] tracking-[0.08em] transition-colors duration-500 sm:text-[2.6rem]"
          >
            {store.phone}
          </a>
        </Reveal>
        <Reveal delay={310}>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <ReservationButton variant="gold" label="電話をかける" />
            <LinkButton
              href="/access#hours"
              variant="outline"
              icon={<Clock aria-hidden="true" className="size-4" />}
            >
              営業時間を見る
            </LinkButton>
            <LinkButton
              href="/access"
              variant="ghost"
              icon={<MapPin aria-hidden="true" className="size-4" />}
            >
              アクセスを見る
            </LinkButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
