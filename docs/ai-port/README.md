# AI PORT — 設計ドキュメント

AIポータルメディア **AI PORT** の設計です。同一リポジトリの `/ai-port` 配下で配信しています。

- 公開URL（サーバー配信時）: `https://<ドメイン>/ai-port`
- 焼肉 千里 の既存サイトとは URL・レイアウト・CSS・フォントが完全に分離されています

---

## 1. なぜ同じリポジトリに同居しているのか

ルートレイアウト（`src/app/layout.tsx`）は `<html>` / `<body>` と共通フォントだけを持ち、
ブランド固有の外枠は**ルートグループ**ごとに分けています。

```text
src/app/
├── layout.tsx            <html> / <body> と共通メタデータのみ
├── (senri)/              焼肉 千里（URLは従来どおり / /menu /access …）
│   └── layout.tsx        千里のヘッダー・フッター・背景
└── ai-port/              AI PORT（/ai-port 配下）
    └── layout.tsx        AI PORTのヘッダー・フッター・背景・フォント・CSS
```

ルートグループ `(senri)` は URL に現れないため、**既存サイトのURLは1つも変わっていません**。

CSS も分離しています。

- `src/app/globals.css` … 両ブランド共通。AI PORT のカラートークンは `@theme` に `ai-` 接頭辞で追加（加算のみ）
- `src/styles/ai-port.css` … AI PORT 専用。`ai-port/layout.tsx` からのみ読み込むため、千里側には配信されません

**独自ドメインへ切り出すとき**は `src/data/ai-port/site.ts` の `AI_PORT_BASE` を `""` にし、
`NEXT_PUBLIC_AI_PORT_URL` を設定してください。URL生成・サイトマップ・構造化データがすべて追従します。

---

## 2. ディレクトリ構成

```text
src/
├── app/ai-port/
│   ├── layout.tsx              シェル（背景・ヘッダー・フッター・JSON-LD）
│   ├── page.tsx                トップ（12セクション）
│   ├── news/                   ニュース一覧 / [vendor] ベンダー別
│   ├── tools/                  ツール一覧 / [slug] 詳細
│   ├── ranking/                注目度ランキング（計算式を全文公開）
│   ├── compare/                比較表
│   ├── guides/                 解説記事一覧 / [slug] 詳細
│   ├── topics/                 カテゴリー一覧 / [slug] トピックハブ（18分野）
│   ├── diagnosis/              AI診断一覧 / [slug] 診断本体
│   ├── chat/                   AIチャット
│   ├── youtube/ events/ jobs/ schools/ search/ about/ disclosure/
│   ├── rss.xml/route.ts        RSS（自社記事のみ）
│   ├── llms.txt/route.ts       生成AI向けサイト案内（LLMO）
│   └── api/chat/route.node.ts  チャットAPI（※ファイル名の理由は §6）
├── components/ai-port/
│   ├── effects/                NeuralField / Reveal / TiltCard / ScrollProgress / Ticker
│   ├── layout/                 ヘッダー・フッター・⌘Kパレット・言語切替・モバイルタブ
│   ├── ui/Primitives.tsx       GlassCard / GradientText / Badge / ボタン など
│   ├── home/                   ヒーロー・ランキング・各セクション
│   ├── news/ tools/ chat/ diagnosis/
├── data/ai-port/               ★ 編集するのは基本ここだけ
│   ├── site.ts                 サイト設定・URL生成
│   ├── taxonomy.ts             トピック18分野 / ツールカテゴリー14種
│   ├── tools.ts                AIツール（zodで検証）
│   ├── feeds.ts                RSS取得元 / ベンダー24社
│   ├── articles.ts             解説記事（zodで検証）
│   ├── diagnosis.ts            AI診断5種
│   ├── careers.ts              職種ガイド・求人サイト・学習リソース
│   ├── events.ts youtube.ts faq.ts navigation.ts ads.ts
└── lib/ai-port/
    ├── rss.ts                  依存なしのRSS/Atomパーサー
    ├── news.ts                 収集・重複除去・並び替え
    ├── youtube.ts              チャンネルRSS（APIキー任意）
    ├── ranking.ts              注目度スコア
    ├── diagnosis.ts            採点（純粋関数）
    ├── search.ts               サイト内検索インデックス
    ├── rag.ts                  AIチャットの根拠づくり
    ├── chat-providers.ts       4社のLLMをストリーミングで呼び分け
    ├── seo.ts structured-data.ts sitemap.ts
```

---

## 3. 事実性のルール（このリポジトリの固定要件）

AGENTS.md §3 に沿って、**確認できていないことは書かない**方針を、
コード・データ・テストの3層で守っています。

| 出さないもの                 | 理由                                                           |
| ---------------------------- | -------------------------------------------------------------- |
| AIツールの料金の**金額**     | 数か月で変わる。古い金額での比較は読者への実害                 |
| レビュー点数・星の数         | 実データのない AggregateRating / Review はGoogleのポリシー違反 |
| PV・会員数・満足度           | 計測していない数字は表示しない                                 |
| イベントの**開催日**         | 毎年変わる。古い日付は来場者への実害。季節の目安のみ掲載       |
| 個別の求人票・スクールの料金 | 変動が激しく、古い掲載は応募者・受講者の不利益                 |
| ダミー広告                   | 実在しない案件の表示は不当表示                                 |

これらは `tests/ai-port-data.test.ts` / `tests/ai-port-seo.test.ts` で機械的に検査しています。
たとえば「ツールデータに金額表記が混ざっていないか」「JSON-LDに `aggregateRating` が出ていないか」は
テストが落ちるので、うっかり追加できません。

**未確認の項目は `null`** とし、画面には「未確認」と表示します。空欄にすると「なし」と読まれるためです。

---

## 4. ランキングの考え方

`src/lib/ai-port/ranking.ts`。**人気ランキングではありません。**

持っていないデータ（PV・DL数・レビュー点）は使わず、実際に手元にある2つだけで算出します。

1. 直近のニュースでその提供元が何件言及されたか（**実測値**）
2. 編集部の選定基準（日本語UI・API・無料枠・法人プラン・注目度）

計算式と各ツールの内訳は `/ai-port/ranking` に全文掲載しています。
**アフィリエイトの有無はスコアに一切影響しません**（テストで固定）。

---

## 5. データの取得（壊れない設計）

外部フィードは「落ちること・遅いこと」を前提に組んでいます。

- 1本ずつ独立して取得し、失敗は握りつぶす（`Promise.allSettled`）
- `AbortSignal.timeout(6000)` を必ず付ける
- **すべて失敗しても空配列を返す**。ページはエラーにならず、空状態と理由を表示する
- `fetch` 側に `next: { revalidate }` を持たせ、ページは静的配信＋定期再検証（ISR）

ネットワークが使えない環境でビルドしても**ビルドは通り**、公開後の再検証で中身が入ります。

| 対象     | 取得元                                    | 再検証 |
| -------- | ----------------------------------------- | ------ |
| ニュース | 各社公式ブログRSS + Googleニュース検索RSS | 30分   |
| YouTube  | チャンネル公開RSS（APIキー不要）          | 1時間  |

---

## 6. チャットAPIのファイル名について

`src/app/ai-port/api/chat/route.node.ts` という見慣れない名前になっています。

このリポジトリは GitHub Pages への**静的エクスポート**でもビルドできる必要がありますが、
静的エクスポートでは POST の Route Handler を持てません。
そこで `next.config.ts` の `pageExtensions` を使い、

- サーバー配信時: `["ts", "tsx", "node.ts"]` → ルートとして認識される
- 静的エクスポート時: `["ts", "tsx"]` → 存在しないことになる

としています。APIが無い環境では、チャットUIが**サイト内検索へ自動的に切り替わります**
（「使えません」で終わらせない）。

---

## 7. 環境変数

すべて任意です。未設定でもサイトは完全に動作します。

| 変数                                | 用途                                                |
| ----------------------------------- | --------------------------------------------------- |
| `NEXT_PUBLIC_AI_PORT_URL`           | 独自ドメインへ切り出す場合のオリジン                |
| `ANTHROPIC_API_KEY`                 | AIチャット（Claude）                                |
| `OPENAI_API_KEY`                    | AIチャット（OpenAI）                                |
| `GOOGLE_API_KEY` / `GEMINI_API_KEY` | AIチャット（Gemini）                                |
| `OPENROUTER_API_KEY`                | AIチャット（OpenRouter）                            |
| `AI_PORT_ANTHROPIC_MODEL` ほか      | 使用モデルの上書き                                  |
| `YOUTUBE_API_KEY`                   | （任意）Data API v3。未設定ならRSSを使用            |
| `AI_PORT_AFFILIATE_<SLUG>`          | ツールごとのアフィリエイトリンク。未設定なら公式URL |
| `NEXT_PUBLIC_AI_PORT_X_URL` ほか    | SNSリンク（未設定なら表示しない）                   |

APIキーが1つも無い場合、AIチャットは**サイト内検索の結果**を返します。

---

## 8. パフォーマンスのために避けたこと

「2035年のAIインターネット」を、Core Web Vitals を落とさずに作るための判断です。

| 使わなかったもの          | 代わりにしたこと                                                          |
| ------------------------- | ------------------------------------------------------------------------- |
| Three.js / Spline / WebGL | Canvas 2D（`NeuralField`）＋ CSSの3D変換（`HeroOrb`）。数百KB〜数MBの削減 |
| GSAP                      | IntersectionObserver + CSS transition（`Reveal`）                         |
| Lottie                    | インラインSVG + CSS keyframes                                             |
| 各社のLLM SDK 4種         | 共通の `fetch` + SSEパース（`chat-providers.ts`）                         |
| 全文検索エンジン          | メモリ上のスコアリング（数百件規模なら十分に速い）                        |

動きはすべて `transform` / `opacity` / `filter` のみ。レイアウトの再計算を起こしません。
Canvas は画面外・タブ非表示で停止し、`prefers-reduced-motion` では1フレームだけ描いて止まります。

---

## 9. SEO / LLMO / AEO / GEO

| 施策                 | 実装                                                                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 構造化データ         | Organization / WebSite+SearchAction / BreadcrumbList / FAQPage / HowTo / Article / SoftwareApplication / ItemList / CollectionPage / WebApplication |
| OGP / Twitter Card   | 全ページ（`lib/ai-port/seo.ts`）                                                                                                                    |
| canonical            | 全ページ                                                                                                                                            |
| hreflang             | `ja` と `x-default` のみ（翻訳版の実URLを持たないため。§10参照）                                                                                    |
| サイトマップ         | 千里側と同じ `/sitemap.xml` に統合                                                                                                                  |
| robots               | `/ai-port/search` と `/ai-port/api/` のみ除外                                                                                                       |
| RSS                  | `/ai-port/rss.xml`（自社記事のみ）                                                                                                                  |
| llms.txt             | `/ai-port/llms.txt`（掲載方針まで書き、誤った引用を防ぐ）                                                                                           |
| パンくず             | 全下層ページ。画面表示と構造化データを必ず一致させる                                                                                                |
| 内部リンク           | フッターに全トピック、各ページ末尾に `RelatedLinks`                                                                                                 |
| AEO                  | 見出しを質問形に、冒頭に結論、記事に必ずFAQ3件以上                                                                                                  |
| Google Discover 対策 | 大きめのOGP画像・`max-image-preview:large`・更新日の明記・一次情報への導線                                                                          |

**hreflang について**: このサイトは翻訳版のURLを持たず、1つのURLをブラウザ上で機械翻訳します。
実体のないURL（`/en/...` など）を hreflang に書くと、存在しないページを申告することになり
かえって評価を落とすため、正直に `ja` と `x-default` だけを出しています。
翻訳版を静的に持つようになったら `lib/ai-port/seo.ts` の `languages` を実URLで埋めてください。

---

## 10. 多言語（固定要件）

AGENTS.md §1 の固定要件を AI PORT でも満たしています。

- ヘッダーに言語切り替えを**常時設置**（デスクトップ・モバイルとも）
- 選択肢に**必ず国旗**（`public/images/flags/<国コード>.webp`）
- 旗だけにせず、**その言語での言語名を併記**
- 対応42言語、並び順は訪日客の多い順（アルファベット順にしない）
- **日本語のときは翻訳スクリプトを読み込まない**
- 店名・提供元名・日時など、書き換わると意味が壊れる箇所は `translate="no"`
- Cookie を書いてリロードする方式（ハイドレーション中の表示崩れを防ぐ）

言語データ（`src/data/languages.ts`）と切り替えの仕組み（`src/lib/translate.ts`）は
千里側と**共通**で、見た目だけが異なります。

---

## 11. CMSへの移行

表示に使うデータはすべて `src/data/ai-port/` にあり、UIから分離されています。
ヘッドレスCMSやSupabaseへ移す場合は、以下の関数の**中身だけ**を差し替えてください。

| 関数                              | 現在       | 移行後             |
| --------------------------------- | ---------- | ------------------ |
| `getArticles()` / `findArticle()` | 配列を返す | CMSから取得        |
| `getTools()` / `findTool()`       | 配列を返す | DBから取得         |
| `getAdSlots()`                    | 空配列     | 広告管理から取得   |
| `getSearchIndex()`                | 静的生成   | 全文検索エンジンへ |

DBスキーマ案は `docs/ai-port/db-schema.sql` にあります。

---

## 12. 追加のしかた

| やりたいこと           | 編集するファイル                                                      |
| ---------------------- | --------------------------------------------------------------------- |
| AIツールを追加         | `src/data/ai-port/tools.ts`（一覧・比較・ランキング・検索に自動反映） |
| ニュースのベンダー追加 | `src/data/ai-port/feeds.ts`（カテゴリータブとページが自動で増える）   |
| トピック（分野）追加   | `src/data/ai-port/taxonomy.ts`                                        |
| 解説記事を追加         | `src/data/ai-port/articles.ts`                                        |
| AI診断を追加           | `src/data/ai-port/diagnosis.ts`                                       |
| 広告枠を追加           | `src/data/ai-port/ads.ts`（`sponsored: true` でPR表示）               |

いずれもサイトマップ・検索インデックス・llms.txt に自動で反映されます。

---

## 13. 画像

画像の取得・ライセンス判定・クレジット表示は、サイト共通の `src/media/` が担当します。
AI PORT 側は掲載枠を置くだけです。

| やりたいこと       | 使うもの                                        |
| ------------------ | ----------------------------------------------- |
| 見出しの背景       | `<AiMediaBackdrop kind="topic" slug={...} />`   |
| カードのサムネイル | `<AiMediaThumb kind="event" slug={...} />`      |
| 本文中の図版       | `<WikimediaFigure />`（`src/media/components`） |
| 出典の確認         | `/ai-port/image-credits`                        |

ライセンス確認済みの画像が無い枠は、外部素材を使わない装飾表現に落ちます。
比率を固定しているため、画像の有無でレイアウトは変わりません。

判定のルールと運用は [docs/media/README.md](../media/README.md) を参照してください。
