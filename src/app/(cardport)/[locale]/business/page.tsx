import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CardTile } from "@/cardport/components/cards/CardTile";
import { FaqList, ToolGrid } from "@/cardport/components/home/sections";
import { PageShell } from "@/cardport/components/layout/PageShell";
import { JsonLd, Notice, Panel, SectionHeading } from "@/cardport/components/ui/primitives";
import { cards } from "@/cardport/data/cards";
import { getFaqs } from "@/cardport/data/faqs";
import { financialTools } from "@/cardport/data/tools";
import { getDictionary } from "@/cardport/i18n";
import { formatAnnualFee } from "@/cardport/i18n/format";
import { pick } from "@/cardport/i18n/localized";
import { isLocale, locales, type Locale } from "@/cardport/i18n/locales";
import { routes } from "@/cardport/lib/routes";
import { cardportMetadata } from "@/cardport/lib/seo";
import { rankCards } from "@/cardport/lib/scoring";
import { faqJsonLd } from "@/cardport/lib/structured-data";

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
    title: dictionary.sections.business,
    description:
      locale === "ja"
        ? "追加カード枚数・利用限度額・会計ソフト連携・支払いサイトで、法人カードと個人事業主向けカードを比較します。"
        : "Compare business and sole-proprietor cards on additional cards, limits, accounting integrations and payment terms.",
    path: routes.business(locale),
    locale,
  });
}

export default async function BusinessPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dictionary = getDictionary(locale);

  const businessCards = rankCards(
    cards.filter((card) => card.business),
    "business",
  );
  const businessFaqs = getFaqs("business");
  const businessTools = financialTools.filter((tool) => tool.businessReady);

  return (
    <PageShell
      wide
      breadcrumbLabel={dictionary.common.breadcrumb}
      crumbs={[
        { name: dictionary.nav.home, path: routes.home(locale) },
        { name: dictionary.nav.business, path: routes.business(locale) },
      ]}
      eyebrow="BUSINESS"
      title={dictionary.sections.business}
      lead={
        locale === "ja"
          ? "還元率よりも、経費管理の手間がどれだけ減るかで選ぶのが実務的です。追加カード枚数・限度額・会計ソフト連携・支払いサイトを並べて比べられます。"
          : "In practice you choose on how much bookkeeping effort disappears, not on the reward rate. Compare additional cards, limits, integrations and payment terms."
      }
      notice={<Notice tone="warn">{dictionary.legal.verifyNotice}</Notice>}
    >
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {businessCards.map((entry) => (
          <li key={entry.card.id}>
            <CardTile
              card={entry.card}
              locale={locale}
              dictionary={dictionary}
              rank={entry.rank}
              placement="business"
            />
          </li>
        ))}
      </ul>

      <div className="mt-14">
        <SectionHeading
          eyebrow="SPEC"
          title={locale === "ja" ? "法人カードの比較項目" : "Business card comparison"}
          accent="cyan"
        />
        <Panel className="overflow-x-auto p-1">
          <table className="sticky-col w-full min-w-[52rem] border-collapse text-[0.78rem]">
            <caption className="sr-only">{dictionary.sections.business}</caption>
            <thead>
              <tr className="border-line/60 text-dim border-b text-[0.7rem]">
                {[
                  dictionary.nav.cards,
                  dictionary.card.annualFee,
                  locale === "ja" ? "追加カード" : "Additional cards",
                  dictionary.card.accounting,
                  locale === "ja" ? "支払いサイト" : "Payment terms",
                  locale === "ja" ? "領収書管理" : "Receipts",
                  locale === "ja" ? "バーチャルカード" : "Virtual cards",
                ].map((header, index) => (
                  <th
                    key={header}
                    scope="col"
                    className={
                      index === 0 ? "p-3 text-start font-normal" : "p-3 text-start font-normal"
                    }
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {businessCards.map((entry) => (
                <tr key={entry.card.id} className="border-line/30 border-b last:border-0">
                  <th scope="row" className="p-3 text-start font-normal">
                    <Link
                      href={routes.card(locale, entry.card.slug)}
                      className="text-ink hover:text-cyan"
                    >
                      {pick(entry.card.name, locale)}
                    </Link>
                  </th>
                  <td className="numeric text-mist p-3">
                    {formatAnnualFee(entry.card.annualFee, locale, dictionary.common.free)}
                  </td>
                  <td className="numeric text-mist p-3">
                    {entry.card.business?.additionalCards ?? "—"}
                  </td>
                  <td className="text-mist p-3">
                    {entry.card.business?.accountingIntegrations.join(" / ") ??
                      dictionary.common.no}
                  </td>
                  <td className="text-mist p-3">
                    {entry.card.business ? pick(entry.card.business.paymentTerms, locale) : "—"}
                  </td>
                  <td className="text-mist p-3">
                    {entry.card.business?.receiptManagement
                      ? dictionary.common.yes
                      : dictionary.common.no}
                  </td>
                  <td className="text-mist p-3">
                    {entry.card.business?.virtualCards
                      ? dictionary.common.yes
                      : dictionary.common.no}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <p className="text-dim mt-3 text-[0.72rem]">
          {locale === "ja"
            ? "利用限度額は審査により個別に設定されます。表に記載していないのは、保証できる数値がないためです。"
            : "Credit limits are set individually after review; we do not tabulate them because no figure can be guaranteed."}
        </p>
      </div>

      <div className="mt-14">
        <SectionHeading
          eyebrow="TOOLS"
          title={
            locale === "ja"
              ? "あわせて使う事業者向けツール"
              : "Tools that pair with a business card"
          }
          accent="emerald"
        />
        <ToolGrid tools={businessTools} locale={locale} dictionary={dictionary} />
      </div>

      <div className="mt-14 max-w-3xl">
        <SectionHeading eyebrow="FAQ" title={dictionary.sections.faq} accent="violet" />
        <FaqList items={businessFaqs} locale={locale} />
      </div>

      <JsonLd data={faqJsonLd(businessFaqs, locale)} />
    </PageShell>
  );
}
