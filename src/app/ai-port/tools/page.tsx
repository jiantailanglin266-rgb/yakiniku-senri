import type { Metadata } from "next";

import { PageBody, PageHero, RelatedLinks } from "@/components/ai-port/layout/PageShell";
import { ToolExplorer } from "@/components/ai-port/tools/ToolExplorer";
import { Disclaimer } from "@/components/ai-port/ui/Primitives";
import { JsonLd } from "@/components/ui/JsonLd";
import { aiPortPath } from "@/data/ai-port/site";
import { toolCategories } from "@/data/ai-port/taxonomy";
import { tools } from "@/data/ai-port/tools";
import { aiPortMetadata } from "@/lib/ai-port/seo";
import { aiPortBreadcrumbJsonLd, toolItemListJsonLd } from "@/lib/ai-port/structured-data";

const CRUMBS = [
  { name: "AI PORT", path: "/" },
  { name: "AIツール", path: "/tools" },
];

export const metadata: Metadata = aiPortMetadata({
  title: "AIツール一覧｜用途・日本語対応・API・無料枠で絞り込み",
  description: `チャットAI・画像生成・動画生成・コーディング・AIエージェントなど${toolCategories.length}カテゴリー、${tools.length}件のAIツールを掲載。日本語UI／API提供／無料枠／法人プランの有無で絞り込めます。`,
  path: "/tools",
  keywords: ["AIツール 一覧", "AIツール 比較", "生成AI ツール", "無料 AIツール", "日本語 AIツール"],
});

/**
 * AIツール一覧。
 *
 * ⚠ 料金の金額は掲載していません。
 *   生成AIの料金は数か月単位で変わるため、古い数字は読者への実害になります。
 *   「無料あり／有料」の区分だけを載せ、金額は各公式サイトで確認してもらいます。
 */
export default function ToolsIndexPage() {
  return (
    <>
      <PageHero
        eyebrow="AI Tools"
        title="AIツール"
        highlight="データベース"
        description="用途から絞り込めるAIツールの一覧です。選定で長く効く軸（日本語UI・API提供・無料枠・法人プラン）を揃えて掲載しています。"
        crumbs={CRUMBS}
      />

      <PageBody>
        <ToolExplorer />

        <section className="mt-16 border-t border-white/8 pt-10">
          <h2 className="text-ai-white text-[1.05rem]">掲載方針</h2>
          <ul className="text-ai-haze mt-4 grid gap-2.5 text-[0.84rem] leading-[1.9]">
            <li>・料金の金額は掲載しません。変動が速く、古い数字が読者の不利益になるためです。</li>
            <li>
              ・確認できていない項目は空欄にせず「未確認」と表示します。推測で埋めることはしません。
            </li>
            <li>
              ・レビュー点数・星の数は扱いません。実データのない評価を構造化データで出すことは
              Google のポリシー違反にあたります。
            </li>
            <li>・掲載順や評価を、アフィリエイト報酬の有無で変えることはありません。</li>
          </ul>
        </section>

        <Disclaimer>
          機能・提供状況・料金は変更されることがあります。ご利用前に必ず各サービスの公式サイトで
          最新情報をご確認ください。
        </Disclaimer>

        <RelatedLinks
          items={[
            {
              href: aiPortPath("/compare"),
              label: "AIツール比較表",
              description: "カテゴリー別に横並びで確認できます。",
            },
            {
              href: aiPortPath("/ranking"),
              label: "注目度ランキング",
              description: "スコアの計算方法も公開しています。",
            },
            {
              href: aiPortPath("/diagnosis/tool-match"),
              label: "あなたに合うAIツール診断",
              description: "6問・約1分で方向性が決まります。",
            },
          ]}
        />
      </PageBody>

      <JsonLd
        data={[aiPortBreadcrumbJsonLd(CRUMBS), toolItemListJsonLd(tools, "AIツール一覧", "/tools")]}
      />
    </>
  );
}
