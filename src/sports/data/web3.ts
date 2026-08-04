/**
 * Web3.0 スポーツサービス（デモ）。
 *
 * ■ サービス名は架空です。実在サービスに誤った料金・対応チェーンを掲載しないためです。
 * ■ 当サイトは購入・投資を推奨しません。価格の上昇を示唆する表現も使いません。
 * ■ 各サービスには必ず risks（リスク）を持たせ、UI 上で benefits と同じ大きさで表示します。
 */
import type { FanToken, NftCollection, Web3Service } from "../types";

const commonRisks = [
  {
    ja: "価格が大きく変動し、購入額を大きく下回ることがあります。",
    en: "Prices move sharply and can fall well below what you paid.",
  },
  {
    ja: "運営会社の都合でサービスが終了する可能性があります。",
    en: "The operator can shut the service down.",
  },
  {
    ja: "国・地域の規制変更により利用できなくなる場合があります。",
    en: "Regulatory change may make the service unavailable where you live.",
  },
  {
    ja: "公式を装った偽サイト・偽アプリによる詐欺が報告されています。",
    en: "Fake sites and apps impersonating official services are a known problem.",
  },
];

export const web3Services: Web3Service[] = [
  {
    id: "w-fanvote",
    slug: "fanvote-arena",
    name: "FANVOTE ARENA（デモ）",
    category: "fan-token",
    summary: {
      ja: "クラブが発行するトークンを保有すると、投票企画や限定コンテンツに参加できるプラットフォームです。",
      en: "Hold a club's token to join fan votes and access members-only content.",
    },
    sportIds: ["football", "basketball"],
    leagueIds: ["premier-league", "laliga", "nba"],
    chains: ["Ethereum", "Polygon"],
    pricing: {
      ja: "アプリの利用は無料。トークン購入時に取引手数料がかかります。",
      en: "Free to use; trading fees apply when buying tokens.",
    },
    hasFreePlan: true,
    token: "デモトークン",
    wallet: ["MetaMask", "WalletConnect"],
    languages: ["ja", "en", "es", "pt"],
    regions: ["jp", "gb", "es", "br"],
    features: [
      { ja: "クラブ企画への投票参加", en: "Vote in club polls" },
      { ja: "限定動画・グッズ抽選への応募", en: "Members-only videos and prize draws" },
    ],
    howTo: [
      {
        ja: "ウォレットを作成し、対応チェーンのネットワークを追加します。",
        en: "Create a wallet and add the supported network.",
      },
      {
        ja: "公式サイトからトークンを取得します（URLは必ずブックマークから開きます）。",
        en: "Get tokens from the official site — always open it from a bookmark.",
      },
      { ja: "アプリと接続し、投票企画に参加します。", en: "Connect the app and join a vote." },
    ],
    benefits: [
      { ja: "クラブとの接点が増えます。", en: "More touchpoints with the club." },
      { ja: "遠方のファンでも企画に参加できます。", en: "Distant fans can take part." },
    ],
    risks: commonRisks,
    officialUrl: "https://example.com/fanvote-arena",
    affiliateId: "aff-fanvote",
    verifiedAt: "2026-08-01",
  },
  {
    id: "w-momentvault",
    slug: "moment-vault",
    name: "MOMENT VAULT（デモ）",
    category: "nft",
    summary: {
      ja: "試合の名場面をデジタルコレクションとして扱うマーケットプレイスです。",
      en: "A marketplace treating match highlights as digital collectibles.",
    },
    sportIds: ["basketball", "football"],
    leagueIds: ["nba", "premier-league"],
    chains: ["Flow", "Polygon"],
    pricing: {
      ja: "閲覧は無料。購入時にガス代と手数料がかかります。",
      en: "Free to browse; gas and marketplace fees apply on purchase.",
    },
    hasFreePlan: true,
    wallet: ["MetaMask", "Coinbase Wallet"],
    languages: ["en", "ja"],
    regions: ["us", "jp", "gb"],
    features: [
      { ja: "名場面のデジタルコレクション", en: "Collectible highlight moments" },
      { ja: "二次流通マーケット", en: "Secondary marketplace" },
    ],
    howTo: [
      { ja: "ウォレットを接続します。", en: "Connect a wallet." },
      {
        ja: "コレクションを選び、内容と発行元を確認します。",
        en: "Pick a collection and check what it includes and who issued it.",
      },
    ],
    benefits: [
      { ja: "所有履歴がチェーン上に記録されます。", en: "Ownership history is recorded on-chain." },
    ],
    risks: [
      ...commonRisks,
      {
        ja: "映像そのものの著作権が移転するわけではありません。",
        en: "You are not acquiring copyright in the footage itself.",
      },
    ],
    officialUrl: "https://example.com/moment-vault",
    affiliateId: "aff-moment",
    verifiedAt: "2026-08-01",
  },
  {
    id: "w-lineupdao",
    slug: "lineup-dao",
    name: "LINEUP DAO（デモ）",
    category: "dao",
    summary: {
      ja: "ファン参加型の意思決定を試みるコミュニティ。提案と投票がオンチェーンで行われます。",
      en: "A community experimenting with fan-led decisions, with proposals and voting on-chain.",
    },
    sportIds: ["football"],
    leagueIds: ["j1-league"],
    chains: ["Polygon"],
    pricing: {
      ja: "参加は無料。提案時に手数料がかかる場合があります。",
      en: "Free to join; proposals may incur a fee.",
    },
    hasFreePlan: true,
    wallet: ["MetaMask"],
    languages: ["ja", "en"],
    regions: ["jp"],
    features: [{ ja: "提案・投票", en: "Proposals and voting" }],
    howTo: [
      {
        ja: "コミュニティに参加し、提案を読みます。",
        en: "Join the community and read the proposals.",
      },
    ],
    benefits: [{ ja: "運営方針への意見が可視化されます。", en: "Fan opinion becomes visible." }],
    risks: [
      ...commonRisks,
      { ja: "投票結果に法的拘束力はありません。", en: "Votes carry no legal force." },
    ],
    officialUrl: "https://example.com/lineup-dao",
    verifiedAt: "2026-08-01",
  },
  {
    id: "w-fantasy-terminal",
    slug: "fantasy-terminal",
    name: "FANTASY TERMINAL（デモ）",
    category: "fantasy",
    summary: {
      ja: "実際の試合結果と連動するファンタジースポーツ。無料プランで一通り遊べます。",
      en: "Fantasy sports driven by real results, playable in full on the free tier.",
    },
    sportIds: ["football", "basketball", "baseball"],
    leagueIds: ["premier-league", "nba", "npb"],
    chains: [],
    pricing: { ja: "基本無料。有料リーグは提供していません。", en: "Free; no paid leagues." },
    hasFreePlan: true,
    wallet: [],
    languages: ["ja", "en", "ko", "id"],
    regions: ["jp", "us", "gb", "kr", "id"],
    features: [
      { ja: "選手を選んでチームを編成", en: "Draft a squad" },
      { ja: "順位表と週間ランキング", en: "Standings and weekly rankings" },
    ],
    howTo: [
      {
        ja: "アカウントを作成し、予算内で選手を選びます。",
        en: "Create an account and pick players within a budget.",
      },
    ],
    benefits: [
      { ja: "選手やスタッツに詳しくなります。", en: "You learn the players and the numbers." },
    ],
    risks: [
      {
        ja: "賞金の出る形式は地域によって規制対象です。当サービスは賞金を扱いません。",
        en: "Prize formats are regulated in some regions; this service has none.",
      },
    ],
    officialUrl: "https://example.com/fantasy-terminal",
    verifiedAt: "2026-08-01",
  },
  {
    id: "w-ticketchain",
    slug: "ticket-chain",
    name: "TICKETCHAIN（デモ）",
    category: "ticketing",
    summary: {
      ja: "デジタルチケットの発行・本人確認・転売制御を扱うサービスです。",
      en: "Digital ticketing with identity checks and resale controls.",
    },
    sportIds: ["football", "baseball", "rugby"],
    leagueIds: ["j1-league", "npb", "top-league-rugby"],
    chains: ["Polygon"],
    pricing: {
      ja: "発行手数料はイベント主催者負担。購入者は券面価格のみ。",
      en: "Issuance fees are paid by the organiser; buyers pay face value.",
    },
    hasFreePlan: true,
    wallet: ["アプリ内ウォレット"],
    languages: ["ja", "en"],
    regions: ["jp"],
    features: [{ ja: "不正転売の抑止", en: "Discourages illegitimate resale" }],
    howTo: [
      {
        ja: "アプリでチケットを購入し、入場時に画面を提示します。",
        en: "Buy in the app and show the screen at the gate.",
      },
    ],
    benefits: [{ ja: "紙のチケットの紛失リスクがありません。", en: "No paper tickets to lose." }],
    risks: [
      { ja: "端末の紛失・電池切れに備えた運用が必要です。", en: "Plan for a lost or dead phone." },
    ],
    officialUrl: "https://example.com/ticket-chain",
    verifiedAt: "2026-08-01",
  },
  {
    id: "w-statmarket",
    slug: "stat-market",
    name: "STAT MARKET（デモ）",
    category: "data-market",
    summary: {
      ja: "試合スタッツをAPIとして提供・購入できるデータマーケットです。",
      en: "A marketplace for buying and selling match data via API.",
    },
    sportIds: ["football", "basketball"],
    leagueIds: ["premier-league", "nba"],
    chains: [],
    pricing: {
      ja: "従量課金。無料枠は月1,000リクエストです。",
      en: "Usage-based, with a free tier of 1,000 requests per month.",
    },
    hasFreePlan: true,
    wallet: [],
    languages: ["en", "ja"],
    regions: ["jp", "us", "gb"],
    features: [
      { ja: "REST API", en: "REST API" },
      { ja: "履歴データのエクスポート", en: "Historical exports" },
    ],
    howTo: [
      {
        ja: "APIキーを取得し、サーバー側から呼び出します。",
        en: "Get an API key and call it from your server.",
      },
    ],
    benefits: [{ ja: "自分でデータを検証できます。", en: "You can verify the data yourself." }],
    risks: [
      {
        ja: "利用規約により再配布が制限される場合があります。",
        en: "Redistribution is often restricted by the terms.",
      },
    ],
    officialUrl: "https://example.com/stat-market",
    verifiedAt: "2026-08-01",
  },
  {
    id: "w-metastand",
    slug: "meta-stand",
    name: "META STAND（デモ）",
    category: "metaverse",
    summary: {
      ja: "バーチャル空間で試合を一緒に観る、観戦コミュニティサービスです。",
      en: "Watch matches together in a shared virtual space.",
    },
    sportIds: ["football", "esports"],
    leagueIds: ["premier-league", "valorant-champions"],
    chains: [],
    pricing: { ja: "無料。アバターの一部が有料です。", en: "Free, with paid avatar items." },
    hasFreePlan: true,
    wallet: [],
    languages: ["ja", "en", "ko"],
    regions: ["jp", "us", "kr"],
    features: [{ ja: "音声チャット付きの同時視聴", en: "Co-viewing with voice chat" }],
    howTo: [
      { ja: "アカウントを作成し、ルームに参加します。", en: "Create an account and join a room." },
    ],
    benefits: [
      { ja: "遠方の友人と一緒に観戦できます。", en: "Watch with friends who live far away." },
    ],
    risks: [
      {
        ja: "映像の配信は各サービスの規約に従う必要があります。",
        en: "Streaming footage must comply with the rights holder's terms.",
      },
    ],
    officialUrl: "https://example.com/meta-stand",
    verifiedAt: "2026-08-01",
  },
  {
    id: "w-athletebacked",
    slug: "athlete-backed",
    name: "ATHLETE BACKED（デモ）",
    category: "athlete-support",
    summary: {
      ja: "若手選手の活動を支援し、活動報告を受け取るサービスです。",
      en: "Support young athletes and receive their progress reports.",
    },
    sportIds: ["olympics", "winter-sports", "tennis"],
    leagueIds: [],
    chains: [],
    pricing: {
      ja: "支援額は任意。手数料は支援額の数％です。",
      en: "Choose your amount; a small percentage fee applies.",
    },
    hasFreePlan: false,
    wallet: [],
    languages: ["ja", "en"],
    regions: ["jp"],
    features: [{ ja: "月次の活動報告", en: "Monthly updates" }],
    howTo: [{ ja: "選手を選び、支援額を決めます。", en: "Pick an athlete and choose an amount." }],
    benefits: [
      {
        ja: "資金面で支援が届きにくい競技を支えられます。",
        en: "Reaches sports that struggle for funding.",
      },
    ],
    risks: [
      {
        ja: "支援は寄付であり、リターンを保証するものではありません。",
        en: "Support is a donation, not an investment with a return.",
      },
    ],
    officialUrl: "https://example.com/athlete-backed",
    verifiedAt: "2026-08-01",
  },
];

export const web3ById = new Map(web3Services.map((service) => [service.id, service]));

export function getWeb3(id: string | undefined): Web3Service | undefined {
  if (!id) return undefined;
  return web3ById.get(id);
}

export function getWeb3BySlug(slug: string): Web3Service | undefined {
  return web3Services.find((service) => service.slug === slug);
}

export const fanTokens: FanToken[] = [
  {
    id: "ft-arsenal",
    symbol: "DEMO-ARS",
    teamName: "アーセナル（デモ）",
    teamId: "t-arsenal",
    sportId: "football",
    platform: "FANVOTE ARENA（デモ）",
    chain: "Polygon",
    utility: [
      { ja: "クラブ企画への投票参加", en: "Vote in club polls" },
      { ja: "限定コンテンツへのアクセス", en: "Access to members-only content" },
    ],
    officialUrl: "https://example.com/fanvote-arena/ars",
    verifiedAt: "2026-08-01",
  },
  {
    id: "ft-barcelona",
    symbol: "DEMO-BAR",
    teamName: "FCバルセロナ（デモ）",
    teamId: "t-barcelona",
    sportId: "football",
    platform: "FANVOTE ARENA（デモ）",
    chain: "Ethereum",
    utility: [{ ja: "投票参加とグッズ抽選", en: "Voting and prize draws" }],
    officialUrl: "https://example.com/fanvote-arena/bar",
    verifiedAt: "2026-08-01",
  },
  {
    id: "ft-kawasaki",
    symbol: "DEMO-KAW",
    teamName: "川崎フロンターレ（デモ）",
    teamId: "t-kawasaki",
    sportId: "football",
    platform: "LINEUP DAO（デモ）",
    chain: "Polygon",
    utility: [{ ja: "コミュニティ提案への投票", en: "Vote on community proposals" }],
    officialUrl: "https://example.com/lineup-dao/kaw",
    verifiedAt: "2026-08-01",
  },
  {
    id: "ft-celtics",
    symbol: "DEMO-BOS",
    teamName: "ボストン・セルティックス（デモ）",
    teamId: "t-celtics",
    sportId: "basketball",
    platform: "FANVOTE ARENA（デモ）",
    chain: "Polygon",
    utility: [{ ja: "限定配信の視聴権", en: "Access to members-only streams" }],
    officialUrl: "https://example.com/fanvote-arena/bos",
    verifiedAt: "2026-08-01",
  },
];

export const nftCollections: NftCollection[] = [
  {
    id: "nft-moments",
    name: "LEAGUE MOMENTS（デモ）",
    sportId: "basketball",
    chain: "Flow",
    marketplace: "MOMENT VAULT（デモ）",
    summary: {
      ja: "1試合の名場面を短い映像として扱うコレクション。",
      en: "Short highlight clips issued as a collection.",
    },
    officialUrl: "https://example.com/moment-vault/league-moments",
    verifiedAt: "2026-08-01",
  },
  {
    id: "nft-crests",
    name: "CREST SERIES（デモ）",
    sportId: "football",
    chain: "Polygon",
    marketplace: "MOMENT VAULT（デモ）",
    summary: {
      ja: "クラブの歴史をテーマにしたデジタルカード。",
      en: "Digital cards themed on club history.",
    },
    officialUrl: "https://example.com/moment-vault/crest-series",
    verifiedAt: "2026-08-01",
  },
  {
    id: "nft-tickets",
    name: "MATCHDAY STUBS（デモ）",
    sportId: "football",
    chain: "Polygon",
    marketplace: "TICKETCHAIN（デモ）",
    summary: {
      ja: "来場記念として発行されるデジタル半券。",
      en: "Digital ticket stubs issued as attendance mementos.",
    },
    officialUrl: "https://example.com/ticket-chain/stubs",
    verifiedAt: "2026-08-01",
  },
];
