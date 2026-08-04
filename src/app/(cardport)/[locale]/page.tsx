/**
 * CARD PORT トップページ。
 *
 * 指定のセクション順（1. ファーストビュー 〜 22. フッター）で構成しています。
 * フッターは `[locale]/layout.tsx` にあるため、このファイルは 1〜21 を扱います。
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { cards } from "@/cardport/data/cards";
import { rankingCategories } from "@/cardport/data/categories";
import { diagnoses } from "@/cardport/data/diagnoses";
import { getFaqs } from "@/cardport/data/faqs";
import { getNews, getNewsByCategory } from "@/cardport/data/news";
import { simulators } from "@/cardport/data/simulators";
import { financialTools } from "@/cardport/data/tools";
import { getVideos } from "@/cardport/data/videos";
import { getDictionary } from "@/cardport/i18n";
import { isLocale, locales, type Locale } from "@/cardport/i18n/locales";
import { pick } from "@/cardport/i18n/localized";
import { isMockData } from "@/cardport/config/site";
import { rankCards } from "@/cardport/lib/scoring";
import { routes } from "@/cardport/lib/routes";
import { cardportMetadata } from "@/cardport/lib/seo";
import { faqJsonLd, itemListJsonLd } from "@/cardport/lib/structured-data";

import { Hero } from "@/cardport/components/home/Hero";
import { CampaignTicker } from "@/cardport/components/home/CampaignTicker";
import {
  CategoryChips,
  FaqList,
  FeatureGrid,
  GuideList,
  NewsGrid,
  SubscribeBox,
  ToolGrid,
  VideoGrid,
  Web3Grid,
} from "@/cardport/components/home/sections";
import { CardTile } from "@/cardport/components/cards/CardTile";
import { Concierge } from "@/cardport/components/chat/Concierge";
import {
  Badge,
  JsonLd,
  LinkButton,
  Notice,
  Panel,
  Section,
  SectionHeading,
} from "@/cardport/components/ui/primitives";
import { Reveal } from "@/cardport/components/visual/Reveal";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const locale = raw as Locale;
  const dictionary = getDictionary(locale);
  return cardportMetadata({
    title: dictionary.hero.title,
    description: dictionary.hero.subtitle,
    path: routes.home(locale),
    locale,
  });
}

export default async function CardPortHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dictionary = getDictionary(locale);

  const overall = rankCards(cards, "overall", 6);
  const businessCards = cards.filter((card) => card.business);
  const cryptoCards = cards.filter((card) => card.crypto);
  const siteFaqs = getFaqs("site").slice(0, 6);

  return (
    <>
      {/* 1. ファーストビュー */}
      <Hero locale={locale} dictionary={dictionary} />

      {/* 2. 最新キャンペーンティッカー */}
      <CampaignTicker locale={locale} dictionary={dictionary} />

      {isMockData ? (
        <Section className="!py-6">
          <Notice tone="warn">{dictionary.legal.mockNotice}</Notice>
        </Section>
      ) : null}

      {/* 3. 人気クレジットカードランキング */}
      <Section id="ranking" labelledBy="ranking-heading">
        <SectionHeading
          id="ranking-heading"
          eyebrow="RANKING"
          title={dictionary.sections.ranking}
          lead={dictionary.sections.rankingLead}
          accent="gold"
          action={
            <LinkButton href={routes.rankings(locale)} variant="ghost">
              {dictionary.common.more} →
            </LinkButton>
          }
        />
        <div className="mb-6">
          <CategoryChips locale={locale} />
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {overall.map((entry) => (
            <Reveal as="li" key={entry.card.id} delayIndex={entry.rank}>
              <CardTile
                card={entry.card}
                locale={locale}
                dictionary={dictionary}
                rank={entry.rank}
                placement="ranking"
              />
            </Reveal>
          ))}
        </ul>
        <p className="text-dim mt-5 text-[0.72rem]">
          <Link
            href={routes.policy(locale, "ranking-criteria")}
            className="hover:text-cyan underline"
          >
            {dictionary.footer.rankingCriteria}
          </Link>
        </p>
      </Section>

      {/* 4. AIクレジットカード診断 ＋ 5. カード検索 */}
      <Section id="diagnosis" labelledBy="diagnosis-heading">
        <SectionHeading
          id="diagnosis-heading"
          eyebrow="AI FINDER"
          title={dictionary.sections.diagnosis}
          lead={dictionary.sections.diagnosisLead}
          accent="cyan"
        />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {diagnoses.map((diagnosis, index) => (
            <Reveal as="li" key={diagnosis.id} delayIndex={index % 6}>
              <Link href={routes.diagnosis(locale, diagnosis.slug)} className="block h-full">
                <Panel glow className="hover:border-cyan/40 h-full p-4 transition-colors">
                  <Badge accent={diagnosis.accent}>{dictionary.diagnosis.start}</Badge>
                  <h3 className="text-ink mt-2.5 text-[0.9rem] font-semibold">
                    {pick(diagnosis.title, locale)}
                  </h3>
                  <p className="text-mist mt-1.5 line-clamp-2 text-[0.75rem] leading-relaxed">
                    {pick(diagnosis.lead, locale)}
                  </p>
                </Panel>
              </Link>
            </Reveal>
          ))}
        </ul>
        <div className="mt-5">
          <Notice>{dictionary.diagnosis.disclaimer}</Notice>
        </div>
      </Section>

      <Section id="search" labelledBy="search-heading">
        <SectionHeading
          id="search-heading"
          eyebrow="SEARCH"
          title={dictionary.sections.cardSearch}
          lead={dictionary.sections.cardSearchLead}
          accent="electric"
          action={
            <LinkButton href={routes.cards(locale)} variant="primary">
              {dictionary.common.apply}
            </LinkButton>
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {rankingCategories.slice(0, 8).map((category, index) => (
            <Reveal key={category.id} delayIndex={index}>
              <Link href={routes.cardCategory(locale, category.id)}>
                <Panel className="hover:border-cyan/40 p-4 transition-colors">
                  <p className="text-ink text-[0.86rem] font-semibold">
                    {pick(category.title, locale)}
                  </p>
                  <p className="text-dim numeric mt-1 text-[0.7rem]">
                    {cards.filter((card) => card.categories.includes(category.id)).length}{" "}
                    {dictionary.common.results}
                  </p>
                </Panel>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 6. クレジットカード比較表 */}
      <Section id="compare" labelledBy="compare-heading">
        <SectionHeading
          id="compare-heading"
          eyebrow="COMPARE"
          title={dictionary.sections.comparison}
          lead={dictionary.sections.comparisonLead}
          accent="violet"
          action={
            <LinkButton href={routes.compare(locale)} variant="outline">
              {dictionary.sections.comparison} →
            </LinkButton>
          }
        />
        <Panel className="overflow-x-auto p-1">
          <table className="sticky-col w-full min-w-[42rem] border-collapse text-[0.78rem]">
            <caption className="sr-only">{dictionary.sections.comparison}</caption>
            <thead>
              <tr className="border-line/60 text-dim border-b text-[0.7rem]">
                <th scope="col" className="p-3 text-start font-normal">
                  {dictionary.nav.cards}
                </th>
                <th scope="col" className="p-3 text-end font-normal">
                  {dictionary.card.annualFee}
                </th>
                <th scope="col" className="p-3 text-end font-normal">
                  {dictionary.card.baseRate}
                </th>
                <th scope="col" className="p-3 text-end font-normal">
                  {dictionary.card.maxRate}
                </th>
                <th scope="col" className="p-3 text-end font-normal">
                  {dictionary.card.issueSpeed}
                </th>
                <th scope="col" className="p-3 text-end font-normal">
                  {dictionary.card.score}
                </th>
              </tr>
            </thead>
            <tbody>
              {overall.map((entry) => (
                <tr key={entry.card.id} className="border-line/30 border-b last:border-0">
                  <th scope="row" className="p-3 text-start font-normal">
                    <Link
                      href={routes.card(locale, entry.card.slug)}
                      className="text-ink hover:text-cyan"
                    >
                      {pick(entry.card.name, locale)}
                    </Link>
                  </th>
                  <td className="numeric text-mist p-3 text-end">
                    {entry.card.annualFee === 0
                      ? dictionary.common.free
                      : entry.card.annualFee.toLocaleString("ja-JP")}
                  </td>
                  <td className="numeric text-cyan p-3 text-end">{entry.card.baseRate}%</td>
                  <td className="numeric text-mist p-3 text-end">{entry.card.maxRate}%</td>
                  <td className="numeric text-mist p-3 text-end">
                    {entry.card.issueDays}
                    {dictionary.card.days}
                  </td>
                  <td className="numeric text-gold p-3 text-end font-semibold">
                    {entry.score.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </Section>

      {/* 7. 目的別カード特集 */}
      <Section labelledBy="features-heading">
        <SectionHeading
          id="features-heading"
          eyebrow="COLLECTIONS"
          title={dictionary.sections.features}
          accent="emerald"
          action={
            <LinkButton href={routes.features(locale)} variant="ghost">
              {dictionary.common.more} →
            </LinkButton>
          }
        />
        <FeatureGrid locale={locale} limit={12} />
      </Section>

      {/* 8. 最新クレジットカードニュース */}
      <Section labelledBy="cardnews-heading">
        <SectionHeading
          id="cardnews-heading"
          eyebrow="NEWS"
          title={dictionary.sections.cardNews}
          accent="cyan"
          action={
            <LinkButton href={routes.news(locale)} variant="ghost">
              {dictionary.common.more} →
            </LinkButton>
          }
        />
        <NewsGrid
          articles={getNewsByCategory(["card", "campaign", "point", "mile"], 3)}
          locale={locale}
          dictionary={dictionary}
        />
      </Section>

      {/* 9. キャッシュレス・フィンテックニュース */}
      <Section labelledBy="fintechnews-heading">
        <SectionHeading
          id="fintechnews-heading"
          eyebrow="FINTECH"
          title={dictionary.sections.fintechNews}
          accent="violet"
        />
        <NewsGrid
          articles={getNewsByCategory(
            ["cashless", "fintech", "security", "fraud", "regulation"],
            3,
          )}
          locale={locale}
          dictionary={dictionary}
        />
      </Section>

      {/* 10. Web3.0決済サービス */}
      <Section labelledBy="web3-heading">
        <SectionHeading
          id="web3-heading"
          eyebrow="WEB3"
          title={dictionary.sections.web3}
          accent="magenta"
          action={
            <LinkButton href={routes.web3(locale)} variant="ghost">
              {dictionary.common.more} →
            </LinkButton>
          }
        />
        <Web3Grid locale={locale} dictionary={dictionary} limit={3} />
        <div className="mt-5">
          <Notice tone="danger">{dictionary.legal.cryptoRisk}</Notice>
        </div>
      </Section>

      {/* 11. 暗号資産関連カード */}
      {cryptoCards.length > 0 ? (
        <Section labelledBy="crypto-heading">
          <SectionHeading
            id="crypto-heading"
            eyebrow="CRYPTO CARDS"
            title={dictionary.sections.cryptoCards}
            accent="magenta"
          />
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cryptoCards.map((card, index) => (
              <Reveal as="li" key={card.id} delayIndex={index}>
                <CardTile card={card} locale={locale} dictionary={dictionary} placement="web3" />
              </Reveal>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* 12. 法人カード比較 */}
      <Section labelledBy="business-heading">
        <SectionHeading
          id="business-heading"
          eyebrow="BUSINESS"
          title={dictionary.sections.business}
          accent="cyan"
          action={
            <LinkButton href={routes.business(locale)} variant="ghost">
              {dictionary.common.more} →
            </LinkButton>
          }
        />
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {businessCards.slice(0, 3).map((card, index) => (
            <Reveal as="li" key={card.id} delayIndex={index}>
              <CardTile card={card} locale={locale} dictionary={dictionary} placement="business" />
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* 13. ポイント・マイルシミュレーター */}
      <Section labelledBy="simulator-heading">
        <SectionHeading
          id="simulator-heading"
          eyebrow="SIMULATOR"
          title={dictionary.sections.simulator}
          accent="emerald"
          action={
            <LinkButton href={routes.simulatorIndex(locale)} variant="ghost">
              {dictionary.common.more} →
            </LinkButton>
          }
        />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {simulators.slice(0, 5).map((simulator, index) => (
            <Reveal as="li" key={simulator.id} delayIndex={index}>
              <Link href={routes.simulator(locale, simulator.slug)} className="block h-full">
                <Panel className="hover:border-emerald/40 h-full p-4 transition-colors">
                  <Badge accent={simulator.accent}>SIM</Badge>
                  <h3 className="text-ink mt-2.5 text-[0.84rem] leading-snug font-semibold">
                    {pick(simulator.title, locale)}
                  </h3>
                </Panel>
              </Link>
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* 14. YouTube最新動画 */}
      <Section labelledBy="videos-heading">
        <SectionHeading
          id="videos-heading"
          eyebrow="VIDEO"
          title={dictionary.sections.videos}
          accent="magenta"
          action={
            <LinkButton href={routes.videos(locale)} variant="ghost">
              {dictionary.common.more} →
            </LinkButton>
          }
        />
        <VideoGrid videos={getVideos({ limit: 3 })} locale={locale} />
      </Section>

      {/* 15. おすすめ決済ツール */}
      <Section labelledBy="tools-heading">
        <SectionHeading
          id="tools-heading"
          eyebrow="TOOLS"
          title={dictionary.sections.tools}
          accent="electric"
          action={
            <LinkButton href={routes.tools(locale)} variant="ghost">
              {dictionary.common.more} →
            </LinkButton>
          }
        />
        <ToolGrid tools={[...getVisibleTools()]} locale={locale} dictionary={dictionary} />
      </Section>

      {/* 16. 人気記事 ＋ 17. 急上昇コンテンツ */}
      <Section labelledBy="popular-heading">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading
              id="popular-heading"
              eyebrow="POPULAR"
              title={dictionary.sections.popular}
              accent="gold"
            />
            <ol className="space-y-2">
              {getNews(5).map((article, index) => (
                <li key={article.id}>
                  <Link
                    href={routes.newsArticle(locale, article.slug)}
                    className="glass hover:border-cyan/40 flex items-start gap-3 rounded-xl px-4 py-3 transition-colors"
                  >
                    <span className="numeric text-gold shrink-0 text-[0.95rem] font-bold">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-mist text-[0.8rem] leading-snug">
                      {pick(article.title, locale)}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <SectionHeading
              eyebrow="TRENDING"
              title={dictionary.sections.trending}
              accent="magenta"
            />
            <ol className="space-y-2">
              {getVideos({ limit: 5 }).map((video, index) => (
                <li key={video.id}>
                  <Link
                    href={routes.video(locale, video.slug)}
                    className="glass hover:border-magenta/40 flex items-start gap-3 rounded-xl px-4 py-3 transition-colors"
                  >
                    <span className="numeric text-magenta shrink-0 text-[0.95rem] font-bold">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-mist text-[0.8rem] leading-snug">
                      {pick(video.title, locale)}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      {/* 18. 初心者向けカード講座 */}
      <Section labelledBy="guides-heading">
        <SectionHeading
          id="guides-heading"
          eyebrow="LEARN"
          title={dictionary.sections.beginner}
          accent="emerald"
          action={
            <LinkButton href={routes.guides(locale)} variant="ghost">
              {dictionary.common.more} →
            </LinkButton>
          }
        />
        <GuideList locale={locale} dictionary={dictionary} />
      </Section>

      {/* 19. AIチャットボット */}
      <Section labelledBy="chat-heading">
        <SectionHeading
          id="chat-heading"
          eyebrow="CONCIERGE"
          title={dictionary.sections.chatbot}
          lead={dictionary.chat.subtitle}
          accent="cyan"
        />
        <div className="mx-auto max-w-2xl">
          <Concierge locale={locale} dictionary={dictionary} variant="inline" />
        </div>
      </Section>

      {/* 20. メルマガ・LINE・SNS登録 */}
      <Section>
        <SubscribeBox locale={locale} dictionary={dictionary} />
      </Section>

      {/* 21. FAQ */}
      <Section labelledBy="faq-heading">
        <SectionHeading
          id="faq-heading"
          eyebrow="FAQ"
          title={dictionary.sections.faq}
          accent="violet"
          action={
            <LinkButton href={routes.faq(locale)} variant="ghost">
              {dictionary.common.more} →
            </LinkButton>
          }
        />
        <FaqList items={siteFaqs} locale={locale} />
      </Section>

      <JsonLd
        data={[
          faqJsonLd(siteFaqs, locale),
          itemListJsonLd(
            overall.map((entry) => ({
              name: pick(entry.card.name, locale),
              path: routes.card(locale, entry.card.slug),
            })),
            dictionary.sections.ranking,
          ),
        ]}
      />
    </>
  );
}

const financialToolsById = new Map(financialTools.map((tool) => [tool.id, tool]));

/** トップに出すツールは3件に絞ります（読み込み量を抑えるため） */
function getVisibleTools() {
  // 用途の異なる3つを選び、カテゴリの幅が伝わるようにします
  const ids = ["tool-kakei", "tool-expensecore", "tool-vaultpass"];
  return ids
    .map((id) => financialToolsById.get(id))
    .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool));
}
