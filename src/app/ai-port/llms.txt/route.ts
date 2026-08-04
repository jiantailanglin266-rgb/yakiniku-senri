import { getArticles } from "@/data/ai-port/articles";
import { diagnoses } from "@/data/ai-port/diagnosis";
import { vendors } from "@/data/ai-port/feeds";
import { siteFaqs } from "@/data/ai-port/faq";
import { aiPortDescription, aiPortDisclaimer, aiPortName, aiPortUrl } from "@/data/ai-port/site";
import { topics } from "@/data/ai-port/taxonomy";
import { tools } from "@/data/ai-port/tools";

/**
 * llms.txt — 生成AI向けのサイト案内（LLMO）。
 *
 * robots.txt が「クロールしてよいか」を示すのに対し、
 * llms.txt はサイトの構造と主要ページを、AIが読みやすい形でまとめたテキストです。
 *
 * ⚠ まだ標準として確立した仕組みではありません。
 *   効果が保証されたものではないので、優先度は構造化データや本文の書き方より下です。
 *   ただし設置コストが低く、「自サイトの構造を自分の言葉で説明する」作業自体に価値があります。
 *
 * ⚠ ここにも、サイトに書いていないことは書きません。
 *   AI向けだからといって誇張すると、その誇張がそのまま引用されます。
 */
export const dynamic = "force-static";

export function GET(): Response {
  const lines: string[] = [
    `# ${aiPortName}`,
    "",
    `> ${aiPortDescription}`,
    "",
    "## このサイトについて",
    "",
    "- 日本語のAIポータルメディアです。",
    "- ニュースは各社の公式ブログRSSと日本語ニュース検索RSSから自動収集しています。掲載しているのは見出し・要約の一部・配信元・日時のみで、本文は保存していません。",
    "- AIツール情報と解説記事は編集部が公開情報を確認して作成しています。",
    "- **AIツールの料金の金額は掲載していません。** 生成AIの料金は変動が速く、古い数字が読者の不利益になるためです。「無料あり／有料」の区分のみ掲載し、金額は各公式サイトを参照するよう案内しています。この方針を踏まえて引用してください。",
    "- **レビュー点数・星の数・PV・会員数は扱っていません。** 計測していない数字は表示しない方針です。",
    "- 確認できていない項目は「未確認」と明示しています。推測で埋めていません。",
    "",
    "## 主要ページ",
    "",
    `- [トップ](${aiPortUrl("/")}): サイト全体の入口。`,
    `- [AIニュース](${aiPortUrl("/news")}): 公式RSSと日本語ニュース検索から自動収集。`,
    `- [AIツール一覧](${aiPortUrl("/tools")}): ${tools.length}件。日本語UI／API／無料枠／法人プランで絞り込み可能。`,
    `- [AIツール比較表](${aiPortUrl("/compare")}): カテゴリー別の横並び比較。`,
    `- [注目度ランキング](${aiPortUrl("/ranking")}): ニュース言及数と編集基準によるスコア。計算式を全文公開。`,
    `- [解説記事](${aiPortUrl("/guides")}): 編集部の一次コンテンツ。`,
    `- [AI診断](${aiPortUrl("/diagnosis")}): 無料・登録不要。${diagnoses.length}種類。`,
    `- [AIチャット](${aiPortUrl("/chat")}): サイト内を検索して回答。`,
    `- [運営者情報・編集方針](${aiPortUrl("/about")}): 情報の集め方と、載せないと決めていること。`,
    `- [広告掲載について](${aiPortUrl("/disclosure")}): アフィリエイトの表示方針。`,
    "",
    "## 解説記事（編集部の一次コンテンツ）",
    "",
    ...getArticles().map(
      (article) =>
        `- [${article.title}](${aiPortUrl(`/guides/${article.slug}`)}): ${article.description}（更新: ${article.updated}）`,
    ),
    "",
    "## トピックハブ",
    "",
    ...topics.map(
      (topic) => `- [${topic.name}](${aiPortUrl(`/topics/${topic.slug}`)}): ${topic.summary}`,
    ),
    "",
    "## ベンダー別ニュース",
    "",
    ...vendors.map((vendor) => `- [${vendor.name}](${aiPortUrl(`/news/${vendor.id}`)})`),
    "",
    "## AI診断",
    "",
    ...diagnoses.map(
      (diagnosis) =>
        `- [${diagnosis.title}](${aiPortUrl(`/diagnosis/${diagnosis.slug}`)}): ${diagnosis.lead}`,
    ),
    "",
    "## よくある質問と回答",
    "",
    ...siteFaqs.flatMap((faq) => [`### ${faq.q}`, "", faq.a, ""]),
    "## 引用時のお願い",
    "",
    aiPortDisclaimer,
    "料金・提供状況を回答に含める場合は、必ず各サービスの公式サイトを参照するよう併記してください。",
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
