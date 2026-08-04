# CARD PORT — セットアップと運用

> 未来の支払いと信用を、ひとつの画面に。

クレジットカード比較・ポイント・マイル・法人決済・キャッシュレス・Web3.0 決済・
金融ニュース・動画・AI コンシェルジュを統合したフィンテックポータルです。

---

## 0. このリポジトリの構成（重要）

このリポジトリは **4つのサイトを1つの Next.js アプリで配信** します。

| サイト                        | URL                       | ソース                                    |
| ----------------------------- | ------------------------- | ----------------------------------------- |
| 焼肉 千里（既存・本番稼働中） | `/`, `/menu`, `/news/...` | `src/app/(senri)/**`                      |
| AI PORT                       | `/ai-port`                | `src/app/ai-port/**`                      |
| CRYPTO PORT                   | `/<言語>/...`             | `src/app/(portal)/**`                     |
| **CARD PORT**                 | `/card-port/<言語>/...`   | `src/app/card-port/**`, `src/cardport/**` |

- `<html>` / `<body>` はルートレイアウト（`src/app/layout.tsx`）が持ちます。
  各サイトの外枠は自分のレイアウトにあり、CARD PORT は `src/app/card-port/layout.tsx` です。
- **`/<言語>/` は先に CRYPTO PORT が使っている**ため、CARD PORT は AI PORT と同じ流儀で
  `/card-port` 配下に置いています。内部リンクは必ず `src/cardport/lib/routes.ts` を経由してください。
- `cardport.css` は `/card-port` 配下からのみ読み込みます。
  トークン名はすべて `cp-` 接頭辞付き（`--color-cp-ink` → `text-cp-ink`）で、
  他サイトのトークンと衝突しません。カスタムクラスは `.cardport-root` の配下に閉じ込めています。
- preflight（リセット）はルートの `globals.css` が配信済みのため、
  `cardport.css` では theme と utilities のレイヤーだけを読み込みます。

## 1. セットアップ

```bash
npm ci
cp .env.example .env.local     # 値は空のままでも全機能が動きます
npm run cardport:assets        # OGP画像とアイコンのプレースホルダーを生成
npm run dev                    # http://localhost:3000/card-port/ja
```

Node.js は 22 以上を想定しています（CI と同じ）。

### 起動方法

| コマンド                  | 用途                                |
| ------------------------- | ----------------------------------- |
| `npm run dev`             | 開発サーバー                        |
| `npm run build`           | 本番ビルド                          |
| `npm run start`           | ビルド済みの本番サーバー            |
| `npm run typecheck`       | 型チェック                          |
| `npm run lint`            | ESLint                              |
| `npm run test`            | Vitest                              |
| `npm run format:check`    | Prettier の差分チェック             |
| `npm run cardport:assets` | CARD PORT の OGP・アイコン生成      |
| `npm run placeholders`    | 焼肉 千里のプレースホルダー画像生成 |

> **注意**: 開発サーバーは Tailwind の再生成が遅れることがあります。
> 見た目の最終確認は `npm run build && npm run start` で行ってください。

---

## 2. 環境変数

すべて `.env.example` に列挙しています。**値が空でもサイト全体が動きます。**

とくに重要なもの:

| 変数                                                              | 役割                                                       |
| ----------------------------------------------------------------- | ---------------------------------------------------------- |
| `NEXT_PUBLIC_CARDPORT_URL`                                        | canonical / hreflang / サイトマップの絶対URL               |
| `NEXT_PUBLIC_CARDPORT_NAME` / `_WORDMARK_LEAD` / `_WORDMARK_TAIL` | サイト名・ロゴ                                             |
| `NEXT_PUBLIC_CARDPORT_COLOR_*`                                    | ブランドカラー（サイト全体に反映）                         |
| `NEXT_PUBLIC_CARDPORT_COMPANY` ほか                               | 運営会社情報。**未設定なら画面に「未設定」と表示されます** |
| `NEXT_PUBLIC_DATA_SOURCE`                                         | `mock`（既定） / `live`                                    |
| `CARDPORT_CONTENT_LOCALES`                                        | 詳細ページを生成する言語                                   |

> ⚠ `SUPABASE_SERVICE_ROLE_KEY` や `ANTHROPIC_API_KEY` に `NEXT_PUBLIC_` を付けないでください。
> 付けるとクライアントのバンドルに埋め込まれます。

---

## 3. モックデータと本番データの切り替え

初期状態は **すべて架空データ** です（`NEXT_PUBLIC_DATA_SOURCE=mock`）。

- カード名・券面デザイン・数値・発行会社はすべてフィクションです。
- 実在するカードの商標・ロゴ・券面画像は使用していません。
- 券面は `card.art` の3色から CSS で描画するプレースホルダーです。
- モック表示中は、トップページに「サンプルデータです」の注記が出ます。

本番データへ切り替えるには:

1. `src/cardport/data/types.ts` の型を契約として、Supabase のテーブルを作る
   （`docs/cardport/db-schema.sql` をそのまま流し込めます）
2. `src/cardport/data/*.ts` の配列を、Supabase から取得する非同期関数に置き換える
3. `NEXT_PUBLIC_DATA_SOURCE=live` を設定する
4. 券面画像を各カード会社から提供された素材に差し替える

型が同じである限り、コンポーネント側の変更は不要です。

---

## 4. カードを追加する

`src/cardport/data/cards.ts` の配列に1件足すだけです。

```ts
{
  ...defaults,
  id: "new-card",
  slug: "new-card",          // ⚠ カテゴリIDと衝突させない（テストで検出されます）
  name: { ja: "新しいカード", en: "New Card" },
  issuerId: "nova",          // issuers.ts に存在するID
  brands: ["visa"],
  rank: "standard",
  categories: ["free-annual-fee", "beginner"],
  art: { from: "#0ea5e9", via: "#3b82f6", to: "#1e1b4b", texture: "matte" },
  annualFee: 0,
  baseRate: 1.0,
  maxRate: 2.0,
  // …（型が必須項目を教えてくれます）
  verifiedOn: "2026-08-01",  // ⚠ 実際に確認した日付を入れる
  updatedOn: "2026-08-01",
}
```

追加すると、以下が**自動的に**追随します。

- カード一覧・検索・比較
- 該当カテゴリのページとランキング（スコアから機械的に順位づけ）
- 目的別特集（条件に合致すれば自動掲載）
- サイトマップ・チャットボットの索引
- 診断・シミュレーターの候補

`npm run test` を実行すると、スラッグの衝突・参照切れ・数値の矛盾を検出します。

---

## 5. 比較項目を追加する

1. `src/cardport/data/types.ts` の `Card` 型にフィールドを足す
2. `src/cardport/data/cards.ts` の全カードに値を入れる（型エラーが漏れを教えてくれます）
3. 表示したい場所に足す
   - 比較表 → `src/cardport/components/cards/CompareView.tsx` の `rows`
   - カード詳細 → `src/app/card-port/[locale]/cards/[slug]/page.tsx` の仕様表
   - 絞り込み条件 → `src/cardport/lib/search.ts` の `FeatureFlag` と `matchesFeature`
4. 必要なら辞書（`src/cardport/i18n/dictionaries/ja.ts`・`en.ts`）にラベルを足す

---

## 6. ランキングを更新する

順位は**手で並べません**。`src/cardport/lib/scoring.ts` が計算します。

- 各カードの `scores`（6軸・0〜5）を更新する
- カテゴリ別の重みを変えたいときは `categoryWeights` を編集する
- 重みはランキングページに自動で表示されます（`/card-port/ja/rankings/<category>`）

**広告の報酬額は順位の入力に使いません。**
`scoring.ts` は `affiliate.ts` を import しない構造にして、コードの依存関係で担保しています。

---

## 7. キャンペーンを更新する

`src/cardport/data/campaigns.ts` を編集します。

- `endsOn` を過ぎたキャンペーンは自動的に「掲載期限を過ぎています」に切り替わり、
  申込みCTA が消えます（削除しなくて構いません）
- `conditions` は**必ず全文**書いてください。畳んだり省略したりしないでください
- 管理画面（`/card-port/ja/admin`）に期限の一覧が出ます

---

## 7.1 斜めマーキーのキーワードを増やす

トップページ中盤の斜めの帯は `src/cardport/data/marquee.ts` です。

- 流してよいのは**扱っている話題の名前だけ**です。
  金額・還元率・順位は流しません。条件を伴わない数字だけが目に入ると、
  実際の条件と食い違って読まれます
- **実在する決済ブランド名を書かないでください。** 掲載カードはすべて架空のため、
  そのブランドを扱っているかのように読めてしまいます
- `accent` は文字色に使えるトークンだけです（`cyan` / `magenta` / `emerald` / `amber` / `gold`）。
  `violet` と `electric` は暗い地の上で 4.5:1 を割るため、面（枠線・発光）専用です
- 行への配分は `marqueeRows()` が順に振り分けます。1語足すだけで済みます

上の3点は `tests/cardport-data.test.ts` の「斜めマーキーのキーワード」で機械的に確認しています。

---

## 8. 多言語を追加する

1. `src/cardport/i18n/locales.ts` の `localeDefinitions` に1行足す
   （`hreflang` / `country` / `label` / `intl` / `currency`）
2. `public/images/flags/<国コード>.webp` に国旗画像を置く
3. `src/cardport/i18n/dictionaries/partials.ts` に主要キーの翻訳を足す
   （未訳のキーは英語 → 日本語の順に自動でフォールバックします）

コンテンツ（カード名・記事本文）は `LocalizedText` 型で、`ja` が必須、`en` が推奨です。
未定義の言語は `en` → `ja` の順に落ちます。

### 翻訳の現状

| 対象       | ja     | en     | その他12言語                               |
| ---------- | ------ | ------ | ------------------------------------------ |
| UI 辞書    | 全キー | 全キー | 主要キー（ナビ・FV・カード項目・法務注記） |
| コンテンツ | 全件   | 全件   | 英語へフォールバック                       |

---

## 9. アフィリエイトリンクを設定する

`src/cardport/lib/affiliate.ts` の `affiliateLinks` を編集します。

```ts
"nova-zero": {
  id: "nova-zero",
  program: "Nova Financial",
  url: "https://partner.example/apply?id=xxxx",  // 提携リンク
  expiresOn: "2026-12-31",                        // 掲載終了日（任意）
  regionUrls: { JP: "...", US: "..." },           // 地域別リンク（任意）
},
```

`url` が空の間は、公式サイトへ `rel="nofollow"` の**通常リンク**として遷移し、
「PR」ラベルも表示されません（広告ではないため）。

提携リンクを入れると自動で:

- `rel="sponsored nofollow noopener noreferrer"` を付与
- `utm_source` / `utm_medium` / `utm_campaign`（掲載位置）/ `utm_content`（カード）/ `cp_lang` / `cp_pos` を付与
- `data-cp-*` 属性と `dataLayer` イベントでクリックを計測
- 「PR」ラベルを表示
- 期限を過ぎたら公式サイトへ自動フォールバック

未設定・期限切れの一覧は管理画面（`/card-port/ja/admin`）で確認できます。

---

## 10. 管理画面

`/card-port/ja/admin` は**読み取り専用の運用ダッシュボード**です（`noindex`）。

表示内容:

- 掲載件数（カード・ニュース・動画・診断…）
- アフィリエイトリンクの状態（未設定 / 有効 / 期限切れ）
- キャンペーンの期限一覧
- 情報確認日から 90 日を超えたカード
- アクセス解析の接続状況

**編集機能はあえて実装していません。** 認証のない編集画面を公開することは、
金融メディアとして許容できないためです。有効化する手順:

1. Supabase Auth を導入し、`card-port/[locale]/admin` をセッション必須にする
2. ロール（編集者／承認者／管理者）を作り、公開操作を承認者以上に限定する
3. 管理者アカウントに多要素認証を必須化する
4. 変更差分を監査ログへ記録する（誰が・いつ・何を変えたか）
5. 変更履歴テーブル（`db-schema.sql` の `*_history`）へ旧値を保存する

---

## 11. AIチャットボット

既定では **APIキー不要** で動きます。

- 掲載データ（カード・キャンペーン・記事・FAQ・ツール・Web3・動画・診断・シミュレーター）から
  索引を作り、ブラウザ内で検索します（`src/cardport/lib/rag.ts`）
- **掲載データにある文だけ**を返し、事実に無い内容を生成しません
- 回答には必ず参照元リンクと情報確認日を添えます
- カード番号らしき入力を検出したら回答せずに警告します

生成モデルへ接続する場合は `NEXT_PUBLIC_CHAT_API_URL` にサーバー側エンドポイントを設定し、
`retrieve()` の結果を文脈として渡してください。**APIキーはクライアントへ出さないでください。**

---

## 12. デプロイ

### GitHub Pages（プレビュー）

`.github/workflows/deploy-pages.yml` が `main` への push で動きます。
静的エクスポート（`output: "export"`）のため:

- 検索・絞り込み・比較・診断・シミュレーター・チャットはすべてクライアント実行
- サイトマップ・RSS は静的ファイルとして出力されます
- **詳細ページは `ja` / `en` のみ生成**します（ビルド時間の都合。`CARDPORT_CONTENT_LOCALES` で変更可）

### Vercel（本番想定）

環境変数を設定して通常どおりデプロイしてください。
`GITHUB_PAGES` を設定しなければ全 14 言語の詳細ページが生成されます（約 2,200 ページ / 約 20 秒）。

ISR や Edge へ移す場合は、各ページの `dynamicParams` と `revalidate` を調整してください。

---

## 13. 生成されるフィード

| パス                           | 内容                                                |
| ------------------------------ | --------------------------------------------------- |
| `/sitemap.xml`（統合）         | 全ページ（各URLに `xhtml:link` で全言語の相互参照） |
| `/card-port/news-sitemap.xml`  | ニュース（直近2日分）                               |
| `/card-port/video-sitemap.xml` | 動画                                                |
| `/card-port/rss.xml`           | ニュースRSS（日本語）                               |
| `/sitemap.xml`                 | **焼肉 千里のもの**（従来どおり）                   |

同じホストに同居している場合、`robots.txt` に CARD PORT のサイトマップも自動で列挙されます。

---

## 14. ディレクトリ構成

```
src/
├── app/
│   ├── layout.tsx             # 4サイト共通のルートレイアウト（html / body）
│   ├── (senri)/               # 焼肉 千里
│   ├── (portal)/              # CRYPTO PORT（/<言語>/）
│   ├── ai-port/               # AI PORT
│   ├── card-port/             # CARD PORT
│   │   ├── layout.tsx         # .cardport-root（外枠・フォント・背景）
│   │   ├── [locale]/          # 言語つきの全ページ
│   │   └── *.xml/             # ニュース・動画サイトマップ / RSS
│   ├── globals.css
│   ├── robots.ts / sitemap.ts # サイトマップは4サイト分をここで統合
└── cardport/
    ├── config/site.ts         # サイト名・ロゴ・色・運営会社（差し替え口）
    ├── i18n/                  # 言語定義・辞書・書式
    ├── data/                  # 型とモックデータ
    ├── lib/                   # スコアリング・診断・計算・検索・RAG・SEO・サイトマップ
    ├── hooks/                 # 比較リスト
    ├── components/            # UI
    └── styles/cardport.css    # デザインシステム
```

## 15. 関連ドキュメント

| ファイル                                       | 内容                                                             |
| ---------------------------------------------- | ---------------------------------------------------------------- |
| [`architecture.md`](./architecture.md)         | サイトマップ・ユーザー導線・デザインシステム・コンポーネント一覧 |
| [`db-schema.sql`](./db-schema.sql)             | DB スキーマ（38テーブル＋履歴テーブル）                          |
| [`api-design.md`](./api-design.md)             | API 設計                                                         |
| [`ranking-criteria.md`](./ranking-criteria.md) | ランキング評価基準の算定方法                                     |
| [`checklists.md`](./checklists.md)             | SEO / セキュリティ / 法務チェックリスト                          |
| [`status.md`](./status.md)                     | 実装済み機能・未実装機能・既知の問題                             |
