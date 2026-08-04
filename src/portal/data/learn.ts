/**
 * 学習コンテンツ。
 *
 * ■ 記事の構造
 *   結論 → 要点 → 定義 → 本文 → 注意点 → FAQ → 関連 の順で固定しています。
 *   検索エンジンにも生成AIにも、最初の数行で要旨が取れる形にするためです。
 *   （AEO / LLMO を意識した構造。見出しの順序を崩さないでください）
 */

import type { LearnArticle } from "@/portal/lib/types";

const PUBLISHED = "2026-07-01T00:00:00Z";
const UPDATED = "2026-08-01T00:00:00Z";

function article(
  input: Omit<LearnArticle, "authorId" | "publishedAt" | "updatedAt" | "sources"> &
    Partial<Pick<LearnArticle, "authorId" | "publishedAt" | "updatedAt" | "sources">>,
): LearnArticle {
  return {
    authorId: "editorial",
    publishedAt: PUBLISHED,
    updatedAt: UPDATED,
    sources: [],
    ...input,
  };
}

export const learnArticles: LearnArticle[] = [
  article({
    id: "what-is-crypto",
    slug: "what-is-crypto",
    level: "beginner",
    title: { ja: "仮想通貨（暗号資産）とは", en: "What is a crypto asset?" },
    conclusion: {
      ja: "仮想通貨は、ブロックチェーンという公開台帳の上で管理されるデジタル資産です。銀行のような中央の管理者を置かずに、送金と残高の記録が成立します。価格は需要と供給で決まり、変動が非常に大きい点が最大の特徴です。",
      en: "A crypto asset is a digital asset recorded on a blockchain — a public ledger that tracks balances and transfers without a central operator such as a bank. Prices are set by supply and demand and move a great deal.",
    },
    keyPoints: {
      ja: [
        "発行や管理を行う中央の主体がいない（またはごく限定的）",
        "取引の記録は誰でも検証できる公開台帳に残る",
        "価格変動が大きく、元本は保証されない",
        "日本では「暗号資産」が法令上の名称",
      ],
      en: [
        "No central issuer or operator, or only a very limited one",
        "Transactions are recorded on a ledger anyone can verify",
        "Highly volatile; there is no principal guarantee",
        "Japanese law calls them crypto assets, not virtual currencies",
      ],
    },
    definition: {
      ja: "暗号技術によって取引の正当性を担保し、分散したネットワークで台帳を共有することで、中央の管理者なしに価値の移転を行えるようにしたデジタル資産のこと。",
      en: "A digital asset that uses cryptography to validate transactions and a distributed network to share the ledger, allowing value to move without a central operator.",
    },
    body: {
      ja: [
        "銀行振込では、銀行が「誰がいくら持っているか」を管理し、振込のたびにその記録を書き換えます。仮想通貨では、この記録が世界中のコンピュータに複製された台帳（ブロックチェーン）に書かれます。誰か1人が勝手に書き換えることができないよう、参加者が合意形成の仕組みに従って新しい記録を追加します。",
        "「通貨」という名前がついていますが、日常の支払いに使われる場面はまだ限定的で、実際には値上がり益を狙った保有や、ブロックチェーン上のサービスを使うための手数料として使われることが多いのが現状です。",
        "日本では資金決済法において「暗号資産」と定義され、取引を仲介する事業者は金融庁への登録が義務づけられています。取引を始める際は、登録を受けた事業者かどうかを必ず確認してください。",
      ],
      en: [
        "With a bank transfer, the bank keeps the record of who holds what and rewrites it for every payment. With crypto, that record lives on a ledger replicated across computers worldwide. Participants follow a consensus mechanism so that no single party can rewrite it.",
        "Despite the name, everyday payment use remains limited. In practice most holdings are either speculative or used to pay fees for on-chain services.",
        "In Japan they are defined as crypto assets under the Payment Services Act, and intermediaries must register with the Financial Services Agency. Always confirm that an exchange is registered before you start.",
      ],
    },
    cautions: {
      ja: [
        "価格が短期間で半分以下になることもある",
        "「必ず儲かる」「元本保証」をうたう勧誘は詐欺を疑う",
        "秘密鍵やシードフレーズを他人に伝えると資産を失う",
      ],
      en: [
        "Prices can halve in a short period",
        "Treat any 'guaranteed profit' or 'capital protected' pitch as a scam",
        "Sharing a private key or seed phrase means losing your assets",
      ],
    },
    faq: [
      {
        q: { ja: "いくらから始められますか？", en: "How much do I need to start?" },
        a: {
          ja: "取引所によって最低金額は異なりますが、数百円から購入できる場合が多くあります。まずは失っても生活に影響しない範囲から始めることをおすすめします。",
          en: "Minimums vary by exchange, but purchases of a few hundred yen are often possible. Start with an amount you could lose without it affecting your life.",
        },
      },
      {
        q: { ja: "銀行預金と何が違いますか？", en: "How is it different from a bank deposit?" },
        a: {
          ja: "銀行預金には預金保険制度がありますが、暗号資産にはそのような保護がありません。価格変動もあるため、預金の代わりにはなりません。",
          en: "Bank deposits are covered by deposit insurance; crypto assets are not. They also fluctuate in value, so they are not a substitute for savings.",
        },
      },
    ],
    readingMinutes: 6,
    relatedCoins: ["bitcoin", "ethereum"],
    next: ["what-is-blockchain", "how-to-choose-exchange"],
  }),
  article({
    id: "what-is-bitcoin",
    slug: "what-is-bitcoin",
    level: "beginner",
    title: { ja: "ビットコインとは", en: "What is Bitcoin?" },
    conclusion: {
      ja: "ビットコインは2009年に稼働を開始した最初の仮想通貨で、発行上限が2,100万枚とプロトコルで決められています。管理者を置かずに送金を成立させる仕組みを最初に実現しました。",
      en: "Bitcoin is the first crypto asset, live since 2009, with a protocol-level cap of 21 million coins. It was the first system to settle transfers without an operator.",
    },
    keyPoints: {
      ja: [
        "発行上限は2,100万枚",
        "約4年ごとに新規発行が半減する",
        "Proof of Work で合意を形成する",
        "送金の確定には数十分かかることがある",
      ],
      en: [
        "Capped at 21 million coins",
        "Issuance halves about every four years",
        "Consensus through Proof of Work",
        "Settlement can take tens of minutes",
      ],
    },
    definition: {
      ja: "Proof of Work によって台帳の正当性を担保する、発行上限つきの分散型デジタル通貨。",
      en: "A decentralised digital currency with a fixed supply, secured by Proof of Work.",
    },
    body: {
      ja: [
        "ビットコインのネットワークでは、マイナーと呼ばれる参加者が計算を競い、勝った者が新しいブロックを台帳に追加します。この計算に膨大な電力がかかることが、台帳の書き換えを事実上不可能にしています。",
        "新規に発行される量は、約4年ごとに半分になります。これを半減期と呼びます。発行上限が決まっているため、需要が増えれば価格が上がりやすいという議論の根拠になっていますが、価格が上がることを保証するものではありません。",
      ],
      en: [
        "Miners compete on computation, and the winner appends the next block. The sheer energy cost of that computation is what makes rewriting the ledger impractical.",
        "New issuance halves roughly every four years — the halving. A fixed cap is often cited as a reason prices could rise with demand, but it guarantees nothing.",
      ],
    },
    cautions: {
      ja: ["送金先アドレスを間違えると取り戻せない", "取引の混雑時は手数料が上がる"],
      en: ["Send to the wrong address and it is gone", "Fees rise when the network is congested"],
    },
    faq: [
      {
        q: { ja: "1枚買わないといけませんか？", en: "Do I have to buy a whole coin?" },
        a: {
          ja: "いいえ。ビットコインは小数点以下に細かく分割できるため、少額から購入できます。最小単位は1億分の1で「satoshi」と呼ばれます。",
          en: "No. Bitcoin divides into very small units, so you can buy a fraction. The smallest unit is one hundred-millionth of a bitcoin, called a satoshi.",
        },
      },
    ],
    readingMinutes: 5,
    relatedCoins: ["bitcoin"],
    next: ["what-is-crypto", "what-is-wallet"],
  }),
  article({
    id: "what-is-ethereum",
    slug: "what-is-ethereum",
    level: "beginner",
    title: { ja: "イーサリアムとは", en: "What is Ethereum?" },
    conclusion: {
      ja: "イーサリアムは、送金だけでなくプログラム（スマートコントラクト）を動かせるブロックチェーンです。DeFiやNFTの多くがこの上で動いています。",
      en: "Ethereum is a blockchain that runs programs — smart contracts — as well as payments. Most DeFi and NFT activity happens on it.",
    },
    keyPoints: {
      ja: [
        "スマートコントラクトを実行できる",
        "2022年にProof of Stakeへ移行した",
        "ガス代と呼ばれる手数料が必要",
        "Layer 2 で手数料を下げられる",
      ],
      en: [
        "Runs smart contracts",
        "Moved to Proof of Stake in 2022",
        "Transactions cost gas",
        "Layer 2 networks reduce those costs",
      ],
    },
    definition: {
      ja: "任意のプログラムを台帳上で実行できるようにした、汎用のブロックチェーンプラットフォーム。",
      en: "A general-purpose blockchain platform that can execute arbitrary programs on-chain.",
    },
    body: {
      ja: [
        "スマートコントラクトとは、あらかじめ決めた条件を満たしたときに自動で実行されるプログラムです。「この条件なら送金する」といった処理を、仲介者なしで実行できます。",
        "処理を実行するにはガス代という手数料が必要です。ネットワークが混雑すると高騰するため、Arbitrum や Base のような Layer 2 と呼ばれるネットワークで処理をまとめ、コストを下げる方法が普及しています。",
      ],
      en: [
        "A smart contract is a program that executes automatically once its conditions are met — 'if this, then transfer' — without an intermediary.",
        "Running one costs gas. Fees spike when the network is busy, so Layer 2 networks such as Arbitrum and Base batch work off the main chain to reduce cost.",
      ],
    },
    cautions: {
      ja: ["コントラクトに脆弱性があると資金が流出する", "承認（approve）は取り消すまで残り続ける"],
      en: ["A vulnerable contract can drain funds", "Approvals persist until you revoke them"],
    },
    faq: [],
    readingMinutes: 5,
    relatedCoins: ["ethereum"],
    next: ["what-is-defi", "what-is-gas"],
  }),
  article({
    id: "what-is-blockchain",
    slug: "what-is-blockchain",
    level: "beginner",
    title: { ja: "ブロックチェーンとは", en: "What is a blockchain?" },
    conclusion: {
      ja: "ブロックチェーンは、取引の記録をブロック単位でまとめ、鎖のようにつないで保存する台帳の仕組みです。過去の記録を書き換えるとそれ以降すべてが壊れるため、改ざんが検知できます。",
      en: "A blockchain groups transactions into blocks and chains them together. Altering an old record breaks every block after it, so tampering is detectable.",
    },
    keyPoints: {
      ja: [
        "記録がブロック単位でつながっている",
        "改ざんすると後続がすべて不整合になる",
        "多数の参加者が同じ台帳を持つ",
      ],
      en: [
        "Records are chained block by block",
        "Tampering invalidates every later block",
        "Many participants hold the same ledger",
      ],
    },
    definition: {
      ja: "取引記録をハッシュで連結して保存し、複数の参加者が同一の内容を保持する分散型台帳。",
      en: "A distributed ledger in which records are linked by hashes and replicated across many participants.",
    },
    body: {
      ja: [
        "各ブロックには、直前のブロックの内容を要約した値（ハッシュ）が含まれます。過去のブロックを1文字でも書き換えると、その要約値が変わり、以降のすべてのブロックとの整合が取れなくなります。",
        "この性質と、台帳が多数の参加者に複製されていることが組み合わさることで、事実上の改ざん耐性が生まれています。",
      ],
      en: [
        "Every block contains a hash summarising the block before it. Change a single character in an old block and that summary changes, breaking consistency with everything after it.",
        "Combine that with a ledger replicated across many participants and you get practical tamper resistance.",
      ],
    },
    cautions: {
      ja: ["公開台帳のため、取引履歴は誰でも見られる"],
      en: ["The ledger is public — anyone can read your transaction history"],
    },
    faq: [],
    readingMinutes: 4,
    relatedCoins: [],
    next: ["what-is-crypto"],
  }),
  article({
    id: "how-to-choose-exchange",
    slug: "how-to-choose-exchange",
    level: "beginner",
    title: { ja: "取引所の選び方", en: "How to choose an exchange" },
    conclusion: {
      ja: "国内で始めるなら、まず金融庁に暗号資産交換業者として登録されていることを確認します。そのうえで、買いたい銘柄の取扱い・取引形式（販売所か板か）・手数料の3点で比較するのが実務的です。",
      en: "In Japan, first confirm the operator is registered with the FSA. Then compare on three things: whether it lists what you want, whether you trade on a brokerage or an order book, and the fees.",
    },
    keyPoints: {
      ja: [
        "金融庁の登録業者かどうかを最初に確認する",
        "販売所より板取引のほうがコストを抑えやすい",
        "買いたい銘柄が取り扱われているか",
        "積立・ステーキングなど使いたい機能の有無",
      ],
      en: [
        "Check FSA registration first",
        "Order-book trading is usually cheaper than the brokerage",
        "Confirm the assets you want are listed",
        "Check for the features you need — recurring buys, staking",
      ],
    },
    definition: {
      ja: "暗号資産の売買を仲介する事業者。日本では資金決済法にもとづき金融庁への登録が必要。",
      en: "A business that intermediates crypto trades. In Japan, registration with the FSA is required under the Payment Services Act.",
    },
    body: {
      ja: [
        "販売所は、運営会社が提示する価格で売買する方式です。操作は簡単ですが、売値と買値の差（スプレッド）が実質的なコストになります。板取引（取引所形式）は利用者同士が価格を出し合う方式で、指値注文が使えます。同じ銘柄なら、一般に板取引のほうがコストを抑えやすいとされています。",
        "手数料は「取引手数料」だけではありません。入金・出金・送金の手数料も合わせて確認してください。少額で頻繁に取引する場合、出金手数料の影響が大きくなります。",
        "複数の取引所に口座を持つこと自体は問題ありません。取扱銘柄が異なるため、目的に応じて使い分けるのが一般的です。",
      ],
      en: [
        "On the brokerage you trade at the operator's quoted price. It is simple, but the bid-ask spread is your real cost. On the order book you trade with other users and can place limit orders — usually cheaper for the same asset.",
        "Fees are not just the trading fee. Check deposit, withdrawal and transfer fees too. If you trade small amounts often, withdrawal fees dominate.",
        "Holding accounts at several exchanges is normal — listings differ, so people pick per purpose.",
      ],
    },
    cautions: {
      ja: [
        "海外取引所は日本の登録を受けていない場合があり、トラブル時に保護されない可能性がある",
        "レバレッジ取引は損失が預けた資金を超えることがある",
      ],
      en: [
        "Global exchanges may not be registered in Japan, leaving you unprotected in a dispute",
        "Margin trading can lose more than you deposited",
      ],
    },
    faq: [
      {
        q: { ja: "口座開設に費用はかかりますか？", en: "Does opening an account cost anything?" },
        a: {
          ja: "多くの国内取引所では口座開設・維持は無料です。ただし取引や出金には手数料がかかります。最新の条件は各社の公式サイトでご確認ください。",
          en: "Most Japanese exchanges do not charge to open or maintain an account, but trading and withdrawals have fees. Check each operator's official site for current terms.",
        },
      },
    ],
    readingMinutes: 7,
    relatedCoins: [],
    next: ["what-is-wallet", "crypto-tax-basics"],
  }),
  article({
    id: "what-is-wallet",
    slug: "what-is-wallet",
    level: "beginner",
    title: { ja: "ウォレットの使い方", en: "How wallets work" },
    conclusion: {
      ja: "ウォレットは通貨を「入れる」ものではなく、秘密鍵を管理する道具です。資産は常にブロックチェーン上にあり、鍵を持つ人がそれを動かせます。",
      en: "A wallet does not hold coins — it manages keys. Your assets live on the blockchain, and whoever holds the key can move them.",
    },
    keyPoints: {
      ja: [
        "ウォレットが管理するのは秘密鍵であって通貨ではない",
        "取引所に預けたままの状態は「他人に鍵を預けている」状態",
        "シードフレーズは誰にも見せない・オンラインに保存しない",
      ],
      en: [
        "A wallet manages keys, not coins",
        "Leaving assets on an exchange means someone else holds the key",
        "Never show your seed phrase to anyone or store it online",
      ],
    },
    definition: {
      ja: "ブロックチェーン上の資産を操作するための秘密鍵を保管し、取引に署名するためのソフトウェアまたは機器。",
      en: "Software or hardware that stores the private keys used to sign transactions for on-chain assets.",
    },
    body: {
      ja: [
        "ウォレットには、インターネットに接続された状態で使うホットウォレット（アプリ・ブラウザ拡張）と、鍵を専用機器に隔離するハードウェアウォレットがあります。日常的に使う分はホット、長期保有分はハードウェア、という使い分けが一般的です。",
        "シードフレーズ（12〜24語の単語列）は、鍵そのものを復元できる情報です。これを入力させようとするサイトやDM、サポートを名乗る連絡は、例外なく詐欺です。当サイトが入力を求めることも絶対にありません。",
      ],
      en: [
        "Hot wallets — apps and browser extensions — stay connected to the internet. Hardware wallets isolate the key in a dedicated device. A common split is hot for daily use, hardware for long-term holdings.",
        "A seed phrase — 12 to 24 words — can regenerate your keys. Any site, DM or 'support agent' asking for it is a scam, without exception. This site will never ask for it.",
      ],
    },
    cautions: {
      ja: [
        "シードフレーズをスクリーンショットやクラウドに保存しない",
        "検索結果の広告からウォレットをインストールしない",
        "見覚えのないNFTやトークンには触らない",
      ],
      en: [
        "Never screenshot a seed phrase or store it in the cloud",
        "Never install a wallet from a search advert",
        "Do not interact with tokens or NFTs that arrive unexpectedly",
      ],
    },
    faq: [],
    readingMinutes: 6,
    relatedCoins: [],
    next: ["security-basics", "what-is-gas"],
  }),
  article({
    id: "what-is-gas",
    slug: "what-is-gas",
    level: "intermediate",
    title: { ja: "ガス代とは", en: "What is gas?" },
    conclusion: {
      ja: "ガス代は、ブロックチェーンに処理を実行してもらうための手数料です。処理の重さと、そのときの混雑具合で決まります。",
      en: "Gas is the fee you pay to have a blockchain execute work. It depends on how heavy the work is and how busy the network is.",
    },
    keyPoints: {
      ja: [
        "処理の重さ × 単価（混雑度）で決まる",
        "混雑時は高騰する",
        "Layer 2 を使うと大きく下げられる",
      ],
      en: [
        "Work done × price per unit (congestion)",
        "Spikes when the network is busy",
        "Layer 2 cuts it substantially",
      ],
    },
    definition: {
      ja: "ブロックチェーン上で計算・保存を実行させるために支払う手数料。",
      en: "The fee paid for computation and storage on a blockchain.",
    },
    body: {
      ja: [
        "同じ「送金」でも、単純な残高移動とスマートコントラクトの実行では必要な計算量が違います。ガス代は、この計算量に単価を掛けたものです。単価は混雑度に応じて上下します。",
        "急ぎでない取引は、混雑が落ち着く時間帯まで待つだけで費用が下がることがあります。",
      ],
      en: [
        "A plain balance transfer and a contract call require very different amounts of computation. Gas is that work multiplied by a unit price, and the price floats with congestion.",
        "For anything not urgent, simply waiting for a quieter period can cut the cost substantially.",
      ],
    },
    cautions: {
      ja: ["ガス代は取引が失敗しても返ってこないことがある"],
      en: ["Gas is often consumed even when a transaction fails"],
    },
    faq: [],
    readingMinutes: 4,
    relatedCoins: ["ethereum"],
    next: ["what-is-defi"],
  }),
  article({
    id: "what-is-defi",
    slug: "what-is-defi",
    level: "intermediate",
    title: { ja: "DeFiとは", en: "What is DeFi?" },
    conclusion: {
      ja: "DeFiは、交換・貸借・運用といった金融の機能を、スマートコントラクトで提供する仕組みの総称です。口座開設なしで使える反面、トラブル時に助けてくれる相手がいません。",
      en: "DeFi is finance — swapping, lending, yield — delivered by smart contracts. No account is needed, but there is also nobody to call when something goes wrong.",
    },
    keyPoints: {
      ja: [
        "仲介者なしで交換・貸借ができる",
        "コントラクトの脆弱性リスクがある",
        "取引はすべて公開される",
      ],
      en: [
        "Swap and lend without an intermediary",
        "Contract vulnerabilities are a real risk",
        "Every transaction is public",
      ],
    },
    definition: {
      ja: "スマートコントラクトによって、仲介者を介さずに金融取引を成立させる仕組みの総称。",
      en: "Financial services executed by smart contracts without an intermediary.",
    },
    body: {
      ja: [
        "DEX（分散型取引所）での交換、レンディングプロトコルでの貸借、ステーキングによる報酬獲得などが代表的です。銀行口座や本人確認を必要とせず、ウォレットを接続すれば使えます。",
        "その代わり、誤送金・詐欺コントラクト・脆弱性による流出のいずれも、自分で防ぐしかありません。まずは失っても困らない金額で、仕組みを理解しながら試すことをおすすめします。",
      ],
      en: [
        "Typical examples are swapping on a DEX, lending through a protocol, and earning staking rewards. No bank account or KYC — connect a wallet and go.",
        "In exchange, mistaken transfers, malicious contracts and exploits are all yours to avoid. Start with an amount you can afford to lose while you learn how it behaves.",
      ],
    },
    cautions: {
      ja: [
        "高い利回りをうたうものほど、裏にあるリスクを確認する",
        "承認（approve）の棚卸しを定期的に行う",
      ],
      en: [
        "The higher the advertised yield, the harder you should look for the risk",
        "Review and revoke token approvals regularly",
      ],
    },
    faq: [],
    readingMinutes: 6,
    relatedCoins: ["ethereum"],
    next: ["what-is-staking", "security-basics"],
  }),
  article({
    id: "what-is-nft",
    slug: "what-is-nft",
    level: "beginner",
    title: { ja: "NFTとは", en: "What is an NFT?" },
    conclusion: {
      ja: "NFTは、ブロックチェーン上で「これは他と取り替えのきかない1点である」ことを示せるトークンです。所有の記録は残りますが、著作権が移るとは限りません。",
      en: "An NFT is a token that records something as a unique, non-interchangeable item. It records ownership — it does not necessarily transfer copyright.",
    },
    keyPoints: {
      ja: [
        "同じものが2つ存在しないトークン",
        "所有記録と著作権は別のもの",
        "価格変動が非常に大きい",
      ],
      en: [
        "A token with no identical twin",
        "Ownership records and copyright are different things",
        "Extremely volatile",
      ],
    },
    definition: {
      ja: "代替不可能（Non-Fungible）なトークン。個別に識別できる単位で発行される。",
      en: "A non-fungible token: issued in individually identifiable units.",
    },
    body: {
      ja: [
        "1 BTC と別の 1 BTC は交換しても同じですが、NFTはそれぞれが別物として識別されます。この性質を使って、デジタル作品・会員権・ゲーム内アイテムなどが表現されています。",
        "画像そのものがブロックチェーンに保存されているとは限らず、多くは外部のURLを参照しています。参照先が消えると画像が表示されなくなる点は、購入前に確認したい要素です。",
      ],
      en: [
        "One bitcoin is interchangeable with another; NFTs are each identified separately. That property is used to represent artwork, memberships and in-game items.",
        "The image itself is often not stored on-chain but referenced by URL. If that reference disappears, the artwork stops displaying — worth checking before buying.",
      ],
    },
    cautions: {
      ja: ["偽コレクションが多い。必ず公式のコントラクトアドレスから辿る"],
      en: [
        "Counterfeit collections are common — always navigate from the official contract address",
      ],
    },
    faq: [],
    readingMinutes: 5,
    relatedCoins: ["ethereum", "solana"],
    next: ["security-basics"],
  }),
  article({
    id: "what-is-staking",
    slug: "what-is-staking",
    level: "intermediate",
    title: { ja: "ステーキングとは", en: "What is staking?" },
    conclusion: {
      ja: "ステーキングは、Proof of Stake のネットワークに通貨を預けて運用に参加し、報酬を受け取る仕組みです。報酬は保証されず、預けた通貨の価格下落リスクは残ります。",
      en: "Staking means committing coins to help run a Proof of Stake network in return for rewards. Rewards are not guaranteed and the coin's price risk remains.",
    },
    keyPoints: {
      ja: [
        "PoSのネットワークの安全性に貢献する対価",
        "ロックアップ期間がある場合がある",
        "価格下落リスクは消えない",
      ],
      en: [
        "Compensation for helping secure a PoS network",
        "Some networks lock funds for a period",
        "Price risk does not go away",
      ],
    },
    definition: {
      ja: "Proof of Stake において、通貨を預け入れてブロック生成・検証に参加し報酬を得ること。",
      en: "Committing coins to block production and validation under Proof of Stake in exchange for rewards.",
    },
    body: {
      ja: [
        "取引所が提供するステーキングサービスを使えば、専門知識がなくても参加できます。ただし取引所に預けている以上、その事業者の信用リスクを負います。",
        "利回りの数値だけを見て判断せず、ロックアップ期間、解除にかかる日数、報酬の支払通貨を確認してください。",
      ],
      en: [
        "Exchange staking services let you take part without technical knowledge, but you take on that operator's credit risk while your coins sit there.",
        "Do not judge on headline yield alone — check the lock-up, the unbonding period and which asset the reward is paid in.",
      ],
    },
    cautions: {
      ja: ["利回りが高いほど、原資産の価格変動や事業者リスクが大きいことが多い"],
      en: ["Higher yields usually mean more price or counterparty risk, not free money"],
    },
    faq: [],
    readingMinutes: 5,
    relatedCoins: ["ethereum", "cardano", "solana"],
    next: ["what-is-defi"],
  }),
  article({
    id: "crypto-tax-basics",
    slug: "crypto-tax-basics",
    level: "intermediate",
    title: { ja: "仮想通貨の税金の基本", en: "Crypto tax basics in Japan" },
    conclusion: {
      ja: "日本では、暗号資産の売却益は原則として雑所得に区分され、総合課税の対象になります。個別の判断は税務署または税理士にご確認ください。",
      en: "In Japan, gains on crypto assets are in principle treated as miscellaneous income and taxed on an aggregate basis. Confirm your own situation with the tax office or a tax professional.",
    },
    keyPoints: {
      ja: [
        "売却時だけでなく、暗号資産同士の交換や決済利用でも損益が発生する",
        "取引履歴は年をまたいで保管しておく",
        "具体的な申告内容は専門家に確認する",
      ],
      en: [
        "Gains arise not only on sale but on crypto-to-crypto swaps and on spending",
        "Keep trade history across tax years",
        "Have a professional confirm your actual filing",
      ],
    },
    definition: {
      ja: "暗号資産の取引で生じた所得に対する課税。日本では原則として雑所得（総合課税）。",
      en: "Tax on income arising from crypto transactions. In Japan this is generally miscellaneous income under aggregate taxation.",
    },
    body: {
      ja: [
        "見落とされやすいのは、暗号資産を別の暗号資産に交換したときにも損益が確定する点です。日本円に戻していなくても課税対象になります。",
        "取引所からダウンロードできる年間取引報告書のほか、ウォレット間の送受信やDeFiの取引履歴も必要になります。損益計算ツールを使うと集計の手間を大きく減らせます。",
        "税制は変わります。当サイトの記載は一般的な整理であり、個別の判断を行うものではありません。必ず最新の情報を国税庁の公表資料でご確認ください。",
      ],
      en: [
        "The most commonly missed point: swapping one crypto asset for another realises a gain or loss even if you never convert back to yen.",
        "Beyond the annual statements exchanges provide, you will also need wallet transfers and DeFi activity. Calculation tools cut the effort substantially.",
        "Tax rules change. What is written here is a general orientation, not advice on your situation — always check the National Tax Agency's current published material.",
      ],
    },
    cautions: {
      ja: ["申告漏れは加算税・延滞税の対象になる", "当サイトの記載は税務アドバイスではない"],
      en: ["Unreported income attracts penalties and interest", "Nothing here is tax advice"],
    },
    faq: [],
    readingMinutes: 7,
    relatedCoins: [],
    next: ["how-to-choose-exchange"],
    sources: [{ label: "国税庁 タックスアンサー", url: "https://www.nta.go.jp/" }],
  }),
  article({
    id: "security-basics",
    slug: "security-basics",
    level: "beginner",
    title: { ja: "詐欺・ハッキング対策の基本", en: "Avoiding scams and hacks" },
    conclusion: {
      ja: "被害の大半は、技術的な突破ではなく「利用者に操作させる」手口で起きています。シードフレーズを入力しない、承認を放置しない、この2つで多くを防げます。",
      en: "Most losses come from tricking the user, not from breaking the cryptography. Never enter a seed phrase, and never leave approvals lying around — those two habits prevent most of it.",
    },
    keyPoints: {
      ja: [
        "シードフレーズを求めるものはすべて詐欺",
        "検索結果の広告リンクから公式サイトに入らない",
        "承認（approve）を定期的に取り消す",
        "見覚えのないトークン・NFTには触らない",
      ],
      en: [
        "Anything asking for a seed phrase is a scam",
        "Never reach an official site through a search advert",
        "Revoke token approvals periodically",
        "Do not interact with tokens or NFTs you did not expect",
      ],
    },
    definition: {
      ja: "暗号資産の保有・取引に伴う、詐欺および不正アクセスへの対策。",
      en: "Defences against fraud and unauthorised access when holding or trading crypto.",
    },
    body: {
      ja: [
        "偽サイトは、公式サイトとほぼ同じ見た目で作られます。検索結果の上位に広告として表示されることもあるため、URLをブックマークしておく習慣が有効です。",
        "「サポート」を名乗るDMは、ほぼすべて詐欺です。公式のサポートから先に個別DMが来ることは通常ありません。",
        "資産が増えてきたら、日常使いのウォレットと保管用のウォレットを分けてください。片方が侵害されても、全額を失わずに済みます。",
      ],
      en: [
        "Phishing sites are near-perfect copies, and they buy adverts to sit above the real site in search results. Bookmarking the real URL is a cheap, effective habit.",
        "A DM from 'support' is almost always a scam. Official support does not message you first.",
        "Once holdings grow, split a daily-use wallet from a storage wallet so that one compromise does not take everything.",
      ],
    },
    cautions: {
      ja: ["当サイトが秘密鍵・シードフレーズの入力を求めることは絶対にありません"],
      en: ["This site will never ask for your private key or seed phrase"],
    },
    faq: [
      {
        q: {
          ja: "取引所に置いたままでも大丈夫ですか？",
          en: "Is it safe to leave assets on an exchange?",
        },
        a: {
          ja: "取引所は分別管理やコールドウォレットで保護していますが、事業者の破綻や不正アクセスのリスクはゼロにはなりません。金額が大きくなったら、自己管理のウォレットへ移すことも検討してください。",
          en: "Exchanges use segregated custody and cold storage, but operator failure and intrusion risk never reach zero. As holdings grow, consider moving some into a wallet you control.",
        },
      },
    ],
    readingMinutes: 7,
    relatedCoins: [],
    next: ["what-is-wallet"],
  }),
  article({
    id: "what-is-web3",
    slug: "what-is-web3",
    level: "intermediate",
    title: { ja: "Web3.0とは", en: "What is Web3?" },
    conclusion: {
      ja: "Web3.0は、サービス提供者のサーバーではなくブロックチェーン上にデータと権利を置き、利用者が自分のアカウントを持ち運べるようにしようという考え方の総称です。",
      en: "Web3 is the idea of putting data and rights on a blockchain rather than a provider's servers, so users can carry their account between services.",
    },
    keyPoints: {
      ja: [
        "アカウントがウォレットに紐づく",
        "サービスをまたいで資産を持ち運べる",
        "定義は論者によって幅がある",
      ],
      en: [
        "Accounts are tied to a wallet",
        "Assets move between services",
        "The definition varies by who is speaking",
      ],
    },
    definition: {
      ja: "ブロックチェーンを基盤とし、利用者がデータと資産の管理権を持つことを志向するWebのあり方。",
      en: "A model of the web built on blockchains in which users hold control of their data and assets.",
    },
    body: {
      ja: [
        "従来のサービスでは、アカウントも保有物も提供者のデータベースの中にあります。Web3.0では、それをウォレットに紐づけることで、サービスをまたいで持ち運べるようにします。",
        "一方で、鍵の管理を利用者自身が担うことになり、復旧手段がありません。利便性と自己責任のトレードオフがあることを理解して使う必要があります。",
      ],
      en: [
        "In conventional services, your account and everything in it lives in the provider's database. Web3 ties them to a wallet so they move with you.",
        "The trade-off is that key management becomes yours, with no recovery path. Convenience is exchanged for responsibility.",
      ],
    },
    cautions: {
      ja: ["「Web3」を掲げるだけの実体のないプロジェクトも多い"],
      en: ["Plenty of projects wear the Web3 label without shipping anything"],
    },
    faq: [],
    readingMinutes: 5,
    relatedCoins: [],
    next: ["what-is-defi", "what-is-dao"],
  }),
  article({
    id: "what-is-dao",
    slug: "what-is-dao",
    level: "advanced",
    title: { ja: "DAOとは", en: "What is a DAO?" },
    conclusion: {
      ja: "DAOは、意思決定と資金の執行をスマートコントラクトとトークン投票で行う組織形態です。透明性は高い一方、投票権の集中や法的な位置づけの曖昧さという課題があります。",
      en: "A DAO runs decisions and treasury execution through smart contracts and token voting. It is transparent, but voting power concentrates and its legal status is unsettled.",
    },
    keyPoints: {
      ja: [
        "提案と投票がオンチェーンで記録される",
        "資金の執行がコントラクトで自動化される",
        "投票権が偏りやすい",
      ],
      en: [
        "Proposals and votes are recorded on-chain",
        "Treasury execution is automated by contract",
        "Voting power tends to concentrate",
      ],
    },
    definition: {
      ja: "Decentralized Autonomous Organization。トークン保有者の投票により運営される組織。",
      en: "A Decentralized Autonomous Organization: an entity governed by token-holder votes.",
    },
    body: {
      ja: [
        "提案・議論・投票・執行の流れが公開されるため、外部からも意思決定の経緯を追えます。プロトコルの手数料率変更や資金の配分などが典型的な議題です。",
        "ただし、トークンを多く持つ主体の影響力が大きくなるため、実質的には少数で決まることもあります。参加する前に、投票権の分布を確認してください。",
      ],
      en: [
        "Proposal, debate, vote and execution are all public, so outsiders can follow how a decision was made. Typical topics are fee changes and treasury allocation.",
        "But influence follows token holdings, so decisions can effectively rest with a few holders. Check the distribution of voting power before joining.",
      ],
    },
    cautions: {
      ja: ["日本の法制度上の位置づけは確立していない"],
      en: ["Their legal status in Japan is not settled"],
    },
    faq: [],
    readingMinutes: 5,
    relatedCoins: [],
    next: ["what-is-web3"],
  }),
];

export const learnById = new Map(learnArticles.map((entry) => [entry.id, entry]));
export const learnBySlug = new Map(learnArticles.map((entry) => [entry.slug, entry]));

export function getLearnArticle(idOrSlug: string): LearnArticle | undefined {
  return learnById.get(idOrSlug) ?? learnBySlug.get(idOrSlug);
}

export function learnByLevel(level: LearnArticle["level"]): LearnArticle[] {
  return learnArticles.filter((entry) => entry.level === level);
}
