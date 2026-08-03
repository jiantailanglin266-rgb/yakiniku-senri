import type { Metadata } from "next";
import { PageHero } from "@/components/page/PageHero";
import { RelatedLinks } from "@/components/page/RelatedLinks";
import { StorySection } from "@/components/home/StorySection";
import { ReservationCTA } from "@/components/home/ReservationCTA";
import { GalleryGrid } from "@/components/home/GalleryGrid";
import { JsonLd } from "@/components/ui/JsonLd";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { media } from "@/data/media";
import { store } from "@/data/store";

const crumbs = [
  { label: "ホーム", href: "/" },
  { label: "当店について", href: "/about" },
];

export const metadata: Metadata = pageMetadata({
  title: "当店について",
  description: `${store.founded}年創業、世田谷・上馬の老舗焼肉店「${store.name}」の歩み。二代目、三代目へと受け継がれた秘伝のタレと、変わらない味についてご紹介します。`,
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <PageHero
        en="ABOUT"
        ja={"世田谷の地で、\n六十余年。"}
        lead={`${store.founded}年の創業以来、世田谷・上馬で焼肉をお出ししてきました。二代目、三代目へと引き継がれた今も、変わらない確かな味でおもてなしいたします。`}
        image={media.pageHero.about}
        crumbs={crumbs}
      />

      <StorySection showCta={false} />
      <GalleryGrid />
      <RelatedLinks currentPath="/about" />
      <ReservationCTA />

      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </>
  );
}
