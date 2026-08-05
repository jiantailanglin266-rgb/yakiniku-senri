/**
 * 自動翻訳の対応言語。
 *
 * ■ 並び順の考え方
 *   訪日客の多い言語を上に置いています（観光庁の訪日外国人の構成比を踏まえた実務的な順）。
 *   検索して選ぶより「上から探す」ほうが速いため、アルファベット順にはしていません。
 *
 * ■ label は必ず「その言語の話者にとっての自称」で書きます
 *   英語話者に「Japanese」ではなく、韓国語話者に「한국어」と見せるためです。
 */

import { withBasePath } from "@/lib/base-path";

export type LanguageCode = string;

export type Language = {
  /** Google 翻訳の言語コード */
  code: LanguageCode;
  /**
   * 国旗に使う国・地域コード（ISO 3166-1 alpha-2）。
   *
   * ⚠ 言語と国は1対1ではありません。
   *   英語は英国・米国など、スペイン語はスペイン・中南米など複数の国で話されます。
   *   ここでは言語切り替えUIの慣例としてもっとも一般的な国を選んでいます。
   *   旗だけでは誤解を招くため、UIでは必ず言語名を併記してください。
   */
  country: string;
  /** その言語での言語名（自称） */
  label: string;
  /** 日本語での言語名（管理・aria-label 用） */
  labelJa: string;
  /** 右横書きの言語か（アラビア語・ヘブライ語など） */
  rtl?: boolean;
};

/** 原文の言語。ここは翻訳の起点なので切り替え対象に含めます。 */
export const SOURCE_LANGUAGE: LanguageCode = "ja";

export const languages: Language[] = [
  { code: "ja", country: "jp", label: "日本語", labelJa: "日本語" },
  { code: "en", country: "gb", label: "English", labelJa: "英語" },
  { code: "zh-CN", country: "cn", label: "简体中文", labelJa: "中国語（簡体字）" },
  { code: "zh-TW", country: "tw", label: "繁體中文", labelJa: "中国語（繁体字）" },
  { code: "ko", country: "kr", label: "한국어", labelJa: "韓国語" },
  { code: "th", country: "th", label: "ไทย", labelJa: "タイ語" },
  { code: "vi", country: "vn", label: "Tiếng Việt", labelJa: "ベトナム語" },
  { code: "id", country: "id", label: "Bahasa Indonesia", labelJa: "インドネシア語" },
  { code: "ms", country: "my", label: "Bahasa Melayu", labelJa: "マレー語" },
  { code: "tl", country: "ph", label: "Filipino", labelJa: "フィリピン語" },
  { code: "hi", country: "in", label: "हिन्दी", labelJa: "ヒンディー語" },
  { code: "bn", country: "bd", label: "বাংলা", labelJa: "ベンガル語" },
  { code: "ta", country: "lk", label: "தமிழ்", labelJa: "タミル語" },
  { code: "ne", country: "np", label: "नेपाली", labelJa: "ネパール語" },
  { code: "my", country: "mm", label: "မြန်မာဘာသာ", labelJa: "ミャンマー語" },
  { code: "km", country: "kh", label: "ខ្មែរ", labelJa: "クメール語" },
  { code: "mn", country: "mn", label: "Монгол", labelJa: "モンゴル語" },
  { code: "es", country: "es", label: "Español", labelJa: "スペイン語" },
  { code: "pt", country: "pt", label: "Português", labelJa: "ポルトガル語" },
  { code: "fr", country: "fr", label: "Français", labelJa: "フランス語" },
  { code: "de", country: "de", label: "Deutsch", labelJa: "ドイツ語" },
  { code: "it", country: "it", label: "Italiano", labelJa: "イタリア語" },
  { code: "nl", country: "nl", label: "Nederlands", labelJa: "オランダ語" },
  { code: "ru", country: "ru", label: "Русский", labelJa: "ロシア語" },
  { code: "uk", country: "ua", label: "Українська", labelJa: "ウクライナ語" },
  { code: "pl", country: "pl", label: "Polski", labelJa: "ポーランド語" },
  { code: "cs", country: "cz", label: "Čeština", labelJa: "チェコ語" },
  { code: "sk", country: "sk", label: "Slovenčina", labelJa: "スロバキア語" },
  { code: "hu", country: "hu", label: "Magyar", labelJa: "ハンガリー語" },
  { code: "ro", country: "ro", label: "Română", labelJa: "ルーマニア語" },
  { code: "bg", country: "bg", label: "Български", labelJa: "ブルガリア語" },
  { code: "hr", country: "hr", label: "Hrvatski", labelJa: "クロアチア語" },
  { code: "el", country: "gr", label: "Ελληνικά", labelJa: "ギリシャ語" },
  { code: "tr", country: "tr", label: "Türkçe", labelJa: "トルコ語" },
  { code: "sv", country: "se", label: "Svenska", labelJa: "スウェーデン語" },
  { code: "da", country: "dk", label: "Dansk", labelJa: "デンマーク語" },
  { code: "no", country: "no", label: "Norsk", labelJa: "ノルウェー語" },
  { code: "fi", country: "fi", label: "Suomi", labelJa: "フィンランド語" },
  { code: "ar", country: "sa", label: "العربية", labelJa: "アラビア語", rtl: true },
  { code: "he", country: "il", label: "עברית", labelJa: "ヘブライ語", rtl: true },
  { code: "fa", country: "ir", label: "فارسی", labelJa: "ペルシャ語", rtl: true },
  { code: "ur", country: "pk", label: "اردو", labelJa: "ウルドゥー語", rtl: true },
];

/** Google 翻訳ウィジェットへ渡す対象言語（原文の日本語を除く） */
export const includedLanguages = languages
  .filter((language) => language.code !== SOURCE_LANGUAGE)
  .map((language) => language.code)
  .join(",");

export function findLanguage(code: string | null | undefined): Language | undefined {
  if (!code) return undefined;
  return languages.find((language) => language.code === code);
}

/** 国旗画像のパス（サブディレクトリ配信に対応） */
export function flagSrc(language: Language): string {
  return withBasePath(`/images/flags/${language.country}.webp`);
}
