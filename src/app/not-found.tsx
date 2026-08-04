import Link from "next/link";

/**
 * 全体の 404。
 *
 * このアプリはルートレイアウトを2つ持ちます（`(senri)` と `(cardport)`）。
 * どちらのグループにも該当しないURLはこのファイルが処理するため、
 * ここでは `<html>` / `<body>` を自前で出力する必要があります。
 */
export default function GlobalNotFound() {
  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "grid",
          placeItems: "center",
          background: "#05070f",
          color: "#e8ecf8",
          fontFamily:
            "system-ui, -apple-system, 'Hiragino Sans', 'Yu Gothic', 'Noto Sans JP', sans-serif",
        }}
      >
        <main style={{ padding: "2rem", textAlign: "center" }}>
          <p style={{ fontSize: "3rem", margin: 0, letterSpacing: "0.1em", opacity: 0.5 }}>404</p>
          <h1 style={{ fontSize: "1.15rem", fontWeight: 500, margin: "1rem 0 0" }}>
            お探しのページが見つかりませんでした
          </h1>
          <p style={{ fontSize: "0.85rem", opacity: 0.7, lineHeight: 2 }}>
            The page you are looking for could not be found.
          </p>
          <p
            style={{ display: "flex", gap: "1.25rem", justifyContent: "center", flexWrap: "wrap" }}
          >
            <Link href="/" style={{ color: "#5ad9ff" }}>
              焼肉 千里 トップへ
            </Link>
            <Link href="/ja" style={{ color: "#5ad9ff" }}>
              CARD PORT トップへ
            </Link>
          </p>
        </main>
      </body>
    </html>
  );
}
