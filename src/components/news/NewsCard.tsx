import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Figure } from "@/components/ui/Figure";
import { formatNewsDate, newsCategories, type NewsPost } from "@/data/news";

export function NewsCard({ post }: { post: NewsPost }) {
  return (
    <article className="group h-full">
      <Link
        href={`/news/${post.slug}`}
        className="border-ivory/10 hover:border-gold/55 flex h-full flex-col border transition-colors duration-700 ease-[cubic-bezier(.22,1,.36,1)]"
      >
        <Figure
          media={{ src: post.image ?? "", alt: post.title, width: 1200, height: 900 }}
          className="aspect-[16/10] w-full"
          sizes="(max-width: 640px) 100vw, 33vw"
          imageClassName="transition-transform duration-[1400ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.06]"
          label="News"
        />
        <div className="flex flex-1 flex-col p-6 sm:p-7">
          <div className="flex items-center gap-4">
            <time
              dateTime={post.date}
              className="font-display text-gold/85 text-[0.72rem] tracking-[0.2em]"
            >
              {formatNewsDate(post.date)}
            </time>
            <span className="border-gold/35 text-gold/80 border px-2.5 py-0.5 text-[0.6rem] tracking-[0.16em]">
              {newsCategories[post.category]}
            </span>
          </div>
          <h3 className="text-ivory mt-4 text-[0.98rem] leading-[1.8]">{post.title}</h3>
          <p className="text-gray mt-3 flex-1 text-[0.78rem] leading-[2]">{post.lead}</p>
          <span className="text-gold mt-6 inline-flex items-center gap-2 text-[0.72rem] tracking-[0.16em]">
            詳しく見る
            <ArrowRight
              aria-hidden="true"
              className="size-3.5 transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-x-1"
            />
          </span>
        </div>
      </Link>
    </article>
  );
}
