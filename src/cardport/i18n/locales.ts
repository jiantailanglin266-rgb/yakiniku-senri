/**
 * CARD PORT の対応言語。
 *
 * ■ 並び順
 *   日本語を起点に、想定読者の多い順で並べています。アルファベット順にはしません。
 *
 * ■ 国旗について
 *   言語と国は 1 対 1 ではありません（英語＝英国だけではない、スペイン語＝スペインだけではない）。
 *   旗はあくまで視認の補助であり、UI では**必ず言語名を併記**してください。
 *   旗画像は既存サイトと同じ `public/images/flags/<国コード>.webp` を共有します。
 */

import { cardportAsset } from "@/cardport/config/site";

export type Locale =
  | "ja"
  | "en"
  | "ko"
  | "zh-cn"
  | "zh-tw"
  | "es"
  | "fr"
  | "de"
  | "pt"
  | "th"
  | "vi"
  | "id"
  | "ar"
  | "hi";

export type LocaleDefinition = {
  code: Locale;
  /** `<html lang>` / hreflang に使う BCP 47 タグ */
  hreflang: string;
  /** 国旗に使う ISO 3166-1 alpha-2 コード */
  country: string;
  /** その言語での言語名（自称） */
  label: string;
  /** 日本語での言語名（管理・aria-label 用） */
  labelJa: string;
  /** 右から左へ読む言語か */
  rtl?: boolean;
  /** Intl に渡すロケール（数値・日付の書式） */
  intl: string;
  /** 表示通貨。カード情報は日本発行のため原則 JPY を併記します */
  currency: string;
};

export const DEFAULT_LOCALE: Locale = "ja";

export const localeDefinitions: LocaleDefinition[] = [
  {
    code: "ja",
    hreflang: "ja",
    country: "jp",
    label: "日本語",
    labelJa: "日本語",
    intl: "ja-JP",
    currency: "JPY",
  },
  {
    code: "en",
    hreflang: "en",
    country: "gb",
    label: "English",
    labelJa: "英語",
    intl: "en-US",
    currency: "USD",
  },
  {
    code: "ko",
    hreflang: "ko",
    country: "kr",
    label: "한국어",
    labelJa: "韓国語",
    intl: "ko-KR",
    currency: "KRW",
  },
  {
    code: "zh-cn",
    hreflang: "zh-Hans",
    country: "cn",
    label: "简体中文",
    labelJa: "中国語（簡体字）",
    intl: "zh-CN",
    currency: "CNY",
  },
  {
    code: "zh-tw",
    hreflang: "zh-Hant",
    country: "tw",
    label: "繁體中文",
    labelJa: "中国語（繁体字）",
    intl: "zh-TW",
    currency: "TWD",
  },
  {
    code: "es",
    hreflang: "es",
    country: "es",
    label: "Español",
    labelJa: "スペイン語",
    intl: "es-ES",
    currency: "EUR",
  },
  {
    code: "fr",
    hreflang: "fr",
    country: "fr",
    label: "Français",
    labelJa: "フランス語",
    intl: "fr-FR",
    currency: "EUR",
  },
  {
    code: "de",
    hreflang: "de",
    country: "de",
    label: "Deutsch",
    labelJa: "ドイツ語",
    intl: "de-DE",
    currency: "EUR",
  },
  {
    code: "pt",
    hreflang: "pt",
    country: "pt",
    label: "Português",
    labelJa: "ポルトガル語",
    intl: "pt-BR",
    currency: "BRL",
  },
  {
    code: "th",
    hreflang: "th",
    country: "th",
    label: "ไทย",
    labelJa: "タイ語",
    intl: "th-TH",
    currency: "THB",
  },
  {
    code: "vi",
    hreflang: "vi",
    country: "vn",
    label: "Tiếng Việt",
    labelJa: "ベトナム語",
    intl: "vi-VN",
    currency: "VND",
  },
  {
    code: "id",
    hreflang: "id",
    country: "id",
    label: "Bahasa Indonesia",
    labelJa: "インドネシア語",
    intl: "id-ID",
    currency: "IDR",
  },
  {
    code: "ar",
    hreflang: "ar",
    country: "sa",
    label: "العربية",
    labelJa: "アラビア語",
    rtl: true,
    intl: "ar-SA",
    currency: "SAR",
  },
  {
    code: "hi",
    hreflang: "hi",
    country: "in",
    label: "हिन्दी",
    labelJa: "ヒンディー語",
    intl: "hi-IN",
    currency: "INR",
  },
];

export const locales: Locale[] = localeDefinitions.map((definition) => definition.code);

const localeMap = new Map<string, LocaleDefinition>(
  localeDefinitions.map((definition) => [definition.code, definition]),
);

export function isLocale(value: string | undefined | null): value is Locale {
  return typeof value === "string" && localeMap.has(value);
}

export function getLocaleDefinition(locale: Locale): LocaleDefinition {
  return localeMap.get(locale) ?? localeMap.get(DEFAULT_LOCALE)!;
}

export function isRtl(locale: Locale): boolean {
  return getLocaleDefinition(locale).rtl === true;
}

/** 国旗画像のパス（サブディレクトリ配信に対応） */
export function localeFlagSrc(locale: Locale): string {
  return cardportAsset(`/images/flags/${getLocaleDefinition(locale).country}.webp`);
}

/**
 * 詳細ページ（カード・ニュース・動画など件数の多いページ）を生成する言語。
 *
 * 静的エクスポートで 14 言語 × 全詳細ページを出すとビルドが現実的でないため、
 * GitHub Pages プレビューでは主要 2 言語に絞ります。
 * サーバ運用（Vercel）では全言語を生成します。
 */
export function getContentLocales(): Locale[] {
  const override = process.env.CARDPORT_CONTENT_LOCALES;
  if (override) {
    const requested = override
      .split(",")
      .map((value) => value.trim())
      .filter(isLocale);
    if (requested.length > 0) return requested;
  }
  if (process.env.GITHUB_PAGES === "true") return ["ja", "en"];
  return locales;
}
