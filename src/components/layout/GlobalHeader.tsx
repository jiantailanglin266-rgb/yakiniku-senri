"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DesktopNavigation } from "./DesktopNavigation";
import { MobileNavigation } from "./MobileNavigation";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { ReservationButton } from "@/components/ui/ReservationButton";
import { media } from "@/data/media";
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
          className="flex shrink-0 items-center gap-3 py-2"
          aria-label={`${store.name} トップページ`}
        >
          <span aria-hidden="true" className="bg-gold/45 hidden h-9 w-px sm:block" />
          {/* リンク側に aria-label があるため、画像は装飾扱い（alt="") にして二重読み上げを防ぎます */}
          <Image
            src={media.logo.src}
            alt=""
            width={media.logo.width}
            height={media.logo.height}
            priority
            /* 横幅が詰まったときに潰れないよう、縮小させません */
            className="h-11 w-auto shrink-0 sm:h-14"
          />
        </Link>

        <DesktopNavigation />

        <div className="flex items-center gap-0.5 sm:gap-2">
          {/*
            スマートフォンではフッターと同じSNSアイコンを並べます。
            電話予約は画面下部の固定バーとメニュー内にあるため、
            ヘッダーからは外しています（横幅が足りず、他の要素を圧迫するため）。
            360px 未満の端末では並べきれないので隠します（メニュー内には出ます）。
          */}
          <SocialLinks className="hidden min-[360px]:flex lg:hidden" size="xs" />
          <SocialLinks className="hidden lg:flex" only={["instagram", "tabelog"]} />
          <LanguageSwitcher />
          {/*
            ReservationButton は基底クラスに inline-flex を持ちます。
            cn() は単純連結のため className の hidden が打ち消されてしまうので、
            ラッパー側で出し分けます（md 以上では contents にして配置に影響させません）。
          */}
          <span className="hidden md:contents">
            <ReservationButton />
          </span>
          <MobileNavigation />
        </div>
      </div>
    </header>
  );
}
