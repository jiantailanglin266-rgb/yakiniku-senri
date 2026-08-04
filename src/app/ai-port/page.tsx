import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/ai-port/effects/Reveal";
import { HeroSection } from "@/components/ai-port/home/HeroSection";
import { KeywordMarquee } from "@/components/ai-port/home/KeywordMarquee";
import { RankingBoard } from "@/components/ai-port/home/RankingBoard";
import {
  CareersSection,
  ChatSection,
  DiagnosisSection,
  EventsSection,
  FaqSection,
  GuidesSection,
  Section,
  TopicsSection,
  YoutubeSection,
} from "@/components/ai-port/home/Sections";
import { NewsCard, NewsEmptyState } from "@/components/ai-port/news/NewsCard";
import { CompareTable } from "@/components/ai-port/tools/CompareTable";
import { GradientText, SectionHeading } from "@/components/ai-port/ui/Primitives";
import { vendors } from "@/data/ai-port/feeds";
import { siteFaqs } from "@/data/ai-port/faq";
import { aiPortDescription, aiPortName, aiPortPath } from "@/data/ai-port/site";
import { tools } from "@/data/ai-port/tools";
import { JsonLd } from "@/components/ui/JsonLd";
import { countVendorMentions, getLatestNews } from "@/lib/ai-port/news";
import { rankTools } from "@/lib/ai-port/ranking";
import { aiPortMetadata } from "@/lib/ai-port/seo";
import {
  newsItemListJsonLd,
  siteFaqJsonLd,
  toolItemListJsonLd,
} from "@/lib/ai-port/structured-data";
import { getLatestVideos } from "@/lib/ai-port/youtube";

export const metadata: Metadata = aiPortMetadata({
  title: `${aiPortName} | AIニュース・AIツール・AIエージェントのポータル`,
  description: aiPortDescription,
  path: "/",
});

/**
 * AI PORT トップページ。
 *
 * ■ データの取り方
 *   ニュースとYouTubeは外部フィードから取得します。
 *   `fetch` 側に revalidate を持たせているため、
 *   ページは静的に配信され、一定時間ごとに裏側で作り直されます（ISR）。
 *   取得に失敗しても各セクションが空状態を表示するだけで、ページは壊れません。
 */
export default async function AiPortHome() {
  // 2つの取得は依存関係がないので同時に走らせます
  const [news, videos] = await Promise.all([getLatestNews(24), getLatestVideos(8)]);

  // 「注目度」は、実際に取得できたニュースでの言及数から計算します（推測値は使いません）
  const ranked = rankTools(tools, countVendorMentions(news));

  return (
    <>
      <HeroSection news={news} />

      {/* ② 最新AIニュース */}
      {/* トップの帯。ファーストビュー直後に、詰めた高さで置きます */}
      <KeywordMarquee compact tilt="right" />

      <Section id="news">
        <SectionHeading
          eyebrow="News"
          title={
            <>
              最新の<GradientText>AIニュース</GradientText>
            </>
          }
          description="各社の公式ブログRSSと、日本語のニュース検索から自動収集しています。見出しをクリックすると配信元の記事へ移動します。"
          banner="news"
          action={{ href: aiPortPath("/news"), label: "ニュース一覧" }}
        />

        {/* ベンダー別のタブ。カテゴリーページはそれぞれ独立したURLを持ちます */}
        <div className="-mx-5 mt-8 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          <ul className="flex w-max gap-2 pb-1">
            {vendors.slice(0, 14).map((vendor) => (
              <li key={vendor.id}>
                <Link
                  href={aiPortPath(`/news/${vendor.id}`)}
                  className="text-ai-haze hover:text-ai-cyan inline-flex rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[0.76rem] whitespace-nowrap transition-colors hover:border-white/25"
                  translate="no"
                >
                  {vendor.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={aiPortPath("/news")}
                className="text-ai-cyan border-ai-cyan/35 inline-flex rounded-full border bg-white/[0.04] px-3.5 py-1.5 text-[0.76rem] whitespace-nowrap"
              >
                すべて
              </Link>
            </li>
          </ul>
        </div>

        {news.length === 0 ? (
          <div className="mt-8">
            <NewsEmptyState />
          </div>
        ) : (
          <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <Reveal>
              <NewsCard item={news[0]} featured />
            </Reveal>

            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {news.slice(1, 4).map((item, index) => (
                <Reveal key={item.link} as="li" delay={(index + 1) * 60}>
                  <NewsCard item={item} index={index + 1} />
                </Reveal>
              ))}
            </ul>
          </div>
        )}

        {news.length > 4 ? (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {news.slice(4, 12).map((item, index) => (
              <Reveal key={item.link} as="li" delay={index * 50}>
                <NewsCard item={item} index={index + 4} />
              </Reveal>
            ))}
          </ul>
        ) : null}
      </Section>

      {/* ③ AIツールランキング */}
      <Section id="ranking">
        <SectionHeading
          eyebrow="Ranking"
          title={
            <>
              いま注目の<GradientText>AIツール</GradientText>
            </>
          }
          description="直近のニュースでの言及数（実測）と、編集部の選定基準を合わせた注目度スコア順です。ユーザー投票やレビュー点数は使っていません。"
          banner="ranking"
          action={{ href: aiPortPath("/ranking"), label: "計算方法と全順位" }}
        />

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <div>
            <RankingBoard ranked={ranked} limit={5} />
          </div>
          <div>
            <RankingBoard ranked={ranked.slice(5)} limit={5} />
          </div>
        </div>
      </Section>

      {/* ④ AIツール比較 */}
      <Section id="compare">
        <SectionHeading
          eyebrow="Compare"
          title={
            <>
              選定軸で<GradientText>横並び比較</GradientText>
            </>
          }
          description="料金の金額ではなく、長く効く軸（日本語対応・API・法人プラン・無料枠）で比べます。"
          banner="compare"
          action={{ href: aiPortPath("/compare"), label: "比較ページへ" }}
        />

        <div className="mt-10">
          <CompareTable />
        </div>
      </Section>

      {/* 扱っている分野を、斜めの帯で見せます（装飾。語はトピックとツール分類から） */}
      <KeywordMarquee />

      <YoutubeSection videos={videos} />
      <EventsSection />
      <CareersSection />
      <DiagnosisSection />
      <ChatSection />
      <GuidesSection />
      <TopicsSection />
      <FaqSection />

      <JsonLd
        data={[
          siteFaqJsonLd(siteFaqs),
          toolItemListJsonLd(
            ranked.slice(0, 10).map((entry) => entry.tool),
            "注目のAIツール",
            "/ranking",
          ),
          ...(news.length > 0 ? [newsItemListJsonLd(news, "最新のAIニュース", "/news")] : []),
        ]}
      />
    </>
  );
}
