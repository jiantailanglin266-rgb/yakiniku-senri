import type { ReactNode } from "react";
import { PageHero } from "@/components/page/PageHero";
import { JsonLd } from "@/components/ui/JsonLd";
import { LinkButton } from "@/components/ui/Button";
import { breadcrumbJsonLd, type Crumb } from "@/lib/structured-data";
import { media } from "@/data/media";

type Props = {
  en: string;
  ja: string;
  lead?: string;
  crumbs: Crumb[];
  children: ReactNode;
  /** 最終改定日（YYYY-MM-DD） */
  updatedAt?: string;
};

/**
 * 法的ページ共通レイアウト。
 * 本文は読みやすさ優先で、装飾を抑えた組みにしています。
 */
export function LegalLayout({ en, ja, lead, crumbs, children, updatedAt }: Props) {
  return (
    <>
      <PageHero en={en} ja={ja} lead={lead} image={media.pageHero.legal} crumbs={crumbs} />

      <div className="pb-16">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <div className="text-gray [&_a]:text-gold [&_h2]:text-ivory [&_h3]:text-ivory/90 space-y-10 text-[0.86rem] leading-[2.15] [&_a]:underline [&_a]:underline-offset-4 [&_h2]:text-[1.05rem] [&_h3]:text-[0.95rem] [&_li]:mb-2 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_p]:mt-4 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
            {children}
          </div>

          {updatedAt ? (
            <p className="text-gray-dark mt-14 text-[0.72rem]">
              最終改定日：<time dateTime={updatedAt}>{updatedAt.replace(/-/g, ".")}</time>
            </p>
          ) : null}

          <div className="mt-12">
            <LinkButton href="/">トップページへ戻る</LinkButton>
          </div>
        </div>
      </div>

      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </>
  );
}
