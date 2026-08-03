"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { mainNav, utilityNav } from "@/data/navigation";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { ReservationButton } from "@/components/ui/ReservationButton";
import { BusinessHours } from "@/components/ui/BusinessHours";
import { store } from "@/data/store";

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function MobileNavigation() {
  const pathname = usePathname();
  // 「どのページで開いたか」を保持することで、ページ遷移時に自動で閉じます
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpenedOn(null), []);

  // 背面スクロール固定 + ESC + フォーカストラップ
  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        triggerRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !panel) return;

      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpenedOn(pathname)}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        className="text-ivory hover:text-gold grid size-11 place-items-center transition-colors duration-500 xl:hidden"
      >
        <Menu aria-hidden="true" className="size-6" />
        <span className="sr-only">メニューを開く</span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="mobile-nav"
            className="fixed inset-0 z-[95] xl:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              aria-label="メニューを閉じる"
              onClick={close}
              className="absolute inset-0 h-full w-full bg-black/70 backdrop-blur-sm"
            />

            <motion.div
              ref={panelRef}
              id="mobile-navigation"
              role="dialog"
              aria-modal="true"
              aria-label="サイトナビゲーション"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="border-gold/20 bg-black-soft absolute inset-y-0 right-0 flex w-full max-w-[26rem] flex-col overflow-y-auto border-l px-7 pt-6 pb-10"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-gold text-[0.62rem] tracking-[0.42em] uppercase">
                  Menu
                </span>
                <button
                  type="button"
                  onClick={close}
                  className="text-ivory hover:text-gold grid size-11 place-items-center transition-colors duration-500"
                >
                  <X aria-hidden="true" className="size-6" />
                  <span className="sr-only">メニューを閉じる</span>
                </button>
              </div>

              <nav aria-label="メインナビゲーション（モバイル）" className="mt-8">
                <ul className="space-y-0.5">
                  {mainNav.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="border-ivory/8 hover:text-gold flex items-baseline gap-4 border-b py-4 transition-colors duration-500"
                      >
                        <span className="font-display text-gold/60 text-[0.6rem] tracking-[0.3em]">
                          {item.labelEn}
                        </span>
                        <span className="font-serif-jp text-base tracking-[0.1em]">
                          {item.label}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="border-gold/15 mt-8 border-t pt-7">
                <p className="font-display text-gold/70 text-[0.6rem] tracking-[0.36em] uppercase">
                  Reservation
                </p>
                <a
                  href={store.phoneHref}
                  className="font-display text-gold-light mt-3 block text-2xl tracking-[0.08em]"
                >
                  {store.phone}
                </a>
                <BusinessHours className="mt-4" compact />
                <ReservationButton variant="gold" className="mt-5 w-full" />
              </div>

              <div className="mt-8">
                <SocialLinks className="-ml-2.5" />
              </div>

              <nav aria-label="その他のリンク" className="mt-6">
                <ul className="flex flex-wrap gap-x-5 gap-y-2">
                  {utilityNav.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-gray hover:text-gold text-[0.7rem] transition-colors duration-500"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
