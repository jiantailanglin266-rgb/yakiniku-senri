/**
 * SPORTS PORT — 対応ロケール
 *
 * ■ 並び順
 *   スポーツ視聴人口とサイトの主要ターゲット（日本語 → 英語 → 東アジア → 欧州 → 新興市場）順。
 *   アルファベット順にはしません。上から探すほうが速いためです。
 *
 * ■ label は必ず「その言語の話者にとっての自称」で書きます
 * ■ 国旗は言語と1対1ではありません。UI では必ず言語名を併記してください
 *    （国旗画像は public/images/flags/<country>.webp）
 */

export type Locale = {
  /** URL セグメント（/ja/ /zh-cn/ など。すべて小文字） */
  code: string;
  /** <html lang> と hreflang に使う BCP 47 タグ */
  hreflang: string;
  /** 国旗に使う ISO 3166-1 alpha-2 */
  country: string;
  /** その言語での言語名（自称） */
  label: string;
  /** 日本語での言語名（管理画面・aria-label 用） */
  labelJa: string;
  /** 右横書きか */
  rtl?: boolean;
  /** Intl API に渡すロケール（日時・数値の整形） */
  intl: string;
  /** 既定の表示タイムゾーン（利用者の端末設定があればそちらを優先） */
  timeZone: string;
};

export const locales: Locale[] = [
  {
    code: "ja",
    hreflang: "ja",
    country: "jp",
    label: "日本語",
    labelJa: "日本語",
    intl: "ja-JP",
    timeZone: "Asia/Tokyo",
  },
  {
    code: "en",
    hreflang: "en",
    country: "gb",
    label: "English",
    labelJa: "英語",
    intl: "en-GB",
    timeZone: "UTC",
  },
  {
    code: "ko",
    hreflang: "ko",
    country: "kr",
    label: "한국어",
    labelJa: "韓国語",
    intl: "ko-KR",
    timeZone: "Asia/Seoul",
  },
  {
    code: "zh-cn",
    hreflang: "zh-Hans",
    country: "cn",
    label: "简体中文",
    labelJa: "中国語（簡体字）",
    intl: "zh-CN",
    timeZone: "Asia/Shanghai",
  },
  {
    code: "zh-tw",
    hreflang: "zh-Hant",
    country: "tw",
    label: "繁體中文",
    labelJa: "中国語（繁体字）",
    intl: "zh-TW",
    timeZone: "Asia/Taipei",
  },
  {
    code: "es",
    hreflang: "es",
    country: "es",
    label: "Español",
    labelJa: "スペイン語",
    intl: "es-ES",
    timeZone: "Europe/Madrid",
  },
  {
    code: "fr",
    hreflang: "fr",
    country: "fr",
    label: "Français",
    labelJa: "フランス語",
    intl: "fr-FR",
    timeZone: "Europe/Paris",
  },
  {
    code: "de",
    hreflang: "de",
    country: "de",
    label: "Deutsch",
    labelJa: "ドイツ語",
    intl: "de-DE",
    timeZone: "Europe/Berlin",
  },
  {
    code: "pt",
    hreflang: "pt",
    country: "pt",
    label: "Português",
    labelJa: "ポルトガル語",
    intl: "pt-BR",
    timeZone: "America/Sao_Paulo",
  },
  {
    code: "it",
    hreflang: "it",
    country: "it",
    label: "Italiano",
    labelJa: "イタリア語",
    intl: "it-IT",
    timeZone: "Europe/Rome",
  },
  {
    code: "th",
    hreflang: "th",
    country: "th",
    label: "ไทย",
    labelJa: "タイ語",
    intl: "th-TH",
    timeZone: "Asia/Bangkok",
  },
  {
    code: "vi",
    hreflang: "vi",
    country: "vn",
    label: "Tiếng Việt",
    labelJa: "ベトナム語",
    intl: "vi-VN",
    timeZone: "Asia/Ho_Chi_Minh",
  },
  {
    code: "id",
    hreflang: "id",
    country: "id",
    label: "Bahasa Indonesia",
    labelJa: "インドネシア語",
    intl: "id-ID",
    timeZone: "Asia/Jakarta",
  },
  {
    code: "ar",
    hreflang: "ar",
    country: "sa",
    label: "العربية",
    labelJa: "アラビア語",
    rtl: true,
    intl: "ar-EG",
    timeZone: "Asia/Riyadh",
  },
  {
    code: "hi",
    hreflang: "hi",
    country: "in",
    label: "हिन्दी",
    labelJa: "ヒンディー語",
    intl: "hi-IN",
    timeZone: "Asia/Kolkata",
  },
];

export const defaultLocaleCode = "ja";

/** 翻訳の原文となる言語（この2つは全文を人手で用意します） */
export const sourceLocaleCodes = ["ja", "en"] as const;

export const localeCodes = locales.map((locale) => locale.code);

export function findLocale(code: string | undefined | null): Locale | undefined {
  if (!code) return undefined;
  return locales.find((locale) => locale.code === code.toLowerCase());
}

export function getLocale(code: string): Locale {
  return findLocale(code) ?? locales[0];
}

export function isLocaleCode(code: string): boolean {
  return localeCodes.includes(code.toLowerCase());
}
