/**
 * 取引所データ。
 *
 * ⚠ 重要（事実性の扱い）
 *   手数料率・スプレッド・最低取引額・キャンペーン条件は頻繁に変わります。
 *   検証できていない数値をここに書くと、そのまま優良誤認になります。
 *   そのため、**数値は「公式サイトで要確認」を既定値**とし、
 *   管理画面（または本ファイル）で実測値に差し替える運用にしています。
 *   `DATASET_STATUS` が "sample" のあいだ、UI には注意バナーが出ます。
 *
 *   取扱いの有無（現物 / レバレッジ / ステーキング等）は各社が公開している
 *   サービス構成にもとづく定性情報で、変更されうるため `checkedAt` を併記します。
 *
 * ⚠ 評価（rating）について
 *   利用者のレビューではなく、編集部が基準を決めて付けた暫定スコアです。
 *   ユーザーレビューの実データが無いため、Review / AggregateRating の
 *   構造化データは出力しません（Googleのポリシー違反・優良誤認の回避）。
 */

import type { Exchange, LocalizedText } from "@/portal/lib/types";

/** "sample" のあいだ、比較表に「サンプルデータ」バナーを表示します */
export const DATASET_STATUS: "sample" | "verified" = "sample";

/** 未検証の数値に使う共通プレースホルダ */
const TBC: LocalizedText = {
  ja: "公式サイトで要確認",
  en: "Check official site",
};

const CHECKED = ""; // 実測値を入れた日付をここに設定します（空 = 未検証）

export const exchanges: Exchange[] = [
  {
    id: "bitbank",
    slug: "bitbank",
    name: "bitbank",
    region: "domestic",
    color: "#1f6feb",
    operator: { ja: "ビットバンク株式会社", en: "bitbank, inc." },
    summary: {
      ja: "板取引（取引所形式）の使いやすさと取扱銘柄の多さが特徴。国内でアルトコインを板で買いたい人に向きます。",
      en: "Known for a clean order-book interface and a broad list of altcoins — a good fit if you want to trade alts on an order book in Japan.",
    },
    rating: 4.4,
    ratingBreakdown: { fees: 4.6, assets: 4.5, security: 4.3, usability: 4.2 },
    listedAssets: 0,
    spot: "yes",
    margin: "no",
    futures: "no",
    copyTrading: "no",
    tradingFee: TBC,
    spread: TBC,
    depositFee: TBC,
    withdrawalFee: TBC,
    minOrder: TBC,
    savings: "yes",
    staking: "no",
    lending: "yes",
    app: "yes",
    japanese: "yes",
    kyc: { ja: "オンラインで完結（スマホ）", en: "Fully online (smartphone)" },
    security: {
      ja: ["顧客資産と自社資産の分別管理", "コールドウォレットでの保管", "二段階認証"],
      en: [
        "Customer assets segregated from company assets",
        "Cold storage",
        "Two-factor authentication",
      ],
    },
    beginnerFriendly: true,
    pros: {
      ja: ["板取引で指値・成行が使える", "アルトコインの取扱いが多い", "チャート画面が見やすい"],
      en: [
        "Limit and market orders on an order book",
        "A wide altcoin selection",
        "A readable charting screen",
      ],
    },
    cons: {
      ja: ["レバレッジ取引に対応していない", "ステーキングの提供がない"],
      en: ["No margin trading", "No staking service"],
    },
    howToOpen: {
      ja: [
        "公式サイトからメールアドレスを登録",
        "基本情報を入力",
        "本人確認書類をスマホで提出",
        "審査完了後に取引開始",
      ],
      en: [
        "Register your email on the official site",
        "Enter your personal details",
        "Submit ID from your phone",
        "Start trading once approved",
      ],
    },
    faq: [
      {
        q: {
          ja: "販売所と取引所（板）の違いは？",
          en: "What is the difference between the brokerage and the order book?",
        },
        a: {
          ja: "販売所は運営会社が提示する価格で売買する方式で、売値と買値の差（スプレッド）が実質的なコストになります。取引所（板取引）は利用者同士が価格を出し合う方式で、指値注文が使えます。一般に、同じ銘柄なら板取引のほうがコストを抑えやすいとされています。",
          en: "With the brokerage you trade at prices the operator quotes, and the gap between bid and ask (the spread) is your real cost. On the order book you trade with other users and can place limit orders. For the same asset, the order book is generally the cheaper route.",
        },
      },
    ],
    officialUrl: "https://bitbank.cc/",
    affiliateId: "aff-bitbank",
    checkedAt: CHECKED,
  },
  {
    id: "bitflyer",
    slug: "bitflyer",
    name: "bitFlyer",
    region: "domestic",
    color: "#d4a017",
    operator: { ja: "株式会社bitFlyer", en: "bitFlyer, Inc." },
    summary: {
      ja: "国内で長く運営されている大手。1円単位の少額購入や積立に対応し、はじめての1枚目に向きます。",
      en: "One of Japan's long-running majors. Very small purchases and recurring buys make it an easy first account.",
    },
    rating: 4.3,
    ratingBreakdown: { fees: 4.0, assets: 4.2, security: 4.6, usability: 4.5 },
    listedAssets: 0,
    spot: "yes",
    margin: "yes",
    futures: "no",
    copyTrading: "no",
    maxLeverage: "2倍",
    tradingFee: TBC,
    spread: TBC,
    depositFee: TBC,
    withdrawalFee: TBC,
    minOrder: TBC,
    savings: "yes",
    staking: "no",
    lending: "yes",
    app: "yes",
    japanese: "yes",
    kyc: { ja: "オンラインで完結（スマホ）", en: "Fully online (smartphone)" },
    security: {
      ja: ["分別管理", "コールドウォレット", "二段階認証", "長期の運用実績"],
      en: [
        "Segregated custody",
        "Cold storage",
        "Two-factor authentication",
        "A long operating history",
      ],
    },
    beginnerFriendly: true,
    pros: {
      ja: ["少額から購入できる", "アプリが分かりやすい", "積立に対応"],
      en: ["Buy in very small amounts", "A clear mobile app", "Recurring buys supported"],
    },
    cons: {
      ja: ["販売所のスプレッドは板取引より広くなりやすい", "取扱銘柄数は専業に比べ控えめ"],
      en: [
        "Brokerage spreads tend to be wider than the order book",
        "Fewer listed assets than specialists",
      ],
    },
    howToOpen: {
      ja: [
        "メールアドレスとパスワードを登録",
        "本人情報を入力",
        "本人確認書類を提出",
        "審査完了後に入金・取引",
      ],
      en: [
        "Register an email and password",
        "Enter your details",
        "Submit ID documents",
        "Deposit and trade once approved",
      ],
    },
    faq: [
      {
        q: { ja: "いくらから買えますか？", en: "What is the smallest purchase?" },
        a: {
          ja: "少額から購入できる設計ですが、最低金額は銘柄と取引形式によって異なります。最新の条件は公式サイトでご確認ください。",
          en: "Very small purchases are supported, but the minimum depends on the asset and the trading venue. Check the official site for current terms.",
        },
      },
    ],
    officialUrl: "https://bitflyer.com/ja-jp/",
    affiliateId: "aff-bitflyer",
    checkedAt: CHECKED,
  },
  {
    id: "coincheck",
    slug: "coincheck",
    name: "Coincheck",
    region: "domestic",
    color: "#1a8fdd",
    operator: { ja: "コインチェック株式会社", en: "Coincheck, Inc." },
    summary: {
      ja: "アプリの分かりやすさで知られる取引所。NFTマーケットや積立など周辺サービスも揃います。",
      en: "Best known for an approachable app, with an NFT marketplace and recurring buys alongside trading.",
    },
    rating: 4.2,
    ratingBreakdown: { fees: 3.9, assets: 4.4, security: 4.2, usability: 4.7 },
    listedAssets: 0,
    spot: "yes",
    margin: "no",
    futures: "no",
    copyTrading: "no",
    tradingFee: TBC,
    spread: TBC,
    depositFee: TBC,
    withdrawalFee: TBC,
    minOrder: TBC,
    savings: "yes",
    staking: "partial",
    lending: "yes",
    app: "yes",
    japanese: "yes",
    kyc: { ja: "オンラインで完結（スマホ）", en: "Fully online (smartphone)" },
    security: {
      ja: ["分別管理", "コールドウォレット", "二段階認証"],
      en: ["Segregated custody", "Cold storage", "Two-factor authentication"],
    },
    beginnerFriendly: true,
    pros: {
      ja: ["アプリの操作が分かりやすい", "取扱銘柄が多い", "NFTマーケットを併設"],
      en: ["An easy-to-use app", "Many listed assets", "Includes an NFT marketplace"],
    },
    cons: {
      ja: ["板取引の対象銘柄が限られる", "販売所中心だとコストが見えにくい"],
      en: [
        "Order-book trading covers a limited set of assets",
        "Brokerage-first flows hide the real cost",
      ],
    },
    howToOpen: {
      ja: [
        "アプリをインストール",
        "メールアドレスを登録",
        "本人確認を実施",
        "審査完了後に入金・取引",
      ],
      en: [
        "Install the app",
        "Register your email",
        "Complete identity verification",
        "Deposit and trade once approved",
      ],
    },
    faq: [],
    officialUrl: "https://coincheck.com/ja/",
    affiliateId: "aff-coincheck",
    checkedAt: CHECKED,
  },
  {
    id: "gmo-coin",
    slug: "gmo-coin",
    name: "GMOコイン",
    region: "domestic",
    color: "#0b8457",
    operator: { ja: "GMOコイン株式会社", en: "GMO Coin, Inc." },
    summary: {
      ja: "現物・レバレッジ・ステーキング・貸暗号資産まで、ひととおりの機能が1社で揃います。",
      en: "Spot, margin, staking and lending in a single account — a broad feature set for one operator.",
    },
    rating: 4.5,
    ratingBreakdown: { fees: 4.5, assets: 4.5, security: 4.4, usability: 4.3 },
    listedAssets: 0,
    spot: "yes",
    margin: "yes",
    futures: "no",
    copyTrading: "no",
    maxLeverage: "2倍",
    tradingFee: TBC,
    spread: TBC,
    depositFee: TBC,
    withdrawalFee: TBC,
    minOrder: TBC,
    savings: "yes",
    staking: "yes",
    lending: "yes",
    app: "yes",
    japanese: "yes",
    kyc: { ja: "オンラインで完結（スマホ）", en: "Fully online (smartphone)" },
    security: {
      ja: ["分別管理", "コールドウォレット", "二段階認証", "GMOインターネットグループの運営"],
      en: [
        "Segregated custody",
        "Cold storage",
        "Two-factor authentication",
        "Operated within the GMO Internet Group",
      ],
    },
    beginnerFriendly: true,
    pros: {
      ja: ["機能が幅広く、1社で完結しやすい", "ステーキングに対応", "積立にも対応"],
      en: ["A wide feature set in one place", "Staking supported", "Recurring buys supported"],
    },
    cons: {
      ja: ["機能が多く、初回は画面に迷いやすい"],
      en: ["The breadth of features can be confusing at first"],
    },
    howToOpen: {
      ja: ["公式サイトから申込", "本人情報を入力", "本人確認を実施", "審査完了後に取引開始"],
      en: [
        "Apply on the official site",
        "Enter your details",
        "Complete identity verification",
        "Start trading once approved",
      ],
    },
    faq: [],
    officialUrl: "https://coin.z.com/jp/",
    affiliateId: "aff-gmo-coin",
    checkedAt: CHECKED,
  },
  {
    id: "sbi-vc",
    slug: "sbi-vc-trade",
    name: "SBI VCトレード",
    region: "domestic",
    color: "#2f6db5",
    operator: { ja: "SBI VCトレード株式会社", en: "SBI VC Trade Co., Ltd." },
    summary: {
      ja: "SBIグループの暗号資産交換業者。既存の金融口座と合わせて管理したい人に向きます。",
      en: "The SBI group's crypto exchange arm — convenient if you already bank within the group.",
    },
    rating: 4.1,
    ratingBreakdown: { fees: 4.3, assets: 3.9, security: 4.4, usability: 4.0 },
    listedAssets: 0,
    spot: "yes",
    margin: "yes",
    futures: "no",
    copyTrading: "no",
    tradingFee: TBC,
    spread: TBC,
    depositFee: TBC,
    withdrawalFee: TBC,
    minOrder: TBC,
    savings: "yes",
    staking: "yes",
    lending: "yes",
    app: "yes",
    japanese: "yes",
    kyc: { ja: "オンラインで完結", en: "Fully online" },
    security: {
      ja: ["分別管理", "コールドウォレット", "二段階認証"],
      en: ["Segregated custody", "Cold storage", "Two-factor authentication"],
    },
    beginnerFriendly: true,
    pros: {
      ja: ["金融グループの運営", "ステーキング・積立に対応"],
      en: ["Operated by a financial group", "Staking and recurring buys supported"],
    },
    cons: {
      ja: ["取扱銘柄数は専業と比べて控えめ"],
      en: ["Fewer listed assets than specialist exchanges"],
    },
    howToOpen: {
      ja: ["公式サイトから申込", "本人情報を入力", "本人確認を実施", "審査完了後に取引開始"],
      en: [
        "Apply on the official site",
        "Enter your details",
        "Complete identity verification",
        "Start trading once approved",
      ],
    },
    faq: [],
    officialUrl: "https://www.sbivc.co.jp/",
    affiliateId: "aff-sbi-vc",
    checkedAt: CHECKED,
  },
  {
    id: "binance",
    slug: "binance",
    name: "Binance",
    region: "overseas",
    color: "#f3ba2f",
    operator: { ja: "Binance Holdings Ltd.", en: "Binance Holdings Ltd." },
    summary: {
      ja: "世界最大級の取引量を持つ取引所。取扱銘柄・機能ともに非常に多いが、日本居住者の利用には制約があります。",
      en: "One of the largest exchanges by volume, with a very wide asset and product range — but with constraints for residents of Japan.",
    },
    rating: 4.4,
    ratingBreakdown: { fees: 4.7, assets: 4.9, security: 4.0, usability: 4.1 },
    listedAssets: 0,
    spot: "yes",
    margin: "yes",
    futures: "yes",
    copyTrading: "yes",
    tradingFee: TBC,
    spread: TBC,
    depositFee: TBC,
    withdrawalFee: TBC,
    minOrder: TBC,
    savings: "yes",
    staking: "yes",
    lending: "yes",
    app: "yes",
    japanese: "partial",
    kyc: {
      ja: "オンラインで完結（居住国により手続きが異なる）",
      en: "Fully online (varies by country of residence)",
    },
    security: {
      ja: ["二段階認証", "出金アドレスのホワイトリスト", "利用者保護基金の設置を公表"],
      en: [
        "Two-factor authentication",
        "Withdrawal address whitelists",
        "A publicly disclosed user protection fund",
      ],
    },
    beginnerFriendly: false,
    pros: {
      ja: ["取扱銘柄が非常に多い", "現物・先物・ステーキングなど機能が豊富", "流動性が高い"],
      en: ["A very wide asset selection", "Spot, futures, staking and more", "Deep liquidity"],
    },
    cons: {
      ja: [
        "日本居住者向けのサービス提供には制限がある",
        "日本語サポートや税務書類が十分でない場合がある",
        "機能が多く初心者には複雑",
      ],
      en: [
        "Service to residents of Japan is restricted",
        "Japanese support and tax documents may be limited",
        "Complex for newcomers",
      ],
    },
    howToOpen: {
      ja: ["居住国の規制を確認", "公式サイトで登録", "本人確認を実施", "入金して取引"],
      en: [
        "Check the rules in your country of residence",
        "Register on the official site",
        "Complete KYC",
        "Deposit and trade",
      ],
    },
    faq: [],
    officialUrl: "https://www.binance.com/",
    checkedAt: CHECKED,
  },
  {
    id: "bybit",
    slug: "bybit",
    name: "Bybit",
    region: "overseas",
    color: "#f7a600",
    operator: { ja: "Bybit", en: "Bybit" },
    summary: {
      ja: "デリバティブとコピートレードで知られる取引所。日本居住者の利用には制約があります。",
      en: "Known for derivatives and copy trading. Constraints apply for residents of Japan.",
    },
    rating: 4.1,
    ratingBreakdown: { fees: 4.4, assets: 4.5, security: 3.9, usability: 4.2 },
    listedAssets: 0,
    spot: "yes",
    margin: "yes",
    futures: "yes",
    copyTrading: "yes",
    tradingFee: TBC,
    spread: TBC,
    depositFee: TBC,
    withdrawalFee: TBC,
    minOrder: TBC,
    savings: "yes",
    staking: "yes",
    lending: "yes",
    app: "yes",
    japanese: "partial",
    kyc: {
      ja: "オンラインで完結（居住国により手続きが異なる）",
      en: "Fully online (varies by country of residence)",
    },
    security: {
      ja: [
        "二段階認証",
        "コールドウォレットでの保管を公表",
        "準備金の証明（Proof of Reserves）を公開",
      ],
      en: [
        "Two-factor authentication",
        "Publicly stated cold storage practice",
        "Publishes proof of reserves",
      ],
    },
    beginnerFriendly: false,
    pros: {
      ja: ["コピートレードに対応", "デリバティブの流動性が高い", "UIの評価が高い"],
      en: ["Copy trading available", "Deep derivatives liquidity", "A well-regarded interface"],
    },
    cons: {
      ja: ["日本居住者向けの提供に制限がある", "高レバレッジは損失も大きくなる"],
      en: ["Restricted for residents of Japan", "High leverage magnifies losses as well as gains"],
    },
    howToOpen: {
      ja: ["居住国の規制を確認", "公式サイトで登録", "本人確認を実施", "入金して取引"],
      en: [
        "Check the rules in your country of residence",
        "Register on the official site",
        "Complete KYC",
        "Deposit and trade",
      ],
    },
    faq: [],
    officialUrl: "https://www.bybit.com/",
    checkedAt: CHECKED,
  },
  {
    id: "okx",
    slug: "okx",
    name: "OKX",
    region: "overseas",
    color: "#1f1f1f",
    operator: { ja: "OKX", en: "OKX" },
    summary: {
      ja: "取引所とWeb3ウォレットを統合した構成が特徴。日本居住者の利用には制約があります。",
      en: "Combines an exchange with a Web3 wallet in one product. Constraints apply for residents of Japan.",
    },
    rating: 4.0,
    ratingBreakdown: { fees: 4.3, assets: 4.6, security: 3.8, usability: 4.0 },
    listedAssets: 0,
    spot: "yes",
    margin: "yes",
    futures: "yes",
    copyTrading: "yes",
    tradingFee: TBC,
    spread: TBC,
    depositFee: TBC,
    withdrawalFee: TBC,
    minOrder: TBC,
    savings: "yes",
    staking: "yes",
    lending: "partial",
    app: "yes",
    japanese: "partial",
    kyc: {
      ja: "オンラインで完結（居住国により手続きが異なる）",
      en: "Fully online (varies by country of residence)",
    },
    security: {
      ja: ["二段階認証", "準備金の証明（Proof of Reserves）を公開"],
      en: ["Two-factor authentication", "Publishes proof of reserves"],
    },
    beginnerFriendly: false,
    pros: {
      ja: ["取引所とWeb3ウォレットが一体", "DEXアグリゲータを内蔵"],
      en: ["Exchange and Web3 wallet in one app", "Built-in DEX aggregator"],
    },
    cons: {
      ja: ["日本居住者向けの提供に制限がある", "機能が多く初心者には複雑"],
      en: ["Restricted for residents of Japan", "Complex for newcomers"],
    },
    howToOpen: {
      ja: ["居住国の規制を確認", "公式サイトで登録", "本人確認を実施", "入金して取引"],
      en: [
        "Check the rules in your country of residence",
        "Register on the official site",
        "Complete KYC",
        "Deposit and trade",
      ],
    },
    faq: [],
    officialUrl: "https://www.okx.com/",
    checkedAt: CHECKED,
  },
];

export const exchangeById = new Map(exchanges.map((exchange) => [exchange.id, exchange]));
export const exchangeBySlug = new Map(exchanges.map((exchange) => [exchange.slug, exchange]));

export function getExchange(idOrSlug: string): Exchange | undefined {
  return exchangeById.get(idOrSlug) ?? exchangeBySlug.get(idOrSlug);
}

export const domesticExchanges = exchanges.filter((exchange) => exchange.region === "domestic");
export const overseasExchanges = exchanges.filter((exchange) => exchange.region === "overseas");
