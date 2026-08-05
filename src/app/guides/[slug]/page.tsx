import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { PageBody, PageHero, RelatedLinks } from "@/components/ai-port/layout/PageShell";
import { AiMediaBackdrop } from "@/components/ai-port/media/AiMediaBackdrop";
import { ToolGrid } from "@/components/ai-port/tools/ToolCard";
import { Disclaimer, GlassCard } from "@/components/ai-port/ui/Primitives";
import { JsonLd } from "@/components/ui/JsonLd";
import { findArticle, getArticles, type Article } from "@/data/ai-port/articles";
import { aiPortName, aiPortPath } from "@/data/ai-port/site";
import { findTopic } from "@/data/ai-port/taxonomy";
import { findTool } from "@/data/ai-port/tools";
import { aiPortMetadata } from "@/lib/ai-port/seo";
import {
  aiPortBreadcrumbJsonLd,
  aiPortFaqJsonLd,
  articleJsonLd,
  howToJsonLd,
} from "@/lib/ai-port/structured-data";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = findArticle(slug);
  if (!article) return {};

  return aiPortMetadata({
    title: article.title,
    description: article.description,
    path: `/guides/${article.slug}`,
    type: "article",
    publishedTime: article.published,
    modifiedTime: article.updated,
  });
}

/**
 * 解説記事の詳細。
 *
 * ■ AEO（回答として抜き出されること）を意識した構成
 *   1. 冒頭に結論（lead）
 *   2. 3行の要点（keyPoints）
 *   3. 見出しは質問形または論点そのもの
 *   4. 手順は HowTo として構造化
 *   5. 末尾に FAQ
 *   画面に出している内容だけを構造化データに出します。
 */
export default async function GuideDetailPage({ params }: Params) {
  const { slug } = await params;
  const article = findArticle(slug);
  if (!article) notFound();

  const topic = findTopic(article.topic);
  const relatedTools = article.toolSlugs.map((toolSlug) => findTool(toolSlug)).filter(Boolean);

  const crumbs = [
    { name: "AI PORT", path: "/" },
    { name: "解説記事", path: "/guides" },
    { name: article.title, path: `/guides/${article.slug}` },
  ];

  const howTo = howToJsonLd(article);

  return (
    <>
      <PageHero
        eyebrow={topic?.name ?? "Guide"}
        title={article.title}
        description={article.lead}
        crumbs={crumbs}
        visual={
          <AiMediaBackdrop
            kind="guide"
            slug={article.slug}
            theme="guide"
            seed={getArticles().findIndex((entry) => entry.slug === article.slug) + 3}
            priority
          />
        }
      >
        <p className="text-ai-dim flex flex-wrap items-center gap-3 text-[0.74rem]">
          <span translate="no">公開 {article.published}</span>
          <span aria-hidden="true">/</span>
          <span translate="no">更新 {article.updated}</span>
          <span aria-hidden="true">/</span>
          <span translate="no">約{article.minutes}分</span>
          <span aria-hidden="true">/</span>
          <span>{aiPortName} 編集部</span>
        </p>
      </PageHero>

      <PageBody>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <article className="min-w-0">
            {/* 要点 — 生成AIが引用しやすいよう、冒頭に短く置きます */}
            <GlassCard className="p-6">
              <h2 className="font-ai-mono text-ai-dim text-[0.62rem] tracking-[0.24em] uppercase">
                この記事の要点
              </h2>
              <ul className="mt-4 grid gap-2.5">
                {article.keyPoints.map((point) => (
                  <li
                    key={point}
                    className="text-ai-mist flex gap-2.5 text-[0.86rem] leading-[1.9]"
                  >
                    <span aria-hidden="true" className="text-ai-cyan shrink-0">
                      ―
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </GlassCard>

            <div className="ai-prose text-ai-mist mt-12">
              {article.sections.map((section) => (
                <section
                  key={section.heading}
                  className="scroll-mt-24"
                  id={slugify(section.heading)}
                >
                  <h2>{section.heading}</h2>

                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}

                  {section.list ? (
                    <ul>
                      {section.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}

                  {section.steps ? (
                    <ol className="not-prose mt-6 grid list-none gap-3 p-0">
                      {section.steps.map((step, index) => (
                        <li key={step.name}>
                          <GlassCard className="flex gap-4 p-5">
                            <span
                              className="font-ai-display from-ai-cyan to-ai-violet shrink-0 bg-gradient-to-br bg-clip-text text-[1.2rem] leading-none font-bold text-transparent"
                              translate="no"
                            >
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <h3 className="text-ai-white m-0 text-[0.92rem]">{step.name}</h3>
                              <p className="text-ai-haze mt-1.5 text-[0.83rem] leading-[1.9]">
                                {step.text}
                              </p>
                            </div>
                          </GlassCard>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </section>
              ))}
            </div>

            <section className="mt-16 border-t border-white/8 pt-10">
              <h2 className="text-ai-white text-[1.15rem]">よくある質問</h2>
              <dl className="mt-6 grid gap-5">
                {article.faq.map((entry) => (
                  <div key={entry.q}>
                    <dt className="text-ai-white text-[0.92rem] leading-[1.7]">{entry.q}</dt>
                    <dd className="text-ai-haze mt-2 text-[0.85rem] leading-[1.95]">{entry.a}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {relatedTools.length > 0 ? (
              <section className="mt-16 border-t border-white/8 pt-10">
                <h2 className="text-ai-white text-[1.15rem]">この記事で触れているツール</h2>
                <div className="mt-6">
                  <ToolGrid tools={relatedTools as NonNullable<(typeof relatedTools)[number]>[]} />
                </div>
              </section>
            ) : null}

            <Disclaimer>
              本記事は公開情報にもとづく編集部の整理です。法律・税務・投資・医療に関する記述は一般的な情報提供であり、
              専門的な助言ではありません。最終的な判断は各分野の専門家と一次情報にもとづいて行ってください。
            </Disclaimer>
          </article>

          <aside className="min-w-0">
            <nav aria-label="目次" className="lg:sticky lg:top-24">
              <h2 className="font-ai-mono text-ai-dim text-[0.62rem] tracking-[0.24em] uppercase">
                目次
              </h2>
              <ol className="mt-4 grid gap-2.5">
                {article.sections.map((section) => (
                  <li key={section.heading}>
                    <a
                      href={`#${slugify(section.heading)}`}
                      className="text-ai-mist hover:text-ai-cyan block text-[0.8rem] leading-[1.7] transition-colors"
                    >
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>
        </div>

        <RelatedLinks
          items={[
            ...(topic
              ? [
                  {
                    href: aiPortPath(`/topics/${topic.slug}`),
                    label: `${topic.name}のハブ`,
                    description: topic.summary,
                  },
                ]
              : []),
            ...getArticles()
              .filter((other) => other.slug !== article.slug)
              .slice(0, 2)
              .map((other) => ({
                href: aiPortPath(`/guides/${other.slug}`),
                label: other.title,
                description: other.description.slice(0, 60) + "…",
              })),
          ]}
        />

        <p className="mt-8">
          <Link
            href={aiPortPath("/guides")}
            className="text-ai-cyan text-[0.82rem] underline underline-offset-4"
          >
            解説記事の一覧へ戻る
          </Link>
        </p>
      </PageBody>

      <JsonLd
        data={[
          aiPortBreadcrumbJsonLd(crumbs),
          articleJsonLd(article),
          aiPortFaqJsonLd(article.faq),
          ...(howTo ? [howTo] : []),
        ]}
      />
    </>
  );
}

/** 見出しからアンカーIDを作ります（日本語はそのままだとURLで扱いづらいため、通し番号で代替）。 */
function slugify(heading: string): string {
  // 見出しの文字コードから安定したIDを作ります（同じ見出しなら常に同じID）
  let hash = 0;
  for (let index = 0; index < heading.length; index += 1) {
    hash = (hash * 31 + heading.charCodeAt(index)) % 100000;
  }
  return `section-${hash}`;
}

export type { Article };
