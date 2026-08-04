import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ToolGrid } from "@/cardport/components/home/sections";
import { PageShell } from "@/cardport/components/layout/PageShell";
import { Notice, SectionHeading } from "@/cardport/components/ui/primitives";
import { financialTools } from "@/cardport/data/tools";
import type { FinancialTool } from "@/cardport/data/types";
import { getDictionary } from "@/cardport/i18n";
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
    title: dictionary.sections.tools,
    description: dictionary.hero.subtitle,
    path: routes.tools(locale),
    locale,
  });
}

/** 用途で並べ替えたグループ。カテゴリ数が多いため、まとまりを作って読ませます */
const groups: { key: string; ja: string; en: string; categories: FinancialTool["category"][] }[] = [
  {
    key: "personal",
    ja: "家計・カード管理",
    en: "Personal finance",
    categories: ["household", "card-manager", "point-manager", "mile-manager", "subscription"],
  },
  {
    key: "business",
    ja: "事業者向け",
    en: "For businesses",
    categories: ["expense", "accounting", "invoice", "kyc"],
  },
  {
    key: "global",
    ja: "海外送金・外貨",
    en: "Cross-border and FX",
    categories: ["remittance", "fx", "wallet", "virtual-card"],
  },
  {
    key: "security",
    ja: "セキュリティ・税務",
    en: "Security and tax",
    categories: ["fraud-detection", "password", "web3-wallet", "crypto-tax"],
  },
];

export default async function ToolsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dictionary = getDictionary(locale);

  return (
    <PageShell
      breadcrumbLabel={dictionary.common.breadcrumb}
      crumbs={[
        { name: dictionary.nav.home, path: routes.home(locale) },
        { name: dictionary.nav.tools, path: routes.tools(locale) },
      ]}
      eyebrow="TOOLS"
      title={dictionary.sections.tools}
      lead={
        locale === "ja"
          ? "料金・無料プラン・対応端末・連携先・セキュリティで比較しています。金融データを扱うツールは、連携が参照専用かどうかを必ず確認してください。"
          : "Compared on pricing, free plans, platforms, integrations and security. With anything touching your financial data, check whether the link is read-only."
      }
      notice={<Notice>{dictionary.legal.mockNotice}</Notice>}
    >
      {groups.map((group) => {
        const tools = financialTools.filter((tool) => group.categories.includes(tool.category));
        if (tools.length === 0) return null;
        return (
          <div key={group.key} className="mb-14 last:mb-0">
            <SectionHeading
              eyebrow={group.key.toUpperCase()}
              title={locale === "ja" ? group.ja : group.en}
              accent="cyan"
            />
            <ToolGrid tools={tools} locale={locale} dictionary={dictionary} />
          </div>
        );
      })}
    </PageShell>
  );
}
