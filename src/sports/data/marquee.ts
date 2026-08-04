/**
 * 斜めマーキーに流すキーワード。
 *
 * ■ ここは装飾です
 *   読み上げ対象から外します（`aria-hidden`）。意味のある情報は本文側にあります。
 *   したがって、ここに数値・順位・スコアのような「事実」を入れないでください。
 *   装飾は更新されないため、古い数字がそのまま残ります。
 *
 * ■ 競技名は既存データから引きます
 *   `src/sports/data/sports.ts` の21競技をそのまま使うので、
 *   競技を足したときに書き漏らしが起きません。
 *   ここに手で足すのは、競技名以外の語（大会形式・視聴手段など）だけです。
 *
 * ■ 色は競技のアクセント色を使います
 *   サイト全体で同じ競技に同じ色が当たるようにするためです。
 */
import { sports } from "./sports";

export type MarqueeWord = {
  /** 表示する語 */
  text: string;
  /** 語ごとの色。競技はその競技のアクセント色 */
  accent: string;
};

/** 競技名以外に混ぜる語。特定の事実を主張しないものだけにします */
const genericSeeds: { ja: string; en: string; accent: string }[] = [
  { ja: "ライブスコア", en: "LIVE SCORE", accent: "var(--color-live)" },
  { ja: "速報", en: "BREAKING", accent: "var(--color-flame)" },
  { ja: "ハイライト", en: "HIGHLIGHTS", accent: "var(--color-magenta)" },
  { ja: "順位表", en: "STANDINGS", accent: "var(--color-cyan)" },
  { ja: "配信比較", en: "STREAMING", accent: "var(--color-violet)" },
  { ja: "日程", en: "FIXTURES", accent: "var(--color-indigo)" },
  { ja: "スタッツ", en: "STATS", accent: "var(--color-neon)" },
  { ja: "移籍", en: "TRANSFERS", accent: "var(--color-flame)" },
  { ja: "延長戦", en: "EXTRA TIME", accent: "var(--color-live)" },
  { ja: "逆転", en: "COMEBACK", accent: "var(--color-magenta)" },
];

/**
 * マーキーに流す語を組み立てます。
 *
 * 競技名と一般語を交互に混ぜます。競技だけだと似た語が続いて読みにくく、
 * 一般語だけだと何のサイトか分かりません。
 */
export function marqueeWords(locale: string): MarqueeWord[] {
  const ja = locale === "ja";
  const sportWords = sports.map((sport) => ({
    text: ja ? sport.name.ja : (sport.name.en ?? sport.name.ja),
    accent: sport.accent,
  }));
  const generic = genericSeeds.map((seed) => ({
    text: ja ? seed.ja : seed.en,
    accent: seed.accent,
  }));

  const words: MarqueeWord[] = [];
  const longest = Math.max(sportWords.length, generic.length);
  for (let index = 0; index < longest; index += 1) {
    if (sportWords[index]) words.push(sportWords[index]);
    if (generic[index]) words.push(generic[index]);
  }
  return words;
}
