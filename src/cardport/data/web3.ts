/**
 * Web3.0 / 暗号資産関連サービス（すべて架空）。
 *
 * ■ 必ず表示すること
 *   価格変動・サービス停止・地域制限・資産保全・詐欺リスク。
 *   `risks` と `regulatoryNote` は空にできない設計にしています。
 *
 * ■ 主題を損なわない
 *   このサイトの主題はクレジットカード比較です。
 *   Web3 は「決済手段のひとつ」として扱い、投資を勧める文脈では書きません。
 */
import type { Web3Service } from "./types";

export const web3Services: Web3Service[] = [
  {
    id: "w3-flowcard",
    slug: "chainbridge-flow-card",
    name: { ja: "チェーンブリッジ フローカード", en: "ChainBridge Flow Card" },
    category: "crypto-debit",
    summary: {
      ja: "保有する暗号資産を、決済時に自動で法定通貨へ換えて支払うカード型サービスです。",
      en: "A card that converts your crypto to fiat at the moment of payment.",
    },
    regions: ["JP", "SG", "GB"],
    fiatCurrencies: ["JPY", "USD", "EUR"],
    cryptoAssets: ["BTC", "ETH", "USDC", "USDT"],
    cardBrands: ["visa"],
    fees: {
      monthly: { ja: "無料", en: "Free" },
      issuing: { ja: "初回無料（再発行は1,100円）", en: "First card free; ¥1,100 to replace" },
      fx: {
        ja: "0.5%（暗号資産→法定通貨の変換手数料を含む）",
        en: "0.5%, including the crypto-to-fiat conversion",
      },
    },
    kyc: {
      ja: "本人確認書類の提出が必要（オンライン完結）",
      en: "Identity documents required; completed online",
    },
    languages: ["日本語", "English"],
    hasApp: true,
    rewards: { ja: "利用額の1.0%を暗号資産で還元", en: "1.0% of spend returned in crypto" },
    pros: {
      ja: [
        "暗号資産を売却せずに支払いへ回せる",
        "海外事務手数料が0.5%と低い",
        "用途ごとにバーチャルカードを発行できる",
      ],
      en: [
        "Spend from crypto without selling first",
        "A low 0.5% foreign transaction fee",
        "Virtual cards per use case",
      ],
    },
    risks: {
      ja: [
        "決済時点の価格で換算されるため、想定より多くの暗号資産を消費する場合があります",
        "資産はサービス提供会社が保管します（自己管理ウォレットではありません）",
        "提供会社の破綻・システム障害時に資産が引き出せなくなる可能性があります",
        "還元された暗号資産の売却益は課税対象となる場合があります",
      ],
      en: [
        "Conversion happens at the price at settlement, so you may spend more crypto than expected",
        "The provider custodies your assets — this is not self-custody",
        "Provider failure or an outage can leave you unable to withdraw",
        "Gains on disposal of rewarded crypto may be taxable",
      ],
    },
    regulatoryNote: {
      ja: "暗号資産に関する規制は国・地域で異なり、変更されることがあります。日本国内での取扱い可否および税務上の取扱いは、必ず最新の公式情報と専門家にご確認ください。",
      en: "Crypto regulation differs by jurisdiction and changes. Confirm availability in Japan and the tax treatment with current official sources and a professional.",
    },
    officialUrl: "https://example.com/chainbridge-flow",
    relatedNewsIds: ["news-006"],
    relatedVideoIds: ["video-006"],
  },
  {
    id: "w3-novawallet",
    slug: "nova-web3-wallet",
    name: { ja: "ノヴァ Web3 ウォレット", en: "Nova Web3 Wallet" },
    category: "wallet",
    summary: {
      ja: "秘密鍵を利用者自身が管理する、自己管理型のウォレットアプリです。",
      en: "A self-custody wallet app where you hold the private keys.",
    },
    regions: ["JP", "US", "GB", "SG"],
    fiatCurrencies: [],
    cryptoAssets: ["ETH", "USDC", "MATIC"],
    cardBrands: [],
    fees: {
      monthly: { ja: "無料", en: "Free" },
      issuing: { ja: "該当なし", en: "Not applicable" },
      fx: {
        ja: "該当なし（ネットワーク手数料は別途）",
        en: "Not applicable; network fees apply separately",
      },
    },
    kyc: { ja: "不要（自己管理型のため）", en: "Not required for self-custody" },
    languages: ["日本語", "English", "한국어"],
    hasApp: true,
    rewards: { ja: "なし", en: "None" },
    pros: {
      ja: [
        "秘密鍵を自分で管理できる",
        "サービス提供会社の破綻の影響を受けにくい",
        "複数のネットワークに対応",
      ],
      en: ["You hold the keys", "Less exposed to provider failure", "Supports multiple networks"],
    },
    risks: {
      ja: [
        "秘密鍵・リカバリーフレーズを失うと資産を復元できません（サポートも復元できません）",
        "偽アプリ・偽サイトによる詐欺が報告されています。公式ストア以外から入手しないでください",
        "承認した取引は取り消せません",
      ],
      en: [
        "Lose the key or recovery phrase and the assets are gone — support cannot restore them",
        "Fake apps and sites are a known scam vector; install only from official stores",
        "Approved transactions cannot be reversed",
      ],
    },
    regulatoryNote: {
      ja: "自己管理型ウォレットは、預けた資産の保護制度の対象外です。取扱いは国・地域の規制により異なります。",
      en: "Self-custody wallets fall outside deposit protection schemes. Treatment varies by jurisdiction.",
    },
    officialUrl: "https://example.com/nova-wallet",
    relatedNewsIds: [],
    relatedVideoIds: ["video-006"],
  },
  {
    id: "w3-stablepay",
    slug: "stablepay-settlement",
    name: { ja: "ステーブルペイ決済", en: "StablePay Settlement" },
    category: "stablecoin",
    summary: {
      ja: "ステーブルコインで加盟店へ支払い、加盟店側は法定通貨で受け取る決済サービスです。",
      en: "Pay merchants in stablecoin while the merchant receives fiat.",
    },
    regions: ["SG", "GB", "AE"],
    fiatCurrencies: ["USD", "EUR", "SGD"],
    cryptoAssets: ["USDC", "USDT"],
    cardBrands: [],
    fees: {
      monthly: { ja: "無料", en: "Free" },
      issuing: { ja: "該当なし", en: "Not applicable" },
      fx: { ja: "加盟店側が0.8%を負担", en: "0.8% borne by the merchant" },
    },
    kyc: { ja: "一定額以上の取引で本人確認が必要", en: "Identity verification above a threshold" },
    languages: ["English"],
    hasApp: true,
    rewards: { ja: "なし", en: "None" },
    pros: {
      ja: [
        "価格が法定通貨に連動するため、決済時の変動が小さい",
        "国際送金より着金が早い場合がある",
      ],
      en: [
        "Pegged to fiat, so settlement volatility is low",
        "Can settle faster than a wire transfer",
      ],
    },
    risks: {
      ja: [
        "ステーブルコインは発行体の裏付け資産に依存します。ペッグが外れる事例が過去に発生しています",
        "日本国内では取扱いが限定されます",
        "送金先アドレスを誤ると取り戻せません",
      ],
      en: [
        "Stablecoins depend on the issuer's reserves; de-pegging has happened before",
        "Availability in Japan is limited",
        "Send to a wrong address and the funds are unrecoverable",
      ],
    },
    regulatoryNote: {
      ja: "ステーブルコインの発行・流通は各国の規制対象です。日本国内での利用可否は最新の規制をご確認ください。",
      en: "Stablecoin issuance and distribution are regulated in each jurisdiction. Check current rules for use in Japan.",
    },
    officialUrl: "https://example.com/stablepay",
    relatedNewsIds: ["news-011"],
    relatedVideoIds: [],
  },
  {
    id: "w3-membership",
    slug: "orbit-nft-membership",
    name: { ja: "オービット NFT メンバーシップ", en: "Orbit NFT Membership" },
    category: "nft-membership",
    summary: {
      ja: "会員資格をNFTとして発行し、優待の適用可否をオンチェーンで確認する仕組みです。",
      en: "Membership issued as an NFT, with perk eligibility verified on-chain.",
    },
    regions: ["JP", "US"],
    fiatCurrencies: ["JPY"],
    cryptoAssets: ["ETH"],
    cardBrands: [],
    fees: {
      monthly: { ja: "無料", en: "Free" },
      issuing: { ja: "発行時のネットワーク手数料のみ", en: "Network fee at mint only" },
      fx: { ja: "該当なし", en: "Not applicable" },
    },
    kyc: {
      ja: "優待の利用時に本人確認が必要な場合があります",
      en: "Verification may be required when redeeming perks",
    },
    languages: ["日本語", "English"],
    hasApp: false,
    rewards: { ja: "提携店での優待", en: "Perks at partner merchants" },
    pros: {
      ja: ["会員資格の譲渡が技術的に可能", "優待の利用履歴を自分で確認できる"],
      en: [
        "Membership can technically be transferred",
        "You can audit your own redemption history",
      ],
    },
    risks: {
      ja: [
        "NFTの価格は市場で変動し、価値が保証されません",
        "サービス終了時に優待が使えなくなる可能性があります",
        "偽のミントサイトによる詐欺が報告されています",
      ],
      en: [
        "NFT prices move with the market and are not guaranteed",
        "Perks can stop working if the service ends",
        "Fake mint sites are a known scam vector",
      ],
    },
    regulatoryNote: {
      ja: "NFTの法的性質は用途により異なります。会員資格としての取扱いと、資産としての取扱いは同一ではありません。",
      en: "The legal character of an NFT depends on its use. Membership access and asset treatment are not the same thing.",
    },
    officialUrl: "https://example.com/orbit-membership",
    relatedNewsIds: [],
    relatedVideoIds: [],
  },
  {
    id: "w3-remit",
    slug: "chainbridge-remit",
    name: { ja: "チェーンブリッジ リミット", en: "ChainBridge Remit" },
    category: "remittance",
    summary: {
      ja: "ステーブルコインを経由した国際送金サービスです。",
      en: "Cross-border transfers routed through stablecoins.",
    },
    regions: ["JP", "PH", "VN", "TH"],
    fiatCurrencies: ["JPY", "PHP", "VND", "THB"],
    cryptoAssets: ["USDC"],
    cardBrands: [],
    fees: {
      monthly: { ja: "無料", en: "Free" },
      issuing: { ja: "該当なし", en: "Not applicable" },
      fx: { ja: "送金額の0.9%＋為替スプレッド", en: "0.9% of the amount plus an FX spread" },
    },
    kyc: { ja: "本人確認が必須です", en: "Identity verification is mandatory" },
    languages: ["日本語", "English", "Tiếng Việt", "ไทย"],
    hasApp: true,
    rewards: { ja: "なし", en: "None" },
    pros: {
      ja: ["着金が銀行送金より早い場合がある", "手数料が明示されている"],
      en: ["Often faster than a bank wire", "Fees are stated up front"],
    },
    risks: {
      ja: [
        "為替スプレッドは表示手数料と別に発生します。総コストで比較してください",
        "規制変更により、対応国が予告なく変わることがあります",
        "受取側の本人確認が完了しないと着金しません",
      ],
      en: [
        "The FX spread is separate from the stated fee — compare total cost",
        "Supported corridors can change without notice as rules change",
        "Funds do not arrive until the recipient completes verification",
      ],
    },
    regulatoryNote: {
      ja: "国際送金は資金移動業などの規制対象です。利用前に事業者の登録状況をご確認ください。",
      en: "Cross-border remittance is a regulated activity. Check the provider's registration before use.",
    },
    officialUrl: "https://example.com/chainbridge-remit",
    relatedNewsIds: ["news-011"],
    relatedVideoIds: [],
  },
  {
    id: "w3-tokenreward",
    slug: "linkmobile-token-reward",
    name: { ja: "リンクモバイル トークンリワード", en: "Link Mobile Token Reward" },
    category: "token-reward",
    summary: {
      ja: "既存のポイントをトークンとして受け取れる、ロイヤリティ連携の仕組みです。",
      en: "Receive existing loyalty points as tokens.",
    },
    regions: ["JP"],
    fiatCurrencies: ["JPY"],
    cryptoAssets: ["独自トークン"],
    cardBrands: [],
    fees: {
      monthly: { ja: "無料", en: "Free" },
      issuing: { ja: "該当なし", en: "Not applicable" },
      fx: { ja: "該当なし", en: "Not applicable" },
    },
    kyc: { ja: "既存の会員登録で完了", en: "Covered by your existing membership" },
    languages: ["日本語"],
    hasApp: true,
    rewards: { ja: "通常ポイントと同率", en: "Same rate as the standard points programme" },
    pros: {
      ja: ["既存ポイントの延長で使い始められる"],
      en: ["Builds on a points programme you already use"],
    },
    risks: {
      ja: [
        "独自トークンの価値は発行体の運営方針に依存します",
        "換金性が保証されません。通常ポイントのまま保有するほうが確実な場合があります",
        "サービス終了時の取扱いを事前に確認してください",
      ],
      en: [
        "The token's value depends on how the issuer runs the programme",
        "Convertibility is not guaranteed; keeping standard points may be safer",
        "Check what happens to the tokens if the programme ends",
      ],
    },
    regulatoryNote: {
      ja: "発行体が管理するトークンは、暗号資産に該当する場合と、前払式支払手段に該当する場合があります。取扱いは公式情報をご確認ください。",
      en: "Issuer-controlled tokens may be treated as crypto assets or as prepaid instruments. Check the official terms.",
    },
    officialUrl: "https://example.com/linkmobile-token",
    relatedNewsIds: [],
    relatedVideoIds: [],
  },
];

const web3Map = new Map(web3Services.map((service) => [service.slug, service]));

export function getWeb3Service(slug: string) {
  return web3Map.get(slug);
}
