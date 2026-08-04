/**
 * トップページと各一覧ページで共有するセクション部品。
 *
 * すべてサーバーコンポーネントです（状態を持つのは診断・比較・チャットだけ）。
 * クライアントJSを増やさないことが、装飾を足しても速度目標を守れる理由です。
 */
import Link from "next/link";

import { cardCategories } from "@/cardport/data/categories";
import { featureCollections } from "@/cardport/data/features";
import { financialTools } from "@/cardport/data/tools";
import { guides } from "@/cardport/data/guides";
import { paymentServices } from "@/cardport/data/payments";
import { web3Services } from "@/cardport/data/web3";
import { formatDuration } from "@/cardport/data/videos";
import { getAuthor } from "@/cardport/data/authors";
import type {
  Faq,
  FinancialTool,
  Guide,
  NewsArticle,
  Video,
  Web3Service,
} from "@/cardport/data/types";
import type { Dictionary } from "@/cardport/i18n";
import { formatDate } from "@/cardport/i18n/format";
import { pick, pickList } from "@/cardport/i18n/localized";
import type { Locale } from "@/cardport/i18n/locales";
import { routes } from "@/cardport/lib/routes";
import { Badge, Notice, Panel, cx } from "@/cardport/components/ui/primitives";
import { Reveal } from "@/cardport/components/visual/Reveal";
import { FallbackVisual, MediaSlot } from "@/media/components";
import type { FallbackTheme } from "@/media/components";
import { pageKey } from "@/media/data/usages";

/* ------------------------------------------------------------------ */
/* 目的別特集                                                          */
/* ------------------------------------------------------------------ */
/** 特集カードの装飾帯。並んだときに単調にならないよう順に切り替えます */
const featureThemes: FallbackTheme[] = [
  "card",
  "point",
  "mile",
  "travel",
  "business",
  "security",
  "payment",
  "crypto",
];

export function FeatureGrid({ locale, limit }: { locale: Locale; limit?: number }) {
  const list = limit ? featureCollections.slice(0, limit) : featureCollections;
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {list.map((feature, index) => (
        <Reveal as="li" key={feature.id} delayIndex={index % 8}>
          <Link href={routes.feature(locale, feature.slug)} className="block h-full">
            <Panel
              glow
              className="hover:border-cp-cyan/40 flex h-full flex-col overflow-hidden transition-colors"
            >
              {/* 装飾帯。外部素材を使わないので権利上の懸念がありません */}
              <FallbackVisual
                theme={featureThemes[index % featureThemes.length]}
                seed={index}
                className="h-14 w-full"
              />
              <div className="p-4">
                <Badge accent={feature.accent}>{String(index + 1).padStart(2, "0")}</Badge>
                <h3 className="text-cp-ink mt-2.5 text-[0.9rem] font-semibold">
                  {pick(feature.title, locale)}
                </h3>
                <p className="text-cp-mist mt-1.5 line-clamp-2 text-[0.74rem] leading-relaxed">
                  {pick(feature.lead, locale)}
                </p>
              </div>
            </Panel>
          </Link>
        </Reveal>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* カテゴリ（ランキングの入口）                                        */
/* ------------------------------------------------------------------ */
export function CategoryChips({ locale, active }: { locale: Locale; active?: string }) {
  return (
    <ul className="hide-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {cardCategories.map((category) => (
        <li key={category.id} className="shrink-0">
          <Link
            href={routes.cardCategory(locale, category.id)}
            aria-current={active === category.id ? "page" : undefined}
            className={cx(
              "block rounded-full border px-3.5 py-1.5 text-[0.76rem] transition-colors",
              active === category.id
                ? "border-cp-cyan/60 bg-cp-cyan/15 text-cp-cyan"
                : "border-cp-line text-cp-mist hover:border-cp-cyan/40 hover:text-cp-ink",
            )}
          >
            {pick(category.title, locale)}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* ニュース                                                            */
/* ------------------------------------------------------------------ */
const kindLabels: Record<NewsArticle["kind"], { ja: string; en: string }> = {
  official: { ja: "公式発表", en: "Official" },
  press: { ja: "報道", en: "Press" },
  campaign: { ja: "キャンペーン", en: "Campaign" },
  editorial: { ja: "編集部解説", en: "Editorial" },
  comparison: { ja: "比較記事", en: "Comparison" },
  sponsored: { ja: "広告記事", en: "Sponsored" },
};

/** 記事の性格から、画像が無いときの装飾テーマを決めます */
const newsThemes: Record<NewsArticle["kind"], FallbackTheme> = {
  official: "news",
  press: "news",
  campaign: "point",
  editorial: "guide",
  comparison: "card",
  sponsored: "payment",
};

export function NewsCard({
  article,
  locale,
  dictionary,
  index = 0,
}: {
  article: NewsArticle;
  locale: Locale;
  dictionary: Dictionary;
  /** 同じテーマのカードが並んだときに、装飾の見た目を変えるための番号 */
  index?: number;
}) {
  const author = getAuthor(article.authorId);
  return (
    <Panel
      as="article"
      className="hover:border-cp-cyan/40 flex h-full flex-col overflow-hidden transition-colors"
    >
      {/*
        ライセンス確認済みの画像があれば表示し、無ければ装飾に落とします。
        分岐は MediaSlot の中だけにあります（呼び出し側で画像を選ばせません）。
      */}
      <MediaSlot
        pageKey={pageKey("cardport", "news", article.slug)}
        slot="thumbnail"
        locale={locale}
        theme={newsThemes[article.kind]}
        seed={index}
        showCaption={false}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="aspect-[16/9] w-full"
      />

      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* 記事の性格を必ず出します。誰の言葉かを読者が判断できるようにするためです */}
          <Badge accent={article.kind === "sponsored" ? "gold" : article.accent}>
            {locale === "ja" ? kindLabels[article.kind].ja : kindLabels[article.kind].en}
          </Badge>
          <span className="text-cp-dim numeric text-[0.68rem]">
            {formatDate(article.publishedAt, locale)}
          </span>
          <span className="text-cp-dim text-[0.68rem]">
            {article.readingMinutes} {dictionary.common.readingTime}
          </span>
        </div>

        <h3 className="mt-2.5 text-[0.92rem] leading-snug font-semibold">
          <Link
            href={routes.newsArticle(locale, article.slug)}
            className="hover:text-cp-cyan transition-colors"
          >
            {pick(article.title, locale)}
          </Link>
        </h3>
        <p className="text-cp-mist mt-2 line-clamp-3 text-[0.78rem] leading-relaxed">
          {pick(article.summary, locale)}
        </p>

        <p className="text-cp-dim mt-auto pt-3 text-[0.68rem]">
          {dictionary.common.source}: {pick(article.sourceName, locale)}
          {author ? ` / ${dictionary.common.author}: ${pick(author.name, locale)}` : ""}
        </p>
      </div>
    </Panel>
  );
}

export function NewsGrid({
  articles,
  locale,
  dictionary,
}: {
  articles: NewsArticle[];
  locale: Locale;
  dictionary: Dictionary;
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article, index) => (
        <Reveal as="li" key={article.id} delayIndex={index % 6}>
          <NewsCard article={article} locale={locale} dictionary={dictionary} index={index} />
        </Reveal>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* 動画                                                                */
/* ------------------------------------------------------------------ */
export function VideoGrid({ videos, locale }: { videos: Video[]; locale: Locale }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((video, index) => (
        <Reveal as="li" key={video.id} delayIndex={index % 6}>
          <Link href={routes.video(locale, video.slug)} className="block h-full">
            <Panel
              glow
              className="hover:border-cp-magenta/40 h-full overflow-hidden transition-colors"
            >
              {/*
                サムネイル。
                YouTube の画像を直接読み込む（ホットリンク）ことはしません。
                ライセンス確認済みの画像が割り当てられていればそれを、
                無ければ装飾を出します。
              */}
              <div className="relative aspect-video">
                <div className="absolute inset-0">
                  <MediaSlot
                    pageKey={pageKey("cardport", "video", video.slug)}
                    slot="thumbnail"
                    locale={locale}
                    theme="video"
                    seed={index}
                    showCaption={false}
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="h-full w-full"
                  />
                </div>
                <span className="pointer-events-none absolute inset-0 grid place-items-center">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-white/15 backdrop-blur">
                    <svg viewBox="0 0 16 16" className="h-4 w-4 text-white" aria-hidden="true">
                      <path d="M5 3.5v9l8-4.5z" fill="currentColor" />
                    </svg>
                  </span>
                </span>
                {/* 再生時間は上辺に置きます。下辺は画像のクレジット表示に使うためです */}
                <span className="numeric absolute top-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[0.66rem] text-white">
                  {formatDuration(video.durationSeconds)}
                </span>
                {video.isShort ? (
                  <span className="bg-cp-magenta/90 absolute top-2 left-2 rounded px-1.5 py-0.5 text-[0.62rem] font-semibold text-white">
                    SHORTS
                  </span>
                ) : null}
              </div>
              <div className="p-4">
                <h3 className="text-cp-ink text-[0.88rem] leading-snug font-semibold">
                  {pick(video.title, locale)}
                </h3>
                <p className="text-cp-mist mt-1.5 line-clamp-2 text-[0.74rem]">
                  {pick(video.description, locale)}
                </p>
                <p className="text-cp-dim numeric mt-2 text-[0.68rem]">
                  {formatDate(video.publishedAt, locale)}
                </p>
              </div>
            </Panel>
          </Link>
        </Reveal>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* 金融ツール                                                          */
/* ------------------------------------------------------------------ */
export function ToolGrid({
  tools = financialTools,
  locale,
  dictionary,
}: {
  tools?: FinancialTool[];
  locale: Locale;
  dictionary: Dictionary;
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool, index) => (
        <Reveal as="li" key={tool.id} delayIndex={index % 6}>
          <Panel className="flex h-full flex-col p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-cp-ink text-[0.9rem] font-semibold">{pick(tool.name, locale)}</h3>
              {tool.freePlan ? <Badge accent="emerald">{dictionary.common.free}</Badge> : null}
            </div>
            <p className="text-cp-mist mt-2 text-[0.76rem] leading-relaxed">
              {pick(tool.summary, locale)}
            </p>
            <dl className="text-cp-dim mt-3 space-y-1 text-[0.7rem]">
              <div className="flex gap-2">
                <dt className="w-16 shrink-0">料金</dt>
                <dd className="text-cp-mist">{pick(tool.pricing, locale)}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-16 shrink-0">対応</dt>
                <dd className="text-cp-mist">{tool.platforms.join(" / ")}</dd>
              </div>
              {tool.integrations.length > 0 ? (
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0">連携</dt>
                  <dd className="text-cp-mist">{tool.integrations.join(" / ")}</dd>
                </div>
              ) : null}
            </dl>
            <a
              href={tool.officialUrl}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="text-cp-cyan mt-auto pt-4 text-[0.76rem] hover:underline"
            >
              {dictionary.card.official} →
            </a>
          </Panel>
        </Reveal>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* キャッシュレス決済                                                  */
/* ------------------------------------------------------------------ */
export function PaymentGrid({ locale, dictionary }: { locale: Locale; dictionary: Dictionary }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {paymentServices.map((service, index) => (
        <Reveal as="li" key={service.id} delayIndex={index % 6}>
          <Panel className="flex h-full flex-col p-4">
            <h3 className="text-cp-ink text-[0.9rem] font-semibold">
              {pick(service.name, locale)}
            </h3>
            <p className="text-cp-mist mt-2 text-[0.76rem] leading-relaxed">
              {pick(service.summary, locale)}
            </p>
            <p className="text-cp-dim mt-3 text-[0.72rem]">
              {dictionary.card.baseRate}:{" "}
              <span className="numeric text-cp-cyan">{service.baseRate}%</span>
            </p>
            <div className="mt-3">
              <p className="text-cp-dim mb-1 text-[0.7rem]">{dictionary.card.cons}</p>
              <ul className="text-cp-mist space-y-0.5 text-[0.72rem]">
                {pickList(service.cons, locale).map((line) => (
                  <li key={line}>・{line}</li>
                ))}
              </ul>
            </div>
          </Panel>
        </Reveal>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Web3.0                                                              */
/* ------------------------------------------------------------------ */
export function Web3Grid({
  services = web3Services,
  locale,
  dictionary,
  limit,
}: {
  services?: Web3Service[];
  locale: Locale;
  dictionary: Dictionary;
  limit?: number;
}) {
  const list = limit ? services.slice(0, limit) : services;
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((service, index) => (
        <Reveal as="li" key={service.id} delayIndex={index % 6}>
          <Panel glow className="flex h-full flex-col p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge accent="magenta">{service.category}</Badge>
              <span className="text-cp-dim text-[0.68rem]">{service.regions.join(" / ")}</span>
            </div>
            <h3 className="text-cp-ink mt-2.5 text-[0.9rem] font-semibold">
              <Link
                href={routes.web3Service(locale, service.slug)}
                className="hover:text-cp-magenta transition-colors"
              >
                {pick(service.name, locale)}
              </Link>
            </h3>
            <p className="text-cp-mist mt-2 line-clamp-3 text-[0.76rem] leading-relaxed">
              {pick(service.summary, locale)}
            </p>
            {/* リスクは折り畳まず、カード上で必ず1件は見えるようにします */}
            <p className="border-cp-danger/40 bg-cp-danger/8 text-cp-danger mt-3 rounded-lg border px-2.5 py-2 text-[0.7rem] leading-snug">
              {pickList(service.risks, locale)[0]}
            </p>
            <Link
              href={routes.web3Service(locale, service.slug)}
              className="text-cp-cyan mt-auto pt-3 text-[0.76rem] hover:underline"
            >
              {dictionary.card.detail} →
            </Link>
          </Panel>
        </Reveal>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* ガイド                                                              */
/* ------------------------------------------------------------------ */
export function GuideList({
  items = guides,
  locale,
  dictionary,
}: {
  items?: Guide[];
  locale: Locale;
  dictionary: Dictionary;
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((guide, index) => (
        <Reveal as="li" key={guide.id} delayIndex={index % 6}>
          <Link href={routes.guide(locale, guide.slug)} className="block h-full">
            <Panel className="hover:border-cp-cyan/40 h-full overflow-hidden transition-colors">
              {/*
                ここは帯状の装飾枠です。写真は入れません。
                高さを詰めた枠に写真を入れると、クレジット表示まで切れてしまうためです。
                ガイドの図版は本文中（WikimediaFigure）に置きます。
              */}
              <FallbackVisual theme="guide" seed={index} className="h-16 w-full" />
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <Badge accent="emerald">{guide.level}</Badge>
                  <span className="text-cp-dim text-[0.68rem]">
                    {guide.readingMinutes} {dictionary.common.readingTime}
                  </span>
                </div>
                <h3 className="text-cp-ink mt-2.5 text-[0.88rem] font-semibold">
                  {pick(guide.title, locale)}
                </h3>
                <p className="text-cp-mist mt-1.5 line-clamp-2 text-[0.74rem]">
                  {pick(guide.lead, locale)}
                </p>
              </div>
            </Panel>
          </Link>
        </Reveal>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */
export function FaqList({ items, locale }: { items: Faq[]; locale: Locale }) {
  return (
    <ul className="space-y-2">
      {items.map((faq) => (
        <li key={faq.id}>
          {/* details/summary を使うことで、開閉のためのJSが不要になります */}
          <details className="glass group rounded-xl px-4 py-3">
            <summary className="text-cp-ink flex cursor-pointer items-center justify-between gap-3 text-[0.85rem] font-medium">
              {pick(faq.question, locale)}
              <span
                className="text-cp-cyan shrink-0 transition-transform group-open:rotate-45"
                aria-hidden="true"
              >
                +
              </span>
            </summary>
            <p className="text-cp-mist mt-3 text-[0.79rem] leading-relaxed">
              {pick(faq.answer, locale)}
            </p>
          </details>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* 購読導線                                                            */
/* ------------------------------------------------------------------ */
export function SubscribeBox({ locale, dictionary }: { locale: Locale; dictionary: Dictionary }) {
  void locale;
  return (
    <Panel glow className="p-6 sm:p-8">
      <div className="grid items-center gap-6 md:grid-cols-[1.2fr_1fr]">
        <div>
          <h2 className="text-cp-ink text-[1.2rem] font-semibold">
            {dictionary.sections.subscribe}
          </h2>
          <p className="text-cp-mist mt-2 text-[0.84rem] leading-relaxed">
            {dictionary.subscribe.lead}
          </p>
          <p className="text-cp-dim mt-3 text-[0.72rem]">{dictionary.subscribe.note}</p>
        </div>
        <div>
          {/* 配信システム未接続の間は、動かないフォームを出さずに状態を明示します */}
          <Notice>{dictionary.subscribe.unavailable}</Notice>
        </div>
      </div>
    </Panel>
  );
}
