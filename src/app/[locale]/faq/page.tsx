import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isLocale, staticLocales } from "@/portal/i18n/config";
import { getDictionary } from "@/portal/i18n/dictionaries";
import { portalMetadata } from "@/portal/lib/seo";
import { siteFaq } from "@/portal/data/site-content";
import { breadcrumbJsonLd, faqJsonLd } from "@/portal/lib/structured-data";

import { Breadcrumbs, Container, PageHeader, Section } from "@/portal/components/layout/Shell";
import { PageVisual } from "@/portal/components/layout/PageVisual";
import { FaqList } from "@/portal/components/ui/sections";
import { JsonLd } from "@/portal/components/ui/JsonLd";

export function generateStaticParams() {
  return staticLocales().map((locale) => ({ locale }));
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return portalMetadata({
    locale,
    path: "/faq",
    title: dict.faq.title,
    description: dict.faq.lead,
  });
}

export default async function FaqPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const trail = [{ name: dict.faq.title, path: "/faq" }];

  return (
    <Section className="pt-28">
      <Container size="text">
        <Breadcrumbs trail={trail} locale={locale} dict={dict} />
        <PageHeader display="FAQ" title={dict.faq.title} lead={dict.faq.lead} />
        <PageVisual name="faq" locale={locale} priority />
        <FaqList items={siteFaq} locale={locale} />
      </Container>

      <JsonLd data={[breadcrumbJsonLd(locale, trail), faqJsonLd(locale, siteFaq)]} />
    </Section>
  );
}
