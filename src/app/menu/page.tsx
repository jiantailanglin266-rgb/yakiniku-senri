import type { Metadata } from "next";
import { PageHero } from "@/components/page/PageHero";
import { RelatedLinks } from "@/components/page/RelatedLinks";
import { ReservationCTA } from "@/components/home/ReservationCTA";
import { MenuBrowser } from "@/components/menu/MenuBrowser";
import { JsonLd } from "@/components/ui/JsonLd";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { media } from "@/data/media";

const crumbs = [
  { label: "ホーム", href: "/" },
  { label: "お品書き", href: "/menu" },
];

export const metadata: Metadata = pageMetadata({
  title: "お品書き",
  description:
    "焼肉 千里のお品書き。秘伝のタレをもみ込んだ名物「もみシリーズ」、上ロースや銘柄牛特上カルビなどの牛肉、石焼チーズフォンデュをはじめとした一品料理をご用意しています。",
  path: "/menu",
});

export default function MenuPage() {
  return (
    <>
      <PageHero
        en="MENU"
        ja={"受け継いだ味を、\n心ゆくまで。"}
        lead="秘伝のタレをもみ込んだ名物から、〆の一品まで。カテゴリーからお選びいただけます。"
        image={media.pageHero.menu}
        crumbs={crumbs}
      />

      <section className="pb-16">
        <div className="mx-auto max-w-[100rem] px-5 sm:px-8">
          <MenuBrowser />
        </div>
      </section>

      <RelatedLinks currentPath="/menu" />
      <ReservationCTA />

      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </>
  );
}
