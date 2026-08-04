# SPORTS PORT

> 世界中の熱狂を、リアルタイムで。
> 試合速報、ニュース、配信、データ、Web3.0 をひとつのスポーツターミナルに。

15言語対応の次世代型スポーツポータル。**APIキーがなくても、全ページが同梱のモックデータで動きます。**

| ドキュメント                                 | 内容                                             |
| -------------------------------------------- | ------------------------------------------------ |
| [01-design.md](./01-design.md)               | 設計方針・ページ一覧・トップ構成・導線・フェーズ |
| [02-design-system.md](./02-design-system.md) | カラー・タイポ・エフェクト・コンポーネント一覧   |
| [03-architecture.md](./03-architecture.md)   | ディレクトリ構成・DBスキーマ・API設計・更新方式  |
| [04-checklists.md](./04-checklists.md)       | SEO / セキュリティ / 法務 チェックリスト         |
| [07-status.md](./07-status.md)               | 実装済み / 未実装 / 既知の問題 / 次の作業        |

---

## セットアップ

```bash
npm install
npm run dev
```

| URL                            | 内容                    |
| ------------------------------ | ----------------------- |
| http://localhost:3000/ja       | 日本語トップ            |
| http://localhost:3000/en       | 英語トップ              |
| http://localhost:3000/ar       | アラビア語（RTL確認用） |
| http://localhost:3000/ja/live  | ライブスコア            |
| http://localhost:3000/ja/admin | 管理画面デモ            |

環境変数は `.env.example` をコピーして使います（**なくても全ページ動作します**）。

```bash
cp .env.example .env.local
```

---

## コマンド

```bash
npm run dev            # 開発サーバー
npm run build          # 本番ビルド
npm run start          # 本番サーバー
npm run typecheck      # 型チェック
npm run lint           # ESLint
npm run test           # Vitest（153件）
npm run format:check   # Prettier
npm run sports:assets  # OGP画像の再生成（ブランド変更時）
```

---

## モックデータと実APIの切り替え

```bash
SPORTS_DATA_SOURCE=mock   # 同梱のモックデータ（既定）
SPORTS_DATA_SOURCE=live   # 外部API
```

`mock` のときは全ページ上部に「デモデータを表示しています」バナーが出ます。

実APIへ接続するときは `src/sports/lib/api.ts` の `fetchWithGuards()` に fetcher を渡します。
タイムアウト・リトライ・指数バックオフ・取得時刻の記録はこの関数が担います。

```ts
const result = await fetchWithGuards(
  () =>
    fetch(`${process.env.SPORTS_API_FOOTBALL_BASE_URL}/fixtures?live=all`, {
      headers: { "x-api-key": process.env.SPORTS_API_FOOTBALL_KEY! },
    }).then((response) => response.json()),
  { source: "API-FOOTBALL", refreshIntervalSec: 30, timeoutMs: 5000, retries: 2 },
);

if (!result.ok) {
  // 古い値を「最新」として返さない。UI は「取得できませんでした」を表示する
}
```

---

## 競技の追加方法

`src/sports/data/sports.ts` に1件足すだけです。順位表の列・スタッツ項目・試合の区切り方はここで決まります。

```ts
{
  id: "handball",
  slug: "handball",
  name: { ja: "ハンドボール", en: "Handball" },
  glyph: "🤾",
  accent: "#14b8a6",
  periodType: "half",
  periodCount: 2,
  scoreboard: ["score", "clock", "period"],
  hasDraw: true,
  standingsType: "table",
  standingsColumns: [
    { key: "played", label: { ja: "試", en: "P" }, higherIsBetter: true, primary: true },
    { key: "points", label: { ja: "点", en: "Pts" }, higherIsBetter: true, primary: true },
  ],
  statKeys: [{ key: "shots", label: { ja: "シュート", en: "Shots" } }],
  primer: { ja: "30分ハーフ。7人制で…", en: "Two 30-minute halves…" },
}
```

順位表・スコアボード・スタッツバーはこの設定を読むだけなので、**コンポーネントの改修は不要**です。
`/{locale}/sports/handball` と `/{locale}/leagues` に自動で現れます。

## リーグの追加方法

`src/sports/data/leagues.ts` に1件追加し、必要なら `teams.ts` `standings.ts` にチームと順位を足します。
`/{locale}/leagues/<slug>` が自動生成され、サイトマップにも入ります。

## 多言語の追加方法

1. `src/sports/i18n/locales.ts` に1行足す（`code` / `hreflang` / `country` / `label` / `intl` / `timeZone`）
2. `public/images/flags/<country>.webp` に国旗を置く
3. 必要なら `src/sports/i18n/partials.ts` に主要キーの翻訳を足す（無くても英語にフォールバック）

テストが「全ロケールに国旗画像がある」「未翻訳キーが空にならない」ことを検証します。

## アフィリエイトリンクの設定方法

`src/sports/data/content.ts` の `affiliateLinks` を編集します。

```ts
{
  id: "aff-example",
  campaign: "streaming-compare",
  label: { ja: "公式サイトで確認する", en: "Check the official site" },
  url: "https://example.com/",
  overrides: [{ locale: "en", url: "https://example.com/?lang=en" }],  // 言語・地域別
  variants: [{ id: "a", label: {...} }, { id: "b", label: {...} }],    // A/Bテスト
  disclosure: true,   // 「PR」表記（必須）
  active: true,
}
```

サービス側（`streaming.ts` / `web3.ts`）の `affiliateId` にこの ID を書くと紐づきます。
リンクには自動で `rel="sponsored nofollow"` と「PR」バッジ、`data-campaign` / `data-placement`（計測用）が付きます。

## サイト名・ロゴ・カラーの変更方法

`src/sports/config/site.ts`（または環境変数）を書き換えます。

```ts
export const brand = { name: "SPORTS PORT", mark: "SP", logoSrc: "", origin: "...", ... };
export const theme = { base: "#04060f", primary: "#22d3ee", ... };
export const features = { betting: true, web3: true, diagnosis: true, chatbot: true, admin: true };
```

カラーの実体は `src/app/(sports)/sports.css` の `@theme` です。
OGP画像を作り直す場合は `npm run sports:assets` を実行してください。

## 管理画面

`/{locale}/admin` は**読み取り専用のデモ**です（`noindex`）。
主要指標・人気競技・言語別アクセス・登録件数・アフィリエイトリンク一覧・運用の健全性を確認できます。

本番運用では多要素認証・権限管理・監査ログが前提です。要件は画面下部と
[04-checklists.md](./04-checklists.md) に記載しています。

---

## デプロイ

### Vercel（推奨）

そのまま `npm run build`。ルート `/` は焼肉 千里、`/ja` 以下が SPORTS PORT です。

### GitHub Pages（静的書き出し）

`.github/workflows/deploy-pages.yml` が `main` への push で動きます。

```bash
GITHUB_PAGES=true PAGES_BASE_PATH=/<repo> NEXT_PUBLIC_BASE_PATH=/<repo> npm run build
# → out/ に 2,571 ページ
```

---

## 設計上の判断

作る前に決めて、最後まで守ったことです。

1. **スコアと時刻は、どんな装飾よりも先に読める。** 装飾は背景レイヤーに閉じ込め、データは不透明な面に載せる
2. **いつのデータかを隠さない。** 取得時刻・更新間隔・情報元を必ず添える。取得に失敗したら古い値を最新として出さない
3. **未確認の情報は載せない。** 推測値を入れるくらいなら空のままにする
4. **競技を増やしてもコードは増やさない。** 差分はすべて `Sport` の設定値に寄せる
5. **勝敗を予言しない。利益を保証しない。** 診断・AI分析・チャットボットすべてに適用

これらはテストで守られています（`tests/sports-data.test.ts` / `tests/sports-components.test.tsx`）。
