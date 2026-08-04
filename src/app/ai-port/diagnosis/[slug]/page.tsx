import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DiagnosisRunner } from "@/components/ai-port/diagnosis/DiagnosisRunner";
import { PageBody, PageHero, RelatedLinks } from "@/components/ai-port/layout/PageShell";
import { JsonLd } from "@/components/ui/JsonLd";
import { diagnoses, findDiagnosis } from "@/data/ai-port/diagnosis";
import { aiPortPath } from "@/data/ai-port/site";
import { aiPortMetadata } from "@/lib/ai-port/seo";
import {
  aiPortBreadcrumbJsonLd,
  aiPortFaqJsonLd,
  diagnosisJsonLd,
} from "@/lib/ai-port/structured-data";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return diagnoses.map((diagnosis) => ({ slug: diagnosis.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const diagnosis = findDiagnosis(slug);
  if (!diagnosis) return {};

  return aiPortMetadata({
    title: `${diagnosis.title}｜無料・登録不要`,
    description: diagnosis.description,
    path: `/diagnosis/${diagnosis.slug}`,
    keywords: [diagnosis.title, "AI診断", "無料 診断"],
  });
}

/** 全診断に共通の質問。画面に出している内容だけを構造化データにします。 */
const COMMON_FAQ = [
  {
    q: "この診断は無料ですか？会員登録は必要ですか？",
    a: "無料です。会員登録もメールアドレスの入力も必要ありません。",
  },
  {
    q: "回答した内容は保存されますか？",
    a: "保存されません。採点はブラウザ内で完結しており、回答内容をサーバーへ送信していません。ページを離れると回答は消えます。",
  },
  {
    q: "同じ回答をすると結果は変わりますか？",
    a: "変わりません。採点に乱数を使っていないため、同じ回答なら常に同じ結果になります。",
  },
];

export default async function DiagnosisDetailPage({ params }: Params) {
  const { slug } = await params;
  const diagnosis = findDiagnosis(slug);
  if (!diagnosis) notFound();

  const crumbs = [
    { name: "AI PORT", path: "/" },
    { name: "AI診断", path: "/diagnosis" },
    { name: diagnosis.title, path: `/diagnosis/${diagnosis.slug}` },
  ];

  return (
    <>
      <PageHero
        eyebrow="Diagnosis"
        title={diagnosis.title}
        description={diagnosis.description}
        crumbs={crumbs}
      />

      <PageBody className="max-w-3xl">
        <DiagnosisRunner diagnosis={diagnosis} />

        <section className="mt-16 border-t border-white/8 pt-10">
          <h2 className="text-ai-white text-[1.05rem]">この診断について</h2>
          <dl className="mt-6 grid gap-5">
            {COMMON_FAQ.map((faq) => (
              <div key={faq.q}>
                <dt className="text-ai-white text-[0.9rem] leading-[1.7]">{faq.q}</dt>
                <dd className="text-ai-haze mt-2 text-[0.84rem] leading-[1.95]">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <RelatedLinks
          items={diagnoses
            .filter((other) => other.slug !== diagnosis.slug)
            .map((other) => ({
              href: aiPortPath(`/diagnosis/${other.slug}`),
              label: other.title,
              description: other.lead,
            }))}
          title="他のAI診断"
        />
      </PageBody>

      <JsonLd
        data={[
          aiPortBreadcrumbJsonLd(crumbs),
          diagnosisJsonLd(diagnosis),
          aiPortFaqJsonLd(COMMON_FAQ),
        ]}
      />
    </>
  );
}
