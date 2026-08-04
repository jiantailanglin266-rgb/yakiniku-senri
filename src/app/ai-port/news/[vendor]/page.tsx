import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { Reveal } from "@/components/ai-port/effects/Reveal";
import { PageBody, PageHero, RelatedLinks } from "@/components/ai-port/layout/PageShell";
import { NewsCard, NewsEmptyState } from "@/components/ai-port/news/NewsCard";
import { Disclaimer, GhostLink } from "@/components/ai-port/ui/Primitives";
import { ToolGrid } from "@/components/ai-port/tools/ToolCard";
import { JsonLd } from "@/components/ui/JsonLd";
import { findVendor, vendors } from "@/data/ai-port/feeds";
import { aiPortPath } from "@/data/ai-port/site";
import { tools } from "@/data/ai-port/tools";
import { getVendorNews } from "@/lib/ai-port/news";
import { aiPortMetadata } from "@/lib/ai-port/seo";
import { aiPortBreadcrumbJsonLd, newsItemListJsonLd } from "@/lib/ai-port/structured-data";

type Params = { params: Promise<{ vendor: string }> };

/** ベンダーページは数が固定なので、すべて事前生成します。 */
export function generateStaticParams() {
  return vendors.map((vendor) => ({ vendor: vendor.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { vendor: vendorId } = await params;
  const vendor = findVendor(vendorId);
  if (!vendor) return {};

  return aiPortMetadata({
    title: `${vendor.name}の最新ニュース`,
    description: `${vendor.name}に関する最新ニュースを、公式発表と主要メディアの配信から自動収集してまとめています。関連するAIツールもあわせて確認できます。`,
    path: `/news/${vendor.id}`,
    keywords: [`${vendor.name} 最新`, `${vendor.name} ニュース`, ...vendor.terms],
  });
}

/**
 * ベンダー別のニュース。
 *
 * ここは「そのベンダーの話題だけを追いたい人」の受け皿です。
 * 一次情報（公式サイト）への導線を必ず置き、関連ツールへ内部リンクします。
 */
export default async function VendorNewsPage({ params }: Params) {
  const { vendor: vendorId } = await params;
  const vendor = findVendor(vendorId);
  if (!vendor) notFound();

  const news = await getVendorNews(vendor.id, 30);

  const crumbs = [
    { name: "AI PORT", path: "/" },
    { name: "AIニュース", path: "/news" },
    { name: vendor.name, path: `/news/${vendor.id}` },
  ];

  // 提供元名でツールを紐づけます（社名の部分一致）
  const relatedTools = tools.filter((tool) =>
    vendor.terms.some((term) =>
      `${tool.name} ${tool.maker}`.toLowerCase().includes(term.toLowerCase().split(" ")[0]),
    ),
  );

  return (
    <>
      <PageHero
        eyebrow={`${vendor.name} News`}
        title={`${vendor.name}の`}
        highlight="最新ニュース"
        description={`${vendor.name}に関する記事を自動収集しています。一次情報は公式サイトでご確認ください。`}
        crumbs={crumbs}
      >
        <GhostLink href={vendor.site} external>
          公式サイトを見る
        </GhostLink>
      </PageHero>

      <PageBody>
        {news.length === 0 ? (
          <NewsEmptyState message={`${vendor.name}のニュースを取得できませんでした。`} />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {news.map((item, index) => (
              <Reveal key={item.link} as="li" delay={(index % 8) * 45}>
                <NewsCard item={item} index={index} />
              </Reveal>
            ))}
          </ul>
        )}

        {relatedTools.length > 0 ? (
          <section className="mt-16 border-t border-white/8 pt-10">
            <h2 className="text-ai-white text-[1.05rem]">{vendor.name}の関連ツール</h2>
            <div className="mt-6">
              <ToolGrid tools={relatedTools} />
            </div>
          </section>
        ) : null}

        <Disclaimer>
          掲載しているのは配信元記事の見出しと要約の一部です。AI PORT は {vendor.name}{" "}
          の公式サイトではありません。
        </Disclaimer>

        <RelatedLinks
          items={vendors
            .filter((other) => other.id !== vendor.id)
            .slice(0, 6)
            .map((other) => ({
              href: aiPortPath(`/news/${other.id}`),
              label: `${other.name}のニュース`,
            }))}
          title="他のベンダー"
        />

        <p className="mt-8">
          <Link
            href={aiPortPath("/news")}
            className="text-ai-cyan text-[0.82rem] underline underline-offset-4"
          >
            すべてのAIニュースを見る
          </Link>
        </p>
      </PageBody>

      <JsonLd
        data={[
          aiPortBreadcrumbJsonLd(crumbs),
          ...(news.length > 0
            ? [newsItemListJsonLd(news, `${vendor.name}のニュース`, `/news/${vendor.id}`)]
            : []),
        ]}
      />
    </>
  );
}
