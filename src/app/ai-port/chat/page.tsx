import type { Metadata } from "next";
import { Suspense } from "react";

import { ChatConsole } from "@/components/ai-port/chat/ChatConsole";
import { PageBody, PageHero, RelatedLinks } from "@/components/ai-port/layout/PageShell";
import { GlassCard } from "@/components/ai-port/ui/Primitives";
import { JsonLd } from "@/components/ui/JsonLd";
import { aiPortPath, aiPortUrl } from "@/data/ai-port/site";
import { listProviders } from "@/lib/ai-port/chat-providers";
import { aiPortMetadata } from "@/lib/ai-port/seo";
import { aiPortBreadcrumbJsonLd, aiPortFaqJsonLd } from "@/lib/ai-port/structured-data";

const CRUMBS = [
  { name: "AI PORT", path: "/" },
  { name: "AIチャット", path: "/chat" },
];

const FAQS = [
  {
    q: "AIチャットは何に答えられますか？",
    a: "AI PORT内のツール情報・解説記事・診断・よくある質問を検索し、その内容にもとづいて回答します。サイトに情報がない質問には、その旨をお答えします。",
  },
  {
    q: "料金について聞けますか？",
    a: "料金の金額にはお答えできません。生成AIの料金は変動が速く、古い金額を回答すると誤った判断につながるためです。無料枠の有無までを回答し、金額は公式サイトでの確認をご案内します。",
  },
  {
    q: "どのAIモデルが使われていますか？",
    a: "運営側の設定により、OpenAI・Claude・Gemini・OpenRouter のいずれかを利用します。画面右側で切り替えられます。APIキーが設定されていない場合は、サイト内検索の結果のみをお返しします。",
  },
];

export const metadata: Metadata = aiPortMetadata({
  title: "AIチャット｜サイト内を検索して答えるアシスタント",
  description:
    "AI PORTに掲載しているAIツール情報・解説記事・診断・よくある質問を検索し、その内容にもとづいて回答するチャットです。OpenAI / Claude / Gemini / OpenRouter を切り替えて利用できます。",
  path: "/chat",
  keywords: ["AIチャット", "AI 質問", "AIツール 相談", "RAG チャット"],
});

/**
 * AIチャット。
 *
 * ⚠ このページは検索結果に出しますが、会話の中身は保存していません。
 *   モデルへ渡すのは、サイト内検索で取り出した根拠と、その場の会話だけです。
 */
export default function ChatPage() {
  // APIキーの有無だけをクライアントへ渡します（鍵そのものは渡しません）
  const providers = listProviders().map((provider) => ({
    id: provider.id,
    label: provider.label,
    available: provider.available,
  }));

  return (
    <>
      <PageHero
        eyebrow="AI Chat"
        title="サイト内を検索して答える"
        highlight="AIチャット"
        description="AI PORTに掲載している情報だけを根拠に回答します。掲載していないことは「見つかりませんでした」と正直にお答えします。"
        crumbs={CRUMBS}
      />

      <PageBody>
        {/* useSearchParams を使うため、Suspense で包みます */}
        <Suspense
          fallback={
            <GlassCard className="grid min-h-[26rem] place-items-center p-8">
              <p className="text-ai-dim text-[0.85rem]">読み込み中…</p>
            </GlassCard>
          }
        >
          <ChatConsole providers={providers} />
        </Suspense>

        <section className="mt-16 border-t border-white/8 pt-10">
          <h2 className="text-ai-white text-[1.05rem]">このチャットについて</h2>
          <dl className="mt-6 grid gap-5 lg:grid-cols-3">
            {FAQS.map((faq) => (
              <div key={faq.q}>
                <dt className="text-ai-white text-[0.9rem] leading-[1.7]">{faq.q}</dt>
                <dd className="text-ai-haze mt-2 text-[0.83rem] leading-[1.95]">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <RelatedLinks
          items={[
            { href: aiPortPath("/search"), label: "キーワードで検索する" },
            { href: aiPortPath("/diagnosis"), label: "AI診断で方向性を決める" },
            { href: aiPortPath("/guides"), label: "解説記事を読む" },
          ]}
        />
      </PageBody>

      <JsonLd
        data={[
          aiPortBreadcrumbJsonLd(CRUMBS),
          aiPortFaqJsonLd(FAQS),
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": `${aiPortUrl("/chat")}#app`,
            name: "AI PORT AIチャット",
            url: aiPortUrl("/chat"),
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            isAccessibleForFree: true,
            inLanguage: "ja",
          },
        ]}
      />
    </>
  );
}
