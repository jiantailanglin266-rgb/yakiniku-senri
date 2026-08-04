/**
 * 管理画面（読み取り専用のダッシュボード）。
 *
 * ■ なぜ編集機能を置かないか
 *   このリポジトリは認証基盤を持たず、静的配信でも動くことを要件にしています。
 *   認証のない編集画面を公開することは、金融メディアとして許容できません。
 *   ここでは「本番でSupabase Authと権限管理を入れたときに、何を出すべきか」を
 *   実データ（掲載中のカード・リンク・期限）で示す運用ダッシュボードにしています。
 *
 * ■ 本番化の手順は README の「管理画面」を参照してください。
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageShell } from "@/cardport/components/layout/PageShell";
import {
  Badge,
  Notice,
  Panel,
  SectionHeading,
  StatBlock,
  cx,
} from "@/cardport/components/ui/primitives";
import { cards } from "@/cardport/data/cards";
import { campaigns, isExpired } from "@/cardport/data/campaigns";
import { cardCategories } from "@/cardport/data/categories";
import { diagnoses } from "@/cardport/data/diagnoses";
import { faqs } from "@/cardport/data/faqs";
import { guides } from "@/cardport/data/guides";
import { news } from "@/cardport/data/news";
import { paymentServices } from "@/cardport/data/payments";
import { simulators } from "@/cardport/data/simulators";
import { financialTools } from "@/cardport/data/tools";
import { videos } from "@/cardport/data/videos";
import { web3Services } from "@/cardport/data/web3";
import { getDictionary } from "@/cardport/i18n";
import { formatDate } from "@/cardport/i18n/format";
import { pick } from "@/cardport/i18n/localized";
import { isLocale, locales, type Locale } from "@/cardport/i18n/locales";
import { auditAffiliateLinks } from "@/cardport/lib/affiliate";
import { routes } from "@/cardport/lib/routes";
import { cardportMetadata } from "@/cardport/lib/seo";
import { MediaAdminBrowser } from "@/media/components";
import { wikimediaAssets } from "@/media/data/assets";
import { getMediaLabels } from "@/media/i18n/labels";

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
    title: dictionary.nav.admin,
    description: "CARD PORT operations dashboard",
    path: routes.admin(locale),
    locale,
    // 管理用のページは検索結果に出しません
    noindex: true,
  });
}

/** 情報確認日から日数を求めます。90日を超えたものは要更新として扱います */
function daysSince(iso: string): number {
  const then = new Date(`${iso}T00:00:00Z`).getTime();
  return Math.floor((Date.now() - then) / 86_400_000);
}

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dictionary = getDictionary(locale);

  const links = auditAffiliateLinks();
  const expiring = campaigns
    .map((campaign) => ({ campaign, expired: isExpired(campaign) }))
    .sort((a, b) => a.campaign.endsOn.localeCompare(b.campaign.endsOn));
  const stale = cards
    .map((card) => ({ card, age: daysSince(card.verifiedOn) }))
    .filter((entry) => entry.age > 90)
    .sort((a, b) => b.age - a.age);

  const inventory = [
    {
      label: locale === "ja" ? "カード" : "Cards",
      value: cards.length,
      href: routes.cards(locale),
    },
    {
      label: locale === "ja" ? "カテゴリ" : "Categories",
      value: cardCategories.length,
      href: routes.rankings(locale),
    },
    {
      label: locale === "ja" ? "キャンペーン" : "Campaigns",
      value: campaigns.length,
      href: routes.campaigns(locale),
    },
    { label: locale === "ja" ? "ニュース" : "News", value: news.length, href: routes.news(locale) },
    {
      label: locale === "ja" ? "動画" : "Videos",
      value: videos.length,
      href: routes.videos(locale),
    },
    {
      label: locale === "ja" ? "診断" : "Finders",
      value: diagnoses.length,
      href: routes.diagnosisIndex(locale),
    },
    {
      label: locale === "ja" ? "シミュレーター" : "Simulators",
      value: simulators.length,
      href: routes.simulatorIndex(locale),
    },
    {
      label: locale === "ja" ? "ツール" : "Tools",
      value: financialTools.length,
      href: routes.tools(locale),
    },
    {
      label: locale === "ja" ? "決済サービス" : "Payments",
      value: paymentServices.length,
      href: routes.payments(locale),
    },
    { label: "Web3", value: web3Services.length, href: routes.web3(locale) },
    {
      label: locale === "ja" ? "ガイド" : "Guides",
      value: guides.length,
      href: routes.guides(locale),
    },
    { label: "FAQ", value: faqs.length, href: routes.faq(locale) },
  ];

  return (
    <PageShell
      wide
      breadcrumbLabel={dictionary.common.breadcrumb}
      crumbs={[
        { name: dictionary.nav.home, path: routes.home(locale) },
        { name: dictionary.nav.admin, path: routes.admin(locale) },
      ]}
      eyebrow="OPERATIONS"
      title={dictionary.nav.admin}
      lead={
        locale === "ja"
          ? "掲載データの状態を監視するダッシュボードです。編集機能は、認証と権限管理を実装してから有効化してください。"
          : "A monitoring dashboard for the published data. Enable editing only after authentication and role management are in place."
      }
      notice={
        <Notice tone="warn">
          {locale === "ja"
            ? "このページは読み取り専用です。編集・公開の操作は、Supabase Auth による認証、権限管理、多要素認証、監査ログを実装したうえで追加してください（README 参照）。noindex を設定しています。"
            : "This page is read-only. Add editing only alongside Supabase Auth, role management, MFA and audit logging (see the README). The page is marked noindex."}
        </Notice>
      }
    >
      <SectionHeading
        eyebrow="INVENTORY"
        title={locale === "ja" ? "掲載件数" : "Published items"}
        accent="cyan"
      />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {inventory.map((item) => (
          <li key={item.label}>
            <Link href={item.href}>
              <Panel className="hover:border-cp-cyan/40 p-4 transition-colors">
                <StatBlock label={item.label} value={String(item.value)} accent="cyan" />
              </Panel>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <div>
          <SectionHeading
            eyebrow="AFFILIATE"
            title={locale === "ja" ? "アフィリエイトリンクの状態" : "Affiliate link status"}
            accent="gold"
          />
          <Panel className="overflow-hidden">
            <ul className="divide-cp-line/30 divide-y">
              {links.map((link) => (
                <li key={link.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="text-cp-mist text-[0.8rem]">{link.id}</span>
                  <span className="text-cp-dim text-[0.72rem]">{link.program}</span>
                  <Badge
                    accent={
                      link.status === "active"
                        ? "emerald"
                        : link.status === "expired"
                          ? "magenta"
                          : "gold"
                    }
                  >
                    {link.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </Panel>
          <p className="text-cp-dim mt-2 text-[0.72rem]">
            {locale === "ja"
              ? 'unset は未提携です。この状態では公式サイトへ rel="nofollow" の通常リンクとして遷移し、PRラベルは表示されません。'
              : 'unset means no partnership. Those links go to the official site with rel="nofollow" and carry no AD label.'}
          </p>
        </div>

        <div>
          <SectionHeading
            eyebrow="CAMPAIGN"
            title={locale === "ja" ? "キャンペーンの期限" : "Campaign deadlines"}
            accent="magenta"
          />
          <Panel className="overflow-hidden">
            <ul className="divide-cp-line/30 divide-y">
              {expiring.map(({ campaign, expired }) => (
                <li
                  key={campaign.id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5"
                >
                  <span className="text-cp-mist line-clamp-1 flex-1 text-[0.78rem]">
                    {pick(campaign.title, locale)}
                  </span>
                  <span
                    className={cx(
                      "numeric shrink-0 text-[0.74rem]",
                      expired ? "text-cp-danger" : "text-cp-emerald",
                    )}
                  >
                    {formatDate(campaign.endsOn, locale)}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <div className="mt-12">
        <SectionHeading
          eyebrow="FRESHNESS"
          title={
            locale === "ja" ? "情報確認から90日を超えたカード" : "Cards unverified for over 90 days"
          }
          accent="violet"
        />
        {stale.length === 0 ? (
          <Notice>
            {locale === "ja"
              ? "90日を超えて未確認のカードはありません。"
              : "No cards have gone unverified for more than 90 days."}
          </Notice>
        ) : (
          <Panel className="overflow-hidden">
            <ul className="divide-cp-line/30 divide-y">
              {stale.map(({ card, age }) => (
                <li key={card.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <Link
                    href={routes.card(locale, card.slug)}
                    className="text-cp-mist hover:text-cp-cyan text-[0.8rem]"
                  >
                    {pick(card.name, locale)}
                  </Link>
                  <span className="numeric text-cp-amber text-[0.74rem]">
                    {age} {locale === "ja" ? "日経過" : "days"}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>

      <div className="mt-12">
        <SectionHeading
          eyebrow="IMAGES"
          title={locale === "ja" ? "画像の確認キュー" : "Image review queue"}
          accent="cyan"
        />
        <p className="text-cp-mist mb-3 text-[0.78rem] leading-relaxed">
          {locale === "ja"
            ? "Wikimedia Commons から取得した画像は、ライセンス・作者・出典・追加権利を確認するまで掲載されません。取得できたことは、掲載してよい根拠になりません。"
            : "Images fetched from Wikimedia Commons are not published until licence, author, source and additional rights are checked. Successful retrieval is not permission to publish."}
        </p>
        <MediaAdminBrowser
          assets={wikimediaAssets}
          locale={locale}
          labels={getMediaLabels(locale)}
        />
      </div>

      <div className="mt-12">
        <SectionHeading
          eyebrow="ANALYTICS"
          title={locale === "ja" ? "アクセス解析" : "Analytics"}
          accent="electric"
        />
        <Notice>
          {locale === "ja"
            ? "PV・ユーザー数・診断完了数・アフィリエイトクリック数は、解析基盤を接続すると表示されます。クリックは data-cp-* 属性と dataLayer へ送出済みです（lib/affiliate.ts）。"
            : "Page views, finder completions and affiliate clicks appear once an analytics backend is connected. Clicks already emit data-cp-* attributes and dataLayer events (lib/affiliate.ts)."}
        </Notice>
      </div>
    </PageShell>
  );
}
