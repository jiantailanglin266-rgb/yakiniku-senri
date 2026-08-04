/**
 * 構造化データの埋め込み。
 *
 * `dangerouslySetInnerHTML` を使うため、`<` をエスケープして
 * スクリプトタグの早期終了（XSS）を防ぎます。
 */
export function JsonLd({ data }: { data: Array<Record<string, unknown> | null> }) {
  const items = data.filter(Boolean) as Record<string, unknown>[];
  if (items.length === 0) return null;

  const json = JSON.stringify(items.length === 1 ? items[0] : items).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      // 生成元はすべてサーバー側の自前データで、外部入力は含みません
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
