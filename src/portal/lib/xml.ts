/**
 * XML に埋め込む文字列のエスケープ。
 *
 * サイトマップとRSSで同じ処理が要るため、1か所にまとめています。
 * 片方だけ直して、もう片方でエスケープ漏れが残るのを防ぐためです。
 */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
