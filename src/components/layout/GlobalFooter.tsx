import Link from "next/link";
import { ExternalLink, MapPin, Phone } from "lucide-react";
import { mainNav, utilityNav } from "@/data/navigation";
import { googleMapsUrl } from "@/data/site";
import { store } from "@/data/store";
import { BusinessHours } from "@/components/ui/BusinessHours";
import { ReservationButton } from "@/components/ui/ReservationButton";
import { SocialLinks } from "@/components/ui/SocialLinks";

export function GlobalFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-gold/15 relative mt-24 border-t pb-28 md:pb-0">
      <div className="mx-auto max-w-[100rem] px-5 sm:px-8">
        {/* 上部フッター */}
        <div className="grid gap-12 py-16 lg:grid-cols-[1.15fr_1fr_1fr] lg:gap-16 lg:py-20">
          <div>
            <p className="font-serif-jp text-ivory text-2xl tracking-[0.22em]">{store.name}</p>
            <p className="font-display text-gold/75 mt-2 text-[0.62rem] tracking-[0.42em] uppercase">
              {store.nameEn}
            </p>
            <p className="text-gray mt-6 max-w-sm text-[0.82rem] leading-[2]">
              {store.founded}
              年創業。世田谷・上馬で六十余年、先代より受け継いだ秘伝のタレとともに、変わらない味をお届けしています。
            </p>
            <SocialLinks className="mt-6 -ml-2.5" />
          </div>

          <div>
            <h2 className="font-display text-gold text-[0.62rem] tracking-[0.4em] uppercase">
              Information
            </h2>
            <address className="mt-6 space-y-3 not-italic">
              <p className="text-ivory/90 flex items-start gap-2.5 text-[0.82rem]">
                <MapPin aria-hidden="true" className="text-gold/70 mt-1 size-4 shrink-0" />
                <span>{store.addressFull}</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Phone aria-hidden="true" className="text-gold/70 size-4 shrink-0" />
                <a
                  href={store.phoneHref}
                  className="font-display text-gold-light hover:text-gold text-xl tracking-[0.08em] transition-colors duration-500"
                >
                  {store.phone}
                </a>
              </p>
            </address>
            <BusinessHours className="mt-6" />
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray hover:text-gold mt-6 inline-flex min-h-11 items-center gap-2 text-[0.78rem] transition-colors duration-500"
            >
              Google Mapsで見る
              <ExternalLink aria-hidden="true" className="size-3.5" />
              <span className="sr-only">（外部サイトを新しいタブで開きます）</span>
            </a>
          </div>

          <div>
            <h2 className="font-display text-gold text-[0.62rem] tracking-[0.4em] uppercase">
              Reservation
            </h2>
            <p className="text-gray mt-6 text-[0.82rem] leading-[2]">
              ご予約はお電話にて承っております。ご希望の日時と人数をお知らせください。
            </p>
            <ReservationButton variant="gold" className="mt-6 w-full sm:w-auto" />
            <p className="text-gray-dark mt-4 text-[0.7rem]">定休日：{store.closed}</p>
          </div>
        </div>

        <hr className="rule-gold" />

        {/* 下部フッター */}
        <div className="py-10">
          <nav aria-label="フッターナビゲーション">
            <ul className="flex flex-wrap gap-x-6 gap-y-2.5">
              {[...mainNav, ...utilityNav].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-gray hover:text-gold text-[0.75rem] transition-colors duration-500"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <p className="font-display text-gray-dark mt-8 text-[0.65rem] tracking-[0.22em]">
            © {year} {store.nameEn}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
