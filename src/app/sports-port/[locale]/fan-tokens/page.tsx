import type { Metadata } from "next";
import Link from "next/link";

import { findLocale, getDictionary, localeCodes } from "@/sports/i18n";
import { resolveLocale } from "@/sports/lib/page";
import { sportsMetadata } from "@/sports/lib/seo";
import { href } from "@/sports/lib/url";
import { fanTokens } from "@/sports/data/web3";
import { getTeam } from "@/sports/data/teams";
import { getSport } from "@/sports/data/sports";
import { faqsFor } from "@/sports/data/content";

import {
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
    path: "/fan-tokens",
    title: dict.sectionFanTokens,
    description:
      info.code === "ja"
        ? "ファントークンの仕組み・用途・リスクを整理します。株式や出資ではありません。当サイトは購入を推奨しません。"
        : "What fan tokens are, what they do and what can go wrong. They are not equity, and we do not recommend buying.",
  });
}

export default async function FanTokensPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, dict, t } = await resolveLocale(params);

  const faqs = faqsFor("web3");
  const trail = [
    { label: "HOME", path: "/" },
    { label: dict.navWeb3, path: "/web3" },
    { label: dict.sectionFanTokens, path: "/fan-tokens" },
  ];

  return (
    <>
      <Breadcrumbs locale={locale} trail={trail} />

      <header className="mb-8">
        <p className="sp-eyebrow mb-2">FAN TOKENS</p>
        <h1 className="text-ink text-3xl font-extrabold sm:text-4xl">{dict.sectionFanTokens}</h1>
        <p className="text-ink-dim mt-3 max-w-3xl text-sm leading-relaxed">
          {locale === "ja"
            ? "ファントークンは、クラブが発行し投票参加権や特典へのアクセスを伴うトークンです。株式でも出資でもなく、クラブの資産に対する権利は生じません。"
            : "A fan token is a club-issued token granting voting participation and perks. It is not equity and gives you no claim on the club."}
        </p>
      </header>

      <p className="border-caution/40 bg-caution/10 text-caution mb-10 rounded-xl border p-4 text-sm leading-relaxed">
        {dict.web3Risk}
      </p>

      <section aria-labelledby="ft-list" className="mb-12">
        <SectionHeading id="ft-list" eyebrow="TOKENS" title={dict.sectionFanTokens} />
        <div className="sp-scroll-x border-edge rounded-xl border">
          <table className="w-full min-w-[42rem] text-sm">
            <caption className="sr-only">{dict.sectionFanTokens}</caption>
            <thead>
              <tr className="border-edge text-ink-faint border-b text-[0.6875rem]">
                <th scope="col" className="px-3 py-3 text-left font-normal">
                  {locale === "ja" ? "シンボル" : "Symbol"}
                </th>
                <th scope="col" className="px-3 py-3 text-left font-normal">
                  {dict.team}
                </th>
                <th scope="col" className="px-3 py-3 text-left font-normal">
                  {locale === "ja" ? "プラットフォーム" : "Platform"}
                </th>
                <th scope="col" className="px-3 py-3 text-left font-normal">
                  {dict.chains}
                </th>
                <th scope="col" className="px-3 py-3 text-left font-normal">
                  {locale === "ja" ? "できること" : "Utility"}
                </th>
                <th scope="col" className="px-3 py-3 text-left font-normal">
                  {dict.verifiedAt}
                </th>
                <th scope="col" className="px-3 py-3 text-left font-normal">
                  <span className="sr-only">{dict.ctaOfficialSite}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {fanTokens.map((token) => {
                const team = getTeam(token.teamId);
                const sport = getSport(token.sportId);
                return (
                  <tr key={token.id} className="border-edge/60 border-b align-top last:border-0">
                    <th scope="row" className="sp-mono text-ink px-3 py-3 text-left font-semibold">
                      {token.symbol}
                    </th>
                    <td className="px-3 py-3">
                      {team ? (
                        <Link
                          href={href(locale, `/teams/${team.slug}`)}
                          className="text-ink-soft hover:text-cyan"
                        >
                          {t(team.name)}
                        </Link>
                      ) : (
                        <span className="text-ink-soft">{token.teamName}</span>
                      )}
                      {sport ? (
                        <span
                          className="sp-mono mt-0.5 block text-[0.625rem]"
                          style={{ color: sport.accent }}
                        >
                          {sport.glyph} {t(sport.name)}
                        </span>
                      ) : null}
                    </td>
                    <td className="text-ink-soft px-3 py-3">{token.platform}</td>
                    <td className="sp-mono text-ink-soft px-3 py-3">{token.chain}</td>
                    <td className="px-3 py-3">
                      <ul className="text-ink-dim space-y-0.5 text-[0.6875rem]">
                        {token.utility.map((item, index) => (
                          <li key={index}>・{t(item)}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="sp-mono text-ink-faint px-3 py-3 text-[0.6875rem]">
                      {token.verifiedAt}
                    </td>
                    <td className="px-3 py-3">
                      <OutboundLink
                        url={token.officialUrl}
                        locale={locale}
                        className="border-edge text-ink-soft hover:border-cyan/60 hover:text-cyan border text-xs whitespace-nowrap"
                      >
                        {dict.ctaOfficialSite}
                      </OutboundLink>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="ft-check" className="mb-12">
        <SectionHeading
          id="ft-check"
          eyebrow="CHECKLIST"
          title={locale === "ja" ? "触れる前に確認すること" : "Before you touch one"}
        />
        <ol className="sp-solid divide-edge divide-y">
          {(locale === "ja"
            ? [
                "発行元は誰か（クラブ本体か、提携するプラットフォーム事業者か）",
                "サービスが終了したとき、特典は何が残るのか",
                "価格はどう決まるのか（需給で変動します。クラブが保証するものではありません）",
                "居住地域で利用が認められているか",
                "公式サイトのURLをブックマークしているか（偽サイト対策）",
              ]
            : [
                "Who actually issues it — the club, or a platform partner?",
                "What survives if the platform shuts down?",
                "How the price is set (by the market, not guaranteed by the club)",
                "Whether it is permitted where you live",
                "Whether you have the real URL bookmarked (fake sites are common)",
              ]
          ).map((item, index) => (
            <li key={index} className="text-ink-soft flex gap-3 px-4 py-3 text-sm">
              <span className="sp-mono text-cyan shrink-0">{index + 1}</span>
              {item}
            </li>
          ))}
        </ol>
        <p className="mt-4">
          <Link
            href={href(locale, "/diagnosis/fan-token-literacy")}
            className="text-cyan text-sm hover:underline"
          >
            {locale === "ja" ? "ファントークン理解度診断" : "Fan token literacy check"} →
          </Link>
        </p>
      </section>

      <section aria-labelledby="ft-faq">
        <SectionHeading id="ft-faq" eyebrow="FAQ" title={dict.sectionFaq} />
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
