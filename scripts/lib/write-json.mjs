/**
 * 生成した JSON を、Prettier の書式で書き出します。
 *
 * ============================================================
 * ⚠ なぜ JSON.stringify のままではいけないか
 *
 *   `JSON.stringify(value, null, 2)` は短い配列も必ず改行します。
 *     "alternateQueries": [
 *       "travel luggage"
 *     ],
 *   Prettier は同じものを1行に畳みます。
 *     "alternateQueries": ["travel luggage"],
 *
 *   この差で `npm run format:check` が落ちます。
 *   media-sync.yml では整形チェックの後に「生成物をコミットする」段があるため、
 *   ここで落ちると **取得に成功しても1件もコミットされません**。
 *   実際、run #1 / #2 はこれで止まっていました。
 * ============================================================
 */
import { writeFile } from "node:fs/promises";
import { format, resolveConfig } from "prettier";

/**
 * @param {string} filePath 書き出し先
 * @param {unknown} value   JSON にする値
 */
export async function writeJson(filePath, value) {
  const raw = `${JSON.stringify(value, null, 2)}\n`;

  let contents = raw;
  try {
    // ⚠ format() は .prettierrc を自動では読みません。
    //   読まずに整形すると printWidth などが既定値になり、
    //   format:check と食い違ったままになります（この不具合の原因でした）。
    const config = (await resolveConfig(filePath)) ?? {};
    contents = await format(raw, { ...config, filepath: filePath });
  } catch {
    // Prettier が読めない場合でも、生成そのものは止めません。
    // （整形は format:check が改めて検出します）
  }

  await writeFile(filePath, contents, "utf8");
}
