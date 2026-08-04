/**
 * 上部マーキーに流す銘柄バナー。
 *
 * ■ 画像の置き場所
 *   `public/images/portal/marquee/<slug>.webp`
 *   ここに載せた slug のぶんだけ流れます。ファイルが無い slug を書くと
 *   404 が並ぶので、**ファイルを置いてから**追記してください。
 *
 * ■ 出所
 *   運営者から提供されたバナー画像です。
 *   作者・改変内容は `src/media/data/site-assets.ts` に記録しています。
 *
 * ■ リンク先
 *   `slug` は `src/portal/data/coins.ts` の slug と揃えます。
 *   揃っていないとテストで落ちます（リンク切れを防ぐため）。
 */

export type CoinBanner = {
  /** coins.ts の slug と一致させます */
  slug: string;
  /** 読み上げ用の名前。画像は装飾なので、これがリンクの名前になります */
  label: string;
};

export const coinBanners: CoinBanner[] = [
  { slug: "bitcoin", label: "Bitcoin (BTC)" },
  { slug: "ethereum", label: "Ethereum (ETH)" },
  { slug: "xrp", label: "XRP" },
  { slug: "solana", label: "Solana (SOL)" },
  { slug: "bnb", label: "BNB" },
  { slug: "cardano", label: "Cardano (ADA)" },
  { slug: "dogecoin", label: "Dogecoin (DOGE)" },
  { slug: "chainlink", label: "Chainlink (LINK)" },
  { slug: "sui", label: "Sui (SUI)" },
  { slug: "tron", label: "TRON (TRX)" },
];
