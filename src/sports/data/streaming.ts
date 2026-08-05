/**
 * スポーツ配信サービス比較（デモ）。
 *
 * ■ サービス名はすべて架空です。
 *   実在の配信サービスに誤った料金・対象大会を掲載すると、
 *   利用者の契約判断を直接誤らせるため、確認済みの実データが入るまで架空名にしています。
 * ■ URL は example.com（ドキュメント用の予約ドメイン）を使用しています。
 *   実運用では管理画面のアフィリエイトリンク管理から差し替えます。
 * ■ 料金・放映権・配信対象は変わるため、verifiedAt（情報確認日）を必ず表示します。
 */
import type { StreamingService } from "../types";

export const streamingServices: StreamingService[] = [
  {
    id: "stream-global-football",
    slug: "global-football-pass",
    name: "GLOBAL FOOTBALL PASS（デモ）",
    regions: ["jp", "gb", "us", "de", "es"],
    sportIds: ["football"],
    leagueIds: ["premier-league", "laliga", "ucl"],
    monthlyPriceJpy: 2480,
    yearlyPriceJpy: 24800,
    freeTrialDays: 14,
    live: true,
    onDemand: true,
    simultaneousStreams: 2,
    maxQuality: "4K HDR",
    devices: ["phone", "pc", "tv", "console"],
    japaneseCommentary: true,
    overseasViewing: "check",
    cancellation: {
      ja: "アプリまたはWebのアカウント設定からいつでも解約できます。",
      en: "Cancel any time from account settings in the app or on the web.",
    },
    campaign: {
      ja: "初月半額（適用条件は公式サイトをご確認ください）",
      en: "Half price for the first month; conditions on the official site.",
    },
    officialUrl: "https://example.com/global-football-pass",
    affiliateId: "aff-global-football",
    verifiedAt: "2026-08-01",
    notes: {
      ja: "対象大会は契約更新のたびに変わります。",
      en: "Covered competitions change at each rights renewal.",
    },
  },
  {
    id: "stream-allsports",
    slug: "allsports-terminal",
    name: "ALLSPORTS TERMINAL（デモ）",
    regions: ["jp"],
    sportIds: ["football", "baseball", "basketball", "american-football", "mma", "f1", "tennis"],
    leagueIds: [
      "premier-league",
      "j1-league",
      "nba",
      "npb",
      "mlb",
      "nfl",
      "ucl",
      "ufc",
      "f1-championship",
    ],
    monthlyPriceJpy: 3980,
    yearlyPriceJpy: 39800,
    freeTrialDays: 7,
    live: true,
    onDemand: true,
    simultaneousStreams: 3,
    maxQuality: "4K",
    devices: ["phone", "pc", "tv", "console"],
    japaneseCommentary: true,
    overseasViewing: "no",
    cancellation: {
      ja: "Webのアカウントページから解約できます。アプリ内課金の場合はストア側の手続きが必要です。",
      en: "Cancel on the web; in-app purchases must be cancelled through the store.",
    },
    officialUrl: "https://example.com/allsports-terminal",
    affiliateId: "aff-allsports",
    verifiedAt: "2026-08-01",
    notes: {
      ja: "対象競技が最も広い一方、単一競技だけを見たい場合は割高になります。",
      en: "The broadest coverage, but expensive if you only follow one sport.",
    },
  },
  {
    id: "stream-jsports-plus",
    slug: "nippon-sports-plus",
    name: "NIPPON SPORTS+（デモ）",
    regions: ["jp"],
    sportIds: ["football", "baseball", "rugby"],
    leagueIds: ["j1-league", "npb", "top-league-rugby"],
    monthlyPriceJpy: 1980,
    yearlyPriceJpy: 19800,
    freeTrialDays: 14,
    live: true,
    onDemand: true,
    simultaneousStreams: 2,
    maxQuality: "1080p",
    devices: ["phone", "pc", "tv"],
    japaneseCommentary: true,
    overseasViewing: "no",
    cancellation: { ja: "アカウント設定から解約できます。", en: "Cancel from account settings." },
    officialUrl: "https://example.com/nippon-sports-plus",
    affiliateId: "aff-nippon-sports",
    verifiedAt: "2026-08-01",
    notes: {
      ja: "国内リーグ中心。海外大会は対象外です。",
      en: "Focused on domestic leagues; no overseas competitions.",
    },
  },
  {
    id: "stream-hoops-pass",
    slug: "hoops-pass",
    name: "HOOPS PASS（デモ）",
    regions: ["jp", "us"],
    sportIds: ["basketball"],
    leagueIds: ["nba", "b-league"],
    monthlyPriceJpy: 1780,
    yearlyPriceJpy: 17800,
    freeTrialDays: 7,
    live: true,
    onDemand: true,
    simultaneousStreams: 2,
    maxQuality: "1080p",
    devices: ["phone", "pc", "tv"],
    japaneseCommentary: true,
    overseasViewing: "check",
    cancellation: {
      ja: "Webのアカウントページから解約できます。",
      en: "Cancel from the account page on the web.",
    },
    officialUrl: "https://example.com/hoops-pass",
    affiliateId: "aff-hoops",
    verifiedAt: "2026-08-01",
    notes: {
      ja: "バスケットボール特化。時差の都合で見逃し配信の利用が中心になります。",
      en: "Basketball only; the time difference means most viewing is on demand.",
    },
  },
  {
    id: "stream-diamond-tv",
    slug: "diamond-tv",
    name: "DIAMOND TV（デモ）",
    regions: ["jp", "us"],
    sportIds: ["baseball"],
    leagueIds: ["mlb", "npb"],
    monthlyPriceJpy: 2180,
    freeTrialDays: 7,
    live: true,
    onDemand: true,
    simultaneousStreams: 2,
    maxQuality: "1080p",
    devices: ["phone", "pc", "tv"],
    japaneseCommentary: true,
    overseasViewing: "no",
    cancellation: { ja: "アカウント設定から解約できます。", en: "Cancel from account settings." },
    officialUrl: "https://example.com/diamond-tv",
    affiliateId: "aff-diamond",
    verifiedAt: "2026-08-01",
    notes: {
      ja: "地域によっては一部の試合がブラックアウトになります。",
      en: "Some games are blacked out depending on your region.",
    },
  },
  {
    id: "stream-gridiron-now",
    slug: "gridiron-now",
    name: "GRIDIRON NOW（デモ）",
    regions: ["jp", "us"],
    sportIds: ["american-football"],
    leagueIds: ["nfl"],
    monthlyPriceJpy: 1580,
    freeTrialDays: 0,
    live: true,
    onDemand: true,
    simultaneousStreams: 1,
    maxQuality: "1080p",
    devices: ["phone", "pc", "tv"],
    japaneseCommentary: false,
    overseasViewing: "check",
    cancellation: {
      ja: "シーズン単位の契約です。解約条件は公式サイトをご確認ください。",
      en: "Sold by season; check the official site for cancellation terms.",
    },
    officialUrl: "https://example.com/gridiron-now",
    affiliateId: "aff-gridiron",
    verifiedAt: "2026-08-01",
    notes: { ja: "日本語実況は提供されていません。", en: "No Japanese commentary." },
  },
  {
    id: "stream-velocity-tv",
    slug: "velocity-tv",
    name: "VELOCITY TV（デモ）",
    regions: ["jp", "gb", "de", "it"],
    sportIds: ["f1", "motogp"],
    leagueIds: ["f1-championship"],
    monthlyPriceJpy: 2980,
    yearlyPriceJpy: 29800,
    freeTrialDays: 7,
    live: true,
    onDemand: true,
    simultaneousStreams: 2,
    maxQuality: "4K",
    devices: ["phone", "pc", "tv"],
    japaneseCommentary: true,
    overseasViewing: "check",
    cancellation: { ja: "アカウント設定から解約できます。", en: "Cancel from account settings." },
    officialUrl: "https://example.com/velocity-tv",
    affiliateId: "aff-velocity",
    verifiedAt: "2026-08-01",
    notes: {
      ja: "オンボード映像などの追加機能は上位プランのみです。",
      en: "Onboard feeds require the higher tier.",
    },
  },
  {
    id: "stream-cage-live",
    slug: "cage-live",
    name: "CAGE LIVE（デモ）",
    regions: ["jp", "us"],
    sportIds: ["mma", "boxing"],
    leagueIds: ["ufc"],
    monthlyPriceJpy: 1280,
    freeTrialDays: 0,
    live: true,
    onDemand: true,
    simultaneousStreams: 1,
    maxQuality: "1080p",
    devices: ["phone", "pc", "tv"],
    japaneseCommentary: true,
    overseasViewing: "no",
    cancellation: { ja: "アカウント設定から解約できます。", en: "Cancel from account settings." },
    officialUrl: "https://example.com/cage-live",
    affiliateId: "aff-cage",
    verifiedAt: "2026-08-01",
    notes: {
      ja: "大会によっては別途PPVが必要です。",
      en: "Some events require a separate pay-per-view purchase.",
    },
  },
  {
    id: "stream-arena-gg",
    slug: "arena-gg",
    name: "ARENA.GG（デモ）",
    regions: ["jp", "us", "kr", "id", "vn", "th"],
    sportIds: ["esports"],
    leagueIds: ["valorant-champions"],
    monthlyPriceJpy: 0,
    freeTrialDays: 0,
    live: true,
    onDemand: true,
    simultaneousStreams: 3,
    maxQuality: "1080p60",
    devices: ["phone", "pc", "tv"],
    japaneseCommentary: true,
    overseasViewing: "yes",
    cancellation: {
      ja: "無料のため解約手続きはありません。",
      en: "Free to watch; nothing to cancel.",
    },
    officialUrl: "https://example.com/arena-gg",
    verifiedAt: "2026-08-01",
    notes: {
      ja: "多くの大会が公式チャンネルで無料配信されています。",
      en: "Most events are streamed free on the official channels.",
    },
  },
];

export const streamingById = new Map(streamingServices.map((service) => [service.id, service]));

export function getStreaming(id: string | undefined): StreamingService | undefined {
  if (!id) return undefined;
  return streamingById.get(id);
}

export function getStreamingBySlug(slug: string): StreamingService | undefined {
  return streamingServices.find((service) => service.slug === slug);
}

export function streamingForIds(ids: string[]): StreamingService[] {
  return ids
    .map((id) => streamingById.get(id))
    .filter((service): service is StreamingService => Boolean(service));
}

export function streamingForLeague(leagueId: string): StreamingService[] {
  return streamingServices.filter((service) => service.leagueIds.includes(leagueId));
}

export function streamingForSport(sportId: string): StreamingService[] {
  return streamingServices.filter((service) => service.sportIds.includes(sportId));
}
