/**
 * CARD PORT のドメイン型。
 *
 * DB スキーマ（docs/cardport/db-schema.sql）のテーブルと 1 対 1 で対応させています。
 * モックデータを本番データへ差し替えるとき、この型が契約になります。
 */
import type { LocalizedList, LocalizedText } from "@/cardport/i18n/localized";

/** 国際ブランド */
export type CardBrand = "visa" | "mastercard" | "jcb" | "amex" | "diners" | "unionpay";

/** カードランク */
export type CardRank =
  "standard" | "gold" | "platinum" | "black" | "debit" | "prepaid" | "virtual" | "business";

/** 申込み対象 */
export type Eligibility = "general" | "student" | "young" | "business" | "sole-proprietor";

/** カードカテゴリ（`/ja/cards/<category>` になります） */
export type CardCategoryId =
  | "free-annual-fee"
  | "high-reward"
  | "mile"
  | "travel"
  | "gold"
  | "platinum"
  | "black"
  | "business"
  | "sole-proprietor"
  | "student"
  | "beginner"
  | "overseas"
  | "online-shopping"
  | "convenience-store"
  | "gas"
  | "subscription"
  | "crypto"
  | "debit"
  | "prepaid"
  | "virtual";

/** 保険 */
export type InsuranceCoverage = {
  /** 補償上限（円）。0 は付帯なし */
  amount: number;
  /** 自動付帯か利用付帯か */
  condition: "auto" | "usage" | "none";
};

export type IssuerId = string;

export type Issuer = {
  id: IssuerId;
  name: LocalizedText;
  /** 発行会社の区分 */
  type: "bank" | "credit" | "distribution" | "telecom" | "fintech" | "crypto";
  description: LocalizedText;
};

export type CardCampaign = {
  id: string;
  cardId: string;
  title: LocalizedText;
  /** 獲得可能ポイント・金額の目安（円相当）。不明な場合は 0 */
  maxValue: number;
  /** 達成条件。曖昧な表現を避け、必ず具体的に書きます */
  conditions: LocalizedList;
  /** ISO 8601（YYYY-MM-DD）。掲載期限 */
  endsOn: string;
  /** 対象者 */
  target: LocalizedText;
  officialUrl: string;
};

export type CardReview = {
  id: string;
  cardId: string;
  /** 表示名（実在の個人を特定しない形にします） */
  author: LocalizedText;
  body: LocalizedText;
  /** 1〜5。※ AggregateRating の構造化データには出力しません（実データではないため） */
  rating: number;
  postedOn: string;
};

/**
 * カード。
 * 表示している項目だけを型に持ちます（表示しない値は構造化データにも出しません）。
 */
export type Card = {
  id: string;
  /** URL スラッグ。カテゴリIDと衝突させないこと */
  slug: string;
  name: LocalizedText;
  issuerId: IssuerId;
  brands: CardBrand[];
  rank: CardRank;
  categories: CardCategoryId[];

  /** 券面のプレースホルダー配色（実在カードの意匠は使いません） */
  art: { from: string; via: string; to: string; texture: "holo" | "matte" | "metal" | "carbon" };

  /** 年会費（税込・円） */
  annualFee: number;
  /** 初年度年会費（税込・円） */
  firstYearFee: number;
  /** 年会費無料の条件。無条件無料なら undefined */
  feeWaiver?: LocalizedText;
  familyCardFee: number;
  etcFee: number;

  /** 基本還元率（%） */
  baseRate: number;
  /** 最大還元率（%） */
  maxRate: number;
  /** 最大還元率の条件 */
  maxRateCondition: LocalizedText;
  pointName: LocalizedText;
  /** ポイント有効期限 */
  pointExpiry: LocalizedText;
  /** マイル交換（対応しない場合は空配列） */
  mileTransfer: LocalizedList;
  /** マイル移行レート（1ポイント→何マイル）。非対応は 0 */
  mileRate: number;

  travelInsuranceDomestic: InsuranceCoverage;
  travelInsuranceOverseas: InsuranceCoverage;
  shoppingInsurance: InsuranceCoverage;

  /** 空港ラウンジ（利用不可なら空配列） */
  lounges: LocalizedList;
  touchPayment: boolean;
  mobilePayments: string[];
  electronicMoney: string[];

  /** 発行までの最短日数 */
  issueDays: number;
  eligibility: Eligibility[];
  /** 申込み条件の説明。断定を避け、公式確認を促す文にします */
  eligibilityNote: LocalizedText;
  /** 利用限度額の目安 */
  limitNote: LocalizedText;
  /** 海外事務手数料（%） */
  fxFee: number;

  pros: LocalizedList;
  cons: LocalizedList;
  notes: LocalizedList;
  recommendedFor: LocalizedList;
  notRecommendedFor: LocalizedList;
  /** 冒頭に置く結論（生成AIが引用しやすい形） */
  summary: LocalizedText;

  /** 法人カード向け項目 */
  business?: {
    additionalCards: number;
    accountingIntegrations: string[];
    paymentTerms: LocalizedText;
    receiptManagement: boolean;
    virtualCards: boolean;
  };

  /** Web3.0 / 暗号資産連携 */
  crypto?: {
    supportedAssets: string[];
    custodyNote: LocalizedText;
    stablecoin: boolean;
  };

  /** 掲載する地域（ISO 3166-1 alpha-2）。日本発行カードは JP */
  availableRegions: string[];
  /** アフィリエイトリンクのID。affiliate-links.ts で解決します */
  affiliateId?: string;
  /** 公式サイト（アフィリエイト未設定時のフォールバック） */
  officialUrl: string;

  /** 編集部スコアの内訳（0〜5）。ランキングはここから機械的に算出します */
  scores: {
    reward: number;
    fee: number;
    benefit: number;
    insurance: number;
    usability: number;
    trust: number;
  };

  /** 情報確認日（ISO 8601） */
  verifiedOn: string;
  updatedOn: string;
};

export type CardCategory = {
  id: CardCategoryId;
  title: LocalizedText;
  lead: LocalizedText;
  /** ランキングとしても使うカテゴリか */
  ranking: boolean;
  accent: "cyan" | "violet" | "magenta" | "emerald" | "gold" | "electric";
};

export type NewsCategory =
  | "card"
  | "campaign"
  | "point"
  | "mile"
  | "cashless"
  | "payment"
  | "fintech"
  | "bank"
  | "securities"
  | "travel"
  | "airline"
  | "hotel"
  | "business"
  | "security"
  | "fraud"
  | "web3"
  | "crypto"
  | "regulation";

/** 記事の性格。読者が「誰の言葉か」を判断できるよう必ず区別します */
export type NewsKind = "official" | "press" | "campaign" | "editorial" | "comparison" | "sponsored";

export type NewsArticle = {
  id: string;
  slug: string;
  title: LocalizedText;
  summary: LocalizedText;
  body: LocalizedList;
  category: NewsCategory;
  kind: NewsKind;
  tags: string[];
  /** 情報元の名称。編集部記事は自社名 */
  sourceName: LocalizedText;
  /** 情報元URL。無い場合は空文字 */
  sourceUrl: string;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  authorId: string;
  supervisorId?: string;
  /** 同じ発表を扱う記事をまとめるためのキー */
  storyKey?: string;
  relatedCardIds: string[];
  accent: "cyan" | "violet" | "magenta" | "emerald" | "gold" | "electric";
};

export type Video = {
  id: string;
  slug: string;
  /** YouTube 動画ID。Data API 未設定時はモック値 */
  youtubeId: string;
  title: LocalizedText;
  description: LocalizedText;
  /** ショート動画か */
  isShort: boolean;
  publishedAt: string;
  durationSeconds: number;
  chapters: { at: number; label: LocalizedText }[];
  /** 文字起こしの要点（全文ではなく要約） */
  transcriptHighlights: LocalizedList;
  aiSummary: LocalizedList;
  featuredCardIds: string[];
  relatedNewsIds: string[];
};

export type FinancialTool = {
  id: string;
  slug: string;
  name: LocalizedText;
  category:
    | "household"
    | "card-manager"
    | "point-manager"
    | "mile-manager"
    | "expense"
    | "accounting"
    | "invoice"
    | "subscription"
    | "remittance"
    | "fx"
    | "wallet"
    | "virtual-card"
    | "fraud-detection"
    | "password"
    | "kyc"
    | "web3-wallet"
    | "crypto-tax";
  summary: LocalizedText;
  pricing: LocalizedText;
  freePlan: boolean;
  platforms: string[];
  integrations: string[];
  languages: string[];
  businessReady: boolean;
  security: LocalizedList;
  pros: LocalizedList;
  cons: LocalizedList;
  officialUrl: string;
  affiliateId?: string;
};

export type PaymentService = {
  id: string;
  slug: string;
  name: LocalizedText;
  type: "qr" | "wallet" | "bnpl" | "transit" | "bank-pay";
  summary: LocalizedText;
  baseRate: number;
  chargeSources: LocalizedList;
  bestCardIds: string[];
  pros: LocalizedList;
  cons: LocalizedList;
  officialUrl: string;
};

export type Web3Service = {
  id: string;
  slug: string;
  name: LocalizedText;
  category:
    | "crypto-card"
    | "crypto-debit"
    | "wallet"
    | "stablecoin"
    | "blockchain-payment"
    | "nft-membership"
    | "token-reward"
    | "loyalty"
    | "remittance"
    | "onchain-payment"
    | "defi"
    | "exchange"
    | "security";
  summary: LocalizedText;
  regions: string[];
  fiatCurrencies: string[];
  cryptoAssets: string[];
  cardBrands: CardBrand[];
  fees: {
    monthly: LocalizedText;
    issuing: LocalizedText;
    fx: LocalizedText;
  };
  kyc: LocalizedText;
  languages: string[];
  hasApp: boolean;
  rewards: LocalizedText;
  pros: LocalizedList;
  risks: LocalizedList;
  /** 規制・地域制限の注記。必須です */
  regulatoryNote: LocalizedText;
  officialUrl: string;
  relatedNewsIds: string[];
  relatedVideoIds: string[];
};

export type DiagnosisOption = {
  id: string;
  label: LocalizedText;
  /** 各スコア軸への重み。診断エンジンがカードのスコアと突き合わせます */
  weights: Partial<Record<DiagnosisAxis, number>>;
  /** 選択時に必須となる条件（該当しないカードを除外） */
  requires?: {
    categories?: CardCategoryId[];
    ranks?: CardRank[];
    eligibility?: Eligibility[];
    maxAnnualFee?: number;
    minMileRate?: number;
    lounge?: boolean;
  };
};

export type DiagnosisAxis =
  | "reward"
  | "fee"
  | "mile"
  | "travel"
  | "status"
  | "insurance"
  | "online"
  | "daily"
  | "business"
  | "beginner";

export type DiagnosisQuestion = {
  id: string;
  label: LocalizedText;
  help?: LocalizedText;
  options: DiagnosisOption[];
};

export type Diagnosis = {
  id: string;
  slug: string;
  title: LocalizedText;
  lead: LocalizedText;
  accent: "cyan" | "violet" | "magenta" | "emerald" | "gold" | "electric";
  /** 対象を絞る（法人診断なら法人カードのみ、など） */
  pool: { categories?: CardCategoryId[]; ranks?: CardRank[] };
  questions: DiagnosisQuestion[];
};

export type SimulatorId =
  | "annual-points"
  | "card-compare"
  | "fee-breakeven"
  | "mile"
  | "travel-benefit"
  | "business-expense"
  | "switch-benefit"
  | "multi-card"
  | "fx-fee"
  | "point-exchange";

export type Simulator = {
  id: SimulatorId;
  slug: string;
  title: LocalizedText;
  lead: LocalizedText;
  assumptions: LocalizedList;
  method: LocalizedText;
  accent: "cyan" | "violet" | "magenta" | "emerald" | "gold" | "electric";
};

export type Faq = {
  id: string;
  question: LocalizedText;
  answer: LocalizedText;
  /** どのページのFAQとして出すか */
  scope: "site" | "card" | "business" | "web3" | "point" | "diagnosis";
};

export type Author = {
  id: string;
  name: LocalizedText;
  role: LocalizedText;
  bio: LocalizedText;
  /** 保有資格。実在しない資格は書きません */
  credentials: LocalizedList;
  /** 監修者か */
  isSupervisor: boolean;
};

export type Guide = {
  id: string;
  slug: string;
  title: LocalizedText;
  lead: LocalizedText;
  /** 章立て。生成AIが引用しやすいよう見出し＋要点の形にします */
  sections: { heading: LocalizedText; body: LocalizedList }[];
  level: "beginner" | "intermediate" | "advanced";
  readingMinutes: number;
  authorId: string;
  relatedCardIds: string[];
  updatedOn: string;
};

export type FeatureCollection = {
  id: string;
  slug: string;
  title: LocalizedText;
  lead: LocalizedText;
  /** 掲載条件。カードIDの直書きではなく条件で選ぶことで、データ更新に追随します */
  filter: {
    categories?: CardCategoryId[];
    ranks?: CardRank[];
    maxAnnualFee?: number;
    minBaseRate?: number;
    minMileRate?: number;
    requiresLounge?: boolean;
    eligibility?: Eligibility[];
  };
  accent: "cyan" | "violet" | "magenta" | "emerald" | "gold" | "electric";
};

export type PolicyPage = {
  id: string;
  slug: string;
  title: LocalizedText;
  lead: LocalizedText;
  sections: { heading: LocalizedText; body: LocalizedList }[];
  updatedOn: string;
};
