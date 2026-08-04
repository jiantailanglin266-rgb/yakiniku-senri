/**
 * `/[locale]/cards/[slug]`
 *
 * スラッグはカテゴリ（例: gold）かカード（例: nova-zero）のどちらかです。
 * 仕様どおり同じ階層に置くため、ここで振り分けます。
 * 両者のスラッグが衝突しないことは tests/cardport-data.test.ts で検証しています。
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AffiliateCta } from "@/cardport/components/cards/AffiliateCta";
import { CardTile } from "@/cardport/components/cards/CardTile";
import { CompareToggle } from "@/cardport/components/cards/CompareToggle";
import { CategoryChips, FaqList } from "@/cardport/components/home/sections";
import { PageShell } from "@/cardport/components/layout/PageShell";
import {
  Badge,
  JsonLd,
  Notice,
  Panel,
  ScoreBar,
  StatBlock,
} from "@/cardport/components/ui/primitives";
import { CardArt } from "@/cardport/components/visual/CardArt";
import { TiltCard } from "@/cardport/components/visual/TiltCard";
import { cards, getCardBySlug, getCardsByCategory } from "@/cardport/data/cards";
import { getCampaignsByCardId, isExpired } from "@/cardport/data/campaigns";
import { cardCategories, getCategory } from "@/cardport/data/categories";
import { getFaqs } from "@/cardport/data/faqs";
import { brandLabels, brandNotes, getIssuer } from "@/cardport/data/issuers";
import { getNewsByIds, news } from "@/cardport/data/news";
import { getAuthor } from "@/cardport/data/authors";
import { getDictionary } from "@/cardport/i18n";
import { formatAnnualFee, formatDate, formatYen } from "@/cardport/i18n/format";
import { pick, pickList } from "@/cardport/i18n/localized";
import { getContentLocales, isLocale, locales, type Locale } from "@/cardport/i18n/locales";
import { routes } from "@/cardport/lib/routes";
import { cardportMetadata } from "@/cardport/lib/seo";
import { axisLabels, computeScore, rankCards, scoreAxes } from "@/cardport/lib/scoring";
import { cardJsonLd, faqJsonLd, itemListJsonLd } from "@/cardport/lib/structured-data";

export function generateStaticParams() {
  // カテゴリページは件数が少ないので全言語で生成します。
  // カード詳細は件数が多いため、静的エクスポート時は主要言語に絞ります（locales.ts 参照）。
  return [
    ...locales.flatMap((locale) =>
      cardCategories.map((category) => ({ locale, slug: category.id })),
    ),
    ...getContentLocales().flatMap((locale) => cards.map((card) => ({ locale, slug: card.slug }))),
  ];
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) return {};
  const locale = raw as Locale;
  const dictionary = getDictionary(locale);

  const category = getCategory(slug);
  if (category) {
    return cardportMetadata({
      title: pick(category.title, locale),
      description: pick(category.lead, locale),
      path: routes.cardCategory(locale, category.id),
      locale,
    });
  }

  const card = getCardBySlug(slug);
  if (!card) return {};
  return cardportMetadata({
    title: `${pick(card.name, locale)} — ${dictionary.card.overview}`,
    description: pick(card.summary, locale),
    path: routes.card(locale, card.slug),
    locale,
    type: "article",
    modifiedTime: card.updatedOn,
    localeSet: getContentLocales(),
  });
}

export default async function CardOrCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dictionary = getDictionary(locale);

  const category = getCategory(slug);
  if (category) {
    const list = rankCards(getCardsByCategory(category.id), category.id);
    return (
      <PageShell
        breadcrumbLabel={dictionary.common.breadcrumb}
        crumbs={[
          { name: dictionary.nav.home, path: routes.home(locale) },
          { name: dictionary.nav.cards, path: routes.cards(locale) },
          { name: pick(category.title, locale), path: routes.cardCategory(locale, category.id) },
        ]}
        eyebrow="CATEGORY"
        title={pick(category.title, locale)}
        lead={pick(category.lead, locale)}
        notice={<Notice tone="warn">{dictionary.legal.verifyNotice}</Notice>}
      >
        <div className="mb-8">
          <CategoryChips locale={locale} active={category.id} />
        </div>

        {list.length === 0 ? (
          <Notice>{dictionary.common.noResults}</Notice>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((entry) => (
              <li key={entry.card.id}>
                <CardTile
                  card={entry.card}
                  locale={locale}
                  dictionary={dictionary}
                  rank={entry.rank}
                  placement="card-list"
                />
              </li>
            ))}
          </ul>
        )}

        <JsonLd
          data={itemListJsonLd(
            list.map((entry) => ({
              name: pick(entry.card.name, locale),
              path: routes.card(locale, entry.card.slug),
            })),
            pick(category.title, locale),
          )}
        />
      </PageShell>
    );
  }

  const card = getCardBySlug(slug);
  if (!card) notFound();

  const issuer = getIssuer(card.issuerId);
  const campaigns = getCampaignsByCardId(card.id);
  const activeCampaign = campaigns.find((entry) => !isExpired(entry));
  const score = computeScore(card);
  const author = getAuthor("editorial");
  const supervisor = getAuthor("supervisor-kanzaki");
  const relatedNews = getNewsByIds(
    news.filter((article) => article.relatedCardIds.includes(card.id)).map((article) => article.id),
  ).slice(0, 3);
  const alternatives = rankCards(
    cards.filter(
      (other) => other.id !== card.id && other.categories.some((c) => card.categories.includes(c)),
    ),
    "overall",
    3,
  );
  const cardFaqs = getFaqs("card");

  return (
    <PageShell
      breadcrumbLabel={dictionary.common.breadcrumb}
      crumbs={[
        { name: dictionary.nav.home, path: routes.home(locale) },
        { name: dictionary.nav.cards, path: routes.cards(locale) },
        { name: pick(card.name, locale), path: routes.card(locale, card.slug) },
      ]}
      eyebrow={issuer ? pick(issuer.name, locale) : undefined}
      title={pick(card.name, locale)}
      lead={pick(card.summary, locale)}
      meta={
        <p className="flex flex-wrap gap-x-4 gap-y-1">
          <span>
            {dictionary.common.verifiedAt}: {formatDate(card.verifiedOn, locale)}
          </span>
          <span>
            {dictionary.common.updatedAt}: {formatDate(card.updatedOn, locale)}
          </span>
          {author ? (
            <span>
              {dictionary.common.author}: {pick(author.name, locale)}
            </span>
          ) : null}
          {supervisor ? (
            <span>
              {dictionary.common.supervisor}: {pick(supervisor.name, locale)}
            </span>
          ) : null}
        </p>
      }
      notice={
        <div className="space-y-3">
          <Notice tone="warn">{dictionary.legal.verifyNotice}</Notice>
          {locale !== "ja" ? <Notice tone="danger">{dictionary.legal.regionNotice}</Notice> : null}
          {card.crypto ? <Notice tone="danger">{dictionary.legal.cryptoRisk}</Notice> : null}
        </div>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[22rem_1fr]">
        {/* 左：券面と主要数値、CTA */}
        <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="card3d-scene">
            <TiltCard maxTilt={12}>
              <CardArt card={card} locale={locale} />
            </TiltCard>
          </div>

          <Panel glow className="p-4">
            <dl className="grid grid-cols-2 gap-4">
              <StatBlock
                label={dictionary.card.annualFee}
                value={formatAnnualFee(card.annualFee, locale, dictionary.common.free)}
                accent="gold"
                note={card.feeWaiver ? pick(card.feeWaiver, locale) : undefined}
              />
              <StatBlock
                label={dictionary.card.baseRate}
                value={`${card.baseRate}%`}
                accent="cyan"
              />
              <StatBlock
                label={dictionary.card.maxRate}
                value={`${card.maxRate}%`}
                accent="emerald"
              />
              <StatBlock
                label={dictionary.card.score}
                value={score.toFixed(2)}
                accent="violet"
                note="/ 5.00"
              />
            </dl>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <AffiliateCta
                itemId={card.id}
                officialUrl={card.officialUrl}
                affiliateId={card.affiliateId}
                placement="card-detail"
                locale={locale}
                label={dictionary.card.official}
                adLabel={dictionary.affiliate.label}
                adTitle={dictionary.affiliate.disclosure}
              />
              <CompareToggle
                cardId={card.id}
                addLabel={dictionary.card.compare}
                removeLabel={dictionary.card.compareRemove}
              />
            </div>
          </Panel>

          <Panel className="p-4">
            <h2 className="mb-3 text-[0.85rem] font-semibold">{dictionary.card.score}</h2>
            <div className="space-y-2">
              {scoreAxes.map((axis) => (
                <ScoreBar
                  key={axis}
                  score={card.scores[axis]}
                  label={pick(axisLabels[axis], locale)}
                />
              ))}
            </div>
            <Link
              href={routes.policy(locale, "ranking-criteria")}
              className="text-dim hover:text-cyan mt-3 inline-block text-[0.7rem] underline"
            >
              {dictionary.footer.rankingCriteria}
            </Link>
          </Panel>
        </div>

        {/* 右：結論 → 概要 → メリット/デメリット → 詳細 → 比較 → FAQ */}
        <div className="space-y-8">
          <section aria-labelledby="conclusion">
            <h2 id="conclusion" className="mb-3 text-[1.05rem] font-semibold">
              {dictionary.card.conclusion}
            </h2>
            <Panel className="p-5">
              <p className="text-mist text-[0.9rem] leading-relaxed">
                {pick(card.summary, locale)}
              </p>
            </Panel>
          </section>

          {activeCampaign ? (
            <section aria-labelledby="campaign">
              <h2 id="campaign" className="mb-3 text-[1.05rem] font-semibold">
                {dictionary.card.campaign}
              </h2>
              <Panel className="border-amber/30 p-5">
                <p className="text-amber text-[0.92rem] font-semibold">
                  {pick(activeCampaign.title, locale)}
                </p>
                <p className="text-dim mt-1 text-[0.74rem]">
                  {pick(activeCampaign.target, locale)} / 〜
                  {formatDate(activeCampaign.endsOn, locale)}
                </p>
                {/* 条件は必ず全文出します。畳んで隠すと利用条件を隠した表示になります */}
                <ul className="text-mist mt-3 space-y-1.5 text-[0.8rem]">
                  {pickList(activeCampaign.conditions, locale).map((line) => (
                    <li key={line} className="flex gap-1.5">
                      <span className="text-dim">・</span>
                      {line}
                    </li>
                  ))}
                </ul>
              </Panel>
            </section>
          ) : null}

          <section aria-labelledby="proscons" className="grid gap-4 sm:grid-cols-2">
            <Panel className="p-5">
              <h2 id="proscons" className="text-emerald mb-3 text-[0.95rem] font-semibold">
                {dictionary.card.pros}
              </h2>
              <ul className="text-mist space-y-2 text-[0.82rem]">
                {pickList(card.pros, locale).map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="text-emerald">+</span>
                    {line}
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel className="p-5">
              <h2 className="text-danger mb-3 text-[0.95rem] font-semibold">
                {dictionary.card.cons}
              </h2>
              <ul className="text-mist space-y-2 text-[0.82rem]">
                {pickList(card.cons, locale).map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="text-danger">−</span>
                    {line}
                  </li>
                ))}
              </ul>
            </Panel>
          </section>

          <section aria-labelledby="specs">
            <h2 id="specs" className="mb-3 text-[1.05rem] font-semibold">
              {dictionary.card.overview}
            </h2>
            <Panel className="overflow-hidden">
              <dl className="divide-line/30 divide-y">
                {[
                  [dictionary.card.issuer, issuer ? pick(issuer.name, locale) : "—"],
                  [dictionary.card.rank, dictionary.rank[card.rank]],
                  [dictionary.card.brands, card.brands.map((b) => brandLabels[b]).join(" / ")],
                  [
                    dictionary.card.annualFee,
                    formatAnnualFee(card.annualFee, locale, dictionary.common.free),
                  ],
                  [
                    dictionary.card.annualFeeFirstYear,
                    formatAnnualFee(card.firstYearFee, locale, dictionary.common.free),
                  ],
                  [
                    dictionary.card.familyCardFee,
                    formatAnnualFee(card.familyCardFee, locale, dictionary.common.free),
                  ],
                  [
                    dictionary.card.etcFee,
                    formatAnnualFee(card.etcFee, locale, dictionary.common.free),
                  ],
                  [dictionary.card.baseRate, `${card.baseRate}%`],
                  [
                    dictionary.card.maxRate,
                    `${card.maxRate}%（${pick(card.maxRateCondition, locale)}）`,
                  ],
                  [dictionary.card.pointName, pick(card.pointName, locale)],
                  [dictionary.card.pointExpiry, pick(card.pointExpiry, locale)],
                  [
                    dictionary.card.mileTransfer,
                    card.mileRate > 0
                      ? `${pickList(card.mileTransfer, locale).join(" / ")}（1pt = ${card.mileRate}mile）`
                      : dictionary.common.no,
                  ],
                  [
                    dictionary.card.travelInsurance,
                    card.travelInsuranceOverseas.amount > 0
                      ? `${dictionary.card.overseas} ${formatYen(card.travelInsuranceOverseas.amount, locale)}（${card.travelInsuranceOverseas.condition === "auto" ? (locale === "ja" ? "自動付帯" : "automatic") : locale === "ja" ? "利用付帯" : "usage-based"}）`
                      : dictionary.common.no,
                  ],
                  [
                    dictionary.card.shoppingInsurance,
                    card.shoppingInsurance.amount > 0
                      ? formatYen(card.shoppingInsurance.amount, locale)
                      : dictionary.common.no,
                  ],
                  [
                    dictionary.card.lounge,
                    card.lounges.ja.length > 0
                      ? pickList(card.lounges, locale).join(" / ")
                      : dictionary.common.no,
                  ],
                  [
                    dictionary.card.touchPayment,
                    card.touchPayment ? dictionary.common.yes : dictionary.common.no,
                  ],
                  [
                    dictionary.card.mobilePayment,
                    card.mobilePayments.join(" / ") || dictionary.common.no,
                  ],
                  [
                    dictionary.card.electronicMoney,
                    card.electronicMoney.join(" / ") || dictionary.common.no,
                  ],
                  [
                    dictionary.card.issueSpeed,
                    card.issueDays === 0
                      ? locale === "ja"
                        ? "即時"
                        : "Instant"
                      : `${card.issueDays}${dictionary.card.days}`,
                  ],
                  [dictionary.card.overseas, `${card.fxFee}%`],
                  [dictionary.card.eligibility, pick(card.eligibilityNote, locale)],
                  [dictionary.card.limit, pick(card.limitNote, locale)],
                  ...(card.business
                    ? [
                        [
                          dictionary.card.accounting,
                          card.business.accountingIntegrations.join(" / "),
                        ] as [string, string],
                      ]
                    : []),
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[10rem_1fr] gap-3 px-5 py-3">
                    <dt className="text-dim text-[0.76rem]">{label}</dt>
                    <dd className="text-mist text-[0.82rem]">{value}</dd>
                  </div>
                ))}
              </dl>
            </Panel>

            <p className="text-dim mt-3 text-[0.72rem]">
              {card.brands
                .map((brand) => `${brandLabels[brand]}: ${pick(brandNotes[brand], locale)}`)
                .join(" / ")}
            </p>
          </section>

          <section aria-labelledby="notes">
            <h2 id="notes" className="mb-3 text-[1.05rem] font-semibold">
              {dictionary.card.notes}
            </h2>
            <Panel className="p-5">
              <ul className="text-mist space-y-2 text-[0.82rem]">
                {pickList(card.notes, locale).map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="text-amber">!</span>
                    {line}
                  </li>
                ))}
              </ul>
            </Panel>
          </section>

          <section aria-labelledby="whofor" className="grid gap-4 sm:grid-cols-2">
            <Panel className="p-5">
              <h2 id="whofor" className="text-cyan mb-3 text-[0.95rem] font-semibold">
                {dictionary.card.recommendedFor}
              </h2>
              <ul className="text-mist space-y-1.5 text-[0.82rem]">
                {pickList(card.recommendedFor, locale).map((line) => (
                  <li key={line}>・{line}</li>
                ))}
              </ul>
            </Panel>
            <Panel className="p-5">
              <h2 className="text-dim mb-3 text-[0.95rem] font-semibold">
                {dictionary.card.notRecommendedFor}
              </h2>
              <ul className="text-mist space-y-1.5 text-[0.82rem]">
                {pickList(card.notRecommendedFor, locale).map((line) => (
                  <li key={line}>・{line}</li>
                ))}
              </ul>
            </Panel>
          </section>

          {alternatives.length > 0 ? (
            <section aria-labelledby="alternatives">
              <h2 id="alternatives" className="mb-3 text-[1.05rem] font-semibold">
                {dictionary.card.vsOther}
              </h2>
              <ul className="grid gap-4 sm:grid-cols-3">
                {alternatives.map((entry) => (
                  <li key={entry.card.id}>
                    <CardTile card={entry.card} locale={locale} dictionary={dictionary} compact />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {relatedNews.length > 0 ? (
            <section aria-labelledby="related-news">
              <h2 id="related-news" className="mb-3 text-[1.05rem] font-semibold">
                {dictionary.sections.cardNews}
              </h2>
              <ul className="space-y-2">
                {relatedNews.map((article) => (
                  <li key={article.id}>
                    <Link
                      href={routes.newsArticle(locale, article.slug)}
                      className="glass hover:border-cyan/40 block rounded-xl px-4 py-3 transition-colors"
                    >
                      <span className="text-mist text-[0.82rem]">
                        {pick(article.title, locale)}
                      </span>
                      <span className="text-dim numeric ms-2 text-[0.7rem]">
                        {formatDate(article.publishedAt, locale)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="card-faq">
            <h2 id="card-faq" className="mb-3 text-[1.05rem] font-semibold">
              {dictionary.sections.faq}
            </h2>
            <FaqList items={cardFaqs} locale={locale} />
          </section>

          {/* 口コミは実データが無いため掲載しません（構造化データにも出しません） */}
          <section aria-labelledby="reviews">
            <h2 id="reviews" className="mb-3 text-[1.05rem] font-semibold">
              {dictionary.card.reviews}
            </h2>
            <Notice>
              {locale === "ja"
                ? "実際の利用者から集めた口コミがまだありません。評価点の集計（AggregateRating）も、実データがないため掲載していません。"
                : "We have no verified user reviews yet, so no ratings — and no aggregate rating markup — are shown."}
            </Notice>
          </section>

          <div className="flex flex-wrap gap-2">
            <Badge accent="cyan">{dictionary.card.detail}</Badge>
            {card.categories.map((categoryId) => {
              const item = getCategory(categoryId);
              if (!item) return null;
              return (
                <Link
                  key={categoryId}
                  href={routes.cardCategory(locale, categoryId)}
                  className="border-line text-mist hover:border-cyan/50 hover:text-ink rounded-full border px-3 py-1 text-[0.72rem] transition-colors"
                >
                  {pick(item.title, locale)}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <JsonLd data={[cardJsonLd(card, locale), faqJsonLd(cardFaqs, locale)]} />
    </PageShell>
  );
}
