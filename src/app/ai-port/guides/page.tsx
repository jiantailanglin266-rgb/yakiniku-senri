import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/ai-port/effects/Reveal";
import { PageBody, PageHero, RelatedLinks } from "@/components/ai-port/layout/PageShell";
import { GlassCard } from "@/components/ai-port/ui/Primitives";
import { JsonLd } from "@/components/ui/JsonLd";
import { getArticles } from "@/data/ai-port/articles";
import { aiPortPath } from "@/data/ai-port/site";
import { findTopic } from "@/data/ai-port/taxonomy";
import { aiPortMetadata } from "@/lib/ai-port/seo";
import { aiPortBreadcrumbJsonLd } from "@/lib/ai-port/structured-data";
import { aiPortUrl } from "@/data/ai-port/site";

const CRUMBS = [
  { name: "AI PORT", path: "/" },
  { name: "解説記事", path: "/guides" },
];

export const metadata: Metadata = aiPortMetadata({
  title: "AI解説記事｜仕組み・導入手順・注意点",
  description:
    "AI PORT編集部が書いた解説記事の一覧です。LLMO・AEO・GEOの実装、AIエージェントの導入手順、RAGの作り方、生成物の商用利用など、実務で必要になる論点を扱っています。",
  path: "/guides",
  keywords: ["AI 解説", "生成AI 使い方", "LLMO", "RAG 作り方", "AIエージェント とは"],
});

/**
 * 解説記事の一覧。
 *
 * ⚠ PVを取得していないため「人気記事」とは表示しません。
 *   並び順は更新日の新しい順です（何を基準に並べているかを明示します）。
 */
export default function GuidesIndexPage() {
  const articles = getArticles();

  return (
    <>
      <PageHero
        eyebrow="Guides"
        title="編集部の"
        highlight="解説記事"
        description="外部から集めたニュースとは別に、AI PORT編集部が書いている一次コンテンツです。更新日の新しい順に並べています。"
        crumbs={CRUMBS}
      />

      <PageBody>
        <ul className="grid gap-4 lg:grid-cols-2">
          {articles.map((article, index) => {
            const topic = findTopic(article.topic);

            return (
              <Reveal key={article.slug} as="li" delay={index * 60}>
                <GlassCard className="group relative h-full p-6 sm:p-7">
                  <p className="text-ai-dim flex flex-wrap items-center gap-2.5 text-[0.68rem]">
                    {topic ? (
                      <Link
                        href={aiPortPath(`/topics/${topic.slug}`)}
                        className="text-ai-cyan relative z-10 hover:underline"
                      >
                        {topic.name}
                      </Link>
                    ) : null}
                    <span aria-hidden="true">/</span>
                    <time dateTime={article.updated} translate="no">
                      {article.updated} 更新
                    </time>
                    <span aria-hidden="true">/</span>
                    <span translate="no">約{article.minutes}分</span>
                  </p>

                  <h2 className="text-ai-white mt-3 text-[1.1rem] leading-[1.55]">
                    <Link
                      href={aiPortPath(`/guides/${article.slug}`)}
                      className="group-hover:text-ai-cyan transition-colors after:absolute after:inset-0"
                    >
                      {article.title}
                    </Link>
                  </h2>

                  <p className="text-ai-haze mt-3 text-[0.85rem] leading-[1.95]">{article.lead}</p>

                  <ul className="mt-5 grid gap-1.5">
                    {article.keyPoints.map((point) => (
                      <li
                        key={point}
                        className="text-ai-mist flex gap-2 text-[0.78rem] leading-[1.75]"
                      >
                        <span aria-hidden="true" className="text-ai-cyan shrink-0">
                          ―
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              </Reveal>
            );
          })}
        </ul>

        <RelatedLinks
          items={[
            { href: aiPortPath("/topics"), label: "分野から探す" },
            { href: aiPortPath("/tools"), label: "AIツール一覧" },
            { href: aiPortPath("/chat"), label: "AIチャットで質問する" },
          ]}
        />
      </PageBody>

      <JsonLd
        data={[
          aiPortBreadcrumbJsonLd(CRUMBS),
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "AI PORT 解説記事",
            url: aiPortUrl("/guides"),
            numberOfItems: articles.length,
            itemListElement: articles.map((article, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: article.title,
              url: aiPortUrl(`/guides/${article.slug}`),
            })),
          },
        ]}
      />
    </>
  );
}
