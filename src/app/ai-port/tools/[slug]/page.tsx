import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, Minus } from "lucide-react";

import { PageBody, PageHero, RelatedLinks } from "@/components/ai-port/layout/PageShell";
import {
  Badge,
  Disclaimer,
  GhostLink,
  GlassCard,
  PrimaryLink,
  SponsoredBadge,
  Unknown,
} from "@/components/ai-port/ui/Primitives";
import { ToolGrid } from "@/components/ai-port/tools/ToolCard";
import { JsonLd } from "@/components/ui/JsonLd";
import { toolOutboundUrl } from "@/data/ai-port/ads";
import { getArticles } from "@/data/ai-port/articles";
import { aiPortPath } from "@/data/ai-port/site";
import { findToolCategory } from "@/data/ai-port/taxonomy";
import { findTool, pricingLabel, tools } from "@/data/ai-port/tools";
import { aiPortMetadata } from "@/lib/ai-port/seo";
import { aiPortBreadcrumbJsonLd, softwareApplicationJsonLd } from "@/lib/ai-port/structured-data";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const tool = findTool(slug);
  if (!tool) return {};

  return aiPortMetadata({
    title: `${tool.name}とは？特徴・日本語対応・API・無料枠`,
    description: `${tool.name}（提供元：${tool.maker}）の概要をまとめました。${tool.summary} 日本語UI・API提供・無料枠・法人プランの有無を掲載しています。料金は公式サイトでご確認ください。`,
    path: `/tools/${tool.slug}`,
    keywords: [tool.name, `${tool.name} 使い方`, `${tool.name} 料金`, `${tool.name} 日本語`],
  });
}

/**
 * AIツールの詳細。
 *
 * ⚠ 構造化データは SoftwareApplication のみで、offers（価格）は出しません。
 *   金額を画面に出していないので、構造化データにも書けません。
 * ⚠ AggregateRating / Review は実データがないため出力しません。
 */
export default async function ToolDetailPage({ params }: Params) {
  const { slug } = await params;
  const tool = findTool(slug);
  if (!tool) notFound();

  const category = findToolCategory(tool.categories[0]);
  const outbound = toolOutboundUrl(tool.slug);

  const crumbs = [
    { name: "AI PORT", path: "/" },
    { name: "AIツール", path: "/tools" },
    { name: tool.name, path: `/tools/${tool.slug}` },
  ];

  // 同じカテゴリーの別ツール（自分は除く）
  const alternatives = tools
    .filter((other) => other.slug !== tool.slug && other.categories[0] === tool.categories[0])
    .slice(0, 3);

  // このツールに触れている解説記事
  const relatedArticles = getArticles().filter((article) => article.toolSlugs.includes(tool.slug));

  return (
    <>
      <PageHero
        eyebrow={category?.nameEn ?? "AI TOOL"}
        title={tool.name}
        description={tool.summary}
        crumbs={crumbs}
      >
        <div className="flex flex-wrap items-center gap-3">
          <PrimaryLink href={outbound.href} external>
            公式サイトを見る
          </PrimaryLink>
          {outbound.sponsored ? <SponsoredBadge /> : null}
          <GhostLink href={aiPortPath("/compare")}>他のツールと比較</GhostLink>
        </div>
      </PageHero>

      <PageBody>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <section>
              <h2 className="text-ai-white text-[1.15rem]">特徴</h2>
              <ul className="mt-5 grid gap-3">
                {tool.strengths.map((strength) => (
                  <li key={strength}>
                    <GlassCard className="flex items-start gap-3 p-4">
                      <Check aria-hidden="true" className="text-ai-mint mt-0.5 size-4 shrink-0" />
                      <p className="text-ai-mist text-[0.86rem] leading-[1.9]">{strength}</p>
                    </GlassCard>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-12">
              <h2 className="text-ai-white text-[1.15rem]">向いている使い方</h2>
              <p className="text-ai-mist mt-4 text-[0.88rem] leading-[2]">{tool.bestFor}</p>
            </section>

            <section className="mt-12">
              <h2 className="text-ai-white text-[1.15rem]">カテゴリー</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {tool.categories.map((categoryId) => {
                  const entry = findToolCategory(categoryId);
                  if (!entry) return null;
                  return (
                    <li key={categoryId}>
                      <Badge accent={entry.accent}>{entry.name}</Badge>
                    </li>
                  );
                })}
              </ul>
            </section>

            {relatedArticles.length > 0 ? (
              <section className="mt-12">
                <h2 className="text-ai-white text-[1.15rem]">このツールに触れている解説</h2>
                <ul className="mt-5 grid gap-3">
                  {relatedArticles.map((article) => (
                    <li key={article.slug}>
                      <a
                        href={aiPortPath(`/guides/${article.slug}`)}
                        className="ai-glass ai-glass-rim group block rounded-xl p-4"
                      >
                        <span className="text-ai-white group-hover:text-ai-cyan block text-[0.9rem] transition-colors">
                          {article.title}
                        </span>
                        <span className="text-ai-haze mt-1.5 block text-[0.78rem] leading-[1.8]">
                          {article.description}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="min-w-0">
            <GlassCard className="p-6 lg:sticky lg:top-24">
              <h2 className="font-ai-mono text-ai-dim text-[0.62rem] tracking-[0.24em] uppercase">
                Spec
              </h2>

              <dl className="mt-5 grid gap-3.5 text-[0.82rem]">
                <SpecRow label="提供元" value={tool.maker} />
                <SpecRow label="料金体系" value={pricingLabel[tool.pricing]} />
                <SpecRow label="日本語UI" value={tool.japaneseUi} />
                <SpecRow label="API提供" value={tool.api} />
                <SpecRow label="スマホアプリ" value={tool.mobileApp} />
                <SpecRow label="法人・チームプラン" value={tool.team} />
              </dl>

              <p className="text-ai-dim mt-6 text-[0.72rem] leading-[1.85]">
                料金の金額は変動するため掲載していません。最新の料金プランは公式サイトでご確認ください。
                「未確認」は編集部で裏取りできていない項目です。
              </p>

              <div className="mt-6">
                <PrimaryLink href={outbound.href} external className="w-full">
                  公式サイトへ
                </PrimaryLink>
              </div>
            </GlassCard>
          </aside>
        </div>

        {alternatives.length > 0 ? (
          <section className="mt-16 border-t border-white/8 pt-10">
            <h2 className="text-ai-white text-[1.05rem]">同じカテゴリーの他のツール</h2>
            <div className="mt-6">
              <ToolGrid tools={alternatives} />
            </div>
          </section>
        ) : null}

        <Disclaimer>
          機能・提供状況・料金は変更されることがあります。AI PORT は {tool.name}{" "}
          の提供元ではありません。ご利用前に必ず公式サイトで最新情報と利用規約をご確認ください。
        </Disclaimer>

        <RelatedLinks
          items={[
            { href: aiPortPath("/tools"), label: "AIツール一覧へ戻る" },
            { href: aiPortPath("/compare"), label: "比較表で確認する" },
            { href: aiPortPath("/diagnosis/tool-match"), label: "自分に合うツールを診断する" },
          ]}
        />
      </PageBody>

      <JsonLd data={[aiPortBreadcrumbJsonLd(crumbs), softwareApplicationJsonLd(tool)]} />
    </>
  );
}

function SpecRow({ label, value }: { label: string; value: boolean | null | string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/6 pb-3.5 last:border-0 last:pb-0">
      <dt className="text-ai-haze">{label}</dt>
      <dd className="text-right">
        {typeof value === "string" ? (
          <span className="text-ai-white" translate="no">
            {value}
          </span>
        ) : value === true ? (
          <span className="text-ai-mint inline-flex items-center gap-1.5">
            <Check aria-hidden="true" className="size-3.5" />
            あり
          </span>
        ) : value === false ? (
          <span className="text-ai-dim inline-flex items-center gap-1.5">
            <Minus aria-hidden="true" className="size-3.5" />
            なし
          </span>
        ) : (
          <Unknown />
        )}
      </dd>
    </div>
  );
}
