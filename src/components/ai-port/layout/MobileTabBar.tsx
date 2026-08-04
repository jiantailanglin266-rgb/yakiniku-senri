"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, Newspaper, Wrench } from "lucide-react";
import { aiTabNav } from "@/data/ai-port/navigation";
import { aiPortPath } from "@/data/ai-port/site";
import { cn } from "@/lib/utils";

const ICONS = [Home, Newspaper, Wrench, MessageSquare];

/**
 * モバイル下部の固定タブ。
 *
 * 親指の届く位置に主要導線を置きます。
 * `env(safe-area-inset-bottom)` を見てホームバーに隠れないようにしています。
 */
export function MobileTabBar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === aiPortPath("/") ? pathname === href : pathname.startsWith(href);

  return (
    <nav
      aria-label="主要メニュー"
      className="fixed inset-x-0 bottom-0 z-[88] border-t border-white/8 bg-[#04060f]/92 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-4">
        {aiTabNav.map((item, index) => {
          const Icon = ICONS[index] ?? Home;
          const active = isActive(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[0.62rem] transition-colors duration-300",
                  active ? "text-ai-cyan" : "text-ai-dim",
                )}
              >
                <Icon aria-hidden="true" className="size-[1.15rem]" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
