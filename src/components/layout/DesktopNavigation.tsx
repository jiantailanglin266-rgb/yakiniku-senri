"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNav } from "@/data/navigation";
import { cn } from "@/lib/utils";

export function DesktopNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="メインナビゲーション" className="hidden xl:block">
      <ul className="flex items-center gap-7">
        {mainNav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative block py-2 text-[0.78rem] tracking-[0.12em] transition-colors duration-500",
                  active ? "text-gold" : "text-ivory/85 hover:text-gold",
                )}
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className={cn(
                    "bg-gold absolute -bottom-0.5 left-0 block h-px transition-all duration-700 ease-[cubic-bezier(.22,1,.36,1)]",
                    active ? "w-full" : "w-0 group-hover:w-full",
                  )}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
