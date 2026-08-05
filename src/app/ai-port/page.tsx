import type { Metadata } from "next";

/**
 * 旧 AI PORT の転送ページ。
 *
 * ■ なぜ残すのか
 *   AI PORT は 2026-08-04 に jiantailanglin266-rgb/ai-port へ分離しました。
 *   GitHub Pages はサーバー側の 301 を返せないため、旧URLへ来た人と
 *   クローラーを取りこぼさないよう、案内ページだけを残しています。
 *   本体のコードは千里側から削除済みです。
 *
 * ■ 転送のかけ方
 *   `<meta http-equiv="refresh">` と `<script>` の両方を置きます。
 *   JavaScript が無効でも meta で飛び、有効なら script が即座に飛ばします。
 *   `location.replace` を使うのは、戻るボタンでこのページに戻らせないためです。
 *
 * ■ 検索エンジンへの伝え方
 *   canonical を新URLに向け、`noindex` は付けません。
 *   noindex を付けると転送の意図が伝わる前に旧URLが落ち、
 *   評価の引き継ぎができなくなります。
 *
 * ■ 下層URL（/ai-port/news など）について
 *   静的エクスポートでは1ページずつ実体が要るため、ここでは受けられません。
 *   旧下層URLは 404 になります。トップだけでも導線を残すのが目的です。
 */

const NEW_URL = "https://jiantailanglin266-rgb.github.io/ai-port/";

export const metadata: Metadata = {
  title: "AI PORT は移転しました",
  description: `AI PORT は ${NEW_URL} へ移転しました。`,
  alternates: { canonical: NEW_URL },
  robots: { index: true, follow: true },
};

export default function AiPortMoved() {
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${NEW_URL}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: `location.replace(${JSON.stringify(NEW_URL)});`,
        }}
      />

      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "2rem",
          textAlign: "center",
          background: "#04060f",
          color: "#c3cee4",
          fontFamily: "system-ui, sans-serif",
          lineHeight: 1.9,
        }}
      >
        <div>
          <h1 style={{ color: "#f4f8ff", fontSize: "1.5rem", marginBottom: "1rem" }}>
            AI PORT は移転しました
          </h1>
          <p style={{ marginBottom: "1.5rem" }}>
            自動的に移動します。切り替わらない場合は、下のリンクをお使いください。
          </p>
          <a href={NEW_URL} style={{ color: "#2ee6ff", wordBreak: "break-all" }}>
            {NEW_URL}
          </a>
        </div>
      </main>
    </>
  );
}
