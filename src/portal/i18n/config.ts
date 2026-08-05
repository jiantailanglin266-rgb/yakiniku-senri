/**
 * 多言語構成。
 *
 * ■ URL 設計
 *   言語は必ず先頭セグメントに載せます（/ja/… /en/… /zh-cn/…）。
 *   Cookie や Accept-Language でコンテンツを出し分けると、
 *   検索エンジンが1つのURLで複数の言語を見ることになり評価が割れます。
 *
 * ■ 並び順
 *   仮想通貨の取引ボリュームと日本語圏からの関心度を踏まえた実務順です。
 *   アルファベット順にはしていません。
 *
 * ■ label は必ず「その言語の話者にとっての自称」で書きます。
 * ■ country は国旗画像のためのISO 3166-1 alpha-2。
 *   言語と国は1対1ではないため、UIでは旗だけにせず必ず言語名を併記します。
 */

export type LocaleConfig = {
  /** URL に載るコード（小文字・ハイフン区切り） */
  code: string;
  /** hreflang / html lang に使う BCP 47 タグ */
  hreflang: string;
  /** OGP の og:locale */
  ogLocale: string;
  /** Intl API に渡すロケール */
  intl: string;
  /** 国旗画像の国・地域コード */
  country: string;
  /** その言語での言語名（自称） */
  label: string;
  /** 日本語での言語名（管理・aria-label 用） */
  labelJa: string;
  /** 右から左へ読む言語 */
  rtl?: boolean;
};

export const locales: LocaleConfig[] = [
  { code: "ja", hreflang: "ja", ogLocale: "ja_JP", intl: "ja-JP", country: "jp", label: "日本語", labelJa: "日本語" }, // prettier-ignore
  { code: "en", hreflang: "en", ogLocale: "en_US", intl: "en-US", country: "gb", label: "English", labelJa: "英語" }, // prettier-ignore
  { code: "ko", hreflang: "ko", ogLocale: "ko_KR", intl: "ko-KR", country: "kr", label: "한국어", labelJa: "韓国語" }, // prettier-ignore
  { code: "zh-cn", hreflang: "zh-Hans", ogLocale: "zh_CN", intl: "zh-CN", country: "cn", label: "简体中文", labelJa: "中国語（簡体字）" }, // prettier-ignore
  { code: "zh-tw", hreflang: "zh-Hant", ogLocale: "zh_TW", intl: "zh-TW", country: "tw", label: "繁體中文", labelJa: "中国語（繁体字）" }, // prettier-ignore
  { code: "es", hreflang: "es", ogLocale: "es_ES", intl: "es-ES", country: "es", label: "Español", labelJa: "スペイン語" }, // prettier-ignore
  { code: "pt", hreflang: "pt", ogLocale: "pt_BR", intl: "pt-BR", country: "pt", label: "Português", labelJa: "ポルトガル語" }, // prettier-ignore
  { code: "fr", hreflang: "fr", ogLocale: "fr_FR", intl: "fr-FR", country: "fr", label: "Français", labelJa: "フランス語" }, // prettier-ignore
  { code: "de", hreflang: "de", ogLocale: "de_DE", intl: "de-DE", country: "de", label: "Deutsch", labelJa: "ドイツ語" }, // prettier-ignore
  { code: "th", hreflang: "th", ogLocale: "th_TH", intl: "th-TH", country: "th", label: "ไทย", labelJa: "タイ語" }, // prettier-ignore
  { code: "vi", hreflang: "vi", ogLocale: "vi_VN", intl: "vi-VN", country: "vn", label: "Tiếng Việt", labelJa: "ベトナム語" }, // prettier-ignore
  { code: "id", hreflang: "id", ogLocale: "id_ID", intl: "id-ID", country: "id", label: "Bahasa Indonesia", labelJa: "インドネシア語" }, // prettier-ignore
  { code: "ar", hreflang: "ar", ogLocale: "ar_AR", intl: "ar-SA", country: "sa", label: "العربية", labelJa: "アラビア語", rtl: true }, // prettier-ignore
];

export type Locale = (typeof locales)[number]["code"];

/** 既定言語。/ からのリダイレクト先であり、翻訳が無い場合の最終フォールバックです。 */
export const defaultLocale = "ja";

/** 翻訳が未整備の言語がフォールバックする先（日本語より英語のほうが読める人が多い） */
export const fallbackLocale = "en";

export const localeCodes = locales.map((locale) => locale.code);

export function isLocale(value: string | undefined | null): value is Locale {
  return typeof value === "string" && localeCodes.includes(value);
}

export function getLocaleConfig(code: string): LocaleConfig {
  return locales.find((locale) => locale.code === code) ?? locales[0];
}

export function localeDir(code: string): "ltr" | "rtl" {
  return getLocaleConfig(code).rtl ? "rtl" : "ltr";
}

/**
 * 静的書き出し（GitHub Pages 等）でプリレンダリングする言語。
 *
 * 13言語 × 全ページを静的化するとページ数が1,000を超え、ビルド時間が実用外になります。
 * サーバー実行（Vercel）では全言語をオンデマンド生成できるため、
 * 静的書き出しのときだけ既定で ja / en に絞ります。
 * `PORTAL_STATIC_LOCALES="ja,en,ko"` のように増やせます。
 */
export function staticLocales(): string[] {
  const configured = process.env.PORTAL_STATIC_LOCALES?.trim();
  if (configured) {
    return configured
      .split(",")
      .map((code) => code.trim())
      .filter(isLocale);
  }
  return process.env.GITHUB_PAGES === "true" ? [defaultLocale, fallbackLocale] : localeCodes;
}

/** 言語プレフィックス付きのパスを組み立てます（例: /ja/coins/bitcoin） */
export function localePath(locale: string, path = ""): string {
  const suffix = path === "" || path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${suffix}`;
}
