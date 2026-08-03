import { MugunghwaPetalRain } from "@/components/animations/MugunghwaPetalRain";
import { Figure } from "@/components/ui/Figure";
import { LinkButton } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { owner } from "@/data/content";
import { ownerSiteUrl } from "@/data/site";

/** 金色の波形（弦・音をイメージした装飾） */
function SoundWave() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 800 200"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-52 w-full -translate-y-1/2 opacity-45"
    >
      <defs>
        <linearGradient id="wave-gold" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#8f6b28" stopOpacity="0" />
          <stop offset="35%" stopColor="#c7a253" stopOpacity="0.75" />
          <stop offset="65%" stopColor="#e5ca83" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#8f6b28" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((i) => (
        <path
          key={i}
          d={`M0 ${100 + i * 6} C 150 ${60 - i * 14}, 300 ${140 + i * 12}, 450 ${100 - i * 4} S 700 ${60 + i * 10}, 800 ${100 + i * 5}`}
          fill="none"
          stroke="url(#wave-gold)"
          strokeWidth="0.7"
        />
      ))}
    </svg>
  );
}

export function OwnerProfile() {
  return (
    <section aria-labelledby="owner-heading" className="relative overflow-hidden py-20 sm:py-28">
      <MugunghwaPetalRain density="low" variant="section" />

      <div className="relative z-10 mx-auto max-w-[100rem] px-5 sm:px-8">
        <SoundWave />

        <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1fr] lg:gap-16">
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
            <SectionHeading id="owner-heading" en="OWNER" ja={owner.heading} />

            <Reveal delay={260}>
              <p className="mt-9 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="text-gold/80 text-[0.7rem] tracking-[0.2em]">{owner.role}</span>
                <span className="font-serif-jp text-ivory text-2xl tracking-[0.16em]">
                  {owner.name}
                </span>
                <span className="text-gray text-[0.72rem]">（{owner.nameReading}）</span>
              </p>
            </Reveal>

            <Reveal delay={320}>
              <p className="text-gray mt-6 text-[0.85rem] leading-[2.15]">{owner.lead}</p>
            </Reveal>

            <Reveal delay={380}>
              <div className="border-gold/20 mt-9 border-t pt-7">
                <h3 className="font-display text-gold text-[0.62rem] tracking-[0.36em] uppercase">
                  Music Works
                </h3>
                <ul className="mt-5 space-y-3.5">
                  {owner.works.map((work) => (
                    <li key={work.title} className="flex gap-3">
                      <span
                        aria-hidden="true"
                        className="bg-gold/50 mt-3 block h-px w-4 shrink-0"
                      />
                      <span>
                        <span className="text-ivory/90 block text-[0.83rem]">{work.title}</span>
                        <span className="text-gray mt-1 block text-[0.75rem]">{work.note}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={440}>
              <div className="mt-9 flex flex-wrap gap-3">
                <LinkButton href="/owner">オーナー紹介を見る</LinkButton>
                <LinkButton href={ownerSiteUrl} external variant="ghost">
                  オーナー公式サイト
                </LinkButton>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
