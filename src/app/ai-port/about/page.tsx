import type { Metadata } from "next";
import Link from "next/link";

import { PageBody, PageHero, RelatedLinks } from "@/components/ai-port/layout/PageShell";
import { GlassCard } from "@/components/ai-port/ui/Primitives";
import { JsonLd } from "@/components/ui/JsonLd";
import { getArticles } from "@/data/ai-port/articles";
import { officialFeeds, vendors } from "@/data/ai-port/feeds";
import { aiPortName, aiPortPath } from "@/data/ai-port/site";
import { topics } from "@/data/ai-port/taxonomy";
import { tools } from "@/data/ai-port/tools";
import { aiPortMetadata } from "@/lib/ai-port/seo";
import { aiPortBreadcrumbJsonLd, aiPortFaqJsonLd } from "@/lib/ai-port/structured-data";

const CRUMBS = [
  { name: "AI PORT", path: "/" },
  { name: "運営者情報・編集方針", path: "/about" },
];

const FAQS = [
  {
    q: "情報はどうやって集めていますか？",
    a: "ニュースは各社の公式ブログのRSSと、日本語のニュース検索RSSから自動収集しています。ツール情報と解説記事は編集部が公開情報を確認して作成しています。",
  },
  {
    q: "誤りを見つけた場合はどうすればいいですか？",
    a: "運営元サイトのお問い合わせからご連絡ください。事実誤認が確認できた場合は、該当箇所を修正し、記事の更新日を改めます。",
  },
  {
    q: "AI PORTは各AIサービスと関係がありますか？",
    a: "ありません。AI PORTは独立した情報サイトであり、掲載しているサービスの提供元・代理店ではありません。",
  },
];

export const metadata: Metadata = aiPortMetadata({
  title: "運営者情報・編集方針",
  description: `${aiPortName}の運営方針、情報の収集方法、事実確認のルール、ランキングの算出方法、広告の取り扱いについて説明しています。`,
  path: "/about",
});

/**
 * 運営者情報・編集方針。
 *
 * ■ このページの役割
 *   E-E-A-T（経験・専門性・権威性・信頼性）と LLMO の両方で参照されます。
 *   「誰が、どうやって、何を根拠に書いているか」を1ページで説明します。
 *   ここが曖昧なサイトは、検索エンジンにも生成AIにも信頼されません。
 */
export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="運営者情報・"
        highlight="編集方針"
        description="何を、どうやって集め、何を載せないと決めているか。判断の基準をすべて公開します。"
        crumbs={CRUMBS}
      />

      <PageBody className="max-w-4xl">
        <section>
          <h2 className="text-ai-white text-[1.2rem]">AI PORTとは</h2>
          <p className="text-ai-mist mt-4 text-[0.9rem] leading-[2.05]">
            AI
            PORT（AIポート）は、AIニュース・AIツール・AIエージェント・Web3の情報を1か所に集めるAIポータルメディアです。
            現在、{tools.length}件のAIツール、{topics.length}分野のトピックハブ、
            {getArticles().length}本の解説記事、5種類の無料AI診断を掲載しています。
          </p>
        </section>

        <section className="mt-14">
          <h2 className="text-ai-white text-[1.2rem]">情報の集め方</h2>

          <div className="mt-6 grid gap-4">
            <GlassCard className="p-6">
              <h3 className="text-ai-white text-[0.98rem]">ニュース（自動収集）</h3>
              <p className="text-ai-haze mt-2.5 text-[0.85rem] leading-[1.95]">
                以下の公式ブログのRSSを直接読み込み、あわせて日本語のニュース検索RSSを
                {vendors.length}
                社ぶん取得しています。掲載するのは見出し・要約の一部・配信元・日時だけで、
                本文は保存していません。見出しをクリックすると必ず配信元の記事へ移動します。
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {officialFeeds.map((feed) => (
                  <li
                    key={feed.id}
                    className="text-ai-mist rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[0.73rem]"
                    translate="no"
                  >
                    {feed.label}
                  </li>
                ))}
              </ul>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-ai-white text-[0.98rem]">ツール情報・解説記事（編集部）</h3>
              <p className="text-ai-haze mt-2.5 text-[0.85rem] leading-[1.95]">
                各サービスの公式サイト・公式ドキュメントで確認できた内容のみを掲載しています。
                確認できていない項目は空欄にせず「未確認」と明示します。推測で埋めることはしません。
              </p>
            </GlassCard>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-ai-white text-[1.2rem]">載せないと決めていること</h2>
          <ul className="mt-6 grid gap-3">
            {[
              {
                title: "AIツールの料金の金額",
                body: "生成AIの料金は数か月単位で変わります。掲載時点で正しくても、読者が見る時点では古くなっている可能性が高く、誤った金額での比較は実害につながります。「無料あり／有料」の区分だけを掲載し、金額は各公式サイトで確認していただきます。",
              },
              {
                title: "レビュー点数・星の数",
                body: "実データのないAggregateRating / Reviewを出すことはGoogleのポリシー違反であり、優良誤認にもあたります。順位づけは公開している計算式のみで行っています。",
              },
              {
                title: "イベントの開催日",
                body: "日程は毎年変わり、直前に変更されることもあります。古い日付は来場者への実害になるため、季節の目安だけを掲載し、確定日程は公式サイトへ送ります。",
              },
              {
                title: "個別の求人票・スクールの料金",
                body: "条件が頻繁に変わり、掲載が古くなると応募者・受講者の不利益になります。求められる要件と選び方の基準を提供する方針にしています。",
              },
              {
                title: "PV・会員数などの持っていない数字",
                body: "計測していない数字は表示しません。「人気記事」も、PVを取得していないため掲載していません。",
              },
            ].map((rule) => (
              <li key={rule.title}>
                <GlassCard className="p-5">
                  <h3 className="text-ai-white text-[0.92rem]">{rule.title}</h3>
                  <p className="text-ai-haze mt-2 text-[0.83rem] leading-[1.95]">{rule.body}</p>
                </GlassCard>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14">
          <h2 className="text-ai-white text-[1.2rem]">ランキングの算出方法</h2>
          <p className="text-ai-mist mt-4 text-[0.88rem] leading-[2]">
            注目度スコアは「直近のニュースでの言及数（実測）」と「編集部の選定基準」の合計で算出しています。
            アフィリエイト報酬の有無はスコアに一切影響しません。 計算式と各ツールの内訳は
            <Link
              href={aiPortPath("/ranking")}
              className="text-ai-cyan mx-1 underline underline-offset-4"
            >
              ランキングページ
            </Link>
            にすべて掲載しています。
          </p>
        </section>

        <section className="mt-14">
          <h2 className="text-ai-white text-[1.2rem]">広告・アフィリエイトの取り扱い</h2>
          <p className="text-ai-mist mt-4 text-[0.88rem] leading-[2]">
            対価を受け取っているリンク・枠には必ず「PR」と表示します。掲載順位や評価を報酬額で変えることはありません。
            詳細は
            <Link
              href={aiPortPath("/disclosure")}
              className="text-ai-cyan mx-1 underline underline-offset-4"
            >
              広告掲載について
            </Link>
            をご覧ください。
          </p>
        </section>

        <section className="mt-14" id="contact">
          <h2 className="text-ai-white text-[1.2rem]">お問い合わせ・訂正のご連絡</h2>
          <p className="text-ai-mist mt-4 text-[0.88rem] leading-[2]">
            記載内容の誤り、掲載の削除依頼、取材のご相談は、運営元サイトのお問い合わせよりご連絡ください。
            事実誤認が確認できた場合は該当箇所を修正し、更新日を改めます。
          </p>
          <p className="mt-5">
            <Link
              href="/contact"
              className="text-ai-mist hover:text-ai-cyan inline-flex rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-[0.82rem] transition-colors hover:border-white/30"
            >
              お問い合わせページへ
            </Link>
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

        <RelatedLinks
          items={[
            { href: aiPortPath("/disclosure"), label: "広告掲載について" },
            { href: aiPortPath("/ranking"), label: "ランキングの計算方法" },
            { href: aiPortPath("/news"), label: "収集している一次情報" },
          ]}
        />
      </PageBody>

      <JsonLd data={[aiPortBreadcrumbJsonLd(CRUMBS), aiPortFaqJsonLd(FAQS)]} />
    </>
  );
}
