/**
 * Web3.0 ツールのカタログ。
 *
 * カテゴリごとに見る項目が変わる（DEXに「対応チェーン」は要るが、税金ツールには要らない等）ため、
 * 表示側で `categoryFields` を見て項目を出し分けます。
 */

import type { Tool, ToolCategory } from "@/portal/lib/types";
import type { LocalizedText } from "@/portal/lib/types";

export const toolCategories: { id: ToolCategory; label: LocalizedText }[] = [
  { id: "wallet", label: { ja: "ウォレット", en: "Wallets" } },
  { id: "dex", label: { ja: "DEX", en: "DEX" } },
  { id: "defi", label: { ja: "DeFi", en: "DeFi" } },
  { id: "nft", label: { ja: "NFTマーケット", en: "NFT markets" } },
  { id: "bridge", label: { ja: "ブリッジ", en: "Bridges" } },
  { id: "analytics", label: { ja: "分析", en: "Analytics" } },
  { id: "portfolio", label: { ja: "ポートフォリオ管理", en: "Portfolio" } },
  { id: "tax", label: { ja: "税金計算", en: "Tax" } },
  { id: "onchain", label: { ja: "オンチェーン分析", en: "On-chain" } },
  { id: "security", label: { ja: "セキュリティ", en: "Security" } },
  { id: "dao", label: { ja: "DAO", en: "DAO" } },
  { id: "gamefi", label: { ja: "GameFi", en: "GameFi" } },
  { id: "ai", label: { ja: "AI × Web3", en: "AI × Web3" } },
  { id: "developer", label: { ja: "開発者ツール", en: "Developer" } },
];

/** カテゴリごとに意味のある項目だけを表に出します */
export const categoryFields: Record<
  ToolCategory,
  Array<"chains" | "walletConnect" | "freePlan" | "mobile">
> = {
  wallet: ["chains", "mobile", "freePlan"],
  dex: ["chains", "walletConnect"],
  defi: ["chains", "walletConnect"],
  nft: ["chains", "walletConnect", "mobile"],
  bridge: ["chains", "walletConnect"],
  analytics: ["freePlan", "mobile"],
  portfolio: ["chains", "freePlan", "mobile"],
  tax: ["freePlan"],
  onchain: ["chains", "freePlan"],
  security: ["chains", "freePlan"],
  dao: ["chains", "walletConnect"],
  gamefi: ["chains", "walletConnect", "mobile"],
  ai: ["freePlan"],
  developer: ["chains", "freePlan"],
};

const TBC: LocalizedText = { ja: "公式サイトで要確認", en: "Check official site" };

function tool(input: Omit<Tool, "checkedAt"> & { checkedAt?: string }): Tool {
  return { checkedAt: "", ...input };
}

export const tools: Tool[] = [
  tool({
    id: "uniswap",
    slug: "uniswap",
    name: "Uniswap",
    category: "dex",
    color: "#ff007a",
    summary: {
      ja: "EVM系で最も使われている分散型取引所（DEX）。板ではなく流動性プールで交換します。",
      en: "The most used decentralised exchange on EVM chains, swapping through liquidity pools rather than an order book.",
    },
    description: {
      ja: "Uniswap は、注文板の代わりに流動性プールを使って通貨を交換する仕組み（AMM）を広めたサービスです。ウォレットを接続すれば口座開設なしで交換でき、上場審査もないため新しいトークンが早く扱われます。その裏返しとして、詐欺トークンも同じように並びます。",
      en: "Uniswap popularised the automated market maker: instead of an order book, swaps run through liquidity pools. You connect a wallet and trade without opening an account, and because there is no listing review new tokens appear immediately — as do scam tokens.",
    },
    chains: ["Ethereum", "Arbitrum", "Optimism", "Base", "Polygon"],
    pricing: { ja: "取引ごとの手数料＋ガス代", en: "Per-swap fee plus gas" },
    freePlan: "yes",
    languages: ["en", "ja"],
    mobile: "yes",
    walletConnect: "yes",
    features: {
      ja: ["ウォレット接続だけで利用できる", "流動性提供による手数料収入", "対応チェーンが多い"],
      en: ["Just connect a wallet", "Earn fees by providing liquidity", "Available on many chains"],
    },
    howToUse: {
      ja: [
        "ウォレットを用意する",
        "公式ドメインであることを必ず確認する",
        "交換する通貨と数量を指定する",
        "取引内容を確認して署名する",
      ],
      en: [
        "Set up a wallet",
        "Verify you are on the official domain",
        "Choose the pair and amount",
        "Review the transaction and sign",
      ],
    },
    pros: {
      ja: ["口座開設が不要", "取扱トークンが非常に多い"],
      en: ["No account needed", "A very long list of tokens"],
    },
    cons: {
      ja: [
        "詐欺トークンが混在する",
        "ガス代がかかる",
        "取引価格が想定とずれることがある（スリッページ）",
      ],
      en: [
        "Scam tokens sit alongside real ones",
        "Gas costs apply",
        "Prices can slip from what you expected",
      ],
    },
    safety: {
      ja: [
        "コントラクトアドレスを必ず確認する（同名の偽トークンが存在する）",
        "検索結果の広告リンクから入らない",
        "無制限のトークン承認（approve）を避け、定期的に取り消す",
      ],
      en: [
        "Always check the contract address — same-name fakes exist",
        "Never arrive via a search-result ad link",
        "Avoid unlimited token approvals and revoke them regularly",
      ],
    },
    alternatives: ["jupiter"],
    officialUrl: "https://app.uniswap.org/",
  }),
  tool({
    id: "jupiter",
    slug: "jupiter",
    name: "Jupiter",
    category: "dex",
    color: "#c7f284",
    summary: {
      ja: "Solana のDEXアグリゲータ。複数のDEXを比較して最も有利な経路で交換します。",
      en: "A Solana DEX aggregator that routes each swap through the best available path.",
    },
    description: {
      ja: "Jupiter は、Solana 上の複数のDEXの価格を比較し、分割注文なども含めて最も有利な経路を自動で選ぶサービスです。個別のDEXを回るより有利な価格になりやすいのが利点です。",
      en: "Jupiter compares prices across Solana DEXs and picks the best route, splitting orders where that helps. You usually get a better price than going to a single DEX.",
    },
    chains: ["Solana"],
    pricing: { ja: "経路のDEX手数料＋ガス代", en: "Underlying DEX fees plus gas" },
    freePlan: "yes",
    languages: ["en"],
    mobile: "yes",
    walletConnect: "yes",
    features: {
      ja: ["複数DEXの価格比較", "指値注文", "積立（DCA）機能"],
      en: ["Price comparison across DEXs", "Limit orders", "Recurring buys (DCA)"],
    },
    howToUse: {
      ja: [
        "Solana対応ウォレットを接続",
        "交換する通貨を選ぶ",
        "経路と受取見込み額を確認",
        "署名して実行",
      ],
      en: [
        "Connect a Solana wallet",
        "Choose the pair",
        "Review the route and expected output",
        "Sign to execute",
      ],
    },
    pros: {
      ja: ["価格が有利になりやすい", "ガス代が安い"],
      en: ["Typically better pricing", "Cheap gas"],
    },
    cons: { ja: ["Solana以外には対応しない"], en: ["Solana only"] },
    safety: {
      ja: ["公式ドメインを確認する", "スリッページ設定を過大にしない"],
      en: ["Verify the official domain", "Do not set slippage tolerance too high"],
    },
    alternatives: ["uniswap"],
    officialUrl: "https://jup.ag/",
  }),
  tool({
    id: "aave",
    slug: "aave",
    name: "Aave",
    category: "defi",
    color: "#b6509e",
    summary: {
      ja: "暗号資産を貸し借りできるDeFiプロトコル。預けて利息を得る、担保を入れて借りる、の両方ができます。",
      en: "A DeFi lending protocol: deposit to earn interest, or post collateral and borrow.",
    },
    description: {
      ja: "Aave は、利用者が資産を預けて利息を得たり、担保を差し入れて別の資産を借りたりできるプロトコルです。金利は需給に応じて自動で変動します。借入では担保価値が下がると強制的に清算されるため、価格変動に対する余裕を持たせる必要があります。",
      en: "Aave lets users deposit assets to earn interest or post collateral to borrow other assets. Rates float with supply and demand. If your collateral value falls too far, your position is liquidated — so leave a wide margin.",
    },
    chains: ["Ethereum", "Arbitrum", "Optimism", "Base", "Polygon", "Avalanche"],
    pricing: { ja: "金利（変動）＋ガス代", en: "Floating interest plus gas" },
    freePlan: "yes",
    languages: ["en"],
    mobile: "partial",
    walletConnect: "yes",
    features: {
      ja: ["預入で利息が得られる", "担保による借入", "複数チェーンに展開"],
      en: ["Earn interest on deposits", "Borrow against collateral", "Deployed across many chains"],
    },
    howToUse: {
      ja: [
        "ウォレットを接続",
        "預け入れる資産と数量を決める",
        "借りる場合は健全性（Health Factor）を確認",
        "署名して実行",
      ],
      en: [
        "Connect a wallet",
        "Choose the asset and amount to supply",
        "If borrowing, watch the health factor",
        "Sign to execute",
      ],
    },
    pros: {
      ja: ["監査と運用実績がある", "金利が透明に見える"],
      en: ["Audited with a long operating record", "Transparent rates"],
    },
    cons: {
      ja: ["清算リスクがある", "スマートコントラクトの脆弱性リスクは残る", "ガス代がかかる"],
      en: ["Liquidation risk", "Smart contract risk never fully goes away", "Gas costs apply"],
    },
    safety: {
      ja: ["借入は担保に十分な余裕を持たせる", "急落時は自動で清算されることを前提に設計する"],
      en: [
        "Borrow far below your collateral limit",
        "Assume a sharp drop will liquidate you automatically",
      ],
    },
    alternatives: ["lido"],
    officialUrl: "https://app.aave.com/",
  }),
  tool({
    id: "lido",
    slug: "lido",
    name: "Lido",
    category: "defi",
    color: "#00a3ff",
    summary: {
      ja: "ETH を少額からステーキングできるリキッドステーキングのサービスです。",
      en: "Liquid staking that lets you stake ETH without running a validator.",
    },
    description: {
      ja: "イーサリアムのバリデータを自分で運用するには32 ETHと運用体制が必要です。Lido は少額のETHをまとめてステーキングし、預けた分に相当するトークン（stETH）を発行します。stETH は保有したまま他のDeFiでも使えます。",
      en: "Running your own Ethereum validator needs 32 ETH and an operations setup. Lido pools smaller amounts and issues stETH in return, which you can keep using elsewhere in DeFi.",
    },
    chains: ["Ethereum"],
    pricing: { ja: "報酬に対する手数料", en: "A fee on staking rewards" },
    freePlan: "yes",
    languages: ["en"],
    mobile: "partial",
    walletConnect: "yes",
    features: {
      ja: ["少額からステーキングできる", "ステーキング中も流動性が残る"],
      en: ["Stake any amount", "Stay liquid while staked"],
    },
    howToUse: {
      ja: [
        "ウォレットを接続",
        "ステーキングするETHの数量を決める",
        "受け取るstETHの数量を確認",
        "署名して実行",
      ],
      en: [
        "Connect a wallet",
        "Choose how much ETH to stake",
        "Check the stETH you will receive",
        "Sign to execute",
      ],
    },
    pros: {
      ja: ["32 ETH 未満でも参加できる", "流動性が確保される"],
      en: ["No 32 ETH minimum", "Keeps your position liquid"],
    },
    cons: {
      ja: [
        "stETH の価格がETHから乖離することがある",
        "スマートコントラクトリスク",
        "ステーキングの分散度に関する議論がある",
      ],
      en: [
        "stETH can trade away from ETH",
        "Smart contract risk",
        "Its share of staking raises decentralisation questions",
      ],
    },
    safety: {
      ja: ["公式ドメインを確認する", "報酬は保証されない"],
      en: ["Verify the official domain", "Rewards are not guaranteed"],
    },
    alternatives: ["aave"],
    officialUrl: "https://stake.lido.fi/",
  }),
  tool({
    id: "opensea",
    slug: "opensea",
    name: "OpenSea",
    category: "nft",
    color: "#2081e2",
    summary: {
      ja: "NFTの売買ができる代表的なマーケットプレイスです。",
      en: "One of the best-known marketplaces for buying and selling NFTs.",
    },
    description: {
      ja: "OpenSea は複数チェーンのNFTを扱うマーケットプレイスです。コレクションの取引履歴や保有者の分布を確認できます。同じ見た目の偽コレクションが多いため、公式のコントラクトアドレスから辿ることが重要です。",
      en: "OpenSea lists NFTs across several chains and shows trading history and holder distribution. Look-alike fake collections are common, so always navigate from the official contract address.",
    },
    chains: ["Ethereum", "Solana", "Polygon", "Base", "Arbitrum"],
    pricing: { ja: "販売時の手数料＋ガス代", en: "A fee on sales plus gas" },
    freePlan: "yes",
    languages: ["en", "ja"],
    mobile: "yes",
    walletConnect: "yes",
    features: {
      ja: ["複数チェーンのNFTを扱える", "コレクションの統計を確認できる"],
      en: ["Multi-chain NFT support", "Collection-level statistics"],
    },
    howToUse: {
      ja: [
        "ウォレットを接続",
        "公式のコントラクトアドレスからコレクションを開く",
        "価格と手数料を確認",
        "署名して購入",
      ],
      en: [
        "Connect a wallet",
        "Open the collection from its official contract address",
        "Check price and fees",
        "Sign to buy",
      ],
    },
    pros: {
      ja: ["流通量が多い", "情報が揃っている"],
      en: ["High liquidity", "Rich collection data"],
    },
    cons: {
      ja: ["偽コレクションが多い", "NFTの価格変動は非常に大きい"],
      en: ["Many counterfeit collections", "NFT prices are extremely volatile"],
    },
    safety: {
      ja: [
        "エアドロップとして届いた見覚えのないNFTには触らない",
        "署名を求めるポップアップの内容を必ず読む",
        "公式コントラクトアドレスと照合する",
      ],
      en: [
        "Never interact with an NFT that airdropped into your wallet unexpectedly",
        "Read every signature request before approving",
        "Cross-check the official contract address",
      ],
    },
    alternatives: ["blur"],
    officialUrl: "https://opensea.io/",
  }),
  tool({
    id: "blur",
    slug: "blur",
    name: "Blur",
    category: "nft",
    color: "#f97316",
    summary: {
      ja: "取引頻度の高い利用者向けに設計されたNFTマーケットプレイスです。",
      en: "An NFT marketplace built for high-frequency traders.",
    },
    description: {
      ja: "Blur は、複数コレクションの板情報を一画面にまとめ、まとめ買い・まとめ売りができるように設計されたマーケットプレイスです。操作は速い反面、初心者には情報量が多く扱いにくい面があります。",
      en: "Blur puts order books for many collections on one screen and supports bulk buying and selling. It is fast, but dense and hard for beginners.",
    },
    chains: ["Ethereum", "Blast"],
    pricing: TBC,
    freePlan: "yes",
    languages: ["en"],
    mobile: "partial",
    walletConnect: "yes",
    features: {
      ja: ["まとめ買い・まとめ売り", "板情報の一覧表示"],
      en: ["Bulk buy and sell", "Aggregated order books"],
    },
    howToUse: {
      ja: ["ウォレットを接続", "コレクションを選ぶ", "板を確認して注文"],
      en: ["Connect a wallet", "Pick a collection", "Review the book and order"],
    },
    pros: {
      ja: ["操作が速い", "取引コストを抑えやすい"],
      en: ["Fast execution", "Lower trading costs"],
    },
    cons: {
      ja: ["初心者には情報量が多い", "対応チェーンが限られる"],
      en: ["Dense for beginners", "Limited chain support"],
    },
    safety: { ja: ["署名内容を必ず確認する"], en: ["Always read the signature request"] },
    alternatives: ["opensea"],
    officialUrl: "https://blur.io/",
  }),
  tool({
    id: "debank",
    slug: "debank",
    name: "DeBank",
    category: "portfolio",
    color: "#ff6238",
    summary: {
      ja: "ウォレットアドレスを入れるだけで、複数チェーンの残高とDeFiの持ち高をまとめて見られます。",
      en: "Paste a wallet address and see balances and DeFi positions across many chains.",
    },
    description: {
      ja: "DeBank は、公開されているオンチェーンデータを読み取り、資産・DeFiのポジション・取引履歴を一覧化するサービスです。アドレスを入力するだけで確認でき、秘密鍵は不要です。",
      en: "DeBank reads public on-chain data and lays out balances, DeFi positions and history. It works from an address alone — no private key involved.",
    },
    chains: ["Ethereum", "Arbitrum", "Base", "Optimism", "Polygon", "BNB Chain"],
    pricing: { ja: "基本無料", en: "Free tier available" },
    freePlan: "yes",
    languages: ["en"],
    mobile: "yes",
    walletConnect: "partial",
    features: {
      ja: ["複数チェーンの残高を一覧化", "DeFiのポジションを可視化", "アドレス入力だけで使える"],
      en: ["Multi-chain balances", "DeFi position breakdown", "Works from an address alone"],
    },
    howToUse: {
      ja: ["ウォレットアドレスを貼り付ける", "チェーンごとの残高を確認する"],
      en: ["Paste a wallet address", "Review balances by chain"],
    },
    pros: {
      ja: ["ウォレット接続なしで使える", "対応プロトコルが多い"],
      en: ["No wallet connection required", "Covers many protocols"],
    },
    cons: {
      ja: ["反映が遅れることがある", "対応していないチェーンもある"],
      en: ["Data can lag", "Some chains are unsupported"],
    },
    safety: {
      ja: [
        "閲覧目的なら接続せずアドレス入力だけで済ませる",
        "アドレスを公開すると取引履歴が誰にでも見えることに留意する",
      ],
      en: [
        "For read-only use, paste an address instead of connecting",
        "Remember that sharing an address exposes your full history",
      ],
    },
    alternatives: ["zapper"],
    officialUrl: "https://debank.com/",
  }),
  tool({
    id: "zapper",
    slug: "zapper",
    name: "Zapper",
    category: "portfolio",
    color: "#784ffe",
    summary: {
      ja: "DeFiとNFTの持ち高を横断して見られるポートフォリオ管理ツールです。",
      en: "A portfolio tool that spans DeFi positions and NFTs.",
    },
    description: {
      ja: "Zapper は、複数チェーンの資産・DeFi・NFTをひとつのダッシュボードにまとめて表示します。取引履歴を人間が読める形に整形して見せるのが特徴です。",
      en: "Zapper pulls assets, DeFi positions and NFTs from many chains into one dashboard, and renders transaction history in human-readable form.",
    },
    chains: ["Ethereum", "Base", "Arbitrum", "Optimism", "Polygon"],
    pricing: { ja: "基本無料", en: "Free tier available" },
    freePlan: "yes",
    languages: ["en"],
    mobile: "yes",
    walletConnect: "yes",
    features: {
      ja: ["資産・DeFi・NFTを横断表示", "取引履歴を読みやすく整形"],
      en: ["Assets, DeFi and NFTs in one view", "Readable transaction history"],
    },
    howToUse: {
      ja: ["アドレスを入力する", "ダッシュボードを確認する"],
      en: ["Enter an address", "Review the dashboard"],
    },
    pros: {
      ja: ["見やすいダッシュボード", "履歴が分かりやすい"],
      en: ["A clear dashboard", "Legible history"],
    },
    cons: { ja: ["対応チェーンに偏りがある"], en: ["Chain coverage is uneven"] },
    safety: { ja: ["接続せず閲覧のみで使える"], en: ["Can be used read-only without connecting"] },
    alternatives: ["debank"],
    officialUrl: "https://zapper.xyz/",
  }),
  tool({
    id: "cryptact",
    slug: "cryptact",
    name: "Cryptact",
    category: "tax",
    color: "#1b74e4",
    summary: {
      ja: "日本の確定申告向けに、暗号資産の損益計算を自動化するサービスです。",
      en: "Automates crypto profit-and-loss calculation for Japanese tax filing.",
    },
    description: {
      ja: "取引所からダウンロードした取引履歴を取り込み、日本の税制に沿った損益計算を行うサービスです。複数の取引所やDeFiの取引をまたいだ集計に対応します。計算結果の最終的な妥当性は、税理士や税務署への確認が必要です。",
      en: "Import trade history from exchanges and get a profit-and-loss calculation aligned with Japanese tax rules, aggregating across exchanges and DeFi. Final responsibility for the numbers rests with you and your tax adviser.",
    },
    chains: [],
    pricing: { ja: "無料プランと有料プランがある", en: "Free and paid plans" },
    freePlan: "yes",
    languages: ["ja", "en"],
    mobile: "partial",
    walletConnect: "no",
    features: {
      ja: ["取引履歴の自動取り込み", "日本の税制に沿った計算", "複数取引所の合算"],
      en: ["Automatic trade import", "Japanese tax rules", "Aggregates multiple exchanges"],
    },
    howToUse: {
      ja: [
        "取引所から取引履歴をダウンロード",
        "ファイルをアップロード",
        "未対応の取引を手動で補正",
        "計算結果を確認して申告に使う",
      ],
      en: [
        "Download history from each exchange",
        "Upload the files",
        "Fix any unrecognised transactions",
        "Review the result and use it for your filing",
      ],
    },
    pros: {
      ja: ["手計算より圧倒的に速い", "対応取引所が多い"],
      en: ["Far faster than manual calculation", "Supports many exchanges"],
    },
    cons: {
      ja: ["取引量が多いと有料プランが必要", "特殊な取引は手動補正が必要"],
      en: ["High volumes need a paid plan", "Unusual transactions need manual fixes"],
    },
    safety: {
      ja: ["APIキーを連携する場合は出金権限を付けない", "最終的な申告内容は税理士に確認する"],
      en: [
        "If you link an API key, never grant withdrawal permission",
        "Have a tax professional check the final filing",
      ],
    },
    alternatives: ["koinly"],
    officialUrl: "https://www.cryptact.com/",
  }),
  tool({
    id: "koinly",
    slug: "koinly",
    name: "Koinly",
    category: "tax",
    color: "#00b3a4",
    summary: {
      ja: "多くの国の税制に対応した暗号資産の損益計算サービスです。",
      en: "Crypto tax reporting that supports many countries' rules.",
    },
    description: {
      ja: "取引所やウォレットの履歴を取り込み、居住国の税制に応じたレポートを出力します。対応する取引所・チェーンの数が多いのが特徴です。",
      en: "Imports exchange and wallet history and produces reports for your country's rules, with unusually broad exchange and chain coverage.",
    },
    chains: ["Ethereum", "Bitcoin", "Solana", "Polygon"],
    pricing: { ja: "取引件数に応じた有料プラン", en: "Paid plans by transaction count" },
    freePlan: "yes",
    languages: ["en", "ja"],
    mobile: "partial",
    walletConnect: "no",
    features: {
      ja: ["多数の取引所・チェーンに対応", "国別の税レポート"],
      en: ["Broad exchange and chain support", "Country-specific tax reports"],
    },
    howToUse: {
      ja: ["取引所・ウォレットを連携", "取引を分類", "レポートを出力"],
      en: ["Connect exchanges and wallets", "Categorise transactions", "Export the report"],
    },
    pros: {
      ja: ["対応範囲が広い", "オンチェーン取引も取り込める"],
      en: ["Very broad coverage", "Handles on-chain activity"],
    },
    cons: {
      ja: ["日本の税制への当てはめは確認が必要", "件数が多いと費用がかさむ"],
      en: ["Japanese rules need double-checking", "Costly at high transaction counts"],
    },
    safety: { ja: ["APIキーは閲覧権限のみにする"], en: ["Grant read-only API keys"] },
    alternatives: ["cryptact"],
    officialUrl: "https://koinly.io/",
  }),
  tool({
    id: "dune",
    slug: "dune",
    name: "Dune",
    category: "onchain",
    color: "#f4603e",
    summary: {
      ja: "SQLでオンチェーンデータを集計し、ダッシュボードとして公開できる分析基盤です。",
      en: "Query on-chain data with SQL and publish the result as a dashboard.",
    },
    description: {
      ja: "Dune は、ブロックチェーンのデータをテーブルとして扱い、SQLで集計できるサービスです。他の利用者が作ったダッシュボードを閲覧するだけでも、プロトコルの利用状況や資金の流れを把握できます。",
      en: "Dune exposes blockchain data as SQL tables. Even without writing a query you can browse other people's dashboards to see protocol usage and fund flows.",
    },
    chains: ["Ethereum", "Solana", "Arbitrum", "Base", "Polygon"],
    pricing: { ja: "無料プランと有料プランがある", en: "Free and paid plans" },
    freePlan: "yes",
    languages: ["en"],
    mobile: "partial",
    walletConnect: "no",
    features: {
      ja: ["SQLでオンチェーンデータを集計", "ダッシュボードの共有", "公開ダッシュボードの閲覧"],
      en: ["SQL over on-chain data", "Shareable dashboards", "Browse public dashboards"],
    },
    howToUse: {
      ja: ["公開ダッシュボードを探す", "必要ならクエリを複製して編集", "結果をグラフにする"],
      en: ["Find a public dashboard", "Fork and edit the query if needed", "Chart the result"],
    },
    pros: { ja: ["自由度が高い", "無料で閲覧できる"], en: ["Highly flexible", "Free to browse"] },
    cons: {
      ja: ["SQLの知識が要る", "クエリの品質は作成者次第"],
      en: ["Requires SQL", "Quality depends on the query author"],
    },
    safety: {
      ja: ["公開データのみを扱うため、鍵の入力は不要"],
      en: ["Public data only — no keys involved"],
    },
    alternatives: ["defillama"],
    officialUrl: "https://dune.com/",
  }),
  tool({
    id: "defillama",
    slug: "defillama",
    name: "DefiLlama",
    category: "analytics",
    color: "#2172e5",
    summary: {
      ja: "DeFiのTVL（預かり資産）をチェーン・プロトコル別に確認できる分析サイトです。",
      en: "Tracks DeFi total value locked by chain and protocol.",
    },
    description: {
      ja: "DefiLlama は、DeFiプロトコルに預けられている資産の総額（TVL）を集計し、チェーン別・プロトコル別に比較できるようにしたサービスです。データの算出方法が公開されており、無料で利用できます。",
      en: "DefiLlama aggregates the total value locked in DeFi protocols and lets you compare by chain and protocol. Its methodology is published and the site is free.",
    },
    chains: ["Ethereum", "Solana", "BNB Chain", "Arbitrum", "Base", "Tron"],
    pricing: { ja: "無料", en: "Free" },
    freePlan: "yes",
    languages: ["en"],
    mobile: "yes",
    walletConnect: "no",
    features: {
      ja: ["TVLの推移を確認できる", "チェーン別・プロトコル別の比較", "算出方法が公開されている"],
      en: ["TVL over time", "Compare by chain and protocol", "Published methodology"],
    },
    howToUse: {
      ja: ["チェーンまたはプロトコルを選ぶ", "TVLの推移を確認する", "内訳を掘り下げる"],
      en: ["Pick a chain or protocol", "Review the TVL trend", "Drill into the breakdown"],
    },
    pros: { ja: ["無料で使える", "データの定義が明確"], en: ["Free", "Clear data definitions"] },
    cons: {
      ja: ["TVLは価格変動でも増減するため、単独では利用実態を表さない"],
      en: ["TVL moves with prices, so it alone does not show real usage"],
    },
    safety: { ja: ["閲覧のみで鍵の入力は不要"], en: ["Read-only — no keys involved"] },
    alternatives: ["dune"],
    officialUrl: "https://defillama.com/",
  }),
  tool({
    id: "revoke-cash",
    slug: "revoke-cash",
    name: "Revoke.cash",
    category: "security",
    color: "#16a34a",
    summary: {
      ja: "過去に与えたトークンの承認（approve）を確認し、取り消せるツールです。",
      en: "Review and revoke the token approvals you have granted.",
    },
    description: {
      ja: "DeFiやNFTを使うと、コントラクトに対して「このトークンを動かしてよい」という承認を与えます。承認は明示的に取り消すまで残り続けるため、後からそのコントラクトが悪用されると資産が抜かれる原因になります。Revoke.cash は承認の一覧化と取り消しを行います。",
      en: "Using DeFi or NFTs grants contracts permission to move your tokens. Those approvals persist until revoked, so a contract that is later exploited can drain you. Revoke.cash lists your approvals and lets you cancel them.",
    },
    chains: ["Ethereum", "Arbitrum", "Base", "Optimism", "Polygon", "BNB Chain"],
    pricing: { ja: "無料（取り消しにガス代がかかる）", en: "Free (revoking costs gas)" },
    freePlan: "yes",
    languages: ["en", "ja"],
    mobile: "partial",
    walletConnect: "yes",
    features: {
      ja: ["承認の一覧表示", "不要な承認の取り消し", "アドレス入力だけで確認できる"],
      en: ["List every approval", "Revoke what you no longer need", "Check from an address alone"],
    },
    howToUse: {
      ja: [
        "アドレスを入力して承認一覧を確認",
        "不要な承認を選ぶ",
        "ウォレットを接続して取り消しを署名",
      ],
      en: [
        "Enter an address to list approvals",
        "Select the ones to cancel",
        "Connect a wallet and sign the revocation",
      ],
    },
    pros: {
      ja: ["定期的な棚卸しに向く", "確認だけなら接続不要"],
      en: ["Good for periodic clean-ups", "No connection needed just to check"],
    },
    cons: { ja: ["取り消しごとにガス代がかかる"], en: ["Each revocation costs gas"] },
    safety: {
      ja: ["必ず公式ドメイン（revoke.cash）であることを確認する", "同名の偽サイトに注意する"],
      en: ["Confirm you are on revoke.cash itself", "Beware of look-alike domains"],
    },
    alternatives: [],
    officialUrl: "https://revoke.cash/",
  }),
];

export const toolById = new Map(tools.map((entry) => [entry.id, entry]));
export const toolBySlug = new Map(tools.map((entry) => [entry.slug, entry]));

export function getTool(idOrSlug: string): Tool | undefined {
  return toolById.get(idOrSlug) ?? toolBySlug.get(idOrSlug);
}
