import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PaymentGrid } from "@/cardport/components/home/sections";
import { PageShell } from "@/cardport/components/layout/PageShell";
import { Notice, Panel, SectionHeading } from "@/cardport/components/ui/primitives";
import { getCardsByIds } from "@/cardport/data/cards";
import { paymentServices } from "@/cardport/data/payments";
import { getDictionary } from "@/cardport/i18n";
import { pick, pickList } from "@/cardport/i18n/localized";
import { isLocale, locales, type Locale } from "@/cardport/i18n/locales";
import { routes } from "@/cardport/lib/routes";
import { cardportMetadata } from "@/cardport/lib/seo";

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
    title: dictionary.nav.payments,
    description: dictionary.hero.subtitle,
    path: routes.payments(locale),
    locale,
  });
}

export default async function PaymentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dictionary = getDictionary(locale);

  return (
    <PageShell
      breadcrumbLabel={dictionary.common.breadcrumb}
      crumbs={[
        { name: dictionary.nav.home, path: routes.home(locale) },
        { name: dictionary.nav.payments, path: routes.payments(locale) },
      ]}
      eyebrow="CASHLESS"
      title={dictionary.nav.payments}
      lead={
        locale === "ja"
          ? "決済サービスの還元は、チャージ元のカードと組み合わせて初めて決まります。単独の還元率だけでは比較になりません。"
          : "What a payment service returns depends on the card you top it up with. The service's own rate tells you little on its own."
      }
      notice={<Notice tone="warn">{dictionary.legal.verifyNotice}</Notice>}
    >
      <PaymentGrid locale={locale} dictionary={dictionary} />

      <div className="mt-14">
        <SectionHeading
          eyebrow="COMBINATION"
          title={locale === "ja" ? "決済サービスと相性のよいカード" : "Cards that pair well"}
          accent="cyan"
        />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paymentServices.map((service) => {
            const best = getCardsByIds(service.bestCardIds);
            return (
              <li key={service.id}>
                <Panel className="h-full p-4">
                  <h3 className="text-ink text-[0.88rem] font-semibold">
                    {pick(service.name, locale)}
                  </h3>
                  <p className="text-dim mt-2 text-[0.72rem]">
                    {locale === "ja" ? "チャージ元" : "Top-up sources"}
                  </p>
                  <ul className="text-mist mt-1 space-y-0.5 text-[0.74rem]">
                    {pickList(service.chargeSources, locale).map((line) => (
                      <li key={line}>・{line}</li>
                    ))}
                  </ul>
                  {best.length > 0 ? (
                    <>
                      <p className="text-dim mt-3 text-[0.72rem]">
                        {locale === "ja" ? "相性のよいカード" : "Best paired with"}
                      </p>
                      <ul className="mt-1 space-y-0.5">
                        {best.map((card) => (
                          <li key={card.id}>
                            <Link
                              href={routes.card(locale, card.slug)}
                              className="text-cyan text-[0.76rem] hover:underline"
                            >
                              {pick(card.name, locale)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="text-dim mt-3 text-[0.74rem]">
                      {locale === "ja"
                        ? "カードとの組み合わせによる上乗せはありません。"
                        : "No card pairing adds to this service's return."}
                    </p>
                  )}
                </Panel>
              </li>
            );
          })}
        </ul>
      </div>
    </PageShell>
  );
}
