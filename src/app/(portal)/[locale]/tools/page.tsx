import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isLocale, staticLocales } from "@/portal/i18n/config";
import { getDictionary } from "@/portal/i18n/dictionaries";
import { portalMetadata } from "@/portal/lib/seo";
import { tools } from "@/portal/data/tools";
import { breadcrumbJsonLd, itemListJsonLd } from "@/portal/lib/structured-data";

import { Breadcrumbs, Container, PageHeader, Section } from "@/portal/components/layout/Shell";
import { ToolBrowser } from "@/portal/components/tools/ToolBrowser";
import { NoticeBox } from "@/portal/components/ui/primitives";
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
    path: "/tools",
    title: dict.tools.title,
    description: dict.tools.lead,
  });
}

export default async function ToolsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const trail = [{ name: dict.nav.tools, path: "/tools" }];

  return (
    <Section className="pt-28">
      <Container>
        <Breadcrumbs trail={trail} locale={locale} dict={dict} />
        <PageHeader display="Web3" title={dict.tools.title} lead={dict.tools.lead} />

        <NoticeBox tone="cyan" className="mb-8">
          {locale === "ja"
            ? "掲載しているのは各サービスが公開している機能構成です。ウォレットを接続する前に、必ず公式ドメインであることを確認してください。当サイトからウォレット接続は行いません。"
            : "What is listed here is each service's publicly documented feature set. Always verify the official domain before connecting a wallet. This site never initiates a wallet connection."}
        </NoticeBox>

        <ToolBrowser tools={tools} locale={locale} dict={dict} />
      </Container>

      <JsonLd
        data={[
          breadcrumbJsonLd(locale, trail),
          itemListJsonLd(
            locale,
            dict.tools.title,
            tools.map((tool) => ({ name: tool.name, path: `/tools/${tool.slug}` })),
          ),
        ]}
      />
    </Section>
  );
}
