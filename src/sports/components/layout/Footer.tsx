/**
 * グローバルフッター。
 *
 * 法務ページは「探しにいく」ものではなく「常にそこにある」べきなので、
 * 全ページのフッターに全件を並べています。
 */
import Link from "next/link";
import { brand, monetization, socials } from "../../config/site";
import { getDictionary } from "../../i18n";
import type { Locale } from "../../i18n/locales";
import { href } from "../../lib/url";

export function Footer({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale.code);

  const columns: { title: string; links: { path: string; label: string }[] }[] = [
    {
      title: dict.navMatches,
      links: [
        { path: "/live", label: dict.navLive },
        { path: "/matches", label: dict.navMatches },
        { path: "/leagues", label: dict.navLeagues },
        { path: "/search", label: dict.navSearch },
      ],
    },
    {
      title: dict.navNews,
      links: [
        { path: "/news", label: dict.navNews },
        { path: "/videos", label: dict.navVideos },
        { path: "/videos/shorts", label: dict.shorts },
        { path: "/guide", label: dict.navGuide },
      ],
    },
    {
      title: dict.navStreaming,
      links: [
        { path: "/streaming", label: dict.navStreaming },
        { path: "/web3", label: dict.navWeb3 },
        { path: "/fan-tokens", label: dict.sectionFanTokens },
        { path: "/nfts", label: dict.sectionNfts },
        { path: "/diagnosis", label: dict.navDiagnosis },
        { path: "/betting", label: dict.navBetting },
      ],
    },
    {
      title: locale.code === "ja" ? "サイトについて" : "About",
      links: [
        { path: "/legal/about", label: dict.footerAbout },
        { path: "/legal/editorial-policy", label: dict.footerEditorial },
        { path: "/legal/ad-policy", label: dict.footerAdPolicy },
        { path: "/legal/affiliate-policy", label: dict.footerAffiliate },
        { path: "/legal/betting-policy", label: dict.footerBettingPolicy },
        { path: "/legal/responsible-use", label: dict.footerResponsible },
      ],
    },
    {
      title: locale.code === "ja" ? "規約・方針" : "Policies",
      links: [
        { path: "/legal/disclaimer", label: dict.footerDisclaimer },
        { path: "/legal/privacy", label: dict.footerPrivacy },
        { path: "/legal/terms", label: dict.footerTerms },
        { path: "/legal/cookie", label: dict.footerCookie },
        { path: "/legal/copyright", label: dict.footerCopyright },
        { path: "/image-credits", label: dict.footerImageCredits },
        { path: "/legal/contact", label: dict.footerContact },
        { path: "/legal/correction", label: dict.footerCorrection },
        { path: "/sitemap", label: dict.footerSitemap },
      ],
    },
  ];

  const socialLinks = Object.entries(socials).filter(([, url]) => Boolean(url));

  return (
    <footer className="border-edge bg-abyss/70 mt-20 border-t">
      <div className="mx-auto max-w-[110rem] px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2">
              <span
                className="sp-mono text-void grid size-8 place-items-center rounded-lg text-xs font-bold"
                style={{
                  background: "linear-gradient(135deg, var(--color-cyan), var(--color-indigo))",
                }}
                aria-hidden="true"
              >
                {brand.mark}
              </span>
              <span className="text-ink text-sm font-extrabold">{brand.name}</span>
            </div>
            <p className="text-ink-faint mt-3 text-xs leading-relaxed">
              {locale.code === "ja" ? brand.tagline.ja : brand.tagline.en}
            </p>
            {socialLinks.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {socialLinks.map(([key, url]) => (
                  <li key={key}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sp-mono border-edge text-ink-dim hover:border-cyan/60 hover:text-cyan rounded-md border px-2 py-1 text-[0.625rem] uppercase transition-colors"
                    >
                      {key}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="sp-eyebrow mb-3">{column.title}</h2>
              <ul className="space-y-1.5">
                {column.links.map((link) => (
                  <li key={link.path}>
                    <Link
                      href={href(locale.code, link.path)}
                      className="text-ink-dim hover:text-cyan text-xs transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="border-edge text-ink-faint mt-10 space-y-2 border-t pt-6 text-[0.6875rem] leading-relaxed">
          <p>{dict.affiliateDisclosure}</p>
          <p>{dict.footerLegalNote}</p>
          <p>
            {monetization.disclosureLabel[locale.code === "ja" ? "ja" : "en"]}：
            {locale.code === "ja"
              ? "「PR」表記のあるリンクは広告です。掲載順位が報酬額で決まることはありません。"
              : "Links marked as ads are paid placements. Commission never determines ranking."}
          </p>
          <p className="sp-mono pt-2">
            ©{" "}
            {new Date(
              process.env.NEXT_PUBLIC_SPORTS_REFERENCE_DAY || "2026-01-01",
            ).getUTCFullYear()}{" "}
            {brand.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
