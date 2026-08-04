import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page/PageHero";
import { JsonLd } from "@/components/ui/JsonLd";
import { Reveal } from "@/components/ui/Reveal";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { mainNav, utilityNav } from "@/data/navigation";
import { getNews } from "@/data/news";
import { store } from "@/data/store";

const crumbs = [
  { label: "ホーム", href: "/" },
  { label: "サイトマップ", href: "/sitemap" },
];

export const metadata: Metadata = pageMetadata({
  title: "サイトマップ",
  description: `${store.name}公式サイトのページ一覧です。`,
  path: "/sitemap",
});

function LinkGroup({ title, items }: { title: string; items: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="font-display text-gold text-[0.62rem] tracking-[0.4em] uppercase">{title}</h2>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="text-ivory/85 hover:text-gold text-[0.85rem] transition-colors duration-500"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SitemapPage() {
  const news = getNews();

  return (
    <>
      <PageHero en="SITEMAP" ja="サイトマップ" crumbs={crumbs} />

      <section className="pb-16">
        <div className="mx-auto max-w-[100rem] px-5 sm:px-8">
          <Reveal>
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
              <LinkGroup title="Main" items={[{ href: "/", label: "ホーム" }, ...mainNav]} />
              <LinkGroup title="About This Site" items={utilityNav} />
              <LinkGroup
                title="News"
                items={news.map((post) => ({
                  href: `/news/${post.slug}`,
                  label: post.title,
                }))}
              />
            </div>
          </Reveal>
        </div>
      </section>

      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </>
  );
}
