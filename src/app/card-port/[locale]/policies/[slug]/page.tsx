import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageShell } from "@/cardport/components/layout/PageShell";
import { Notice, Panel } from "@/cardport/components/ui/primitives";
import { company } from "@/cardport/config/site";
import { authors } from "@/cardport/data/authors";
import { getPolicy, policyPages } from "@/cardport/data/policies";
import { getDictionary } from "@/cardport/i18n";
import { formatDate } from "@/cardport/i18n/format";
import { pick, pickList } from "@/cardport/i18n/localized";
import { isLocale, locales, type Locale } from "@/cardport/i18n/locales";
import { routes } from "@/cardport/lib/routes";
import { cardportMetadata } from "@/cardport/lib/seo";
import { axisDefinitions, axisLabels, scoreAxes } from "@/cardport/lib/scoring";

export function generateStaticParams() {
  return locales.flatMap((locale) => policyPages.map((page) => ({ locale, slug: page.slug })));
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
  const page = getPolicy(slug);
  if (!page) return {};
  return cardportMetadata({
    title: pick(page.title, locale),
    description: pick(page.lead, locale),
    path: routes.policy(locale, page.slug),
    locale,
    modifiedTime: page.updatedOn,
  });
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const page = getPolicy(slug);
  if (!page) notFound();

  const dictionary = getDictionary(locale);

  return (
    <PageShell
      breadcrumbLabel={dictionary.common.breadcrumb}
      crumbs={[
        { name: dictionary.nav.home, path: routes.home(locale) },
        { name: dictionary.footer.operator, path: routes.policies(locale) },
        { name: pick(page.title, locale), path: routes.policy(locale, page.slug) },
      ]}
      eyebrow="POLICY"
      title={pick(page.title, locale)}
      lead={pick(page.lead, locale)}
      meta={
        <p>
          {dictionary.common.updatedAt}: {formatDate(page.updatedOn, locale)}
        </p>
      }
    >
      <div className="max-w-3xl space-y-8">
        {/* 運営者情報ページでは、未設定の項目を隠さず「未設定」と出します */}
        {page.slug === "about" ? (
          <Panel className="p-5">
            <dl className="divide-cp-line/30 divide-y">
              {[
                [locale === "ja" ? "運営" : "Operator", company.legalName],
                [locale === "ja" ? "代表者" : "Representative", company.representative],
                [locale === "ja" ? "所在地" : "Address", company.address],
                [locale === "ja" ? "連絡先" : "Contact", company.email],
                [locale === "ja" ? "設立" : "Established", company.established],
                [locale === "ja" ? "登録番号" : "Registration", company.registrationNumber],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-[8rem_1fr] gap-3 py-2.5">
                  <dt className="text-cp-dim text-[0.76rem]">{label}</dt>
                  <dd
                    className={
                      value ? "text-cp-mist text-[0.82rem]" : "text-cp-amber text-[0.82rem]"
                    }
                  >
                    {value || (locale === "ja" ? "未設定" : "Not set")}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="border-cp-line/50 mt-5 border-t pt-4">
              <h2 className="text-cp-ink mb-3 text-[0.86rem] font-semibold">
                {locale === "ja" ? "執筆者・監修者" : "Writers and supervisors"}
              </h2>
              <ul className="space-y-3">
                {authors.map((author) => (
                  <li key={author.id}>
                    <p className="text-cp-ink text-[0.84rem] font-medium">
                      {pick(author.name, locale)}
                      <span className="text-cp-dim ms-2 text-[0.72rem]">
                        {pick(author.role, locale)}
                      </span>
                    </p>
                    <p className="text-cp-mist mt-0.5 text-[0.76rem] leading-relaxed">
                      {pick(author.bio, locale)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
        ) : null}

        {page.sections.map((section, index) => (
          <section key={index}>
            <h2 className="text-cp-ink mb-3 text-[1.05rem] font-semibold">
              {pick(section.heading, locale)}
            </h2>
            <ul className="space-y-2.5">
              {pickList(section.body, locale).map((line) => (
                <li key={line} className="text-cp-mist flex gap-2.5 text-[0.88rem] leading-[1.9]">
                  <span className="text-cp-dim shrink-0">・</span>
                  {line}
                </li>
              ))}
            </ul>
          </section>
        ))}

        {/* 評価基準ページには、実際に計算で使っている軸の定義を出します */}
        {page.slug === "ranking-criteria" ? (
          <section>
            <h2 className="text-cp-ink mb-3 text-[1.05rem] font-semibold">
              {locale === "ja" ? "各評価軸の定義" : "Definition of each axis"}
            </h2>
            <Panel className="overflow-hidden">
              <dl className="divide-cp-line/30 divide-y">
                {scoreAxes.map((axis) => (
                  <div key={axis} className="px-5 py-3.5">
                    <dt className="text-cp-cyan text-[0.84rem] font-medium">
                      {pick(axisLabels[axis], locale)}
                    </dt>
                    <dd className="text-cp-mist mt-1 text-[0.8rem] leading-relaxed">
                      {pick(axisDefinitions[axis], locale)}
                    </dd>
                  </div>
                ))}
              </dl>
            </Panel>
          </section>
        ) : null}

        {page.slug === "financial-policy" || page.slug === "disclaimer" ? (
          <Notice tone="warn">{dictionary.legal.verifyNotice}</Notice>
        ) : null}
      </div>
    </PageShell>
  );
}
