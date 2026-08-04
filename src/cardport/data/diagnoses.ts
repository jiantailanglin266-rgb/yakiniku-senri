/**
 * 診断（9種類）。
 *
 * ■ 設計
 *   質問は「共通の質問バンク」から組み立てます。同じ意味の質問を診断ごとに
 *   書き分けると、文言が食い違って結果の説明がつかなくなるためです。
 *
 * ■ 収集しない情報
 *   氏名・住所・電話番号・年収の具体額・勤務先は聞きません。
 *   カードを絞り込むのに必要な粒度（レンジ・傾向）だけを尋ねます。
 */
import type { Diagnosis, DiagnosisQuestion } from "./types";

const q = {
  monthlySpend: {
    id: "monthly-spend",
    label: {
      ja: "毎月のカード利用額はどのくらいですか？",
      en: "Roughly how much do you put on a card each month?",
    },
    options: [
      {
        id: "under-30k",
        label: { ja: "3万円未満", en: "Under ¥30,000" },
        weights: { fee: 3, beginner: 2 },
        requires: { maxAnnualFee: 2200 },
      },
      {
        id: "30k-80k",
        label: { ja: "3万〜8万円", en: "¥30,000–80,000" },
        weights: { reward: 2, fee: 2 },
      },
      {
        id: "80k-150k",
        label: { ja: "8万〜15万円", en: "¥80,000–150,000" },
        weights: { reward: 3, status: 1 },
      },
      {
        id: "over-150k",
        label: { ja: "15万円以上", en: "Over ¥150,000" },
        weights: { reward: 2, status: 3, travel: 1 },
      },
    ],
  },
  feeTolerance: {
    id: "fee-tolerance",
    label: { ja: "年会費はどこまで許容できますか？", en: "How much annual fee can you accept?" },
    options: [
      {
        id: "free-only",
        label: { ja: "無料のみ", en: "Free only" },
        weights: { fee: 4 },
        requires: { maxAnnualFee: 0 },
      },
      {
        id: "under-3000",
        label: { ja: "3,000円まで", en: "Up to ¥3,000" },
        weights: { fee: 3 },
        requires: { maxAnnualFee: 3300 },
      },
      {
        id: "under-15000",
        label: { ja: "15,000円まで", en: "Up to ¥15,000" },
        weights: { fee: 1, status: 1 },
        requires: { maxAnnualFee: 15000 },
      },
      {
        id: "any",
        label: { ja: "特典に見合えば気にしない", en: "Any, if the benefits justify it" },
        weights: { status: 3, travel: 1 },
      },
    ],
  },
  mainUse: {
    id: "main-use",
    label: { ja: "主にどこで使いますか？", en: "Where do you use a card most?" },
    options: [
      {
        id: "convenience",
        label: { ja: "コンビニ・スーパー", en: "Convenience stores and supermarkets" },
        weights: { daily: 4, reward: 2 },
      },
      {
        id: "online",
        label: { ja: "ネット通販", en: "Online shopping" },
        weights: { online: 4, reward: 2 },
      },
      {
        id: "travel",
        label: { ja: "旅行・交通", en: "Travel and transport" },
        weights: { travel: 4, mile: 2 },
      },
      {
        id: "business",
        label: { ja: "事業の経費", en: "Business expenses" },
        weights: { business: 4 },
      },
    ],
  },
  priority: {
    id: "priority",
    label: { ja: "もっとも重視するのはどれですか？", en: "What matters most to you?" },
    options: [
      { id: "reward", label: { ja: "ポイント還元率", en: "Reward rate" }, weights: { reward: 5 } },
      {
        id: "mile",
        label: { ja: "マイルの貯まりやすさ", en: "Earning miles" },
        weights: { mile: 5 },
        requires: { minMileRate: 0.5 },
      },
      {
        id: "insurance",
        label: { ja: "保険・補償", en: "Insurance cover" },
        weights: { insurance: 5 },
      },
      {
        id: "status",
        label: { ja: "ステータス・優待", en: "Status and perks" },
        weights: { status: 5 },
      },
    ],
  },
  travelFrequency: {
    id: "travel-frequency",
    label: { ja: "1年に何回くらい旅行しますか？", en: "How often do you travel in a year?" },
    options: [
      {
        id: "none",
        label: { ja: "ほとんど行かない", en: "Rarely" },
        weights: { daily: 2, fee: 2 },
      },
      { id: "1-2", label: { ja: "年1〜2回", en: "Once or twice" }, weights: { travel: 2 } },
      {
        id: "3-5",
        label: { ja: "年3〜5回", en: "Three to five times" },
        weights: { travel: 4, insurance: 2 },
      },
      {
        id: "over-6",
        label: { ja: "年6回以上", en: "Six or more" },
        weights: { travel: 5, mile: 3, status: 2 },
      },
    ],
  },
  overseas: {
    id: "overseas",
    label: { ja: "海外でカードを使いますか？", en: "Do you use a card overseas?" },
    options: [
      { id: "no", label: { ja: "使わない", en: "No" }, weights: { daily: 2 } },
      {
        id: "sometimes",
        label: { ja: "旅行のときだけ", en: "Only when travelling" },
        weights: { travel: 2, insurance: 1 },
      },
      {
        id: "often",
        label: { ja: "頻繁に使う", en: "Frequently" },
        weights: { travel: 3, insurance: 3, mile: 1 },
      },
    ],
  },
  lounge: {
    id: "lounge",
    label: { ja: "空港ラウンジは使いたいですか？", en: "Do you want airport lounge access?" },
    options: [
      {
        id: "yes",
        label: { ja: "使いたい", en: "Yes" },
        weights: { travel: 3, status: 2 },
        requires: { lounge: true },
      },
      { id: "no", label: { ja: "不要", en: "No" }, weights: { fee: 2 } },
    ],
  },
  experience: {
    id: "experience",
    label: {
      ja: "クレジットカードを使った経験は？",
      en: "How much experience do you have with credit cards?",
    },
    options: [
      {
        id: "first",
        label: { ja: "はじめて持つ", en: "This is my first" },
        weights: { beginner: 4, fee: 3 },
      },
      { id: "one", label: { ja: "1枚持っている", en: "I have one" }, weights: { reward: 2 } },
      {
        id: "several",
        label: { ja: "2枚以上を使い分けている", en: "I use two or more" },
        weights: { reward: 2, status: 2, mile: 1 },
      },
    ],
  },
} satisfies Record<string, DiagnosisQuestion>;

const businessQuestions: DiagnosisQuestion[] = [
  {
    id: "entity",
    label: { ja: "事業形態を教えてください。", en: "What is your business structure?" },
    options: [
      {
        id: "corp",
        label: { ja: "法人", en: "Company" },
        weights: { business: 4 },
        requires: { eligibility: ["business"] },
      },
      {
        id: "sole",
        label: { ja: "個人事業主・フリーランス", en: "Sole proprietor or freelancer" },
        weights: { business: 3, fee: 2 },
        requires: { eligibility: ["sole-proprietor"] },
      },
    ],
  },
  {
    id: "employees",
    label: { ja: "カードを持たせたい人数は？", en: "How many people need a card?" },
    options: [
      { id: "solo", label: { ja: "自分だけ", en: "Just me" }, weights: { fee: 3 } },
      { id: "small", label: { ja: "2〜5人", en: "Two to five" }, weights: { business: 2 } },
      { id: "many", label: { ja: "6人以上", en: "Six or more" }, weights: { business: 4 } },
    ],
  },
  {
    id: "annual-expense",
    label: {
      ja: "年間の経費額はどのくらいですか？",
      en: "Roughly how much do you spend per year?",
    },
    options: [
      {
        id: "under-3m",
        label: { ja: "300万円未満", en: "Under ¥3m" },
        weights: { fee: 3 },
        requires: { maxAnnualFee: 3300 },
      },
      {
        id: "3m-10m",
        label: { ja: "300万〜1,000万円", en: "¥3m–10m" },
        weights: { business: 2, reward: 2 },
      },
      {
        id: "over-10m",
        label: { ja: "1,000万円以上", en: "Over ¥10m" },
        weights: { business: 3, status: 2, travel: 1 },
      },
    ],
  },
  {
    id: "accounting",
    label: {
      ja: "会計ソフトとの連携は必要ですか？",
      en: "Do you need accounting software integration?",
    },
    options: [
      { id: "must", label: { ja: "必須", en: "Essential" }, weights: { business: 4 } },
      { id: "nice", label: { ja: "あれば嬉しい", en: "Nice to have" }, weights: { business: 2 } },
      { id: "no", label: { ja: "不要", en: "Not needed" }, weights: { fee: 1 } },
    ],
  },
  {
    id: "cashflow",
    label: {
      ja: "支払いサイトの長さを重視しますか？",
      en: "How important are long payment terms?",
    },
    options: [
      { id: "yes", label: { ja: "重視する", en: "Very" }, weights: { business: 3, status: 1 } },
      { id: "no", label: { ja: "気にしない", en: "Not really" }, weights: { reward: 2 } },
    ],
  },
];

export const diagnoses: Diagnosis[] = [
  {
    id: "card-match",
    slug: "card-match",
    title: { ja: "あなたに合うクレジットカード診断", en: "Find the credit card that fits you" },
    lead: {
      ja: "8つの質問に答えるだけで、掲載カードのなかから条件の近い3枚を提示します。",
      en: "Answer eight questions and we will surface the three closest matches from the cards we list.",
    },
    accent: "cyan",
    pool: {},
    questions: [
      q.experience,
      q.monthlySpend,
      q.feeTolerance,
      q.mainUse,
      q.priority,
      q.travelFrequency,
      q.overseas,
      q.lounge,
    ],
  },
  {
    id: "business-card",
    slug: "business-card",
    title: { ja: "法人カード診断", en: "Business card finder" },
    lead: {
      ja: "事業形態・経費額・会計ソフト連携の希望から、条件の近い法人カードを提示します。",
      en: "Matches business cards on structure, spend and accounting integration needs.",
    },
    accent: "emerald",
    pool: { categories: ["business", "sole-proprietor"] },
    questions: businessQuestions,
  },
  {
    id: "mile-card",
    slug: "mile-card",
    title: { ja: "マイルカード診断", en: "Mileage card finder" },
    lead: {
      ja: "移行レートと年会費のバランスから、マイル向きのカードを選びます。",
      en: "Balances transfer rates against annual fees.",
    },
    accent: "electric",
    pool: { categories: ["mile", "travel"] },
    questions: [q.travelFrequency, q.overseas, q.feeTolerance, q.monthlySpend, q.lounge],
  },
  {
    id: "gold-card",
    slug: "gold-card",
    title: { ja: "ゴールドカード診断", en: "Gold card finder" },
    lead: {
      ja: "年会費に見合う使い方ができるかを、利用額と旅行頻度から確認します。",
      en: "Checks whether your spend and travel justify the fee.",
    },
    accent: "gold",
    pool: { ranks: ["gold"] },
    questions: [q.monthlySpend, q.feeTolerance, q.travelFrequency, q.priority, q.lounge],
  },
  {
    id: "platinum-card",
    slug: "platinum-card",
    title: { ja: "プラチナカード診断", en: "Platinum card finder" },
    lead: {
      ja: "コンシェルジュやラウンジをどれだけ使うかで、回収可能性を見ます。",
      en: "Weighs how much you would actually use concierge and lounges.",
    },
    accent: "violet",
    pool: { ranks: ["platinum", "black"] },
    questions: [q.monthlySpend, q.travelFrequency, q.overseas, q.priority, q.lounge],
  },
  {
    id: "student-card",
    slug: "student-card",
    title: { ja: "学生カード診断", en: "Student card finder" },
    lead: {
      ja: "在学中の特典と、卒業後の使い勝手の両方を見て選びます。",
      en: "Looks at student perks and how the card serves you after graduation.",
    },
    accent: "cyan",
    pool: { categories: ["student", "beginner", "free-annual-fee"] },
    questions: [q.experience, q.monthlySpend, q.mainUse, q.overseas],
  },
  {
    id: "cashless",
    slug: "cashless",
    title: { ja: "キャッシュレス決済診断", en: "Cashless payment finder" },
    lead: {
      ja: "普段の支払い方法から、相性のよいカードと決済サービスを選びます。",
      en: "Pairs your habits with a card and a payment service that work together.",
    },
    accent: "magenta",
    pool: {
      categories: ["convenience-store", "online-shopping", "subscription", "free-annual-fee"],
    },
    questions: [q.mainUse, q.monthlySpend, q.feeTolerance, q.experience],
  },
  {
    id: "travel-card",
    slug: "travel-card",
    title: { ja: "海外旅行カード診断", en: "Overseas travel card finder" },
    lead: {
      ja: "保険の付帯条件と海外事務手数料を軸に選びます。",
      en: "Focused on how insurance applies and what the foreign transaction fee costs.",
    },
    accent: "violet",
    pool: { categories: ["travel", "overseas"] },
    questions: [q.travelFrequency, q.overseas, q.priority, q.feeTolerance, q.lounge],
  },
  {
    id: "web3-payment",
    slug: "web3-payment",
    title: { ja: "Web3.0決済サービス診断", en: "Web3 payment service finder" },
    lead: {
      ja: "暗号資産の保有状況とリスク許容度から、検討しうるサービスを絞ります。ここでの結果は投資助言ではありません。",
      en: "Narrows services by your holdings and risk tolerance. Results are not investment advice.",
    },
    accent: "magenta",
    pool: { categories: ["crypto", "prepaid", "virtual"] },
    questions: [
      {
        id: "crypto-holding",
        label: { ja: "暗号資産を保有していますか？", en: "Do you hold any crypto assets?" },
        options: [
          {
            id: "none",
            label: { ja: "保有していない", en: "No" },
            weights: { beginner: 3, fee: 2 },
          },
          {
            id: "some",
            label: { ja: "少額を保有", en: "A small amount" },
            weights: { online: 2, reward: 1 },
          },
          {
            id: "much",
            label: { ja: "まとまった額を保有", en: "A significant amount" },
            weights: { reward: 3, online: 2 },
          },
        ],
      },
      {
        id: "risk",
        label: {
          ja: "還元の価値が変動することを許容できますか？",
          en: "Can you accept rewards whose value fluctuates?",
        },
        help: {
          ja: "暗号資産による還元は、受け取り時点の価格で価値が決まり、その後も変動します。",
          en: "Crypto rewards are valued at the price when received and keep moving afterwards.",
        },
        options: [
          {
            id: "no",
            label: { ja: "できない（円で確定させたい）", en: "No — I want a fixed yen value" },
            weights: { fee: 3, beginner: 3 },
          },
          { id: "yes", label: { ja: "許容できる", en: "Yes" }, weights: { reward: 3 } },
        ],
      },
      q.overseas,
      q.monthlySpend,
    ],
  },
];

const diagnosisMap = new Map(diagnoses.map((diagnosis) => [diagnosis.slug, diagnosis]));

export function getDiagnosis(slug: string): Diagnosis | undefined {
  return diagnosisMap.get(slug);
}
