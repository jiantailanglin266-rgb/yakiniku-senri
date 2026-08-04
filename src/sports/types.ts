/**
 * SPORTS PORT — ドメインモデル
 *
 * 競技・リーグを追加してもコード改修が発生しないよう、
 * 「競技ごとの差分」はすべて Sport の設定値として表現します。
 * （得点方式・順位表の列・スタッツ項目・試合の区切り方 など）
 */

/* ------------------------------------------------------------------
   共通
   ------------------------------------------------------------------ */

/** データの出所。UI 上で「公式 / 提携API / 編集部 / モック」を必ず区別します。 */
export type DataProvenance = "official" | "api" | "editorial" | "mock";

/** 取得元と取得時刻。表示系コンポーネントはこれを必ず添えて描画します。 */
export type DataStamp = {
  provenance: DataProvenance;
  /** データ提供元の表示名 */
  source: string;
  /** 提供元の公開URL（あれば） */
  sourceUrl?: string;
  /** 取得時刻（ISO8601 / UTC） */
  fetchedAt: string;
  /** 更新間隔の目安（秒）。0 は静的データ */
  refreshIntervalSec: number;
};

export type LocalizedText = {
  ja: string;
  en: string;
  [locale: string]: string;
};

/* ------------------------------------------------------------------
   競技
   ------------------------------------------------------------------ */

export type ScoreboardField =
  "score" | "period" | "clock" | "set" | "inning" | "round" | "lap" | "games" | "holes" | "map";

export type StandingsColumn = {
  key: string;
  /** 見出しの短縮表記（順位表は横幅が命） */
  label: LocalizedText;
  /** 数値の意味。ソート方向の決定に使います */
  higherIsBetter: boolean;
  /** スマホのカード表示で出すか */
  primary?: boolean;
};

export type SportStatKey = {
  key: string;
  label: LocalizedText;
  /** 0-100 の比率として扱う（ボール支配率など） */
  percentage?: boolean;
};

export type Sport = {
  id: string;
  slug: string;
  name: LocalizedText;
  /** 一覧タブなどで使う 1〜2 文字の記号 */
  glyph: string;
  /** アクセントカラー（CSS カスタムプロパティに流し込みます） */
  accent: string;
  /** 試合の区切り方 */
  periodType: "half" | "quarter" | "set" | "inning" | "round" | "race" | "hole" | "map";
  /** 通常時の区切り数（延長を除く） */
  periodCount: number;
  /** スコアボードに出す項目 */
  scoreboard: ScoreboardField[];
  /** 引き分けが存在する競技か（順位表の列に影響） */
  hasDraw: boolean;
  /** 順位表の形式 */
  standingsType: "table" | "group" | "conference" | "championship" | "ranking" | "none";
  standingsColumns: StandingsColumn[];
  /** 試合スタッツの項目 */
  statKeys: SportStatKey[];
  /** 初心者向けの一行説明 */
  primer: LocalizedText;
};

/* ------------------------------------------------------------------
   リーグ・大会
   ------------------------------------------------------------------ */

export type League = {
  id: string;
  slug: string;
  sportId: string;
  name: LocalizedText;
  shortName: string;
  /** ISO 3166-1 alpha-2（国際大会は "world"） */
  country: string;
  region: string;
  /** 大会形式 */
  format: "league" | "cup" | "series" | "championship" | "tournament";
  season: string;
  seasonStart: string;
  seasonEnd: string;
  /** 参加チーム数（不明なら undefined。推測値は入れない） */
  teamCount?: number;
  description: LocalizedText;
  /** 歴代優勝（確認できたものだけ） */
  honours?: { season: string; teamId?: string; teamName: string }[];
  /** 日本国内の視聴手段（streaming サービス ID） */
  broadcastIds: string[];
  accent: string;
  stamp: DataStamp;
};

/* ------------------------------------------------------------------
   チーム・選手
   ------------------------------------------------------------------ */

export type Team = {
  id: string;
  slug: string;
  sportId: string;
  leagueId: string;
  name: LocalizedText;
  shortName: string;
  /** 表記ゆれ（検索用）。"マンU" "Man United" など */
  aliases: string[];
  country: string;
  city: LocalizedText;
  /** 設立年。不明なら undefined */
  founded?: number;
  venueId?: string;
  /** ロゴは権利物のため、自前生成のエンブレム（モノグラム）で代替します */
  crest: {
    initials: string;
    primary: string;
    secondary: string;
    shape: "shield" | "circle" | "hex";
  };
  manager?: string;
  officialUrl?: string;
  social?: { x?: string; instagram?: string; youtube?: string };
  fanTokenId?: string;
  stamp: DataStamp;
};

export type Player = {
  id: string;
  slug: string;
  sportId: string;
  /** 個人競技（テニス・ゴルフなど）では未設定 */
  teamId?: string;
  name: LocalizedText;
  aliases: string[];
  nationality: string;
  /** ISO 日付。非公開なら undefined（推測しない） */
  birthDate?: string;
  heightCm?: number;
  weightKg?: number;
  position: LocalizedText;
  number?: number;
  /** 今季成績。競技ごとにキーが変わるため辞書で保持 */
  seasonStats: { key: string; label: LocalizedText; value: string }[];
  careerStats: { key: string; label: LocalizedText; value: string }[];
  transfers?: { season: string; from: string; to: string; type: string }[];
  honours?: { year: string; title: LocalizedText }[];
  social?: { x?: string; instagram?: string };
  stamp: DataStamp;
};

export type Venue = {
  id: string;
  name: LocalizedText;
  city: LocalizedText;
  country: string;
  capacity?: number;
  /** 地図リンク用（緯度経度が確認できたものだけ） */
  geo?: { lat: number; lng: number };
};

/* ------------------------------------------------------------------
   試合
   ------------------------------------------------------------------ */

export type MatchStatus =
  "scheduled" | "live" | "break" | "extra" | "finished" | "postponed" | "cancelled";

export type MatchEventType =
  | "goal"
  | "assist"
  | "yellow"
  | "red"
  | "substitution"
  | "penalty"
  | "period"
  | "timeout"
  | "score"
  | "info";

export type MatchEvent = {
  id: string;
  /** 表示用の時間（"67'" "Q3 4:21" "5回裏" など競技ごとに自由記述） */
  clock: string;
  type: MatchEventType;
  side: "home" | "away" | "neutral";
  playerId?: string;
  text: LocalizedText;
};

export type LineupEntry = {
  playerId?: string;
  name: string;
  number?: number;
  position?: string;
  starter: boolean;
};

export type Match = {
  id: string;
  slug: string;
  sportId: string;
  leagueId: string;
  season: string;
  round?: LocalizedText;
  /** ISO8601（UTC）。表示は必ず閲覧者のタイムゾーンへ変換します */
  kickoff: string;
  status: MatchStatus;
  /** 進行中の表示時計（"67'" など）。status が live/break/extra のときだけ */
  clock?: string;
  venueId?: string;
  homeTeamId: string;
  awayTeamId: string;
  /** 未開始は null。0 と null を混同しない */
  homeScore: number | null;
  awayScore: number | null;
  /** ピリオド別スコア（セット・イニング・クォーター） */
  periodScores?: { label: string; home: number | string; away: number | string }[];
  events: MatchEvent[];
  statistics?: { key: string; home: number; away: number }[];
  lineups?: { home: LineupEntry[]; away: LineupEntry[] };
  /** 試合前の予想スタメン（確定ではないことを明示して出します） */
  predictedLineup?: boolean;
  broadcastIds: string[];
  highlightVideoId?: string;
  /** 編集部による見どころ */
  preview?: LocalizedText;
  /** 試合後の総括 */
  report?: LocalizedText;
  stamp: DataStamp;
};

export type Standing = {
  leagueId: string;
  /** グループ / カンファレンス名（単一表なら undefined） */
  group?: string;
  rows: {
    teamId: string;
    rank: number;
    /** 前節からの順位変動。0 は変動なし */
    change: number;
    values: Record<string, number | string>;
    /** 直近成績（新しい順）。W/L/D/OT */
    form?: ("W" | "L" | "D" | "O")[];
    /** 昇格・降格・プレーオフなどの色分け */
    zone?: "champions" | "playoff" | "europa" | "relegation";
  }[];
  stamp: DataStamp;
};

/* ------------------------------------------------------------------
   ニュース・動画
   ------------------------------------------------------------------ */

export type NewsCategory =
  | "breaking"
  | "transfer"
  | "contract"
  | "injury"
  | "retirement"
  | "tournament"
  | "record"
  | "interview"
  | "tactics"
  | "analysis"
  | "broadcast"
  | "sponsor"
  | "web3"
  | "esports";

/** 情報の確度。噂と公式発表を混ぜないための必須項目 */
export type NewsConfidence = "official" | "report" | "rumour";

export type NewsArticle = {
  id: string;
  slug: string;
  category: NewsCategory;
  confidence: NewsConfidence;
  sportId?: string;
  leagueId?: string;
  teamIds: string[];
  playerIds: string[];
  matchId?: string;
  title: LocalizedText;
  summary: LocalizedText;
  /** 見出し + 段落。生成AIに引用されやすい構造（結論→要点→背景→注意点） */
  body: { heading: LocalizedText; paragraphs: LocalizedText[] }[];
  publishedAt: string;
  updatedAt?: string;
  readingMinutes: number;
  authorId: string;
  supervisorId?: string;
  /** 情報元（必須）。転載ではなく参照として扱います */
  sources: { name: string; url?: string }[];
  /** 重要度 1(低)〜5(速報級) */
  priority: 1 | 2 | 3 | 4 | 5;
  accent?: string;
  stamp: DataStamp;
};

export type VideoItem = {
  id: string;
  slug: string;
  /** YouTube の動画ID。未設定ならプレースホルダー表示 */
  youtubeId?: string;
  kind: "long" | "short";
  title: LocalizedText;
  description: LocalizedText;
  sportId?: string;
  leagueId?: string;
  teamIds: string[];
  playerIds: string[];
  matchId?: string;
  channel: { name: string; url?: string; official: boolean };
  publishedAt: string;
  durationSec: number;
  chapters?: { at: number; label: LocalizedText }[];
  /** AI 要約。生成物であることを明示して表示します */
  aiSummary?: LocalizedText[];
  transcriptExcerpt?: LocalizedText;
  stamp: DataStamp;
};

/* ------------------------------------------------------------------
   配信・収益
   ------------------------------------------------------------------ */

export type StreamingService = {
  id: string;
  slug: string;
  name: string;
  /** 提供地域（ISO 3166-1 alpha-2） */
  regions: string[];
  sportIds: string[];
  leagueIds: string[];
  monthlyPriceJpy?: number;
  yearlyPriceJpy?: number;
  freeTrialDays?: number;
  live: boolean;
  onDemand: boolean;
  simultaneousStreams?: number;
  maxQuality: string;
  devices: ("phone" | "pc" | "tv" | "console")[];
  japaneseCommentary: boolean;
  /** 海外からの視聴可否。規約により変わるため「要確認」を許容 */
  overseasViewing: "yes" | "no" | "check";
  cancellation: LocalizedText;
  campaign?: LocalizedText;
  officialUrl: string;
  affiliateId?: string;
  /** 料金・対象大会は変わるため確認日を必ず出します */
  verifiedAt: string;
  notes: LocalizedText;
};

export type AffiliateLink = {
  id: string;
  /** 計測用のラベル。配置別計測に使います */
  campaign: string;
  label: LocalizedText;
  url: string;
  /** 地域別・言語別の差し替え */
  overrides?: { locale?: string; region?: string; url: string }[];
  /** A/B テストのバリアント */
  variants?: { id: string; label: LocalizedText }[];
  /** 広告であることの明示 */
  disclosure: boolean;
  active: boolean;
};

/* ------------------------------------------------------------------
   Web3.0
   ------------------------------------------------------------------ */

export type Web3Category =
  | "fan-token"
  | "nft"
  | "trading-card"
  | "blockchain-game"
  | "fantasy"
  | "dao"
  | "metaverse"
  | "ticketing"
  | "community"
  | "athlete-support"
  | "membership"
  | "sponsorship"
  | "data-market";

export type Web3Service = {
  id: string;
  slug: string;
  name: string;
  category: Web3Category;
  summary: LocalizedText;
  sportIds: string[];
  leagueIds: string[];
  chains: string[];
  pricing: LocalizedText;
  hasFreePlan: boolean;
  token?: string;
  wallet: string[];
  languages: string[];
  regions: string[];
  features: LocalizedText[];
  howTo: LocalizedText[];
  benefits: LocalizedText[];
  risks: LocalizedText[];
  officialUrl: string;
  affiliateId?: string;
  verifiedAt: string;
};

export type FanToken = {
  id: string;
  symbol: string;
  teamName: string;
  teamId?: string;
  sportId: string;
  platform: string;
  chain: string;
  utility: LocalizedText[];
  officialUrl: string;
  verifiedAt: string;
};

export type NftCollection = {
  id: string;
  name: string;
  sportId: string;
  chain: string;
  marketplace: string;
  summary: LocalizedText;
  officialUrl: string;
  verifiedAt: string;
};

/* ------------------------------------------------------------------
   診断・チャットボット
   ------------------------------------------------------------------ */

export type DiagnosisOption = {
  id: string;
  label: LocalizedText;
  /** 結果IDごとの加点 */
  weights: Record<string, number>;
};

export type DiagnosisQuestion = {
  id: string;
  text: LocalizedText;
  options: DiagnosisOption[];
};

export type DiagnosisResult = {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  reasons: LocalizedText[];
  sportIds: string[];
  leagueIds: string[];
  teamIds: string[];
  playerIds: string[];
  streamingIds: string[];
  videoIds: string[];
  accent: string;
};

export type Diagnosis = {
  id: string;
  slug: string;
  title: LocalizedText;
  lead: LocalizedText;
  /** ベッティング関連の診断では勝敗・利益に触れないための注記 */
  disclaimer?: LocalizedText;
  questions: DiagnosisQuestion[];
  results: DiagnosisResult[];
};

export type ChatDocument = {
  id: string;
  /** RAG の参照先種別 */
  kind:
    | "match"
    | "league"
    | "team"
    | "player"
    | "news"
    | "video"
    | "streaming"
    | "web3"
    | "faq"
    | "guide";
  question: LocalizedText;
  answer: LocalizedText;
  keywords: string[];
  links: { label: LocalizedText; href: string }[];
  /** リアルタイム情報を含む回答か（含む場合は取得時刻を必ず添えます） */
  realtime: boolean;
};

/* ------------------------------------------------------------------
   その他
   ------------------------------------------------------------------ */

export type Faq = {
  id: string;
  question: LocalizedText;
  answer: LocalizedText;
  /** 表示するページ。空なら全ページ共通 */
  scopes: string[];
};

export type Author = {
  id: string;
  name: LocalizedText;
  role: LocalizedText;
  bio: LocalizedText;
  /** 経歴の裏付けが取れる公開プロフィール */
  profileUrl?: string;
};

export type SearchDoc = {
  id: string;
  type:
    | "sport"
    | "league"
    | "match"
    | "team"
    | "player"
    | "news"
    | "video"
    | "streaming"
    | "web3"
    | "faq"
    | "glossary";
  title: string;
  subtitle: string;
  href: string;
  keywords: string[];
  accent: string;
};
