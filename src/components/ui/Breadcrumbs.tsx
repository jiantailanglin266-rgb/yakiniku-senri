import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Crumb } from "@/lib/structured-data";
import { cn } from "@/lib/utils";

export function Breadcrumbs({ crumbs, className }: { crumbs: Crumb[]; className?: string }) {
  return (
    <nav aria-label="パンくずリスト" className={cn("text-gray text-[0.7rem]", className)}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-1.5">
              {isLast ? (
                <span aria-current="page" className="text-gold/85">
                  {crumb.label}
                </span>
              ) : (
                <>
                  <Link
                    href={crumb.href}
                    className="hover:text-gold transition-colors duration-500"
                  >
                    {crumb.label}
                  </Link>
                  <ChevronRight aria-hidden="true" className="text-gray-dark size-3" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
