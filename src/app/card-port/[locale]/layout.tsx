import { notFound } from "next/navigation";

import { Concierge } from "@/cardport/components/chat/Concierge";
import { Footer } from "@/cardport/components/layout/Footer";
import { Header } from "@/cardport/components/layout/Header";
import { JsonLd } from "@/cardport/components/ui/primitives";
import { getDictionary } from "@/cardport/i18n";
import { getLocaleDefinition, isLocale, locales, type Locale } from "@/cardport/i18n/locales";
import { organizationJsonLd, websiteJsonLd } from "@/cardport/lib/structured-data";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/** 定義していない言語コードは 404 にします（`/foo` が言語として解釈されないように） */
export const dynamicParams = false;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dictionary = getDictionary(locale);
  const definition = getLocaleDefinition(locale);

  return (
    /**
     * `<html lang>` は同居する4サイト共通のルートレイアウトが持つため変えられません。
     * 言語と書字方向はこの要素に持たせます（lang / dir は任意の要素に付けられます）。
     * 論理プロパティ（ms-/me-/start/end）を使っているので、rtl でも自動的に反転します。
     */
    <div lang={definition.hreflang} dir={definition.rtl ? "rtl" : "ltr"}>
      <a
        href="#main"
        className="focus:bg-cp-cyan focus:text-cp-void sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:px-4 focus:py-2"
      >
        {dictionary.common.skipToContent}
      </a>

      <Header locale={locale} dictionary={dictionary} />
      <main id="main">{children}</main>
      <Footer locale={locale} dictionary={dictionary} />

      <Concierge locale={locale} dictionary={dictionary} />
      <JsonLd data={[websiteJsonLd(locale), organizationJsonLd(locale)]} />
    </div>
  );
}
