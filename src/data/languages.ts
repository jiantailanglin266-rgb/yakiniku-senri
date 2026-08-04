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

export type LanguageCode = string;

export type Language = {
  /** Google 翻訳の言語コード */
  code: LanguageCode;
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
  { code: "ja", label: "日本語", labelJa: "日本語" },
  { code: "en", label: "English", labelJa: "英語" },
  { code: "zh-CN", label: "简体中文", labelJa: "中国語（簡体字）" },
  { code: "zh-TW", label: "繁體中文", labelJa: "中国語（繁体字）" },
  { code: "ko", label: "한국어", labelJa: "韓国語" },
  { code: "th", label: "ไทย", labelJa: "タイ語" },
  { code: "vi", label: "Tiếng Việt", labelJa: "ベトナム語" },
  { code: "id", label: "Bahasa Indonesia", labelJa: "インドネシア語" },
  { code: "ms", label: "Bahasa Melayu", labelJa: "マレー語" },
  { code: "tl", label: "Filipino", labelJa: "フィリピン語" },
  { code: "hi", label: "हिन्दी", labelJa: "ヒンディー語" },
  { code: "bn", label: "বাংলা", labelJa: "ベンガル語" },
  { code: "ta", label: "தமிழ்", labelJa: "タミル語" },
  { code: "ne", label: "नेपाली", labelJa: "ネパール語" },
  { code: "my", label: "မြန်မာဘာသာ", labelJa: "ミャンマー語" },
  { code: "km", label: "ខ្មែរ", labelJa: "クメール語" },
  { code: "mn", label: "Монгол", labelJa: "モンゴル語" },
  { code: "es", label: "Español", labelJa: "スペイン語" },
  { code: "pt", label: "Português", labelJa: "ポルトガル語" },
  { code: "fr", label: "Français", labelJa: "フランス語" },
  { code: "de", label: "Deutsch", labelJa: "ドイツ語" },
  { code: "it", label: "Italiano", labelJa: "イタリア語" },
  { code: "nl", label: "Nederlands", labelJa: "オランダ語" },
  { code: "ru", label: "Русский", labelJa: "ロシア語" },
  { code: "uk", label: "Українська", labelJa: "ウクライナ語" },
  { code: "pl", label: "Polski", labelJa: "ポーランド語" },
  { code: "cs", label: "Čeština", labelJa: "チェコ語" },
  { code: "sk", label: "Slovenčina", labelJa: "スロバキア語" },
  { code: "hu", label: "Magyar", labelJa: "ハンガリー語" },
  { code: "ro", label: "Română", labelJa: "ルーマニア語" },
  { code: "bg", label: "Български", labelJa: "ブルガリア語" },
  { code: "hr", label: "Hrvatski", labelJa: "クロアチア語" },
  { code: "el", label: "Ελληνικά", labelJa: "ギリシャ語" },
  { code: "tr", label: "Türkçe", labelJa: "トルコ語" },
  { code: "sv", label: "Svenska", labelJa: "スウェーデン語" },
  { code: "da", label: "Dansk", labelJa: "デンマーク語" },
  { code: "no", label: "Norsk", labelJa: "ノルウェー語" },
  { code: "fi", label: "Suomi", labelJa: "フィンランド語" },
  { code: "ar", label: "العربية", labelJa: "アラビア語", rtl: true },
  { code: "he", label: "עברית", labelJa: "ヘブライ語", rtl: true },
  { code: "fa", label: "فارسی", labelJa: "ペルシャ語", rtl: true },
  { code: "ur", label: "اردو", labelJa: "ウルドゥー語", rtl: true },
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
