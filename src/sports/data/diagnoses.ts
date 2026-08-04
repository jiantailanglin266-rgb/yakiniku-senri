/**
 * 診断ツール（12種）。
 *
 * ■ 仕組み：各選択肢が結果IDへ加点し、合計点が最も高い結果を表示します。
 * ■ ベッティング関連の診断では、勝敗・利益に触れる設問と結果を作りません。
 *   「どの情報を確認すべきか」を案内する内容に限定しています。
 */
import type { Diagnosis, DiagnosisOption, DiagnosisQuestion, DiagnosisResult } from "../types";

const opt = (
  id: string,
  ja: string,
  en: string,
  weights: Record<string, number>,
): DiagnosisOption => ({
  id,
  label: { ja, en },
  weights,
});

const q = (id: string, ja: string, en: string, options: DiagnosisOption[]): DiagnosisQuestion => ({
  id,
  text: { ja, en },
  options,
});

type ResultSeed = {
  id: string;
  ja: string;
  en: string;
  descJa: string;
  descEn: string;
  reasons: [string, string][];
  sportIds?: string[];
  leagueIds?: string[];
  teamIds?: string[];
  playerIds?: string[];
  streamingIds?: string[];
  videoIds?: string[];
  accent: string;
};

const result = (seed: ResultSeed): DiagnosisResult => ({
  id: seed.id,
  title: { ja: seed.ja, en: seed.en },
  description: { ja: seed.descJa, en: seed.descEn },
  reasons: seed.reasons.map(([ja, en]) => ({ ja, en })),
  sportIds: seed.sportIds ?? [],
  leagueIds: seed.leagueIds ?? [],
  teamIds: seed.teamIds ?? [],
  playerIds: seed.playerIds ?? [],
  streamingIds: seed.streamingIds ?? [],
  videoIds: seed.videoIds ?? [],
  accent: seed.accent,
});

const fullDiagnoses: Diagnosis[] = [
  // 1. あなたに合うスポーツ診断
  {
    id: "d-your-sport",
    slug: "your-sport",
    title: { ja: "あなたに合うスポーツ診断", en: "Find your sport" },
    lead: {
      ja: "6つの質問で、観るのに向いている競技を提案します。所要2分。",
      en: "Six questions, two minutes, and a sport that fits how you watch.",
    },
    questions: [
      q("pace", "試合のテンポはどちらが好みですか？", "What pace do you prefer?", [
        opt("fast", "常に動いている", "Constant action", {
          basketball: 3,
          esports: 2,
          "ice-hockey": 2,
        }),
        opt("build", "じわじわ盛り上がる", "A slow build", {
          football: 3,
          baseball: 2,
          cricket: 1,
        }),
        opt("burst", "一瞬で決まる", "Decided in an instant", { mma: 3, f1: 2, boxing: 2 }),
      ]),
      q("team", "個人競技と団体競技、どちらに惹かれますか？", "Individual or team?", [
        opt("team", "団体競技", "Team", { football: 3, basketball: 2, baseball: 2, esports: 1 }),
        opt("solo", "個人競技", "Individual", { tennis: 3, f1: 2, mma: 2, boxing: 1 }),
        opt("both", "どちらでも", "Either", { football: 1, basketball: 1, tennis: 1 }),
      ]),
      q("time", "観戦にかけられる時間は？", "How long can you watch?", [
        opt("short", "30分以内", "Under 30 minutes", { esports: 2, mma: 2, boxing: 2 }),
        opt("mid", "1〜2時間", "One to two hours", { football: 3, basketball: 3, f1: 2 }),
        opt("long", "半日でも", "Half a day is fine", { baseball: 3, cricket: 2, tennis: 2 }),
      ]),
      q("data", "データや戦術の話は好きですか？", "Do you enjoy tactics and data?", [
        opt("love", "とても好き", "Love it", {
          baseball: 3,
          "american-football": 3,
          f1: 2,
          football: 1,
        }),
        opt("some", "少しは知りたい", "A little", { football: 2, basketball: 2 }),
        opt("no", "感覚で楽しみたい", "I just want the feeling", { mma: 2, boxing: 2, esports: 1 }),
      ]),
      q("contact", "激しい身体接触はどう感じますか？", "How do you feel about physical contact?", [
        opt("ok", "そこが面白い", "That's the appeal", {
          mma: 3,
          "american-football": 2,
          "ice-hockey": 2,
          boxing: 2,
        }),
        opt("neutral", "気にならない", "Doesn't bother me", { football: 2, basketball: 1 }),
        opt("avoid", "できれば避けたい", "I'd rather avoid it", {
          tennis: 3,
          baseball: 2,
          esports: 2,
          f1: 1,
        }),
      ]),
      q("when", "観戦しやすい時間帯は？", "When can you watch?", [
        opt("evening", "平日の夜", "Weekday evenings", { football: 2, basketball: 1, esports: 2 }),
        opt("weekend", "週末の昼", "Weekend afternoons", { football: 2, baseball: 2, f1: 2 }),
        opt("night", "深夜でも平気", "Late night is fine", {
          basketball: 3,
          "american-football": 2,
          mma: 1,
        }),
      ]),
    ],
    results: [
      result({
        id: "football",
        ja: "サッカー",
        en: "Football",
        descJa:
          "1試合90分、週末に予定を合わせやすく、世界中どこでも話題が通じます。まずは国内リーグから始めると生活時間に合わせやすいです。",
        descEn:
          "Ninety minutes, weekend-friendly, and understood everywhere. Start with a domestic league that fits your clock.",
        reasons: [
          [
            "試合時間が読みやすく、生活に組み込みやすい",
            "Predictable running time that fits around life",
          ],
          ["ルールが単純で、初見でも展開を追える", "Simple rules you can follow on first watch"],
        ],
        sportIds: ["football"],
        leagueIds: ["j1-league", "premier-league"],
        teamIds: ["t-kawasaki", "t-arsenal"],
        streamingIds: ["stream-jsports-plus", "stream-global-football"],
        videoIds: ["v-clasico-preview"],
        accent: "#22d3ee",
      }),
      result({
        id: "basketball",
        ja: "バスケットボール",
        en: "Basketball",
        descJa:
          "得点が頻繁に入り、48分間ほぼ止まりません。スマホの縦画面でも試合の流れを追いやすい競技です。",
        descEn:
          "Points come constantly and the game barely stops. It reads well even on a phone screen.",
        reasons: [
          ["得点機会が多く、退屈な時間が少ない", "Frequent scoring means few dull stretches"],
          ["1試合が2時間前後で完結する", "A game wraps up in about two hours"],
        ],
        sportIds: ["basketball"],
        leagueIds: ["nba", "b-league"],
        teamIds: ["t-celtics", "t-nuggets"],
        playerIds: ["p-brooks"],
        streamingIds: ["stream-hoops-pass"],
        videoIds: ["v-nyk-cel-highlights"],
        accent: "#f59e0b",
      }),
      result({
        id: "baseball",
        ja: "野球",
        en: "Baseball",
        descJa:
          "1球ごとに状況が変わり、データの読みどころが多い競技です。ながら観戦にも向いています。",
        descEn: "Every pitch changes the situation, and there is plenty to read in the numbers.",
        reasons: [
          ["間が多く、解説やデータを追う余裕がある", "The pauses leave room for analysis"],
          ["シーズンが長く、継続して追いやすい", "A long season that rewards regular following"],
        ],
        sportIds: ["baseball"],
        leagueIds: ["npb", "mlb"],
        teamIds: ["t-hanshin", "t-dodgers"],
        streamingIds: ["stream-jsports-plus", "stream-diamond-tv"],
        accent: "#f97316",
      }),
      result({
        id: "mma",
        ja: "総合格闘技",
        en: "MMA",
        descJa: "1試合15分前後で決着します。短時間で強い緊張感を味わいたい人に向いています。",
        descEn: "Most fights are over inside fifteen minutes — maximum tension, minimum time.",
        reasons: [
          ["1試合が短く、区切りがはっきりしている", "Short, clearly bounded contests"],
          ["結果の分かりやすさが際立つ", "Outcomes are unambiguous"],
        ],
        sportIds: ["mma"],
        leagueIds: ["ufc"],
        streamingIds: ["stream-cage-live"],
        accent: "#f43f5e",
      }),
      result({
        id: "f1",
        ja: "F1",
        en: "Formula 1",
        descJa:
          "戦略と技術の競い合いです。レース週末は予選と決勝の2日構成で、まとまった時間が取りやすいのが特徴です。",
        descEn: "A contest of strategy and engineering, packaged into a two-day race weekend.",
        reasons: [
          ["年間カレンダーが決まっており予定を立てやすい", "A fixed calendar you can plan around"],
          ["データと戦略の読み合いが濃い", "Deep strategic and technical layers"],
        ],
        sportIds: ["f1"],
        leagueIds: ["f1-championship"],
        streamingIds: ["stream-velocity-tv"],
        videoIds: ["v-f1-explainer"],
        accent: "#ef4444",
      }),
      result({
        id: "esports",
        ja: "eスポーツ",
        en: "Esports",
        descJa: "配信が無料で見られる大会が多く、はじめの一歩の敷居が最も低い分野です。",
        descEn: "Many events stream free, making it the cheapest place to start.",
        reasons: [
          ["無料配信が多く、費用をかけずに試せる", "Free streams mean no upfront cost"],
          ["1試合が短く、切り上げやすい", "Short matches you can dip in and out of"],
        ],
        sportIds: ["esports"],
        leagueIds: ["valorant-champions"],
        teamIds: ["t-zeta"],
        streamingIds: ["stream-arena-gg"],
        accent: "#e879f9",
      }),
      result({
        id: "tennis",
        ja: "テニス",
        en: "Tennis",
        descJa:
          "個人競技で、選手個人の物語を追いやすいのが魅力です。試合時間は幅がありますが、セット単位で区切れます。",
        descEn:
          "An individual sport where you follow a person, not a badge. Long matches, but breakable by set.",
        reasons: [
          ["選手個人に感情移入しやすい", "Easy to invest in one player"],
          ["セット単位で区切って観られる", "You can watch a set at a time"],
        ],
        sportIds: ["tennis"],
        leagueIds: ["wta-tour"],
        playerIds: ["p-dubois"],
        streamingIds: ["stream-allsports"],
        accent: "#a3e635",
      }),
      result({
        id: "american-football",
        ja: "アメリカンフットボール",
        en: "American football",
        descJa: "1プレーごとに作戦が切り替わる、戦術性の高い競技です。データ好きに向いています。",
        descEn: "A new plan every play — the most tactical sport on the list.",
        reasons: [
          ["1プレーごとに戦術が明確に切り替わる", "Tactics reset on every snap"],
          ["データの蓄積が豊富", "A deep statistical tradition"],
        ],
        sportIds: ["american-football"],
        leagueIds: ["nfl"],
        teamIds: ["t-chiefs"],
        streamingIds: ["stream-gridiron-now"],
        accent: "#8b5cf6",
      }),
      result({
        id: "ice-hockey",
        ja: "アイスホッケー",
        en: "Ice hockey",
        descJa:
          "スピードと接触の激しさが同居する競技です。試合展開が速く、飽きる時間がありません。",
        descEn: "Speed and contact in the same package, with almost no downtime.",
        reasons: [
          ["展開が速く、常に何かが起きている", "Relentless pace"],
          ["1試合が2時間半程度で完結する", "About two and a half hours"],
        ],
        sportIds: ["ice-hockey"],
        streamingIds: ["stream-allsports"],
        accent: "#38bdf8",
      }),
      result({
        id: "boxing",
        ja: "ボクシング",
        en: "Boxing",
        descJa: "1対1の駆け引きが最も純粋な形で現れます。1試合の集中度が高い競技です。",
        descEn: "The purest one-on-one contest there is.",
        reasons: [
          ["ルールが単純で初見でも分かる", "Immediately legible"],
          ["主要試合が明確で追いやすい", "A clear calendar of big fights"],
        ],
        sportIds: ["boxing"],
        streamingIds: ["stream-cage-live"],
        accent: "#facc15",
      }),
      result({
        id: "cricket",
        ja: "クリケット",
        en: "Cricket",
        descJa: "長い時間をかけて状況が変わっていく競技です。時間に余裕がある人に向いています。",
        descEn: "A sport that unfolds over hours — for viewers with time to spare.",
        reasons: [
          ["じっくり観る時間が取れる人向け", "Rewards patient viewing"],
          ["形式によって長さを選べる", "Formats range from three hours to five days"],
        ],
        sportIds: ["cricket"],
        accent: "#2dd4bf",
      }),
    ],
  },

  // 2. 配信サービス診断
  {
    id: "d-streaming",
    slug: "streaming-service",
    title: { ja: "あなたに合うスポーツ配信サービス診断", en: "Which streaming service fits you" },
    lead: {
      ja: "見たい競技・予算・視聴環境から、比較すべきサービスを絞り込みます。",
      en: "Narrow the comparison table down by sport, budget and setup.",
    },
    questions: [
      q("sport", "いちばん見たい競技は？", "Which sport matters most?", [
        opt("football", "サッカー", "Football", {
          "stream-global-football": 3,
          "stream-allsports": 2,
          "stream-jsports-plus": 1,
        }),
        opt("basketball", "バスケットボール", "Basketball", {
          "stream-hoops-pass": 3,
          "stream-allsports": 2,
        }),
        opt("baseball", "野球", "Baseball", {
          "stream-diamond-tv": 3,
          "stream-jsports-plus": 2,
          "stream-allsports": 1,
        }),
        opt("many", "いろいろ見たい", "A bit of everything", { "stream-allsports": 3 }),
      ]),
      q("budget", "月額の予算は？", "What's your monthly budget?", [
        opt("free", "できれば無料", "Free if possible", { "stream-arena-gg": 3 }),
        opt("low", "2,000円まで", "Up to ¥2,000", {
          "stream-jsports-plus": 3,
          "stream-hoops-pass": 2,
          "stream-gridiron-now": 1,
        }),
        opt("mid", "4,000円まで", "Up to ¥4,000", {
          "stream-allsports": 3,
          "stream-global-football": 2,
          "stream-velocity-tv": 1,
        }),
      ]),
      q("device", "主にどこで見ますか？", "Where will you watch?", [
        opt("tv", "テレビの大画面", "On a TV", {
          "stream-allsports": 2,
          "stream-global-football": 2,
          "stream-velocity-tv": 1,
        }),
        opt("phone", "スマートフォン", "On a phone", {
          "stream-hoops-pass": 2,
          "stream-arena-gg": 2,
        }),
        opt("pc", "パソコン", "On a computer", {
          "stream-global-football": 1,
          "stream-allsports": 1,
          "stream-arena-gg": 1,
        }),
      ]),
      q("language", "日本語実況は必要ですか？", "Do you need Japanese commentary?", [
        opt("yes", "必要", "Yes", {
          "stream-allsports": 2,
          "stream-jsports-plus": 2,
          "stream-hoops-pass": 1,
        }),
        opt("no", "英語でもよい", "English is fine", {
          "stream-gridiron-now": 2,
          "stream-global-football": 1,
        }),
      ]),
    ],
    results: [
      result({
        id: "stream-allsports",
        ja: "総合型サービスが向いています",
        en: "A do-everything service suits you",
        descJa:
          "複数競技を横断して見たい人は、単体契約を重ねるより総合型のほうが結果的に安く済みます。",
        descEn:
          "If you follow several sports, one broad subscription usually beats stacking single-sport ones.",
        reasons: [
          ["複数競技を1契約でカバーできる", "One contract covers several sports"],
          [
            "テレビ・スマホ両対応で同時視聴数も多い",
            "Works on TV and phone, with more simultaneous streams",
          ],
        ],
        streamingIds: ["stream-allsports"],
        accent: "#22d3ee",
      }),
      result({
        id: "stream-global-football",
        ja: "サッカー特化サービスが向いています",
        en: "A football-first service suits you",
        descJa: "欧州サッカーを軸に見るなら、対象大会が明確なサービスのほうが確実です。",
        descEn:
          "If European football is the centre of your viewing, pick the service whose rights are clearest.",
        reasons: [
          ["対象大会がサッカーに集中している", "Rights concentrated on football"],
          ["画質と同時視聴の条件が良い", "Strong quality and simultaneous-stream terms"],
        ],
        streamingIds: ["stream-global-football"],
        accent: "#6366f1",
      }),
      result({
        id: "stream-hoops-pass",
        ja: "バスケットボール特化が向いています",
        en: "A basketball-only service suits you",
        descJa:
          "時差の関係で見逃し配信の利用が中心になります。オンデマンドの条件を必ず確認してください。",
        descEn: "Time zones mean you'll live in the on-demand catalogue — check those terms first.",
        reasons: [
          ["対象がバスケットボールに絞られている", "Basketball only"],
          ["見逃し配信が充実している", "Strong on-demand library"],
        ],
        streamingIds: ["stream-hoops-pass"],
        accent: "#f59e0b",
      }),
      result({
        id: "stream-diamond-tv",
        ja: "野球特化が向いています",
        en: "A baseball-only service suits you",
        descJa:
          "地域によっては一部試合がブラックアウトになります。対象試合を先に確認してください。",
        descEn: "Some games are blacked out by region — check which fixtures you actually get.",
        reasons: [["野球に特化して料金が抑えられる", "Cheaper because it only does baseball"]],
        streamingIds: ["stream-diamond-tv"],
        accent: "#38bdf8",
      }),
      result({
        id: "stream-jsports-plus",
        ja: "国内リーグ中心のサービスが向いています",
        en: "A domestic-league service suits you",
        descJa: "国内の試合を日本語実況で見たい場合、これがもっとも素直な選択です。",
        descEn: "The straightforward pick for domestic leagues with Japanese commentary.",
        reasons: [
          ["国内リーグの日本語実況が揃っている", "Domestic leagues with Japanese commentary"],
        ],
        streamingIds: ["stream-jsports-plus"],
        accent: "#ef4444",
      }),
      result({
        id: "stream-gridiron-now",
        ja: "アメリカンフットボール特化が向いています",
        en: "An American-football-only service suits you",
        descJa:
          "日本語実況が提供されない場合があります。英語中継で問題ないかを先に確認してください。",
        descEn:
          "Japanese commentary may not be available — check you're happy with the English feed.",
        reasons: [
          ["対象がNFLに絞られている", "NFL only"],
          ["シーズン単位の契約形態", "Sold by season"],
        ],
        streamingIds: ["stream-gridiron-now"],
        accent: "#8b5cf6",
      }),
      result({
        id: "stream-velocity-tv",
        ja: "モータースポーツ特化が向いています",
        en: "A motorsport-only service suits you",
        descJa:
          "オンボード映像などの追加機能が上位プラン限定のことがあります。プラン差を確認してください。",
        descEn:
          "Extras like onboard feeds are often locked to the higher tier — compare the plans.",
        reasons: [["F1・MotoGP に対象が集中している", "Focused on F1 and MotoGP"]],
        streamingIds: ["stream-velocity-tv"],
        accent: "#ef4444",
      }),
      result({
        id: "stream-arena-gg",
        ja: "まずは無料配信から",
        en: "Start with the free streams",
        descJa: "eスポーツは多くの大会が無料配信されています。費用をかけずに観戦習慣を作れます。",
        descEn: "Most esports events are free to watch — build the habit before you spend.",
        reasons: [
          ["費用ゼロで始められる", "No cost to start"],
          ["視聴環境を選ばない", "Works on anything"],
        ],
        streamingIds: ["stream-arena-gg"],
        accent: "#e879f9",
      }),
    ],
  },

  // 3. 推しチーム診断
  {
    id: "d-your-team",
    slug: "your-team",
    title: { ja: "推しチーム診断", en: "Find your team" },
    lead: {
      ja: "応援スタイルから、追いかけると楽しいクラブを提案します。",
      en: "How you like to support decides which club suits you.",
    },
    questions: [
      q("style", "応援するなら？", "What do you want from a club?", [
        opt("win", "強いチームを見たい", "I want to watch winners", {
          "t-arsenal": 2,
          "t-real-madrid": 3,
          "t-celtics": 2,
        }),
        opt("story", "物語のあるチーム", "A club with a story", {
          "t-newcastle": 3,
          "t-athletic": 3,
          "t-machida": 2,
        }),
        opt("local", "身近なチーム", "Something close to home", {
          "t-kawasaki": 3,
          "t-machida": 2,
          "t-vissel": 2,
        }),
      ]),
      q("region", "気になる地域は？", "Which region interests you?", [
        opt("jp", "日本", "Japan", {
          "t-kawasaki": 3,
          "t-vissel": 2,
          "t-machida": 2,
          "t-hanshin": 2,
        }),
        opt("eu", "ヨーロッパ", "Europe", {
          "t-arsenal": 3,
          "t-real-madrid": 2,
          "t-athletic": 2,
          "t-newcastle": 2,
        }),
        opt("us", "北米", "North America", { "t-celtics": 3, "t-nuggets": 2, "t-chiefs": 2 }),
      ]),
      q("play", "好みのスタイルは？", "What style do you enjoy?", [
        opt("attack", "攻撃的", "Attacking", {
          "t-real-madrid": 2,
          "t-arsenal": 2,
          "t-nuggets": 2,
        }),
        opt("defend", "堅い守り", "Solid defence", {
          "t-athletic": 2,
          "t-celtics": 2,
          "t-machida": 2,
        }),
        opt("young", "若手中心", "Young squads", { "t-machida": 3, "t-kawasaki": 2 }),
      ]),
    ],
    results: [
      result({
        id: "t-arsenal",
        ja: "アーセナル",
        en: "Arsenal",
        descJa: "攻撃的なスタイルと若い主力の組み合わせが特徴です。",
        descEn: "Attacking football built around a young core.",
        reasons: [
          ["攻撃的なスタイル", "Attack-minded"],
          ["リーグ上位の常連", "Regular title contenders"],
        ],
        teamIds: ["t-arsenal"],
        leagueIds: ["premier-league"],
        playerIds: ["p-hale"],
        accent: "#ef4444",
      }),
      result({
        id: "t-kawasaki",
        ja: "川崎フロンターレ",
        en: "Kawasaki Frontale",
        descJa: "国内リーグを軸に、生活時間に合う時間帯で観戦できます。",
        descEn: "A domestic side you can watch at a civilised hour.",
        reasons: [
          ["試合時間が生活に合う", "Kick-off times that fit your day"],
          ["ポゼッション志向のスタイル", "Possession-based football"],
        ],
        teamIds: ["t-kawasaki"],
        leagueIds: ["j1-league"],
        playerIds: ["p-okada"],
        accent: "#0ea5e9",
      }),
      result({
        id: "t-real-madrid",
        ja: "レアル・マドリード",
        en: "Real Madrid",
        descJa: "国際大会での実績が豊富で、話題に事欠きません。",
        descEn: "A club whose European history means there is always something to talk about.",
        reasons: [["国際大会での実績", "A deep European record"]],
        teamIds: ["t-real-madrid"],
        leagueIds: ["laliga"],
        playerIds: ["p-moreno"],
        accent: "#a78bfa",
      }),
      result({
        id: "t-celtics",
        ja: "ボストン・セルティックス",
        en: "Boston Celtics",
        descJa: "組織的な守備と3ポイントの精度が持ち味です。",
        descEn: "Organised defence and elite three-point shooting.",
        reasons: [["守備の組織力", "Defensive structure"]],
        teamIds: ["t-celtics"],
        leagueIds: ["nba"],
        playerIds: ["p-brooks"],
        accent: "#16a34a",
      }),
      result({
        id: "t-athletic",
        ja: "アスレティック・クルブ",
        en: "Athletic Club",
        descJa: "地元出身選手を中心に据える方針が、クラブの物語を作っています。",
        descEn: "A club defined by its commitment to local players.",
        reasons: [["クラブ方針そのものが物語になっている", "The recruitment policy is the story"]],
        teamIds: ["t-athletic"],
        leagueIds: ["laliga"],
        accent: "#b91c1c",
      }),
      result({
        id: "t-machida",
        ja: "FC町田ゼルビア",
        en: "FC Machida Zelvia",
        descJa: "若い選手が伸びていく過程を追いかける楽しさがあります。",
        descEn: "The fun here is watching young players grow.",
        reasons: [["若手の成長を追える", "A squad you can watch develop"]],
        teamIds: ["t-machida"],
        leagueIds: ["j1-league"],
        accent: "#1e3a8a",
      }),
      result({
        id: "t-newcastle",
        ja: "ニューカッスル・ユナイテッド",
        en: "Newcastle United",
        descJa:
          "少ないチャンスを決め切るカウンターが持ち味。物語のあるクラブを追いたい人に向いています。",
        descEn: "Ruthless on the counter, and a club with a story worth following.",
        reasons: [
          ["カウンターの完成度", "Counter-attacking quality"],
          ["長い歴史と地域との結び付き", "History and a strong local identity"],
        ],
        teamIds: ["t-newcastle"],
        leagueIds: ["premier-league"],
        accent: "#f8fafc",
      }),
      result({
        id: "t-vissel",
        ja: "ヴィッセル神戸",
        en: "Vissel Kobe",
        descJa: "堅い守備からの速い攻撃。国内リーグを生活時間に合わせて追えます。",
        descEn: "Solid at the back, quick forward — and at a time zone you can actually watch.",
        reasons: [
          ["守備からの切り替えが速い", "Fast transitions"],
          ["観戦しやすい時間帯", "Watchable kick-off times"],
        ],
        teamIds: ["t-vissel"],
        leagueIds: ["j1-league"],
        accent: "#7f1d1d",
      }),
      result({
        id: "t-nuggets",
        ja: "デンバー・ナゲッツ",
        en: "Denver Nuggets",
        descJa: "センターを起点にした組み立てが独特で、見ていて仕組みが分かりやすいチームです。",
        descEn: "Everything runs through the centre — an unusually legible way to play.",
        reasons: [["攻撃の設計が読み取りやすい", "The offensive design is easy to read"]],
        teamIds: ["t-nuggets"],
        leagueIds: ["nba"],
        playerIds: ["p-mensah"],
        accent: "#1e40af",
      }),
      result({
        id: "t-hanshin",
        ja: "阪神タイガース",
        en: "Hanshin Tigers",
        descJa: "長いシーズンを日々追いかける楽しさがあります。国内開催で時差もありません。",
        descEn: "A long season to follow day by day, with no time difference to fight.",
        reasons: [["毎日試合があり習慣にしやすい", "Near-daily games make it easy to keep up"]],
        teamIds: ["t-hanshin"],
        leagueIds: ["npb"],
        accent: "#facc15",
      }),
      result({
        id: "t-chiefs",
        ja: "カンザスシティ・チーフス",
        en: "Kansas City Chiefs",
        descJa: "1プレーごとに作戦が切り替わる戦術性の高さが魅力です。",
        descEn: "A new plan on every snap — the most tactical option here.",
        reasons: [["戦術の読み合いが濃い", "Dense tactical layers"]],
        teamIds: ["t-chiefs"],
        leagueIds: ["nfl"],
        playerIds: ["p-kowalski"],
        accent: "#b91c1c",
      }),
    ],
  },
];

/** 短縮版の入力形。ResultSeed をそのまま使い、変換は toDiagnosis に任せます。 */
type ShortSeed = {
  id: string;
  slug: string;
  titleJa: string;
  titleEn: string;
  leadJa: string;
  leadEn: string;
  disclaimer?: { ja: string; en: string };
  questions: DiagnosisQuestion[];
  results: ResultSeed[];
};

const shortDiagnosesSource: ShortSeed[] = [
  {
    id: "d-your-player",
    slug: "your-player",
    titleJa: "推し選手診断",
    titleEn: "Find your player",
    leadJa: "プレースタイルの好みから、注目したい選手を提案します。",
    leadEn: "Your taste in play style points to a player to follow.",
    questions: [
      q("role", "惹かれる役割は？", "Which role appeals?", [
        opt("scorer", "点を取る選手", "The scorer", { "p-hale": 3, "p-brooks": 2 }),
        opt("creator", "組み立てる選手", "The creator", { "p-okada": 3, "p-mensah": 2 }),
        opt("stopper", "止める選手", "The stopper", { "p-ferreira": 3, "p-novak": 2 }),
      ]),
      q("age", "追いかけたいのは？", "Who do you want to follow?", [
        opt("young", "若手", "A rising player", { "p-okada": 2, "p-hale": 2 }),
        opt("prime", "全盛期", "Someone at their peak", { "p-brooks": 2, "p-mensah": 2 }),
        opt("veteran", "経験豊富な選手", "An experienced head", { "p-ferreira": 2, "p-novak": 2 }),
      ]),
      q("sport2", "競技は？", "Which sport?", [
        opt("football", "サッカー", "Football", {
          "p-hale": 2,
          "p-okada": 2,
          "p-ferreira": 2,
          "p-novak": 1,
        }),
        opt("basketball", "バスケットボール", "Basketball", { "p-brooks": 3, "p-mensah": 3 }),
      ]),
    ],
    results: [
      {
        id: "p-hale",
        ja: "ジョーダン・ヘイル",
        en: "Jordan Hale",
        descJa: "ペナルティエリア内での完結力が持ち味のフォワードです。",
        descEn: "A forward who does his damage inside the box.",
        reasons: [["得点力に特化した選手", "A pure goalscorer"]],
        playerIds: ["p-hale"],
        teamIds: ["t-arsenal"],
        accent: "#ef4444",
      },
      {
        id: "p-okada",
        ja: "岡田 陸",
        en: "Riku Okada",
        descJa: "チャンスを作る役割で、1試合平均2.4本のキーパスを記録しています。",
        descEn: "A creator averaging 2.4 key passes a game.",
        reasons: [["組み立ての中心", "The team's creative hub"]],
        playerIds: ["p-okada"],
        teamIds: ["t-kawasaki"],
        accent: "#0ea5e9",
      },
      {
        id: "p-mensah",
        ja: "コフィ・メンサ",
        en: "Kofi Mensah",
        descJa: "センターながらアシストの多い、現代的な万能型です。",
        descEn: "A centre who passes like a guard.",
        reasons: [["得点・リバウンド・アシストのすべてで貢献", "Contributes across the board"]],
        playerIds: ["p-mensah"],
        teamIds: ["t-nuggets"],
        accent: "#1e40af",
      },
      {
        id: "p-brooks",
        ja: "アーロン・ブルックス",
        en: "Aaron Brooks",
        descJa: "得点力と守備を両立する、全盛期のウイングです。",
        descEn: "A wing at his peak, scoring and defending in equal measure.",
        reasons: [["攻守どちらでも計算できる", "Reliable at both ends"]],
        playerIds: ["p-brooks"],
        teamIds: ["t-celtics"],
        accent: "#16a34a",
      },
      {
        id: "p-ferreira",
        ja: "ルカ・フェレイラ",
        en: "Luca Ferreira",
        descJa: "デュエル勝率64%。相手の攻撃を止める役割の面白さが分かる選手です。",
        descEn: "Sixty-four per cent of duels won — the case for watching defenders.",
        reasons: [["守備の駆け引きが見どころ", "The defensive duel is the show"]],
        playerIds: ["p-ferreira"],
        teamIds: ["t-barcelona"],
        accent: "#a21caf",
      },
      {
        id: "p-novak",
        ja: "マレク・ノヴァーク",
        en: "Marek Novak",
        descJa: "セーブ率74%。試合を決めるのは最後尾だと分かる選手です。",
        descEn: "A 74% save rate — proof that matches are decided at the back.",
        reasons: [["1つのセーブが試合を変える", "One save can change the game"]],
        playerIds: ["p-novak"],
        teamIds: ["t-man-city"],
        accent: "#38bdf8",
      },
    ],
  },
  {
    id: "d-football-club",
    slug: "football-club",
    titleJa: "サッカークラブ診断",
    titleEn: "Which football club",
    leadJa: "リーグと好みのスタイルから、追いかけるクラブを提案します。",
    leadEn: "League preference plus playing style equals your club.",
    questions: [
      q("league", "どのリーグが気になりますか？", "Which league?", [
        opt("epl", "プレミアリーグ", "Premier League", {
          "t-arsenal": 3,
          "t-newcastle": 2,
          "t-man-city": 2,
        }),
        opt("laliga", "ラ・リーガ", "LaLiga", { "t-real-madrid": 3, "t-athletic": 2 }),
        opt("j1", "J1リーグ", "J1 League", { "t-kawasaki": 3, "t-vissel": 2 }),
      ]),
      q("style2", "好みのスタイルは？", "Preferred style?", [
        opt("possession", "ポゼッション", "Possession", {
          "t-man-city": 3,
          "t-kawasaki": 2,
          "t-real-madrid": 1,
        }),
        opt("counter", "カウンター", "Counter-attack", { "t-newcastle": 3, "t-vissel": 2 }),
        opt("press", "ハイプレス", "High press", { "t-arsenal": 2, "t-athletic": 2 }),
      ]),
      q("history", "クラブの歴史は重視しますか？", "Does history matter?", [
        opt("yes", "重視する", "Yes", { "t-real-madrid": 2, "t-arsenal": 2, "t-athletic": 2 }),
        opt("no", "今の姿が大事", "The present matters more", {
          "t-kawasaki": 2,
          "t-vissel": 2,
          "t-newcastle": 1,
        }),
      ]),
    ],
    results: [
      {
        id: "t-man-city",
        ja: "マンチェスター・シティ",
        en: "Manchester City",
        descJa: "ボール保持を軸にしたスタイルの完成度が高いクラブです。",
        descEn: "The most polished possession side in the sample.",
        reasons: [["ポゼッション志向", "Possession-first"]],
        teamIds: ["t-man-city"],
        leagueIds: ["premier-league"],
        playerIds: ["p-novak"],
        accent: "#38bdf8",
      },
      {
        id: "t-newcastle",
        ja: "ニューカッスル・ユナイテッド",
        en: "Newcastle United",
        descJa: "カウンターの設計が明快で、少ないチャンスを決め切るチームです。",
        descEn: "Clear counter-attacking design and ruthless finishing.",
        reasons: [["カウンターの完成度", "Counter-attacking quality"]],
        teamIds: ["t-newcastle"],
        leagueIds: ["premier-league"],
        accent: "#f8fafc",
      },
      {
        id: "t-vissel",
        ja: "ヴィッセル神戸",
        en: "Vissel Kobe",
        descJa: "堅い守備からの速い攻撃が持ち味です。",
        descEn: "Solid at the back, quick going forward.",
        reasons: [["守備からの切り替えが速い", "Fast transitions"]],
        teamIds: ["t-vissel"],
        leagueIds: ["j1-league"],
        accent: "#7f1d1d",
      },
      {
        id: "t-arsenal",
        ja: "アーセナル",
        en: "Arsenal",
        descJa: "前線からのプレスと若い主力の組み合わせ。歴史も現在地も揃っています。",
        descEn: "High pressing, a young core, and plenty of history behind it.",
        reasons: [
          ["ハイプレスのスタイル", "A high-pressing side"],
          ["長いクラブの歴史", "Deep club history"],
        ],
        teamIds: ["t-arsenal"],
        leagueIds: ["premier-league"],
        playerIds: ["p-hale"],
        accent: "#ef4444",
      },
      {
        id: "t-real-madrid",
        ja: "レアル・マドリード",
        en: "Real Madrid",
        descJa: "国際大会での実績が豊富で、シーズンを通じて話題に事欠きません。",
        descEn: "A European record that keeps the season interesting from start to finish.",
        reasons: [["国際大会での実績", "A deep European record"]],
        teamIds: ["t-real-madrid"],
        leagueIds: ["laliga"],
        playerIds: ["p-moreno"],
        accent: "#a78bfa",
      },
      {
        id: "t-athletic",
        ja: "アスレティック・クルブ",
        en: "Athletic Club",
        descJa: "地元出身選手を中心に据える方針そのものが、このクラブの物語です。",
        descEn: "The recruitment policy is the story here.",
        reasons: [["クラブ方針が物語になっている", "The policy is the narrative"]],
        teamIds: ["t-athletic"],
        leagueIds: ["laliga"],
        accent: "#b91c1c",
      },
      {
        id: "t-kawasaki",
        ja: "川崎フロンターレ",
        en: "Kawasaki Frontale",
        descJa: "ポゼッション志向で、国内リーグの中でもスタイルがはっきりしています。",
        descEn: "The clearest possession identity in the domestic league.",
        reasons: [["ポゼッション志向", "Possession-first"]],
        teamIds: ["t-kawasaki"],
        leagueIds: ["j1-league"],
        playerIds: ["p-okada"],
        accent: "#0ea5e9",
      },
    ],
  },
  {
    id: "d-nba-team",
    slug: "nba-team",
    titleJa: "NBAチーム診断",
    titleEn: "Which NBA team",
    leadJa: "見たいバスケットボールの形から、追いかけるチームを提案します。",
    leadEn: "The basketball you want to watch decides the team.",
    questions: [
      q("offense", "見たい攻撃は？", "What offence do you want?", [
        opt("three", "3ポイント中心", "Three-point heavy", { "t-celtics": 3 }),
        opt("inside", "インサイド中心", "Inside-out", { "t-nuggets": 3 }),
        opt("star", "スター選手中心", "Star-driven", { "t-lakers": 3, "t-knicks": 1 }),
      ]),
      q("defense", "守備の好みは？", "And the defence?", [
        opt("switch", "全員が守れる", "Everyone switches", { "t-celtics": 2 }),
        opt("rim", "リム周りで止める", "Protect the rim", { "t-nuggets": 2, "t-knicks": 2 }),
      ]),
      q("timezone", "深夜の観戦は？", "Can you watch late?", [
        opt("ok", "平気", "No problem", { "t-lakers": 2, "t-nuggets": 1 }),
        opt("ng", "見逃し配信で十分", "On demand is fine", { "t-celtics": 2, "t-knicks": 2 }),
      ]),
    ],
    results: [
      {
        id: "t-celtics",
        ja: "ボストン・セルティックス",
        en: "Boston Celtics",
        descJa: "3ポイントと守備の組織力で戦うチームです。",
        descEn: "Threes and switching defence.",
        reasons: [["3P成功率と守備の両立", "Shooting plus defence"]],
        teamIds: ["t-celtics"],
        leagueIds: ["nba"],
        playerIds: ["p-brooks"],
        accent: "#16a34a",
      },
      {
        id: "t-nuggets",
        ja: "デンバー・ナゲッツ",
        en: "Denver Nuggets",
        descJa: "センターを起点にした組み立てが特徴です。",
        descEn: "Everything runs through the centre.",
        reasons: [["インサイドからの展開", "Inside-out construction"]],
        teamIds: ["t-nuggets"],
        leagueIds: ["nba"],
        playerIds: ["p-mensah"],
        accent: "#1e40af",
      },
      {
        id: "t-lakers",
        ja: "ロサンゼルス・レイカーズ",
        en: "Los Angeles Lakers",
        descJa: "個の力を前面に出したチームです。",
        descEn: "A team built around individual talent.",
        reasons: [["スター選手中心の構成", "Star-led roster"]],
        teamIds: ["t-lakers"],
        leagueIds: ["nba"],
        playerIds: ["p-suzuki-b"],
        accent: "#7c3aed",
      },
      {
        id: "t-knicks",
        ja: "ニューヨーク・ニックス",
        en: "New York Knicks",
        descJa: "リム周りを固める守備が軸。東海岸開催のため見逃し配信とも相性が良いチームです。",
        descEn: "Rim protection first — and an east-coast tip-off that suits on-demand viewing.",
        reasons: [
          ["守備からリズムを作る", "Defence sets the tempo"],
          ["見逃し配信で追いやすい時間帯", "Kick-off times that suit catch-up viewing"],
        ],
        teamIds: ["t-knicks"],
        leagueIds: ["nba"],
        accent: "#1d4ed8",
      },
    ],
  },
  {
    id: "d-motorsport",
    slug: "motorsport",
    titleJa: "モータースポーツ診断",
    titleEn: "Which motorsport",
    leadJa: "速さの何に惹かれるかで、向いているカテゴリが変わります。",
    leadEn: "What kind of speed do you actually enjoy?",
    questions: [
      q("what", "惹かれるのは？", "What draws you in?", [
        opt("tech", "技術と戦略", "Engineering and strategy", { f1: 3 }),
        opt("skill", "人間の技量", "Human skill", { motogp: 3 }),
        opt("endure", "耐久・チーム戦", "Endurance and teamwork", { gt: 3 }),
      ]),
      q("length", "1レースの長さは？", "Race length?", [
        opt("short", "1〜2時間", "One to two hours", { f1: 2, motogp: 2 }),
        opt("long", "長時間でも", "The longer the better", { gt: 2 }),
      ]),
      q("watch", "観戦スタイルは？", "How do you watch?", [
        opt("data", "データを見ながら", "With the data open", { f1: 2 }),
        opt("feel", "映像に集中", "Just the pictures", { motogp: 2, gt: 1 }),
      ]),
    ],
    results: [
      {
        id: "f1",
        ja: "F1",
        en: "Formula 1",
        descJa: "戦略とレギュレーションの読み合いが最も濃いカテゴリです。",
        descEn: "The most strategy-dense category on the calendar.",
        reasons: [["戦略とデータの層が厚い", "Layers of strategy and data"]],
        sportIds: ["f1"],
        leagueIds: ["f1-championship"],
        streamingIds: ["stream-velocity-tv"],
        accent: "#ef4444",
      },
      {
        id: "motogp",
        ja: "MotoGP",
        en: "MotoGP",
        descJa: "ライダーの技量が結果に直結します。接近戦が多いのも特徴です。",
        descEn: "Rider skill decides it, and the racing is close.",
        reasons: [["接近戦が多い", "Close racing"]],
        sportIds: ["motogp"],
        streamingIds: ["stream-velocity-tv"],
        accent: "#fb7185",
      },
      {
        id: "gt",
        ja: "耐久・GTレース",
        en: "Endurance and GT racing",
        descJa: "チーム戦と戦略の積み重ねで結果が決まります。",
        descEn: "Team-work and accumulated strategy decide it.",
        reasons: [["チーム戦としての面白さ", "A genuine team sport"]],
        sportIds: ["f1"],
        accent: "#a78bfa",
      },
    ],
  },
  {
    id: "d-combat",
    slug: "combat-sports",
    titleJa: "格闘技診断",
    titleEn: "Which combat sport",
    leadJa: "好みの決着の付き方から、向いている競技を提案します。",
    leadEn: "How you like fights to end decides the sport.",
    questions: [
      q("finish", "好みの決着は？", "How should it end?", [
        opt("ko", "打撃での決着", "By strikes", { boxing: 3, mma: 1 }),
        opt("sub", "組技での決着", "By submission", { mma: 3 }),
        opt("show", "興行としての演出", "As a show", { "pro-wrestling": 3 }),
      ]),
      q("rules", "ルールの複雑さは？", "How complex should the rules be?", [
        opt("simple", "単純なほうがよい", "Keep it simple", { boxing: 2, "pro-wrestling": 1 }),
        opt("complex", "複雑でも面白い", "Complexity is fine", { mma: 2 }),
      ]),
      q("freq", "観戦頻度は？", "How often?", [
        opt("often", "毎週でも", "Weekly", { mma: 2, "pro-wrestling": 2 }),
        opt("big", "大きな試合だけ", "Only the big ones", { boxing: 2 }),
      ]),
    ],
    results: [
      {
        id: "mma",
        ja: "総合格闘技",
        en: "MMA",
        descJa: "打撃・組技・寝技のすべてが起こりうるため、展開が読みにくいのが魅力です。",
        descEn: "Striking, grappling and ground work — you never know what comes next.",
        reasons: [["展開の幅が広い", "The widest range of outcomes"]],
        sportIds: ["mma"],
        leagueIds: ["ufc"],
        streamingIds: ["stream-cage-live"],
        accent: "#f43f5e",
      },
      {
        id: "boxing",
        ja: "ボクシング",
        en: "Boxing",
        descJa: "ルールが明快で、初見でも駆け引きが分かります。",
        descEn: "Legible from the first bell.",
        reasons: [["ルールが単純", "Simple rules"]],
        sportIds: ["boxing"],
        streamingIds: ["stream-cage-live"],
        accent: "#facc15",
      },
      {
        id: "pro-wrestling",
        ja: "プロレス",
        en: "Pro wrestling",
        descJa: "興行としての構成と物語の積み重ねが見どころです。",
        descEn: "Storytelling across a card and a season.",
        reasons: [["物語の積み重ねが楽しめる", "Long-form storytelling"]],
        sportIds: ["pro-wrestling"],
        accent: "#c084fc",
      },
    ],
  },
  {
    id: "d-viewer-level",
    slug: "viewer-level",
    titleJa: "スポーツ観戦レベル診断",
    titleEn: "How deep does your viewing go",
    leadJa: "今の観戦スタイルを整理し、次に読むべきページを案内します。",
    leadEn: "We map where you are and point you at the next page to read.",
    questions: [
      q("freq2", "観戦の頻度は？", "How often do you watch?", [
        opt("rare", "年に数回", "A few times a year", { beginner: 3 }),
        opt("month", "月に数回", "A few times a month", { casual: 3 }),
        opt("week", "毎週", "Every week", { deep: 3 }),
      ]),
      q("stat", "スタッツは見ますか？", "Do you look at stats?", [
        opt("never", "見ない", "Never", { beginner: 2 }),
        opt("some", "たまに見る", "Sometimes", { casual: 2 }),
        opt("always", "必ず見る", "Always", { deep: 3 }),
      ]),
      q("live", "現地観戦は？", "Do you go to games?", [
        opt("no", "行ったことがない", "Never been", { beginner: 2 }),
        opt("yes", "行ったことがある", "Yes", { casual: 1, deep: 2 }),
      ]),
    ],
    results: [
      {
        id: "beginner",
        ja: "はじめて層",
        en: "Newcomer",
        descJa: "まずはルールの要点と、生活時間に合う競技選びから始めましょう。",
        descEn: "Start with the rules and a sport that fits your schedule.",
        reasons: [["観戦習慣を作る段階", "You're building the habit"]],
        sportIds: ["football", "basketball"],
        accent: "#22d3ee",
      },
      {
        id: "casual",
        ja: "週末観戦層",
        en: "Weekend viewer",
        descJa: "配信サービスの見直しで、見られる試合の数が大きく変わる段階です。",
        descEn: "Reviewing your streaming setup will change how much you can watch.",
        reasons: [["視聴環境の最適化が効く", "Optimising your setup pays off"]],
        streamingIds: ["stream-allsports"],
        accent: "#6366f1",
      },
      {
        id: "deep",
        ja: "データ派",
        en: "Data-first viewer",
        descJa: "分析記事とスタッツ比較を軸に、試合前後の読み込みを深められます。",
        descEn: "Lean into the analysis pieces and the stat comparisons.",
        reasons: [["分析コンテンツの活用余地が大きい", "Analysis is where you get more"]],
        videoIds: ["v-hale-analysis"],
        accent: "#d946ef",
      },
    ],
  },
  {
    id: "d-web3-service",
    slug: "web3-service",
    titleJa: "Web3.0スポーツサービス診断",
    titleEn: "Which Web3 sports service",
    leadJa: "目的から、まず見るべきサービス分類を絞ります。購入を勧めるものではありません。",
    leadEn: "We narrow the category by your goal. This is not a recommendation to buy.",
    questions: [
      q("goal", "目的はどれに近いですか？", "What's your goal?", [
        opt("club", "クラブと関わりたい", "Get closer to a club", {
          "w-fanvote": 3,
          "w-lineupdao": 2,
        }),
        opt("collect", "集めたい", "Collect things", { "w-momentvault": 3 }),
        opt("play", "遊びたい", "Play something", { "w-fantasy-terminal": 3 }),
      ]),
      q("crypto", "暗号資産の利用経験は？", "Any crypto experience?", [
        opt("none", "まったくない", "None at all", { "w-fantasy-terminal": 3 }),
        opt("some", "少しある", "A little", { "w-fanvote": 2, "w-momentvault": 1 }),
      ]),
      q("spend", "費用は？", "What will you spend?", [
        opt("zero", "無料の範囲で", "Nothing", { "w-fantasy-terminal": 3, "w-lineupdao": 1 }),
        opt("small", "少額なら", "A small amount", { "w-fanvote": 2, "w-momentvault": 1 }),
      ]),
    ],
    results: [
      {
        id: "w-fantasy-terminal",
        ja: "まずは無料のファンタジースポーツから",
        en: "Start with free fantasy sports",
        descJa: "暗号資産を使わずに始められます。選手やスタッツに詳しくなる効果もあります。",
        descEn: "No crypto needed, and you'll learn the players and the numbers.",
        reasons: [["費用と技術的な障壁がない", "No cost, no technical barrier"]],
        accent: "#34d399",
      },
      {
        id: "w-fanvote",
        ja: "ファントークン系サービス",
        en: "Fan token services",
        descJa:
          "投票参加が目的なら該当します。価格変動とサービス終了のリスクを必ず確認してください。",
        descEn:
          "If voting is the point, this is the category — but check the volatility and shutdown risk.",
        reasons: [["クラブ企画への参加が主目的", "Built around club participation"]],
        accent: "#22d3ee",
      },
      {
        id: "w-momentvault",
        ja: "コレクション系サービス",
        en: "Collectible services",
        descJa: "映像の著作権が移転するわけではない点を理解したうえで検討してください。",
        descEn: "Understand that you are not buying the copyright in the footage.",
        reasons: [["収集そのものが目的の人向け", "For people who enjoy collecting"]],
        accent: "#d946ef",
      },
      {
        id: "w-lineupdao",
        ja: "コミュニティ参加型サービス",
        en: "Community-governed services",
        descJa:
          "費用をかけずにクラブへ意見を届けたい人向けです。投票結果に法的拘束力はありません。",
        descEn: "For people who want a say without spending. Votes carry no legal force.",
        reasons: [
          ["無料で参加できる", "Free to join"],
          ["意見の可視化が目的", "The point is making fan opinion visible"],
        ],
        accent: "#22d3ee",
      },
    ],
  },
  {
    id: "d-fan-token-literacy",
    slug: "fan-token-literacy",
    titleJa: "ファントークン理解度診断",
    titleEn: "How well do you understand fan tokens",
    leadJa: "仕組みとリスクの理解度を確認します。結果は投資判断の材料にはなりません。",
    leadEn: "A check on mechanics and risk. Not investment advice.",
    questions: [
      q(
        "q1",
        "ファントークンを持つと、クラブの株主になれる？",
        "Does holding a fan token make you a shareholder?",
        [opt("no", "ならない", "No", { high: 2, mid: 1 }), opt("yes", "なれる", "Yes", { low: 2 })],
      ),
      q("q2", "発行元のサービスが終了したら？", "What if the issuing platform shuts down?", [
        opt("lost", "特典が使えなくなる可能性が高い", "Most perks probably stop working", {
          high: 2,
        }),
        opt("safe", "特典は残る", "The perks survive", { low: 2 }),
      ]),
      q("q3", "価格はどう決まる？", "How is the price set?", [
        opt("market", "需給で変動する", "By supply and demand", { high: 2, mid: 1 }),
        opt("club", "クラブが決める", "The club sets it", { low: 2 }),
      ]),
    ],
    results: [
      {
        id: "high",
        ja: "仕組みを理解しています",
        en: "You understand the mechanics",
        descJa:
          "リスクの所在を正しく捉えられています。それでも余裕資金の範囲を超えないようにしてください。",
        descEn: "You've located the risk correctly. Still, never commit more than you can lose.",
        reasons: [["リスクの所在を把握できている", "You know where the risk sits"]],
        accent: "#34d399",
      },
      {
        id: "mid",
        ja: "おおむね理解しています",
        en: "Mostly there",
        descJa: "サービス終了時の扱いをもう一度確認しておくと安心です。",
        descEn: "Worth re-reading what happens if the platform closes.",
        reasons: [["一部の理解に補強の余地", "A couple of gaps to fill"]],
        accent: "#f59e0b",
      },
      {
        id: "low",
        ja: "先に仕組みの確認を",
        en: "Read the basics first",
        descJa: "購入を検討する前に、当サイトの解説記事で仕組みとリスクをご確認ください。",
        descEn: "Read our explainer before you consider buying anything.",
        reasons: [["誤解のまま進むと損失につながる", "Misunderstandings here cost money"]],
        accent: "#f43f5e",
      },
    ],
  },
  {
    id: "d-security",
    slug: "sports-security",
    titleJa: "スポーツセキュリティ診断",
    titleEn: "Sports account security check",
    leadJa: "配信サービスやチケットアプリのアカウントを安全に使えているか確認します。",
    leadEn: "Are your streaming and ticketing accounts actually safe?",
    questions: [
      q("s1", "パスワードは使い回していますか？", "Do you reuse passwords?", [
        opt("no", "していない", "Never", { good: 2 }),
        opt("some", "一部している", "Sometimes", { warn: 2 }),
        opt("yes", "している", "Yes", { risk: 3 }),
      ]),
      q("s2", "二段階認証は？", "Two-factor authentication?", [
        opt("on", "有効にしている", "Enabled", { good: 2 }),
        opt("off", "していない", "Not enabled", { risk: 2, warn: 1 }),
      ]),
      q("s3", "チケットの購入先は？", "Where do you buy tickets?", [
        opt("official", "公式のみ", "Official channels only", { good: 2 }),
        opt("resale", "転売サイトも使う", "Resale sites too", { warn: 2, risk: 1 }),
      ]),
    ],
    results: [
      {
        id: "good",
        ja: "安全に使えています",
        en: "You're in good shape",
        descJa: "現在の運用を維持してください。公式アプリ以外での購入には引き続き注意を。",
        descEn: "Keep it up, and stay careful outside official channels.",
        reasons: [["基本的な対策ができている", "The basics are covered"]],
        accent: "#34d399",
      },
      {
        id: "warn",
        ja: "改善の余地があります",
        en: "Room for improvement",
        descJa: "二段階認証の有効化と、パスワードの使い分けから着手してください。",
        descEn: "Start with two-factor authentication and unique passwords.",
        reasons: [["対策が部分的", "Only partly protected"]],
        accent: "#f59e0b",
      },
      {
        id: "risk",
        ja: "早めの対応をおすすめします",
        en: "Act soon",
        descJa:
          "使い回しのパスワードは、1つの漏えいで全アカウントに影響します。今日中に変更してください。",
        descEn: "One leak compromises everything. Change them today.",
        reasons: [["1件の漏えいが全体に波及する状態", "One breach would cascade"]],
        accent: "#f43f5e",
      },
    ],
  },
  {
    id: "d-betting-literacy",
    slug: "betting-literacy",
    titleJa: "ベッティング情報リテラシー診断",
    titleEn: "Betting information literacy",
    leadJa: "勝敗や利益を扱う診断ではありません。法令・年齢・地域制限の理解度を確認します。",
    leadEn: "Not about outcomes or profit — this checks your understanding of the legal limits.",
    disclaimer: {
      ja: "この診断は情報提供のみを目的としています。賭博行為を勧誘するものではなく、勝敗・利益に関する判断材料も提供しません。",
      en: "Informational only. It does not solicit gambling and offers no guidance on outcomes or profit.",
    },
    questions: [
      q(
        "b1",
        "海外のベッティングサービスは、日本国内から自由に使える？",
        "Can you freely use offshore betting services from Japan?",
        [
          opt("no", "法令に抵触するおそれがある", "It may breach the law", { aware: 3 }),
          opt("yes", "問題ない", "No problem", { unaware: 3 }),
        ],
      ),
      q("b2", "年齢制限は？", "What's the age limit?", [
        opt("18", "18歳以上（地域により21歳以上）", "18+, or 21+ in some regions", { aware: 2 }),
        opt("none", "特にない", "There isn't one", { unaware: 2 }),
      ]),
      q(
        "b3",
        "「必ず勝てる」と書かれた情報を見たら？",
        "You see a site promising guaranteed wins. What do you do?",
        [
          opt("doubt", "信用しない", "Ignore it", { aware: 2 }),
          opt("check", "内容を確認してみる", "Take a look", { caution: 2 }),
        ],
      ),
    ],
    results: [
      {
        id: "aware",
        ja: "制限を正しく理解しています",
        en: "You understand the limits",
        descJa:
          "法令・年齢・地域の制限を把握できています。当サイトの掲載方針もあわせてご確認ください。",
        descEn: "You have the legal, age and regional limits right.",
        reasons: [["制限の理解ができている", "You know the constraints"]],
        accent: "#34d399",
      },
      {
        id: "caution",
        ja: "注意が必要です",
        en: "Be careful",
        descJa:
          "利益や勝率を保証する表現は、それ自体が危険信号です。情報源を必ず確認してください。",
        descEn: "Any promise of guaranteed returns is itself the warning sign.",
        reasons: [["誇大な表現に接触するリスク", "You're exposed to exaggerated claims"]],
        accent: "#f59e0b",
      },
      {
        id: "unaware",
        ja: "先に制限の確認を",
        en: "Check the rules first",
        descJa:
          "日本国内から海外のベッティングサービスを利用する行為は、法令に抵触するおそれがあります。当サイトのベッティング情報掲載方針をご覧ください。",
        descEn:
          "Using offshore betting services from Japan may breach local law. Read our betting content policy.",
        reasons: [["法令上のリスクを把握できていない", "The legal risk isn't clear to you yet"]],
        accent: "#f43f5e",
      },
    ],
  },
];

function toDiagnosis(seed: ShortSeed): Diagnosis {
  return {
    id: seed.id,
    slug: seed.slug,
    title: { ja: seed.titleJa, en: seed.titleEn },
    lead: { ja: seed.leadJa, en: seed.leadEn },
    ...(seed.disclaimer ? { disclaimer: seed.disclaimer } : {}),
    questions: seed.questions,
    results: seed.results.map(result),
  };
}

/** 全12種。1〜3は設問数が多い詳細版、4〜12は3問の短縮版です。 */
export const diagnoses: Diagnosis[] = [...fullDiagnoses, ...shortDiagnosesSource.map(toDiagnosis)];

export function getDiagnosis(slug: string): Diagnosis | undefined {
  return diagnoses.find((diagnosis) => diagnosis.slug === slug);
}
