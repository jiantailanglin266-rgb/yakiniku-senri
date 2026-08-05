/**
 * ニュース（デモ）。
 *
 * ■ 記事はすべてデモ用に書き起こした架空の内容です。
 *   実在の選手に架空の移籍・負傷を結び付けないよう、選手名は players.ts の架空選手のみを使っています。
 * ■ confidence（公式発表／報道／未確認）を必ず持たせ、UI 上でも区別して表示します。
 * ■ sources（情報元）は必須項目です。実運用では RSS / API の提供元がここに入ります。
 *
 * 本文は「結論 → 要点 → 背景 → 注意点」の順に構成しています。
 * 生成AIに引用されるとき、最初の段落だけで結論が伝わる形にするためです。
 */
import type { Author, NewsArticle } from "../types";
import { minutesAfterReference } from "./clock";
import { mockStamp } from "./players";

export const authors: Author[] = [
  {
    id: "a-editorial",
    name: { ja: "SPORTS PORT 編集部", en: "SPORTS PORT Editorial" },
    role: { ja: "編集", en: "Editorial" },
    bio: {
      ja: "国内外のスポーツ報道・データ配信の実務経験を持つメンバーで構成しています。掲載内容は公式発表と一次情報の確認を経て公開しています。",
      en: "A team with experience in sports reporting and data distribution. Every item is checked against primary sources before publication.",
    },
  },
  {
    id: "a-data",
    name: { ja: "データデスク", en: "Data Desk" },
    role: { ja: "データ分析", en: "Data analysis" },
    bio: {
      ja: "試合スタッツの取得・正規化・可視化を担当します。分析記事には必ず元データと集計日時を明記します。",
      en: "Responsible for collecting, normalising and visualising match data. Every analysis states its source and timestamp.",
    },
  },
  {
    id: "a-web3",
    name: { ja: "Web3.0 デスク", en: "Web3 Desk" },
    role: { ja: "Web3.0 / ブロックチェーン", en: "Web3 / blockchain" },
    bio: {
      ja: "ファントークン・NFT・ブロックチェーンゲームを担当します。投資助言は行わず、仕組みとリスクの説明に徹します。",
      en: "Covers fan tokens, NFTs and blockchain games. We explain mechanics and risks; we never give investment advice.",
    },
  },
];

export const authorsById = new Map(authors.map((author) => [author.id, author]));

const publishedAt = (hoursAgo: number) => minutesAfterReference(12 * 60 - hoursAgo * 60);

export const news: NewsArticle[] = [
  {
    id: "n-hale-brace",
    slug: "hale-brace-arsenal-liverpool",
    category: "breaking",
    confidence: "report",
    sportId: "football",
    leagueId: "premier-league",
    teamIds: ["t-arsenal", "t-liverpool"],
    playerIds: ["p-hale"],
    matchId: "m-ars-liv",
    title: {
      ja: "【速報】ヘイルが2得点、アーセナルが上位対決で先行",
      en: "Live: Hale's double puts Arsenal ahead in the top-of-the-table clash",
    },
    summary: {
      ja: "アーセナル対リヴァプールは後半22分時点で2-1。ヘイルが前半12分と後半18分に決めています。",
      en: "Arsenal lead Liverpool 2-1 after 67 minutes, with Hale scoring in each half.",
    },
    body: [
      {
        heading: { ja: "結論", en: "The headline" },
        paragraphs: [
          {
            ja: "アーセナルが2-1でリードしています（現地時間・後半22分時点）。試合は進行中のため、最新のスコアは試合ページでご確認ください。",
            en: "Arsenal lead 2-1 with 67 minutes played. The match is still in progress — check the match page for the live score.",
          },
        ],
      },
      {
        heading: { ja: "要点", en: "Key points" },
        paragraphs: [
          {
            ja: "前半12分にヘイルが先制。44分にセットプレーから追いつかれましたが、63分に再びヘイルが決めて勝ち越しました。シュート数は13対9、枠内は6対3です。",
            en: "Hale opened on 12 minutes, a set piece levelled it on 44, and Hale restored the lead on 63. Shots are 13-9, on target 6-3.",
          },
        ],
      },
      {
        heading: { ja: "注意点", en: "Caveats" },
        paragraphs: [
          {
            ja: "本記事は試合進行中に作成しています。スコア・スタッツは更新されるため、最終結果は試合終了後の記事をご覧ください。",
            en: "This piece was written while the match was live. Scores and stats will change; see the full-time report for final numbers.",
          },
        ],
      },
    ],
    publishedAt: publishedAt(1),
    updatedAt: publishedAt(0),
    readingMinutes: 2,
    authorId: "a-editorial",
    sources: [{ name: "SPORTS PORT ライブフィード（デモ）" }],
    priority: 5,
    accent: "#f43f5e",
    stamp: mockStamp,
  },
  {
    id: "n-okada-transfer",
    slug: "okada-transfer-interest",
    category: "transfer",
    confidence: "rumour",
    sportId: "football",
    leagueId: "j1-league",
    teamIds: ["t-kawasaki"],
    playerIds: ["p-okada"],
    title: {
      ja: "岡田陸に欧州クラブが関心か（未確認）",
      en: "Report: European interest in Riku Okada (unconfirmed)",
    },
    summary: {
      ja: "複数の欧州クラブが関心を示していると伝えられています。クラブ・選手いずれからも公式発表はありません。",
      en: "Several European clubs are said to be interested. Neither the club nor the player has confirmed anything.",
    },
    body: [
      {
        heading: { ja: "結論", en: "The headline" },
        paragraphs: [
          {
            ja: "現時点で公式発表はありません。当サイトはこの情報を「未確認」として扱います。",
            en: "There is no official announcement. We are labelling this as unconfirmed.",
          },
        ],
      },
      {
        heading: { ja: "背景", en: "Background" },
        paragraphs: [
          {
            ja: "今季21試合で5得点9アシスト。キーパスは1試合平均2.4本と、リーグ上位の数字です。",
            en: "Five goals and nine assists in 21 league games this season, with 2.4 key passes per match.",
          },
        ],
      },
      {
        heading: { ja: "注意点", en: "Caveats" },
        paragraphs: [
          {
            ja: "移籍の噂は成立しないことのほうが多いものです。公式発表があり次第、記事を更新します。",
            en: "Most transfer rumours never materialise. We will update this article if anything is confirmed.",
          },
        ],
      },
    ],
    publishedAt: publishedAt(5),
    readingMinutes: 3,
    authorId: "a-editorial",
    sources: [{ name: "SPORTS PORT デモ通信社" }],
    priority: 3,
    stamp: mockStamp,
  },
  {
    id: "n-nba-mensah",
    slug: "mensah-triple-double-run",
    category: "record",
    confidence: "official",
    sportId: "basketball",
    leagueId: "nba",
    teamIds: ["t-nuggets"],
    playerIds: ["p-mensah"],
    title: {
      ja: "メンサ、8試合連続トリプルダブル",
      en: "Mensah records an eighth straight triple-double",
    },
    summary: {
      ja: "デンバーのメンサが8試合連続でトリプルダブルを達成。平均26.4得点12.3リバウンド8.9アシストです。",
      en: "Denver's Mensah posts an eighth consecutive triple-double, averaging 26.4 / 12.3 / 8.9.",
    },
    body: [
      {
        heading: { ja: "結論", en: "The headline" },
        paragraphs: [
          {
            ja: "メンサが8試合連続トリプルダブルを記録しました。チームは西カンファレンス首位です。",
            en: "Mensah has now managed eight in a row while his side sit top of the Western Conference.",
          },
        ],
      },
      {
        heading: { ja: "データ", en: "The numbers" },
        paragraphs: [
          {
            ja: "今季平均は26.4得点・12.3リバウンド・8.9アシスト。アシスト数はセンター登録の選手として突出しています。",
            en: "26.4 points, 12.3 rebounds and 8.9 assists per game — an exceptional assist rate for a listed centre.",
          },
        ],
      },
    ],
    publishedAt: publishedAt(9),
    readingMinutes: 3,
    authorId: "a-data",
    supervisorId: "a-editorial",
    sources: [{ name: "SPORTS PORT データデスク（デモ集計）" }],
    priority: 4,
    stamp: mockStamp,
  },
  {
    id: "n-clasico-preview",
    slug: "el-clasico-preview",
    category: "analysis",
    confidence: "report",
    sportId: "football",
    leagueId: "laliga",
    teamIds: ["t-real-madrid", "t-barcelona"],
    playerIds: ["p-moreno", "p-ferreira"],
    matchId: "m-rma-bar",
    title: {
      ja: "今季2度目の直接対決、勝負を分ける3つの数字",
      en: "Three numbers that will decide the second Clásico",
    },
    summary: {
      ja: "本日開催の直接対決を、支配率・被シュート・セットプレーの3点から整理します。",
      en: "We break tonight's meeting down by possession, shots conceded and set pieces.",
    },
    body: [
      {
        heading: { ja: "結論", en: "The headline" },
        paragraphs: [
          {
            ja: "鍵は中盤の主導権です。前回対戦ではアウェイ側が支配率で上回り、そのまま勝ち切りました。",
            en: "The midfield battle decides it. The visitors dominated possession in the first meeting and won.",
          },
        ],
      },
      {
        heading: { ja: "データ", en: "The numbers" },
        paragraphs: [
          {
            ja: "ホームは今季1試合平均の被シュートが8.4本とリーグ最少。アウェイは1試合平均得点2.3でリーグ最多です。",
            en: "The hosts concede a league-low 8.4 shots per game; the visitors score a league-high 2.3 per game.",
          },
        ],
      },
      {
        heading: { ja: "注意点", en: "Caveats" },
        paragraphs: [
          {
            ja: "本記事は結果を予想するものではありません。数字は試合前時点の集計であり、勝敗を保証するものではありません。",
            en: "This is not a prediction. The numbers are pre-match and guarantee nothing.",
          },
        ],
      },
    ],
    publishedAt: publishedAt(3),
    readingMinutes: 5,
    authorId: "a-data",
    supervisorId: "a-editorial",
    sources: [{ name: "SPORTS PORT データデスク（デモ集計）" }],
    priority: 4,
    stamp: mockStamp,
  },
  {
    id: "n-injury-ferreira",
    slug: "ferreira-fitness-update",
    category: "injury",
    confidence: "official",
    sportId: "football",
    leagueId: "laliga",
    teamIds: ["t-barcelona"],
    playerIds: ["p-ferreira"],
    title: {
      ja: "フェレイラ、クラブが復帰時期を発表",
      en: "Club confirms Ferreira's return timeline",
    },
    summary: {
      ja: "クラブ公式が、フェレイラの回復状況と復帰見込みを発表しました。",
      en: "The club has published an update on Ferreira's recovery and expected return.",
    },
    body: [
      {
        heading: { ja: "結論", en: "The headline" },
        paragraphs: [
          {
            ja: "クラブ公式サイトで、段階的にチーム練習へ復帰していることが発表されました。復帰時期は「数週間以内」とされています。",
            en: "The club says he has begun a phased return to team training, with a comeback expected within weeks.",
          },
        ],
      },
      {
        heading: { ja: "注意点", en: "Caveats" },
        paragraphs: [
          {
            ja: "負傷情報は状況により変わります。当サイトは医学的な判断は行わず、公式発表の内容のみを掲載します。",
            en: "Injury situations change. We report only what the club has published and offer no medical assessment.",
          },
        ],
      },
    ],
    publishedAt: publishedAt(14),
    readingMinutes: 2,
    authorId: "a-editorial",
    sources: [{ name: "クラブ公式発表（デモ）" }],
    priority: 3,
    stamp: mockStamp,
  },
  {
    id: "n-streaming-rights",
    slug: "streaming-rights-2026",
    category: "broadcast",
    confidence: "report",
    teamIds: [],
    playerIds: [],
    title: {
      ja: "2026年の配信権はどう変わるのか",
      en: "How sports streaming rights are shifting in 2026",
    },
    summary: {
      ja: "配信サービス各社の対象大会が入れ替わっています。契約前に確認すべき点を整理しました。",
      en: "Coverage is moving between platforms. Here is what to check before you subscribe.",
    },
    body: [
      {
        heading: { ja: "結論", en: "The headline" },
        paragraphs: [
          {
            ja: "「見たい大会が来季も同じサービスで見られる」とは限りません。契約期間と対象大会を必ず公式サイトで確認してください。",
            en: "Do not assume your competition stays on the same platform. Check the contract term and covered competitions on the official site.",
          },
        ],
      },
      {
        heading: { ja: "確認すべき点", en: "What to check" },
        paragraphs: [
          {
            ja: "対象大会、無料期間の条件、解約方法、同時視聴数、海外からの視聴可否の5点です。当サイトの比較表にも同じ項目を並べています。",
            en: "Competitions covered, trial conditions, how to cancel, simultaneous streams, and whether it works abroad — the same five columns as our comparison table.",
          },
        ],
      },
    ],
    publishedAt: publishedAt(20),
    readingMinutes: 4,
    authorId: "a-editorial",
    sources: [{ name: "SPORTS PORT 編集部（デモ）" }],
    priority: 2,
    stamp: mockStamp,
  },
  {
    id: "n-fan-token-basics",
    slug: "fan-token-basics",
    category: "web3",
    confidence: "report",
    teamIds: [],
    playerIds: [],
    title: {
      ja: "ファントークンとは何か、そして何ではないのか",
      en: "What a fan token is — and what it is not",
    },
    summary: {
      ja: "投票権や特典と引き換えに発行されるトークンの仕組みと、押さえておくべきリスクを解説します。",
      en: "How tokens that grant votes and perks work, and the risks to understand first.",
    },
    body: [
      {
        heading: { ja: "結論", en: "The headline" },
        paragraphs: [
          {
            ja: "ファントークンは「クラブへの出資」でも「株式」でもありません。多くは投票参加権や特典へのアクセス権です。",
            en: "A fan token is not equity and not an investment in the club. Most grant voting participation and access to perks.",
          },
        ],
      },
      {
        heading: { ja: "リスク", en: "Risks" },
        paragraphs: [
          {
            ja: "価格変動、流動性の低下、発行元のサービス終了、規制変更、詐欺的なプロジェクトの存在が主なリスクです。当サイトは購入を推奨しません。",
            en: "Price volatility, thin liquidity, platform shutdown, regulatory change and outright scams. We do not recommend buying.",
          },
        ],
      },
    ],
    publishedAt: publishedAt(30),
    readingMinutes: 6,
    authorId: "a-web3",
    supervisorId: "a-editorial",
    sources: [{ name: "SPORTS PORT Web3.0 デスク（デモ）" }],
    priority: 2,
    stamp: mockStamp,
  },
  {
    id: "n-valorant-group",
    slug: "vct-group-stage-zeta",
    category: "tournament",
    confidence: "official",
    sportId: "esports",
    leagueId: "valorant-champions",
    teamIds: ["t-zeta", "t-sentinels"],
    playerIds: ["p-sato-e"],
    matchId: "m-zeta-sen",
    title: {
      ja: "ZETAがグループ首位に、プレーオフ進出に前進",
      en: "ZETA move top of the group and closer to the play-offs",
    },
    summary: {
      ja: "グループステージ5戦4勝。マップ差でも上回っています。",
      en: "Four wins from five in the group stage, with a positive map difference.",
    },
    body: [
      {
        heading: { ja: "結論", en: "The headline" },
        paragraphs: [
          {
            ja: "ZETA DIVISION がグループAの首位に立ちました。",
            en: "ZETA DIVISION now top Group A.",
          },
        ],
      },
      {
        heading: { ja: "要点", en: "Key points" },
        paragraphs: [
          {
            ja: "佐藤悠真の平均コンバットスコアは248。マップ差は+5です。",
            en: "Yuma Sato is averaging 248 ACS and the side hold a +5 map difference.",
          },
        ],
      },
    ],
    publishedAt: publishedAt(7),
    readingMinutes: 3,
    authorId: "a-editorial",
    sources: [{ name: "大会公式（デモ）" }],
    priority: 3,
    stamp: mockStamp,
  },
  {
    id: "n-f1-regulation",
    slug: "f1-2026-regulation-explainer",
    category: "tactics",
    confidence: "official",
    sportId: "f1",
    leagueId: "f1-championship",
    teamIds: [],
    playerIds: [],
    title: {
      ja: "2026年F1新規定、観戦者が知っておきたい点",
      en: "F1's 2026 rules: what viewers need to know",
    },
    summary: {
      ja: "パワーユニットと車体の規定が変わりました。レースの見え方がどう変わるかを整理します。",
      en: "Power unit and chassis rules have changed. Here is how the racing looks different.",
    },
    body: [
      {
        heading: { ja: "結論", en: "The headline" },
        paragraphs: [
          {
            ja: "電動比率の増加と車体規定の変更により、ストレートとコーナーでの速度差の出方が変わりました。",
            en: "A larger electrical component and new chassis rules change how speed differences appear on straights and in corners.",
          },
        ],
      },
      {
        heading: { ja: "観戦のポイント", en: "What to watch" },
        paragraphs: [
          {
            ja: "エネルギーマネジメントの巧拙が順位に直結します。ラップごとの速度変化に注目してください。",
            en: "Energy management now shapes the order — watch how lap-by-lap pace fluctuates.",
          },
        ],
      },
    ],
    publishedAt: publishedAt(40),
    readingMinutes: 5,
    authorId: "a-data",
    sources: [{ name: "競技規則の公開情報（デモ）" }],
    priority: 2,
    stamp: mockStamp,
  },
  {
    id: "n-newcastle-report",
    slug: "newcastle-aston-villa-report",
    category: "analysis",
    confidence: "report",
    sportId: "football",
    leagueId: "premier-league",
    teamIds: ["t-newcastle", "t-aston-villa"],
    playerIds: [],
    matchId: "m-new-avl",
    title: {
      ja: "支配率で劣ったニューカッスルが勝った理由",
      en: "Why Newcastle won without the ball",
    },
    summary: {
      ja: "支配率44%で3得点。カウンターの設計とセットプレーの精度を振り返ります。",
      en: "Three goals from 44% possession: the counter-attacking design and set-piece quality behind it.",
    },
    body: [
      {
        heading: { ja: "結論", en: "The headline" },
        paragraphs: [
          {
            ja: "ボールを持たない時間を意図的に作り、3本のカウンターを決め切ったことが勝因です。",
            en: "They deliberately ceded the ball and converted three counters — that was the game.",
          },
        ],
      },
      {
        heading: { ja: "データ", en: "The numbers" },
        paragraphs: [
          {
            ja: "シュート12本のうち枠内7本。アウェイは17本中6本でした。決定機の質で上回っています。",
            en: "Seven of twelve shots on target against six of seventeen — a clear edge in chance quality.",
          },
        ],
      },
    ],
    publishedAt: publishedAt(22),
    readingMinutes: 4,
    authorId: "a-data",
    sources: [{ name: "SPORTS PORT データデスク（デモ集計）" }],
    priority: 3,
    stamp: mockStamp,
  },
  {
    id: "n-beginner-guide",
    slug: "how-to-start-watching-sport",
    category: "interview",
    confidence: "report",
    teamIds: [],
    playerIds: [],
    title: {
      ja: "何から見ればいい？ 観戦のはじめ方",
      en: "Where to start if you've never watched",
    },
    summary: {
      ja: "競技選び、時差、配信、ルールの学び方まで、はじめの一歩をまとめました。",
      en: "Choosing a sport, dealing with time zones, finding a stream and learning the rules.",
    },
    body: [
      {
        heading: { ja: "結論", en: "The headline" },
        paragraphs: [
          {
            ja: "まずは「生活時間に合う競技」から選ぶのが続けるコツです。深夜開催が中心の競技は最初の一歩には向きません。",
            en: "Pick a sport that fits your schedule. Anything that kicks off at 3am is a hard place to start.",
          },
        ],
      },
      {
        heading: { ja: "手順", en: "Steps" },
        paragraphs: [
          {
            ja: "1) 診断で競技を絞る 2) 配信比較で視聴手段を決める 3) 初心者ガイドでルールの要点を押さえる、の順が最短です。",
            en: "Take the quiz, compare streaming options, then read the beginner's guide for the rules.",
          },
        ],
      },
    ],
    publishedAt: publishedAt(50),
    readingMinutes: 4,
    authorId: "a-editorial",
    sources: [{ name: "SPORTS PORT 編集部（デモ）" }],
    priority: 1,
    stamp: mockStamp,
  },
  {
    id: "n-nft-market",
    slug: "sports-nft-market-check",
    category: "web3",
    confidence: "report",
    teamIds: [],
    playerIds: [],
    title: {
      ja: "スポーツNFTを触る前に確認する5項目",
      en: "Five checks before you touch a sports NFT",
    },
    summary: {
      ja: "発行元、チェーン、二次流通、権利、サービス終了時の扱いを確認してください。",
      en: "Issuer, chain, secondary market, rights, and what happens if the service closes.",
    },
    body: [
      {
        heading: { ja: "結論", en: "The headline" },
        paragraphs: [
          {
            ja: "「サービスが終了したら何が残るか」を最初に確認してください。多くの特典はサービス継続が前提です。",
            en: "Ask what survives if the service shuts down. Most perks depend on the platform staying alive.",
          },
        ],
      },
      {
        heading: { ja: "注意点", en: "Caveats" },
        paragraphs: [
          {
            ja: "当サイトは購入・投資を推奨しません。価格の上昇を示唆する表現も行いません。",
            en: "We do not recommend buying or investing, and we make no claims about future prices.",
          },
        ],
      },
    ],
    publishedAt: publishedAt(60),
    readingMinutes: 5,
    authorId: "a-web3",
    supervisorId: "a-editorial",
    sources: [{ name: "SPORTS PORT Web3.0 デスク（デモ）" }],
    priority: 2,
    stamp: mockStamp,
  },
];

export const newsById = new Map(news.map((article) => [article.id, article]));

export function getNewsBySlug(slug: string): NewsArticle | undefined {
  return news.find((article) => article.slug === slug);
}

export function newsBySport(sportId: string): NewsArticle[] {
  return news.filter((article) => article.sportId === sportId);
}

export function newsByLeague(leagueId: string): NewsArticle[] {
  return news.filter((article) => article.leagueId === leagueId);
}

export function newsByTeam(teamId: string): NewsArticle[] {
  return news.filter((article) => article.teamIds.includes(teamId));
}

export function newsByPlayer(playerId: string): NewsArticle[] {
  return news.filter((article) => article.playerIds.includes(playerId));
}

export function newsByMatch(matchId: string): NewsArticle[] {
  return news.filter((article) => article.matchId === matchId);
}

export function latestNews(limit = 6): NewsArticle[] {
  return [...news].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, limit);
}

/** 「人気」はデモのため priority 順です。実運用では計測データで並べ替えます。 */
export function popularNews(limit = 5): NewsArticle[] {
  return [...news].sort((a, b) => b.priority - a.priority).slice(0, limit);
}
