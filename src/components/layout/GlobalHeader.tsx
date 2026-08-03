"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DesktopNavigation } from "./DesktopNavigation";
import { MobileNavigation } from "./MobileNavigation";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { ReservationButton } from "@/components/ui/ReservationButton";
import { store } from "@/data/store";
import { cn } from "@/lib/utils";

export function GlobalHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[90] transition-colors duration-700 ease-[cubic-bezier(.22,1,.36,1)]",
        scrolled ? "bg-black/92 backdrop-blur-md" : "bg-transparent",
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "via-gold/30 absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent to-transparent transition-opacity duration-700",
          scrolled ? "opacity-100" : "opacity-0",
        )}
      />
      <div className="mx-auto flex h-18 max-w-[100rem] items-center justify-between gap-4 px-5 sm:h-20 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 py-2"
          aria-label={`${store.name} トップページ`}
        >
          <span aria-hidden="true" className="bg-gold/45 hidden h-9 w-px sm:block" />
          <span className="flex flex-col leading-none">
            <span className="font-serif-jp text-ivory text-lg tracking-[0.22em] sm:text-xl">
              {store.name}
            </span>
            <span className="font-display text-gold/75 mt-1.5 text-[0.55rem] tracking-[0.42em] uppercase sm:text-[0.6rem]">
              {store.nameEn}
            </span>
          </span>
        </Link>

        <DesktopNavigation />

        <div className="flex items-center gap-1 sm:gap-2">
          <SocialLinks className="hidden lg:flex" only={["instagram", "tabelog"]} />
          <ReservationButton className="hidden md:inline-flex" />
          <MobileNavigation />
        </div>
      </div>
    </header>
  );
}
