/**
 * 初心者向け学習コンテンツ。
 *
 * 生成AIが引用しやすいよう「結論 → 根拠 → 注意点」の順で書きます。
 */
import type { Guide } from "./types";

export const guides: Guide[] = [
  {
    id: "guide-first",
    slug: "how-to-choose-first-card",
    title: { ja: "はじめてのクレジットカードの選び方", en: "How to choose your first credit card" },
    lead: {
      ja: "決める順番さえ間違えなければ、比較は3ステップで終わります。",
      en: "Get the order right and the comparison takes three steps.",
    },
    level: "beginner",
    readingMinutes: 6,
    authorId: "author-hayama",
    relatedCardIds: ["nova-zero", "hoshimart-plus", "linkmobile-one"],
    updatedOn: "2026-07-14",
    sections: [
      {
        heading: {
          ja: "結論：年会費 → 還元率 → 使う場所 の順で決める",
          en: "The short answer: fee, then rate, then where you spend",
        },
        body: {
          ja: [
            "最初に年会費で候補を絞ります。「永年無料」だけを残せば、選択肢は一気に減ります。",
            "次に基本還元率を見ます。1.0%以上あれば、日常的な支払いで十分に貯まります。",
            "最後に、自分がよく使う店で還元率が上がるかを確認します。ここまで決まれば候補は2〜3枚になります。",
          ],
          en: [
            "Filter on annual fee first. Keeping only 'free for life' cards shrinks the field immediately.",
            "Then look at the base rate. At 1.0% or above, everyday spending adds up well enough.",
            "Finally, check whether the rate rises where you actually shop. By then you are down to two or three candidates.",
          ],
        },
      },
      {
        heading: { ja: "還元率の落とし穴", en: "Where reward rates mislead" },
        body: {
          ja: [
            "「最大◯%」は、条件をすべて満たした場合の数値です。対象店舗・決済手段・月間上限のいずれかを外すと届きません。",
            "月間の付与上限がある場合、その上限を超えた分は基本還元率に戻ります。実質還元率は上限を含めて計算してください。",
            "対象店舗が限られる高還元カードは、その店をよく使う人にとってだけ有利です。",
          ],
          en: [
            "'Up to X%' assumes every condition is met. Miss the merchant, the payment method or the monthly cap and you never reach it.",
            "Once you hit a monthly cap, spending reverts to the base rate. Work out the effective rate with the cap included.",
            "A boost confined to a few merchants only helps people who shop there.",
          ],
        },
      },
      {
        heading: { ja: "注意点", en: "Things to watch" },
        body: {
          ja: [
            "審査の通過を保証する情報はありません。「必ず作れる」と書かれた情報には根拠がありません。",
            "リボ払いは手数料が高く、残高が減りにくい仕組みです。初期設定がリボになっていないか必ず確認してください。",
            "使わないカードを持ち続けるより、年に一度は保有枚数を見直すほうが管理しやすくなります。",
          ],
          en: [
            "Nobody can guarantee approval. Claims that you will 'definitely' be approved have no basis.",
            "Revolving credit is expensive and slow to pay down. Check that your card is not set to it by default.",
            "Reviewing how many cards you hold once a year is easier than carrying ones you never use.",
          ],
        },
      },
    ],
  },
  {
    id: "guide-point",
    slug: "points-basics",
    title: {
      ja: "ポイントの基本と、貯める前に決めること",
      en: "Points basics, and what to decide before you start",
    },
    lead: {
      ja: "交換先を先に決めると、還元率の比較が初めて意味を持ちます。",
      en: "Pick the redemption first and reward-rate comparisons start to mean something.",
    },
    level: "beginner",
    readingMinutes: 5,
    authorId: "author-hayama",
    relatedCardIds: ["nova-flux", "meridian-sky"],
    updatedOn: "2026-07-10",
    sections: [
      {
        heading: {
          ja: "結論：1ポイントの価値は交換先で変わる",
          en: "The short answer: a point's value depends on the redemption",
        },
        body: {
          ja: [
            "現金・ギフト券への交換は1ポイント＝1円が基準です。",
            "景品との交換では0.6円程度まで下がることがあります。",
            "マイル移行は移行レート次第で0.5円にも1円以上にもなります。",
          ],
          en: [
            "Cash and gift cards set the ¥1-per-point baseline.",
            "Merchandise can fall to around ¥0.6.",
            "Mile transfers swing from ¥0.5 to over ¥1 depending on the transfer rate.",
          ],
        },
      },
      {
        heading: { ja: "有効期限の考え方", en: "Thinking about expiry" },
        body: {
          ja: [
            "「最終利用から1年」型は、使い続ける限り失効しません。",
            "「獲得から2年」型は、貯めっぱなしにすると古い分から失効します。",
            "有効期限が短いポイントは、貯める前に使い道を決めておくのが確実です。",
          ],
          en: [
            "A 'one year from last activity' clock never runs out while you keep using the card.",
            "A 'two years from earning' clock expires the oldest points if you just accumulate.",
            "For short-lived points, decide the redemption before you start collecting.",
          ],
        },
      },
    ],
  },
  {
    id: "guide-mile",
    slug: "miles-basics",
    title: { ja: "マイルの基本と、注意しておくこと", en: "Mileage basics and the caveats" },
    lead: {
      ja: "マイルは「貯めた時点の価値」で固定されません。",
      en: "Miles are not locked to the value they had when you earned them.",
    },
    level: "intermediate",
    readingMinutes: 6,
    authorId: "author-hayama",
    relatedCardIds: ["meridian-sky", "aurum-platinum", "nova-travel"],
    updatedOn: "2026-06-24",
    sections: [
      {
        heading: {
          ja: "結論：目的の路線を先に決める",
          en: "The short answer: pick the route first",
        },
        body: {
          ja: [
            "特典航空券の必要マイル数は路線・時期・座席クラスで変わります。",
            "必要マイル数は航空会社の規定改定で変わることがあります。改定されると、同じマイル数で交換できる範囲が狭まります。",
            "移行レートが1ポイント＝1マイルでも、必要マイル数が多い路線では実質価値は下がります。",
          ],
          en: [
            "Award requirements vary by route, season and cabin.",
            "Airlines revise their charts, and when they do, the same balance buys less.",
            "Even at a 1:1 transfer, a route with a high requirement gives you less real value.",
          ],
        },
      },
      {
        heading: { ja: "移行手数料を見落とさない", en: "Do not overlook transfer fees" },
        body: {
          ja: [
            "ポイントからマイルへの移行に手数料がかかるカードがあります。",
            "年1回無料でも、2回目以降に手数料がかかる場合は、まとめて移行するほうが有利です。",
          ],
          en: [
            "Some cards charge to convert points into miles.",
            "Where one transfer a year is free, converting in a single batch beats converting piecemeal.",
          ],
        },
      },
    ],
  },
  {
    id: "guide-business",
    slug: "business-card-basics",
    title: {
      ja: "法人カード・個人事業主カードの基本",
      en: "Business and sole-proprietor card basics",
    },
    lead: {
      ja: "還元率より、経費管理の手間がどれだけ減るかで選びます。",
      en: "Choose on how much bookkeeping effort it removes, not on the reward rate.",
    },
    level: "intermediate",
    readingMinutes: 7,
    authorId: "author-mizuki",
    relatedCardIds: ["orbit-solo", "orbit-business", "orbit-business-gold"],
    updatedOn: "2026-07-08",
    sections: [
      {
        heading: {
          ja: "結論：会計ソフト連携と追加カード枚数で決まる",
          en: "The short answer: accounting integration and additional cards decide it",
        },
        body: {
          ja: [
            "経費をカードに寄せる目的は、還元よりも記帳の自動化です。",
            "従業員に持たせるなら、追加カードの発行枚数と年会費を確認します。",
            "支払いサイトが長いカードは、仕入れや広告費の立替が多い事業ほど効きます。",
          ],
          en: [
            "The point of routing expenses through a card is automated bookkeeping, not rewards.",
            "If employees need cards, check how many you can issue and at what fee.",
            "Long payment terms matter most when you front inventory or advertising spend.",
          ],
        },
      },
      {
        heading: { ja: "注意点", en: "Things to watch" },
        body: {
          ja: [
            "「決算書不要」は「審査なし」ではありません。",
            "会計ソフト連携は、ソフト側の契約プランによって利用できない場合があります。",
            "還元されたポイントの会計・税務上の取扱いは、税理士にご確認ください。",
          ],
          en: [
            "'No statements required' is not 'no review'.",
            "Accounting integrations may be unavailable on your software plan.",
            "Ask a tax professional how rewards should be booked and taxed.",
          ],
        },
      },
    ],
  },
  {
    id: "guide-security",
    slug: "card-security-basics",
    title: { ja: "カードを安全に使うための基本", en: "Using a card safely" },
    lead: {
      ja: "不正利用は「起きる前提」で備えるほうが被害を抑えられます。",
      en: "Assume fraud will happen and the damage stays small.",
    },
    level: "beginner",
    readingMinutes: 5,
    authorId: "editorial",
    relatedCardIds: ["orbit-virtual"],
    updatedOn: "2026-07-01",
    sections: [
      {
        heading: {
          ja: "結論：番号を分け、通知を有効にする",
          en: "The short answer: split your numbers and turn on alerts",
        },
        body: {
          ja: [
            "ネット通販や海外サイトには、バーチャルカード番号を使い分けます。漏えいの影響を1つの番号に限定できます。",
            "利用通知を有効にすると、不正利用に早く気づけます。",
            "明細は月1回でも必ず確認してください。",
          ],
          en: [
            "Use separate virtual numbers online and abroad so a leak stays contained.",
            "Turn on transaction alerts to spot fraud quickly.",
            "Review your statement at least monthly.",
          ],
        },
      },
      {
        heading: { ja: "絶対にしないこと", en: "Never do this" },
        body: {
          ja: [
            "メールやSMSのリンクから、カード番号やセキュリティコードを入力しない。",
            "電話で暗証番号を伝えない。カード会社が電話で暗証番号を聞くことはありません。",
            "本人確認書類の画像を、チャットやSNSのメッセージで送らない。",
          ],
          en: [
            "Never enter a card number or security code via a link in an email or SMS.",
            "Never give a PIN over the phone — issuers do not ask for it.",
            "Never send photos of identity documents through chat or social messages.",
          ],
        },
      },
    ],
  },
  {
    id: "guide-web3",
    slug: "web3-payment-basics",
    title: { ja: "Web3.0決済の基本とリスク", en: "Web3 payment basics and risks" },
    lead: {
      ja: "決済手段としての利便性と、資産としてのリスクは分けて考えます。",
      en: "Separate its convenience as a payment rail from its risk as an asset.",
    },
    level: "advanced",
    readingMinutes: 7,
    authorId: "editorial",
    relatedCardIds: ["chainbridge-flow", "chainbridge-nova"],
    updatedOn: "2026-06-20",
    sections: [
      {
        heading: {
          ja: "結論：生活費の決済を依存させない",
          en: "The short answer: do not make it your only way to pay",
        },
        body: {
          ja: [
            "地域制限やサービス停止が予告なく起きうるため、代替手段を必ず持ってください。",
            "還元が暗号資産の場合、受け取った時点の価格で価値が決まり、その後も変動します。",
            "多くのサービスはカストディ型で、資産はサービス提供会社が保管しています。",
          ],
          en: [
            "Geo-restrictions and suspensions can arrive without notice, so always keep an alternative.",
            "Crypto rewards are valued when received and keep moving afterwards.",
            "Most services are custodial: the provider holds the assets, not you.",
          ],
        },
      },
      {
        heading: { ja: "税務の取扱い", en: "Tax treatment" },
        body: {
          ja: [
            "暗号資産の売却・交換により生じた利益は課税対象となる場合があります。",
            "取扱いは個別の事情で変わるため、税理士にご確認ください。当サイトでは税務相談には応じられません。",
          ],
          en: [
            "Gains from selling or swapping crypto may be taxable.",
            "Treatment depends on your circumstances — consult a tax professional. We cannot give tax advice.",
          ],
        },
      },
    ],
  },
];

const guideMap = new Map(guides.map((guide) => [guide.slug, guide]));

export function getGuide(slug: string) {
  return guideMap.get(slug);
}
