/**
 * 入会キャンペーン（すべて架空）。
 *
 * ■ 表示の決まり
 *   「無条件でもらえる」と読める書き方は禁止です。
 *   達成条件・期限・対象者を必ず併記し、期限を過ぎたものは
 *   `isExpired()` で判定して注意書きへ切り替えます。
 */
import type { CardCampaign } from "./types";

export const campaigns: CardCampaign[] = [
  {
    id: "cmp-nova-zero-01",
    cardId: "nova-zero",
    title: {
      ja: "新規入会＋条件達成で最大8,000円相当",
      en: "Up to ¥8,000 in value for new members meeting the conditions",
    },
    maxValue: 8000,
    conditions: {
      ja: [
        "入会月の翌月末までに、対象のスマートフォン決済で合計30,000円以上を利用",
        "カード発行から3か月以内に、アプリへログインして受取り手続きを行う",
        "既に同社のカードを保有している場合は対象外",
      ],
      en: [
        "Spend ¥30,000 or more via eligible phone payments by the end of the month after enrolment",
        "Log in to the app and claim within three months of issuance",
        "Existing cardholders with the same issuer are excluded",
      ],
    },
    endsOn: "2026-09-30",
    target: { ja: "新規入会者のみ", en: "New members only" },
    officialUrl: "https://example.com/nova-zero/campaign",
  },
  {
    id: "cmp-nova-flux-01",
    cardId: "nova-flux",
    title: {
      ja: "初年度年会費無料＋提携ショップ還元率2倍（3か月）",
      en: "First year free plus double rates at partner stores for three months",
    },
    maxValue: 12000,
    conditions: {
      ja: [
        "入会日から3か月間、提携ネットショップ経由の利用が対象",
        "還元率2倍分の上限は合計12,000円相当",
        "3か月経過後は通常の還元率へ戻る",
      ],
      en: [
        "Applies to partner-store purchases for three months from enrolment",
        "The doubled portion is capped at ¥12,000 in value",
        "Rates return to normal after three months",
      ],
    },
    endsOn: "2026-10-31",
    target: { ja: "新規入会者のみ", en: "New members only" },
    officialUrl: "https://example.com/nova-flux/campaign",
  },
  {
    id: "cmp-meridian-gold-01",
    cardId: "meridian-gold",
    title: {
      ja: "初年度年会費無料＋条件達成で最大20,000ポイント",
      en: "First year free plus up to 20,000 points on qualifying spend",
    },
    maxValue: 20000,
    conditions: {
      ja: [
        "入会から3か月以内に合計30万円以上を利用",
        "ポイントは条件達成の翌々月末に付与",
        "年会費無料は初年度のみ。2年目以降は年間100万円の利用が条件",
      ],
      en: [
        "Spend ¥300,000 or more within three months of enrolment",
        "Points post at the end of the second month after you qualify",
        "The fee waiver covers year one only; year two onward requires ¥1m of annual spend",
      ],
    },
    endsOn: "2026-08-31",
    target: {
      ja: "新規入会者のみ（過去に同社カードを保有していた方は対象外）",
      en: "New members only (previous holders excluded)",
    },
    officialUrl: "https://example.com/meridian-gold/campaign",
  },
  {
    id: "cmp-aurum-platinum-01",
    cardId: "aurum-platinum",
    title: {
      ja: "入会後6か月の利用で最大60,000ポイント",
      en: "Up to 60,000 points on spend in your first six months",
    },
    maxValue: 60000,
    conditions: {
      ja: [
        "入会から6か月以内に合計150万円以上を利用",
        "年会費55,000円は初年度から必要",
        "ポイントの有効期限は無期限だが、退会時に失効",
      ],
      en: [
        "Spend ¥1,500,000 or more within six months of enrolment",
        "The ¥55,000 annual fee applies from year one",
        "Points do not expire but are forfeited if you close the account",
      ],
    },
    endsOn: "2026-12-31",
    target: { ja: "新規入会者のみ", en: "New members only" },
    officialUrl: "https://example.com/aurum-platinum/campaign",
  },
  {
    id: "cmp-orbit-business-01",
    cardId: "orbit-business",
    title: {
      ja: "法人・個人事業主向け 発行手数料無料＋最大30,000ポイント",
      en: "No issuance fee plus up to 30,000 points for businesses",
    },
    maxValue: 30000,
    conditions: {
      ja: [
        "入会から2か月以内に合計50万円以上を利用",
        "会計ソフト連携の設定完了が条件に含まれる",
        "同一法人での重複申込みは対象外",
      ],
      en: [
        "Spend ¥500,000 or more within two months of enrolment",
        "You must complete the accounting integration setup",
        "Duplicate applications from the same entity are excluded",
      ],
    },
    endsOn: "2026-09-15",
    target: { ja: "法人・個人事業主", en: "Companies and sole proprietors" },
    officialUrl: "https://example.com/orbit-business/campaign",
  },
  {
    id: "cmp-hoshimart-plus-01",
    cardId: "hoshimart-plus",
    title: {
      ja: "グループ店舗の還元率が3か月間+2%",
      en: "An extra 2% at group stores for three months",
    },
    maxValue: 6000,
    conditions: {
      ja: [
        "入会日から3か月間、グループのスーパー・コンビニでの利用が対象",
        "上乗せ分の上限は合計6,000ポイント",
      ],
      en: [
        "Applies to group supermarket and convenience store spend for three months",
        "The uplift is capped at 6,000 points",
      ],
    },
    endsOn: "2026-08-20",
    target: { ja: "新規入会者のみ", en: "New members only" },
    officialUrl: "https://example.com/hoshimart-plus/campaign",
  },
  {
    id: "cmp-meridian-sky-01",
    cardId: "meridian-sky",
    title: {
      ja: "入会後3か月の利用で最大15,000マイル相当",
      en: "Up to 15,000 miles in value on spend in your first three months",
    },
    maxValue: 15000,
    conditions: {
      ja: [
        "入会から3か月以内に合計50万円以上を利用",
        "マイルへの移行手続きが別途必要",
        "年会費22,000円は初年度から必要",
      ],
      en: [
        "Spend ¥500,000 within three months of enrolment",
        "A separate transfer step to miles is required",
        "The ¥22,000 fee applies from year one",
      ],
    },
    endsOn: "2026-11-30",
    target: { ja: "新規入会者のみ", en: "New members only" },
    officialUrl: "https://example.com/meridian-sky/campaign",
  },
  {
    id: "cmp-chainbridge-nova-01",
    cardId: "chainbridge-nova",
    title: {
      ja: "初年度年会費無料＋還元率+0.5%（2か月）",
      en: "First year free plus a 0.5% uplift for two months",
    },
    maxValue: 5000,
    conditions: {
      ja: [
        "入会から2か月間の利用が対象",
        "還元は暗号資産で付与され、受け取り時点の価格で価値が決まる",
        "上乗せ分の上限は5,000円相当",
      ],
      en: [
        "Applies to spend in your first two months",
        "Rewards are paid in crypto and valued at the price when received",
        "The uplift is capped at ¥5,000 in value",
      ],
    },
    endsOn: "2026-08-10",
    target: { ja: "新規入会者のみ", en: "New members only" },
    officialUrl: "https://example.com/chainbridge-nova/campaign",
  },
  {
    id: "cmp-nova-travel-01",
    cardId: "nova-travel",
    title: {
      ja: "初年度年会費無料＋旅行予約で還元率+1%",
      en: "First year free plus a 1% uplift on travel bookings",
    },
    maxValue: 10000,
    conditions: {
      ja: ["入会から6か月以内の旅行予約サイト経由の利用が対象", "上乗せ分の上限は10,000ポイント"],
      en: [
        "Applies to travel portal bookings within six months of enrolment",
        "The uplift is capped at 10,000 points",
      ],
    },
    endsOn: "2026-10-15",
    target: { ja: "新規入会者のみ", en: "New members only" },
    officialUrl: "https://example.com/nova-travel/campaign",
  },
  {
    id: "cmp-nova-student-01",
    cardId: "nova-student",
    title: { ja: "学生限定 入会で1,000ポイント", en: "1,000 points for students who join" },
    maxValue: 1000,
    conditions: {
      ja: ["在学確認が取れた方が対象", "カード受け取り後、アプリへのログインが必要"],
      en: [
        "Requires confirmation of student status",
        "You must log in to the app after receiving the card",
      ],
    },
    endsOn: "2026-09-30",
    target: { ja: "満18歳以上29歳以下の学生", en: "Students aged 18–29" },
    officialUrl: "https://example.com/nova-student/campaign",
  },
];

/**
 * 掲載期限を過ぎたキャンペーンか。
 * 期限切れは非表示にせず「期限を過ぎている」と明示します（存在した事実まで消さないため）。
 */
export function isExpired(campaign: CardCampaign, today = new Date()): boolean {
  const end = new Date(`${campaign.endsOn}T23:59:59Z`);
  return end.getTime() < today.getTime();
}

export function getCampaignsByCardId(cardId: string): CardCampaign[] {
  return campaigns.filter((campaign) => campaign.cardId === cardId);
}

/** 期限が近い順。期限切れは末尾へ回します */
export function sortCampaigns(list: CardCampaign[], today = new Date()): CardCampaign[] {
  return [...list].sort((a, b) => {
    const aExpired = isExpired(a, today);
    const bExpired = isExpired(b, today);
    if (aExpired !== bExpired) return aExpired ? 1 : -1;
    return a.endsOn.localeCompare(b.endsOn);
  });
}
