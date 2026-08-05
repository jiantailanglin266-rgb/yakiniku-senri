<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# AI PORT の固定要件

以下は**毎回必ず満たすべき条件**です。機能追加やリファクタリングで壊さないでください。

このリポジトリは `jiantailanglin266-rgb/yakiniku-senri` から分離したものです（2026-08-04）。
分離前は焼肉 千里・CRYPTO PORT・CARD PORT・SPORTS PORT と同居し、
`/yakiniku-senri/ai-port/` で配信していました。
コード内に同居前提のコメントが残っている場合があります。

## 1. 多言語切り替え（国旗つき）

- ヘッダーに**言語切り替えUIを常時設置**する（`src/components/ai-port/layout/AiLanguageSwitcher.tsx`）
- 選択肢には**必ず国旗を表示**する。国旗は `public/images/flags/<国コード>.webp`
- 国旗だけにせず、**必ずその言語での言語名を併記**する
  （言語と国は1対1ではないため、旗だけでは誤解を招きます）
- 対応言語は `src/data/languages.ts` で管理。**言語を追加したら国旗も追加**する
- 並び順は訪日客の多い言語順を維持する（アルファベット順にしない）
- 国旗は flag-icons（MIT）です。**ライセンス全文への導線を消さないでください**
  （`public/licenses/flag-icons-LICENSE.txt`。テストで機械的に守っています）

### 触ってはいけない設計

| 項目                                       | 理由                                                   |
| ------------------------------------------ | ------------------------------------------------------ |
| 日本語のときは翻訳スクリプトを読み込まない | 来訪者の大半が日本語話者。常時読み込むと全員が遅くなる |
| 翻訳失敗時に日本語のまま読める設計         | 外部サービス依存の切り分け                             |
| Cookie を書いてリロードする方式            | セレクト直接操作はハイドレーション中に表示が壊れる     |

## 2. 作業の完了条件

1. `npm run typecheck` / `npm run lint` / `npm run test` / `npm run format:check` / `npm run build` を通す
2. 本番ビルドで実際に描画して確認する（devサーバーはCSS再生成が遅れることがある）
3. コミット → push → PR作成 → **マージ** → デプロイ結果の確認まで行う
4. 報告時に**GitHubの公開URLを併記**する

## 3. 事実性

以下を**出力しない**ことをテストで機械的に守っています
（`tests/ai-port-data.test.ts` / `tests/ai-port-seo.test.ts`）。

- AIツールの料金の**金額**（変動が速く、古い数字は読者への実害）
- レビュー点数・星の数・`AggregateRating` / `Review` の構造化データ
- PV・会員数など、計測していない数字
- イベントの**開催日**（毎年変わるため、季節の目安のみ）
- ダミーの広告枠（実在しない案件の表示は不当表示）

確認できていない項目は `null` とし、画面には「未確認」と表示します。
空欄にすると「なし」と読まれ、事実と異なる印象を与えるためです。

## 4. デプロイ（GitHub Pages）

公開URL: `https://<オーナー>.github.io/ai-port/`

### 触ってはいけない設計

| 項目                                                    | 理由                                                                                                                      |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PAGES_BASE_PATH` と `NEXT_PUBLIC_BASE_PATH` を両方指定 | 片方だけだと、ページは開けるのに**画像だけ404**になります（next/image は unoptimized のとき basePath を自動付与しません） |
| `NEXT_PUBLIC_AI_PORT_URL` は**オリジンだけ**            | 絶対URLは `オリジン + ベースパス` で組み立てます。リポジトリ名まで入れると `/ai-port/ai-port/...` になります              |
| `AI_PORT_BASE = ""`（`src/data/ai-port/site.ts`）       | 内部パスにベースパスを足すと、Next.js の basePath と二重になります                                                        |
| `route.node.ts` という拡張子と `pageExtensions`         | 静的エクスポートでのビルドを成立させる仕組みです（APIが無い環境ではチャットが検索に切り替わります）                       |
| `trailingSlash: true`                                   | 各ページを `<path>/index.html` として出力し、GitHub Pages で確実に解決させるため                                          |
| `.nojekyll`                                             | `_next/` を Jekyll に無視されないようにするため                                                                           |
| CSSトークンの `ai-` 接頭辞                              | 同居時代の名残ですが、`src/styles/ai-port.css` 全体が参照しているため変えないでください                                   |

## 5. 画像の権利（`src/media/`）

### 触ってはいけない設計

| 項目                                                              | 理由                                                                 |
| ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| 取得（`metadataRaw`）と判定（`verificationStatus`）を別に持つ     | APIが200を返したことは、掲載してよい根拠になりません                 |
| `WikimediaImage` が画像とクレジットを同じ `<figure>` に描画       | クレジットだけ外して画像を使う経路を作らないためです                 |
| `isPublishable()` が偽なら `null` を返す                          | ライセンス情報の無い画像を、そもそもレンダリングさせないためです     |
| ページ側は `MediaSlot` / `WikimediaFigure` だけを使う             | 呼び出し側で分岐を書くと、関連の薄い画像を貼る抜け道ができます       |
| ホワイトリストの既定が `PD,CC0` だけ                              | 作者表示が必要なライセンスを自動公開すると、クレジット漏れが起きます |
| 作者名・ライセンス名・ファイル名・Commons URL の `translate="no"` | 翻訳すると、ライセンスが要求する「作者の表示」を満たさなくなります   |

### 判断の原則

- **「Wikipedia に載っているから自由に使える」は誤りです。** 対象は Wikimedia Commons の
  ファイルだけで、1件ずつライセンス・作者・出典・利用条件を確認します。
- **ライセンスを機械的に判定できない画像は、自動公開しません。**
- **ライセンスは著作権だけの話です。** 肖像権・商標・建築著作物・パノラマの自由は別に確認します。
- **推測でメタデータを埋めません。** 取得できなかった項目は `null` のままにします。
- **Wikimedia 以外の素材も記録します。** `src/media/data/site-assets.ts` に
  作者・出典・ライセンス・改変内容を残します。出所が分からないものは
  「出所未確認」と書き、**推測で「自作」と書きません**。

## 6. マーキー（描画コスト）

斜めのキーワード帯には、1本あたり約200個のピルが並びます。
**1個あたりの負荷がそのまま200倍になります。**

`backdrop-blur` / `bg-clip-text` のグラデーション文字 / 影のぼかし / `filter` を
ピルに足さないでください（実際に `backdrop-blur` でスクロールが重くなりました）。
`tests/ai-port-keyword-marquee.test.tsx` が機械的に検出します。
