import { NewsList } from "@/components/news/NewsList";
import { LinkButton } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getNews } from "@/data/news";

export function NewsSection() {
  const posts = getNews(3);

  return (
    <section aria-labelledby="news-heading" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-[100rem] px-5 sm:px-8">
        <SectionHeading id="news-heading" en="NEWS" ja="千里からのお知らせ。" align="center" />
        <div className="mt-16">
          <NewsList posts={posts} />
        </div>
        <Reveal className="mt-14 flex justify-center">
          <LinkButton href="/news">お知らせ一覧を見る</LinkButton>
        </Reveal>
      </div>
    </section>
  );
}
