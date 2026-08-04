/**
 * 斜めの帯に流すキーワード。
 *
 * ■ 翻訳しません
 *   銘柄名・規格名・プロトコル名は固有名詞です。機械翻訳に任せると
 *   「Solana」が一般名詞として訳されるなど、意味が壊れます。
 *   表示側で `translate="no"` を付けています。
 *
 * ■ 事実を主張する語を入れないでください
 *   ここは装飾です。値動き・順位・利回りを示す語（「高騰」「おすすめ」
 *   「年利◯%」など）を混ぜると、根拠の無い主張になります。
 *   入れてよいのは、**このサイトが実際に扱っている題材の名前**だけです。
 *
 * ■ 行の作り
 *   `angle` は傾き、`duration` は1周にかける時間です。
 *   行ごとに変えると、平行に流れるより奥行きが出ます。
 *   語数が少ないと1周が短くなり、同じ語がすぐ戻ってくるので
 *   1行あたり10語以上を目安にします。
 */

export type KeywordRow = {
  /** CSS の `rotate` にそのまま渡します */
  angle: string;
  /** CSS アニメーションの長さ */
  duration: string;
  words: string[];
};

export const keywordRows: KeywordRow[] = [
  {
    angle: "-3.5deg",
    duration: "44s",
    words: [
      "BITCOIN",
      "ETHEREUM",
      "SOLANA",
      "XRP",
      "CARDANO",
      "CHAINLINK",
      "POLKADOT",
      "AVALANCHE",
      "DOGECOIN",
      "SUI",
      "TRON",
      "BNB",
    ],
  },
  {
    angle: "2.5deg",
    duration: "52s",
    words: [
      "BLOCKCHAIN",
      "SMART CONTRACT",
      "PROOF OF STAKE",
      "LAYER 2",
      "ROLLUP",
      "ZERO KNOWLEDGE",
      "CONSENSUS",
      "HASH RATE",
      "MEMPOOL",
      "VALIDATOR",
      "GAS FEE",
      "MERKLE TREE",
    ],
  },
  {
    angle: "-2deg",
    duration: "38s",
    words: [
      "DEFI",
      "NFT",
      "DAO",
      "WEB3",
      "STAKING",
      "LIQUIDITY POOL",
      "STABLECOIN",
      "CUSTODY",
      "COLD WALLET",
      "SEED PHRASE",
      "ON-CHAIN",
      "BRIDGE",
    ],
  },
];
