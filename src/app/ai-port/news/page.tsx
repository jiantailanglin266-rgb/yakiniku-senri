import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/ai-port/effects/Reveal";
import { PageBody, PageHero, RelatedLinks } from "@/components/ai-port/layout/PageShell";
import { NewsCard, NewsEmptyState } from "@/components/ai-port/news/NewsCard";
import { Disclaimer } from "@/components/ai-port/ui/Primitives";
import { JsonLd } from "@/components/ui/JsonLd";
import { officialFeeds, vendors } from "@/data/ai-port/feeds";
import { aiPortPath } from "@/data/ai-port/site";
import { getLatestNews } from "@/lib/ai-port/news";
import { aiPortMetadata } from "@/lib/ai-port/seo";
import { aiPortBreadcrumbJsonLd, newsItemListJsonLd } from "@/lib/ai-port/structured-data";

const CRUMBS = [
  { name: "AI PORT", path: "/" },
  { name: "AIニュース", path: "/news" },
];

export const metadata: Metadata = aiPortMetadata({
  title: "AIニュース｜生成AI・AIエージェントの最新動向",
  description:
    "OpenAI・Google DeepMind・NVIDIA・Microsoft などの公式ブログRSSと、日本語のニュース検索から自動収集したAIニュースを1か所にまとめています。ベンダー別の絞り込みにも対応。",
  path: "/news",
  keywords: ["AIニュース", "生成AI 最新", "AI 最新情報", "LLM ニュース"],
});

/**
 * AIニュース一覧。
 *
 * 本文は保存せず、見出し・要約の一部・配信元・日時と、元記事へのリンクだけを扱います。
 * 構造化データは ItemList（外部記事の一覧）です。
 * ⚠ NewsArticle は自社で書いた記事に使うものなので、ここでは出しません。
 */
export default async function NewsIndexPage() {
  const news = await getLatestNews(40);

  return (
    <>
      <PageHero
        eyebrow="AI News"
        title="AIニュース"
        highlight="自動収集"
        description="各社の公式ブログRSSと、日本語のニュース検索を組み合わせて収集しています。見出しをクリックすると、必ず配信元の記事へ移動します。"
        crumbs={CRUMBS}
      >
        <nav aria-label="ベンダー別ニュース">
          <ul className="flex flex-wrap gap-2">
            {vendors.map((vendor) => (
              <li key={vendor.id}>
                <Link
                  href={aiPortPath(`/news/${vendor.id}`)}
                  className="text-ai-haze hover:text-ai-cyan inline-flex rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[0.76rem] transition-colors hover:border-white/25"
                  translate="no"
                >
                  {vendor.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </PageHero>

      <PageBody>
        {news.length === 0 ? (
          <NewsEmptyState />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {news.map((item, index) => (
              <Reveal key={item.link} as="li" delay={(index % 8) * 45}>
                <NewsCard item={item} index={index} />
              </Reveal>
            ))}
          </ul>
        )}

        <section className="mt-16 border-t border-white/8 pt-10">
          <h2 className="text-ai-white text-[1.05rem]">収集している一次情報</h2>
          <p className="text-ai-haze mt-3 text-[0.84rem] leading-[1.95]">
            以下の公式ブログのRSSを直接読み込んでいます。これに加えて、
            日本語のニュース検索（Googleニュースの検索RSS）をベンダーごとに取得しています。
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {officialFeeds.map((feed) => (
              <li key={feed.id}>
                <span
                  className="text-ai-mist inline-flex rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[0.75rem]"
                  translate="no"
                >
                  {feed.label}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <Disclaimer>
          掲載しているのは配信元記事の見出しと要約の一部です。著作権は各配信元に帰属します。
          内容の正確性については配信元の記事をご確認ください。
        </Disclaimer>

        <RelatedLinks
          items={[
            {
              href: aiPortPath("/tools"),
              label: "AIツール一覧",
              description: "用途別に絞り込んで比較できます。",
            },
            {
              href: aiPortPath("/ranking"),
              label: "注目度ランキング",
              description: "ニュース言及数から算出した順位。",
            },
            {
              href: aiPortPath("/guides"),
              label: "編集部の解説記事",
              description: "仕組みと使い方をまとめています。",
            },
          ]}
        />
      </PageBody>

      <JsonLd
        data={[
          aiPortBreadcrumbJsonLd(CRUMBS),
          ...(news.length > 0 ? [newsItemListJsonLd(news, "AIニュース", "/news")] : []),
        ]}
      />
    </>
  );
}
