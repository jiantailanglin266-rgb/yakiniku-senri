import Link from "next/link";

import { JsonLd } from "@/cardport/components/ui/primitives";
import { breadcrumbJsonLd } from "@/cardport/lib/structured-data";

export type Crumb = { name: string; path: string };

/**
 * パンくず。
 * 表示と構造化データを同じデータから作り、食い違いが起きないようにしています。
 */
export function Breadcrumbs({ items, label }: { items: Crumb[]; label: string }) {
  return (
    <>
      <nav aria-label={label} className="mx-auto w-full max-w-[88rem] px-4 pt-24 sm:px-6">
        <ol className="text-dim flex flex-wrap items-center gap-1.5 text-[0.72rem]">
          {items.map((item, index) => {
            const last = index === items.length - 1;
            return (
              <li key={item.path} className="flex items-center gap-1.5">
                {last ? (
                  <span aria-current="page" className="text-mist">
                    {item.name}
                  </span>
                ) : (
                  <>
                    <Link href={item.path} className="hover:text-cyan transition-colors">
                      {item.name}
                    </Link>
                    <span aria-hidden="true">/</span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(items)} />
    </>
  );
}
