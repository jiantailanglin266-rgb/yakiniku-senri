/**
 * お品書きデータ。
 *
 * ■ 変更方法
 *   - 品目の追加/削除/価格変更は menuItems の配列を編集してください。
 *   - カテゴリーの並び順は menuCategories の順番がそのまま画面に反映されます。
 *   - 品目が1件も無いカテゴリーは、画面に表示されません（空のタブは出ません）。
 *   - 写真は image に /images/menu/xxx.webp を指定。未指定でもレイアウトは崩れません。
 *
 * ⚠ 価格・品目は既存サイトの掲載内容をもとにしています。公開前に必ず店舗へご確認ください。
 * ⚠ 税表記は src/data/store.ts の priceTaxIncluded で切り替えます。
 */
import { z } from "zod";
import { media } from "./media";

export const menuItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  price: z.number().int().nonnegative(),
  taxIncluded: z.boolean(),
  category: z.string().min(1),
  image: z.string().optional(),
  recommended: z.boolean().optional(),
  limited: z.boolean().optional(),
  allergens: z.array(z.string()).optional(),
});

export type MenuItem = z.infer<typeof menuItemSchema>;

export const menuCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  nameEn: z.string().min(1),
  description: z.string().optional(),
});

export type MenuCategory = z.infer<typeof menuCategorySchema>;

export const menuCategories: MenuCategory[] = [
  { id: "recommended", name: "おすすめ", nameEn: "SIGNATURE", description: "千里を代表する逸品。" },
  {
    id: "momi",
    name: "もみシリーズ",
    nameEn: "MOMI SERIES",
    description: "秘伝のタレをもみ込んだ、千里名物。",
  },
  { id: "beef", name: "牛肉", nameEn: "BEEF" },
  { id: "hormone", name: "ホルモン", nameEn: "HORMONE" },
  { id: "pork-chicken", name: "豚・鶏", nameEn: "PORK & CHICKEN" },
  { id: "seafood", name: "海鮮", nameEn: "SEAFOOD" },
  { id: "vegetable", name: "野菜", nameEn: "VEGETABLE" },
  { id: "single", name: "一品料理", nameEn: "A LA CARTE" },
  { id: "kimchi", name: "キムチ・ナムル", nameEn: "KIMCHI & NAMUL" },
  { id: "soup", name: "スープ", nameEn: "SOUP" },
  { id: "noodle-rice", name: "麺・ご飯", nameEn: "NOODLE & RICE" },
  { id: "dessert", name: "デザート", nameEn: "DESSERT" },
  { id: "alcohol", name: "アルコール", nameEn: "ALCOHOL" },
  { id: "softdrink", name: "ソフトドリンク", nameEn: "SOFT DRINK" },
  { id: "takeout", name: "テイクアウト", nameEn: "TAKEOUT" },
];

const TAX_INCLUDED = true;

export const menuItems: MenuItem[] = [
  // ── もみシリーズ ──────────────────────────────
  {
    id: "momi-assortment",
    name: "もみ三種盛り合わせ",
    nameEn: "MOMI ASSORTMENT",
    description:
      "もみタン・もみハラミ・もみカルビの三種盛り。秘伝のタレをもみ込んだ千里名物を、一度に食べ比べていただけます。",
    price: 5600,
    taxIncluded: TAX_INCLUDED,
    category: "momi",
    image: media.menu.momiAssortment.src,
    recommended: true,
  },
  {
    id: "momi-tan",
    name: "もみタン",
    nameEn: "MOMI TAN",
    description: "秘伝のタレをもみ込んだタン。",
    price: 1800,
    taxIncluded: TAX_INCLUDED,
    category: "momi",
  },
  {
    id: "momi-harami",
    name: "もみハラミ",
    nameEn: "MOMI HARAMI",
    description: "秘伝のタレをもみ込んだハラミ。",
    price: 1950,
    taxIncluded: TAX_INCLUDED,
    category: "momi",
  },
  {
    id: "momi-karubi",
    name: "もみカルビ",
    nameEn: "MOMI KARUBI",
    description: "秘伝のタレをもみ込んだカルビ。",
    price: 2000,
    taxIncluded: TAX_INCLUDED,
    category: "momi",
  },

  // ── 牛肉 ────────────────────────────────────
  {
    id: "jo-rosu",
    name: "上ロース",
    nameEn: "PREMIUM LOIN",
    description: "きめ細やかな上質のロース。素材そのものの旨みをお楽しみください。",
    price: 2800,
    taxIncluded: TAX_INCLUDED,
    category: "beef",
    image: media.menu.joRosu.src,
    recommended: true,
  },
  {
    id: "jo-harami",
    name: "上ハラミ",
    nameEn: "PREMIUM SKIRT",
    price: 2800,
    taxIncluded: TAX_INCLUDED,
    category: "beef",
  },
  {
    id: "meigara-tokujo-karubi",
    name: "銘柄牛特上カルビ",
    nameEn: "BRANDED BEEF SPECIAL KARUBI",
    description: "銘柄牛の特上カルビ。",
    price: 3300,
    taxIncluded: TAX_INCLUDED,
    category: "beef",
  },
  {
    id: "rosu",
    name: "ロース",
    nameEn: "LOIN",
    price: 1800,
    taxIncluded: TAX_INCLUDED,
    category: "beef",
  },
  {
    id: "harami",
    name: "ハラミ",
    nameEn: "SKIRT",
    price: 1850,
    taxIncluded: TAX_INCLUDED,
    category: "beef",
  },
  {
    id: "karubi",
    name: "カルビ",
    nameEn: "KARUBI",
    price: 1900,
    taxIncluded: TAX_INCLUDED,
    category: "beef",
  },
  {
    id: "ooban-harami-jabara",
    name: "大判ハラミじゃばら焼き",
    nameEn: "LARGE-CUT SKIRT",
    description: "大判のハラミをじゃばら状に切り込みを入れて焼き上げます。",
    price: 3300,
    taxIncluded: TAX_INCLUDED,
    category: "beef",
  },

  // ── ホルモン ─────────────────────────────────
  {
    id: "korikori",
    name: "コリコリ",
    nameEn: "KORIKORI",
    description: "独特の歯ごたえが人気の一品。",
    price: 600,
    taxIncluded: TAX_INCLUDED,
    category: "hormone",
  },

  // ── 一品料理 ─────────────────────────────────
  {
    id: "ishiyaki-cheese-fondue",
    name: "石焼チーズフォンデュ",
    nameEn: "STONE-GRILLED CHEESE FONDUE",
    description: "熱々の石焼でとろけるチーズフォンデュ。焼肉と合わせてどうぞ。",
    price: 935,
    taxIncluded: TAX_INCLUDED,
    category: "single",
    image: media.menu.cheeseFondue.src,
    recommended: true,
  },
  {
    id: "ninniku-oil-yaki",
    name: "にんにくオイル焼",
    nameEn: "GARLIC OIL GRILL",
    price: 600,
    taxIncluded: TAX_INCLUDED,
    category: "single",
  },

  // ── キムチ・ナムル ────────────────────────────
  {
    id: "kimchi-moriawase",
    name: "キムチ盛合せ",
    nameEn: "KIMCHI ASSORTMENT",
    price: 1200,
    taxIncluded: TAX_INCLUDED,
    category: "kimchi",
  },
  {
    id: "namul",
    name: "ナムル（3種盛り）",
    nameEn: "NAMUL (3 KINDS)",
    price: 800,
    taxIncluded: TAX_INCLUDED,
    category: "kimchi",
  },

  // ── スープ ──────────────────────────────────
  {
    id: "gomoku-chige",
    name: "五目チゲ",
    nameEn: "GOMOKU JJIGAE",
    description: "具だくさんのチゲ。〆にもおすすめです。",
    price: 2700,
    taxIncluded: TAX_INCLUDED,
    category: "soup",
  },

  // ── 麺・ご飯 ─────────────────────────────────
  {
    id: "reimen-frozen",
    name: "冷麺しゃりしゃりフローズン",
    nameEn: "FROZEN REIMEN",
    description: "しゃりしゃりとした食感のフローズン冷麺。",
    price: 800,
    taxIncluded: TAX_INCLUDED,
    category: "noodle-rice",
  },
];

/** データ整合性チェック（ビルド時に不正なデータがあれば失敗します） */
menuItems.forEach((item) => menuItemSchema.parse(item));
menuCategories.forEach((category) => menuCategorySchema.parse(category));

const knownCategoryIds = new Set(menuCategories.map((c) => c.id));
menuItems.forEach((item) => {
  if (!knownCategoryIds.has(item.category)) {
    throw new Error(`Unknown menu category "${item.category}" on item "${item.id}"`);
  }
});

/** おすすめ品目（トップページの SIGNATURE セクションで使用） */
export const recommendedItems = menuItems.filter((item) => item.recommended);

/** 品目が存在するカテゴリーのみを返します */
export function getPopulatedCategories(): (MenuCategory & { items: MenuItem[] })[] {
  return menuCategories
    .map((category) => ({
      ...category,
      items:
        category.id === "recommended"
          ? recommendedItems
          : menuItems.filter((item) => item.category === category.id),
    }))
    .filter((category) => category.items.length > 0);
}

/** 価格の表示文字列（例: ¥5,600） */
export function formatPrice(price: number): string {
  return `¥${price.toLocaleString("ja-JP")}`;
}
