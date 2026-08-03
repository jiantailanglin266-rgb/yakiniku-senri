import { NewsCard } from "./NewsCard";
import { Reveal } from "@/components/ui/Reveal";
import type { NewsPost } from "@/data/news";

export function NewsList({ posts }: { posts: NewsPost[] }) {
  if (posts.length === 0) {
    return <p className="text-gray text-sm">現在お知らせはありません。</p>;
  }

  return (
    <ul className="grid gap-6 md:grid-cols-3">
      {posts.map((post, index) => (
        <Reveal as="li" key={post.slug} delay={index * 80} className="h-full">
          <NewsCard post={post} />
        </Reveal>
      ))}
    </ul>
  );
}
