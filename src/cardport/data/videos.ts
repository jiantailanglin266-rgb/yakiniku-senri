/**
 * 動画（モックデータ）。
 *
 * YouTube Data API を設定すると `lib/youtube.ts` が同じ形で実データを返します。
 * APIキーが無い状態でも、動画ページの構造をそのまま確認できるようにしています。
 *
 * ⚠ `youtubeId` は実在の動画IDではありません。埋め込みは環境変数で有効化してください。
 */
import type { Video } from "./types";

export const videos: Video[] = [
  {
    id: "video-001",
    slug: "best-credit-cards",
    youtubeId: "",
    title: {
      ja: "2026年 最初の1枚に選ぶべきクレジットカード5選",
      en: "Five credit cards worth considering as your first in 2026",
    },
    description: {
      ja: "年会費・還元率・発行スピードの3点で、初めての1枚に向くカードを比較しました。",
      en: "We compare cards suited to a first card on three axes: annual fee, reward rate and issuing speed.",
    },
    isShort: false,
    publishedAt: "2026-07-16",
    durationSeconds: 742,
    chapters: [
      { at: 0, label: { ja: "はじめに：選ぶ順番", en: "Intro: the order to decide in" } },
      { at: 68, label: { ja: "年会費で足切りする", en: "Filter on annual fee first" } },
      { at: 205, label: { ja: "還元率の落とし穴", en: "Where reward rates mislead" } },
      { at: 412, label: { ja: "発行スピードの実際", en: "How fast issuing really is" } },
      { at: 588, label: { ja: "5枚の比較まとめ", en: "The five compared" } },
    ],
    transcriptHighlights: {
      ja: [
        "還元率だけで選ぶと、対象店舗が限られるカードで期待どおりに貯まりません。",
        "年会費無料でも「初年度無料」と「永年無料」はまったく違います。",
        "発行スピードは、番号の即時発行とプラスチックカードの到着で分けて考えます。",
      ],
      en: [
        "Choosing on rate alone backfires when the boost is confined to a few merchants.",
        "'Free the first year' and 'free for life' are not the same thing.",
        "Separate 'number issued instantly' from 'plastic card arrives'.",
      ],
    },
    aiSummary: {
      ja: [
        "結論：はじめての1枚は「永年無料」かつ「基本還元率1.0%以上」から選ぶのが失敗しにくい。",
        "対象店舗限定の高還元は、月間の付与上限まで含めて実質還元率を計算する。",
        "旅行保険が必要になったら2枚目を足すほうが、1枚に高い年会費を払うより安い場合が多い。",
      ],
      en: [
        "Bottom line: start from cards that are free for life with a base rate of 1.0% or more.",
        "For merchant-limited boosts, work out the effective rate including the monthly cap.",
        "When you need travel cover, adding a second card is often cheaper than paying a high fee on one.",
      ],
    },
    featuredCardIds: [
      "nova-zero",
      "nova-flux",
      "hoshimart-plus",
      "linkmobile-one",
      "meridian-classic",
    ],
    relatedNewsIds: ["news-001", "news-002"],
  },
  {
    id: "video-002",
    slug: "point-strategy",
    youtubeId: "",
    title: {
      ja: "ポイントを「貯める」より「使う」で差がつく理由",
      en: "Why redeeming beats collecting when it comes to points",
    },
    description: {
      ja: "交換先によって1ポイントの価値は0.5円〜1.0円まで変わります。実例で確認します。",
      en: "A point is worth ¥0.5 to ¥1.0 depending on how you redeem it. We work through examples.",
    },
    isShort: false,
    publishedAt: "2026-07-04",
    durationSeconds: 615,
    chapters: [
      {
        at: 0,
        label: { ja: "1ポイントの価値は一定ではない", en: "A point does not have one value" },
      },
      { at: 120, label: { ja: "交換先別のレート比較", en: "Rates by redemption route" } },
      { at: 330, label: { ja: "失効を防ぐ", en: "Avoiding expiry" } },
    ],
    transcriptHighlights: {
      ja: [
        "景品交換はレートが低くなりがちで、実質0.6円程度になることがあります。",
        "マイル移行は移行レートが1対1なら有利ですが、特典航空券の必要マイル数は変わりえます。",
      ],
      en: [
        "Merchandise redemptions tend to be the weakest, sometimes around ¥0.6 per point.",
        "A 1:1 mile transfer is strong, but award chart requirements can change.",
      ],
    },
    aiSummary: {
      ja: [
        "結論：交換先を決めてからカードを選ぶと、還元率の比較が意味を持つ。",
        "現金・ギフト券は1ポイント＝1円が基準。それを下回る交換は避ける。",
        "有効期限の短いポイントは、貯める前に使い道を決めておく。",
      ],
      en: [
        "Bottom line: decide how you will redeem before you compare reward rates.",
        "Cash and gift cards set the ¥1-per-point baseline; avoid routes below it.",
        "For short-lived points, pick the redemption before you start collecting.",
      ],
    },
    featuredCardIds: ["nova-flux", "meridian-sky", "aurum-platinum"],
    relatedNewsIds: ["news-008"],
  },
  {
    id: "video-003",
    slug: "business-card-basics",
    youtubeId: "",
    title: {
      ja: "個人事業主が最初に持つべき法人カードの条件",
      en: "What a sole proprietor should look for in a first business card",
    },
    description: {
      ja: "決算書不要・年会費無料・会計ソフト連携の3点で絞ります。",
      en: "Filtering on three things: no statements required, no fee, and accounting integration.",
    },
    isShort: false,
    publishedAt: "2026-06-26",
    durationSeconds: 528,
    chapters: [
      {
        at: 0,
        label: { ja: "私費と事業費を分ける理由", en: "Why separate personal and business spend" },
      },
      {
        at: 155,
        label: { ja: "決算書不要の意味", en: "What 'no statements required' actually means" },
      },
      {
        at: 340,
        label: { ja: "会計ソフト連携の確認点", en: "Checking the accounting integration" },
      },
    ],
    transcriptHighlights: {
      ja: [
        "決算書の提出が不要でも、審査そのものは行われます。",
        "会計ソフト連携は、ソフト側の契約プランによって使えないことがあります。",
      ],
      en: [
        "No statements does not mean no review.",
        "Accounting integrations can be unavailable depending on your software plan.",
      ],
    },
    aiSummary: {
      ja: [
        "結論：最初の1枚は年会費無料で、会計ソフト連携ができるものを選ぶ。",
        "限度額は実績で上がるため、開業直後に高い限度額を期待しない。",
        "出張が増えたら、保険とラウンジの付く上位カードを2枚目として足す。",
      ],
      en: [
        "Bottom line: start with a free card that syncs with your accounting software.",
        "Limits rise with trading history; do not expect a high one at the start.",
        "When travel picks up, add a higher tier with insurance and lounges as a second card.",
      ],
    },
    featuredCardIds: ["orbit-solo", "orbit-business", "orbit-business-gold"],
    relatedNewsIds: ["news-004"],
  },
  {
    id: "video-004",
    slug: "shorts-annual-fee",
    youtubeId: "",
    title: {
      ja: "【60秒】年会費11,000円は何円使えば元が取れる？",
      en: "[60s] How much do you need to spend to clear an ¥11,000 fee?",
    },
    description: {
      ja: "還元率1.0%なら年間110万円。計算の考え方を60秒で。",
      en: "At 1.0%, ¥1.1m a year. The arithmetic in 60 seconds.",
    },
    isShort: true,
    publishedAt: "2026-07-20",
    durationSeconds: 58,
    chapters: [],
    transcriptHighlights: {
      ja: ["還元だけで回収するなら、年会費 ÷ 還元率 で必要利用額が出ます。"],
      en: ["On rewards alone, the required spend is simply the fee divided by the rate."],
    },
    aiSummary: {
      ja: [
        "年会費11,000円・還元率1.0%なら、必要な年間利用額は110万円。",
        "ラウンジと保険を使うなら回収ラインは下がるが、使わない年は下がらない。",
      ],
      en: [
        "An ¥11,000 fee at 1.0% needs ¥1,100,000 of annual spend.",
        "Using lounges and insurance lowers the bar — but only in the years you use them.",
      ],
    },
    featuredCardIds: ["meridian-gold", "hoshimart-gold"],
    relatedNewsIds: ["news-012"],
  },
  {
    id: "video-005",
    slug: "shorts-touch-payment",
    youtubeId: "",
    title: {
      ja: "【45秒】タッチ決済の還元、カードを差すと対象外になることがある",
      en: "[45s] Insert the card and you may lose the contactless boost",
    },
    description: {
      ja: "スマートフォンのタッチ決済が条件のカードに注意。",
      en: "Watch for cards whose boost requires phone contactless.",
    },
    isShort: true,
    publishedAt: "2026-07-19",
    durationSeconds: 44,
    chapters: [],
    transcriptHighlights: {
      ja: ["還元率アップの条件が「スマートフォンのタッチ決済」の場合、カード実物では対象外です。"],
      en: [
        "Where the boost requires phone contactless, tapping or inserting the plastic card does not qualify.",
      ],
    },
    aiSummary: {
      ja: ["高還元の条件は決済手段まで指定されていることがある。利用規約を確認する。"],
      en: ["Boost conditions can specify the payment method itself. Read the terms."],
    },
    featuredCardIds: ["nova-zero"],
    relatedNewsIds: ["news-001"],
  },
  {
    id: "video-006",
    slug: "crypto-card-risk",
    youtubeId: "",
    title: {
      ja: "暗号資産カードを使う前に理解しておくリスク",
      en: "Risks to understand before using a crypto card",
    },
    description: {
      ja: "価格変動・保管・地域制限の3つを整理します。",
      en: "Three things: volatility, custody and geo-restrictions.",
    },
    isShort: false,
    publishedAt: "2026-06-18",
    durationSeconds: 690,
    chapters: [
      { at: 0, label: { ja: "還元の価値が変動する", en: "Reward value moves" } },
      { at: 210, label: { ja: "資産は誰が保管しているか", en: "Who holds the assets" } },
      { at: 445, label: { ja: "地域制限とサービス停止", en: "Geo-restrictions and suspensions" } },
    ],
    transcriptHighlights: {
      ja: [
        "還元された暗号資産の価値は、受け取り時点の価格で決まり、その後も変動します。",
        "多くのサービスはカストディ型で、資産はサービス提供会社が保管しています。",
      ],
      en: [
        "Crypto rewards are valued at the price when received and keep moving afterwards.",
        "Most services are custodial: the provider holds the assets, not you.",
      ],
    },
    aiSummary: {
      ja: [
        "暗号資産カードは、還元率の高さではなくリスクの理解度で選ぶ。",
        "生活費の決済を暗号資産カード1枚に依存させない。",
        "地域制限は予告なく変わることがある。",
      ],
      en: [
        "Choose a crypto card on how well you understand the risks, not on the headline rate.",
        "Never make one crypto card your only way to pay for essentials.",
        "Geo-restrictions can change without notice.",
      ],
    },
    featuredCardIds: ["chainbridge-flow", "chainbridge-nova"],
    relatedNewsIds: ["news-006", "news-011"],
  },
];

const videoMap = new Map(videos.map((video) => [video.slug, video]));
const videoIdMap = new Map(videos.map((video) => [video.id, video]));

export function getVideo(slug: string) {
  return videoMap.get(slug);
}

export function getVideosByIds(ids: string[]) {
  return ids.map((id) => videoIdMap.get(id)).filter((video): video is Video => Boolean(video));
}

export function getVideos(options?: { shorts?: boolean; limit?: number }) {
  let list = [...videos].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  if (options?.shorts !== undefined)
    list = list.filter((video) => video.isShort === options.shorts);
  return options?.limit ? list.slice(0, options.limit) : list;
}

/** 秒数を mm:ss に整形します */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}
