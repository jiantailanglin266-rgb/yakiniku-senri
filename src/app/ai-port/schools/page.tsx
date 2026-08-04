import type { Metadata } from "next";
import { ArrowUpRight, Check } from "lucide-react";

import { Reveal } from "@/components/ai-port/effects/Reveal";
import { PageBody, PageHero, RelatedLinks } from "@/components/ai-port/layout/PageShell";
import { Badge, Disclaimer, GlassCard, SponsoredBadge } from "@/components/ai-port/ui/Primitives";
import { JsonLd } from "@/components/ui/JsonLd";
import { schoolChecklist, schools } from "@/data/ai-port/careers";
import { aiPortPath } from "@/data/ai-port/site";
import { aiPortMetadata } from "@/lib/ai-port/seo";
import { aiPortBreadcrumbJsonLd, aiPortFaqJsonLd } from "@/lib/ai-port/structured-data";

const CRUMBS = [
  { name: "AI PORT", path: "/" },
  { name: "AIスクール・学習", path: "/schools" },
];

const FAQS = [
  {
    q: "AIスクールの料金が載っていないのはなぜですか？",
    a: "料金・期間・返金条件を公式ページで確認できたものだけを掲載する方針のためです。現時点では、無料で確実に学べる公式リソースのみを掲載しています。有料スクールを追加する場合は、確認日を明記した上で掲載します。",
  },
  {
    q: "無料の学習リソースだけで実務レベルになれますか？",
    a: "職種によります。ツールの活用であれば無料リソースで十分に到達できます。開発職としてLLMアプリを作る場合も、公式の実装講座で基礎は学べます。決め手になるのは教材の質より、実際に自分の課題を1つ解いて公開できるかどうかです。",
  },
  {
    q: "スクールを選ぶときに最初に確認すべきことは何ですか？",
    a: "「修了時に何が作れるようになるか」が成果物で明示されているかです。「AIがわかる」といった表現しかない場合、内容を受講前に判断できません。次にカリキュラムの公開有無と教材の更新日を確認してください。",
  },
];

export const metadata: Metadata = aiPortMetadata({
  title: "AIスクール・学習リソース｜選び方のチェックリスト付き",
  description:
    "無料で確実に学べるAIの公式学習リソース（Google Cloud Skills Boost・Microsoft Learn・DeepLearning.AI・Hugging Face Learn・Kaggle Learn）と、有料スクールを選ぶ際に確認すべき6項目のチェックリストを掲載しています。",
  path: "/schools",
  keywords: ["AIスクール", "AI 学習", "生成AI 講座", "AI 独学", "AI 資格"],
});

/**
 * AIスクール・学習リソース。
 *
 * ⚠ 料金・受講生数・就職率は掲載しません。
 *   変動が激しく、裏取りなしに載せると優良誤認になります。
 *   現時点で掲載しているのは、無料で確実に学べる公式リソースだけです。
 *   有料スクールを追加するときは data/ai-port/careers.ts のコメントに従ってください。
 */
export default function SchoolsPage() {
  return (
    <>
      <PageHero
        eyebrow="Learn"
        title="AIを"
        highlight="学ぶ"
        description="まずは無料で確実に学べる公式リソースを掲載しています。有料スクールを検討する際は、下のチェックリストで比較してください。"
        crumbs={CRUMBS}
      />

      <PageBody>
        <section>
          <h2 className="text-ai-white text-[1.15rem]">無料で学べる公式リソース</h2>

          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {schools.map((school, index) => (
              <Reveal key={school.id} as="li" delay={index * 55}>
                <GlassCard className="group relative flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    {school.free ? (
                      <Badge accent="mint">無料</Badge>
                    ) : (
                      <Badge accent="amber">有料</Badge>
                    )}
                    {school.sponsored ? <SponsoredBadge /> : null}
                  </div>

                  <h3 className="text-ai-white mt-4 text-[1rem]" translate="no">
                    <a
                      href={school.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group-hover:text-ai-cyan transition-colors after:absolute after:inset-0"
                    >
                      {school.name}
                    </a>
                  </h3>
                  <p className="text-ai-dim mt-1 text-[0.7rem]" translate="no">
                    {school.provider}
                  </p>

                  <p className="text-ai-haze mt-3 text-[0.82rem] leading-[1.9]">{school.summary}</p>

                  <p className="text-ai-mist mt-auto pt-5 text-[0.76rem]">
                    向いている人：{school.target}
                  </p>
                  <p className="text-ai-dim mt-3 flex items-center gap-1.5 text-[0.7rem]">
                    公式サイトへ
                    <ArrowUpRight aria-hidden="true" className="size-3" />
                  </p>
                </GlassCard>
              </Reveal>
            ))}
          </ul>
        </section>

        <section className="mt-16 border-t border-white/8 pt-10">
          <h2 className="text-ai-white text-[1.15rem]">有料スクールを選ぶときの6項目</h2>
          <p className="text-ai-haze mt-2 text-[0.84rem]">
            体験談や評判より先に、この6つを公式ページで確認してください。
          </p>

          <ul className="mt-6 grid gap-3">
            {schoolChecklist.map((item) => (
              <li key={item.id}>
                <GlassCard className="flex items-start gap-4 p-5">
                  <Check aria-hidden="true" className="text-ai-mint mt-0.5 size-4 shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-ai-white text-[0.9rem] leading-[1.7]">{item.label}</h3>
                    <p className="text-ai-haze mt-1.5 text-[0.8rem] leading-[1.9]">{item.why}</p>
                  </div>
                </GlassCard>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16 border-t border-white/8 pt-10">
          <h2 className="text-ai-white text-[1.15rem]">よくある質問</h2>
          <dl className="mt-6 grid gap-5 lg:grid-cols-3">
            {FAQS.map((faq) => (
              <div key={faq.q}>
                <dt className="text-ai-white text-[0.9rem] leading-[1.7]">{faq.q}</dt>
                <dd className="text-ai-haze mt-2 text-[0.83rem] leading-[1.95]">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <Disclaimer>
          掲載しているのは各サービスの公開情報にもとづく整理です。学習効果・受講後の成果を保証するものではありません。
          受講条件・料金・返金条件は必ず各公式サイトでご確認ください。
        </Disclaimer>

        <RelatedLinks
          items={[
            { href: aiPortPath("/diagnosis/level"), label: "AIレベル診断で現在地を知る" },
            { href: aiPortPath("/jobs"), label: "AIの仕事を探す" },
            { href: aiPortPath("/guides"), label: "解説記事を読む" },
          ]}
        />
      </PageBody>

      <JsonLd data={[aiPortBreadcrumbJsonLd(CRUMBS), aiPortFaqJsonLd(FAQS)]} />
    </>
  );
}
