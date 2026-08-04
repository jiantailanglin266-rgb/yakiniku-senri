import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageShell } from "@/cardport/components/layout/PageShell";
import { Badge, Notice, Panel } from "@/cardport/components/ui/primitives";
import { brandLabels } from "@/cardport/data/issuers";
import { getNewsByIds } from "@/cardport/data/news";
import { getVideosByIds } from "@/cardport/data/videos";
import { getWeb3Service, web3Services } from "@/cardport/data/web3";
import { getDictionary } from "@/cardport/i18n";
import { pick, pickList } from "@/cardport/i18n/localized";
import { getContentLocales, isLocale, type Locale } from "@/cardport/i18n/locales";
import { routes } from "@/cardport/lib/routes";
import { cardportMetadata } from "@/cardport/lib/seo";

export function generateStaticParams() {
  return getContentLocales().flatMap((locale) =>
    web3Services.map((service) => ({ locale, slug: service.slug })),
  );
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
  const service = getWeb3Service(slug);
  if (!service) return {};
  return cardportMetadata({
    title: pick(service.name, locale),
    description: pick(service.summary, locale),
    path: routes.web3Service(locale, service.slug),
    locale,
    localeSet: getContentLocales(),
  });
}

export default async function Web3ServicePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const service = getWeb3Service(slug);
  if (!service) notFound();

  const dictionary = getDictionary(locale);
  const relatedNews = getNewsByIds(service.relatedNewsIds);
  const relatedVideos = getVideosByIds(service.relatedVideoIds);

  const rows: [string, string][] = [
    [locale === "ja" ? "カテゴリ" : "Category", service.category],
    [locale === "ja" ? "対応国・地域" : "Regions", service.regions.join(" / ") || "—"],
    [locale === "ja" ? "対応通貨" : "Fiat currencies", service.fiatCurrencies.join(" / ") || "—"],
    [locale === "ja" ? "対応暗号資産" : "Crypto assets", service.cryptoAssets.join(" / ") || "—"],
    [
      locale === "ja" ? "カードブランド" : "Card networks",
      service.cardBrands.map((brand) => brandLabels[brand]).join(" / ") || "—",
    ],
    [locale === "ja" ? "利用料金" : "Monthly fee", pick(service.fees.monthly, locale)],
    [locale === "ja" ? "発行手数料" : "Issuing fee", pick(service.fees.issuing, locale)],
    [locale === "ja" ? "為替手数料" : "FX fee", pick(service.fees.fx, locale)],
    [locale === "ja" ? "本人確認" : "KYC", pick(service.kyc, locale)],
    [locale === "ja" ? "対応言語" : "Languages", service.languages.join(" / ")],
    [
      locale === "ja" ? "アプリ" : "App",
      service.hasApp ? dictionary.common.yes : dictionary.common.no,
    ],
    [locale === "ja" ? "還元特典" : "Rewards", pick(service.rewards, locale)],
  ];

  return (
    <PageShell
      breadcrumbLabel={dictionary.common.breadcrumb}
      crumbs={[
        { name: dictionary.nav.home, path: routes.home(locale) },
        { name: dictionary.nav.web3, path: routes.web3(locale) },
        { name: pick(service.name, locale), path: routes.web3Service(locale, service.slug) },
      ]}
      eyebrow="WEB3 SERVICE"
      title={pick(service.name, locale)}
      lead={pick(service.summary, locale)}
      notice={
        <div className="space-y-3">
          <Notice tone="danger">{dictionary.legal.cryptoRisk}</Notice>
          {/* 規制・地域制限は必ず個別に表示します */}
          <Notice tone="warn">{pick(service.regulatoryNote, locale)}</Notice>
        </div>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-8">
          <section aria-labelledby="spec">
            <h2 id="spec" className="mb-3 text-[1.05rem] font-semibold">
              {locale === "ja" ? "サービス概要" : "Service details"}
            </h2>
            <Panel className="overflow-hidden">
              <dl className="divide-line/30 divide-y">
                {rows.map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[10rem_1fr] gap-3 px-5 py-3">
                    <dt className="text-dim text-[0.76rem]">{label}</dt>
                    <dd className="text-mist text-[0.82rem]">{value}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
          </section>

          <section aria-labelledby="pros" className="grid gap-4 sm:grid-cols-2">
            <Panel className="p-5">
              <h2 id="pros" className="text-emerald mb-3 text-[0.95rem] font-semibold">
                {dictionary.card.pros}
              </h2>
              <ul className="text-mist space-y-2 text-[0.82rem]">
                {pickList(service.pros, locale).map((line) => (
                  <li key={line}>・{line}</li>
                ))}
              </ul>
            </Panel>
            <Panel className="border-danger/30 p-5">
              <h2 className="text-danger mb-3 text-[0.95rem] font-semibold">
                {locale === "ja" ? "リスク" : "Risks"}
              </h2>
              <ul className="text-mist space-y-2 text-[0.82rem]">
                {pickList(service.risks, locale).map((line) => (
                  <li key={line}>・{line}</li>
                ))}
              </ul>
            </Panel>
          </section>

          <a
            href={service.officialUrl}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="glass text-ink hover:border-magenta/60 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[0.82rem] transition-colors"
          >
            {dictionary.card.official} ↗
          </a>
        </div>

        <aside className="space-y-5">
          {relatedNews.length > 0 ? (
            <Panel className="p-4">
              <h2 className="text-ink mb-2 text-[0.84rem] font-semibold">{dictionary.nav.news}</h2>
              <ul className="space-y-1.5">
                {relatedNews.map((article) => (
                  <li key={article.id}>
                    <Link
                      href={routes.newsArticle(locale, article.slug)}
                      className="text-mist hover:text-cyan text-[0.78rem]"
                    >
                      {pick(article.title, locale)}
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          {relatedVideos.length > 0 ? (
            <Panel className="p-4">
              <h2 className="text-ink mb-2 text-[0.84rem] font-semibold">
                {dictionary.nav.videos}
              </h2>
              <ul className="space-y-1.5">
                {relatedVideos.map((video) => (
                  <li key={video.id}>
                    <Link
                      href={routes.video(locale, video.slug)}
                      className="text-mist hover:text-magenta text-[0.78rem]"
                    >
                      {pick(video.title, locale)}
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          <Panel className="p-4">
            <h2 className="text-ink mb-2 text-[0.84rem] font-semibold">
              {dictionary.nav.diagnosis}
            </h2>
            <Link
              href={routes.diagnosis(locale, "web3-payment")}
              className="text-cyan text-[0.78rem] hover:underline"
            >
              {locale === "ja" ? "Web3.0決済サービス診断" : "Web3 payment finder"} →
            </Link>
          </Panel>

          <div className="flex flex-wrap gap-1.5">
            <Badge accent="magenta">{service.category}</Badge>
            {service.cryptoAssets.map((asset) => (
              <Badge key={asset} accent="violet">
                {asset}
              </Badge>
            ))}
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
