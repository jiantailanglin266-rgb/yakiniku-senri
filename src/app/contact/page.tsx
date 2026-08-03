import type { Metadata } from "next";
import { Mail, Phone } from "lucide-react";
import { PageHero } from "@/components/page/PageHero";
import { RelatedLinks } from "@/components/page/RelatedLinks";
import { BusinessHours } from "@/components/ui/BusinessHours";
import { JsonLd } from "@/components/ui/JsonLd";
import { Reveal } from "@/components/ui/Reveal";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { contactEmail } from "@/data/site";
import { media } from "@/data/media";
import { store } from "@/data/store";

const crumbs = [
  { label: "ホーム", href: "/" },
  { label: "お問い合わせ", href: "/contact" },
];

export const metadata: Metadata = pageMetadata({
  title: "お問い合わせ",
  description: `${store.name}へのお問い合わせ。ご予約・テイクアウトのご相談はお電話（${store.phone}）にて承っております。`,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <PageHero
        en="CONTACT"
        ja="お問い合わせ。"
        lead="ご予約・テイクアウトのご相談・その他のお問い合わせは、お電話にて承っております。"
        image={media.pageHero.contact}
        crumbs={crumbs}
      />

      <section className="py-12 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-6 px-5 sm:px-8 lg:grid-cols-2">
          <Reveal>
            <div className="border-gold/30 h-full border p-8">
              <p className="font-display text-gold text-[0.62rem] tracking-[0.4em] uppercase">
                By Phone
              </p>
              <h2 className="text-ivory mt-5 text-[1.1rem]">お電話でのお問い合わせ</h2>
              <a
                href={store.phoneHref}
                className="font-display text-gold-light hover:text-gold mt-6 inline-flex items-center gap-3 text-[2rem] tracking-[0.06em] transition-colors duration-500 sm:text-[2.4rem]"
              >
                <Phone aria-hidden="true" className="size-6" />
                {store.phone}
              </a>
              <p className="text-gray mt-6 text-[0.8rem] leading-[2]">
                ご予約、テイクアウトのご相談、貸切のご相談などを承ります。営業時間内にご連絡ください。
              </p>
              <div className="mt-6">
                <BusinessHours />
              </div>
            </div>
          </Reveal>

          <Reveal delay={110}>
            <div className="border-ivory/12 h-full border p-8">
              <p className="font-display text-gold text-[0.62rem] tracking-[0.4em] uppercase">
                Other
              </p>
              <h2 className="text-ivory mt-5 text-[1.1rem]">その他のお問い合わせ</h2>

              {contactEmail ? (
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-gold-light hover:text-gold mt-6 inline-flex items-center gap-2.5 text-[0.95rem] transition-colors duration-500"
                >
                  <Mail aria-hidden="true" className="size-5" />
                  {contactEmail}
                </a>
              ) : (
                <p className="text-gray mt-6 text-[0.8rem] leading-[2]">
                  メールでのお問い合わせ先は準備中です。お急ぎの場合はお電話にてご連絡ください。
                </p>
              )}

              <div className="border-ivory/10 mt-8 border-t pt-7">
                <p className="text-gray text-[0.8rem] leading-[2]">
                  最新の情報は各SNSでも発信しています。
                </p>
                <SocialLinks className="mt-3 -ml-2.5" size="md" />
              </div>

              <div className="border-ivory/10 mt-8 border-t pt-7">
                <p className="text-gold/80 text-[0.68rem] tracking-[0.2em]">所在地</p>
                <address className="text-ivory/90 mt-2 text-[0.84rem] not-italic">
                  {store.addressFull}
                </address>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <RelatedLinks currentPath="/contact" />

      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </>
  );
}
