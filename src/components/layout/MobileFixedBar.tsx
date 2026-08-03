import Link from "next/link";
import { BookOpenText, MapPin, Phone } from "lucide-react";
import { googleMapsUrl } from "@/data/site";
import { store } from "@/data/store";

/**
 * スマートフォン下部の固定予約バー。電話 / 地図 / お品書き の3導線。
 */
export function MobileFixedBar() {
  return (
    <div className="no-print border-gold/25 fixed inset-x-0 bottom-0 z-[85] border-t bg-black/95 backdrop-blur-md md:hidden">
      <ul className="grid grid-cols-3">
        <li>
          <a
            href={store.phoneHref}
            className="bg-gold flex min-h-16 flex-col items-center justify-center gap-1 text-black"
          >
            <Phone aria-hidden="true" className="size-[1.15rem]" />
            <span className="text-[0.65rem] font-medium tracking-[0.14em]">電話予約</span>
          </a>
        </li>
        <li>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ivory/90 flex min-h-16 flex-col items-center justify-center gap-1"
          >
            <MapPin aria-hidden="true" className="text-gold size-[1.15rem]" />
            <span className="text-[0.65rem] tracking-[0.14em]">地図</span>
            <span className="sr-only">（外部サイトを新しいタブで開きます）</span>
          </a>
        </li>
        <li>
          <Link
            href="/menu"
            className="text-ivory/90 flex min-h-16 flex-col items-center justify-center gap-1"
          >
            <BookOpenText aria-hidden="true" className="text-gold size-[1.15rem]" />
            <span className="text-[0.65rem] tracking-[0.14em]">お品書き</span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
