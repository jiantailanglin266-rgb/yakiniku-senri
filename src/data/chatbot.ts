/**
 * チャットボットの応答データ。
 *
 * ■ 方針
 *   AI（大規模言語モデル）は使っていません。営業時間・価格・定休日を
 *   誤って答えると来店後のトラブルに直結するため、
 *   **確認済みの事実だけを、決まった文面で返す**設計にしています。
 *
 * ■ 未確認の話題も「意図」としては拾います
 *   個室・支払い方法など未確認の話題は、黙って無視するより
 *   「確認できていないのでお電話ください」と正直に答えるほうが親切です。
 *
 * ■ 回答を追加・修正するときは
 *   answer には必ずサイトに掲載済みの事実だけを書いてください。
 *   推測で書くと、42言語へ翻訳されてそのまま拡散します。
 */

import { owner } from "./content";
import { recommendedItems, formatPrice } from "./menu";
import { store } from "./store";

export type ChatLink = {
  label: string;
  href: string;
  /** 電話・外部サイトなど、Next.js のルーティングを通さないリンク */
  external?: boolean;
};

export type ChatIntent = {
  id: string;
  /** 候補ボタンに出す短い質問文 */
  label: string;
  /** 入力の照合に使う語（表記ゆれ・英語を含める） */
  keywords: string[];
  answer: string;
  links?: ChatLink[];
  /** 候補ボタンとして最初から出すか */
  suggested?: boolean;
};

const hoursText = store.businessHours
  .map((hour) => `${hour.label} ${hour.value}（L.O. ${hour.lastOrder}）`)
  .join("\n");

const accessText = store.access.map((route) => `${route.label}${route.value}`).join("\n");

const recommendText = recommendedItems
  .map((item) => `・${item.name}　${formatPrice(item.price)}`)
  .join("\n");

/** 未確認の話題に共通で返す文面 */
const UNCONFIRMED =
  "申し訳ありません、こちらではご案内できる情報がございません。お電話にてご確認ください。";

const reserveLink: ChatLink = { label: "電話をかける", href: store.phoneHref, external: true };

export const chatIntents: ChatIntent[] = [
  {
    id: "hours",
    label: "営業時間は？",
    suggested: true,
    keywords: [
      "営業時間",
      "何時",
      "いつまで",
      "開店",
      "閉店",
      "ラストオーダー",
      "ラスオー",
      "l.o",
      "オープン",
      "やってる",
      "やっている",
      "開いて",
      "時間",
      "hours",
      "open",
      "close",
      "opening",
    ],
    answer: `営業時間は次のとおりです。\n\n${hoursText}\n\n定休日は${store.closed}です。`,
    links: [{ label: "アクセス・営業時間を見る", href: "/access" }],
  },
  {
    id: "closed",
    label: "定休日は？",
    suggested: true,
    keywords: ["定休", "休み", "休業", "やすみ", "closed", "holiday", "day off"],
    answer: `定休日は${store.closed}です。祝日等により変更となる場合がありますので、お知らせページもあわせてご確認ください。`,
    links: [{ label: "お知らせを見る", href: "/news" }],
  },
  {
    id: "reserve",
    label: "予約したい",
    suggested: true,
    keywords: [
      "予約",
      "よやく",
      "席をとりたい",
      "空いて",
      "空席",
      "取りたい",
      "reserve",
      "reservation",
      "book",
      "booking",
    ],
    answer: `ご予約はお電話にて承っております。\n\n${store.phone}\n\nご希望の日時・人数・お名前をお伝えください。`,
    links: [reserveLink, { label: "お問い合わせを見る", href: "/contact" }],
  },
  {
    id: "access",
    label: "場所・行き方",
    suggested: true,
    keywords: [
      "場所",
      "住所",
      "どこ",
      "行き方",
      "アクセス",
      "最寄り",
      "駅",
      "地図",
      "道順",
      "何分",
      "駒沢",
      "駒澤",
      "若林",
      "駒留",
      "上馬",
      "access",
      "where",
      "address",
      "station",
      "map",
      "how to get",
    ],
    answer: `${store.addressFull}\n\n${accessText}`,
    links: [
      { label: "アクセスを見る", href: "/access" },
      { label: "Google Mapsで見る", href: "__MAP__", external: true },
    ],
  },
  {
    id: "parking",
    label: "駐車場はある？",
    suggested: true,
    keywords: ["駐車", "車", "パーキング", "とめ", "停め", "parking", "car"],
    answer: `${store.parking}`,
    links: [reserveLink],
  },
  {
    id: "menu",
    label: "おすすめは？",
    suggested: true,
    keywords: [
      "おすすめ",
      "オススメ",
      "人気",
      "名物",
      "何が",
      "メニュー",
      "お品書き",
      "料理",
      "recommend",
      "menu",
      "popular",
      "signature",
    ],
    answer: `当店の看板は次の3品です。\n\n${recommendText}\n\nそのほか、牛肉・ホルモン・一品料理・キムチ・スープ・麺・デザートもご用意しています。`,
    links: [{ label: "お品書きを見る", href: "/menu" }],
  },
  {
    id: "momi",
    label: "もみシリーズって？",
    suggested: true,
    keywords: ["もみ", "揉み", "タレ", "たれ", "秘伝", "momi", "sauce"],
    answer:
      "「もみシリーズ」は、先代から受け継いだ門外不出の秘伝のタレをもみ込んでお出しする当店の名物です。もみタン・もみハラミ・もみカルビがあり、三種盛り合わせで食べ比べていただけます。",
    links: [
      { label: "お品書きを見る", href: "/menu" },
      { label: "こだわりを見る", href: "/commitment" },
    ],
  },
  {
    id: "price",
    label: "価格は税込？",
    keywords: ["税込", "税別", "税", "価格", "値段", "いくら", "料金", "price", "tax", "cost"],
    answer: store.priceTaxIncluded
      ? "お品書きに掲載している価格はすべて税込表示です。仕入れ状況により、内容・価格が変更となる場合があります。"
      : "お品書きに掲載している価格はすべて税別表示です。仕入れ状況により、内容・価格が変更となる場合があります。",
    links: [{ label: "お品書きを見る", href: "/menu" }],
  },
  {
    id: "budget",
    label: "予算の目安は？",
    keywords: ["予算", "いくらくらい", "客単価", "相場", "budget", "how much"],
    answer: `お一人あたりの目安は、お電話にてご確認ください。\n\n${store.phone}`,
    links: [reserveLink, { label: "お品書きで価格を見る", href: "/menu" }],
  },
  {
    id: "takeout",
    label: "テイクアウトは？",
    suggested: true,
    keywords: [
      "テイクアウト",
      "持ち帰り",
      "持帰り",
      "お持ち帰り",
      "宅配",
      "デリバリー",
      "バーベキュー",
      "bbq",
      "takeout",
      "take out",
      "takeaway",
      "delivery",
    ],
    answer:
      "テイクアウトを承っております。バーベキューやホームパーティー、誕生日会、ご家族でのお食事などにご活用ください。ご注文・ご相談はお電話にて承ります。",
    links: [{ label: "テイクアウトを見る", href: "/takeout" }, reserveLink],
  },
  {
    id: "phone",
    label: "電話番号は？",
    keywords: ["電話", "番号", "でんわ", "tel", "phone", "call", "number"],
    answer: `お電話は ${store.phone} です。営業時間内にご連絡ください。`,
    links: [reserveLink],
  },
  {
    id: "history",
    label: "お店の歴史は？",
    keywords: ["創業", "歴史", "老舗", "何年", "いつから", "founded", "history", "since"],
    answer: `${store.founded}年の創業です。東京都世田谷区上馬で、先代から受け継いだ味を守り続けています。`,
    links: [
      { label: "当店について", href: "/about" },
      { label: "オーナー紹介", href: "/owner" },
    ],
  },
  {
    id: "owner",
    label: "オーナーについて",
    keywords: ["オーナー", "店主", "シェフ", "三代目", "ソヘグム", "owner", "chef"],
    answer: `${owner.role}の${owner.name}（${owner.nameReading}）です。先代から受け継いだ味を守りながら、朝鮮半島の伝統弦楽器ソヘグムの奏者としても活動しています。`,
    links: [{ label: "オーナー紹介を見る", href: "/owner" }],
  },

  /* ── ここから下は、サイトに情報がない話題です。
        黙って無視せず、正直にお電話へご案内します。 ────────────── */
  {
    id: "seats",
    label: "個室・席について",
    keywords: [
      "個室",
      "座敷",
      "掘りごたつ",
      "カウンター",
      "席",
      "何名",
      "何人",
      "人数",
      "貸切",
      "宴会",
      "private room",
      "seat",
      "table",
    ],
    answer: `${UNCONFIRMED}\n\n${store.phone}`,
    links: [reserveLink],
  },
  {
    id: "payment",
    label: "支払い方法は？",
    keywords: [
      "支払",
      "払い",
      "カード",
      "クレジット",
      "現金",
      "電子マネー",
      "paypay",
      "qr",
      "payment",
      "credit card",
      "cash",
    ],
    answer: `${UNCONFIRMED}\n\n${store.phone}`,
    links: [reserveLink],
  },
  {
    id: "kids",
    label: "子連れでも大丈夫？",
    keywords: [
      "子連れ",
      "子ども",
      "子供",
      "こども",
      "ベビーカー",
      "赤ちゃん",
      "ペット",
      "犬",
      "kids",
      "children",
      "baby",
      "stroller",
      "pet",
    ],
    answer: `${UNCONFIRMED}\n\n${store.phone}`,
    links: [reserveLink],
  },
  {
    id: "allergy",
    label: "アレルギー対応は？",
    keywords: [
      "アレルギー",
      "ベジタリアン",
      "ヴィーガン",
      "ハラル",
      "苦手",
      "抜いて",
      "allergy",
      "vegetarian",
      "vegan",
      "halal",
    ],
    answer: `${UNCONFIRMED}\n\n${store.phone}`,
    links: [reserveLink],
  },
  {
    id: "course",
    label: "コース・飲み放題は？",
    keywords: [
      "コース",
      "飲み放題",
      "食べ放題",
      "ランチ",
      "セット",
      "course",
      "all you can",
      "lunch",
      "buffet",
    ],
    answer: `${UNCONFIRMED}\n\n${store.phone}`,
    links: [reserveLink, { label: "お品書きを見る", href: "/menu" }],
  },
];

/** 入力が理解できなかったときの案内 */
export const chatFallback = {
  answer: `申し訳ありません、うまく聞き取れませんでした。\n下の候補からお選びいただくか、お電話にてお問い合わせください。\n\n${store.phone}`,
  links: [reserveLink, { label: "よくあるご質問を見る", href: "/access" }],
};

/** 最初のあいさつ */
export const chatGreeting = `${store.name}です。ご質問をどうぞ。\n下の候補からもお選びいただけます。`;

/** 候補ボタンに出す質問 */
export const suggestedIntents = chatIntents.filter((intent) => intent.suggested);
