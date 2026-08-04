import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { Reveal } from "@/components/ai-port/effects/Reveal";
import { PageBody, PageHero, RelatedLinks } from "@/components/ai-port/layout/PageShell";
import { AiMediaBackdrop } from "@/components/ai-port/media/AiMediaBackdrop";
import { NewsCard, NewsEmptyState } from "@/components/ai-port/news/NewsCard";
import { ToolGrid } from "@/components/ai-port/tools/ToolCard";
import { Disclaimer, GlassCard } from "@/components/ai-port/ui/Primitives";
import { JsonLd } from "@/components/ui/JsonLd";
import { getArticlesByTopic } from "@/data/ai-port/articles";
import { aiPortPath } from "@/data/ai-port/site";
import { findTopic, topics } from "@/data/ai-port/taxonomy";
import { getToolsByCategory } from "@/data/ai-port/tools";
import { getTopicNews } from "@/lib/ai-port/news";
import { aiPortMetadata } from "@/lib/ai-port/seo";
import {
  aiPortBreadcrumbJsonLd,
  newsItemListJsonLd,
  topicJsonLd,
} from "@/lib/ai-port/structured-data";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return topics.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const topic = findTopic(slug);
  if (!topic) return {};

  return aiPortMetadata({
    title: `${topic.name}｜最新ニュース・関連ツール・よくある質問`,
    description: `${topic.summary} ${topic.name}の最新ニュースを自動収集し、関連するAIツールと編集部の解説記事をまとめています。`,
    path: `/topics/${topic.slug}`,
    keywords: [topic.name, ...topic.queries, ...topic.questions.slice(0, 2)],
  });
}

/**
 * トピックハブ。
 *
 * ■ このページの役割
 *   分野ごとの入口です。「ニュース → ツール → 解説 → 質問への回答」を1画面に集約し、
 *   その分野を調べに来た人が、ここから先へ迷わず進めるようにします。
 *
 * ■ AEO
 *   「想定される質問」を見出しとして置いています。
 *   ただし、回答を持っていない質問に推測で答えることはしません。
 *   ここでは質問と、それに答えている社内コンテンツへの導線だけを示します。
 */
export default async function TopicHubPage({ params }: Params) {
  const { slug } = await params;
  const topic = findTopic(slug);
  if (!topic) notFound();

  const [news] = await Promise.all([getTopicNews(topic.slug, topic.queries, 12)]);

  const relatedTools = [
    ...new Map(
      topic.toolCategories
        .flatMap((categoryId) => getToolsByCategory(categoryId))
        .map((tool) => [tool.slug, tool]),
    ).values(),
  ].slice(0, 6);

  const articles = getArticlesByTopic(topic.slug);

  const crumbs = [
    { name: "AI PORT", path: "/" },
    { name: "カテゴリー一覧", path: "/topics" },
    { name: topic.name, path: `/topics/${topic.slug}` },
  ];

  return (
    <>
      <PageHero
        eyebrow={topic.nameEn}
        title={topic.name}
        description={topic.summary}
        crumbs={crumbs}
        visual={
          <AiMediaBackdrop
            kind="topic"
            slug={topic.slug}
            theme={topicTheme(topic.group)}
            seed={topics.findIndex((entry) => entry.slug === topic.slug)}
            priority
          />
        }
      />

      <PageBody>
        <section>
          <h2 className="text-ai-white text-[1.15rem]">{topic.name}の最新ニュース</h2>
          <p className="text-ai-haze mt-2 text-[0.84rem]">
            「{topic.queries.join("」「")}」で自動収集しています。
          </p>

          <div className="mt-6">
            {news.length === 0 ? (
              <NewsEmptyState message={`${topic.name}のニュースを取得できませんでした。`} />
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {news.map((item, index) => (
                  <Reveal key={item.link} as="li" delay={(index % 6) * 50}>
                    <NewsCard item={item} index={index} />
                  </Reveal>
                ))}
              </ul>
            )}
          </div>
        </section>

        {relatedTools.length > 0 ? (
          <section className="mt-16 border-t border-white/8 pt-10">
            <h2 className="text-ai-white text-[1.15rem]">{topic.name}に関連するAIツール</h2>
            <div className="mt-6">
              <ToolGrid tools={relatedTools} />
            </div>
          </section>
        ) : null}

        {articles.length > 0 ? (
          <section className="mt-16 border-t border-white/8 pt-10">
            <h2 className="text-ai-white text-[1.15rem]">この分野の解説記事</h2>
            <ul className="mt-6 grid gap-3 lg:grid-cols-2">
              {articles.map((article) => (
                <li key={article.slug}>
                  <Link
                    href={aiPortPath(`/guides/${article.slug}`)}
                    className="ai-glass ai-glass-rim group block h-full rounded-xl p-5"
                  >
                    <span className="text-ai-white group-hover:text-ai-cyan block text-[0.95rem] transition-colors">
                      {article.title}
                    </span>
                    <span className="text-ai-haze mt-2 block text-[0.8rem] leading-[1.85]">
                      {article.lead}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-16 border-t border-white/8 pt-10">
          <h2 className="text-ai-white text-[1.15rem]">この分野でよく検索される質問</h2>
          <ul className="mt-6 grid gap-3">
            {topic.questions.map((question) => (
              <li key={question}>
                <GlassCard className="flex items-center justify-between gap-4 p-4">
                  <p className="text-ai-mist text-[0.86rem] leading-[1.8]">{question}</p>
                  <Link
                    href={`${aiPortPath("/chat")}?q=${encodeURIComponent(question)}`}
                    className="text-ai-cyan shrink-0 text-[0.76rem] whitespace-nowrap underline underline-offset-4"
                  >
                    AIに聞く
                  </Link>
                </GlassCard>
              </li>
            ))}
          </ul>
          <p className="text-ai-dim mt-4 text-[0.74rem] leading-[1.9]">
            AIチャットは AI PORT
            内の情報を検索して回答します。サイト内に該当する情報がない場合は、その旨をお答えします。
          </p>
        </section>

        <Disclaimer>
          掲載しているニュースは配信元記事の見出しと要約の一部です。内容の正確性については配信元をご確認ください。
        </Disclaimer>

        <RelatedLinks
          items={topics
            .filter((other) => other.slug !== topic.slug && other.group === topic.group)
            .slice(0, 6)
            .map((other) => ({
              href: aiPortPath(`/topics/${other.slug}`),
              label: other.name,
              description: other.summary.slice(0, 48) + "…",
            }))}
          title="同じ分類のトピック"
        />
      </PageBody>

      <JsonLd
        data={[
          aiPortBreadcrumbJsonLd(crumbs),
          topicJsonLd(topic),
          ...(news.length > 0
            ? [newsItemListJsonLd(news, `${topic.name}のニュース`, `/topics/${topic.slug}`)]
            : []),
        ]}
      />
    </>
  );
}

/** トピックの系統から装飾テーマを決めます（画像が無いときの見た目）。 */
function topicTheme(group: "ai" | "industry" | "web3"): "news" | "business" | "crypto" {
  if (group === "web3") return "crypto";
  if (group === "industry") return "business";
  return "news";
}
