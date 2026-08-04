import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { isLocale, localePath, staticLocales } from "@/portal/i18n/config";
import { getDictionary } from "@/portal/i18n/dictionaries";
import { portalMetadata } from "@/portal/lib/seo";
import { categoryFields, getTool, toolCategories, tools } from "@/portal/data/tools";
import { t, tList } from "@/portal/lib/format";
import { resolveLink } from "@/portal/lib/affiliate";
import { breadcrumbJsonLd, softwareJsonLd } from "@/portal/lib/structured-data";

import { Breadcrumbs, Container, PageHeader, Section } from "@/portal/components/layout/Shell";
import { Badge, GlassCard, NoticeBox, SupportMark } from "@/portal/components/ui/primitives";
import { OutboundLink } from "@/portal/components/ui/links";
import { JsonLd } from "@/portal/components/ui/JsonLd";

export function generateStaticParams() {
  return staticLocales().flatMap((locale) => tools.map((tool) => ({ locale, slug: tool.slug })));
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const tool = getTool(slug);
  if (!isLocale(locale) || !tool) return {};
  return portalMetadata({
    locale,
    path: `/tools/${tool.slug}`,
    title: tool.name,
    description: t(tool.summary, locale),
  });
}

export default async function ToolDetailPage(props: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await props.params;
  if (!isLocale(locale)) notFound();
  const tool = getTool(slug);
  if (!tool) notFound();

  const dict = getDictionary(locale);
  const link = resolveLink(tool.affiliateId, tool.officialUrl);
  const fields = categoryFields[tool.category];
  const category = toolCategories.find((entry) => entry.id === tool.category);
  const alternatives = tool.alternatives
    .map((id) => getTool(id))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const supportLabels = {
    yes: dict.common.yes,
    no: dict.common.no,
    partial: dict.common.partial,
    unknown: dict.common.unknown,
  };

  const trail = [
    { name: dict.nav.tools, path: "/tools" },
    { name: tool.name, path: `/tools/${tool.slug}` },
  ];

  return (
    <Section className="pt-28">
      <Container>
        <Breadcrumbs trail={trail} locale={locale} dict={dict} />
        <PageHeader
          eyebrow={category ? t(category.label, locale) : "Web3"}
          title={tool.name}
          lead={t(tool.summary, locale)}
        />

        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="grid gap-8">
            <section>
              <h2 className="mb-3 text-xl font-semibold">{dict.learn.definition}</h2>
              <p className="text-(--color-ink-soft)">{t(tool.description, locale)}</p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">{dict.learn.keyPoints}</h2>
              <ul className="grid gap-2 text-sm text-(--color-ink-soft)">
                {tList(tool.features, locale).map((entry) => (
                  <li key={entry} className="flex gap-2">
                    <span aria-hidden="true" className="text-(--color-cyan)">
                      ▸
                    </span>
                    {entry}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">{dict.tools.howToUse}</h2>
              <ol className="grid gap-3">
                {tList(tool.howToUse, locale).map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm text-(--color-ink-soft)">
                    <span
                      aria-hidden="true"
                      className="grid size-6 shrink-0 place-items-center rounded-full border border-(--color-cyan)/40 font-mono text-xs text-(--color-cyan)"
                    >
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">{dict.exchanges.pros}</h2>
              <ul className="grid gap-2 text-sm text-(--color-ink-soft)">
                {tList(tool.pros, locale).map((entry) => (
                  <li key={entry} className="flex gap-2">
                    <span aria-hidden="true" className="text-(--color-emerald)">
                      ＋
                    </span>
                    {entry}
                  </li>
                ))}
              </ul>
              <h2 className="mt-6 mb-3 text-xl font-semibold">{dict.exchanges.cons}</h2>
              <ul className="grid gap-2 text-sm text-(--color-ink-soft)">
                {tList(tool.cons, locale).map((entry) => (
                  <li key={entry} className="flex gap-2">
                    <span aria-hidden="true" className="text-(--color-down)">
                      －
                    </span>
                    {entry}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">{dict.tools.safety}</h2>
              <NoticeBox tone="rose">
                <ul className="grid gap-1.5">
                  {tList(tool.safety, locale).map((entry) => (
                    <li key={entry}>· {entry}</li>
                  ))}
                </ul>
              </NoticeBox>
            </section>

            {alternatives.length > 0 ? (
              <section>
                <h2 className="mb-3 text-xl font-semibold">{dict.tools.alternatives}</h2>
                <ul className="flex flex-wrap gap-2">
                  {alternatives.map((entry) => (
                    <li key={entry.id}>
                      <Link
                        href={localePath(locale, `/tools/${entry.slug}`)}
                        className="glass edge-glow inline-flex rounded-full px-3.5 py-1.5 text-xs"
                      >
                        {entry.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside>
            <GlassCard className="p-5" glow={false}>
              <h2 className="mb-4 text-sm font-semibold">{dict.common.category}</h2>
              <dl className="grid gap-2 text-sm">
                {category ? (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-(--color-ink-dim)">{dict.common.category}</dt>
                    <dd>
                      <Badge tone="violet">{t(category.label, locale)}</Badge>
                    </dd>
                  </div>
                ) : null}
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-(--color-ink-dim)">{dict.tools.pricing}</dt>
                  <dd className="text-end">{t(tool.pricing, locale)}</dd>
                </div>
                {fields.includes("freePlan") ? (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-(--color-ink-dim)">{dict.tools.freePlan}</dt>
                    <dd>
                      <SupportMark value={tool.freePlan} labels={supportLabels} />
                    </dd>
                  </div>
                ) : null}
                {fields.includes("walletConnect") ? (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-(--color-ink-dim)">{dict.tools.walletConnect}</dt>
                    <dd>
                      <SupportMark value={tool.walletConnect} labels={supportLabels} />
                    </dd>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-(--color-ink-dim)">{dict.wallets.mobile}</dt>
                  <dd>
                    <SupportMark value={tool.mobile} labels={supportLabels} />
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-(--color-ink-dim)">{dict.tools.languages}</dt>
                  <dd className="text-end">{tool.languages.join(" / ") || dict.common.unknown}</dd>
                </div>
                {tool.chains.length > 0 ? (
                  <div className="flex items-start justify-between gap-3 border-t border-(--color-hairline) pt-2">
                    <dt className="text-(--color-ink-dim)">{dict.tools.supportedChains}</dt>
                    <dd className="text-end">{tool.chains.join(" / ")}</dd>
                  </div>
                ) : null}
              </dl>

              <OutboundLink
                link={link}
                placement="tool-detail"
                label={tool.name}
                adLabel={dict.common.sponsored}
                srExternal={dict.a11y.externalLink}
                className="mt-5 w-full justify-center rounded-full border border-(--color-hairline-strong) px-5 py-3 text-sm font-semibold"
              >
                {dict.common.official}
              </OutboundLink>
            </GlassCard>
          </aside>
        </div>
      </Container>

      <JsonLd
        data={[
          breadcrumbJsonLd(locale, trail),
          softwareJsonLd(
            tool.name,
            t(tool.summary, locale),
            "FinanceApplication",
            tool.officialUrl,
          ),
        ]}
      />
    </Section>
  );
}
