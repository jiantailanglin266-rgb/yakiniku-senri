/**
 * グローバルフッター。
 *
 * 金融メディアとして必要な開示（運営者・編集方針・評価基準・広告表示）は、
 * どのページからでも1クリックで到達できる位置に置きます。
 */
import Link from "next/link";

import { brand, channels, company } from "@/cardport/config/site";
import { footerPolicyLinks, primaryNav, secondaryNav } from "@/cardport/data/navigation";
import type { Dictionary } from "@/cardport/i18n";
import type { Locale } from "@/cardport/i18n/locales";
import { routes } from "@/cardport/lib/routes";
import { getMediaLabels } from "@/media/i18n/labels";

export function Footer({ locale, dictionary }: { locale: Locale; dictionary: Dictionary }) {
  const social = [
    { key: "youtube", label: "YouTube", href: channels.youtube },
    { key: "x", label: "X", href: channels.x },
    { key: "line", label: "LINE", href: channels.line },
    { key: "instagram", label: "Instagram", href: channels.instagram },
  ].filter((item) => item.href);

  return (
    <footer className="border-cp-line/60 relative mt-20 border-t">
      <div className="mx-auto max-w-[88rem] px-4 py-12 sm:px-6">
        {/* 広告に関する開示。フッターでも省略しません */}
        <p className="text-cp-dim border-cp-line/60 bg-cp-navy/50 mb-10 rounded-xl border px-4 py-3 text-[0.72rem] leading-relaxed">
          {dictionary.affiliate.disclosureLong}
        </p>

        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr_1.2fr]">
          <div>
            <p className="flex items-baseline gap-1 text-[1.05rem] font-semibold tracking-[0.08em]">
              <span className="text-aurora">{brand.wordmark.lead}</span>
              <span className="text-cp-ink">{brand.wordmark.tail}</span>
            </p>
            <p className="text-cp-mist mt-3 text-[0.78rem] leading-relaxed">
              {dictionary.common.siteTagline}
            </p>
            {social.length > 0 ? (
              <ul className="mt-5 flex flex-wrap gap-2">
                {social.map((item) => (
                  <li key={item.key}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass text-cp-mist hover:text-cp-ink rounded-full px-3 py-1 text-[0.72rem] transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <nav aria-label={dictionary.nav.cards}>
            <p className="text-cp-dim font-cp-mono mb-3 text-[0.66rem] tracking-[0.2em] uppercase">
              Compare
            </p>
            <ul className="space-y-2">
              {primaryNav.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href(locale)}
                    className="text-cp-mist hover:text-cp-cyan text-[0.78rem] transition-colors"
                  >
                    {dictionary.nav[item.key]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={dictionary.nav.tools}>
            <p className="text-cp-dim font-cp-mono mb-3 text-[0.66rem] tracking-[0.2em] uppercase">
              Explore
            </p>
            <ul className="space-y-2">
              {secondaryNav.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href(locale)}
                    className="text-cp-mist hover:text-cp-cyan text-[0.78rem] transition-colors"
                  >
                    {dictionary.nav[item.key]}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={routes.sitemap(locale)}
                  className="text-cp-mist hover:text-cp-cyan text-[0.78rem] transition-colors"
                >
                  {dictionary.nav.sitemap}
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label={dictionary.footer.operator}>
            <p className="text-cp-dim font-cp-mono mb-3 text-[0.66rem] tracking-[0.2em] uppercase">
              Policies
            </p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
              {footerPolicyLinks.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={routes.policy(locale, item.slug)}
                    className="text-cp-mist hover:text-cp-cyan text-[0.74rem] transition-colors"
                  >
                    {dictionary.footer[item.key]}
                  </Link>
                </li>
              ))}
              {/* 画像の作者表示をまとめて確認できるページ。常設します */}
              <li>
                <Link
                  href={routes.imageCredits(locale)}
                  className="text-cp-mist hover:text-cp-cyan text-[0.74rem] transition-colors"
                >
                  {getMediaLabels(locale).creditsTitle}
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="border-cp-line/50 text-cp-dim mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-6 text-[0.7rem]">
          <p>
            {company.legalName}
            {company.isPlaceholder ? (
              // 運営会社が未設定であることを隠しません（推測を書かない方針）
              <span className="text-cp-amber ms-2">— 未設定（公開前に設定してください）</span>
            ) : null}
          </p>
          <p>
            © {new Date().getFullYear()} {brand.name}. {dictionary.footer.copyrightNotice}
          </p>
        </div>
      </div>
    </footer>
  );
}
