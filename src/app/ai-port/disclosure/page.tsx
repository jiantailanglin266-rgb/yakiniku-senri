import type { Metadata } from "next";
import Link from "next/link";

import { PageBody, PageHero, RelatedLinks } from "@/components/ai-port/layout/PageShell";
import { GlassCard, SponsoredBadge } from "@/components/ai-port/ui/Primitives";
import { JsonLd } from "@/components/ui/JsonLd";
import { adSlots } from "@/data/ai-port/ads";
import { aiPortName, aiPortPath } from "@/data/ai-port/site";
import { aiPortMetadata } from "@/lib/ai-port/seo";
import { aiPortBreadcrumbJsonLd, aiPortFaqJsonLd } from "@/lib/ai-port/structured-data";

const CRUMBS = [
  { name: "AI PORT", path: "/" },
  { name: "広告掲載について", path: "/disclosure" },
];

const FAQS = [
  {
    q: "広告が含まれるリンクはどう見分けられますか？",
    a: "対価を受け取っているリンク・枠には必ず「PR」と表示しています。表示のないリンクは、対価を受け取っていない通常のリンクです。",
  },
  {
    q: "報酬の高いサービスが上位に表示されることはありますか？",
    a: "ありません。ランキングの計算式にアフィリエイトの有無は含まれていません。計算式はランキングページに全文を掲載しています。",
  },
  {
    q: "現在、広告は掲載されていますか？",
    a: "現時点では広告枠を掲載していません。今後掲載する場合は、この方針に従って「PR」表示を行います。",
  },
];

export const metadata: Metadata = aiPortMetadata({
  title: "広告掲載について（アフィリエイト表示）",
  description: `${aiPortName}における広告・アフィリエイトの取り扱い方針です。対価を受け取っているリンクには「PR」を明示し、掲載順位や評価を報酬額で変えることはありません。`,
  path: "/disclosure",
});

/**
 * 広告・アフィリエイトの表示（景品表示法・ステマ規制対応）。
 *
 * 「広告であることを、消費者が広告と分かる形で示す」ことが法令上の要請です。
 * このページで方針を示し、実際の枠には <SponsoredBadge /> が「PR」を出します。
 */
export default function DisclosurePage() {
  return (
    <>
      <PageHero
        eyebrow="Disclosure"
        title="広告掲載"
        highlight="について"
        description="対価を受け取っているリンク・枠には必ず「PR」と表示します。掲載順位や評価を報酬額で変えることはありません。"
        crumbs={CRUMBS}
      />

      <PageBody className="max-w-4xl">
        <GlassCard className="p-6 sm:p-8">
          <h2 className="text-ai-white text-[1.05rem]">表示の例</h2>
          <p className="text-ai-haze mt-3 text-[0.85rem] leading-[1.95]">
            対価を受け取っているリンク・枠の近くには、次のラベルを表示します。
          </p>
          <p className="mt-5 flex items-center gap-3">
            <SponsoredBadge />
            <span className="text-ai-mist text-[0.82rem]">
              ← このラベルがあるものは、広告・アフィリエイトを含みます。
            </span>
          </p>
        </GlassCard>

        <section className="mt-14">
          <h2 className="text-ai-white text-[1.2rem]">運用のルール</h2>
          <ol className="mt-6 grid gap-3">
            {[
              {
                title: "PR表示を必ず行う",
                body: "対価を受け取っている枠には「PR」を表示します。表示は自動で描画され、個別に外すことはできません。",
              },
              {
                title: "順位・評価を報酬で変えない",
                body: "ランキングのスコア計算はアフィリエイトの有無を一切参照していません。計算式はランキングページで公開しています。",
              },
              {
                title: "記事本文と広告を視覚的に区別する",
                body: "広告枠は本文と異なる見た目にし、記事の一部と誤認されないようにします。",
              },
              {
                title: "実在しない広告を置かない",
                body: "デモンストレーション目的でも、実際に契約していない広告を掲載することはしません（不当表示にあたるためです）。",
              },
            ].map((rule, index) => (
              <li key={rule.title}>
                <GlassCard className="flex gap-4 p-5">
                  <span
                    className="font-ai-display from-ai-cyan to-ai-violet shrink-0 bg-gradient-to-br bg-clip-text text-[1.2rem] leading-none font-bold text-transparent"
                    translate="no"
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-ai-white text-[0.92rem]">{rule.title}</h3>
                    <p className="text-ai-haze mt-1.5 text-[0.83rem] leading-[1.95]">{rule.body}</p>
                  </div>
                </GlassCard>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14">
          <h2 className="text-ai-white text-[1.2rem]">現在の掲載状況</h2>
          <p className="text-ai-mist mt-4 text-[0.88rem] leading-[2]">
            {adSlots.length === 0
              ? "現時点では、広告枠を掲載していません。今後掲載する場合は、上記のルールに従って「PR」表示を行います。"
              : `現在 ${adSlots.length} 件の広告枠を掲載しています。いずれも「PR」表示を行っています。`}
          </p>
        </section>

        <section className="mt-14">
          <h2 className="text-ai-white text-[1.2rem]">よくある質問</h2>
          <dl className="mt-6 grid gap-5">
            {FAQS.map((faq) => (
              <div key={faq.q}>
                <dt className="text-ai-white text-[0.92rem] leading-[1.7]">{faq.q}</dt>
                <dd className="text-ai-haze mt-2 text-[0.85rem] leading-[1.95]">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="text-ai-dim mt-12 text-[0.78rem] leading-[1.95]">
          ご不明な点は
          <Link href="/contact" className="text-ai-mist mx-1 underline underline-offset-4">
            お問い合わせ
          </Link>
          よりご連絡ください。
        </p>

        <RelatedLinks
          items={[
            { href: aiPortPath("/about"), label: "運営者情報・編集方針" },
            { href: aiPortPath("/ranking"), label: "ランキングの計算方法" },
            { href: aiPortPath("/tools"), label: "AIツール一覧" },
          ]}
        />
      </PageBody>

      <JsonLd data={[aiPortBreadcrumbJsonLd(CRUMBS), aiPortFaqJsonLd(FAQS)]} />
    </>
  );
}
