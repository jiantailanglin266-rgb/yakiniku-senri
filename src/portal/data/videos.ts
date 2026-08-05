/**
 * 動画。
 *
 * ⚠ `youtubeId` は空にしてあります。
 *   実在しない動画IDを埋めると、埋め込みが壊れるうえに
 *   「その動画が存在する」という誤った情報を出すことになります。
 *   管理画面（または本ファイル）でIDを設定すると埋め込みに切り替わり、
 *   未設定のあいだはプレースホルダとサムネイル枠を表示します。
 *
 * ■ このページの役割
 *   YouTube の概要欄から流入したユーザーを、関連する通貨・取引所・ツールへ
 *   最短で送り届けるためのランディングページです。
 *   動画を見なくても要点が読めるように、要約と目次を先に置いています。
 */

import type { Video } from "@/portal/lib/types";

function video(input: Omit<Video, "faq"> & Partial<Pick<Video, "faq">>): Video {
  return { faq: [], ...input };
}

export const videos: Video[] = [
  video({
    id: "v-001",
    slug: "bitcoin-beginner-guide",
    youtubeId: "",
    title: {
      ja: "ビットコイン入門｜最初の1枚を買うまでに知っておくこと",
      en: "Bitcoin for beginners: what to know before your first buy",
    },
    summary: {
      ja: "口座開設から購入までの流れと、買う前に必ず確認したい3点（登録業者か・販売所か板か・手数料）を解説します。",
      en: "The path from opening an account to your first purchase, and the three things to check first: registration, venue and fees.",
    },
    keyPoints: {
      ja: [
        "国内で始めるなら、金融庁の登録業者かを最初に確認する",
        "販売所はスプレッド、板取引は取引手数料がコストになる",
        "最初は失っても生活に影響しない金額から始める",
      ],
      en: [
        "In Japan, check FSA registration before anything else",
        "The brokerage costs you spread; the order book costs you a trading fee",
        "Start with an amount that would not affect your life if lost",
      ],
    },
    chapters: [
      { at: "00:00", label: { ja: "この動画で分かること", en: "What this covers" } },
      { at: "01:20", label: { ja: "取引所の選び方", en: "Choosing an exchange" } },
      { at: "04:05", label: { ja: "口座開設の手順", en: "Opening an account" } },
      { at: "07:40", label: { ja: "販売所と板取引の違い", en: "Brokerage vs order book" } },
      { at: "11:10", label: { ja: "買ったあとの保管", en: "Storing what you bought" } },
    ],
    transcript: {
      ja: [
        "この動画では、はじめてビットコインを買う方に向けて、口座開設から購入までの流れを説明します。",
        "まず確認したいのが、その取引所が金融庁に暗号資産交換業者として登録されているかどうかです。登録業者の一覧は金融庁のサイトで公開されています。",
        "次に、購入する場所です。販売所は運営会社が提示する価格で買う方式で、操作は簡単ですが売値と買値の差が実質的なコストになります。板取引は利用者同士で価格を出し合う方式で、指値が使えます。",
        "購入後の保管については、金額が小さいうちは取引所に置いたままでも運用できますが、増えてきたら自己管理のウォレットへ移すことも検討してください。",
      ],
      en: [
        "This video walks first-time buyers through opening an account and making a first purchase.",
        "Start by confirming the exchange is registered with Japan's FSA as a crypto-asset exchange provider. The register is published on the FSA site.",
        "Next, where you buy. The brokerage quotes you a price — simple, but the bid-ask gap is your real cost. The order book matches you against other users and supports limit orders.",
        "On storage: while amounts are small, leaving assets on the exchange is workable. As they grow, consider moving some to a wallet you control.",
      ],
    },
    shorts: false,
    durationSec: 842,
    publishedAt: "2026-07-18T09:00:00Z",
    channel: "CRYPTO PORT",
    relatedCoins: ["bitcoin"],
    relatedExchanges: ["bitbank", "bitflyer", "coincheck"],
    relatedTools: [],
    relatedLearn: ["what-is-bitcoin", "how-to-choose-exchange"],
    faq: [
      {
        q: { ja: "動画の内容は投資助言ですか？", en: "Is this investment advice?" },
        a: {
          ja: "いいえ。情報提供を目的とした解説であり、特定の銘柄の購入を推奨するものではありません。",
          en: "No. It is explanatory information and does not recommend buying any particular asset.",
        },
      },
    ],
  }),
  video({
    id: "v-002",
    slug: "wallet-setup-guide",
    youtubeId: "",
    title: {
      ja: "ウォレットの作り方と、絶対にやってはいけないこと",
      en: "Setting up a wallet — and what never to do",
    },
    summary: {
      ja: "ウォレットの作成手順と、シードフレーズの扱い方を解説します。被害の大半はここでの操作ミスから起きています。",
      en: "How to create a wallet and how to handle the seed phrase. Most losses start with a mistake at this step.",
    },
    keyPoints: {
      ja: [
        "シードフレーズは紙に書いてオフラインで保管する",
        "スクリーンショットとクラウド保存は避ける",
        "検索広告からインストールしない",
      ],
      en: [
        "Write the seed phrase on paper and keep it offline",
        "No screenshots, no cloud storage",
        "Never install from a search advert",
      ],
    },
    chapters: [
      { at: "00:00", label: { ja: "ウォレットとは何か", en: "What a wallet is" } },
      { at: "02:30", label: { ja: "インストールの注意点", en: "Installing safely" } },
      { at: "05:15", label: { ja: "シードフレーズの保管", en: "Storing the seed phrase" } },
      { at: "08:40", label: { ja: "承認の取り消し", en: "Revoking approvals" } },
    ],
    transcript: {
      ja: [
        "ウォレットは通貨を入れる財布ではなく、秘密鍵を管理する道具です。",
        "インストールは必ず公式サイトから行ってください。検索結果の広告枠に偽サイトが出ることがあります。",
        "作成時に表示されるシードフレーズは、紙に書いてオフラインで保管します。写真やクラウドに残すと、そこが侵害された時点で資産を失います。",
      ],
      en: [
        "A wallet is not a purse that holds coins — it manages your keys.",
        "Always install from the official site. Fake sites buy the advert slots above search results.",
        "Write down the seed phrase shown at setup and keep it offline. A photo or a cloud note means losing everything if that account is breached.",
      ],
    },
    shorts: false,
    durationSec: 655,
    publishedAt: "2026-07-22T09:00:00Z",
    channel: "CRYPTO PORT",
    relatedCoins: ["ethereum"],
    relatedExchanges: [],
    relatedTools: ["revoke-cash"],
    relatedLearn: ["what-is-wallet", "security-basics"],
  }),
  video({
    id: "v-003",
    slug: "chart-basics",
    youtubeId: "",
    title: {
      ja: "チャートの見方の基本｜ローソク足と出来高",
      en: "Chart basics: candles and volume",
    },
    summary: {
      ja: "ローソク足の読み方と、出来高を併せて見る理由を解説します。",
      en: "How to read candlesticks and why volume matters alongside them.",
    },
    keyPoints: {
      ja: [
        "ローソク足は始値・終値・高値・安値を1本で表す",
        "出来高を伴わない値動きは続きにくい",
        "チャートは将来を保証しない",
      ],
      en: [
        "A candle encodes open, close, high and low",
        "Moves without volume tend not to hold",
        "Charts do not predict the future",
      ],
    },
    chapters: [
      { at: "00:00", label: { ja: "ローソク足の構造", en: "Anatomy of a candle" } },
      { at: "03:10", label: { ja: "出来高の意味", en: "What volume means" } },
      { at: "06:00", label: { ja: "よくある誤解", en: "Common misreadings" } },
    ],
    transcript: {
      ja: [
        "ローソク足は、一定期間の始値・終値・高値・安値を1本にまとめた表示方法です。",
        "値動きだけを見ると判断を誤ります。出来高が伴っているかどうかを併せて確認してください。",
        "テクニカル分析は過去のパターンの整理であり、将来の価格を保証するものではありません。",
      ],
      en: [
        "A candlestick compresses the open, close, high and low of a period into one mark.",
        "Price alone misleads. Check whether volume supports the move.",
        "Technical analysis organises past patterns; it does not guarantee future prices.",
      ],
    },
    shorts: false,
    durationSec: 498,
    publishedAt: "2026-07-25T09:00:00Z",
    channel: "CRYPTO PORT",
    relatedCoins: ["bitcoin", "ethereum"],
    relatedExchanges: ["bitbank"],
    relatedTools: [],
    relatedLearn: [],
  }),
  video({
    id: "v-004",
    slug: "shorts-seed-phrase",
    youtubeId: "",
    title: {
      ja: "【30秒】シードフレーズを聞かれたら100%詐欺",
      en: "[30s] If someone asks for your seed phrase, it's a scam",
    },
    summary: {
      ja: "ショート動画から来た方向けの要点まとめです。",
      en: "A summary page for viewers arriving from the Short.",
    },
    keyPoints: {
      ja: [
        "公式サポートがシードフレーズを聞くことはない",
        "DMで届いた「サポート」は詐欺",
        "入力してしまったら即座に別ウォレットへ資産を移す",
      ],
      en: [
        "Real support never asks for a seed phrase",
        "A 'support' DM is a scam",
        "If you entered it, move your assets to a new wallet immediately",
      ],
    },
    chapters: [],
    transcript: {
      ja: [
        "シードフレーズを聞かれたら、相手が誰であっても詐欺です。",
        "入力してしまった場合は、すぐに新しいウォレットを作成して資産を移してください。",
      ],
      en: [
        "If anyone asks for your seed phrase, it is a scam regardless of who they claim to be.",
        "If you already entered it, create a new wallet and move your assets now.",
      ],
    },
    shorts: true,
    durationSec: 32,
    publishedAt: "2026-07-28T09:00:00Z",
    channel: "CRYPTO PORT",
    relatedCoins: [],
    relatedExchanges: [],
    relatedTools: ["revoke-cash"],
    relatedLearn: ["security-basics", "what-is-wallet"],
  }),
  video({
    id: "v-005",
    slug: "shorts-spread",
    youtubeId: "",
    title: {
      ja: "【30秒】販売所の「手数料無料」に隠れたコスト",
      en: "[30s] The hidden cost behind 'zero fee' brokerages",
    },
    summary: {
      ja: "ショート動画から来た方向けの要点まとめです。",
      en: "A summary page for viewers arriving from the Short.",
    },
    keyPoints: {
      ja: [
        "手数料無料でもスプレッドがコストになる",
        "同じ銘柄なら板取引のほうが安いことが多い",
        "買値と売値の差を必ず見る",
      ],
      en: [
        "Zero fee still costs you the spread",
        "For the same asset the order book is usually cheaper",
        "Always look at the gap between buy and sell prices",
      ],
    },
    chapters: [],
    transcript: {
      ja: [
        "販売所の「手数料無料」は、売値と買値の差にコストが含まれています。",
        "同じ銘柄を板取引で買えるなら、そちらのほうが安く済むことが多いです。",
      ],
      en: [
        "'Zero fee' on a brokerage means the cost sits in the gap between the buy and sell price.",
        "If the same asset trades on an order book, that route is usually cheaper.",
      ],
    },
    shorts: true,
    durationSec: 28,
    publishedAt: "2026-07-30T09:00:00Z",
    channel: "CRYPTO PORT",
    relatedCoins: ["bitcoin"],
    relatedExchanges: ["bitbank", "gmo-coin"],
    relatedTools: [],
    relatedLearn: ["how-to-choose-exchange"],
  }),
];

export const videoBySlug = new Map(videos.map((entry) => [entry.slug, entry]));

export function getVideo(slug: string): Video | undefined {
  return videoBySlug.get(slug);
}

export const longVideos = videos.filter((entry) => !entry.shorts);
export const shortVideos = videos.filter((entry) => entry.shorts);

export function videosForCoin(coinId: string, limit = 3): Video[] {
  return videos.filter((entry) => entry.relatedCoins.includes(coinId)).slice(0, limit);
}
