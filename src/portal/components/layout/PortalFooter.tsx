import Link from "next/link";
import { localePath } from "@/portal/i18n/config";
import { footerNav } from "@/portal/data/site-content";
import { brand, socialEntries } from "@/portal/lib/site";
import { t } from "@/portal/lib/format";
import type { Dictionary } from "@/portal/i18n/dictionaries";
import { NoticeBox } from "@/portal/components/ui/primitives";

/**
 * グローバルフッター。
 *
 * 金融メディアとして、リスクに関する注記とアフィリエイトの明示を
 * 全ページの最下部に常時置きます。ページごとに出し分けません。
 */
export function PortalFooter({ locale, dict }: { locale: string; dict: Dictionary }) {
  const year = new Date().getUTCFullYear();

  return (
    <footer className="mt-24 border-t border-(--color-hairline) pt-12 pb-10">
      <div className="mx-auto max-w-[110rem] px-4 sm:px-6">
        <NoticeBox tone="amber" title={dict.footer.disclaimerTitle}>
          <p>{dict.footer.disclaimer}</p>
          <p className="mt-2">{dict.footer.affiliateNote}</p>
        </NoticeBox>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <p className="font-display text-lg font-semibold">
              <span className="text-gradient">{brand.nameParts[0]}</span>
              {brand.nameParts[1] ? (
                <span className="ms-1 text-(--color-ink-soft)">
                  {brand.nameParts.slice(1).join(" ")}
                </span>
              ) : null}
            </p>
            <p className="mt-2 text-sm text-(--color-ink-dim)">{dict.hero.eyebrow}</p>

            {socialEntries.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {socialEntries.map(([key, url]) => (
                  <li key={key}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass rounded-full px-3 py-1.5 text-xs capitalize transition-colors hover:text-white"
                    >
                      {key}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {footerNav.map((group) => (
            <nav key={group.title.ja} aria-label={t(group.title, locale)}>
              <h2 className="mb-3 text-sm font-semibold">{t(group.title, locale)}</h2>
              <ul className="grid gap-1.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={localePath(locale, item.href)}
                      className="text-sm text-(--color-ink-dim) transition-colors hover:text-(--color-ink)"
                    >
                      {t(item.label, locale)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="mt-10 border-t border-(--color-hairline) pt-6 text-xs text-(--color-ink-dim)">
          © {year} {brand.name}. {dict.footer.copyright}
        </p>
      </div>
    </footer>
  );
}
