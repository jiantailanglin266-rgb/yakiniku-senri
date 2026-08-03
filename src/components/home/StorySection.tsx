import { MugunghwaPetalRain } from "@/components/animations/MugunghwaPetalRain";
import { Figure } from "@/components/ui/Figure";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { LinkButton } from "@/components/ui/Button";
import { storyBlocks } from "@/data/content";
import { cn } from "@/lib/utils";

export function StorySection({ showCta = true }: { showCta?: boolean } = {}) {
  return (
    <section aria-labelledby="story-heading" className="relative py-20 sm:py-28">
      <MugunghwaPetalRain density="low" variant="section" showSparkles={false} />

      <div className="relative z-10 mx-auto max-w-[100rem] px-5 sm:px-8">
        <SectionHeading
          id="story-heading"
          en="STORY"
          ja={"世田谷の地で、\n愛され続ける焼肉店。"}
          align="center"
          className="mx-auto max-w-3xl"
        />

        <div className="mt-20 space-y-24 sm:mt-24 sm:space-y-32">
          {storyBlocks.map((block, index) => (
            <article
              key={block.id}
              className={cn(
                "relative grid items-center gap-9 lg:grid-cols-2 lg:gap-16",
                index % 2 === 1 && "lg:[&>*:first-child]:order-2",
              )}
            >
              {/* 背景の大きな薄い英字 */}
              <span
                aria-hidden="true"
                className={cn(
                  "font-display text-ivory/4 pointer-events-none absolute -top-12 text-[3.6rem] leading-none tracking-[0.12em] select-none sm:text-[6rem] lg:text-[7.5rem]",
                  index % 2 === 1 ? "right-0" : "left-0",
                )}
              >
                {block.watermark}
              </span>

              <Reveal direction={index % 2 === 1 ? "right" : "left"}>
                <Figure
                  media={block.image}
                  className="aspect-[4/3] w-full"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  soft
                  label={block.headingEn}
                />
              </Reveal>

              <div className="relative">
                <Reveal delay={120}>
                  <p className="font-display text-gold text-[0.68rem] tracking-[0.42em] uppercase">
                    {block.headingEn}
                  </p>
                </Reveal>
                <Reveal delay={190}>
                  <h3 className="text-ivory mt-5 text-[1.5rem] leading-[1.7] whitespace-pre-line sm:text-[1.9rem]">
                    {block.heading}
                  </h3>
                </Reveal>
                <div className="mt-7 space-y-5">
                  {block.body.map((paragraph, i) => (
                    <Reveal key={i} delay={260 + i * 80}>
                      <p className="text-gray text-[0.87rem] leading-[2.15]">{paragraph}</p>
                    </Reveal>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        {showCta ? (
          <Reveal className="mt-16 flex justify-center">
            <LinkButton href="/about">当店についてもっと知る</LinkButton>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
