# 技術構成・ディレクトリ・API 設計

---

## 使用技術

| 領域           | 採用                                 | 選定理由                                   |
| -------------- | ------------------------------------ | ------------------------------------------ |
| フレームワーク | Next.js 16（App Router / Turbopack） | Server Components でクライアントJSを最小化 |
| 言語           | TypeScript（strict）                 | データ契約を型で固定                       |
| スタイル       | Tailwind CSS v4（`@theme`）          | デザイントークンをCSS変数として一元管理    |
| アニメーション | Framer Motion                        | スクロール連動と `useReducedMotion`        |
| チャート       | **自前のSVG**                        | 下記参照                                   |
| 3D             | **CSS 3D + 2D canvas**               | 下記参照                                   |
| 検証           | Zod（既存依存）                      | 外部APIレスポンスの検証に使用可能          |
| テスト         | Vitest + Testing Library             | 163 テスト                                 |

### チャートライブラリを入れなかった理由

必要なのは折れ線とエリア塗り、それに半円ゲージだけです。
Recharts は依存込みで数十〜百KB増え、かつクライアントコンポーネントになります。
自前のSVGならサーバーコンポーネントのまま描け、**クライアントJSがゼロ**です。
期間切り替えのある大きいチャートだけがクライアント側になります。

実装: `src/portal/components/market/charts.tsx`（`Sparkline` / `AreaChart` / `FearGreedGauge`）

### Three.js / React Three Fiber を入れなかった理由

要件に「3D表現が重い場合は、軽量なCSS 3D、SVG、WebP、AVIF、Lottieへフォールバック」とあり、
**そのフォールバック側を初めから採用**しています。

- 3Dコイン → CSS `transform-style: preserve-3d` + グラデーション（`Coin3D`）
- ブロックチェーンネットワーク → 2D canvas の点と線（`ParticleField`）

R3F を入れるとファーストビューの初期JSが数百KB増え、LCP に直接効きます。
将来 3D を強化する場合は、`ParticleField` を `next/dynamic` で遅延読み込みし、
モバイルでは現行実装にフォールバックする形を推奨します。

---

## ディレクトリ構成

```
src/
├── app/
│   ├── (senri)/              ← 既存サイト（焼肉 千里）。ルートレイアウト①
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── ...
│   ├── (portal)/             ← CRYPTO PORT
│   │   ├── portal.css        ← デザインシステム
│   │   └── [locale]/
│   │       ├── layout.tsx    ← ルートレイアウト②（html lang / dir を言語別に）
│   │       ├── page.tsx      ← トップページ
│   │       ├── not-found.tsx
│   │       ├── rss.xml/route.ts
│   │       ├── coins/, news/, exchanges/, wallets/, tools/,
│   │       ├── videos/, learn/, diagnosis/, search/, campaigns/,
│   │       ├── faq/, legal/[slug]/, admin/
│   ├── api/market/route.ts   ← 市場データのサーバー側API
│   ├── sitemap.ts            ← 両サイトのURLを出力
│   └── robots.ts
│
└── portal/                   ← ポータルのコード（既存サイトと混ざらないよう分離）
    ├── i18n/
    │   ├── config.ts         ← 13言語の定義・URL 組み立て
    │   └── dictionaries.ts   ← UI文言（ja / en を人手で。他は en へフォールバック）
    ├── lib/
    │   ├── types.ts          ← ドメイン型（唯一の契約）
    │   ├── site.ts           ← ブランド設定（環境変数で差し替え）
    │   ├── format.ts         ← 数値・日付の整形（言語別）
    │   ├── market.ts         ← 市場データ取得（サーバー専用）
    │   ├── mock-market.ts    ← 決定的なモック生成器
    │   ├── search-index.ts   ← 検索インデックスと正規化
    │   ├── chat.ts           ← チャットボットの検索層 + ガードレール
    │   ├── diagnosis.ts      ← 診断の採点・共有符号
    │   ├── affiliate.ts      ← アフィリエイトリンクの解決
    │   ├── seo.ts            ← メタデータ・hreflang
    │   ├── structured-data.ts← 構造化データ
    │   ├── sitemap.ts        ← ポータルのサイトマップ
    │   └── admin.ts          ← 在庫と健全性チェック
    ├── data/                 ← コンテンツ（将来 Supabase へ移行）
    │   ├── coins.ts, exchanges.ts, wallets.ts, tools.ts,
    │   ├── news.ts, videos.ts, learn.ts, diagnoses.ts,
    │   └── authors.ts, legal.ts, site-content.ts
    └── components/
        ├── layout/    PortalHeader, PortalFooter, LocaleSwitcher, GlobalSearch, Shell
        ├── market/    MarketTicker, CoinCard, charts, PriceChartPanel, DataFreshness
        ├── home/      Hero
        ├── news/      NewsCard, NewsBrowser
        ├── compare/   CompareTable, ExchangeCompare
        ├── tools/     ToolBrowser
        ├── diagnosis/ DiagnosisRunner
        ├── chat/      CryptoChat
        ├── search/    SearchResults
        ├── effects/   ParticleField, Coin3D
        └── ui/        primitives, motion, sections, links, JsonLd
```

### なぜルートレイアウトが2つあるのか

このリポジトリには既存サイト（焼肉 千里）が同居しています。
デザインシステムもフォントも `<html lang>` も別物なので、
Next.js のルートグループによる **複数ルートレイアウト** で分離しました。

- `/`, `/menu`, `/news` … → `(senri)` のレイアウト
- `/ja`, `/en/coins` … → `(portal)` のレイアウト

2つのサイト間を移動すると全ページ再読み込みになりますが、相互リンクを張らないため実害はありません。
別ドメインへ切り出すときは `(portal)` ディレクトリごと移せば済みます。

---

## API 連携方針

### 原則

**フロントエンドから外部APIを直接叩かない。** 必ずサーバー側を経由します。

| 理由                                      | 対策                                                                 |
| ----------------------------------------- | -------------------------------------------------------------------- |
| APIキーがクライアントに露出する           | `src/portal/lib/market.ts` はサーバー専用。`NEXT_PUBLIC_` を付けない |
| 利用者ごとに外部APIを叩き、無料枠を超える | サーバー側で1回取得しキャッシュを共有                                |
| CORS とエラー処理が各画面に散る           | 取得口を1か所に集約                                                  |

### データフロー

```
Server Component ──▶ getMarketSnapshot()  ──▶ [MARKET_DATA_SOURCE]
                          │                        ├─ "mock"      → buildMockSnapshot()
                          │                        └─ "coingecko" → fetch(+revalidate)
                          │                                            │ 失敗
                          │                                            ▼
                          │                                     モックへフォールバック
                          │                                     degraded に理由を記録
                          ▼
                   MarketSnapshot { coins, global, fearGreed,
                                    fetchedAt, source, refreshIntervalSec, degraded }
                          │
                          ├──▶ 画面（DataFreshness が取得日時・更新間隔・モック表示）
                          └──▶ /api/market（ブラウザからの定期更新用）
```

### 実装済みの要件

| 要件                  | 実装                                                |
| --------------------- | --------------------------------------------------- |
| キャッシュ            | `next: { revalidate }` + `Cache-Control: s-maxage`  |
| レート制限対策        | 60秒キャッシュ、429 は即座に諦める                  |
| エラー処理            | try / catch でモックへフォールバック                |
| リトライ              | 1回のみ（400ms 後）。回数を増やすと無料枠を食い潰す |
| フォールバック        | 常に何かを返す。真っ白なページを出さない            |
| 取得日時表示          | `fetchedAt` を全画面に表示                          |
| APIキーの環境変数管理 | `COINGECKO_API_KEY`（`NEXT_PUBLIC_` なし）          |
| 複数データソース切替  | `MARKET_DATA_SOURCE`                                |
| 取得失敗時の代替表示  | `degraded` バッジ                                   |

### 「リアルタイム」と書かない

要件どおり、実際の更新頻度を明示します。
`DataFreshness` が「取得日時: 2026-08-01 12:00 UTC · 1分ごとに更新」のように出します。

---

## 収益化導線

### 設置箇所と計測

すべての外部リンクは `OutboundLink` を通り、`placement` 付きでクリックを計測します。
同じ取引所でも「比較表」と「診断結果」でクリック率が大きく変わるため、
場所を分けないと改善に使えません。

| placement                   | 場所                             |
| --------------------------- | -------------------------------- |
| `exchange-compare-domestic` | 国内取引所比較表                 |
| `exchange-compare-overseas` | 海外取引所比較表                 |
| `exchange-detail-sidebar`   | 取引所詳細のサイドバー（sticky） |
| `wallet-detail`             | ウォレット詳細                   |
| `tool-detail`               | ツール詳細                       |
| `video-detail-sidebar`      | 動画LPのサイドバー               |

計測は `window.dataLayer` へ push します（GTM 等が無い環境では何も送らず、リンクは正常に動作）。

### 広告の明示

```
環境変数 AFF_* が設定済み  →  rel="sponsored nofollow noopener noreferrer" + 「PR」表記
環境変数 AFF_* が未設定    →  公式サイトへの通常リンク。PR表記なし
掲載期間外                →  通常リンクへ自動降格（リンク切れ防止）
```

未設定なのに「PR」と表示するのは事実と異なるため、出しません。

### A/B テスト

現時点では未実装です。`OutboundLink` に `variant` を足し、
`placement` と一緒に計測すれば拡張できます（`docs/portal/04-status.md` 参照）。
