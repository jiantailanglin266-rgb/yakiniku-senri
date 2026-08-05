import type { Metadata } from "next";
import Link from "next/link";

import { defaultLocale, localePath } from "@/portal/i18n/config";
import { getDictionary } from "@/portal/i18n/dictionaries";

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

/**
 * 404 ページ。
 *
 * ルート直下に置きます。`[locale]` の中に置くと `/_not-found` から
 * 参照されず、静的書き出しの 404.html が Next.js 既定の英語ページになります。
 *
 * ■ 言語について
 *   存在しないURLには言語セグメントが無いことがあるため、既定の言語で出します。
 *   ルートレイアウトは `<html>`/`<body>` だけなので、外枠はここで付けます。
 */
export default function NotFound() {
  const dict = getDictionary(defaultLocale);

  return (
    <div className="portal-root flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="bg-deep" aria-hidden="true" />

      <p className="font-mono text-sm tracking-[0.3em] text-(--color-ink-dim) uppercase">404</p>
      <h1 className="text-2xl sm:text-3xl">{dict.common.notFoundTitle}</h1>
      <p className="max-w-md text-sm text-(--color-ink-soft)">{dict.common.notFoundBody}</p>

      <Link
        href={localePath(defaultLocale, "/")}
        className="glass-strong rounded-full px-5 py-2.5 text-sm transition-colors hover:bg-white/5"
      >
        {dict.common.home}
      </Link>
    </div>
  );
}
