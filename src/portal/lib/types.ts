/**
 * ポータル全体で共有するドメイン型。
 *
 * データソース（モック / 外部API / Supabase）が変わっても
 * UI 側がそのまま動くよう、ここを唯一の契約とします。
 */

/**
 * 言語別テキスト。
 * ja と en は必須です（一次言語）。他は任意で、無ければ en → ja の順にフォールバックします。
 */
export type LocalizedText = { ja: string; en: string } & Partial<Record<string, string>>;

export type LocalizedList = { ja: string[]; en: string[] } & Partial<Record<string, string[]>>;

/** 三値。「情報なし」を false と区別します（未確認を「非対応」と書かないため）。 */
export type Support = "yes" | "no" | "partial" | "unknown";

// ---------------------------------------------------------------------------
// マーケット
// ---------------------------------------------------------------------------

export type CoinId = string;

/** 通貨のプロフィール（価格を含まない、めったに変わらない情報） */
export type Coin = {
  id: CoinId;
  /** URL スラッグ（/[locale]/coins/<slug>） */
  slug: string;
  symbol: string;
  name: LocalizedText;
  /** 検索の表記ゆれ用。カタカナ・別名・旧名など */
  aliases: string[];
  /** ブランドカラー（カード・チャートのアクセント） */
  color: string;
  categories: string[];
  summary: LocalizedText;
  description: LocalizedText;
  features: LocalizedList;
  risks: LocalizedList;
  links: {
    website?: string;
    whitepaper?: string;
    explorer?: string;
    github?: string;
  };
  /** 循環供給量・最大供給量（判明しているもののみ） */
  circulatingSupply?: number;
  maxSupply?: number;
  /** 取り扱いのある取引所 ID */
  listedOn: string[];
  consensus?: LocalizedText;
  launchedAt?: string;
};

/** 価格を含む市場データ。取得日時を必ず持ち回ります。 */
export type CoinMarket = {
  id: CoinId;
  rank: number;
  price: number;
  change1h: number;
  change24h: number;
  change7d: number;
  change30d?: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply?: number;
  maxSupply?: number;
  ath?: number;
  athDate?: string;
  atl?: number;
  atlDate?: string;
  /** 7日分のスパークライン（等間隔） */
  sparkline: number[];
};

export type MarketGlobal = {
  totalMarketCap: number;
  totalVolume24h: number;
  marketCapChange24h: number;
  btcDominance: number;
  ethDominance: number;
  activeCoins: number;
};

export type FearGreed = {
  /** 0–100 */
  value: number;
  classification: "extreme-fear" | "fear" | "neutral" | "greed" | "extreme-greed";
};

export type ChartPeriod = "d1" | "d7" | "m1" | "m3" | "y1" | "all";

export type PricePoint = { t: number; p: number };

/** すべての市場データの入れ物。`fetchedAt` と `source` は必ず画面に出します。 */
export type MarketSnapshot = {
  coins: CoinMarket[];
  global: MarketGlobal;
  fearGreed: FearGreed;
  trending: CoinId[];
  newListings: CoinId[];
  /** ISO 8601。UI では「取得日時」として表示します */
  fetchedAt: string;
  /** データの出どころ。mock のときは画面上でもモックであると明示します */
  source: "mock" | "coingecko";
  /** 更新間隔の実測値（秒）。「リアルタイム」と書かず実際の頻度を出します */
  refreshIntervalSec: number;
  /** 取得に失敗してフォールバックした場合の理由 */
  degraded?: string;
};

// ---------------------------------------------------------------------------
// ニュース
// ---------------------------------------------------------------------------

export type NewsCategory =
  | "bitcoin"
  | "ethereum"
  | "altcoin"
  | "defi"
  | "nft"
  | "gamefi"
  | "web3"
  | "exchange"
  | "regulation"
  | "tax"
  | "security"
  | "ai"
  | "metaverse"
  | "stablecoin";

export type NewsLabel =
  "breaking" | "important" | "regulation" | "listing" | "hack" | "volatility" | "impact";

export type NewsArticle = {
  id: string;
  slug: string;
  title: LocalizedText;
  summary: LocalizedText;
  body: LocalizedList;
  category: NewsCategory;
  labels: NewsLabel[];
  tags: string[];
  /** 情報元メディア名。二次情報であることを隠さないため必須です */
  outlet: string;
  /** 一次情報へのリンク */
  sourceUrl?: string;
  publishedAt: string;
  updatedAt?: string;
  /** 事実確認をした日 */
  checkedAt?: string;
  image?: string;
  readingMinutes: number;
  authorId: string;
  reviewerId?: string;
  relatedCoins: CoinId[];
  /** 重複判定に使う正規化キー。同じ出来事の記事は同じ値を持ちます */
  storyKey?: string;
  metrics: { views: number; clicks: number; shares: number };
};

// ---------------------------------------------------------------------------
// 取引所
// ---------------------------------------------------------------------------

export type ExchangeRegion = "domestic" | "overseas";

export type Exchange = {
  id: string;
  slug: string;
  name: string;
  region: ExchangeRegion;
  /** ロゴが無いときはワードマークにフォールバックします */
  logo?: string;
  color: string;
  operator: LocalizedText;
  summary: LocalizedText;
  /** 編集部評価。根拠を `ratingBreakdown` に必ず持たせます */
  rating: number;
  ratingBreakdown: { fees: number; assets: number; security: number; usability: number };
  listedAssets: number;
  spot: Support;
  margin: Support;
  futures: Support;
  copyTrading: Support;
  maxLeverage?: string;
  tradingFee: LocalizedText;
  spread: LocalizedText;
  depositFee: LocalizedText;
  withdrawalFee: LocalizedText;
  minOrder: LocalizedText;
  savings: Support;
  staking: Support;
  lending: Support;
  app: Support;
  japanese: Support;
  kyc: LocalizedText;
  security: LocalizedList;
  beginnerFriendly: boolean;
  pros: LocalizedList;
  cons: LocalizedList;
  howToOpen: LocalizedList;
  faq: FaqItem[];
  officialUrl: string;
  /** アフィリエイトリンクID（未設定なら公式URLへ通常リンクします） */
  affiliateId?: string;
  /** 情報確認日。手数料などは変わるため必須です */
  checkedAt: string;
};

// ---------------------------------------------------------------------------
// ウォレット / ツール
// ---------------------------------------------------------------------------

export type WalletType = "hot-mobile" | "hot-extension" | "hardware" | "smart-contract";

export type Wallet = {
  id: string;
  slug: string;
  name: string;
  type: WalletType;
  color: string;
  summary: LocalizedText;
  chains: string[];
  mobile: Support;
  extension: Support;
  hardware: Support;
  nft: Support;
  swap: Support;
  staking: Support;
  beginnerFriendly: boolean;
  security: LocalizedList;
  pros: LocalizedList;
  cons: LocalizedList;
  officialUrl: string;
  affiliateId?: string;
  checkedAt: string;
};

export type ToolCategory =
  | "wallet"
  | "dex"
  | "defi"
  | "nft"
  | "bridge"
  | "analytics"
  | "portfolio"
  | "tax"
  | "onchain"
  | "security"
  | "dao"
  | "gamefi"
  | "ai"
  | "developer";

export type Tool = {
  id: string;
  slug: string;
  name: string;
  category: ToolCategory;
  color: string;
  summary: LocalizedText;
  description: LocalizedText;
  chains: string[];
  pricing: LocalizedText;
  freePlan: Support;
  languages: string[];
  mobile: Support;
  walletConnect: Support;
  features: LocalizedList;
  howToUse: LocalizedList;
  pros: LocalizedList;
  cons: LocalizedList;
  safety: LocalizedList;
  alternatives: string[];
  officialUrl: string;
  affiliateId?: string;
  checkedAt: string;
};

// ---------------------------------------------------------------------------
// 動画 / 学習
// ---------------------------------------------------------------------------

export type Video = {
  id: string;
  slug: string;
  /** YouTube の動画ID。空ならプレースホルダを表示します */
  youtubeId: string;
  title: LocalizedText;
  summary: LocalizedText;
  /** 要点。動画を見なくても要旨が分かるようにします */
  keyPoints: LocalizedList;
  chapters: { at: string; label: LocalizedText }[];
  transcript: LocalizedList;
  shorts: boolean;
  durationSec: number;
  publishedAt: string;
  channel: string;
  relatedCoins: CoinId[];
  relatedExchanges: string[];
  relatedTools: string[];
  relatedLearn: string[];
  faq: FaqItem[];
};

export type LearnLevel = "beginner" | "intermediate" | "advanced";

export type LearnArticle = {
  id: string;
  slug: string;
  level: LearnLevel;
  title: LocalizedText;
  /** 結論を先に置きます（生成AI・音声検索が要旨を取りやすい構造） */
  conclusion: LocalizedText;
  keyPoints: LocalizedList;
  definition: LocalizedText;
  body: LocalizedList;
  cautions: LocalizedList;
  faq: FaqItem[];
  authorId: string;
  reviewerId?: string;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  relatedCoins: CoinId[];
  next: string[];
  sources: { label: string; url: string }[];
};

// ---------------------------------------------------------------------------
// 診断
// ---------------------------------------------------------------------------

export type DiagnosisOption = {
  id: string;
  label: LocalizedText;
  /** 結果プロフィールごとの加点 */
  scores: Record<string, number>;
};

export type DiagnosisQuestion = {
  id: string;
  label: LocalizedText;
  help?: LocalizedText;
  options: DiagnosisOption[];
};

export type DiagnosisResult = {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  reasons: LocalizedList;
  cautions: LocalizedList;
  /** 結果から誘導する先 */
  exchangeIds?: string[];
  walletIds?: string[];
  toolIds?: string[];
  coinIds?: CoinId[];
  learnIds?: string[];
};

export type Diagnosis = {
  id: string;
  slug: string;
  title: LocalizedText;
  lead: LocalizedText;
  questions: DiagnosisQuestion[];
  results: DiagnosisResult[];
};

// ---------------------------------------------------------------------------
// 共通
// ---------------------------------------------------------------------------

export type FaqItem = { q: LocalizedText; a: LocalizedText };

export type Author = {
  id: string;
  name: LocalizedText;
  role: LocalizedText;
  bio: LocalizedText;
  /** 経歴・資格。実在の裏付けが取れないものは載せません */
  credentials: LocalizedList;
  url?: string;
};

export type Campaign = {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  /** 掲載元（取引所・ツール） */
  targetType: "exchange" | "tool" | "wallet";
  targetId: string;
  startsAt: string;
  endsAt?: string;
  conditions: LocalizedList;
  affiliateId?: string;
};

/** アフィリエイトリンク定義。実URLは環境変数で差し替えます。 */
export type AffiliateLinkDef = {
  id: string;
  /** 環境変数名（例: AFF_BITBANK）。未設定なら fallbackUrl を使い、広告表記も外します */
  envKey: string;
  fallbackUrl: string;
  /** 計測ラベル。設置場所ごとの計測に使います */
  program: string;
  startsAt?: string;
  endsAt?: string;
};

export type SearchDocType =
  "coin" | "news" | "exchange" | "wallet" | "tool" | "video" | "learn" | "faq" | "page";

export type SearchDoc = {
  id: string;
  type: SearchDocType;
  /** 言語プレフィックスを除いたパス（例: /coins/bitcoin） */
  path: string;
  title: LocalizedText;
  summary: LocalizedText;
  /** 検索対象の追加語。ティッカー・カタカナ・別名 */
  keywords: string[];
  /** 同点時の並び替え用（大きいほど上） */
  weight: number;
};
