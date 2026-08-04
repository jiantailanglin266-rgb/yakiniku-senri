import type { Metadata } from "next";

import { RankingBoard } from "@/components/ai-port/home/RankingBoard";
import { PageBody, PageHero, RelatedLinks } from "@/components/ai-port/layout/PageShell";
import { Disclaimer, GlassCard } from "@/components/ai-port/ui/Primitives";
import { JsonLd } from "@/components/ui/JsonLd";
import { aiPortPath } from "@/data/ai-port/site";
import { tools } from "@/data/ai-port/tools";
import { countVendorMentions, getLatestNews } from "@/lib/ai-port/news";
import { MAX_SCORE, SCORE_WEIGHTS, rankTools } from "@/lib/ai-port/ranking";
import { aiPortMetadata } from "@/lib/ai-port/seo";
import { aiPortBreadcrumbJsonLd, toolItemListJsonLd } from "@/lib/ai-port/structured-data";

const CRUMBS = [
  { name: "AI PORT", path: "/" },
  { name: "注目度ランキング", path: "/ranking" },
];

export const metadata: Metadata = aiPortMetadata({
  title: "AIツール注目度ランキング｜計算方法を公開",
  description:
    "直近のニュースでの言及数（実測）と編集部の選定基準を組み合わせた注目度スコアで、AIツールを並べています。スコアの計算式と各ツールの内訳をすべて公開しています。",
  path: "/ranking",
  keywords: ["AIツール ランキング", "生成AI 人気", "AIツール おすすめ"],
});

/**
 * 注目度ランキング。
 *
 * ⚠ 「人気ランキング」ではありません。
 *   PV・ダウンロード数・レビュー点数を持っていないので、それを根拠にできません。
 *   持っている材料（ニュース言及数の実測値＋編集部の選定基準）だけで並べ、
 *   計算式と内訳をこのページに全部書いています。
 *   根拠を隠したランキングは、読者に対して不誠実です。
 */
export default async function RankingPage() {
  const news = await getLatestNews(60);
  const mentions = countVendorMentions(news);
  const ranked = rankTools(tools, mentions);

  const hasMentions = Object.keys(mentions).length > 0;

  return (
    <>
      <PageHero
        eyebrow="Ranking"
        title="AIツール"
        highlight="注目度ランキング"
        description="ユーザー投票やレビュー点数は使っていません。実際に取得できたニュースでの言及数と、編集部の選定基準だけで算出しています。"
        crumbs={CRUMBS}
      />

      <PageBody>
        <GlassCard className="p-6 sm:p-8">
          <h2 className="text-ai-white text-[1.05rem]">スコアの計算方法</h2>
          <p className="text-ai-haze mt-3 text-[0.85rem] leading-[1.95]">
            満点は {MAX_SCORE} 点です。以下の合計で算出しています。
            アフィリエイト報酬の有無はスコアに一切影響しません。
          </p>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-left text-[0.82rem]">
              <thead>
                <tr className="border-b border-white/10">
                  <th
                    scope="col"
                    className="text-ai-dim font-ai-mono px-3 py-2.5 text-[0.62rem] font-normal tracking-[0.14em] uppercase"
                  >
                    項目
                  </th>
                  <th
                    scope="col"
                    className="text-ai-dim font-ai-mono px-3 py-2.5 text-[0.62rem] font-normal tracking-[0.14em] uppercase"
                  >
                    配点
                  </th>
                  <th
                    scope="col"
                    className="text-ai-dim font-ai-mono px-3 py-2.5 text-[0.62rem] font-normal tracking-[0.14em] uppercase"
                  >
                    考え方
                  </th>
                </tr>
              </thead>
              <tbody className="text-ai-mist">
                <ScoreRow
                  label="直近ニュースでの言及"
                  points={`1件 +${SCORE_WEIGHTS.mentionPerItem}（上限 ${SCORE_WEIGHTS.mentionCap}）`}
                  note="実際に取得できた記事の件数です。推測値ではありません。"
                />
                <ScoreRow
                  label="編集部の注目度"
                  points={`1〜3 × ${SCORE_WEIGHTS.editorPick}`}
                  note="「まず試す価値があるか」の判断です。人気度ではありません。"
                />
                <ScoreRow
                  label="日本語UI"
                  points={`+${SCORE_WEIGHTS.japaneseUi}`}
                  note="日本語で使えるかは、国内利用では実用性に直結します。"
                />
                <ScoreRow
                  label="無料で試せる"
                  points={`+${SCORE_WEIGHTS.freeTier}`}
                  note="導入前に自分のデータで検証できるかどうか。"
                />
                <ScoreRow
                  label="API提供"
                  points={`+${SCORE_WEIGHTS.api}`}
                  note="既存の業務システムに組み込めるか。"
                />
                <ScoreRow
                  label="チーム・法人プラン"
                  points={`+${SCORE_WEIGHTS.team}`}
                  note="権限管理を伴う組織利用ができるか。"
                />
              </tbody>
            </table>
          </div>

          {!hasMentions ? (
            <p className="text-ai-dim mt-5 rounded-lg border border-white/8 bg-white/[0.02] px-4 py-3 text-[0.76rem] leading-[1.85]">
              現在、ニュースを取得できていないため、言及数の加点は 0
              で計算しています。ニュースの取得が回復すると順位は自動的に更新されます。
            </p>
          ) : null}
        </GlassCard>

        <div className="mt-12">
          <h2 className="text-ai-white text-[1.15rem]">全{ranked.length}件の順位</h2>
          <p className="text-ai-haze mt-2 text-[0.84rem]">
            各行を開かなくても内訳が見えるようにしています。
          </p>

          <div className="mt-6">
            <RankingBoard ranked={ranked} limit={ranked.length} showBreakdown />
          </div>
        </div>

        <Disclaimer>
          このランキングは AI PORT
          編集部が定義した指標にもとづく整理であり、各サービスの品質や優劣を保証するものではありません。
          導入の判断は、必ずご自身の要件と公式情報にもとづいて行ってください。
        </Disclaimer>

        <RelatedLinks
          items={[
            { href: aiPortPath("/tools"), label: "AIツール一覧" },
            { href: aiPortPath("/compare"), label: "比較表で確認する" },
            { href: aiPortPath("/news"), label: "最新のAIニュース" },
          ]}
        />
      </PageBody>

      <JsonLd
        data={[
          aiPortBreadcrumbJsonLd(CRUMBS),
          toolItemListJsonLd(
            ranked.map((entry) => entry.tool),
            "AIツール注目度ランキング",
            "/ranking",
          ),
        ]}
      />
    </>
  );
}

function ScoreRow({ label, points, note }: { label: string; points: string; note: string }) {
  return (
    <tr className="border-b border-white/6 last:border-0">
      <th scope="row" className="px-3 py-3 text-left font-normal">
        {label}
      </th>
      <td className="text-ai-cyan px-3 py-3 whitespace-nowrap" translate="no">
        {points}
      </td>
      <td className="text-ai-haze px-3 py-3 text-[0.78rem] leading-[1.8]">{note}</td>
    </tr>
  );
}
