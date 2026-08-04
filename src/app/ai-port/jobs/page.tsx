import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";

import { Reveal } from "@/components/ai-port/effects/Reveal";
import { PageBody, PageHero, RelatedLinks } from "@/components/ai-port/layout/PageShell";
import {
  Badge,
  Disclaimer,
  GlassCard,
  PrimaryLink,
  SponsoredBadge,
} from "@/components/ai-port/ui/Primitives";
import { JsonLd } from "@/components/ui/JsonLd";
import { aiRoles, jobBoards } from "@/data/ai-port/careers";
import { aiPortPath } from "@/data/ai-port/site";
import { findTool } from "@/data/ai-port/tools";
import { aiPortMetadata } from "@/lib/ai-port/seo";
import { aiPortBreadcrumbJsonLd, aiPortFaqJsonLd } from "@/lib/ai-port/structured-data";

const CRUMBS = [
  { name: "AI PORT", path: "/" },
  { name: "AI求人・AI副業", path: "/jobs" },
];

const FAQS = [
  {
    q: "未経験からAI関連の仕事に就けますか？",
    a: "職種によります。AIエンジニアはWeb開発の実務経験があると最短です。一方でAI活用推進は業務知識そのものが武器になるため、本業の経験を活かして移りやすい職種です。まず自部署の業務を1つAIで自動化し、削減時間を記録するところから始めてください。",
  },
  {
    q: "AI副業はどこから始めればいいですか？",
    a: "実績として見せられるものを1つ作ることが最優先です。制作物でも、自動化の事例でも構いません。削減時間などの数字を添えられると、提案時の説得力が大きく変わります。",
  },
  {
    q: "なぜ個別の求人票を掲載していないのですか？",
    a: "募集条件は頻繁に変わり、掲載が古くなると応募者に不利益が生じるためです。AI PORTでは職種ごとに求められる要件と、実際に募集が出ている場所をまとめる方針にしています。",
  },
];

export const metadata: Metadata = aiPortMetadata({
  title: "AI求人・AI転職・AI副業ガイド｜職種別に求められること",
  description:
    "AIエンジニア／AI活用推進／データエンジニア／AIクリエイティブの4職種について、求められる要件と未経験から入る現実的な順路をまとめています。募集を探せる求人サイトも掲載。",
  path: "/jobs",
  keywords: ["AI 求人", "AI 転職", "AI 副業", "AIエンジニア 未経験", "生成AI 仕事"],
});

/**
 * AI求人・AI副業。
 *
 * ⚠ 個別の求人票は掲載しません。
 *   条件が頻繁に変わり、古い掲載は応募者の不利益になるためです。
 *   このページが提供するのは「職種ごとに何が求められるか」と「どこで探すか」です。
 * ⚠ JobPosting の構造化データも出しません（実際の求人を掲載していないため）。
 */
export default function JobsPage() {
  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="AIの仕事を"
        highlight="探す・つくる"
        description="求人票そのものは掲載していません。職種ごとに求められる要件と、未経験から入る現実的な順路、そして実際に募集が出ている場所をまとめています。"
        crumbs={CRUMBS}
      />

      <PageBody>
        <section>
          <h2 className="text-ai-white text-[1.15rem]">職種ガイド</h2>

          <ul className="mt-6 grid gap-4 lg:grid-cols-2">
            {aiRoles.map((role, index) => {
              const tools = role.toolSlugs.map((slug) => findTool(slug)).filter(Boolean);

              return (
                <Reveal key={role.id} as="li" delay={index * 60}>
                  <GlassCard className="h-full p-6">
                    <h3 className="text-ai-white text-[1.05rem]">{role.name}</h3>
                    <p className="text-ai-haze mt-3 text-[0.85rem] leading-[1.95]">
                      {role.summary}
                    </p>

                    <h4 className="font-ai-mono text-ai-dim mt-6 text-[0.6rem] tracking-[0.2em] uppercase">
                      求められること
                    </h4>
                    <ul className="mt-3 grid gap-1.5">
                      {role.requirements.map((requirement) => (
                        <li
                          key={requirement}
                          className="text-ai-mist flex gap-2 text-[0.8rem] leading-[1.8]"
                        >
                          <span aria-hidden="true" className="text-ai-cyan shrink-0">
                            ―
                          </span>
                          {requirement}
                        </li>
                      ))}
                    </ul>

                    <h4 className="font-ai-mono text-ai-dim mt-6 text-[0.6rem] tracking-[0.2em] uppercase">
                      入り方
                    </h4>
                    <p className="text-ai-haze mt-3 text-[0.82rem] leading-[1.9]">
                      {role.entryPath}
                    </p>

                    {tools.length > 0 ? (
                      <ul className="mt-5 flex flex-wrap gap-2">
                        {tools.map((tool) => (
                          <li key={tool!.slug}>
                            <a
                              href={aiPortPath(`/tools/${tool!.slug}`)}
                              className="text-ai-mist hover:text-ai-cyan inline-flex rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[0.72rem] transition-colors"
                            >
                              {tool!.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </GlassCard>
                </Reveal>
              );
            })}
          </ul>
        </section>

        <section className="mt-16 border-t border-white/8 pt-10">
          <h2 className="text-ai-white text-[1.15rem]">募集を探す場所</h2>
          <p className="text-ai-haze mt-2 text-[0.84rem]">
            AI PORTは求人の仲介を行っていません。以下は募集が掲載されているサービスへのリンクです。
          </p>

          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {jobBoards.map((board) => (
              <li key={board.id}>
                <a
                  href={board.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ai-glass ai-glass-rim group block h-full rounded-xl p-4"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="text-ai-white group-hover:text-ai-cyan text-[0.9rem] transition-colors"
                      translate="no"
                    >
                      {board.name}
                    </span>
                    {board.sponsored ? <SponsoredBadge /> : null}
                    <Badge accent={board.region === "jp" ? "cyan" : "violet"} className="ml-auto">
                      {board.region === "jp" ? "国内" : "海外"}
                    </Badge>
                  </span>
                  <span className="text-ai-haze mt-2 block text-[0.78rem] leading-[1.85]">
                    {board.focus}
                  </span>
                  <span className="text-ai-dim mt-3 flex items-center gap-1.5 text-[0.7rem]">
                    サイトへ
                    <ArrowUpRight aria-hidden="true" className="size-3" />
                  </span>
                </a>
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

        <section className="mt-14">
          <GlassCard className="p-6 sm:p-8">
            <h2 className="text-ai-white text-[1.05rem]">副業の方向を診断する</h2>
            <p className="text-ai-haze mt-2.5 text-[0.85rem] leading-[1.9]">
              使える時間と得意分野から、いちばん早く形になる方向を出します（無料・全6問・約1分）。
            </p>
            <div className="mt-6">
              <PrimaryLink href={aiPortPath("/diagnosis/side-business")}>
                AI副業診断をはじめる
              </PrimaryLink>
            </div>
          </GlassCard>
        </section>

        <Disclaimer>
          掲載している求人サイトは情報提供のみを目的としたリンクであり、AI PORT
          は各サービスの運営者ではありません。応募条件・報酬・契約内容は各サービスでご確認ください。
          収入や採用を保証するものではありません。
        </Disclaimer>

        <RelatedLinks
          items={[
            {
              href: aiPortPath("/diagnosis/side-business"),
              label: "AI副業診断",
              description: "6問・約1分で方向性が決まります。",
            },
            { href: aiPortPath("/schools"), label: "AIを学べる場所" },
            { href: aiPortPath("/tools"), label: "AIツール一覧" },
          ]}
        />
      </PageBody>

      <JsonLd data={[aiPortBreadcrumbJsonLd(CRUMBS), aiPortFaqJsonLd(FAQS)]} />
    </>
  );
}
