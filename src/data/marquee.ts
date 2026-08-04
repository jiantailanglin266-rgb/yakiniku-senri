/**
 * 装飾用の英字マーキー（流れる帯）の文言。
 *
 * ■ 事実だけを並べます
 *   雰囲気づくりの装飾ですが、書いてある以上は「主張」です。
 *   ここに入れてよいのは、**サイト内で既に表示している内容の英語表記だけ**です。
 *   WAGYU / A5 / AGED / BINCHOTAN のような、店に確認できていない格付け・
 *   仕入れ・設備の語は入れないでください（優良誤認になります）。
 *
 * ■ 出典
 *   SINCE 1965 / SETAGAYA / SECRET SAUCE / MOMI SERIES / LONG-LOVED … content.ts の headingEn
 *   SIGNATURE / A LA CARTE / HORMONE / KIMCHI & NAMUL / TAKEOUT … menu.ts のカテゴリー nameEn
 *   PREMIUM LOIN / MOMI ASSORTMENT … menu.ts の品名 nameEn
 *   YAKINIKU SENRI … store.nameEn
 *   CHARCOAL GRILL … 炭火（EmberSection・ブランドムービーの説明文）
 *   THIRD GENERATION … 三代目（owner）
 *   KAMIUMA … 上馬（住所）
 */

/** 2段組みの上段・下段（左右で逆方向に流れます） */
export type MarqueeRows = readonly [readonly string[], readonly string[]];

/** 上部（ブランドムービーの直後）— 店の成り立ちを表す語 */
export const marqueeTop: MarqueeRows = [
  ["YAKINIKU SENRI", "SINCE 1965", "SETAGAYA TOKYO", "CHARCOAL GRILL", "LONG-LOVED"],
  ["SECRET SAUCE", "MOMI SERIES", "THIRD GENERATION", "KAMIUMA", "TIME-HONORED"],
];

/** 中部（炭火のセクションの直後）— お品書きを表す語 */
export const marqueeMiddle: MarqueeRows = [
  ["SIGNATURE", "MOMI ASSORTMENT", "PREMIUM LOIN", "A LA CARTE", "HORMONE"],
  ["KIMCHI & NAMUL", "TAKEOUT", "CHARCOAL GRILL", "SETAGAYA TOKYO", "SINCE 1965"],
];
