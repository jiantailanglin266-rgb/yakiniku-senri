import type { Metadata } from "next";
import Link from "next/link";

import { findLocale, getDictionary, localeCodes } from "@/sports/i18n";
import { resolveLocale } from "@/sports/lib/page";
import { sportsMetadata } from "@/sports/lib/seo";
import { href } from "@/sports/lib/url";
import { web3Services } from "@/sports/data/web3";
import { faqsFor } from "@/sports/data/content";

import { Web3Card } from "@/sports/components/cards/Cards";
import { Breadcrumbs, FaqList, JsonLd, SectionHeading } from "@/sports/components/ui/primitives";
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd } from "@/sports/lib/structured-data";

export function generateStaticParams() {
  return localeCodes.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const info = findLocale(locale);
  if (!info) return {};
  const dict = getDictionary(info.code);
  return sportsMetadata({
    locale: info.code,
    path: "/web3",
    title: dict.sectionWeb3,
    description:
      info.code === "ja"
        ? "ファントークン・NFT・ファンタジー・DAO・デジタルチケットなど。仕組みとリスクを説明し、購入や投資は推奨しません。"
        : "Fan tokens, NFTs, fantasy, DAOs and digital ticketing — how they work and what can go wrong. We recommend nothing.",
  });
}

const categoryLabel: Record<string, { ja: string; en: string }> = {
  "fan-token": { ja: "ファントークン", en: "Fan tokens" },
  nft: { ja: "スポーツNFT", en: "Sports NFTs" },
  "trading-card": { ja: "デジタルトレーディングカード", en: "Trading cards" },
  "blockchain-game": { ja: "ブロックチェーンゲーム", en: "Blockchain games" },
  fantasy: { ja: "ファンタジースポーツ", en: "Fantasy sports" },
  dao: { ja: "DAO", en: "DAOs" },
  metaverse: { ja: "スポーツメタバース", en: "Metaverse" },
  ticketing: { ja: "デジタルチケット", en: "Digital ticketing" },
  community: { ja: "スポーツコミュニティ", en: "Communities" },
  "athlete-support": { ja: "アスリート支援", en: "Athlete support" },
  membership: { ja: "トークン化された会員権", en: "Tokenised memberships" },
  sponsorship: { ja: "Web3.0スポンサーシップ", en: "Web3 sponsorship" },
  "data-market": { ja: "スポーツデータマーケット", en: "Data markets" },
};

export default async function Web3Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, dict, t } = await resolveLocale(params);

  const faqs = faqsFor("web3");
  const trail = [
    { label: "HOME", path: "/" },
    { label: dict.navWeb3, path: "/web3" },
  ];

  const categories = Array.from(new Set(web3Services.map((service) => service.category)));

  return (
    <>
      <Breadcrumbs locale={locale} trail={trail} />

      <header className="mb-8">
        <p className="sp-eyebrow mb-2">WEB3</p>
        <h1 className="text-ink text-3xl font-extrabold sm:text-4xl">{dict.sectionWeb3}</h1>
        <p className="text-ink-dim mt-3 max-w-3xl text-sm leading-relaxed">
          {locale === "ja"
            ? "「何ができるか」だけでなく「何が起きうるか」まで書きます。当サイトは購入・投資を推奨せず、価格の上昇を示唆する表現も使いません。"
            : "We describe what these services do and what can go wrong. We do not recommend buying and make no claims about prices."}
        </p>
      </header>

      <p className="border-caution/40 bg-caution/10 text-caution mb-10 rounded-xl border p-4 text-sm leading-relaxed">
        {dict.web3Risk}
      </p>

      <nav aria-label={dict.category} className="mb-10 flex flex-wrap gap-1.5">
        {categories.map((category) => (
          <a
            key={category}
            href={`#cat-${category}`}
            className="border-edge text-ink-dim hover:border-cyan/60 hover:text-cyan rounded-lg border px-3 py-1.5 text-xs transition-colors"
          >
            {t(categoryLabel[category])}
          </a>
        ))}
      </nav>

      {categories.map((category) => {
        const list = web3Services.filter((service) => service.category === category);
        return (
          <section
            key={category}
            id={`cat-${category}`}
            aria-labelledby={`w-${category}`}
            className="mb-12"
          >
            <SectionHeading
              id={`w-${category}`}
              eyebrow="CATEGORY"
              title={t(categoryLabel[category])}
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((service) => (
                <Web3Card key={service.id} service={service} locale={locale} />
              ))}
            </div>
          </section>
        );
      })}

      <section aria-labelledby="w-more" className="mb-12">
        <SectionHeading
          id="w-more"
          eyebrow="MORE"
          title={locale === "ja" ? "関連ページ" : "Related"}
        />
        <div className="flex flex-wrap gap-2">
          <Link
            href={href(locale, "/fan-tokens")}
            className="border-edge text-ink-soft hover:border-cyan/60 hover:text-cyan rounded-lg border px-4 py-2.5 text-sm transition-colors"
          >
            {dict.sectionFanTokens}
          </Link>
          <Link
            href={href(locale, "/nfts")}
            className="border-edge text-ink-soft hover:border-cyan/60 hover:text-cyan rounded-lg border px-4 py-2.5 text-sm transition-colors"
          >
            {dict.sectionNfts}
          </Link>
          <Link
            href={href(locale, "/diagnosis/web3-service")}
            className="border-edge text-ink-soft hover:border-magenta/60 hover:text-magenta rounded-lg border px-4 py-2.5 text-sm transition-colors"
          >
            {dict.sectionDiagnosis}
          </Link>
        </div>
      </section>

      <section aria-labelledby="w-faq">
        <SectionHeading id="w-faq" eyebrow="FAQ" title={dict.sectionFaq} />
        <FaqList items={faqs} locale={locale} t={t} />
      </section>

      <JsonLd
        data={[
          breadcrumbJsonLd(locale, trail),
          itemListJsonLd(
            locale,
            web3Services.map((service) => ({ name: service.name, path: `/web3/${service.slug}` })),
          ),
          faqJsonLd(faqs.map((faq) => ({ question: t(faq.question), answer: t(faq.answer) }))),
        ]}
      />
    </>
  );
}
