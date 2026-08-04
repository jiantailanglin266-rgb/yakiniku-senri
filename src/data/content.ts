/**
 * サイト本文コンテンツ（ブランドストーリー／こだわり／オーナー／テイクアウト／FAQ）。
 * 文言は既存サイト（yakinikusenri.com）の掲載内容をもとに整理・再構成しています。
 * 未確認の事実は追加していません。
 */
import { media } from "./media";
import { store } from "./store";

export type StoryBlock = {
  id: string;
  /** 背景の大きな英字 */
  watermark: string;
  headingEn: string;
  heading: string;
  body: string[];
  image: (typeof media.story)[keyof typeof media.story];
};

export const storyBlocks: StoryBlock[] = [
  {
    id: "since-1965",
    watermark: "SINCE 1965",
    headingEn: "SINCE 1965",
    heading: "創業から六十余年、\n変わらない確かな味。",
    body: [
      `${store.founded}年の創業以来、世田谷の地で焼肉をお出ししてきました。二代目、三代目へと引き継がれた今も、変わらない確かな味でおもてなしいたします。`,
      "時代とともに街の景色は移り変わっても、炭に火を入れ、肉を焼き、囲んで食べる時間そのものは変わりません。その時間を、これからも大切にしていきます。",
    ],
    image: media.story.history,
  },
  {
    id: "legacy",
    watermark: "LEGACY",
    headingEn: "LEGACY",
    heading: "先代から受け継いだ、\n門外不出の秘伝のタレ。",
    body: [
      "先代より受け継がれ続けてきた秘伝のタレをもみ込み、味付けしたお肉。これが千里の原点です。",
      "レシピは門外不出。代替わりのたびに手から手へと受け渡され、今も同じ味を守り続けています。",
    ],
    image: media.story.sauce,
  },
  {
    id: "setagaya",
    watermark: "SETAGAYA",
    headingEn: "SETAGAYA",
    heading: "家族と、友と、同僚と。\n世田谷で愛されてきた店。",
    body: [
      "ご家族での食事会、気の置けない友人との集まり、仕事帰りの一杯。世田谷・上馬で、さまざまな時間をお迎えしてきました。",
      "ゆったりと広い店内で、肩肘張らずに過ごしていただけます。当店でしか味わえない逸品を豊富にご用意してお待ちしております。",
    ],
    image: media.story.family,
  },
];

export type Commitment = {
  id: string;
  number: string;
  headingEn: string;
  heading: string;
  body: string;
  image: (typeof media.commitment)[keyof typeof media.commitment];
  href: string;
};

export const commitments: Commitment[] = [
  {
    id: "legacy",
    number: "01",
    headingEn: "LONG-LOVED",
    heading: "世田谷の地で愛され続ける老舗",
    body: `${store.founded}年の創業から六十余年。二代目、三代目へと引き継がれながら、世田谷・上馬でご愛顧いただいてきました。地元の常連の方から、初めての方まで。変わらない味でお迎えします。`,
    image: media.commitment.legacy,
    href: "/about",
  },
  {
    id: "sauce",
    number: "02",
    headingEn: "SECRET SAUCE",
    heading: "創業より守り続けた秘伝のタレ",
    body: "先代より受け継がれ続けてきた、門外不出の秘伝のタレ。仕込みの段階で肉にもみ込み、味を芯まで行き渡らせます。千里の味の核心です。",
    image: media.commitment.sauce,
    href: "/commitment",
  },
  {
    id: "momi",
    number: "03",
    headingEn: "MOMI SERIES",
    heading: "千里名物「もみシリーズ」",
    body: "秘伝のタレをもみ込んだ、千里名物のもみシリーズ。もみタン、もみハラミ、もみカルビ。三種盛り合わせで食べ比べていただくのがおすすめです。",
    image: media.commitment.momi,
    href: "/menu#momi",
  },
  {
    id: "space",
    number: "04",
    headingEn: "OUR SPACE",
    heading: "ゆったり過ごせるアットホームな空間",
    body: "ゆったり広々としたアットホームな空間。ご家族でのお食事から、友人・同僚との集まりまで、気兼ねなくお過ごしいただけます。",
    image: media.commitment.space,
    href: "/about",
  },
];

export const owner = {
  role: "三代目オーナーシェフ",
  name: "河 明樹",
  nameReading: "ハ ミョンス",
  headingEn: "OWNER",
  heading: "三代目が受け継ぐ、\n焼肉と音楽の心。",
  lead: "焼肉 千里の三代目オーナーシェフ。先代から受け継いだ秘伝のタレと味を守りながら、朝鮮半島の伝統弦楽器ソヘグム（奚琴）の奏者としても活動しています。",
  body: [
    "焼肉店を受け継ぐ者として、創業から変わらない味を守り続けています。仕込みも焼き場も、日々の一皿に向き合う姿勢は先代から引き継いだものです。",
    "同時に、朝鮮半島の伝統弦楽器ソヘグムの奏者としても活躍しています。店の味と音楽、そのどちらもが千里の三代目を形づくっています。",
  ],
  works: [
    {
      title: "時代劇『鬼平外伝 最終章 四度目の女房』",
      note: "片岡愛之助主演。テーマ曲のメイン演奏を担当。",
    },
    {
      title: "映画『無限の住人』",
      note: "木村拓哉主演。音楽制作に参加。",
    },
    {
      title: "NHK時代劇『おいち不思議がたり』",
      note: "音楽制作に参加。",
    },
    {
      title: "映画『焼肉ドラゴン』",
      note: "音楽制作に参加。",
    },
  ],
  image: media.owner,
};

export const takeout = {
  headingEn: "TAKEOUT",
  heading: "千里の味を、ご家庭でも。",
  lead: "千里のメニューを気軽にご家庭で楽しんでいただけるよう、テイクアウトをはじめました。",
  body: [
    "バーベキューやホームパーティー、誕生日会、ご家族でのお食事などにご活用ください。",
    "ご注文・ご相談はお電話にて承っております。ご希望の品目やお受け取り時間を、お気軽にお問い合わせください。",
  ],
  scenes: [
    { label: "バーベキュー", note: "屋外でも千里の味を。" },
    { label: "ホームパーティー", note: "人数に合わせてご相談ください。" },
    { label: "誕生日会", note: "特別な日の食卓に。" },
    { label: "ご家族での食事", note: "いつもの夕食を少し贅沢に。" },
  ],
  image: media.takeout,
};

export type Faq = {
  question: string;
  answer: string;
};

/**
 * FAQ — 画面に表示している内容のみを FAQPage 構造化データとして出力します。
 * 未確認の内容は追加しないでください。
 */
export const faqs: Faq[] = [
  {
    question: "予約はできますか？",
    answer: `ご予約はお電話（${store.phone}）にて承っております。営業時間内にご連絡ください。`,
  },
  {
    question: "定休日はいつですか？",
    answer: `定休日は${store.closed}です。祝日等により変更となる場合がありますので、お知らせページもあわせてご確認ください。`,
  },
  {
    question: "駐車場はありますか？",
    answer: store.parking,
  },
  {
    question: "最寄り駅はどこですか？",
    answer: store.access.map((a) => `${a.label}${a.value}`).join("、") + "です。",
  },
  {
    question: "テイクアウトはできますか？",
    answer:
      "テイクアウトを承っております。バーベキューやホームパーティー、誕生日会などにご活用ください。ご注文・ご相談はお電話にてお問い合わせください。",
  },
  {
    question: "何時まで営業していますか？",
    answer: `平日と土曜日は22:30まで（ラストオーダー21:45）、日曜・祝日は22:00まで（ラストオーダー21:30）です。定休日は${store.closed}です。`,
  },
  {
    question: "日曜日・祝日も営業していますか？",
    answer:
      "日曜・祝日も営業しております。開店は17:00、閉店は22:00（ラストオーダー21:30）と、平日より30分早く閉店します。",
  },
  {
    question: "何年創業のお店ですか？",
    answer: `${store.founded}年の創業です。東京都世田谷区上馬で、先代から受け継いだ味を守り続けています。`,
  },
  {
    question: "名物の「もみシリーズ」とは何ですか？",
    answer:
      "秘伝のタレをもみ込んでから提供する、当店の名物です。もみタン・もみハラミ・もみカルビがあり、三種盛り合わせで食べ比べていただけます。",
  },
  {
    question: "秘伝のタレとはどのようなものですか？",
    answer:
      "先代より受け継がれてきた門外不出のタレです。レシピは公開しておらず、代替わりのたびに手から手へと受け渡され、創業当時と同じ味を守っています。",
  },
  {
    question: "初めてでも失敗しない、おすすめの注文は何ですか？",
    answer:
      "名物の「もみ三種盛り合わせ」、きめ細やかな「上ロース」、熱々の「石焼チーズフォンデュ」の3品が当店の看板です。まずはこの組み合わせをおすすめしています。",
  },
  {
    question: "表示価格は税込ですか、税別ですか？",
    answer: store.priceTaxIncluded
      ? "お品書きに掲載している価格はすべて税込表示です。仕入れ状況により、内容・価格が変更となる場合があります。"
      : "お品書きに掲載している価格はすべて税別表示です。仕入れ状況により、内容・価格が変更となる場合があります。",
  },
  {
    question: "駒澤大学駅からどう行けばよいですか？",
    answer:
      "東急田園都市線「駒澤大学駅」より徒歩10分です。東急世田谷線「若林駅」からは徒歩7分、東急バス「駒留」からは徒歩1分でお越しいただけます。",
  },
  {
    question: "バスで行くことはできますか？",
    answer: "東急バス「駒留」バス停より徒歩1分です。最も近い公共交通機関の停留所になります。",
  },
  {
    question: "ネットから予約できますか？",
    answer: `ご予約はお電話（${store.phone}）のみで承っております。営業時間内にご連絡ください。`,
  },
  {
    question: "焼肉以外のメニューはありますか？",
    answer:
      "一品料理、キムチ・ナムル、スープ、麺・ご飯、デザート、アルコール・ソフトドリンクをご用意しています。石焼チーズフォンデュや五目チゲ、冷麺しゃりしゃりフローズンなどが人気です。",
  },
  {
    question: "オーナーはどのような方ですか？",
    answer: `三代目オーナーシェフの${owner.name}（${owner.nameReading}）です。先代から受け継いだ味を守りながら、朝鮮半島の伝統弦楽器ソヘグムの奏者としても活動しています。`,
  },
];
