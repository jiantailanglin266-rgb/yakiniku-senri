/**
 * 追加権利（画像ライセンス以外の権利）の推定。
 *
 * ■ なぜライセンスと別なのか
 *   CC BY で公開された写真でも、そこに写っている人物の肖像権・パブリシティ権、
 *   商標、建築著作物、美術作品の権利は消えません。
 *   「ライセンスが自由＝どう使ってもよい」ではないため、別の軸で判定します。
 *
 * ■ 疑わしければ拾う
 *   見落として自動公開するより、余分に人間の確認へ回すほうが安全です。
 *   したがって、この関数は**過剰に検出する方向**へ倒しています。
 *
 * ■ 判定は取得側ではなくここで行います
 *   同期スクリプトは Commons の生の値を書き出すだけで、解釈をしません。
 *   解釈がコードの1か所に集まっていれば、テストで挙動を固定できます。
 */
import type { RightsRiskFlag } from "./types";

export type RiskSource = {
  /** ファイル説明文 */
  description?: string | null;
  /** 作品名 */
  objectName?: string | null;
  /** Commons のカテゴリ（"|" 区切り） */
  categories?: string | null;
  /** Commons が明示している追加制限 */
  restrictions?: string | null;
  /** targets.json であらかじめ想定したリスク */
  declared?: string[];
};

const allFlags: RightsRiskFlag[] = [
  "living_person",
  "public_figure",
  "child",
  "trademark",
  "product",
  "artwork",
  "architecture",
  "event",
  "indoor",
  "unknown_subject",
];

export function toRightsRisk(value: string): RightsRiskFlag | undefined {
  return allFlags.find((flag) => flag === value);
}

const rules: [RegExp, RightsRiskFlag][] = [
  [
    /\b(portrait|people|person|players?|athletes?|politician|actor|singer|coach)\b/,
    "living_person",
  ],
  [/\b(child|children|kids|minor|youth)\b/, "child"],
  [/\b(logos?|emblems?|brands?|wordmark|sponsor)\b/, "trademark"],
  [/\b(products?|packaging|merchandise|jersey|kit)\b/, "product"],
  [/\b(paintings?|sculptures?|statues?|artworks?|murals?|graffiti)\b/, "artwork"],
  [/\b(buildings?|architecture|stadiums?|arenas?|museums?)\b/, "architecture"],
  [/\b(interior|indoors?)\b/, "indoor"],
  [/\b(concerts?|matches|games?|tournaments?|events?|ceremony)\b/, "event"],
];

/**
 * 被写体から想定される追加権利を返します。
 *
 * 手がかりが何も無い場合は unknown_subject を返します。
 * 「情報が無い＝安全」ではないため、空配列にはしません。
 */
export function detectRightsRisks(source: RiskSource): RightsRiskFlag[] {
  const risks = new Set<RightsRiskFlag>();

  for (const value of source.declared ?? []) {
    const flag = toRightsRisk(value);
    if (flag) risks.add(flag);
  }

  // Commons 側が明示的に制限を付けている場合は、内容を問わず商標扱いにします
  if (source.restrictions && source.restrictions.trim()) {
    risks.add("trademark");
  }

  const haystack = [source.description, source.objectName, source.categories]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!haystack) {
    // 被写体を判断する材料が無い画像は、自動公開させません
    risks.add("unknown_subject");
    return Array.from(risks);
  }

  for (const [pattern, flag] of rules) {
    if (pattern.test(haystack)) risks.add(flag);
  }

  return Array.from(risks);
}
