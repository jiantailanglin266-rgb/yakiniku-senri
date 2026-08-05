import Link from "next/link";
import { defaultLocale, localePath } from "@/portal/i18n/config";
import { getDictionary } from "@/portal/i18n/dictionaries";
import { Container, Section } from "@/portal/components/layout/Shell";
import { NeonLink } from "@/portal/components/ui/primitives";

/**
 * 404。
 *
 * `notFound()` はレンダリング中に投げられるため、この時点では
 * どの言語のページだったかを props から受け取れません。
 * 既定言語の辞書で表示し、主要な導線だけを出します。
 */
export default function PortalNotFound() {
  const locale = defaultLocale;
  const dict = getDictionary(locale);

  return (
    <Section className="pt-36">
      <Container size="text">
        <p className="eyebrow mb-3">404</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">
          <span className="text-gradient">{dict.common.notFoundTitle}</span>
        </h1>
        <p className="mt-4 text-(--color-ink-soft)">{dict.common.notFoundBody}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <NeonLink href={localePath(locale)}>{dict.common.home}</NeonLink>
          <NeonLink href={localePath(locale, "/search")} tone="outline">
            {dict.search.title}
          </NeonLink>
        </div>

        <ul className="mt-10 grid gap-2 text-sm">
          {[
            { href: "/coins", label: dict.nav.coins },
            { href: "/news", label: dict.nav.news },
            { href: "/exchanges", label: dict.nav.exchanges },
            { href: "/learn", label: dict.nav.learn },
          ].map((item) => (
            <li key={item.href}>
              <Link
                href={localePath(locale, item.href)}
                className="text-(--color-cyan-soft) underline-offset-2 hover:underline"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
