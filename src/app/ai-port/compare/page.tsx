import type { Metadata } from "next";

import { PageBody, PageHero, RelatedLinks } from "@/components/ai-port/layout/PageShell";
import { CompareTable } from "@/components/ai-port/tools/CompareTable";
import { Disclaimer, GlassCard } from "@/components/ai-port/ui/Primitives";
import { JsonLd } from "@/components/ui/JsonLd";
import { aiPortPath } from "@/data/ai-port/site";
import { toolCategories } from "@/data/ai-port/taxonomy";
import { aiPortMetadata } from "@/lib/ai-port/seo";
import { aiPortBreadcrumbJsonLd, aiPortFaqJsonLd } from "@/lib/ai-port/structured-data";

const CRUMBS = [
  { name: "AI PORT", path: "/" },
  { name: "AIツール比較", path: "/compare" },
];

/** 画面に表示している内容と完全に一致させます（構造化データとの食い違いを作らない）。 */
const FAQS = [
  {
    q: "なぜ料金の金額が載っていないのですか？",
    a: "生成AIの料金は数か月単位で変わるためです。掲載時点で正しくても、読者が見る時点では古くなっている可能性が高く、誤った金額での比較は実害につながります。AI PORTでは「無料あり／有料」の区分だけを掲載し、金額は各公式サイトで確認していただく方針にしています。",
  },
  {
    q: "「未確認」とはどういう意味ですか？",
    a: "編集部が公式情報で裏取りできていない項目です。空欄にすると「なし」と読まれてしまうため、あえて「未確認」と明示しています。推測で「あり」「なし」を埋めることはしていません。",
  },
  {
    q: "AIツールは何を基準に選べばいいですか？",
    a: "料金より先に、入力したデータが学習に使われるか、日本語での出力品質が業務水準か、既存の業務ツールと接続できるかの3点を確認してください。これらは簡単には変わらないため、長く効く選定軸になります。",
  },
  {
    q: "複数のAIツールを併用すべきですか？",
    a: "最初は1つに絞ることを勧めます。使い分けの判断そのものが負荷になるためです。1つを使い込んで限界が見えてから、2つ目を足してください。",
  },
];

export const metadata: Metadata = aiPortMetadata({
  title: "AIツール比較表｜日本語対応・API・無料枠・法人プラン",
  description:
    "カテゴリー別にAIツールを横並びで比較できます。料金の金額ではなく、長く効く選定軸（日本語UI・API提供・スマホアプリ・法人プラン・無料枠）で比べられる比較表です。",
  path: "/compare",
  keywords: ["AIツール 比較", "生成AI 比較表", "チャットAI 比較", "画像生成AI 比較"],
});

export default function ComparePage() {
  return (
    <>
      <PageHero
        eyebrow="Compare"
        title="AIツール"
        highlight="比較表"
        description="料金の金額ではなく、導入後に効く軸で比べます。カテゴリーを切り替えると、その分野の代表的なツールが並びます。"
        crumbs={CRUMBS}
      />

      <PageBody>
        <CompareTable />

        <section className="mt-16 border-t border-white/8 pt-10">
          <h2 className="text-ai-white text-[1.15rem]">比較で見るべき順番</h2>
          <ol className="mt-6 grid gap-3">
            {[
              {
                title: "入力したデータの取り扱い",
                body: "学習に使われるか、設定で無効化できるか。業務利用ではここが最初の関門です。",
              },
              {
                title: "日本語での出力品質",
                body: "デモではなく自社の実データで試してください。公開デモはそのツールが得意な例で作られています。",
              },
              {
                title: "既存ツールとの接続",
                body: "APIや連携機能があるか。接続できないツールは、結局使われなくなります。",
              },
              {
                title: "無料枠でどこまで試せるか",
                body: "契約前に、典型例・難しい例・例外の3件で検証できるかどうか。",
              },
              {
                title: "料金",
                body: "最後に確認します。導入時点の価格差は、半年後には意味を失っていることが珍しくありません。",
              },
            ].map((step, index) => (
              <li key={step.title}>
                <GlassCard className="flex gap-4 p-5">
                  <span
                    className="font-ai-display from-ai-cyan to-ai-violet shrink-0 bg-gradient-to-br bg-clip-text text-[1.3rem] leading-none font-bold text-transparent"
                    translate="no"
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-ai-white text-[0.92rem]">{step.title}</h3>
                    <p className="text-ai-haze mt-1.5 text-[0.82rem] leading-[1.9]">{step.body}</p>
                  </div>
                </GlassCard>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16 border-t border-white/8 pt-10">
          <h2 className="text-ai-white text-[1.15rem]">よくある質問</h2>
          <dl className="mt-6 grid gap-4">
            {FAQS.map((faq) => (
              <div key={faq.q}>
                <dt className="text-ai-white text-[0.92rem] leading-[1.7]">{faq.q}</dt>
                <dd className="text-ai-haze mt-2 text-[0.84rem] leading-[1.95]">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <Disclaimer>
          比較表の内容は公開情報にもとづく編集部の整理であり、各提供元の公式見解ではありません。
          機能・提供状況は変更されることがあります。
        </Disclaimer>

        <RelatedLinks
          items={[
            {
              href: aiPortPath("/tools"),
              label: `AIツール一覧（${toolCategories.length}カテゴリー）`,
            },
            { href: aiPortPath("/ranking"), label: "注目度ランキング" },
            { href: aiPortPath("/guides/choose-ai-tool"), label: "AIツールの選び方 — 7項目" },
          ]}
        />
      </PageBody>

      <JsonLd data={[aiPortBreadcrumbJsonLd(CRUMBS), aiPortFaqJsonLd(FAQS)]} />
    </>
  );
}
