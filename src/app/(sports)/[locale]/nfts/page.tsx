import type { Metadata } from "next";

import { findLocale, getDictionary, localeCodes } from "@/sports/i18n";
import { resolveLocale } from "@/sports/lib/page";
import { sportsMetadata } from "@/sports/lib/seo";
import { nftCollections } from "@/sports/data/web3";
import { getSport } from "@/sports/data/sports";
import { faqsFor } from "@/sports/data/content";

import {
  Badge,
  Breadcrumbs,
  FaqList,
  JsonLd,
  OutboundLink,
  SectionHeading,
} from "@/sports/components/ui/primitives";
import { breadcrumbJsonLd, faqJsonLd } from "@/sports/lib/structured-data";

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
    path: "/nfts",
    title: dict.sectionNfts,
    description:
      info.code === "ja"
        ? "スポーツNFTの種類と、購入前に確認すべき点。映像の著作権が移転するわけではない点を含めて説明します。"
        : "Types of sports NFT and what to check first — including the fact that you are not buying the footage's copyright.",
  });
}

export default async function NftsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, dict, t } = await resolveLocale(params);

  const faqs = faqsFor("web3");
  const trail = [
    { label: "HOME", path: "/" },
    { label: dict.navWeb3, path: "/web3" },
    { label: dict.sectionNfts, path: "/nfts" },
  ];

  return (
    <>
      <Breadcrumbs locale={locale} trail={trail} />

      <header className="mb-8">
        <p className="sp-eyebrow mb-2">NFT</p>
        <h1 className="text-ink text-3xl font-extrabold sm:text-4xl">{dict.sectionNfts}</h1>
        <p className="text-ink-dim mt-3 max-w-3xl text-sm leading-relaxed">
          {locale === "ja"
            ? "デジタルコレクション、トレーディングカード、来場記念の半券など。所有履歴はチェーン上に残りますが、映像や写真の著作権が移転するわけではありません。"
            : "Collectibles, trading cards and attendance stubs. Ownership is recorded on-chain — copyright in the footage is not transferred."}
        </p>
      </header>

      <p className="border-caution/40 bg-caution/10 text-caution mb-10 rounded-xl border p-4 text-sm leading-relaxed">
        {dict.web3Risk}
      </p>

      <section aria-labelledby="nft-list" className="mb-12">
        <SectionHeading id="nft-list" eyebrow="COLLECTIONS" title={dict.sectionNfts} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {nftCollections.map((collection) => {
            const sport = getSport(collection.sportId);
            return (
              <article key={collection.id} className="sp-solid sp-tilt flex h-full flex-col p-4">
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  {sport ? (
                    <span className="sp-mono text-[0.625rem]" style={{ color: sport.accent }}>
                      {sport.glyph} {t(sport.name)}
                    </span>
                  ) : null}
                  <Badge>{collection.chain}</Badge>
                </div>
                <h3 className="text-ink text-sm font-semibold">{collection.name}</h3>
                <p className="text-ink-dim mt-1.5 flex-1 text-xs">{t(collection.summary)}</p>
                <p className="sp-mono text-ink-faint mt-3 text-[0.625rem]">
                  {collection.marketplace} · {dict.verifiedAt} {collection.verifiedAt}
                </p>
                <div className="mt-3">
                  <OutboundLink
                    url={collection.officialUrl}
                    locale={locale}
                    className="border-edge text-ink-soft hover:border-cyan/60 hover:text-cyan border text-xs"
                  >
                    {dict.ctaOfficialSite}
                  </OutboundLink>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="nft-check" className="mb-12">
        <SectionHeading
          id="nft-check"
          eyebrow="CHECKLIST"
          title={locale === "ja" ? "購入前に確認する5項目" : "Five checks before buying"}
        />
        <ol className="sp-solid divide-edge divide-y">
          {(locale === "ja"
            ? [
                "発行元は誰か（クラブ公認か、第三者か）",
                "どのチェーンか（手数料・移転のしやすさが変わります）",
                "二次流通は可能か、手数料はいくらか",
                "何の権利が付くのか（多くの場合、著作権は移転しません）",
                "サービス終了時に何が残るのか",
              ]
            : [
                "Who issued it — is it club-sanctioned?",
                "Which chain (fees and portability differ)",
                "Whether there is a secondary market, and at what fee",
                "What rights come with it (usually not copyright)",
                "What survives if the service closes",
              ]
          ).map((item, index) => (
            <li key={index} className="text-ink-soft flex gap-3 px-4 py-3 text-sm">
              <span className="sp-mono text-cyan shrink-0">{index + 1}</span>
              {item}
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="nft-faq">
        <SectionHeading id="nft-faq" eyebrow="FAQ" title={dict.sectionFaq} />
        <FaqList items={faqs} locale={locale} t={t} />
      </section>

      <JsonLd
        data={[
          breadcrumbJsonLd(locale, trail),
          faqJsonLd(faqs.map((faq) => ({ question: t(faq.question), answer: t(faq.answer) }))),
        ]}
      />
    </>
  );
}
