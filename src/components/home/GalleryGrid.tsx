"use client";

import { useState } from "react";
import { GalleryModal } from "./GalleryModal";
import { Figure } from "@/components/ui/Figure";
import { LinkButton } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { media } from "@/data/media";
import { socialLinks } from "@/data/site";
import { cn } from "@/lib/utils";

const instagram = socialLinks.find((link) => link.id === "instagram");

/** 変則グリッド（Masonry風）の配置パターン */
const spans = ["sm:col-span-2 sm:row-span-2", "", "", "sm:row-span-2", "", "sm:col-span-2", "", ""];

export function GalleryGrid() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const items = media.gallery;

  return (
    <section aria-labelledby="gallery-heading" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-[100rem] px-5 sm:px-8">
        <SectionHeading
          id="gallery-heading"
          en="GALLERY"
          ja="料理と、店内と、日々の景色。"
          align="center"
        />

        <ul className="mt-16 grid auto-rows-[minmax(0,11rem)] grid-cols-2 gap-3 sm:auto-rows-[minmax(0,12rem)] sm:grid-cols-4">
          {items.map((item, index) => (
            <Reveal
              as="li"
              key={item.src || index}
              delay={Math.min(index, 6) * 60}
              className={cn("h-full", spans[index % spans.length])}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(index)}
                className="group relative block h-full w-full overflow-hidden"
              >
                <Figure
                  media={item}
                  className="h-full w-full"
                  sizes="(max-width: 640px) 50vw, 25vw"
                  imageClassName="transition-transform duration-[1400ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.05]"
                  label=""
                />
                <span className="sr-only">{item.alt}を拡大表示する</span>
              </button>
            </Reveal>
          ))}
        </ul>

        {instagram ? (
          <Reveal className="mt-14 flex justify-center">
            <LinkButton href={instagram.href} external variant="ghost">
              Instagramで最新の様子を見る
            </LinkButton>
          </Reveal>
        ) : null}
      </div>

      <GalleryModal
        items={items}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onChange={setOpenIndex}
      />
    </section>
  );
}
