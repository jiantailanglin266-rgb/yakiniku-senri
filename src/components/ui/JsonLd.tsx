export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // JSON-LD は静的データのみを出力します
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
