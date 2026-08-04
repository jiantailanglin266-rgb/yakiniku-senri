# CRYPTO PORT（仮称）

次世代型の仮想通貨・Web3.0 ポータルサイト。

> **サイト名・ロゴ・ドメインは仮です。** すべて環境変数で差し替えられます（後述）。

コンセプトは「未来の金融市場を可視化する、次世代 Web3.0 ターミナル」。
リアルタイム市場情報・ニュース・取引所比較・診断・AIチャットボット・YouTube連携・
学習コンテンツ・Web3.0ツール検索を、1つのサイトに統合しています。

---

## 目次

1. [セットアップ](#1-セットアップ)
2. [起動方法](#2-起動方法)
3. [環境変数](#3-環境変数)
4. [API 接続方法](#4-api-接続方法)
5. [モック ⇔ 本番の切り替え](#5-モック--本番の切り替え)
6. [デプロイ方法](#6-デプロイ方法)
7. [管理画面の使い方](#7-管理画面の使い方)
8. [多言語の追加方法](#8-多言語の追加方法)
9. [アフィリエイトリンクの設定方法](#9-アフィリエイトリンクの設定方法)
10. [AIチャットボット](#10-aiチャットボット)
11. [コンテンツの編集方法](#11-コンテンツの編集方法)
12. [設計ドキュメント](#12-設計ドキュメント)

---

## 1. セットアップ

```bash
npm install
cp .env.example .env.local
```

**環境変数は1つも設定しなくても、サイト全体を確認できます。**
市場データはモック、ニュースはサンプル、アフィリエイトは公式サイトへの通常リンクとして
動作し、画面上にもその旨が表示されます。

---

## 2. 起動方法

```bash
npm run dev          # http://localhost:3000/ja
```

| コマンド               | 内容            |
| ---------------------- | --------------- |
| `npm run dev`          | 開発サーバー    |
| `npm run build`        | 本番ビルド      |
| `npm start`            | 本番サーバー    |
| `npm run typecheck`    | 型チェック      |
| `npm run lint`         | ESLint          |
| `npm run test`         | Vitest（163件） |
| `npm run format:check` | Prettier        |

> **CSS を変更したときは本番ビルドで確認してください。**
> 開発サーバーは Tailwind の再生成が遅れることがあります。

主な入口:

- `/ja` — トップページ
- `/ja/coins/bitcoin` — 通貨詳細
- `/ja/exchanges` — 国内取引所比較
- `/ja/diagnosis/exchange` — 診断
- `/ja/admin` — 管理ダッシュボード（読み取り専用）
- `/en`, `/ko`, `/zh-cn`, `/ar` … — 各言語版

---

## 3. 環境変数

すべて `.env.example` に説明つきで記載しています。要点だけ:

### ⚠ 命名の原則

`NEXT_PUBLIC_` が付いた変数は **ブラウザに配信されます**。
APIキー・シークレットに `NEXT_PUBLIC_` を付けないでください。

### ブランドの差し替え

```bash
NEXT_PUBLIC_PORTAL_NAME="あなたのサイト名"
NEXT_PUBLIC_PORTAL_SHORT_NAME="短縮名"
NEXT_PUBLIC_PORTAL_LOGO="/images/portal/logo.svg"   # 空ならCSSのワードマーク
NEXT_PUBLIC_PORTAL_URL="https://example.com"        # canonical / hreflang / OGP の基準
```

コードを触らずに `.env` の値を変えるだけで、ヘッダー・フッター・OGP・構造化データの
すべてに反映されます。

### 主な変数

| 変数                              | 既定    | 用途                                     |
| --------------------------------- | ------- | ---------------------------------------- |
| `MARKET_DATA_SOURCE`              | `mock`  | `mock` / `coingecko`                     |
| `COINGECKO_API_KEY`               | 空      | ⚠ サーバー専用                           |
| `MARKET_REVALIDATE_SEC`           | `60`    | サーバー側キャッシュ秒数                 |
| `NEXT_PUBLIC_MARKET_POLLING`      | `false` | ティッカーのブラウザ側定期更新           |
| `NEXT_PUBLIC_USD_JPY`             | `0`     | 円換算レート。0 のあいだはドル表示のまま |
| `PORTAL_STATIC_LOCALES`           | —       | 静的書き出しする言語                     |
| `AFF_*`                           | 空      | アフィリエイトリンク                     |
| `NEXT_PUBLIC_NEWSLETTER_ENDPOINT` | 空      | メール登録の送信先                       |

> `NEXT_PUBLIC_USD_JPY` を 0 のままにしているのは、**推測レートで円換算すると誤情報になる**ためです。
> 未設定のあいだは日本語表示でもドル建てのまま出します。

---

## 4. API 接続方法

### 原則

**フロントエンドから外部APIを直接叩きません。** 必ずサーバー側を経由します。

```
Server Component ──▶ getMarketSnapshot()  （src/portal/lib/market.ts / サーバー専用）
                          ├─ mock       → buildMockSnapshot()
                          └─ coingecko  → fetch(..., { next: { revalidate } })
                                              │ 失敗
                                              ▼  モックへフォールバック + degraded に理由
```

### CoinGecko に接続する

```bash
MARKET_DATA_SOURCE="coingecko"
COINGECKO_API_KEY="CG-xxxxxxxxxxxx"     # Demo プランのキー
MARKET_REVALIDATE_SEC="60"
```

無料枠のレート制限を前提に、60秒のサーバー側キャッシュを1か所で共有します。
利用者ごとに叩かないため、アクセスが増えてもリクエスト数は増えません。

### 別のデータソースを足す

`src/portal/lib/market.ts` に関数を追加し、`MarketSnapshot` 型を返すようにしてください。
UI 側は `MarketSnapshot` としか話していないため、変更不要です。

### 「リアルタイム」と書かない

`DataFreshness` コンポーネントが、全画面で「取得日時」と**実際の更新間隔**を表示します。
モックのときは「モックデータ」、取得に失敗したときは「取得に失敗し代替表示中」のバッジが出ます。

---

## 5. モック ⇔ 本番の切り替え

| データ         | モック時の挙動                 | 本番への切り替え                                                                        |
| -------------- | ------------------------------ | --------------------------------------------------------------------------------------- |
| 市場データ     | 決定的に生成（同時刻なら同値） | `MARKET_DATA_SOURCE=coingecko`                                                          |
| ニュース       | サンプル記事 + 注意バナー      | `src/portal/data/news.ts` を RSS/API 取得に置き換え、`NEWS_DATASET_STATUS` を `live` に |
| 取引所の数値   | 「公式サイトで要確認」         | 実測値を確認して `checkedAt` を設定し、`DATASET_STATUS` を `verified` に                |
| 動画           | プレースホルダ                 | `videos.ts` の `youtubeId` を設定                                                       |
| アフィリエイト | 公式サイトへの通常リンク       | `AFF_*` を設定                                                                          |

モックであることは**必ず画面に表示**されます。気づかないまま公開される状態を作りません。

---

## 6. デプロイ方法

### Vercel（推奨）

そのままデプロイできます。全13言語がオンデマンド生成 + ISR で配信されます。

```bash
# 環境変数を Vercel の Project Settings に登録してから
git push
```

### GitHub Pages（静的書き出し）

このリポジトリの `.github/workflows/deploy-pages.yml` が `main` への push で動きます。

```bash
GITHUB_PAGES=true PAGES_BASE_PATH=/<repo> NEXT_PUBLIC_BASE_PATH=/<repo> npm run build
# → out/ に出力
```

**制約**:

- 静的書き出しでは既定で `ja` / `en` のみ生成します（13言語 × 約107ページ = 1,390ページはビルドが長すぎるため）。
  増やすときは `PORTAL_STATIC_LOCALES="ja,en,ko,zh-cn"` のように指定します。
- POST の Route Handler が使えません（AIチャットボットの生成モデル版、OGP動的生成が不可）。
- `next/image` の最適化APIが使えません（`unoptimized: true`）。

---

## 7. 管理画面の使い方

`/ja/admin`

### いまできること（読み取り専用）

- コンテンツ在庫の一覧（種別ごとの件数と、全言語での総ページ数）
- **健全性チェック** — 公開前に直すべき点を優先度順に表示
  - 情報確認日が未設定の取引所
  - サンプル状態のデータセット
  - 未設定のアフィリエイトリンク
  - 掲載期間が終了したリンク
  - 動画IDが未設定の動画
  - UI辞書が未整備の言語
  - 市場データがモックのままかどうか
- 外部リンクの一覧（リンク切れ検知バッチの入力）

### ⚠ 認証がありません

現時点では読み取り専用のため情報が壊れることはありませんが、運用状況は見えます。
本番では Basic 認証か Middleware でアクセスを絞ってください。

### 編集機能を足すとき

必ずこの順序で:

1. Supabase へ移行（`docs/portal/03-database.md` のスキーマ）
2. **認証**（Supabase Auth）
3. **RLS と権限**
4. **監査ログ**（`audit_logs`）
5. 書き込み機能

認証なしで書き込み口を公開しないでください。

---

## 8. 多言語の追加方法

### 手順

1. **`src/portal/i18n/config.ts` の `locales` に追加**

   ```ts
   { code: "it", hreflang: "it", ogLocale: "it_IT", intl: "it-IT",
     country: "it", label: "Italiano", labelJa: "イタリア語" },
   ```

   並び順は**取引ボリュームと関心度の実務順**を維持してください（アルファベット順にしない）。

2. **国旗画像を追加** — `public/images/flags/<国コード>.webp`

   > テストが「全言語に国旗が存在すること」を検証します。忘れると `npm run test` が落ちます。

3. **（任意）UI辞書を追加** — `src/portal/i18n/dictionaries.ts`

   ```ts
   const it: Dictionary = {/* ja と同じキー構造。型が強制します */};
   const dictionaries = { ja, en, it };
   ```

   追加しない場合は英語へフォールバックします（日本語のまま出すより読める人が多いため）。

4. **（任意）コンテンツの翻訳** — `src/portal/data/*.ts` の `LocalizedText` に言語キーを足す

   ```ts
   name: { ja: "ビットコイン", en: "Bitcoin", it: "Bitcoin" },
   ```

これだけで、URL・hreflang・canonical・サイトマップ・OGP・言語切り替えUIに自動反映されます。

### 右横書き（RTL）の言語

`rtl: true` を付けると `<html dir="rtl">` になります。
スタイルは論理プロパティ（`ms-`/`me-`/`start`/`end`）で書いてあるため、レイアウトは自動で反転します。

### 言語切り替えUIの固定要件

- ヘッダーに**常時設置**する
- 選択肢には**必ず国旗を表示**する
- 旗だけにせず、**必ずその言語での言語名を併記**する
  （言語と国は1対1ではないため、旗だけでは誤解を招きます）

これらは `tests/portal-components.test.tsx` で検証しています。

---

## 9. アフィリエイトリンクの設定方法

### 設定する

`.env.local` に実URLを入れるだけです。

```bash
AFF_BITBANK="https://example.com/aff?id=xxxx"
```

| 状態       | リンク                 | 表示       | rel                                      |
| ---------- | ---------------------- | ---------- | ---------------------------------------- |
| 未設定     | 公式サイト             | PR表記なし | `noopener noreferrer`                    |
| 設定済み   | アフィリエイトURL      | **PR**     | `sponsored nofollow noopener noreferrer` |
| 掲載期間外 | 公式サイト（自動降格） | PR表記なし | `noopener noreferrer`                    |

> 未設定なのに「PR」と表示するのは事実と異なるため、出しません。

### 新しいプログラムを追加する

`src/portal/lib/affiliate.ts` の**2か所**に足してください。

```ts
// 1. 定義
export const affiliateLinks: AffiliateLinkDef[] = [
  {
    id: "aff-newexchange",
    envKey: "AFF_NEW_EXCHANGE",
    fallbackUrl: "https://example.com/",
    program: "new-exchange",
  },
];

// 2. 環境変数の明示的な参照
//    process.env は動的キーで読めない（ビルド時に静的置換されるため）
const affiliateEnv: Record<string, string | undefined> = {
  AFF_NEW_EXCHANGE: process.env.AFF_NEW_EXCHANGE,
};
```

そのうえで、`exchanges.ts` の該当取引所に `affiliateId: "aff-newexchange"` を設定します。

### 掲載期間を設定する

```ts
{ id: "aff-campaign", envKey: "AFF_CAMPAIGN", fallbackUrl: "...",
  program: "...", startsAt: "2026-09-01", endsAt: "2026-10-31" }
```

期間外は自動で通常リンクに降格するため、終了したキャンペーンへ送客し続ける事故を防げます。

### クリック計測

`window.dataLayer` へ設置場所（`placement`）付きで push します。
GTM 等が無い環境では何も送らず、リンクは正常に動作します。

---

## 10. AIチャットボット

### 既定は「抽出型」（APIキー不要）

サイト内のコンテンツ（学習記事・通貨・取引所・ウォレット・ツール・FAQ）から
最も関連の高い断片を取り出し、**その内容をそのまま提示**します。
生成モデルを通さないため、**事実の捏造が構造的に起きません**。

### ガードレール

| 入力                               | 応答                                             |
| ---------------------------------- | ------------------------------------------------ |
| 秘密鍵・シードフレーズに触れる質問 | 「入力しないでください」という警告 + 対処法      |
| 「買うべき？」「上がる？」         | 断定を避け、仕組み・リスク・比較ページへ誘導     |
| サイト内に根拠がない質問           | 「見つかりませんでした」と正直に返す（作らない） |

回答の最後には**必ず関連ページへのリンク**を出します。

### 生成モデル版へ拡張する

サーバー実行環境（Vercel 等）が前提です。

```ts
// src/app/api/chat/route.ts（新規作成）
import { retrieve } from "@/portal/lib/chat";

export async function POST(request: Request) {
  const { question, locale } = await request.json();
  const passages = retrieve(question, locale, 5); // ← 同じ検索層を再利用

  // passages を文脈として生成モデルへ渡す。
  // システムプロンプトには必ず次を含めること:
  //   - 与えられた文脈以外から答えない
  //   - 個別の投資助言をしない / 利益を保証しない / 価格を断定しない
  //   - 秘密鍵・シードフレーズを尋ねない
  //   - 価格やキャンペーンには取得日時を添える
}
```

APIキーはサーバーに留まり、クライアントへは出ません。

---

## 11. コンテンツの編集方法

すべて `src/portal/data/` 配下の TypeScript ファイルです。型が構造を強制します。

| ファイル          | 内容                               |
| ----------------- | ---------------------------------- |
| `coins.ts`        | 通貨プロフィール（価格は含まない） |
| `exchanges.ts`    | 取引所                             |
| `wallets.ts`      | ウォレット                         |
| `tools.ts`        | Web3.0ツール                       |
| `news.ts`         | ニュース                           |
| `videos.ts`       | 動画                               |
| `learn.ts`        | 学習記事                           |
| `diagnoses.ts`    | 診断（質問・選択肢・結果）         |
| `legal.ts`        | 固定ページ                         |
| `site-content.ts` | ナビゲーション・FAQ・キャンペーン  |
| `authors.ts`      | 執筆者・監修者                     |

### 守ってほしいルール

1. **未確認の情報を載せない。** 推測値を入れるくらいなら「公式サイトで要確認」のままにする
2. **`checkedAt` を必ず更新する。** 空のあいだは画面に「未検証」バッジが出ます
3. **メリットだけを書かない。** `pros` と `cons` の両方が必須です（テストが検証します）
4. **`Review` / `AggregateRating` を出力しない。** 実レビューがないため
5. **リンク先IDは実在するものを指す。** テストが dangling reference を検出します

### 学習記事の構成を崩さない

結論 → 要点 → 定義 → 本文 → 注意点 → FAQ → 関連 の順で固定しています。
検索エンジンにも生成AIにも、最初の数行で要旨が取れるようにするためです。

---

## 12. 設計ドキュメント

| ドキュメント                                                           | 内容                                                             |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------- |
| [`docs/portal/00-overview.md`](./docs/portal/00-overview.md)           | 設計方針・ページ一覧・トップページ構成・ユーザー導線             |
| [`docs/portal/01-design-system.md`](./docs/portal/01-design-system.md) | 配色・タイポグラフィ・レイヤー構造・アニメーション・RTL          |
| [`docs/portal/02-architecture.md`](./docs/portal/02-architecture.md)   | 技術構成・ディレクトリ・API設計・収益化導線                      |
| [`docs/portal/03-database.md`](./docs/portal/03-database.md)           | Supabase スキーマ（SQL）と移行手順                               |
| [`docs/portal/04-status.md`](./docs/portal/04-status.md)               | 実装済み / 未実装・SEOチェックリスト・セキュリティチェックリスト |

---

## 公開前の確認事項

1. `src/portal/data/legal.ts` の `[[ 確定後に記入 ]]` をすべて埋める
2. 取引所の数値を公式サイトで確認し、`checkedAt` と `DATASET_STATUS` を更新する
3. `/ja/admin` の「要対応」がすべて解消されていることを確認する
4. `npm audit` で High 以上の脆弱性を解消する
5. `/ja/admin` にアクセス制限をかける
6. `npm run typecheck && npm run lint && npm run test && npm run format:check && npm run build` がすべて通ることを確認する
7. **本番ビルドで実際に描画して確認する**（開発サーバーは CSS 再生成が遅れることがあります）
