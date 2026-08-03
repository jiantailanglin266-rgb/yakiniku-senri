import type { Metadata } from "next";
import { PageHero } from "@/components/page/PageHero";
import { RelatedLinks } from "@/components/page/RelatedLinks";
import { ReservationCTA } from "@/components/home/ReservationCTA";
import { NewsList } from "@/components/news/NewsList";
import { JsonLd } from "@/components/ui/JsonLd";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { getNews } from "@/data/news";
import { media } from "@/data/media";

const crumbs = [
  { label: "ホーム", href: "/" },
  { label: "お知らせ", href: "/news" },
];

export const metadata: Metadata = pageMetadata({
  title: "お知らせ",
  description:
    "焼肉 千里からのお知らせ。営業時間の変更、メニュー、テイクアウト、イベントなどの最新情報をお届けします。",
  path: "/news",
});

export default function NewsPage() {
  const posts = getNews();

  return (
    <>
      <PageHero
        en="NEWS"
        ja="千里からのお知らせ。"
        lead="営業時間の変更やメニューの更新など、最新の情報をお届けします。"
        image={media.pageHero.news}
        crumbs={crumbs}
      />

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-[100rem] px-5 sm:px-8">
          <NewsList posts={posts} />
        </div>
      </section>

      <RelatedLinks currentPath="/news" />
      <ReservationCTA />

      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </>
  );
}
