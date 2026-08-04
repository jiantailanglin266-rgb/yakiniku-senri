/**
 * リポジトリ全体の配信先URL。
 *
 * ここには**サイト固有の情報を置きません**。
 * 4つのポータルが同居しており、1つを代表にすると必ずどこかで嘘になります。
 * 各サイトの名前・説明・SNS・OGPは、それぞれの設定が持ちます。
 *   - CRYPTO PORT … src/portal/lib/site.ts
 *   - AI PORT     … src/data/ai-port/site.ts
 *   - CARD PORT   … src/cardport/config/site.ts
 *   - SPORTS PORT … src/sports/config/site.ts
 *
 * この値は robots.txt のように「配信オリジン単位」でしか書けないものだけが使います。
 */
import { basePath } from "@/lib/base-path";

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://example.com").replace(
  /\/$/,
  "",
);

/**
 * サイト内パスを絶対URLへ変換します。
 *
 * サブディレクトリ配信では siteUrl の末尾と `withBasePath()` を通した
 * パスの先頭に、同じベースパスが二重で入ります。
 * そのままつなぐと参照できないURLになるため、ここで重複を取り除きます。
 */
export function absoluteUrl(path: string): string {
  const isDuplicated = basePath !== "" && siteUrl.endsWith(basePath) && path.startsWith(basePath);
  return `${siteUrl}${isDuplicated ? path.slice(basePath.length) : path}`;
}
