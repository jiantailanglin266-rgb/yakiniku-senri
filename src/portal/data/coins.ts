/**
 * 通貨プロフィール。
 *
 * ここに書くのは「めったに変わらない事実」だけです。
 * 価格・時価総額・供給量の実測値は市場データ側（lib/market.ts）から流し込みます。
 * 発行上限のように仕様として確定している数値のみ、ここに持たせています。
 */

import type { Coin } from "@/portal/lib/types";

export const coins: Coin[] = [
  {
    id: "bitcoin",
    slug: "bitcoin",
    symbol: "BTC",
    name: { ja: "ビットコイン", en: "Bitcoin" },
    aliases: ["btc", "ビットコイン", "ビットコイン建て", "bitcoin", "サトシ", "satoshi"],
    color: "#f7931a",
    categories: ["layer1", "pow", "store-of-value"],
    summary: {
      ja: "2009年に稼働を開始した、最初の分散型デジタル通貨。発行上限は2,100万枚です。",
      en: "The first decentralised digital currency, live since 2009, capped at 21 million coins.",
    },
    description: {
      ja: "ビットコインは、中央の管理者を置かずに送金と残高管理を成立させることを目的に設計されたネットワークです。2008年に「Satoshi Nakamoto」名義の論文が公開され、2009年1月に最初のブロックが生成されました。取引はブロックチェーンと呼ばれる公開台帳に記録され、Proof of Work（PoW）による計算競争を通じて世界中のマイナーが合意を形成します。",
      en: "Bitcoin is a network designed to settle payments and track balances without a central operator. A paper under the name Satoshi Nakamoto appeared in 2008 and the first block was mined in January 2009. Transactions are recorded on a public ledger and miners around the world reach consensus through Proof of Work.",
    },
    features: {
      ja: [
        "発行上限が2,100万枚とプロトコルで定められている",
        "約4年ごとに新規発行量が半減する（半減期）",
        "Proof of Work による合意形成",
        "現物ETFの上場など、機関投資家向けの商品が整備されてきた",
      ],
      en: [
        "A protocol-level cap of 21 million coins",
        "New issuance halves roughly every four years",
        "Consensus through Proof of Work",
        "Institutional products such as spot ETFs now exist in several markets",
      ],
    },
    risks: {
      ja: [
        "価格変動が非常に大きく、短期間で大幅に下落することがある",
        "送金手数料と承認時間はネットワークの混雑で変動する",
        "秘密鍵を失うと資産を回復する手段がない",
        "各国の規制方針の変更が価格や利用可能性に影響する",
      ],
      en: [
        "Extremely volatile; sharp drawdowns happen over short periods",
        "Fees and confirmation times vary with network congestion",
        "Lose your private key and there is no recovery path",
        "Regulatory changes can affect price and availability",
      ],
    },
    links: {
      website: "https://bitcoin.org/",
      whitepaper: "https://bitcoin.org/bitcoin.pdf",
      explorer: "https://mempool.space/",
      github: "https://github.com/bitcoin/bitcoin",
    },
    maxSupply: 21_000_000,
    listedOn: ["bitbank", "bitflyer", "coincheck", "gmo-coin", "sbi-vc", "binance", "bybit", "okx"],
    consensus: { ja: "Proof of Work", en: "Proof of Work" },
    launchedAt: "2009-01-03",
  },
  {
    id: "ethereum",
    slug: "ethereum",
    symbol: "ETH",
    name: { ja: "イーサリアム", en: "Ethereum" },
    aliases: ["eth", "イーサリアム", "イーサ", "ether", "ethereum"],
    color: "#627eea",
    categories: ["layer1", "pos", "smart-contract"],
    summary: {
      ja: "スマートコントラクトを実行できるプログラム可能なブロックチェーン。DeFiやNFTの土台です。",
      en: "A programmable blockchain that runs smart contracts — the base layer for most DeFi and NFTs.",
    },
    description: {
      ja: "イーサリアムは、送金だけでなくプログラム（スマートコントラクト）を実行できるブロックチェーンです。2015年に稼働を開始し、2022年9月の「The Merge」でProof of WorkからProof of Stake（PoS）へ移行しました。DeFi、NFT、DAOなど、Web3.0のアプリケーションの多くがこのネットワーク上、またはその技術を継承したチェーン上で動いています。",
      en: "Ethereum is a blockchain that runs programs — smart contracts — as well as payments. It launched in 2015 and moved from Proof of Work to Proof of Stake with The Merge in September 2022. Most DeFi, NFT and DAO applications run on it or on chains that inherit its tooling.",
    },
    features: {
      ja: [
        "スマートコントラクトによりアプリケーションを構築できる",
        "Proof of Stake による合意形成。ETHをステーキングして報酬を得られる",
        "Layer 2（Arbitrum、Optimism、Base など）で手数料を抑えられる",
        "ERC-20 / ERC-721 など、広く使われる規格の発信源",
      ],
      en: [
        "Smart contracts allow full applications to be built on-chain",
        "Proof of Stake consensus; ETH can be staked for rewards",
        "Layer 2 networks such as Arbitrum, Optimism and Base reduce fees",
        "Origin of widely used standards including ERC-20 and ERC-721",
      ],
    },
    risks: {
      ja: [
        "混雑時のガス代が高騰することがある",
        "スマートコントラクトの脆弱性による資金流出リスクがある",
        "ステーキングにはロックアップやバリデータ運用のリスクが伴う",
        "発行上限が定められていない",
      ],
      en: [
        "Gas fees can spike when the network is busy",
        "Smart contract vulnerabilities can drain funds",
        "Staking carries lock-up and validator operation risks",
        "There is no fixed supply cap",
      ],
    },
    links: {
      website: "https://ethereum.org/",
      whitepaper: "https://ethereum.org/en/whitepaper/",
      explorer: "https://etherscan.io/",
      github: "https://github.com/ethereum",
    },
    listedOn: ["bitbank", "bitflyer", "coincheck", "gmo-coin", "sbi-vc", "binance", "bybit", "okx"],
    consensus: { ja: "Proof of Stake", en: "Proof of Stake" },
    launchedAt: "2015-07-30",
  },
  {
    id: "ripple",
    slug: "xrp",
    symbol: "XRP",
    name: { ja: "エックスアールピー", en: "XRP" },
    aliases: ["xrp", "リップル", "ripple", "エックスアールピー"],
    color: "#23292f",
    categories: ["payments", "layer1"],
    summary: {
      ja: "XRP Ledger 上で使われる、国際送金・決済向けに設計されたデジタル資産です。",
      en: "The digital asset of the XRP Ledger, designed for cross-border payments and settlement.",
    },
    description: {
      ja: "XRPは、XRP Ledgerというブロックチェーン上で使われる資産です。マイニングではなく独自の合意形成アルゴリズムを採用し、数秒での決済と低い手数料を特徴としています。開発を主導するRipple社は、金融機関向けの送金インフラを提供しています。なお「リップル」は会社名、「XRP」は資産名で、両者は別のものです。",
      en: "XRP is the asset of the XRP Ledger. Instead of mining it uses a consensus protocol that settles in seconds at very low cost. Ripple, the company that leads development, sells payment infrastructure to financial institutions. Note that Ripple is the company and XRP is the asset — they are not the same thing.",
    },
    features: {
      ja: [
        "数秒で決済が完了し、手数料が非常に低い",
        "発行上限は1,000億XRPで、追加発行されない",
        "国際送金・ブリッジ通貨としての利用を想定",
        "日本国内の取引所での取扱いが広い",
      ],
      en: [
        "Settlement in seconds at very low cost",
        "A fixed supply of 100 billion XRP with no further issuance",
        "Designed as a bridge asset for cross-border payments",
        "Widely listed on Japanese exchanges",
      ],
    },
    risks: {
      ja: [
        "発行済みXRPの相当量が管理下にあり、放出が需給に影響しうる",
        "各国の規制・訴訟の動向が価格に大きく影響してきた",
        "バリデータの分散度について議論がある",
      ],
      en: [
        "A large share of supply is held in escrow; releases affect supply and demand",
        "Regulatory and litigation news has moved the price sharply in the past",
        "The degree of validator decentralisation is debated",
      ],
    },
    links: {
      website: "https://xrpl.org/",
      explorer: "https://livenet.xrpl.org/",
      github: "https://github.com/XRPLF",
    },
    maxSupply: 100_000_000_000,
    listedOn: ["bitbank", "bitflyer", "coincheck", "gmo-coin", "sbi-vc", "binance", "bybit"],
    consensus: { ja: "XRP Ledger Consensus Protocol", en: "XRP Ledger Consensus Protocol" },
    launchedAt: "2012-06-01",
  },
  {
    id: "solana",
    slug: "solana",
    symbol: "SOL",
    name: { ja: "ソラナ", en: "Solana" },
    aliases: ["sol", "ソラナ", "solana"],
    color: "#14f195",
    categories: ["layer1", "pos", "smart-contract"],
    summary: {
      ja: "高い処理性能と低い手数料を狙って設計されたスマートコントラクト対応チェーンです。",
      en: "A smart-contract chain built for high throughput and low fees.",
    },
    description: {
      ja: "ソラナは、1秒あたりの処理件数を大きく引き上げることを目的に設計されたブロックチェーンです。Proof of Historyと呼ばれる時刻証明の仕組みをProof of Stakeと組み合わせ、取引を並列に処理します。手数料が安いことからNFT、GameFi、DEX、決済分野での利用が広がっています。",
      en: "Solana is designed to push transaction throughput far higher than earlier chains. It pairs Proof of Stake with Proof of History, a verifiable clock, and processes transactions in parallel. Low fees have made it popular for NFTs, GameFi, DEXs and payments.",
    },
    features: {
      ja: [
        "手数料が非常に低く、少額の取引に向く",
        "NFT・GameFi・DEXのエコシステムが厚い",
        "ステーキングに対応",
        "モバイルウォレット（Phantom など）の対応が早い",
      ],
      en: [
        "Very low fees, suitable for small transactions",
        "A deep NFT, GameFi and DEX ecosystem",
        "Staking supported",
        "Strong mobile wallet support, notably Phantom",
      ],
    },
    risks: {
      ja: [
        "過去にネットワーク停止が複数回発生している",
        "バリデータ運用に高いハードウェア要件がある",
        "新しい銘柄が多く、詐欺的なトークンも混在する",
      ],
      en: [
        "The network has halted several times in the past",
        "Validators need high-spec hardware",
        "Many new tokens launch here, including outright scams",
      ],
    },
    links: {
      website: "https://solana.com/",
      explorer: "https://solscan.io/",
      github: "https://github.com/solana-labs",
    },
    listedOn: ["bitbank", "bitflyer", "coincheck", "gmo-coin", "binance", "bybit", "okx"],
    consensus: { ja: "Proof of Stake + Proof of History", en: "Proof of Stake + Proof of History" },
    launchedAt: "2020-03-16",
  },
  {
    id: "binancecoin",
    slug: "bnb",
    symbol: "BNB",
    name: { ja: "ビーエヌビー", en: "BNB" },
    aliases: ["bnb", "バイナンスコイン", "binance coin", "binancecoin"],
    color: "#f3ba2f",
    categories: ["exchange-token", "layer1"],
    summary: {
      ja: "Binance のエコシステムと BNB Chain で使われるトークンです。",
      en: "The token of the Binance ecosystem and of BNB Chain.",
    },
    description: {
      ja: "BNBは、取引所Binanceが発行したトークンを起点に、独自チェーンであるBNB Chainのガス代としても使われるようになった資産です。取引手数料の割引やローンチパッドへの参加など、取引所のサービスと結びついた用途を持ちます。",
      en: "BNB began as an exchange token issued by Binance and now also pays gas on BNB Chain. Its utility is tied closely to exchange services such as fee discounts and launchpad access.",
    },
    features: {
      ja: [
        "BNB Chain のガス代として使われる",
        "Binance 上での手数料割引などの用途がある",
        "定期的なバーン（焼却）により供給量が減少する設計",
      ],
      en: [
        "Pays gas on BNB Chain",
        "Used for fee discounts and other services on Binance",
        "Periodic burns are designed to reduce supply over time",
      ],
    },
    risks: {
      ja: [
        "発行体である取引所の事業リスク・規制リスクの影響を強く受ける",
        "日本国内の取引所では取扱いが限られる",
      ],
      en: [
        "Heavily exposed to the business and regulatory risk of the issuing exchange",
        "Limited availability on Japanese exchanges",
      ],
    },
    links: { website: "https://www.bnbchain.org/", explorer: "https://bscscan.com/" },
    listedOn: ["binance", "bybit", "okx"],
    launchedAt: "2017-07-08",
  },
  {
    id: "cardano",
    slug: "cardano",
    symbol: "ADA",
    name: { ja: "カルダノ", en: "Cardano" },
    aliases: ["ada", "カルダノ", "エイダ", "cardano"],
    color: "#0033ad",
    categories: ["layer1", "pos", "smart-contract"],
    summary: {
      ja: "査読付き論文を土台に開発が進むProof of Stakeのブロックチェーンです。",
      en: "A Proof of Stake blockchain developed on top of peer-reviewed research.",
    },
    description: {
      ja: "カルダノは、学術的な査読を経た設計をもとに段階的に開発が進められてきたブロックチェーンです。Ouroborosと呼ばれるProof of Stakeアルゴリズムを採用し、ADAはネットワーク手数料の支払いとステーキングに使われます。",
      en: "Cardano has been built in phases from peer-reviewed designs. It uses the Ouroboros Proof of Stake protocol, and ADA pays network fees and is used for staking.",
    },
    features: {
      ja: [
        "ステーキングに参加しやすく、ロックアップ期間がない",
        "UTXOを拡張した独自の会計モデル（EUTXO）",
        "段階的な開発ロードマップ",
      ],
      en: [
        "Staking is easy to join with no lock-up period",
        "An extended UTXO accounting model",
        "A phased, published development roadmap",
      ],
    },
    risks: {
      ja: ["開発の進行が計画に対して遅れることがある", "DeFiの流動性が主要チェーンに比べて小さい"],
      en: [
        "Delivery has slipped against roadmap dates in the past",
        "DeFi liquidity is smaller than on the largest chains",
      ],
    },
    links: { website: "https://cardano.org/", explorer: "https://cardanoscan.io/" },
    maxSupply: 45_000_000_000,
    listedOn: ["bitbank", "coincheck", "gmo-coin", "binance", "bybit"],
    consensus: { ja: "Ouroboros (Proof of Stake)", en: "Ouroboros (Proof of Stake)" },
    launchedAt: "2017-09-29",
  },
  {
    id: "dogecoin",
    slug: "dogecoin",
    symbol: "DOGE",
    name: { ja: "ドージコイン", en: "Dogecoin" },
    aliases: ["doge", "ドージコイン", "dogecoin", "しばけん"],
    color: "#c2a633",
    categories: ["meme", "pow"],
    summary: {
      ja: "2013年にジョークとして始まり、決済用途とコミュニティで広く知られる通貨です。",
      en: "Started as a joke in 2013 and now widely known for payments and its community.",
    },
    description: {
      ja: "ドージコインは、当時のインターネットミームを題材に2013年に公開された通貨です。Litecoinのコードを基礎とし、発行上限を設けずに毎年一定量が発行され続けます。実用よりも話題性で価格が動く傾向が強く、著名人の発言に反応することで知られています。",
      en: "Dogecoin launched in 2013 based on an internet meme. It builds on Litecoin's code and issues a fixed amount every year with no supply cap. Its price tends to move on attention rather than usage, and it is known for reacting to celebrity comments.",
    },
    features: {
      ja: ["送金手数料が安く、少額決済に使われることがある", "コミュニティの層が厚い"],
      en: [
        "Cheap transfers, sometimes used for tipping and small payments",
        "A large, active community",
      ],
    },
    risks: {
      ja: [
        "発行上限がなく、供給が増え続ける",
        "話題性による急騰・急落が起きやすい",
        "技術的な開発の進展は限定的",
      ],
      en: [
        "No supply cap; issuance continues indefinitely",
        "Prone to sharp spikes and crashes driven by attention",
        "Limited ongoing technical development",
      ],
    },
    links: { website: "https://dogecoin.com/", explorer: "https://dogechain.info/" },
    listedOn: ["bitbank", "coincheck", "gmo-coin", "binance", "bybit"],
    consensus: { ja: "Proof of Work", en: "Proof of Work" },
    launchedAt: "2013-12-06",
  },
  {
    id: "avalanche-2",
    slug: "avalanche",
    symbol: "AVAX",
    name: { ja: "アバランチ", en: "Avalanche" },
    aliases: ["avax", "アバランチ", "avalanche"],
    color: "#e84142",
    categories: ["layer1", "pos", "smart-contract"],
    summary: {
      ja: "用途ごとに独立したチェーン（サブネット）を作れる高速な Layer 1 です。",
      en: "A fast Layer 1 that lets projects launch purpose-built subnets.",
    },
    description: {
      ja: "アバランチは、3つのチェーンを役割ごとに分けた構成と、独自のコンセンサスにより高速な確定性を実現しているネットワークです。企業やゲームが専用のチェーン（サブネット）を立ち上げられる点が特徴で、EVMと互換性があります。",
      en: "Avalanche splits its work across three chains and uses its own consensus family for fast finality. Companies and games can launch dedicated subnets, and it is EVM compatible.",
    },
    features: {
      ja: ["取引の確定が速い", "EVM互換で既存ツールを流用できる", "用途別チェーンを立ち上げられる"],
      en: ["Fast transaction finality", "EVM compatible tooling", "Purpose-built subnets"],
    },
    risks: {
      ja: [
        "サブネットごとに分散度・安全性が異なる",
        "競合するLayer 1が多く、開発者の獲得競争が激しい",
      ],
      en: [
        "Decentralisation and security vary between subnets",
        "Competes with many other Layer 1s for developers",
      ],
    },
    links: { website: "https://www.avax.network/", explorer: "https://snowtrace.io/" },
    maxSupply: 720_000_000,
    listedOn: ["bitbank", "gmo-coin", "binance", "bybit", "okx"],
    consensus: { ja: "Avalanche Consensus (PoS)", en: "Avalanche Consensus (PoS)" },
    launchedAt: "2020-09-21",
  },
  {
    id: "chainlink",
    slug: "chainlink",
    symbol: "LINK",
    name: { ja: "チェーンリンク", en: "Chainlink" },
    aliases: ["link", "チェーンリンク", "chainlink", "オラクル"],
    color: "#2a5ada",
    categories: ["oracle", "infrastructure"],
    summary: {
      ja: "ブロックチェーンの外側にあるデータを、契約へ安全に渡すオラクルネットワークです。",
      en: "An oracle network that delivers off-chain data to smart contracts.",
    },
    description: {
      ja: "スマートコントラクトは、ブロックチェーンの外にある情報（価格、天候、スポーツの結果など）を自分では取得できません。チェーンリンクは、複数のノードから集めたデータを検証して契約に渡す仕組みを提供し、DeFiの価格参照の多くがこれに依存しています。",
      en: "Smart contracts cannot fetch outside information — prices, weather, sports results — by themselves. Chainlink aggregates and verifies data from many nodes and feeds it to contracts. Much of DeFi depends on it for price references.",
    },
    features: {
      ja: [
        "DeFiの価格フィードとして広く使われている",
        "チェーン間のメッセージ送信（CCIP）にも展開",
        "ノード運営者がLINKをステークして品質を担保する設計",
      ],
      en: [
        "Widely used as the price feed layer for DeFi",
        "Also provides cross-chain messaging via CCIP",
        "Node operators stake LINK to back service quality",
      ],
    },
    risks: {
      ja: [
        "オラクルが誤ったデータを返した場合、依存するDeFi全体に影響が及ぶ",
        "競合するオラクルの台頭",
      ],
      en: [
        "A bad data feed can cascade into every protocol that relies on it",
        "Competition from other oracle providers",
      ],
    },
    links: { website: "https://chain.link/", explorer: "https://etherscan.io/token/chainlink" },
    maxSupply: 1_000_000_000,
    listedOn: ["bitbank", "coincheck", "gmo-coin", "binance", "bybit"],
    launchedAt: "2017-09-19",
  },
  {
    id: "polkadot",
    slug: "polkadot",
    symbol: "DOT",
    name: { ja: "ポルカドット", en: "Polkadot" },
    aliases: ["dot", "ポルカドット", "polkadot"],
    color: "#e6007a",
    categories: ["layer0", "pos", "interoperability"],
    summary: {
      ja: "複数のブロックチェーンを相互接続することを目的としたネットワークです。",
      en: "A network built to connect many blockchains together.",
    },
    description: {
      ja: "ポルカドットは、それぞれ独立したブロックチェーン（パラチェーン）を、共通のセキュリティのもとで接続する設計を採っています。中心にあるリレーチェーンが合意形成と安全性を担い、各パラチェーンは用途に合わせた設計を選べます。",
      en: "Polkadot connects independent blockchains — parachains — under shared security. A central relay chain handles consensus, while each parachain is free to specialise.",
    },
    features: {
      ja: [
        "共有セキュリティのもとで独自チェーンを運用できる",
        "オンチェーンガバナンス",
        "ステーキング対応",
      ],
      en: ["Run your own chain under shared security", "On-chain governance", "Staking supported"],
    },
    risks: {
      ja: [
        "構成が複雑で、初心者には理解のハードルが高い",
        "パラチェーン枠の獲得コストがプロジェクト側に必要",
      ],
      en: [
        "The architecture is complex and hard for newcomers to follow",
        "Projects must secure a parachain slot, which has a cost",
      ],
    },
    links: { website: "https://polkadot.com/", explorer: "https://polkadot.subscan.io/" },
    listedOn: ["bitbank", "coincheck", "gmo-coin", "binance", "bybit"],
    consensus: { ja: "Nominated Proof of Stake", en: "Nominated Proof of Stake" },
    launchedAt: "2020-05-26",
  },
  {
    id: "sui",
    slug: "sui",
    symbol: "SUI",
    name: { ja: "スイ", en: "Sui" },
    aliases: ["sui", "スイ"],
    color: "#4da2ff",
    categories: ["layer1", "pos", "smart-contract"],
    summary: {
      ja: "Move 言語を採用し、並列処理による高速化を狙った Layer 1 です。",
      en: "A Layer 1 using the Move language and parallel execution for speed.",
    },
    description: {
      ja: "スイは、資産を「オブジェクト」として扱うデータモデルとMove言語を組み合わせ、相互に干渉しない取引を並列に処理できるように設計されたブロックチェーンです。ゲームや消費者向けアプリでの利用が想定されています。",
      en: "Sui models assets as objects and uses the Move language so that independent transactions can execute in parallel. It targets games and consumer applications.",
    },
    features: {
      ja: [
        "並列実行による高いスループット",
        "ガス代が低い",
        "ゲーム・コンシューマ向けアプリに注力",
      ],
      en: [
        "High throughput via parallel execution",
        "Low gas fees",
        "Focus on games and consumer apps",
      ],
    },
    risks: {
      ja: [
        "稼働開始から日が浅く、実績の蓄積が少ない",
        "トークンのアンロックスケジュールが需給に影響する",
      ],
      en: [
        "A young network with a short track record",
        "Token unlock schedules affect supply and demand",
      ],
    },
    links: { website: "https://sui.io/", explorer: "https://suiscan.xyz/" },
    listedOn: ["bitbank", "binance", "bybit", "okx"],
    consensus: { ja: "Delegated Proof of Stake", en: "Delegated Proof of Stake" },
    launchedAt: "2023-05-03",
  },
  {
    id: "tron",
    slug: "tron",
    symbol: "TRX",
    name: { ja: "トロン", en: "TRON" },
    aliases: ["trx", "トロン", "tron"],
    color: "#eb0029",
    categories: ["layer1", "dpos", "stablecoin-rails"],
    summary: {
      ja: "ステーブルコインの送金量が大きいチェーンとして知られています。",
      en: "Best known for carrying a large share of stablecoin transfers.",
    },
    description: {
      ja: "トロンは、手数料の安さから特にUSDTなどステーブルコインの送金基盤として広く使われているブロックチェーンです。DPoS（Delegated Proof of Stake）により、投票で選ばれたノードがブロックを生成します。",
      en: "TRON is widely used as rails for stablecoin transfers, especially USDT, because fees are low. Blocks are produced by nodes elected through Delegated Proof of Stake.",
    },
    features: {
      ja: ["ステーブルコインの送金コストが低い", "処理が速い"],
      en: ["Low-cost stablecoin transfers", "Fast confirmation"],
    },
    risks: {
      ja: ["ノードの分散度が限定的", "創業者・運営体制をめぐる規制上の論点がある"],
      en: [
        "A limited validator set",
        "Regulatory questions have been raised about its founder and governance",
      ],
    },
    links: { website: "https://tron.network/", explorer: "https://tronscan.org/" },
    listedOn: ["binance", "bybit", "okx"],
    consensus: { ja: "Delegated Proof of Stake", en: "Delegated Proof of Stake" },
    launchedAt: "2018-06-25",
  },
  {
    id: "shiba-inu",
    slug: "shiba-inu",
    symbol: "SHIB",
    name: { ja: "シバイヌ", en: "Shiba Inu" },
    aliases: ["shib", "シバイヌ", "柴犬", "shiba"],
    color: "#f00500",
    categories: ["meme", "erc20"],
    summary: {
      ja: "イーサリアム上で発行されたミームトークン。極端に発行枚数が多いのが特徴です。",
      en: "A meme token on Ethereum, notable for an extremely large supply.",
    },
    description: {
      ja: "シバイヌは、2020年にイーサリアム上で発行されたERC-20トークンです。1枚あたりの単価が非常に小さくなるよう大量に発行されており、独自のDEXやLayer 2の開発も行われています。価格は実需よりコミュニティの盛り上がりに左右されます。",
      en: "Shiba Inu is an ERC-20 token issued on Ethereum in 2020. A very large supply keeps the unit price tiny. The project has since built its own DEX and Layer 2. Price is driven by community attention more than usage.",
    },
    features: {
      ja: ["単価が小さく少額から購入しやすい", "独自DEX・Layer 2 の開発が進む"],
      en: ["A tiny unit price makes small purchases easy", "Has built its own DEX and Layer 2"],
    },
    risks: {
      ja: [
        "発行枚数が極端に多く、価格の上昇余地は供給量に制約される",
        "話題性に依存し、急落しやすい",
        "類似の模倣トークンによる詐欺が多い",
      ],
      en: [
        "An enormous supply constrains how far the unit price can move",
        "Attention-driven and prone to sharp falls",
        "Many copycat scam tokens use similar names",
      ],
    },
    links: { website: "https://shibatoken.com/", explorer: "https://etherscan.io/" },
    listedOn: ["bitbank", "coincheck", "binance", "bybit"],
    launchedAt: "2020-08-01",
  },
];

export const coinById = new Map(coins.map((coin) => [coin.id, coin]));
export const coinBySlug = new Map(coins.map((coin) => [coin.slug, coin]));

export function getCoin(idOrSlug: string): Coin | undefined {
  return coinById.get(idOrSlug) ?? coinBySlug.get(idOrSlug);
}

/** ティッカーで引く（大文字小文字を問わない） */
export function getCoinBySymbol(symbol: string): Coin | undefined {
  const needle = symbol.trim().toLowerCase();
  return coins.find((coin) => coin.symbol.toLowerCase() === needle);
}
