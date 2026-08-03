import type { Metadata } from "next";
import { PageHero } from "@/components/page/PageHero";
import { RelatedLinks } from "@/components/page/RelatedLinks";
import { FaqList } from "@/components/page/FaqList";
import { AccessSection } from "@/components/home/AccessSection";
import { ReservationCTA } from "@/components/home/ReservationCTA";
import { JsonLd } from "@/components/ui/JsonLd";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/structured-data";
import { media } from "@/data/media";
import { store } from "@/data/store";

const crumbs = [
  { label: "ホーム", href: "/" },
  { label: "アクセス", href: "/access" },
];

export const metadata: Metadata = pageMetadata({
  title: "アクセス・店舗情報",
  description: `${store.name}（${store.addressFull}／電話 ${store.phone}）へのアクセス。東急田園都市線「駒澤大学駅」より徒歩10分、東急世田谷線「若林駅」より徒歩7分、東急バス「駒留」より徒歩1分。営業時間・定休日もご確認いただけます。`,
  path: "/access",
});

export default function AccessPage() {
  return (
    <>
      <PageHero
        en="ACCESS"
        ja={"世田谷・上馬で、\nお待ちしております。"}
        lead="駅からの道のり、営業時間、駐車場のご案内です。ご不明な点はお電話にてお問い合わせください。"
        image={media.pageHero.access}
        crumbs={crumbs}
      />

      <div id="hours" className="scroll-mt-32">
        <AccessSection />
      </div>

      <FaqList />
      <RelatedLinks currentPath="/access" />
      <ReservationCTA />

      <JsonLd data={[breadcrumbJsonLd(crumbs), faqJsonLd]} />
    </>
  );
}
