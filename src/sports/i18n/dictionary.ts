/**
 * UI 文言の辞書。
 *
 * ja / en は全文を用意し、それ以外の言語は partials.ts で主要キーだけを上書きします。
 * 未翻訳のキーは英語にフォールバックするため、翻訳が欠けてもページは必ず読めます。
 * （翻訳の抜けを白紙やキー名の露出にしない、というのが唯一のルールです）
 */

export type Dictionary = {
  // --- グローバル ---
  siteTagline: string;
  siteSubCopy: string;
  skipToContent: string;
  menu: string;
  close: string;
  search: string;
  searchPlaceholder: string;
  language: string;
  languageSwitchLabel: string;
  timezoneNote: string;
  loading: string;
  noResults: string;
  seeAll: string;
  seeMore: string;
  back: string;
  updated: string;
  lastUpdated: string;
  fetchedAt: string;
  refreshInterval: string;
  source: string;
  sources: string;
  dataUnavailable: string;
  mockNotice: string;

  // --- ナビゲーション ---
  navLive: string;
  navMatches: string;
  navLeagues: string;
  navNews: string;
  navVideos: string;
  navStreaming: string;
  navWeb3: string;
  navDiagnosis: string;
  navGuide: string;
  navBetting: string;
  navSearch: string;
  navAdmin: string;

  // --- ステータス ---
  statusScheduled: string;
  statusLive: string;
  statusBreak: string;
  statusExtra: string;
  statusFinished: string;
  statusPostponed: string;
  statusCancelled: string;

  // --- ヒーロー / CTA ---
  ctaLiveScores: string;
  ctaTodayMatches: string;
  ctaCompareStreaming: string;
  ctaFindYourSport: string;
  ctaMatchDetail: string;
  ctaWatchOn: string;
  ctaOfficialSite: string;
  ctaFreeTrial: string;
  ctaViewSchedule: string;
  ctaSubscribe: string;

  // --- セクション見出し ---
  sectionLiveTicker: string;
  sectionFeatured: string;
  sectionSports: string;
  sectionNews: string;
  sectionLiveFeed: string;
  sectionSchedule: string;
  sectionResults: string;
  sectionStandings: string;
  sectionPlayerRanking: string;
  sectionTeamRanking: string;
  sectionPopular: string;
  sectionTrending: string;
  sectionVideos: string;
  sectionStreaming: string;
  sectionAnalytics: string;
  sectionWeb3: string;
  sectionFanTokens: string;
  sectionNfts: string;
  sectionDiagnosis: string;
  sectionChatbot: string;
  sectionBeginner: string;
  sectionFollow: string;
  sectionFaq: string;

  // --- 試合 ---
  kickoff: string;
  venue: string;
  round: string;
  season: string;
  homeTeam: string;
  awayTeam: string;
  timeline: string;
  lineups: string;
  predictedLineups: string;
  predictedLineupsNote: string;
  starters: string;
  bench: string;
  teamStats: string;
  headToHead: string;
  recentForm: string;
  preview: string;
  report: string;
  highlights: string;
  relatedNews: string;
  relatedVideos: string;
  whereToWatch: string;
  noBroadcast: string;
  beforeMatch: string;
  duringMatch: string;
  afterMatch: string;
  liveNow: string;
  todayMatches: string;
  noMatchesToday: string;

  // --- 順位表 / ランキング ---
  rank: string;
  team: string;
  player: string;
  position: string;
  change: string;
  form: string;
  zoneChampions: string;
  zonePlayoff: string;
  zoneEuropa: string;
  zoneRelegation: string;
  viewAsTable: string;
  viewAsCards: string;

  // --- ニュース ---
  newsCategory: string;
  readingTime: string;
  publishedAt: string;
  author: string;
  supervisor: string;
  confidenceOfficial: string;
  confidenceReport: string;
  confidenceRumour: string;
  confidenceNote: string;

  // --- 動画 ---
  chapters: string;
  aiSummary: string;
  aiSummaryNote: string;
  transcript: string;
  channel: string;
  officialChannel: string;
  shorts: string;
  watchOnYoutube: string;
  subscribeChannel: string;

  // --- 配信比較 ---
  monthlyPrice: string;
  yearlyPrice: string;
  freeTrial: string;
  quality: string;
  devices: string;
  simultaneous: string;
  japaneseCommentary: string;
  overseasViewing: string;
  cancellation: string;
  campaign: string;
  verifiedAt: string;
  streamingNote: string;

  // --- Web3 ---
  category: string;
  chains: string;
  wallet: string;
  pricing: string;
  benefits: string;
  risks: string;
  howTo: string;
  web3Risk: string;

  // --- 診断 ---
  startDiagnosis: string;
  question: string;
  ofQuestions: string;
  yourResult: string;
  whyThisResult: string;
  retake: string;
  shareResult: string;
  diagnosisNote: string;

  // --- チャットボット ---
  chatTitle: string;
  chatIntro: string;
  chatPlaceholder: string;
  chatSend: string;
  chatFallback: string;
  chatRealtimeNote: string;
  chatOpen: string;
  chatClose: string;

  // --- ベッティング / 法務 ---
  ageWarning: string;
  regionWarning: string;
  responsibleUse: string;
  bettingDisclaimer: string;
  predictionDisclaimer: string;
  affiliateDisclosure: string;
  adLabel: string;

  // --- フッター ---
  footerAbout: string;
  footerEditorial: string;
  footerAdPolicy: string;
  footerAffiliate: string;
  footerBettingPolicy: string;
  footerResponsible: string;
  footerDisclaimer: string;
  footerPrivacy: string;
  footerTerms: string;
  footerCookie: string;
  footerCopyright: string;
  footerImageCredits: string;
  footerContact: string;
  footerCorrection: string;
  footerSitemap: string;
  footerLegalNote: string;
};

export const ja: Dictionary = {
  siteTagline: "世界中の熱狂を、リアルタイムで。",
  siteSubCopy: "試合速報、ニュース、配信、データ、Web3.0 をひとつのスポーツターミナルに。",
  skipToContent: "本文へスキップ",
  menu: "メニュー",
  close: "閉じる",
  search: "検索",
  searchPlaceholder: "チーム・選手・リーグ・試合を検索",
  language: "言語",
  languageSwitchLabel: "表示言語を切り替える",
  timezoneNote: "時刻はお使いの端末のタイムゾーンで表示しています",
  loading: "読み込み中",
  noResults: "該当する情報が見つかりませんでした",
  seeAll: "すべて見る",
  seeMore: "もっと見る",
  back: "戻る",
  updated: "更新",
  lastUpdated: "最終更新",
  fetchedAt: "データ取得",
  refreshInterval: "更新間隔",
  source: "情報元",
  sources: "情報元",
  dataUnavailable:
    "データを取得できませんでした。古い情報を最新として表示しないため、この欄は空にしています。",
  mockNotice: "デモデータ表示中",

  navLive: "ライブスコア",
  navMatches: "試合",
  navLeagues: "リーグ",
  navNews: "ニュース",
  navVideos: "動画",
  navStreaming: "配信比較",
  navWeb3: "Web3.0",
  navDiagnosis: "診断",
  navGuide: "初心者ガイド",
  navBetting: "ベッティング情報",
  navSearch: "検索",
  navAdmin: "管理画面",

  statusScheduled: "開始前",
  statusLive: "試合中",
  statusBreak: "ハーフタイム",
  statusExtra: "延長",
  statusFinished: "終了",
  statusPostponed: "延期",
  statusCancelled: "中止",

  ctaLiveScores: "ライブスコアを見る",
  ctaTodayMatches: "今日の試合を見る",
  ctaCompareStreaming: "配信サービスを比較する",
  ctaFindYourSport: "あなたに合うスポーツを診断する",
  ctaMatchDetail: "試合詳細",
  ctaWatchOn: "視聴方法を見る",
  ctaOfficialSite: "公式サイトで確認する",
  ctaFreeTrial: "無料体験を確認する",
  ctaViewSchedule: "配信予定を見る",
  ctaSubscribe: "登録する",

  sectionLiveTicker: "ライブスコア",
  sectionFeatured: "本日の注目試合",
  sectionSports: "競技から探す",
  sectionNews: "最新スポーツニュース",
  sectionLiveFeed: "試合速報",
  sectionSchedule: "今日の試合日程",
  sectionResults: "試合結果",
  sectionStandings: "リーグ順位表",
  sectionPlayerRanking: "選手ランキング",
  sectionTeamRanking: "チームランキング",
  sectionPopular: "人気ニュース",
  sectionTrending: "急上昇コンテンツ",
  sectionVideos: "スポーツ動画",
  sectionStreaming: "配信サービス比較",
  sectionAnalytics: "スポーツ分析ツール",
  sectionWeb3: "Web3.0 スポーツサービス",
  sectionFanTokens: "ファントークン",
  sectionNfts: "スポーツNFT",
  sectionDiagnosis: "AI診断",
  sectionChatbot: "AIチャットボット",
  sectionBeginner: "初心者向けスポーツガイド",
  sectionFollow: "最新情報を受け取る",
  sectionFaq: "よくある質問",

  kickoff: "開始時刻",
  venue: "会場",
  round: "節・ラウンド",
  season: "シーズン",
  homeTeam: "ホーム",
  awayTeam: "アウェイ",
  timeline: "タイムライン",
  lineups: "スターティングメンバー",
  predictedLineups: "予想スタメン",
  predictedLineupsNote: "予想スタメンは編集部による推定です。確定情報ではありません。",
  starters: "先発",
  bench: "ベンチ",
  teamStats: "チームスタッツ",
  headToHead: "過去の対戦",
  recentForm: "直近成績",
  preview: "見どころ",
  report: "試合分析",
  highlights: "ハイライト",
  relatedNews: "関連ニュース",
  relatedVideos: "関連動画",
  whereToWatch: "視聴方法",
  noBroadcast: "この試合の配信情報は確認できていません。",
  beforeMatch: "試合前",
  duringMatch: "試合中",
  afterMatch: "試合後",
  liveNow: "LIVE",
  todayMatches: "今日の試合",
  noMatchesToday: "本日開催予定の試合はありません。",

  rank: "順位",
  team: "チーム",
  player: "選手",
  position: "ポジション",
  change: "変動",
  form: "直近",
  zoneChampions: "優勝・上位進出",
  zonePlayoff: "プレーオフ",
  zoneEuropa: "下位カップ戦",
  zoneRelegation: "降格圏",
  viewAsTable: "表で見る",
  viewAsCards: "カードで見る",

  newsCategory: "カテゴリ",
  readingTime: "読了目安",
  publishedAt: "公開",
  author: "著者",
  supervisor: "監修",
  confidenceOfficial: "公式発表",
  confidenceReport: "報道",
  confidenceRumour: "未確認",
  confidenceNote: "公式発表・報道・未確認情報を区別して表示しています。",

  chapters: "チャプター",
  aiSummary: "AI要約",
  aiSummaryNote: "AIが生成した要約です。正確性は元の動画をご確認ください。",
  transcript: "文字起こし",
  channel: "チャンネル",
  officialChannel: "公式チャンネル",
  shorts: "ショート動画",
  watchOnYoutube: "YouTubeで見る",
  subscribeChannel: "チャンネル登録",

  monthlyPrice: "月額",
  yearlyPrice: "年額",
  freeTrial: "無料期間",
  quality: "画質",
  devices: "対応デバイス",
  simultaneous: "同時視聴",
  japaneseCommentary: "日本語実況",
  overseasViewing: "海外視聴",
  cancellation: "解約方法",
  campaign: "キャンペーン",
  verifiedAt: "情報確認日",
  streamingNote:
    "料金・放映権・配信対象は変更されます。申込前に必ず公式サイトで最新情報をご確認ください。",

  category: "カテゴリ",
  chains: "対応チェーン",
  wallet: "対応ウォレット",
  pricing: "利用料金",
  benefits: "メリット",
  risks: "リスク",
  howTo: "利用方法",
  web3Risk:
    "暗号資産・NFT は価格が大きく変動し、価値が失われることがあります。サービス終了・規制変更・詐欺のリスクもあります。余裕資金の範囲でご判断ください。",

  startDiagnosis: "診断をはじめる",
  question: "質問",
  ofQuestions: "問中",
  yourResult: "診断結果",
  whyThisResult: "この結果になった理由",
  retake: "もう一度診断する",
  shareResult: "結果をシェアする",
  diagnosisNote: "診断は娯楽・情報提供が目的です。結果や成績を保証するものではありません。",

  chatTitle: "スポーツAIアシスタント",
  chatIntro: "今日の試合、順位表、配信サービスなど、サイト内の情報からお答えします。",
  chatPlaceholder: "例: 今日のプレミアリーグは？",
  chatSend: "送信",
  chatFallback: "そのご質問には確実にお答えできる情報がありません。以下のページをご覧ください。",
  chatRealtimeNote:
    "試合情報は最終更新時刻をご確認ください。試合結果の予言や利益の保証はいたしません。",
  chatOpen: "AIアシスタントを開く",
  chatClose: "AIアシスタントを閉じる",

  ageWarning: "18歳未満（地域によっては21歳未満）の方は利用できません。",
  regionWarning: "お住まいの地域の法令により、利用できない場合があります。",
  responsibleUse: "責任あるご利用のために",
  bettingDisclaimer:
    "当ページは情報提供のみを目的としています。賭博行為を勧誘するものではありません。日本国内から海外のベッティングサービスを利用する行為は、法令に抵触するおそれがあります。",
  predictionDisclaimer:
    "AI分析・予想は娯楽および情報提供が目的です。将来の結果や利益を保証するものではありません。",
  affiliateDisclosure: "当サイトはアフィリエイトプログラムを利用しています。",
  adLabel: "PR",

  footerAbout: "運営者情報",
  footerEditorial: "編集方針",
  footerAdPolicy: "広告掲載ポリシー",
  footerAffiliate: "アフィリエイトポリシー",
  footerBettingPolicy: "ベッティング情報掲載方針",
  footerResponsible: "責任ある利用に関する方針",
  footerDisclaimer: "免責事項",
  footerPrivacy: "プライバシーポリシー",
  footerTerms: "利用規約",
  footerCookie: "Cookieポリシー",
  footerCopyright: "著作権・画像利用方針",
  footerImageCredits: "画像出典・ライセンス",
  footerContact: "お問い合わせ",
  footerCorrection: "情報修正依頼",
  footerSitemap: "サイトマップ",
  footerLegalNote:
    "チーム名・リーグ名・選手名は各権利者に帰属します。当サイトは映像の配信・転載を行いません。",
};

export const en: Dictionary = {
  siteTagline: "Every roar on earth, in real time.",
  siteSubCopy: "Live scores, news, streaming, data and Web3 in a single sports terminal.",
  skipToContent: "Skip to content",
  menu: "Menu",
  close: "Close",
  search: "Search",
  searchPlaceholder: "Search teams, players, leagues, matches",
  language: "Language",
  languageSwitchLabel: "Change display language",
  timezoneNote: "Times are shown in your device's time zone",
  loading: "Loading",
  noResults: "No matching results",
  seeAll: "See all",
  seeMore: "See more",
  back: "Back",
  updated: "Updated",
  lastUpdated: "Last updated",
  fetchedAt: "Fetched",
  refreshInterval: "Refresh interval",
  source: "Source",
  sources: "Sources",
  dataUnavailable:
    "We could not fetch this data. Rather than show stale numbers as current, this panel is left empty.",
  mockNotice: "Showing demo data",

  navLive: "Live scores",
  navMatches: "Matches",
  navLeagues: "Leagues",
  navNews: "News",
  navVideos: "Videos",
  navStreaming: "Streaming",
  navWeb3: "Web3",
  navDiagnosis: "Quizzes",
  navGuide: "Beginner guide",
  navBetting: "Betting info",
  navSearch: "Search",
  navAdmin: "Admin",

  statusScheduled: "Scheduled",
  statusLive: "Live",
  statusBreak: "Half time",
  statusExtra: "Extra time",
  statusFinished: "Finished",
  statusPostponed: "Postponed",
  statusCancelled: "Cancelled",

  ctaLiveScores: "See live scores",
  ctaTodayMatches: "Today's matches",
  ctaCompareStreaming: "Compare streaming services",
  ctaFindYourSport: "Find your sport",
  ctaMatchDetail: "Match detail",
  ctaWatchOn: "How to watch",
  ctaOfficialSite: "Check the official site",
  ctaFreeTrial: "Check the free trial",
  ctaViewSchedule: "See the schedule",
  ctaSubscribe: "Subscribe",

  sectionLiveTicker: "Live scores",
  sectionFeatured: "Today's featured matches",
  sectionSports: "Browse by sport",
  sectionNews: "Latest sports news",
  sectionLiveFeed: "Live feed",
  sectionSchedule: "Today's schedule",
  sectionResults: "Results",
  sectionStandings: "Standings",
  sectionPlayerRanking: "Player rankings",
  sectionTeamRanking: "Team rankings",
  sectionPopular: "Popular news",
  sectionTrending: "Trending now",
  sectionVideos: "Sports videos",
  sectionStreaming: "Streaming comparison",
  sectionAnalytics: "Analytics tools",
  sectionWeb3: "Web3 sports services",
  sectionFanTokens: "Fan tokens",
  sectionNfts: "Sports NFTs",
  sectionDiagnosis: "AI quizzes",
  sectionChatbot: "AI assistant",
  sectionBeginner: "Beginner's guide",
  sectionFollow: "Stay updated",
  sectionFaq: "FAQ",

  kickoff: "Kick-off",
  venue: "Venue",
  round: "Round",
  season: "Season",
  homeTeam: "Home",
  awayTeam: "Away",
  timeline: "Timeline",
  lineups: "Line-ups",
  predictedLineups: "Predicted line-ups",
  predictedLineupsNote: "Predicted line-ups are our editorial estimate, not confirmed team news.",
  starters: "Starting",
  bench: "Bench",
  teamStats: "Team stats",
  headToHead: "Head to head",
  recentForm: "Recent form",
  preview: "Preview",
  report: "Match report",
  highlights: "Highlights",
  relatedNews: "Related news",
  relatedVideos: "Related videos",
  whereToWatch: "Where to watch",
  noBroadcast: "We have not confirmed a broadcaster for this match.",
  beforeMatch: "Before",
  duringMatch: "Live",
  afterMatch: "After",
  liveNow: "LIVE",
  todayMatches: "Today's matches",
  noMatchesToday: "No matches scheduled today.",

  rank: "Pos",
  team: "Team",
  player: "Player",
  position: "Position",
  change: "Move",
  form: "Form",
  zoneChampions: "Title / top qualification",
  zonePlayoff: "Play-offs",
  zoneEuropa: "Secondary cup",
  zoneRelegation: "Relegation",
  viewAsTable: "Table view",
  viewAsCards: "Card view",

  newsCategory: "Category",
  readingTime: "Read time",
  publishedAt: "Published",
  author: "Author",
  supervisor: "Reviewed by",
  confidenceOfficial: "Official",
  confidenceReport: "Reported",
  confidenceRumour: "Unconfirmed",
  confidenceNote: "We label official announcements, reports and unconfirmed rumours separately.",

  chapters: "Chapters",
  aiSummary: "AI summary",
  aiSummaryNote: "This summary is AI-generated. Check the original video for accuracy.",
  transcript: "Transcript",
  channel: "Channel",
  officialChannel: "Official channel",
  shorts: "Shorts",
  watchOnYoutube: "Watch on YouTube",
  subscribeChannel: "Subscribe",

  monthlyPrice: "Monthly",
  yearlyPrice: "Yearly",
  freeTrial: "Free trial",
  quality: "Max quality",
  devices: "Devices",
  simultaneous: "Simultaneous streams",
  japaneseCommentary: "Japanese commentary",
  overseasViewing: "Viewing from abroad",
  cancellation: "Cancellation",
  campaign: "Campaign",
  verifiedAt: "Verified on",
  streamingNote:
    "Prices, rights and fixtures change. Always confirm on the official site before subscribing.",

  category: "Category",
  chains: "Chains",
  wallet: "Wallets",
  pricing: "Pricing",
  benefits: "Benefits",
  risks: "Risks",
  howTo: "How to use",
  web3Risk:
    "Crypto assets and NFTs can lose value quickly. Services can shut down, regulation can change, and scams exist. Only commit funds you can afford to lose.",

  startDiagnosis: "Start the quiz",
  question: "Question",
  ofQuestions: "of",
  yourResult: "Your result",
  whyThisResult: "Why you got this result",
  retake: "Take it again",
  shareResult: "Share the result",
  diagnosisNote: "Quizzes are for entertainment and information only. They guarantee nothing.",

  chatTitle: "Sports AI assistant",
  chatIntro:
    "Ask about today's matches, standings or how to watch — answered from this site's data.",
  chatPlaceholder: "e.g. What's on in the Premier League today?",
  chatSend: "Send",
  chatFallback: "I don't have a reliable answer for that. These pages may help.",
  chatRealtimeNote:
    "Always check the last-updated time on match data. We never predict results or guarantee returns.",
  chatOpen: "Open the AI assistant",
  chatClose: "Close the AI assistant",

  ageWarning: "Not available to anyone under 18 (21 in some regions).",
  regionWarning: "Local law may prohibit use of these services where you live.",
  responsibleUse: "Playing responsibly",
  bettingDisclaimer:
    "This page is informational only and does not solicit gambling. Using offshore betting services from Japan may breach local law.",
  predictionDisclaimer:
    "AI analysis and previews are for entertainment and information. They guarantee no outcome or profit.",
  affiliateDisclosure: "This site uses affiliate programmes.",
  adLabel: "Ad",

  footerAbout: "About us",
  footerEditorial: "Editorial policy",
  footerAdPolicy: "Advertising policy",
  footerAffiliate: "Affiliate policy",
  footerBettingPolicy: "Betting content policy",
  footerResponsible: "Responsible use policy",
  footerDisclaimer: "Disclaimer",
  footerPrivacy: "Privacy policy",
  footerTerms: "Terms of use",
  footerCookie: "Cookie policy",
  footerCopyright: "Copyright & image policy",
  footerImageCredits: "Image credits",
  footerContact: "Contact",
  footerCorrection: "Report a correction",
  footerSitemap: "Sitemap",
  footerLegalNote:
    "Team, league and player names belong to their respective owners. We do not host or redistribute match footage.",
};
