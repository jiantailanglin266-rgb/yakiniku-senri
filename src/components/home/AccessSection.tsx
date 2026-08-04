import { ExternalLink, Phone } from "lucide-react";
import { GoogleMap } from "./GoogleMap";
import { BusinessHours } from "@/components/ui/BusinessHours";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ReservationButton } from "@/components/ui/ReservationButton";
import { googleMapsUrl } from "@/data/site";
import { store } from "@/data/store";

export function AccessSection() {
  return (
    <section aria-labelledby="access-heading" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-[100rem] px-5 sm:px-8">
        <SectionHeading
          id="access-heading"
          en="ACCESS"
          ja="世田谷・上馬で、お待ちしております。"
          align="center"
        />

        <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-14">
          <Reveal direction="left">
            <div className="border-ivory/10 border p-7 sm:p-9">
              <p className="font-serif-jp text-ivory text-xl tracking-[0.2em]">{store.name}</p>
              <p className="font-display text-gold/70 mt-2 text-[0.6rem] tracking-[0.4em] uppercase">
                {store.nameEn}
              </p>

              <dl className="mt-8 space-y-5">
                <div>
                  <dt className="text-gold/80 text-[0.68rem] tracking-[0.2em]">住所</dt>
                  <dd translate="no" className="text-ivory/90 mt-1.5 text-[0.86rem]">
                    {store.addressFull}
                  </dd>
                </div>
                <div>
                  <dt className="text-gold/80 text-[0.68rem] tracking-[0.2em]">電話番号</dt>
                  <dd className="mt-1.5">
                    <a
                      href={store.phoneHref}
                      translate="no"
                      className="font-display text-gold-light hover:text-gold inline-flex items-center gap-2 text-xl tracking-[0.08em] transition-colors duration-500"
                    >
                      <Phone aria-hidden="true" className="size-4" />
                      {store.phone}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-gold/80 text-[0.68rem] tracking-[0.2em]">営業時間</dt>
                  <dd className="mt-2">
                    <BusinessHours />
                  </dd>
                </div>
                <div>
                  <dt className="text-gold/80 text-[0.68rem] tracking-[0.2em]">アクセス</dt>
                  <dd className="mt-2 space-y-1.5">
                    {store.access.map((route) => (
                      <p key={route.label} className="text-ivory/90 text-[0.84rem]">
                        <span className="text-gray">{route.label}</span>
                        {route.value}
                      </p>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt className="text-gold/80 text-[0.68rem] tracking-[0.2em]">駐車場</dt>
                  <dd className="text-ivory/90 mt-1.5 text-[0.84rem]">{store.parking}</dd>
                </div>
              </dl>

              <div className="mt-9 flex flex-wrap gap-3">
                <ReservationButton variant="gold" />
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-ivory/20 text-ivory/85 hover:border-ivory/50 inline-flex min-h-11 items-center justify-center gap-2 border px-6 py-3 text-[0.8rem] tracking-[0.18em] transition-colors duration-500 hover:text-white"
                >
                  Google Mapsを開く
                  <ExternalLink aria-hidden="true" className="size-3.5 opacity-70" />
                  <span className="sr-only">（外部サイトを新しいタブで開きます）</span>
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal direction="right">
            <GoogleMap className="border-ivory/10 relative h-[22rem] w-full overflow-hidden border lg:h-full lg:min-h-[30rem]" />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
