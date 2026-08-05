/**
 * 生成した JSON を、Prettier の整形どおりに書き出します。
 *
 * ■ なぜ必要か
 *   `JSON.stringify(value, null, 2)` と Prettier の整形は一致しません。
 *   Prettier は短い配列を1行にまとめますが、JSON.stringify は必ず展開します。
 *
 *     JSON.stringify → "titles": [\n  "Airport terminal"\n ]
 *     Prettier       → "titles": ["Airport terminal"]
 *
 *   このリポジトリの `format:check` は すべての .json を対象にしているため、
 *   生成物をそのまま書き出すと CI が落ちます。
 *   実際に media-sync ワークフローがこれで停止し、取得したデータが
 *   コミットされずに破棄されました。
 *
 * ■ 設定ファイルを読ませています
 *   整形規則を引数で再現すると、`.prettierrc` を変えたときに食い違います。
 *   対象ファイルのパスから解決させ、常に本体と同じ設定を使います。
 */
import { writeFile } from "node:fs/promises";
import * as prettier from "prettier";

/**
 * @param {string} filePath 書き出し先（Prettier の設定解決にも使います）
 * @param {unknown} value   JSON にする値
 */
export async function writeJsonFormatted(filePath, value) {
  const raw = `${JSON.stringify(value, null, 2)}\n`;

  let formatted = raw;
  try {
    const options = await prettier.resolveConfig(filePath);
    formatted = await prettier.format(raw, { ...options, filepath: filePath, parser: "json" });
  } catch (error) {
    // Prettier が無い環境でも書き出しは続けます（整形だけ諦めます）
    console.warn(`整形をスキップしました（${error.message}）`);
  }

  await writeFile(filePath, formatted, "utf8");
}
