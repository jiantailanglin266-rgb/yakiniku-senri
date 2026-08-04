import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { isLocale, localePath, staticLocales } from "@/portal/i18n/config";
import { getDictionary } from "@/portal/i18n/dictionaries";
import { portalMetadata } from "@/portal/lib/seo";
import { contentInventory, healthIssues, outboundLinks } from "@/portal/lib/admin";
import { locales } from "@/portal/i18n/config";

import { Breadcrumbs, Container, PageHeader, Section } from "@/portal/components/layout/Shell";
import { Badge, GlassCard, NoticeBox, StatTile } from "@/portal/components/ui/primitives";

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
    path: "/admin",
    title: dict.nav.admin,
    description: "コンテンツ在庫と健全性チェック",
    // 管理画面は検索結果に出しません
    noindex: true,
  });
}

const severityTone = { high: "rose", medium: "amber", low: "cyan" } as const;

/**
 * 管理ダッシュボード（読み取り専用のプロトタイプ）。
 *
 * ⚠ 現時点では認証がありません。
 *   コンテンツは TypeScript のデータファイルで管理しており、この画面からは
 *   何も書き換えられないため、公開されても情報が壊れることはありません。
 *   ただし運用状況（未検証の件数など）は見えるので、
 *   本番では Basic 認証か Middleware でアクセスを絞ってください。
 *   書き込み機能を足す前に、必ず認証・権限・監査ログを実装してください。
 */
export default async function AdminPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const inventory = contentInventory();
  const issues = healthIssues();
  const links = outboundLinks();
  const total = inventory.reduce((sum, row) => sum + row.count, 0);

  return (
    <Section className="pt-28">
      <Container>
        <Breadcrumbs
          trail={[{ name: dict.nav.admin, path: "/admin" }]}
          locale={locale}
          dict={dict}
        />
        <PageHeader
          eyebrow="Admin"
          title={dict.nav.admin}
          lead="コンテンツの在庫と、公開前に直すべき点を一覧化しています。"
        />

        <NoticeBox tone="rose" className="mb-8" title="この画面について">
          読み取り専用のプロトタイプです。認証はまだ入っていません。編集機能を追加する前に、
          Supabase への移行（docs/DATABASE.md）と、認証・権限・監査ログの実装を先に行ってください。
        </NoticeBox>

        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="コンテンツ総数" value={total} />
          <StatTile label="対応言語" value={locales.length} />
          <StatTile label="外部リンク" value={links.length} />
          <StatTile
            label="要対応"
            value={issues.length}
            tone={issues.some((issue) => issue.severity === "high") ? "down" : undefined}
          />
        </div>

        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold">要対応</h2>
          {issues.length === 0 ? (
            <p className="text-sm text-(--color-ink-soft)">指摘はありません。</p>
          ) : (
            <ul className="grid gap-3">
              {issues.map((issue, index) => (
                <li key={index}>
                  <GlassCard className="p-4" glow={false}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={severityTone[issue.severity]}>
                        {issue.severity === "high"
                          ? "高"
                          : issue.severity === "medium"
                            ? "中"
                            : "低"}
                      </Badge>
                      <Badge>{issue.area}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-(--color-ink-soft)">{issue.message}</p>
                    <p className="mt-1.5 font-mono text-xs text-(--color-ink-dim)">{issue.file}</p>
                  </GlassCard>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold">コンテンツ在庫</h2>
          <div className="scroll-fade -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[28rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-(--color-hairline-strong) text-xs tracking-wide text-(--color-ink-dim) uppercase">
                  <th scope="col" className="px-3 py-2 text-start">
                    種別
                  </th>
                  <th scope="col" className="px-3 py-2 text-end">
                    件数
                  </th>
                  <th scope="col" className="px-3 py-2 text-end">
                    全言語での総ページ数
                  </th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((row) => (
                  <tr key={row.label} className="border-b border-(--color-hairline)">
                    <th scope="row" className="px-3 py-2.5 text-start font-normal">
                      <Link href={localePath(locale, row.path)} className="hover:text-white">
                        {row.label}
                      </Link>
                    </th>
                    <td className="tabular px-3 py-2.5 text-end font-mono">{row.count}</td>
                    <td className="tabular px-3 py-2.5 text-end font-mono text-(--color-ink-dim)">
                      {row.count * locales.length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">外部リンク</h2>
          <p className="mb-4 text-sm text-(--color-ink-soft)">
            リンク切れ検知のバッチは、この一覧を入力に HEAD リクエストを送る想定です（未実装）。
          </p>
          <ul className="grid gap-1.5 text-xs">
            {links.map((link) => (
              <li key={`${link.kind}-${link.url}`} className="flex flex-wrap items-center gap-2">
                <Badge>{link.kind}</Badge>
                <span className="text-(--color-ink-soft)">{link.label}</span>
                <span className="truncate font-mono text-(--color-ink-dim)">{link.url}</span>
              </li>
            ))}
          </ul>
        </section>
      </Container>
    </Section>
  );
}
