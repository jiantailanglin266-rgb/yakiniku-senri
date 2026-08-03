"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BookOpenText, MapPin } from "lucide-react";
import { HeroCopy } from "./HeroCopy";
import { HeroSlider } from "./HeroSlider";
import { MugunghwaPetalRain } from "@/components/animations/MugunghwaPetalRain";
import { ScrollIndicator } from "@/components/effects/ScrollIndicator";
import { FireParticleLayer } from "@/components/effects/FireParticleLayer";
import { LinkButton } from "@/components/ui/Button";
import { ReservationButton } from "@/components/ui/ReservationButton";
import { media } from "@/data/media";

export function HeroSection() {
  const reduced = useReducedMotion();

  return (
    <section
      aria-label="焼肉 千里 メインビジュアル"
      className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden"
    >
      <HeroSlider slides={media.hero} />
      <MugunghwaPetalRain density="medium" variant="hero" className="z-[4]" />
      <FireParticleLayer intensity="soft" className="z-[5]" />

      <div className="relative z-10 mx-auto w-full max-w-[100rem] px-5 pb-32 sm:px-8 sm:pb-36 md:pb-28">
        <HeroCopy />

        <motion.div
          className="mt-11 flex flex-wrap gap-3"
          initial={reduced ? false : { opacity: 0, y: 24 }}
          animate={reduced ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 1.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <LinkButton
            href="/menu"
            variant="gold"
            icon={<BookOpenText aria-hidden="true" className="size-4" />}
          >
            お品書きを見る
          </LinkButton>
          <ReservationButton />
          <LinkButton
            href="/access"
            variant="ghost"
            icon={<MapPin aria-hidden="true" className="size-4" />}
          >
            アクセスを見る
          </LinkButton>
        </motion.div>
      </div>

      <ScrollIndicator className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 md:flex" />
    </section>
  );
}
