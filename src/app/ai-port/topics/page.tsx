import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/ai-port/effects/Reveal";
import { PageBody, PageHero, RelatedLinks } from "@/components/ai-port/layout/PageShell";
import { JsonLd } from "@/components/ui/JsonLd";
import { aiPortPath, aiPortUrl } from "@/data/ai-port/site";
import { accentText, topicGroups, topics } from "@/data/ai-port/taxonomy";
import { aiPortMetadata } from "@/lib/ai-port/seo";
import { aiPortBreadcrumbJsonLd } from "@/lib/ai-port/structured-data";
import { cn } from "@/lib/utils";

const CRUMBS = [
  { name: "AI PORT", path: "/" },
  { name: "カテゴリー一覧", path: "/topics" },
];

export const metadata: Metadata = aiPortMetadata({
  title: "カテゴリー一覧｜AI・業界別活用・Web3",
  description: `AI PORTが扱う${topics.length}分野の一覧です。AIニュース・AIツール・AI動画・AI画像・AI音楽・AIエージェント・AI営業・AIマーケティング・AI医療・AI教育・AI投資・Web3・NFT・DAO・メタバース・ブロックチェーンなど。`,
  path: "/topics",
  keywords: ["AI カテゴリー", "AI 分野", "Web3", "AI 業界別"],
});

export default function TopicsIndexPage() {
  return (
    <>
      <PageHero
        eyebrow="Topics"
        title="分野から"
        highlight="探す"
        description="各ハブには、その分野の最新ニュース・関連ツール・よく検索される質問への回答をまとめています。"
        crumbs={CRUMBS}
      />

      <PageBody>
        <div className="space-y-12">
          {topicGroups.map((group) => (
            <section key={group.id}>
              <h2 className="text-ai-white text-[1.1rem]">{group.label}</h2>
              <p className="text-ai-haze mt-1.5 text-[0.82rem]">{group.description}</p>

              <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {topics
                  .filter((topic) => topic.group === group.id)
                  .map((topic, index) => (
                    <Reveal key={topic.slug} as="li" delay={index * 50}>
                      <Link
                        href={aiPortPath(`/topics/${topic.slug}`)}
                        className="ai-glass ai-glass-rim group block h-full rounded-2xl p-5 transition-transform duration-500 hover:-translate-y-0.5"
                      >
                        <span
                          className={cn(
                            "font-ai-mono text-[0.6rem] tracking-[0.2em]",
                            accentText[topic.accent],
                          )}
                        >
                          {topic.nameEn}
                        </span>
                        <h3 className="text-ai-white group-hover:text-ai-cyan mt-2 text-[1rem] transition-colors">
                          {topic.name}
                        </h3>
                        <p className="text-ai-haze mt-2.5 text-[0.8rem] leading-[1.9]">
                          {topic.summary}
                        </p>
                        <p className="text-ai-dim mt-4 text-[0.72rem]">
                          想定される質問 {topic.questions.length} 件を掲載
                        </p>
                      </Link>
                    </Reveal>
                  ))}
              </ul>
            </section>
          ))}
        </div>

        <RelatedLinks
          items={[
            { href: aiPortPath("/news"), label: "AIニュース一覧" },
            { href: aiPortPath("/tools"), label: "AIツール一覧" },
            { href: aiPortPath("/guides"), label: "解説記事一覧" },
          ]}
        />
      </PageBody>

      <JsonLd
        data={[
          aiPortBreadcrumbJsonLd(CRUMBS),
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "AI PORT カテゴリー一覧",
            url: aiPortUrl("/topics"),
            numberOfItems: topics.length,
            itemListElement: topics.map((topic, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: topic.name,
              url: aiPortUrl(`/topics/${topic.slug}`),
            })),
          },
        ]}
      />
    </>
  );
}
