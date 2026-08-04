import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/page/PageHero";
import { ReservationCTA } from "@/components/home/ReservationCTA";
import { NewsList } from "@/components/news/NewsList";
import { Figure } from "@/components/ui/Figure";
import { JsonLd } from "@/components/ui/JsonLd";
import { LinkButton } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { pageMetadata } from "@/lib/seo";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/structured-data";
import {
  formatNewsDate,
  getAllNewsSlugs,
  getNews,
  getNewsBySlug,
  newsCategories,
} from "@/data/news";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllNewsSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = getNewsBySlug(slug);
  if (!post) return { title: "お知らせが見つかりません" };

  return pageMetadata({
    title: post.title,
    description: post.lead,
    path: `/news/${post.slug}`,
    type: "article",
    publishedTime: post.date,
  });
}

export default async function NewsDetailPage({ params }: Params) {
  const { slug } = await params;
  const post = getNewsBySlug(slug);
  if (!post) notFound();

  const related = getNews()
    .filter((item) => item.slug !== post.slug)
    .slice(0, 3);

  const crumbs = [
    { label: "ホーム", href: "/" },
    { label: "お知らせ", href: "/news" },
    { label: post.title, href: `/news/${post.slug}` },
  ];

  return (
    <>
      <PageHero en="NEWS" ja={post.title} crumbs={crumbs} />

      <article className="pb-16">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <Reveal>
            <div className="flex items-center gap-4">
              <time
                dateTime={post.date}
                className="font-display text-gold text-[0.78rem] tracking-[0.2em]"
              >
                {formatNewsDate(post.date)}
              </time>
              <span className="border-gold/35 text-gold/80 border px-2.5 py-0.5 text-[0.62rem] tracking-[0.16em]">
                {newsCategories[post.category]}
              </span>
            </div>
          </Reveal>

          {post.image ? (
            <Reveal delay={90}>
              <Figure
                media={{ src: post.image, alt: post.title, width: 1200, height: 675 }}
                className="mt-8 aspect-[16/9] w-full"
                sizes="(max-width: 768px) 100vw, 768px"
                soft
                label="News"
              />
            </Reveal>
          ) : null}

          <Reveal delay={140}>
            <p className="text-ivory/90 mt-10 text-[0.92rem] leading-[2.2]">{post.lead}</p>
          </Reveal>

          <div className="mt-6">
            {post.body.map((paragraph, index) => (
              <Reveal key={index} delay={200 + index * 70}>
                <p className="text-gray mb-5 text-[0.87rem] leading-[2.2]">{paragraph}</p>
              </Reveal>
            ))}
          </div>

          <Reveal delay={320}>
            <div className="mt-14">
              <LinkButton href="/news">お知らせ一覧へ戻る</LinkButton>
            </div>
          </Reveal>
        </div>
      </article>

      {related.length > 0 ? (
        <section aria-labelledby="related-news-heading" className="py-12 sm:py-16">
          <div className="mx-auto max-w-[100rem] px-5 sm:px-8">
            <h2
              id="related-news-heading"
              className="font-display text-gold text-[0.66rem] tracking-[0.42em] uppercase"
            >
              Other News
            </h2>
            <div className="mt-8">
              <NewsList posts={related} />
            </div>
          </div>
        </section>
      ) : null}

      <ReservationCTA />

      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs),
          articleJsonLd({
            title: post.title,
            description: post.lead,
            path: `/news/${post.slug}`,
            datePublished: post.date,
          }),
        ]}
      />
    </>
  );
}
