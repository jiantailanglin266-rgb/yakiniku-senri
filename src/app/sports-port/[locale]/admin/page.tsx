import type { Metadata } from "next";
import Link from "next/link";

import { findLocale, getDictionary, localeCodes } from "@/sports/i18n";
import { resolveLocale } from "@/sports/lib/page";
import { sportsMetadata } from "@/sports/lib/seo";
import { href } from "@/sports/lib/url";
import { adminMetrics, affiliateLinks } from "@/sports/data/content";
import { getSport } from "@/sports/data/sports";
import { getLocale } from "@/sports/i18n/locales";
import { sports } from "@/sports/data/sports";
import { leagues } from "@/sports/data/leagues";
import { teams } from "@/sports/data/teams";
import { players } from "@/sports/data/players";
import { matches } from "@/sports/data/matches";
import { news } from "@/sports/data/news";
import { videos } from "@/sports/data/videos";
import { streamingServices } from "@/sports/data/streaming";
import { web3Services } from "@/sports/data/web3";
import { diagnoses } from "@/sports/data/diagnoses";
import { usingMockData } from "@/sports/lib/api";
import { wikimediaAssets, wikimediaRejections, wikimediaSyncedAt } from "@/wikimedia/data/assets";
import { evaluateAsset } from "@/wikimedia/licenses";

import { Badge, Breadcrumbs, JsonLd, SectionHeading } from "@/sports/components/ui/primitives";
import { breadcrumbJsonLd } from "@/sports/lib/structured-data";

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
    path: "/admin",
    title: dict.navAdmin,
    description:
      info.code === "ja"
        ? "管理画面のデモ表示です。実運用では認証・権限管理・監査ログを前提とし、公開ページには含めません。"
        : "A read-only preview of the admin dashboard. In production this sits behind authentication and is never publicly indexed.",
    // 管理画面は検索結果に出しません
    noindex: true,
  });
}

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, dict, t } = await resolveLocale(params);

  const trail = [
    { label: "HOME", path: "/" },
    { label: dict.navAdmin, path: "/admin" },
  ];

  // 画像の承認状況。数えているだけで、ここから公開状態を変えることはできません
  const byStatus = (status: string) =>
    wikimediaAssets.filter((asset) => asset.verificationStatus === status).length;
  const imageReview = [
    {
      key: "fetched",
      label: locale === "ja" ? "取得済み" : "Fetched",
      count: wikimediaAssets.length,
    },
    {
      key: "published",
      label: locale === "ja" ? "公開中" : "Published",
      count: wikimediaAssets.filter((asset) => evaluateAsset(asset).allowed).length,
    },
    {
      key: "needs_review",
      label: locale === "ja" ? "確認待ち" : "Needs review",
      count: byStatus("needs_review"),
    },
    {
      key: "rights_risk",
      label: locale === "ja" ? "追加権利あり" : "Rights risk",
      count: byStatus("rights_risk"),
    },
    {
      key: "license_unknown",
      label: locale === "ja" ? "ライセンス不明" : "Licence unknown",
      count: byStatus("license_unknown"),
    },
    {
      key: "rejected",
      label: locale === "ja" ? "同期時に除外" : "Rejected at sync",
      count: byStatus("rejected") + wikimediaRejections.length,
    },
  ];

  const collections = [
    { key: "sports", label: dict.sectionSports, count: sports.length, path: "/leagues" },
    { key: "leagues", label: dict.navLeagues, count: leagues.length, path: "/leagues" },
    { key: "teams", label: dict.team, count: teams.length, path: "/leagues" },
    { key: "players", label: dict.player, count: players.length, path: "/leagues" },
    { key: "matches", label: dict.navMatches, count: matches.length, path: "/matches" },
    { key: "news", label: dict.navNews, count: news.length, path: "/news" },
    { key: "videos", label: dict.navVideos, count: videos.length, path: "/videos" },
    {
      key: "streaming",
      label: dict.navStreaming,
      count: streamingServices.length,
      path: "/streaming",
    },
    { key: "web3", label: dict.navWeb3, count: web3Services.length, path: "/web3" },
    { key: "diagnosis", label: dict.navDiagnosis, count: diagnoses.length, path: "/diagnosis" },
    {
      key: "affiliate",
      label: locale === "ja" ? "アフィリエイトリンク" : "Affiliate links",
      count: affiliateLinks.length,
      path: "/streaming",
    },
  ];

  return (
    <>
      <Breadcrumbs locale={locale} trail={trail} />

      <header className="mb-8">
        <p className="sp-eyebrow mb-2">ADMIN</p>
        <h1 className="text-ink text-3xl font-extrabold sm:text-4xl">{dict.navAdmin}</h1>
        <p className="text-ink-dim mt-3 max-w-3xl text-sm leading-relaxed">
          {locale === "ja"
            ? "読み取り専用のデモ表示です。実運用では認証（多要素）・権限管理・監査ログを前提とし、公開ページからは切り離します。数値はすべてデモ値です。"
            : "A read-only preview. In production this sits behind multi-factor auth, role-based access and an audit log. All numbers here are demo values."}
        </p>
      </header>

      <section aria-labelledby="ad-kpi" className="mb-12">
        <SectionHeading
          id="ad-kpi"
          eyebrow="DASHBOARD"
          title={locale === "ja" ? "主要指標" : "Key metrics"}
        />
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {adminMetrics.summary.map((item) => (
            <div key={item.key} className="sp-solid p-4">
              <dt className="text-ink-faint text-[0.6875rem]">{t(item.label)}</dt>
              <dd className="sp-mono text-ink mt-1 text-xl font-extrabold">{item.value}</dd>
              <dd
                className={`sp-mono mt-0.5 text-[0.625rem] ${item.change >= 0 ? "text-neon" : "text-live"}`}
              >
                {item.change >= 0 ? "+" : ""}
                {item.change}%
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mb-12 grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="ad-sports">
          <SectionHeading
            id="ad-sports"
            eyebrow="TRAFFIC"
            title={locale === "ja" ? "人気競技" : "Popular sports"}
          />
          <ul className="space-y-2">
            {adminMetrics.topSports.map((row) => {
              const sport = getSport(row.id);
              return (
                <li key={row.id} className="sp-solid flex items-center gap-3 p-3">
                  <span className="text-ink-soft w-28 shrink-0 truncate text-sm">
                    {sport?.glyph} {t(sport?.name)}
                  </span>
                  <span className="bg-edge h-1.5 flex-1 overflow-hidden rounded-full">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${row.value}%`,
                        background: sport?.accent ?? "var(--color-cyan)",
                      }}
                    />
                  </span>
                  <span className="sp-mono text-ink-faint w-10 shrink-0 text-right text-xs">
                    {row.value}%
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="ad-locales">
          <SectionHeading
            id="ad-locales"
            eyebrow="LOCALES"
            title={locale === "ja" ? "言語別アクセス" : "By language"}
          />
          <ul className="space-y-2">
            {adminMetrics.topLocales.map((row) => {
              const info = getLocale(row.code);
              return (
                <li key={row.code} className="sp-solid flex items-center gap-3 p-3">
                  <span className="text-ink-soft w-28 shrink-0 truncate text-sm" translate="no">
                    {info.label}
                  </span>
                  <span className="bg-edge h-1.5 flex-1 overflow-hidden rounded-full">
                    <span
                      className="bg-indigo block h-full rounded-full"
                      style={{ width: `${row.value}%` }}
                    />
                  </span>
                  <span className="sp-mono text-ink-faint w-10 shrink-0 text-right text-xs">
                    {row.value}%
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section aria-labelledby="ad-health" className="mb-12">
        <SectionHeading
          id="ad-health"
          eyebrow="HEALTH"
          title={locale === "ja" ? "運用の健全性" : "Operational health"}
        />
        <ul className="grid gap-3 sm:grid-cols-3">
          {adminMetrics.issues.map((issue) => (
            <li key={issue.id} className="sp-solid p-4">
              <p className="text-ink-faint text-[0.6875rem]">{t(issue.label)}</p>
              <p className="mt-1 flex items-center gap-2">
                <span className="sp-mono text-ink text-lg font-bold">{issue.value}</span>
                <Badge tone={issue.severity === "ok" ? "success" : "caution"}>
                  {issue.severity === "ok" ? "OK" : "WARN"}
                </Badge>
              </p>
            </li>
          ))}
          <li className="sp-solid p-4">
            <p className="text-ink-faint text-[0.6875rem]">
              {locale === "ja" ? "データソース" : "Data source"}
            </p>
            <p className="mt-1">
              <Badge tone={usingMockData ? "caution" : "success"}>
                {usingMockData ? "MOCK" : "LIVE"}
              </Badge>
            </p>
          </li>
        </ul>
      </section>

      <section aria-labelledby="ad-collections" className="mb-12">
        <SectionHeading
          id="ad-collections"
          eyebrow="CONTENT"
          title={locale === "ja" ? "登録件数" : "Registered records"}
          description={
            locale === "ja"
              ? "現在は src/sports/data/*.ts が編集対象です。Supabase へ移行する場合も、同じ型のまま差し替えられる構成にしています。"
              : "Records currently live in src/sports/data/*.ts. Moving to Supabase keeps the same types."
          }
        />
        <div className="sp-scroll-x border-edge rounded-xl border">
          <table className="w-full min-w-[34rem] text-sm">
            <caption className="sr-only">
              {locale === "ja" ? "登録件数" : "Registered records"}
            </caption>
            <thead>
              <tr className="border-edge text-ink-faint border-b text-[0.6875rem]">
                <th scope="col" className="px-4 py-3 text-left font-normal">
                  {locale === "ja" ? "コレクション" : "Collection"}
                </th>
                <th scope="col" className="px-4 py-3 text-right font-normal">
                  {locale === "ja" ? "件数" : "Count"}
                </th>
                <th scope="col" className="px-4 py-3 text-left font-normal">
                  {locale === "ja" ? "公開ページ" : "Public page"}
                </th>
              </tr>
            </thead>
            <tbody>
              {collections.map((item) => (
                <tr key={item.key} className="border-edge/60 border-b last:border-0">
                  <th scope="row" className="text-ink-soft px-4 py-2.5 text-left font-normal">
                    {item.label}
                  </th>
                  <td className="sp-mono text-ink px-4 py-2.5 text-right">{item.count}</td>
                  <td className="px-4 py-2.5">
                    <Link
                      href={href(locale, item.path)}
                      className="text-cyan text-xs hover:underline"
                    >
                      {item.path}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="ad-images" className="mb-12">
        <SectionHeading
          id="ad-images"
          eyebrow="IMAGE REVIEW"
          title={locale === "ja" ? "画像の承認状況" : "Image review queue"}
          description={
            locale === "ja"
              ? "npm run wikimedia:sync で取得した候補の判定結果です。承認は src/wikimedia/data/reviews.json への追記（＝コードレビュー）で行います。画面から直接公開できる導線は意図的に設けていません。"
              : "Verification state of candidates fetched by npm run wikimedia:sync. Approval happens by editing src/wikimedia/data/reviews.json, so every publication passes code review. There is deliberately no publish button here."
          }
        />
        <ul className="mb-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {imageReview.map((item) => (
            <li key={item.key} className="sp-solid p-4">
              <p className="text-ink-faint text-[0.6875rem]">{item.label}</p>
              <p className="sp-mono text-ink mt-1 text-lg font-bold">{item.count}</p>
            </li>
          ))}
        </ul>
        <div className="sp-solid text-ink-soft p-4 text-xs leading-relaxed">
          <p>
            {locale === "ja" ? "最終同期" : "Last sync"}:{" "}
            <span className="sp-mono" translate="no">
              {wikimediaSyncedAt ? wikimediaSyncedAt.slice(0, 19).replace("T", " ") : "—"}
            </span>
          </p>
          <p className="text-ink-dim mt-2">
            {locale === "ja"
              ? "承認済みの画像は、ライセンス・作者・出典が揃っているものだけです。1つでも欠けると WikimediaImage が描画を拒否し、生成ビジュアルに切り替わります。"
              : "Only assets with a licence, an author and a source are approved. If any of the three is missing, WikimediaImage refuses to render and falls back to a generated visual."}
          </p>
          <p className="mt-2">
            <Link href={href(locale, "/image-credits")} className="text-cyan hover:underline">
              {dict.footerImageCredits}
            </Link>
          </p>
        </div>
      </section>

      <section aria-labelledby="ad-affiliate" className="mb-12">
        <SectionHeading
          id="ad-affiliate"
          eyebrow="AFFILIATE"
          title={locale === "ja" ? "アフィリエイトリンク管理" : "Affiliate link management"}
        />
        <div className="sp-scroll-x border-edge rounded-xl border">
          <table className="w-full min-w-[42rem] text-sm">
            <caption className="sr-only">
              {locale === "ja" ? "アフィリエイトリンク" : "Affiliate links"}
            </caption>
            <thead>
              <tr className="border-edge text-ink-faint border-b text-[0.6875rem]">
                <th scope="col" className="px-4 py-3 text-left font-normal">
                  ID
                </th>
                <th scope="col" className="px-4 py-3 text-left font-normal">
                  {locale === "ja" ? "キャンペーン" : "Campaign"}
                </th>
                <th scope="col" className="px-4 py-3 text-left font-normal">
                  URL
                </th>
                <th scope="col" className="px-4 py-3 text-center font-normal">
                  {locale === "ja" ? "A/B" : "A/B"}
                </th>
                <th scope="col" className="px-4 py-3 text-center font-normal">
                  {locale === "ja" ? "広告表記" : "Disclosure"}
                </th>
                <th scope="col" className="px-4 py-3 text-center font-normal">
                  {locale === "ja" ? "状態" : "Status"}
                </th>
              </tr>
            </thead>
            <tbody>
              {affiliateLinks.map((link) => (
                <tr key={link.id} className="border-edge/60 border-b last:border-0">
                  <th
                    scope="row"
                    className="sp-mono text-ink-soft px-4 py-2.5 text-left font-normal"
                  >
                    {link.id}
                  </th>
                  <td className="text-ink-dim px-4 py-2.5">{link.campaign}</td>
                  <td className="sp-mono text-ink-faint truncate px-4 py-2.5 text-[0.6875rem]">
                    {link.url}
                  </td>
                  <td className="text-ink-dim px-4 py-2.5 text-center">
                    {link.variants?.length ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-center">{link.disclosure ? "✓" : "—"}</td>
                  <td className="px-4 py-2.5 text-center">
                    <Badge tone={link.active ? "success" : "neutral"}>
                      {link.active ? "ON" : "OFF"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="ad-security" className="mb-12">
        <SectionHeading
          id="ad-security"
          eyebrow="SECURITY"
          title={locale === "ja" ? "本番運用の前提" : "Production requirements"}
        />
        <ul className="sp-solid divide-edge divide-y">
          {(locale === "ja"
            ? [
                "管理者の多要素認証（未実装：認証基盤の導入が前提）",
                "ロールベースの権限管理（編集者・監修者・管理者）",
                "監査ログ（誰が何をいつ変更したか）",
                "APIキーはサーバー側の環境変数のみ。NEXT_PUBLIC_ を付けない",
                "Webhook の署名検証",
                "入力値検証（Zod スキーマ）とレート制限",
              ]
            : [
                "Multi-factor authentication for admins (not implemented — needs an auth provider)",
                "Role-based access: editor, reviewer, administrator",
                "Audit log of who changed what, and when",
                "API keys only in server-side environment variables — never NEXT_PUBLIC_",
                "Webhook signature verification",
                "Input validation (Zod) and rate limiting",
              ]
          ).map((item) => (
            <li key={item} className="text-ink-soft px-4 py-3 text-sm">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <JsonLd data={[breadcrumbJsonLd(locale, trail)]} />
    </>
  );
}
