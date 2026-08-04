/**
 * ウォレット比較データ。
 *
 * ⚠ 当サイトは秘密鍵・シードフレーズを一切扱いません。
 *   ここに書くのは各ウォレットの公開されている機能構成のみで、
 *   接続やインポートを促す導線は置きません。
 */

import type { Wallet } from "@/portal/lib/types";

export const wallets: Wallet[] = [
  {
    id: "metamask",
    slug: "metamask",
    name: "MetaMask",
    type: "hot-extension",
    color: "#f6851b",
    summary: {
      ja: "EVM系チェーンで最も広く使われているセルフカストディ型ウォレット。DeFiやNFTの入口として定番です。",
      en: "The most widely used self-custody wallet for EVM chains and the default entry point for DeFi and NFTs.",
    },
    chains: ["Ethereum", "Polygon", "Arbitrum", "Optimism", "Base", "BNB Chain", "Avalanche"],
    mobile: "yes",
    extension: "yes",
    hardware: "yes",
    nft: "yes",
    swap: "yes",
    staking: "partial",
    beginnerFriendly: true,
    security: {
      ja: [
        "秘密鍵は端末内に保存され、運営会社は保持しない（セルフカストディ）",
        "ハードウェアウォレットと接続して署名できる",
        "偽サイト・偽拡張機能による被害が多いため、導入元の確認が必須",
      ],
      en: [
        "Keys stay on your device; the vendor never holds them",
        "Can sign through a connected hardware wallet",
        "Fake sites and fake extensions are common — always verify where you install from",
      ],
    },
    pros: {
      ja: [
        "対応dAppが非常に多い",
        "ブラウザ拡張とアプリの両方がある",
        "ハードウェアウォレットと併用できる",
      ],
      en: [
        "Supported by a huge number of dApps",
        "Both extension and mobile app",
        "Works with hardware wallets",
      ],
    },
    cons: {
      ja: [
        "EVM以外のチェーンは別ウォレットが必要",
        "内蔵スワップの手数料は他より高くなることがある",
      ],
      en: [
        "Non-EVM chains need a different wallet",
        "The built-in swap can cost more than alternatives",
      ],
    },
    officialUrl: "https://metamask.io/",
    checkedAt: "",
  },
  {
    id: "phantom",
    slug: "phantom",
    name: "Phantom",
    type: "hot-extension",
    color: "#ab9ff2",
    summary: {
      ja: "Solana を中心に、EVMやBitcoinにも対応を広げたウォレット。NFT表示が見やすいのが特徴です。",
      en: "Solana-first wallet that has since added EVM and Bitcoin support, with a strong NFT view.",
    },
    chains: ["Solana", "Ethereum", "Polygon", "Base", "Bitcoin"],
    mobile: "yes",
    extension: "yes",
    hardware: "yes",
    nft: "yes",
    swap: "yes",
    staking: "yes",
    beginnerFriendly: true,
    security: {
      ja: ["セルフカストディ", "危険なトランザクションの警告表示", "ハードウェアウォレット対応"],
      en: ["Self-custody", "Warns about risky transactions", "Hardware wallet support"],
    },
    pros: {
      ja: ["Solanaのステーキングがアプリ内で完結", "NFTギャラリーが見やすい", "UIが分かりやすい"],
      en: ["Solana staking inside the app", "A clean NFT gallery", "An approachable interface"],
    },
    cons: { ja: ["対応チェーンはMetaMaskより狭い"], en: ["Covers fewer chains than MetaMask"] },
    officialUrl: "https://phantom.com/",
    checkedAt: "",
  },
  {
    id: "trust-wallet",
    slug: "trust-wallet",
    name: "Trust Wallet",
    type: "hot-mobile",
    color: "#3375bb",
    summary: {
      ja: "対応チェーン数の多さが強みのモバイル中心ウォレット。1つのアプリで幅広い資産を管理できます。",
      en: "A mobile-first wallet covering an unusually large number of chains in a single app.",
    },
    chains: ["Ethereum", "BNB Chain", "Solana", "Bitcoin", "Polygon", "Tron", "Cosmos"],
    mobile: "yes",
    extension: "yes",
    hardware: "partial",
    nft: "yes",
    swap: "yes",
    staking: "yes",
    beginnerFriendly: true,
    security: {
      ja: ["セルフカストディ", "生体認証によるロック"],
      en: ["Self-custody", "Biometric app lock"],
    },
    pros: {
      ja: ["対応チェーンが非常に多い", "スマホ単体で完結する"],
      en: ["Very broad chain support", "Works entirely on a phone"],
    },
    cons: {
      ja: ["ハードウェアウォレットとの併用は制限がある", "対応が広いぶん画面の情報量が多い"],
      en: ["Limited hardware wallet integration", "Broad support means a busy interface"],
    },
    officialUrl: "https://trustwallet.com/",
    checkedAt: "",
  },
  {
    id: "ledger",
    slug: "ledger",
    name: "Ledger",
    type: "hardware",
    color: "#141414",
    summary: {
      ja: "秘密鍵を専用デバイス内に隔離するハードウェアウォレット。長期保有の保管手段として使われます。",
      en: "A hardware wallet that isolates keys inside a dedicated device — the usual choice for long-term storage.",
    },
    chains: ["Bitcoin", "Ethereum", "Solana", "Polkadot", "Cardano", "XRP"],
    mobile: "yes",
    extension: "partial",
    hardware: "yes",
    nft: "yes",
    swap: "yes",
    staking: "yes",
    beginnerFriendly: false,
    security: {
      ja: [
        "秘密鍵がインターネットに接続された端末から隔離される",
        "取引の内容をデバイス画面で確認してから承認する",
        "必ず公式ストアから購入する（中古・転売品は改造リスクがある）",
      ],
      en: [
        "Keys never touch an internet-connected device",
        "You confirm each transaction on the device screen",
        "Buy new from the official store — second-hand units can be tampered with",
      ],
    },
    pros: {
      ja: ["オンライン攻撃に強い", "多くのチェーンに対応"],
      en: ["Resilient to online attacks", "Wide chain coverage"],
    },
    cons: {
      ja: [
        "購入費用がかかる",
        "紛失・故障に備えたリカバリー管理が必要",
        "毎回の署名にひと手間かかる",
      ],
      en: [
        "Costs money up front",
        "You must manage recovery for loss or failure",
        "Signing adds a step every time",
      ],
    },
    officialUrl: "https://www.ledger.com/",
    checkedAt: "",
  },
  {
    id: "trezor",
    slug: "trezor",
    name: "Trezor",
    type: "hardware",
    color: "#00854d",
    summary: {
      ja: "オープンソースを重視するハードウェアウォレット。ファームウェアが公開されています。",
      en: "A hardware wallet built around open source, with published firmware.",
    },
    chains: ["Bitcoin", "Ethereum", "Cardano", "XRP", "Litecoin"],
    mobile: "partial",
    extension: "partial",
    hardware: "yes",
    nft: "partial",
    swap: "yes",
    staking: "partial",
    beginnerFriendly: false,
    security: {
      ja: [
        "ファームウェアがオープンソースで検証可能",
        "デバイス画面での承認",
        "パスフレーズによる追加保護",
      ],
      en: [
        "Open-source, auditable firmware",
        "On-device confirmation",
        "Optional passphrase protection",
      ],
    },
    pros: {
      ja: ["設計が公開されている", "Bitcoin中心の運用に強い"],
      en: ["A published, auditable design", "Strong for Bitcoin-centric use"],
    },
    cons: {
      ja: ["対応チェーンはLedgerより少ない", "購入費用がかかる"],
      en: ["Fewer chains than Ledger", "Costs money up front"],
    },
    officialUrl: "https://trezor.io/",
    checkedAt: "",
  },
  {
    id: "safe",
    slug: "safe",
    name: "Safe",
    type: "smart-contract",
    color: "#12ff80",
    summary: {
      ja: "複数人の承認（マルチシグ）を前提としたスマートコントラクトウォレット。DAOやチームの資金管理で使われます。",
      en: "A smart-contract wallet built around multi-signature approval, used by DAOs and teams to hold funds.",
    },
    chains: ["Ethereum", "Arbitrum", "Optimism", "Base", "Polygon", "Gnosis"],
    mobile: "yes",
    extension: "no",
    hardware: "yes",
    nft: "yes",
    swap: "yes",
    staking: "partial",
    beginnerFriendly: false,
    security: {
      ja: [
        "複数の署名を必須にでき、1人の鍵漏洩で資金が動かない",
        "承認者の追加・削除をオンチェーンで管理できる",
      ],
      en: [
        "Requires multiple signatures, so one leaked key cannot move funds",
        "Signers can be added or removed on-chain",
      ],
    },
    pros: {
      ja: ["組織の資金管理に向く", "権限設計を細かく決められる"],
      en: ["Well suited to organisational treasuries", "Fine-grained permission design"],
    },
    cons: {
      ja: ["個人利用にはやや過剰", "コントラクトのデプロイにガス代がかかる"],
      en: ["Overkill for an individual", "Deploying the contract costs gas"],
    },
    officialUrl: "https://safe.global/",
    checkedAt: "",
  },
  {
    id: "coinbase-wallet",
    slug: "coinbase-wallet",
    name: "Coinbase Wallet",
    type: "hot-extension",
    color: "#0052ff",
    summary: {
      ja: "取引所とは別に提供されるセルフカストディ型ウォレット。Base をはじめEVM系に強みがあります。",
      en: "A self-custody wallet offered separately from the exchange, with strong support for Base and EVM chains.",
    },
    chains: ["Ethereum", "Base", "Polygon", "Arbitrum", "Optimism", "Solana"],
    mobile: "yes",
    extension: "yes",
    hardware: "partial",
    nft: "yes",
    swap: "yes",
    staking: "partial",
    beginnerFriendly: true,
    security: {
      ja: ["セルフカストディ（取引所口座とは別管理）", "クラウドバックアップの選択肢がある"],
      en: ["Self-custody, separate from any exchange account", "Optional cloud backup"],
    },
    pros: {
      ja: ["取引所との行き来がしやすい", "Base のエコシステムに強い"],
      en: ["Easy to move to and from the exchange", "Strong within the Base ecosystem"],
    },
    cons: {
      ja: ["取引所の口座とウォレットを混同しやすい", "対応チェーンはMetaMaskより狭い"],
      en: ["Easy to confuse with the exchange account", "Fewer chains than MetaMask"],
    },
    officialUrl: "https://www.coinbase.com/wallet",
    checkedAt: "",
  },
];

export const walletById = new Map(wallets.map((wallet) => [wallet.id, wallet]));
export const walletBySlug = new Map(wallets.map((wallet) => [wallet.slug, wallet]));

export function getWallet(idOrSlug: string): Wallet | undefined {
  return walletById.get(idOrSlug) ?? walletBySlug.get(idOrSlug);
}
