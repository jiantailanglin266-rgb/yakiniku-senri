import type { Metadata } from "next";
import { Suspense } from "react";

import { PageBody, PageHero, RelatedLinks } from "@/components/ai-port/layout/PageShell";
import { GlassCard } from "@/components/ai-port/ui/Primitives";
import { JsonLd } from "@/components/ui/JsonLd";
import { aiPortPath } from "@/data/ai-port/site";
import { aiPortMetadata } from "@/lib/ai-port/seo";
import { aiPortBreadcrumbJsonLd } from "@/lib/ai-port/structured-data";
import { SearchField } from "./SearchField";

const CRUMBS = [
  { name: "AI PORT", path: "/" },
  { name: "サイト内検索", path: "/search" },
];

export const metadata: Metadata = aiPortMetadata({
  title: "サイト内検索",
  description:
    "AI PORT内のAIツール・解説記事・トピック・AI診断・よくある質問を横断して検索できます。",
  path: "/search",
  // 検索結果ページはキーワードごとにURLが無限に生えるため、インデックス対象にしません
  noindex: true,
});

/**
 * サイト内検索。
 *
 * 検索そのものはクライアント側で行います（SearchField）。
 * 理由は SearchField のコメントに書いています。
 * このページ自体は静的に配信されるため、静的エクスポートでもそのまま動きます。
 */
export default function SearchPage() {
  return (
    <>
      <PageHero
        eyebrow="Search"
        title="サイト内"
        highlight="検索"
        description="AIツール・解説記事・トピック・AI診断・よくある質問を横断して検索します。"
        crumbs={CRUMBS}
      />

      <PageBody>
        {/* useSearchParams を使うため Suspense で包みます */}
        <Suspense
          fallback={
            <GlassCard className="grid min-h-[16rem] place-items-center p-8">
              <p className="text-ai-dim text-[0.85rem]">読み込み中…</p>
            </GlassCard>
          }
        >
          <SearchField />
        </Suspense>

        <RelatedLinks
          items={[
            { href: aiPortPath("/tools"), label: "AIツール一覧" },
            { href: aiPortPath("/guides"), label: "解説記事一覧" },
            { href: aiPortPath("/chat"), label: "AIチャットで質問する" },
          ]}
        />
      </PageBody>

      <JsonLd data={[aiPortBreadcrumbJsonLd(CRUMBS)]} />
    </>
  );
}
