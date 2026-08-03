import { Figure } from "@/components/ui/Figure";
import { LinkButton } from "@/components/ui/Button";
import { ReservationButton } from "@/components/ui/ReservationButton";
import { Reveal } from "@/components/ui/Reveal";
import { takeout } from "@/data/content";

export function TakeoutSection() {
  return (
    <section aria-labelledby="takeout-heading" className="relative py-20 sm:py-28">
      <div className="relative mx-auto max-w-[100rem] px-5 sm:px-8">
        <div className="relative overflow-hidden">
          <Figure
            media={takeout.image}
            className="absolute inset-0 h-full w-full"
            sizes="100vw"
            label="Takeout"
            plain
          />
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(100deg, rgba(8,8,8,0.94) 0%, rgba(8,8,8,0.82) 42%, rgba(8,8,8,0.5) 78%, rgba(8,8,8,0.35) 100%)",
            }}
          />

          <div className="relative px-7 py-16 sm:px-14 sm:py-24 lg:px-20 lg:py-28">
            <div className="max-w-xl">
              <Reveal>
                <p className="font-display text-gold text-[0.68rem] tracking-[0.46em] uppercase">
                  {takeout.headingEn}
                </p>
              </Reveal>
              <Reveal delay={110}>
                <h2
                  id="takeout-heading"
                  className="text-ivory mt-6 text-[1.65rem] leading-[1.65] sm:text-[2.2rem]"
                >
                  {takeout.heading}
                </h2>
              </Reveal>
              <Reveal delay={190}>
                <p className="text-ivory/85 mt-7 text-[0.87rem] leading-[2.15]">{takeout.lead}</p>
              </Reveal>
              <Reveal delay={250}>
                <p className="text-gray mt-4 text-[0.85rem] leading-[2.15]">{takeout.body[0]}</p>
              </Reveal>

              <Reveal delay={310}>
                <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3">
                  {takeout.scenes.map((scene) => (
                    <li key={scene.label} className="flex items-center gap-2.5">
                      <span aria-hidden="true" className="bg-gold/60 block h-px w-4 shrink-0" />
                      <span className="text-ivory/90 text-[0.8rem]">{scene.label}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal delay={370}>
                <div className="mt-10 flex flex-wrap gap-3">
                  <LinkButton href="/takeout" variant="gold">
                    テイクアウトの詳細
                  </LinkButton>
                  <ReservationButton label="電話で相談する" />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
