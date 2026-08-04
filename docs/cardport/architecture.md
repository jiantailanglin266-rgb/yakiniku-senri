# CARD PORT — サイト設計

## 1. 設計方針

| 原則                      | 内容                                                                      |
| ------------------------- | ------------------------------------------------------------------------- |
| 既存サイトを壊さない      | 複数ルートレイアウトで完全分離。URL・CSS・依存関係が交差しない            |
| APIキー無しで全機能が動く | 検索・比較・診断・シミュレーター・チャットはクライアント実行              |
| 装飾より可読性            | 年会費・還元率・条件は、どの装飾の上でも 4.5:1 のコントラストを下回らない |
| 数値には根拠を添える      | 計算式と前提条件を結果と同じ画面に出す                                    |
| 未確認は書かない          | 推測値を入れるくらいなら空欄。実データのない評価は構造化データに出さない  |
| 順位と広告を分離          | `scoring.ts` は `affiliate.ts` を import しない                           |

## 2. ページ一覧

言語プレフィックス `/<locale>/` は 14 言語（`ja` `en` `ko` `zh-cn` `zh-tw` `es` `fr` `de` `pt` `th` `vi` `id` `ar` `hi`）。

| URL                            | 内容                                            |
| ------------------------------ | ----------------------------------------------- |
| `/`                            | ファーストビュー〜FAQ の21セクション            |
| `/cards`                       | カード検索（絞り込み・並び替え・全文検索）      |
| `/cards/<category>`            | カテゴリ一覧（20カテゴリ）                      |
| `/cards/<slug>`                | カード詳細                                      |
| `/compare`                     | 比較（表 / カード型を切り替え、最大4枚）        |
| `/rankings`                    | ランキング総覧                                  |
| `/rankings/<category>`         | カテゴリ別ランキング（重みを併記）              |
| `/diagnosis`                   | 診断一覧                                        |
| `/diagnosis/<slug>`            | 診断9種（結果を URL で共有可）                  |
| `/simulators`                  | シミュレーター一覧                              |
| `/simulators/<slug>`           | シミュレーター10種                              |
| `/campaigns`                   | キャンペーン（条件全文・期限・対象者）          |
| `/business`                    | 法人カード・個人事業主カード＋事業者向けツール  |
| `/payments`                    | キャッシュレス決済＋相性のよいカード            |
| `/web3`                        | Web3.0 サービス＋暗号資産関連カード             |
| `/web3/<slug>`                 | Web3 サービス詳細（リスク・規制を必須表示）     |
| `/tools`                       | 金融ツール（4グループ）                         |
| `/news`                        | ニュース（同一発表をまとめて表示）              |
| `/news/<slug>`                 | 記事詳細                                        |
| `/videos`                      | 動画・Shorts                                    |
| `/videos/<slug>`               | 動画ページ（要点・チャプター・紹介カード・CTA） |
| `/guides` `/guides/<slug>`     | 初心者向け講座                                  |
| `/features` `/features/<slug>` | 目的別特集（19本、条件で自動選択）              |
| `/faq`                         | よくある質問（分野別）                          |
| `/policies` `/policies/<slug>` | 運営者情報・編集方針・評価基準ほか13本          |
| `/admin`                       | 運用ダッシュボード（noindex・読み取り専用）     |
| `/sitemap`                     | HTML サイトマップ                               |

サイト外（言語プレフィックスなし）: `/cardport-sitemap.xml`, `/cardport-news-sitemap.xml`,
`/cardport-video-sitemap.xml`, `/cardport-rss.xml`

## 3. トップページのセクション構成

1. ファーストビュー（3Dカード・決済ネットワーク・粒子・CTA4種）
2. 最新キャンペーンティッカー
3. 人気クレジットカードランキング（カテゴリチップ付き）
4. AIクレジットカード診断（9種）
5. カード検索（カテゴリ別入口）
6. クレジットカード比較表
7. 目的別カード特集
8. 最新クレジットカードニュース
9. キャッシュレス・フィンテックニュース
10. Web3.0決済サービス
11. 暗号資産関連カード
12. 法人カード比較
13. ポイント・マイルシミュレーター
14. YouTube最新動画
15. おすすめ決済ツール
16. 人気記事
17. 急上昇コンテンツ
18. 初心者向けカード講座
19. AIチャットボット
20. メルマガ・LINE・SNS
21. FAQ
22. フッター（レイアウト側）

## 4. ユーザー導線

```
                     ┌──────────────┐
   検索/SNS/YouTube → │ ファーストビュー │
                     └───────┬──────┘
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
      ［診断］          ［カード検索］      ［ランキング］
        │                  │                  │
        └────────┬─────────┴─────────┬────────┘
                 ▼                   ▼
            ［比較（最大4枚）］  ［カード詳細］
                 │                   │
                 └─────────┬─────────┘
                           ▼
              ［シミュレーターで金額を確認］
                           ▼
                  ［公式サイトへ（CTA）］
```

補助導線:

- 動画ページ → 要点 → 紹介カード → 診断／比較（Shorts からの短時間流入を想定）
- ニュース記事 → 関連カード → 詳細
- チャットボット → 回答＋参照元 → カード一覧／比較／診断
- どのページからでもヘッダーの比較バッジで比較へ戻れる

## 5. デザインシステム

### カラートークン（`cardport.css` の `@theme`）

| 用途       | トークン                                                               | 既定値                            |
| ---------- | ---------------------------------------------------------------------- | --------------------------------- |
| 地         | `void` / `abyss` / `navy` / `navy-soft` / `slate` / `line`             | `#05070f` 〜 `#263254`            |
| 文字       | `ink` / `mist` / `dim`                                                 | `#f2f6ff` / `#b7c2dd` / `#8492b4` |
| アクセント | `cyan` `electric` `violet` `magenta` `emerald` `amber` `gold` `danger` | —                                 |

ブランドカラーは `config/site.ts` の `palette` → `:root` の `--port-*` 変数 → `@theme` の順に流れます。
環境変数を変えるだけで全体の配色が変わります。

### タイポグラフィ

| 役割   | フォント                                          |
| ------ | ------------------------------------------------- |
| 見出し | Space Grotesk                                     |
| 本文   | Inter ＋ Hiragino Sans / Yu Gothic / Noto Sans JP |
| 数値   | JetBrains Mono（`.numeric`、`tabular-nums`）      |

**金額・還元率は必ず `.numeric`** を付けます。桁の読み違いを防ぐためです。

### 表現ユーティリティ

| クラス                                                            | 用途                                          |
| ----------------------------------------------------------------- | --------------------------------------------- |
| `.port-canvas` / `.port-grid` / `.port-grain`                     | 背景3層（オーロラ・サイバーグリッド・ノイズ） |
| `.glass` / `.glass-solid` / `.glow-border`                        | ガラス・光るボーダー                          |
| `.text-aurora` / `.text-gold-port`                                | 文字グラデーション                            |
| `.card3d` / `.card3d-sheen` / `.holo`                             | 3D券面・光の走査・ホログラム                  |
| `.port-float` / `.port-reveal` / `.port-marquee` / `.port-stream` | 浮遊・出現・ティッカー・データストリーム      |
| `.sticky-col`                                                     | 比較表の1列目固定                             |

### 3D とアニメーションの方針

- **CSS 3D + 2D Canvas + SVG** で実装しています。Three.js / R3F は採用していません。
  - 必要な表現（点・線・平面の傾き）に対して WebGL は過剰で、初期バンドルが数百KB増えます
  - Lighthouse Performance 90 以上と静的エクスポートの両立を優先しました
  - 差し替え口: `components/visual/` の `ParticleField` / `TiltCard` / `CardArt` を置き換えれば R3F へ移行できます
- 粒子は画面サイズと `devicePixelRatio` から数を決め、画面外では停止します
- `prefers-reduced-motion` ですべてのモーションを無効化します（CSS 側で一括）

## 6. 使用技術

| 領域           | 採用                              | 備考                         |
| -------------- | --------------------------------- | ---------------------------- |
| フレームワーク | Next.js 16 App Router             | 既存サイトと共有             |
| 言語           | TypeScript（strict）              | —                            |
| スタイル       | Tailwind CSS v4                   | `@source` でスコープ分離     |
| 状態           | React 19 + `useSyncExternalStore` | 比較リストは localStorage    |
| 3D・演出       | CSS 3D / Canvas 2D / SVG          | 上記の理由                   |
| チャート       | 自前SVG（スコアバー・重みバー）   | 依存を増やさないため         |
| 検索           | クライアント全件フィルタ          | 掲載数が数十件規模のため十分 |
| RAG            | 自前の索引＋n-gram一致            | APIキー不要で動く            |
| 検証           | Vitest + Testing Library          | 既存と共通                   |

Supabase / PostgreSQL / TanStack Query / Zod / React Hook Form は **本番データ接続時に導入** する想定で、
スキーマと型の契約（`data/types.ts` と `db-schema.sql`）を先に用意しています。

## 7. コンポーネント一覧

### レイアウト

| コンポーネント                | 役割                                         |
| ----------------------------- | -------------------------------------------- |
| `layout/Header`               | ナビ・比較バッジ・言語切替（常時設置）       |
| `layout/Footer`               | 開示・ポリシー・チャネル                     |
| `layout/LanguageSwitcher`     | 国旗＋言語名。現在ページを保って言語だけ切替 |
| `layout/Breadcrumbs`          | 表示と構造化データを同じデータから生成       |
| `layout/PageShell`            | 下層ページ共通の見出し・注意書き・メタ情報   |
| `layout/LocaleHtmlAttributes` | `<html lang>` / `dir` の同期                 |

### UI プリミティブ

`ui/primitives.tsx` … `Section` `SectionHeading` `Panel` `Badge` `AdLabel` `Button` `LinkButton`
`StatBlock` `ScoreBar` `Notice` `JsonLd`

### 演出

`visual/Backdrop` `visual/ParticleField` `visual/PaymentNetwork` `visual/CardArt`
`visual/TiltCard` `visual/Reveal` `visual/CountUp`

### カード

`cards/CardTile` `cards/CardBrowser` `cards/CompareView` `cards/CompareToggle` `cards/AffiliateCta`

### 機能

`diagnosis/DiagnosisRunner` `simulators/SimulatorRunner` `chat/Concierge`

### セクション

`home/Hero` `home/CampaignTicker` `home/sections.tsx`（`FeatureGrid` `CategoryChips` `NewsCard`
`NewsGrid` `VideoGrid` `ToolGrid` `PaymentGrid` `Web3Grid` `GuideList` `FaqList` `SubscribeBox`）

## 8. カード比較データ設計

`Card` 型は 60 項目超。主な区分:

| 区分 | 項目                                                                                       |
| ---- | ------------------------------------------------------------------------------------------ |
| 識別 | id / slug / name / issuerId / brands / rank / categories                                   |
| 意匠 | art（3色＋テクスチャ。実在意匠は使わない）                                                 |
| 費用 | annualFee / firstYearFee / feeWaiver / familyCardFee / etcFee / fxFee                      |
| 還元 | baseRate / maxRate / maxRateCondition / pointName / pointExpiry / mileTransfer / mileRate  |
| 保険 | travelInsuranceDomestic / Overseas / shoppingInsurance（金額＋自動付帯 or 利用付帯）       |
| 機能 | lounges / touchPayment / mobilePayments / electronicMoney / issueDays                      |
| 条件 | eligibility / eligibilityNote / limitNote / availableRegions                               |
| 編集 | summary / pros / cons / notes / recommendedFor / notRecommendedFor                         |
| 法人 | additionalCards / accountingIntegrations / paymentTerms / receiptManagement / virtualCards |
| Web3 | supportedAssets / custodyNote / stablecoin                                                 |
| 評価 | scores（6軸）                                                                              |
| 鮮度 | verifiedOn / updatedOn                                                                     |

## 9. 診断ロジック

1. 診断ごとに対象カードを絞る（`pool`）
2. 回答した選択肢の `weights` を軸ごとに合算する
3. カードの「軸ごとの強さ」（0〜1）と内積を取り、重みの合計で正規化する
4. 選択肢の `requires` を満たさない数だけ減点する（最大 45%。**除外はしません**）
5. 同点は 年会費が安い順 → スラッグ順

**除外しきらない理由**: すべて除外して「該当なし」になるより、条件のずれを明示して提示するほうが役に立つためです。

回答は `encodeAnswers()` で短い文字列にして URL に載せ、`?a=...` で同じ結果を再現できます。
氏名・住所・年収の具体額は尋ねません。回答はサーバーへ送信しません。

## 10. シミュレーション設計

すべて純関数（`lib/simulator-engine.ts`）。**基本還元率で計算**し、条件付きの最大還元率は使いません。

| ID               | 計算式                                                   |
| ---------------- | -------------------------------------------------------- |
| annual-points    | Σ(項目別月額 × 12 × 基本還元率 ÷ 100)                    |
| card-compare     | 年間ポイント − 年会費                                    |
| fee-breakeven    | 年会費 ÷ (基本還元率 ÷ 100)                              |
| mile             | 年間利用額 × 基本還元率 ÷ 100 × 移行レート               |
| travel-benefit   | ラウンジ回数 × 1,100円 ＋ 旅行回数 × 想定保険料 − 年会費 |
| business-expense | 年間経費 × 基本還元率 ÷ 100 − 年会費                     |
| switch-benefit   | 新カードの実質メリット − 現カードの実質メリット          |
| multi-card       | Σ(項目別支出 × 最良カードの還元率) − Σ年会費             |
| fx-fee           | 海外利用額 × 海外事務手数料 ÷ 100                        |
| point-exchange   | ポイント数 × 交換レート                                  |

前提条件（`simulators.ts` の `assumptions`）は結果と同じ画面に常に表示します。

## 11. 収益化導線

| 位置               | Placement                 | CTA                      |
| ------------------ | ------------------------- | ------------------------ |
| ランキング         | `ranking`                 | 公式サイトで詳細を見る   |
| カード一覧         | `card-list`               | 同上                     |
| カード詳細         | `card-detail`             | 同上（比較追加と並列）   |
| 比較表             | `comparison`              | 各列の下部               |
| 診断結果           | `diagnosis-result`        | 上位3枚に付与            |
| キャンペーン       | `campaign`                | 申込み条件を確認する     |
| 動画ページ         | `video`                   | 紹介カード＋次にすること |
| ニュース           | `news`                    | 関連カード               |
| 法人・Web3・ツール | `business` `web3` `tools` | 各サービスの公式リンク   |

計測は `data-cp-item` / `data-cp-placement` / `data-cp-locale` / `data-cp-position` /
`data-cp-sponsored` の属性と `dataLayer` イベントで行います。
A/B テストは `affiliateLinks[].variants` に定義を用意しています（配信ロジックは未実装）。

## 12. 多言語・地域別設計

- URL は `/<locale>/...`。`dynamicParams = false` で未定義の言語コードは 404
- `hreflang` は全言語 ＋ `x-default`（日本語）。詳細ページは**生成した言語だけ**を宣言
- 数値・日付は `Intl` で言語別に整形
- **金額は言語を変えても円建てのまま**。言語だけで通貨換算すると実際の請求額と食い違うため
- 日本語以外の言語では「日本国内在住者向け商品」の注記を必ず表示（`legal.regionNotice`）
- カードには `availableRegions` を持たせ、地域別の掲載制御に使えます
- アフィリエイトリンクは `regionUrls` で地域別に切り替えられます

## 13. SEO 設計

`docs/cardport/checklists.md` の SEO チェックリストを参照してください。

生成AIが引用しやすいよう、カード詳細は **結論 → 概要 → メリット → デメリット →
おすすめユーザー → 比較 → 注意点 → FAQ → 公式情報 → 確認日** の順に固定しています。

## 14. 実装フェーズと進捗

`docs/cardport/status.md` を参照してください。
