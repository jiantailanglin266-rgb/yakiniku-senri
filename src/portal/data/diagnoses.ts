/**
 * 診断ツール。
 *
 * ■ 採点の考え方
 *   各選択肢が結果プロフィールへ加点し、合計が最大のプロフィールを結果とします。
 *   （lib/diagnosis.ts の `scoreDiagnosis`）
 *
 * ⚠ 結果は投資助言ではありません。
 *   「あなたはこれを買うべき」という表現は使わず、
 *   「こういう条件なら、こういう選択肢が候補になる」という形に統一しています。
 */

import type { Diagnosis } from "@/portal/lib/types";

export const diagnoses: Diagnosis[] = [
  {
    id: "exchange",
    slug: "exchange",
    title: { ja: "あなたに合う仮想通貨取引所診断", en: "Which exchange fits you?" },
    lead: {
      ja: "8つの質問に答えると、条件に近い取引所の候補と、その理由を表示します。",
      en: "Answer eight questions to see which exchanges match your conditions, and why.",
    },
    questions: [
      {
        id: "experience",
        label: { ja: "仮想通貨の取引経験は？", en: "How much trading experience do you have?" },
        options: [
          {
            id: "none",
            label: { ja: "はじめて", en: "None yet" },
            scores: { beginner: 3, allrounder: 1 },
          },
          {
            id: "some",
            label: { ja: "少しある", en: "A little" },
            scores: { allrounder: 3, beginner: 1 },
          },
          {
            id: "lots",
            label: { ja: "慣れている", en: "Experienced" },
            scores: { trader: 3, allrounder: 1 },
          },
        ],
      },
      {
        id: "assets",
        label: { ja: "買いたい通貨は決まっていますか？", en: "Do you know what you want to buy?" },
        options: [
          {
            id: "major",
            label: { ja: "BTC・ETH など主要通貨", en: "Majors like BTC and ETH" },
            scores: { beginner: 3, allrounder: 1 },
          },
          {
            id: "alt",
            label: { ja: "アルトコインも買いたい", en: "Altcoins as well" },
            scores: { trader: 3, allrounder: 2 },
          },
          {
            id: "undecided",
            label: { ja: "まだ決めていない", en: "Not decided" },
            scores: { beginner: 2, allrounder: 2 },
          },
        ],
      },
      {
        id: "budget",
        label: { ja: "はじめに使う予定の金額は？", en: "How much do you plan to start with?" },
        options: [
          {
            id: "small",
            label: { ja: "数千円まで", en: "Under a few thousand yen" },
            scores: { beginner: 3 },
          },
          {
            id: "medium",
            label: { ja: "数万円", en: "Tens of thousands of yen" },
            scores: { allrounder: 2, beginner: 1 },
          },
          {
            id: "large",
            label: { ja: "十万円以上", en: "Over a hundred thousand yen" },
            scores: { trader: 2, allrounder: 2 },
          },
        ],
      },
      {
        id: "savings",
        label: { ja: "毎月の積立をしたいですか？", en: "Do you want recurring monthly buys?" },
        options: [
          { id: "yes", label: { ja: "したい", en: "Yes" }, scores: { beginner: 2, allrounder: 2 } },
          {
            id: "no",
            label: { ja: "自分のタイミングで買いたい", en: "I'll buy on my own timing" },
            scores: { trader: 2 },
          },
        ],
      },
      {
        id: "leverage",
        label: {
          ja: "レバレッジ取引に興味はありますか？",
          en: "Are you interested in margin trading?",
        },
        options: [
          { id: "no", label: { ja: "使わない", en: "No" }, scores: { beginner: 3, allrounder: 1 } },
          {
            id: "maybe",
            label: { ja: "将来的には検討したい", en: "Maybe later" },
            scores: { allrounder: 2 },
          },
          { id: "yes", label: { ja: "使いたい", en: "Yes" }, scores: { trader: 3 } },
        ],
      },
      {
        id: "cost",
        label: {
          ja: "手数料の安さはどのくらい重要ですか？",
          en: "How much do fees matter to you?",
        },
        options: [
          {
            id: "high",
            label: { ja: "最優先", en: "Top priority" },
            scores: { trader: 3, allrounder: 1 },
          },
          { id: "medium", label: { ja: "気にはなる", en: "Somewhat" }, scores: { allrounder: 2 } },
          {
            id: "low",
            label: { ja: "分かりやすさのほうが大事", en: "Ease of use matters more" },
            scores: { beginner: 3 },
          },
        ],
      },
      {
        id: "device",
        label: { ja: "主に使う端末は？", en: "Which device will you mostly use?" },
        options: [
          {
            id: "mobile",
            label: { ja: "スマートフォン", en: "Smartphone" },
            scores: { beginner: 2, allrounder: 1 },
          },
          {
            id: "pc",
            label: { ja: "パソコン", en: "Computer" },
            scores: { trader: 2, allrounder: 1 },
          },
        ],
      },
      {
        id: "extras",
        label: {
          ja: "ステーキングや貸暗号資産に興味はありますか？",
          en: "Interested in staking or lending?",
        },
        options: [
          { id: "yes", label: { ja: "ある", en: "Yes" }, scores: { allrounder: 3 } },
          {
            id: "no",
            label: { ja: "まずは売買だけでよい", en: "Just buying and selling for now" },
            scores: { beginner: 2, trader: 1 },
          },
        ],
      },
    ],
    results: [
      {
        id: "beginner",
        title: { ja: "分かりやすさ重視タイプ", en: "Clarity-first" },
        description: {
          ja: "はじめの1枚を、迷わず買えることを優先する条件です。アプリの操作が分かりやすく、少額から購入できる取引所が候補になります。",
          en: "Your priority is getting the first purchase done without confusion. Exchanges with a clear app and very small minimums fit best.",
        },
        reasons: {
          ja: ["少額から購入できる", "アプリの操作が分かりやすい", "積立に対応している"],
          en: ["Very small purchases supported", "A clear mobile app", "Recurring buys available"],
        },
        cautions: {
          ja: [
            "販売所での購入はスプレッドがコストになります。慣れてきたら板取引も試してください。",
          ],
          en: [
            "Buying on the brokerage costs you spread — try the order book once you are comfortable.",
          ],
        },
        exchangeIds: ["bitflyer", "coincheck"],
        learnIds: ["what-is-crypto", "how-to-choose-exchange"],
      },
      {
        id: "allrounder",
        title: { ja: "機能バランス重視タイプ", en: "Balanced feature set" },
        description: {
          ja: "売買だけでなく、積立・ステーキング・貸暗号資産まで1社で完結させたい条件です。機能が幅広い取引所が候補になります。",
          en: "You want buying, recurring purchases, staking and lending in one account. Broad-feature exchanges fit best.",
        },
        reasons: {
          ja: [
            "現物・積立・ステーキングを1社で使える",
            "取扱銘柄が比較的多い",
            "アプリと取引ツールの両方がある",
          ],
          en: [
            "Spot, recurring buys and staking in one place",
            "A comparatively broad asset list",
            "Both an app and a full trading interface",
          ],
        },
        cautions: {
          ja: ["機能が多いぶん、最初は画面に迷いやすい点に注意してください。"],
          en: ["The breadth of features can be confusing at first."],
        },
        exchangeIds: ["gmo-coin", "sbi-vc"],
        learnIds: ["what-is-staking", "how-to-choose-exchange"],
      },
      {
        id: "trader",
        title: { ja: "コスト・銘柄数重視タイプ", en: "Cost and selection first" },
        description: {
          ja: "板取引でコストを抑えつつ、アルトコインも扱いたい条件です。取引所形式での売買に強い事業者が候補になります。",
          en: "You want to keep costs down on an order book while still reaching altcoins. Order-book-first exchanges fit best.",
        },
        reasons: {
          ja: [
            "板取引で指値・成行が使える",
            "アルトコインの取扱いが多い",
            "チャート画面が扱いやすい",
          ],
          en: [
            "Limit and market orders on an order book",
            "A wide altcoin selection",
            "A workable charting interface",
          ],
        },
        cautions: {
          ja: [
            "海外取引所を検討する場合は、日本居住者への提供制限と、トラブル時に日本の法律で保護されない可能性を必ず確認してください。",
            "レバレッジ取引は、預けた資金を超える損失が生じることがあります。",
          ],
          en: [
            "If you are considering a global exchange, check the restrictions for residents of Japan and the possibility that Japanese law will not protect you.",
            "Margin trading can lose more than you deposited.",
          ],
        },
        exchangeIds: ["bitbank", "gmo-coin"],
        learnIds: ["how-to-choose-exchange"],
      },
    ],
  },
  {
    id: "coin",
    slug: "coin",
    title: { ja: "あなたに合う仮想通貨診断", en: "Which crypto assets suit you?" },
    lead: {
      ja: "関心のある分野から、学習の出発点になる通貨のタイプを表示します。購入を推奨するものではありません。",
      en: "Based on what interests you, this suggests a type of asset to start learning about. It is not a recommendation to buy.",
    },
    questions: [
      {
        id: "purpose",
        label: { ja: "いちばんの目的は？", en: "What is your main purpose?" },
        options: [
          {
            id: "learn",
            label: { ja: "仕組みを理解したい", en: "Understanding how it works" },
            scores: { foundation: 3 },
          },
          {
            id: "hold",
            label: { ja: "長く持ちたい", en: "Holding for a long time" },
            scores: { foundation: 2, infra: 1 },
          },
          {
            id: "use",
            label: { ja: "実際にアプリを使ってみたい", en: "Actually using on-chain apps" },
            scores: { app: 3 },
          },
        ],
      },
      {
        id: "horizon",
        label: {
          ja: "どのくらいの期間で考えていますか？",
          en: "What time horizon are you thinking about?",
        },
        options: [
          { id: "long", label: { ja: "数年単位", en: "Years" }, scores: { foundation: 3 } },
          {
            id: "mid",
            label: { ja: "1年前後", en: "About a year" },
            scores: { infra: 2, foundation: 1 },
          },
          { id: "short", label: { ja: "短期", en: "Short term" }, scores: { app: 2 } },
        ],
      },
      {
        id: "risk",
        label: {
          ja: "価格が半分になったらどうしますか？",
          en: "What would you do if the price halved?",
        },
        options: [
          { id: "hold", label: { ja: "そのまま持つ", en: "Hold" }, scores: { foundation: 3 } },
          {
            id: "review",
            label: { ja: "理由を調べて判断する", en: "Investigate, then decide" },
            scores: { infra: 2, foundation: 1 },
          },
          {
            id: "sell",
            label: { ja: "耐えられない", en: "I couldn't take it" },
            scores: { foundation: 2 },
          },
        ],
      },
      {
        id: "interest",
        label: { ja: "興味のある分野は？", en: "Which area interests you?" },
        options: [
          {
            id: "money",
            label: { ja: "デジタルな価値の保存", en: "Digital store of value" },
            scores: { foundation: 3 },
          },
          {
            id: "infra",
            label: { ja: "ブロックチェーンの基盤技術", en: "Base-layer infrastructure" },
            scores: { infra: 3 },
          },
          {
            id: "apps",
            label: { ja: "NFT・ゲーム・DeFi", en: "NFTs, games and DeFi" },
            scores: { app: 3 },
          },
        ],
      },
      {
        id: "size",
        label: {
          ja: "時価総額の大きさは重視しますか？",
          en: "Does market cap size matter to you?",
        },
        options: [
          {
            id: "yes",
            label: { ja: "大きいほうが安心", en: "Bigger feels safer" },
            scores: { foundation: 3, infra: 1 },
          },
          { id: "no", label: { ja: "気にしない", en: "Not really" }, scores: { app: 2, infra: 1 } },
        ],
      },
      {
        id: "staking",
        label: {
          ja: "ステーキング報酬に興味はありますか？",
          en: "Are staking rewards interesting to you?",
        },
        options: [
          { id: "yes", label: { ja: "ある", en: "Yes" }, scores: { infra: 3 } },
          {
            id: "no",
            label: { ja: "特にない", en: "Not particularly" },
            scores: { foundation: 2 },
          },
        ],
      },
    ],
    results: [
      {
        id: "foundation",
        title: { ja: "基礎から理解したいタイプ", en: "Start from the foundations" },
        description: {
          ja: "まずは仕組みが最も広く解説されている通貨から学ぶのが近道です。情報量が多く、疑問を調べやすいという利点があります。",
          en: "The fastest route is to start with the assets that have the most written about them — questions are easy to research.",
        },
        reasons: {
          ja: [
            "解説記事・書籍・動画が最も多い",
            "国内取引所での取扱いが広い",
            "仕組みの議論が長年蓄積されている",
          ],
          en: [
            "The largest body of explanatory material",
            "Widely listed on Japanese exchanges",
            "Years of accumulated debate about how they work",
          ],
        },
        cautions: {
          ja: ["情報量が多いことと、価格が上がることは無関係です。"],
          en: ["Plenty of coverage says nothing about future price."],
        },
        coinIds: ["bitcoin", "ethereum"],
        learnIds: ["what-is-bitcoin", "what-is-ethereum"],
      },
      {
        id: "infra",
        title: { ja: "基盤技術に関心があるタイプ", en: "Interested in the infrastructure" },
        description: {
          ja: "合意形成やスケーリングの設計に関心が向いている条件です。設計思想の異なるチェーンを比較すると理解が進みます。",
          en: "You are drawn to consensus and scaling design. Comparing chains with different philosophies is the productive path.",
        },
        reasons: {
          ja: [
            "設計方針の違いを比較しやすい",
            "ステーキングの仕組みを実際に確認できる",
            "技術文書が公開されている",
          ],
          en: [
            "Easy to compare design choices side by side",
            "You can observe staking mechanics directly",
            "Technical documentation is public",
          ],
        },
        cautions: {
          ja: ["技術的な優位が市場での評価につながるとは限りません。"],
          en: ["Technical merit does not reliably translate into market value."],
        },
        coinIds: ["ethereum", "cardano", "polkadot", "avalanche-2"],
        learnIds: ["what-is-staking", "what-is-blockchain"],
      },
      {
        id: "app",
        title: { ja: "アプリを触ってみたいタイプ", en: "Want to use the apps" },
        description: {
          ja: "実際にNFTやDeFiを触ってみたい条件です。手数料が低いチェーンから始めると、失敗のコストを抑えられます。",
          en: "You want hands-on experience with NFTs and DeFi. Starting on a low-fee chain keeps the cost of mistakes small.",
        },
        reasons: {
          ja: ["手数料が低く、少額で試せる", "アプリの数が多い", "ウォレットの対応が進んでいる"],
          en: [
            "Low fees let you experiment cheaply",
            "Plenty of applications to try",
            "Good wallet support",
          ],
        },
        cautions: {
          ja: [
            "新しい銘柄には詐欺的なトークンも混在します。必ずコントラクトアドレスを確認してください。",
          ],
          en: ["New listings include outright scams — always verify the contract address."],
        },
        coinIds: ["solana", "ethereum", "sui"],
        learnIds: ["what-is-nft", "what-is-defi", "security-basics"],
      },
    ],
  },
  {
    id: "tool",
    slug: "tool",
    title: { ja: "Web3.0ツール診断", en: "Which Web3 tool do you need?" },
    lead: {
      ja: "やりたいことから、使うべきツールのカテゴリを絞り込みます。",
      en: "Narrow down the right category of tool from what you are trying to do.",
    },
    questions: [
      {
        id: "goal",
        label: { ja: "いま解決したいことは？", en: "What are you trying to solve?" },
        options: [
          {
            id: "track",
            label: { ja: "資産の残高を把握したい", en: "See all my balances" },
            scores: { portfolio: 3 },
          },
          {
            id: "swap",
            label: { ja: "通貨を交換したい", en: "Swap between assets" },
            scores: { dex: 3 },
          },
          {
            id: "tax",
            label: { ja: "確定申告の準備をしたい", en: "Prepare for tax filing" },
            scores: { tax: 3 },
          },
          {
            id: "safety",
            label: { ja: "セキュリティを点検したい", en: "Audit my security" },
            scores: { security: 3 },
          },
        ],
      },
      {
        id: "chain",
        label: { ja: "主に使っているチェーンは？", en: "Which chain do you mostly use?" },
        options: [
          {
            id: "evm",
            label: { ja: "Ethereum 系", en: "Ethereum and EVM chains" },
            scores: { portfolio: 1, dex: 1, security: 1 },
          },
          { id: "solana", label: { ja: "Solana", en: "Solana" }, scores: { dex: 2 } },
          { id: "multi", label: { ja: "複数", en: "Several" }, scores: { portfolio: 2 } },
        ],
      },
      {
        id: "budget",
        label: { ja: "有料ツールも検討しますか？", en: "Would you pay for a tool?" },
        options: [
          {
            id: "free",
            label: { ja: "無料のものだけ", en: "Free only" },
            scores: { portfolio: 1, security: 1, dex: 1 },
          },
          {
            id: "paid",
            label: { ja: "必要なら払う", en: "Yes if it's worth it" },
            scores: { tax: 2 },
          },
        ],
      },
    ],
    results: [
      {
        id: "portfolio",
        title: { ja: "ポートフォリオ管理ツール", en: "Portfolio trackers" },
        description: {
          ja: "複数チェーンの残高とDeFiの持ち高をまとめて見るツールが向いています。",
          en: "Tools that consolidate balances and DeFi positions across chains.",
        },
        reasons: {
          ja: ["アドレス入力だけで確認できる", "秘密鍵を渡す必要がない"],
          en: ["Works from an address alone", "No keys involved"],
        },
        cautions: {
          ja: ["アドレスを共有すると取引履歴が誰にでも見られます。"],
          en: ["Sharing an address exposes your full history."],
        },
        toolIds: ["debank", "zapper"],
      },
      {
        id: "dex",
        title: { ja: "分散型取引所（DEX）", en: "Decentralised exchanges" },
        description: {
          ja: "ウォレット接続だけで通貨を交換できるツールが向いています。",
          en: "Tools that swap assets straight from a connected wallet.",
        },
        reasons: {
          ja: ["口座開設が不要", "取扱トークンが多い"],
          en: ["No account needed", "A very wide token list"],
        },
        cautions: {
          ja: ["詐欺トークンが混在します。コントラクトアドレスを必ず確認してください。"],
          en: ["Scam tokens sit alongside real ones — verify the contract address."],
        },
        toolIds: ["uniswap", "jupiter"],
      },
      {
        id: "tax",
        title: { ja: "損益計算ツール", en: "Tax calculation tools" },
        description: {
          ja: "取引履歴を取り込んで損益を自動計算するツールが向いています。",
          en: "Tools that import trade history and calculate gains automatically.",
        },
        reasons: {
          ja: ["複数取引所の履歴を合算できる", "手計算より圧倒的に速い"],
          en: ["Aggregates history from many exchanges", "Far faster than doing it by hand"],
        },
        cautions: {
          ja: ["最終的な申告内容は税理士にご確認ください。"],
          en: ["Have a tax professional confirm the final filing."],
        },
        toolIds: ["cryptact", "koinly"],
      },
      {
        id: "security",
        title: { ja: "セキュリティ点検ツール", en: "Security tools" },
        description: {
          ja: "過去に与えた承認を棚卸しするツールが向いています。",
          en: "Tools that let you audit and revoke past approvals.",
        },
        reasons: {
          ja: ["承認を一覧で確認できる", "確認だけならウォレット接続も不要"],
          en: ["See every approval in one list", "No connection needed just to check"],
        },
        cautions: {
          ja: ["必ず公式ドメインであることを確認してください。"],
          en: ["Always confirm you are on the official domain."],
        },
        toolIds: ["revoke-cash"],
      },
    ],
  },
  {
    id: "level",
    slug: "level",
    title: { ja: "仮想通貨初心者レベル診断", en: "How much do you already know?" },
    lead: {
      ja: "いまの理解度に合わせて、次に読むべき記事を表示します。",
      en: "Find out which articles to read next based on what you already understand.",
    },
    questions: [
      {
        id: "q1",
        label: {
          ja: "「ウォレット」が何を管理しているか説明できますか？",
          en: "Could you explain what a wallet actually manages?",
        },
        options: [
          { id: "no", label: { ja: "説明できない", en: "No" }, scores: { l1: 3 } },
          { id: "maybe", label: { ja: "なんとなく", en: "Roughly" }, scores: { l2: 2 } },
          { id: "yes", label: { ja: "説明できる", en: "Yes" }, scores: { l3: 2 } },
        ],
      },
      {
        id: "q2",
        label: {
          ja: "販売所と板取引の違いが分かりますか？",
          en: "Do you know the difference between a brokerage and an order book?",
        },
        options: [
          { id: "no", label: { ja: "分からない", en: "No" }, scores: { l1: 3 } },
          { id: "yes", label: { ja: "分かる", en: "Yes" }, scores: { l2: 2, l3: 1 } },
        ],
      },
      {
        id: "q3",
        label: {
          ja: "ガス代がどう決まるか知っていますか？",
          en: "Do you know how gas fees are determined?",
        },
        options: [
          { id: "no", label: { ja: "知らない", en: "No" }, scores: { l1: 2, l2: 1 } },
          { id: "yes", label: { ja: "知っている", en: "Yes" }, scores: { l3: 3 } },
        ],
      },
      {
        id: "q4",
        label: {
          ja: "トークンの承認（approve）を取り消したことはありますか？",
          en: "Have you ever revoked a token approval?",
        },
        options: [
          { id: "no", label: { ja: "ない", en: "No" }, scores: { l1: 1, l2: 2 } },
          { id: "yes", label: { ja: "ある", en: "Yes" }, scores: { l3: 3 } },
        ],
      },
    ],
    results: [
      {
        id: "l1",
        title: { ja: "これから始める段階", en: "Just getting started" },
        description: {
          ja: "まずは全体像をつかむところからはじめましょう。",
          en: "Start by getting the overall picture.",
        },
        reasons: {
          ja: ["用語の意味を先に押さえると、後がずっと楽になります"],
          en: ["Nailing the vocabulary first makes everything afterwards easier"],
        },
        cautions: {
          ja: ["「必ず儲かる」という勧誘には応じないでください。"],
          en: ["Never respond to a 'guaranteed profit' pitch."],
        },
        learnIds: ["what-is-crypto", "what-is-bitcoin", "how-to-choose-exchange"],
      },
      {
        id: "l2",
        title: { ja: "基本は押さえている段階", en: "The basics are covered" },
        description: {
          ja: "取引の仕組みは分かっているので、保管とセキュリティに進みましょう。",
          en: "You understand trading — move on to custody and security.",
        },
        reasons: {
          ja: ["取引所に置いたままにするリスクを理解する段階です"],
          en: ["This is the point to understand the risk of leaving assets on an exchange"],
        },
        cautions: {
          ja: ["シードフレーズの保管方法を先に決めてください。"],
          en: ["Decide how you will store a seed phrase before you create one."],
        },
        learnIds: ["what-is-wallet", "security-basics", "crypto-tax-basics"],
      },
      {
        id: "l3",
        title: { ja: "応用に進める段階", en: "Ready for the deeper material" },
        description: {
          ja: "DeFiやDAOなど、仕組みの内側に踏み込む記事へ進めます。",
          en: "You are ready for DeFi, DAOs and the mechanics underneath.",
        },
        reasons: {
          ja: ["基本操作を理解しているため、リスクの所在を判断できます"],
          en: ["With the basics in hand you can judge where the risks actually sit"],
        },
        cautions: {
          ja: ["高い利回りの裏にあるリスクを必ず確認してください。"],
          en: ["Always look for the risk behind a high advertised yield."],
        },
        learnIds: ["what-is-defi", "what-is-dao", "what-is-gas"],
      },
    ],
  },
  {
    id: "wallet",
    slug: "wallet",
    title: { ja: "ウォレット診断", en: "Which wallet fits you?" },
    lead: {
      ja: "使い方と保有額から、向いているウォレットの種別を表示します。",
      en: "Find the wallet type that fits how you use crypto and how much you hold.",
    },
    questions: [
      {
        id: "amount",
        label: { ja: "保有額の規模は？", en: "How much are you holding?" },
        options: [
          { id: "small", label: { ja: "少額", en: "A small amount" }, scores: { hot: 3 } },
          {
            id: "medium",
            label: { ja: "中程度", en: "Moderate" },
            scores: { hot: 1, hardware: 2 },
          },
          { id: "large", label: { ja: "大きい", en: "Substantial" }, scores: { hardware: 3 } },
        ],
      },
      {
        id: "frequency",
        label: { ja: "どのくらいの頻度で使いますか？", en: "How often will you use it?" },
        options: [
          { id: "daily", label: { ja: "ほぼ毎日", en: "Almost daily" }, scores: { hot: 3 } },
          {
            id: "sometimes",
            label: { ja: "ときどき", en: "Sometimes" },
            scores: { hot: 1, hardware: 1 },
          },
          {
            id: "rare",
            label: { ja: "ほとんど動かさない", en: "Rarely move it" },
            scores: { hardware: 3 },
          },
        ],
      },
      {
        id: "chain",
        label: { ja: "使うチェーンは？", en: "Which chains?" },
        options: [
          {
            id: "evm",
            label: { ja: "Ethereum 系が中心", en: "Mostly EVM chains" },
            scores: { hot: 2, hardware: 1 },
          },
          { id: "solana", label: { ja: "Solana が中心", en: "Mostly Solana" }, scores: { hot: 2 } },
          {
            id: "many",
            label: { ja: "いろいろ使う", en: "A bit of everything" },
            scores: { hot: 2, hardware: 1 },
          },
        ],
      },
      {
        id: "team",
        label: { ja: "複数人で資金を管理しますか？", en: "Will several people manage the funds?" },
        options: [
          { id: "no", label: { ja: "自分だけ", en: "Just me" }, scores: { hot: 1, hardware: 1 } },
          {
            id: "yes",
            label: { ja: "チーム・団体で管理する", en: "A team or organisation" },
            scores: { multisig: 4 },
          },
        ],
      },
    ],
    results: [
      {
        id: "hot",
        title: { ja: "ホットウォレット（日常使い）", en: "Hot wallet for daily use" },
        description: {
          ja: "日常的にdAppを使うなら、アプリ・拡張機能型が扱いやすい条件です。",
          en: "If you use dApps regularly, an app or extension wallet is the practical choice.",
        },
        reasons: {
          ja: ["対応dAppが多い", "操作が速い", "無料で始められる"],
          en: ["Works with the most dApps", "Fast to use", "Free to start"],
        },
        cautions: {
          ja: [
            "常時オンラインのため、シードフレーズの管理と承認の棚卸しが重要です。",
            "大きな金額を置いたままにしないでください。",
          ],
          en: [
            "Always online, so seed handling and approval hygiene matter",
            "Do not park large amounts here.",
          ],
        },
        walletIds: ["metamask", "phantom", "trust-wallet"],
        toolIds: ["revoke-cash"],
      },
      {
        id: "hardware",
        title: { ja: "ハードウェアウォレット（保管用）", en: "Hardware wallet for storage" },
        description: {
          ja: "動かす頻度が低く、額が大きいなら、鍵を隔離できる機器が向いています。",
          en: "For larger holdings you rarely move, isolating the key in a device is the fit.",
        },
        reasons: {
          ja: ["秘密鍵がオンライン端末から隔離される", "取引内容を機器の画面で確認できる"],
          en: [
            "Keys stay off internet-connected devices",
            "You confirm each transaction on the device",
          ],
        },
        cautions: {
          ja: [
            "必ず公式ストアから新品を購入してください。",
            "リカバリー手段を紛失・故障に備えて用意してください。",
          ],
          en: [
            "Buy new, from the official store only.",
            "Plan your recovery for loss or device failure.",
          ],
        },
        walletIds: ["ledger", "trezor"],
      },
      {
        id: "multisig",
        title: { ja: "マルチシグ（組織の資金管理）", en: "Multi-signature for organisations" },
        description: {
          ja: "複数人の承認を必須にできるスマートコントラクトウォレットが向いています。",
          en: "A smart-contract wallet that requires multiple approvals fits an organisation.",
        },
        reasons: {
          ja: ["1人の鍵漏洩で資金が動かない", "承認者をオンチェーンで管理できる"],
          en: ["One leaked key cannot move funds", "Signers are managed on-chain"],
        },
        cautions: {
          ja: ["デプロイと操作にガス代がかかります。"],
          en: ["Deploying and operating it costs gas."],
        },
        walletIds: ["safe"],
      },
    ],
  },
  {
    id: "security",
    slug: "security",
    title: { ja: "仮想通貨セキュリティ診断", en: "How safe is your setup?" },
    lead: {
      ja: "いまの運用の弱点を洗い出し、優先して直すべき点を表示します。",
      en: "Find the weak points in how you operate today, and what to fix first.",
    },
    questions: [
      {
        id: "seed",
        label: {
          ja: "シードフレーズをどこに保管していますか？",
          en: "Where is your seed phrase stored?",
        },
        options: [
          {
            id: "paper",
            label: { ja: "紙に書いてオフライン保管", en: "On paper, offline" },
            scores: { good: 3 },
          },
          {
            id: "cloud",
            label: { ja: "写真やクラウドメモ", en: "A photo or cloud note" },
            scores: { critical: 4 },
          },
          {
            id: "none",
            label: { ja: "ウォレットを使っていない", en: "I don't use a wallet" },
            scores: { basic: 2 },
          },
        ],
      },
      {
        id: "2fa",
        label: {
          ja: "取引所で二段階認証を設定していますか？",
          en: "Is two-factor authentication on at your exchange?",
        },
        options: [
          {
            id: "app",
            label: { ja: "認証アプリで設定済み", en: "Yes, via an authenticator app" },
            scores: { good: 3 },
          },
          { id: "sms", label: { ja: "SMSのみ", en: "SMS only" }, scores: { basic: 2 } },
          { id: "no", label: { ja: "設定していない", en: "Not set up" }, scores: { critical: 4 } },
        ],
      },
      {
        id: "approve",
        label: {
          ja: "トークンの承認を見直したことはありますか？",
          en: "Have you ever reviewed your token approvals?",
        },
        options: [
          {
            id: "yes",
            label: { ja: "定期的に見直している", en: "I review them regularly" },
            scores: { good: 3 },
          },
          { id: "once", label: { ja: "一度だけある", en: "Once" }, scores: { basic: 2 } },
          { id: "no", label: { ja: "したことがない", en: "Never" }, scores: { basic: 3 } },
        ],
      },
      {
        id: "split",
        label: {
          ja: "日常用と保管用のウォレットを分けていますか？",
          en: "Do you separate a daily wallet from a storage wallet?",
        },
        options: [
          { id: "yes", label: { ja: "分けている", en: "Yes" }, scores: { good: 3 } },
          { id: "no", label: { ja: "1つにまとめている", en: "All in one" }, scores: { basic: 3 } },
        ],
      },
      {
        id: "link",
        label: {
          ja: "取引所やDeFiのサイトにはどう入りますか？",
          en: "How do you reach exchange and DeFi sites?",
        },
        options: [
          {
            id: "bookmark",
            label: { ja: "ブックマークから", en: "From a bookmark" },
            scores: { good: 3 },
          },
          {
            id: "search",
            label: { ja: "検索して上位のリンクから", en: "From the top search result" },
            scores: { critical: 3 },
          },
        ],
      },
    ],
    results: [
      {
        id: "critical",
        title: { ja: "早急に直したい点があります", en: "Something needs fixing now" },
        description: {
          ja: "資産を失う可能性が高い運用が含まれています。次の項目を今日中に見直してください。",
          en: "Your current setup includes a route to losing funds. Please address the items below today.",
        },
        reasons: {
          ja: [
            "シードフレーズをオンラインに保存している場合、そのアカウントが侵害された時点で資産を失います",
            "二段階認証が未設定だと、パスワード漏洩だけで口座に入られます",
            "検索結果の広告枠には偽サイトが出ることがあります",
          ],
          en: [
            "A seed phrase stored online means losing everything the moment that account is breached",
            "Without 2FA, a leaked password alone gets someone into your account",
            "Search advert slots are routinely bought by phishing sites",
          ],
        },
        cautions: {
          ja: ["すでに入力してしまった場合は、新しいウォレットを作成して資産を移してください。"],
          en: [
            "If you have already entered a seed phrase somewhere, create a new wallet and move your assets.",
          ],
        },
        learnIds: ["security-basics", "what-is-wallet"],
        toolIds: ["revoke-cash"],
      },
      {
        id: "basic",
        title: { ja: "基本はできています。あと一歩", en: "Solid basics — one step to go" },
        description: {
          ja: "大きな穴はありません。次の項目を足すと、被害の範囲を限定できます。",
          en: "No gaping holes. The items below limit the blast radius if something goes wrong.",
        },
        reasons: {
          ja: [
            "日常用と保管用を分けると、片方が侵害されても全額を失いません",
            "承認の棚卸しは、過去に使ったサービスのリスクを切り離します",
          ],
          en: [
            "Splitting daily and storage wallets means one compromise is not total",
            "Revoking approvals cuts you loose from services you no longer use",
          ],
        },
        cautions: {
          ja: ["SMSの二段階認証は、SIMスワップに弱い点に留意してください。"],
          en: ["SMS-based 2FA is vulnerable to SIM swapping."],
        },
        learnIds: ["security-basics"],
        toolIds: ["revoke-cash"],
      },
      {
        id: "good",
        title: { ja: "しっかり対策できています", en: "Well defended" },
        description: {
          ja: "現時点で大きな弱点は見当たりません。定期的な棚卸しを続けてください。",
          en: "No major weaknesses right now. Keep up the periodic review.",
        },
        reasons: {
          ja: ["鍵の保管・認証・導線のいずれも適切です"],
          en: ["Key storage, authentication and how you navigate are all in good shape"],
        },
        cautions: {
          ja: ["手口は変化します。半年に一度は承認の棚卸しを行ってください。"],
          en: ["Attacks evolve — review approvals at least twice a year."],
        },
        learnIds: ["security-basics"],
        toolIds: ["revoke-cash"],
      },
    ],
  },
  {
    id: "tax",
    slug: "tax",
    title: { ja: "仮想通貨税金準備度診断", en: "Are you ready for tax season?" },
    lead: {
      ja: "確定申告に必要な記録が揃っているかを確認します。税務判断そのものは行いません。",
      en: "Check whether you have the records a filing needs. This does not make any tax determination.",
    },
    questions: [
      {
        id: "history",
        label: {
          ja: "取引履歴をダウンロードしていますか？",
          en: "Have you downloaded your trade history?",
        },
        options: [
          {
            id: "yes",
            label: { ja: "全取引所分ある", en: "From every exchange" },
            scores: { ready: 3 },
          },
          { id: "partial", label: { ja: "一部だけ", en: "Only some" }, scores: { partial: 3 } },
          { id: "no", label: { ja: "していない", en: "Not yet" }, scores: { notready: 3 } },
        ],
      },
      {
        id: "swap",
        label: {
          ja: "暗号資産同士の交換でも損益が出ることを知っていますか？",
          en: "Did you know a crypto-to-crypto swap realises a gain or loss?",
        },
        options: [
          { id: "yes", label: { ja: "知っている", en: "Yes" }, scores: { ready: 2, partial: 1 } },
          { id: "no", label: { ja: "知らなかった", en: "No" }, scores: { notready: 3 } },
        ],
      },
      {
        id: "defi",
        label: { ja: "DeFiやNFTの取引はありますか？", en: "Did you trade DeFi or NFTs?" },
        options: [
          { id: "no", label: { ja: "ない", en: "No" }, scores: { ready: 2 } },
          { id: "yes", label: { ja: "ある", en: "Yes" }, scores: { partial: 2 } },
        ],
      },
      {
        id: "tool",
        label: {
          ja: "損益計算ツールを使っていますか？",
          en: "Are you using a tax calculation tool?",
        },
        options: [
          { id: "yes", label: { ja: "使っている", en: "Yes" }, scores: { ready: 3 } },
          {
            id: "no",
            label: { ja: "使っていない", en: "No" },
            scores: { partial: 1, notready: 2 },
          },
        ],
      },
    ],
    results: [
      {
        id: "ready",
        title: { ja: "準備できています", en: "You're ready" },
        description: {
          ja: "必要な記録は揃っています。最終的な申告内容は税理士にご確認ください。",
          en: "You have the records you need. Have a tax professional confirm the final filing.",
        },
        reasons: {
          ja: ["全取引所の履歴がある", "交換時の損益を理解している", "集計ツールを使っている"],
          en: [
            "History from every exchange",
            "You understand swaps realise gains",
            "You use a calculation tool",
          ],
        },
        cautions: {
          ja: ["税制は変わります。国税庁の最新の公表資料をご確認ください。"],
          en: ["Rules change — check the National Tax Agency's current material."],
        },
        learnIds: ["crypto-tax-basics"],
        toolIds: ["cryptact", "koinly"],
      },
      {
        id: "partial",
        title: { ja: "あと少しで揃います", en: "Nearly there" },
        description: {
          ja: "不足している記録を集めれば申告の準備が整います。",
          en: "Collect the missing records and you will be ready to file.",
        },
        reasons: {
          ja: ["一部の取引所の履歴が不足しています", "DeFi・NFTの履歴は別途集める必要があります"],
          en: [
            "Some exchange history is missing",
            "DeFi and NFT activity has to be gathered separately",
          ],
        },
        cautions: {
          ja: ["取引所は過去の履歴の保存期間に制限がある場合があります。早めに取得してください。"],
          en: ["Exchanges may only retain history for a limited period — download it early."],
        },
        learnIds: ["crypto-tax-basics"],
        toolIds: ["cryptact", "koinly"],
      },
      {
        id: "notready",
        title: { ja: "まず記録を集めるところから", en: "Start by gathering records" },
        description: {
          ja: "取引履歴の収集からはじめてください。件数が多い場合は計算ツールの利用が現実的です。",
          en: "Begin by collecting trade history. With any volume, a calculation tool is the realistic route.",
        },
        reasons: {
          ja: ["履歴がないと損益の計算ができません", "交換や決済でも損益が発生します"],
          en: ["No history means no calculation", "Swaps and spending also realise gains"],
        },
        cautions: {
          ja: ["申告漏れは加算税・延滞税の対象になります。"],
          en: ["Unreported income attracts penalties and interest."],
        },
        learnIds: ["crypto-tax-basics"],
        toolIds: ["cryptact", "koinly"],
      },
    ],
  },
];

export const diagnosisBySlug = new Map(diagnoses.map((entry) => [entry.slug, entry]));

export function getDiagnosis(slug: string): Diagnosis | undefined {
  return diagnosisBySlug.get(slug);
}
