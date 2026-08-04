/**
 * 店舗基本情報 — サイト内のすべての店舗表記はこのファイルを参照します。
 * 営業時間・定休日・電話番号などを変更するときは、ここだけを編集してください。
 *
 * ⚠ 公開前に必ず最新の情報を店舗へご確認ください（README「公開前確認事項」参照）。
 */

export type BusinessHour = {
  /** 表示ラベル（例: 平日） */
  label: string;
  /** 営業時間（例: 17:30〜22:30） */
  value: string;
  /** ラストオーダー（例: 21:45） */
  lastOrder?: string;
  /** 構造化データ用の曜日（schema.org DayOfWeek） */
  days: ("Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday")[];
  /** 構造化データ用 24h 表記 */
  opens: string;
  closes: string;
};

export type AccessRoute = {
  label: string;
  value: string;
};

export const store = {
  name: "焼肉 千里",
  nameEn: "YAKINIKU SENRI",
  nameReading: "ヤキニク センリ",
  founded: 1965,
  catchCopy: "炎とともに、受け継がれる味。",
  subCopy: "世田谷で愛され続ける、老舗焼肉店。",

  postalCode: "154-0011",
  address: "東京都世田谷区上馬4-41-2",
  addressFull: "〒154-0011 東京都世田谷区上馬4-41-2",
  addressParts: {
    region: "東京都",
    locality: "世田谷区",
    street: "上馬4-41-2",
    country: "JP",
  },

  phone: "03-3418-7496",
  /** tel: リンク用（国番号付き） */
  phoneHref: "tel:+81334187496",

  businessHours: [
    {
      label: "平日",
      value: "17:30〜22:30",
      lastOrder: "21:45",
      days: ["Monday", "Tuesday", "Wednesday", "Friday"],
      opens: "17:30",
      closes: "22:30",
    },
    {
      label: "土曜日",
      value: "17:00〜22:30",
      lastOrder: "21:45",
      days: ["Saturday"],
      opens: "17:00",
      closes: "22:30",
    },
    {
      label: "日曜・祝日",
      value: "17:00〜22:00",
      lastOrder: "21:30",
      days: ["Sunday"],
      opens: "17:00",
      closes: "22:00",
    },
  ] satisfies BusinessHour[],

  closed: "木曜日",

  access: [
    { label: "東急田園都市線", value: "「駒澤大学駅」より徒歩10分" },
    { label: "東急世田谷線", value: "「若林駅」より徒歩7分" },
    { label: "東急バス", value: "「駒留」より徒歩1分" },
  ] satisfies AccessRoute[],

  parking: "駐車場サービスあり（詳細はお電話にてお問い合わせください）",

  /**
   * 表示価格の税表記。公開前に店舗へご確認ください。
   * true = 税込表示 / false = 税別表示
   */
  priceTaxIncluded: true,

  /* ------------------------------------------------------------------
     以下はローカル検索（Googleマップ / AI検索）向けの項目です。
     ⚠ 値が空のあいだは構造化データに出力しません。
        推測値を入れると誤情報になるため、必ず実測・実確認した値を入れてください。
     ------------------------------------------------------------------ */

  /**
   * 店舗の緯度・経度。
   * Googleマップで店舗ピンを右クリック →「この場所について」で取得できます。
   * 例: { latitude: 35.63xxxx, longitude: 139.66xxxx }
   */
  geo: null as { latitude: number; longitude: number } | null,

  /**
   * 1人あたりの予算帯（schema.org priceRange）。
   * 例: "¥6,000〜¥7,999"。ディナーの平均客単価を店舗へご確認ください。
   */
  priceRange: "",

  /** 席数。例: 40。0 のあいだは出力しません。 */
  seats: 0,

  /** 対応している決済手段。例: ["現金", "クレジットカード", "QRコード決済"] */
  paymentAccepted: [] as string[],
} as const;

/** 「創業から◯年」を年ごとに自動計算（ビルド時基準） */
export function yearsInBusiness(now: number = new Date().getFullYear()): number {
  return now - store.founded;
}
