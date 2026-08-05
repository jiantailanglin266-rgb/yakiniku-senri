import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Reveal } from "@/components/ai-port/effects/Reveal";
import { PageBody, PageHero, RelatedLinks } from "@/components/ai-port/layout/PageShell";
import { JsonLd } from "@/components/ui/JsonLd";
import { diagnoses } from "@/data/ai-port/diagnosis";
import { aiPortPath, aiPortUrl } from "@/data/ai-port/site";
import { accentClass } from "@/data/ai-port/taxonomy";
import { aiPortMetadata } from "@/lib/ai-port/seo";
import { aiPortBreadcrumbJsonLd } from "@/lib/ai-port/structured-data";
import { cn } from "@/lib/utils";

const CRUMBS = [
  { name: "AI PORT", path: "/" },
  { name: "AI診断", path: "/diagnosis" },
];

export const metadata: Metadata = aiPortMetadata({
  title: "無料AI診断｜合うツール・効率化・レベル・副業・活用度",
  description: `登録不要・無料のAI診断が${diagnoses.length}種類。あなたに合うAIツール診断、仕事効率化診断、AIレベル診断、AI副業診断、AI活用度診断。回答はブラウザ内でのみ処理し、サーバーへは送信しません。`,
  path: "/diagnosis",
  keywords: ["AI診断", "AIツール 診断", "AI 副業 診断", "AI レベル 診断", "無料 診断"],
});

export default function DiagnosisIndexPage() {
  return (
    <>
      <PageHero
        eyebrow="Diagnosis"
        title="無料の"
        highlight="AI診断"
        description="いずれも登録不要・無料。全6問・約1分で終わります。結果では「なぜそうなるのか」と「次にやること」まで示します。"
        crumbs={CRUMBS}
      />

      <PageBody>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {diagnoses.map((diagnosis, index) => (
            <Reveal key={diagnosis.slug} as="li" delay={index * 60}>
              <Link
                href={aiPortPath(`/diagnosis/${diagnosis.slug}`)}
                className="ai-glass ai-glass-rim group block h-full rounded-2xl p-6 transition-transform duration-500 hover:-translate-y-0.5"
              >
                <span
                  className={cn(
                    "font-ai-mono inline-block bg-gradient-to-r bg-clip-text text-[0.62rem] tracking-[0.2em] text-transparent uppercase",
                    accentClass[diagnosis.accent],
                  )}
                  translate="no"
                >
                  約{diagnosis.minutes}分 / 全{diagnosis.questions.length}問
                </span>

                <h2 className="text-ai-white group-hover:text-ai-cyan mt-3 text-[1.05rem] transition-colors">
                  {diagnosis.title}
                </h2>
                <p className="text-ai-haze mt-2.5 text-[0.83rem] leading-[1.9]">{diagnosis.lead}</p>

                <p className="text-ai-dim mt-5 text-[0.72rem]">
                  結果パターン {diagnosis.results.length} 種類
                </p>

                <span className="text-ai-cyan mt-4 inline-flex items-center gap-1.5 text-[0.78rem]">
                  診断をはじめる
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-3.5 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>

        <section className="mt-16 border-t border-white/8 pt-10">
          <h2 className="text-ai-white text-[1.05rem]">診断についての約束</h2>
          <ul className="text-ai-haze mt-4 grid gap-2.5 text-[0.84rem] leading-[1.9]">
            <li>・回答はブラウザ内でのみ処理し、サーバーへは送信していません。</li>
            <li>・会員登録もメールアドレスの入力も不要です。</li>
            <li>・同じ回答なら必ず同じ結果になります（乱数は使っていません）。</li>
            <li>
              ・結果は選択肢の傾向を整理したものです。成果や収益を保証するものではありません。
            </li>
          </ul>
        </section>

        <RelatedLinks
          items={[
            { href: aiPortPath("/tools"), label: "AIツール一覧" },
            { href: aiPortPath("/compare"), label: "AIツール比較表" },
            { href: aiPortPath("/chat"), label: "AIチャットで相談する" },
          ]}
        />
      </PageBody>

      <JsonLd
        data={[
          aiPortBreadcrumbJsonLd(CRUMBS),
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "AI PORT 無料AI診断",
            url: aiPortUrl("/diagnosis"),
            numberOfItems: diagnoses.length,
            itemListElement: diagnoses.map((diagnosis, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: diagnosis.title,
              url: aiPortUrl(`/diagnosis/${diagnosis.slug}`),
            })),
          },
        ]}
      />
    </>
  );
}
