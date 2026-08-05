<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# CARD PORT の固定要件

このリポジトリは `jiantailanglin266-rgb/yakiniku-senri` から分離したものです（2026-08-05）。
分離前は焼肉 千里・AI PORT・CRYPTO PORT・SPORTS PORT と同居し、
`/yakiniku-senri/card-port/<言語>/` で配信していました。

## 1. 多言語切り替え（国旗つき）

- ヘッダーに**言語切り替えUIを常時設置**する（`src/cardport/components/layout/LanguageSwitcher.tsx`）
- 選択肢には**必ず国旗を表示**し、**その言語での言語名を併記**する
  （言語と国は1対1ではないため、旗だけでは誤解を招きます）
- 国旗は flag-icons（MIT）です。**ライセンス全文への導線を消さないでください**
  （`public/licenses/flag-icons-LICENSE.txt`。テストで機械的に守っています）

## 2. 作業の完了条件

1. `npm run typecheck` / `lint` / `test` / `format:check` / `build` を通す
2. 本番ビルドで実際に描画して確認する
3. コミット → push → PR作成 → **マージ** → デプロイ結果の確認まで行う
4. 報告時に**GitHubの公開URLを併記**する

## 3. 事実性（テストで機械的に守っています）

以下を**出力しない**ことを `tests/cardport-data.test.ts` / `tests/cardport-logic.test.ts` が確認します。

- 実データのない `AggregateRating` / `Review` / 受賞歴・メディア掲載実績
- 「必ず審査に通る」「誰でも発行できる」など、審査・特典を保証する表現
- 適用条件・期限・対象者を欠いたキャンペーン表示
- **実在するカードの商標・ロゴ・券面意匠**（掲載データはすべて架空です）

順位算出コード（`src/cardport/lib/scoring.ts`）は、アフィリエイト管理コード
（`src/cardport/lib/affiliate.ts`）を import しません。
**広告の報酬額が順位に影響しないことを、依存関係のレベルで担保**しています。
この関係を壊さないでください。

## 4. デプロイ（GitHub Pages）

公開URL: `https://<オーナー>.github.io/card-port/`

### 触ってはいけない設計

| 項目                                                    | 理由                                                                                                                      |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PAGES_BASE_PATH` と `NEXT_PUBLIC_BASE_PATH` を両方指定 | 片方だけだと、ページは開けるのに**画像だけ404**になります（next/image は unoptimized のとき basePath を自動付与しません） |
| `cardportAbsoluteUrl()` の二重化チェック                | `NEXT_PUBLIC_CARDPORT_URL` にベースパスが含まれていても正しく動くための仕組みです。外さないでください                     |
| `package-lock.json` をコミットする                      | `setup-node` の npm キャッシュと `npm ci` の両方に必須です。無いとデプロイが即座に失敗します                              |
| `trailingSlash: true`                                   | 各ページを `<path>/index.html` として出力し、GitHub Pages で確実に解決させるため                                          |
| `.nojekyll`                                             | `_next/` を Jekyll に無視されないようにするため                                                                           |
| CSSトークンの `cp-` 接頭辞                              | 同居時代の名残ですが、`cardport.css` 全体が参照しているため変えないでください                                             |

## 5. 画像の権利（`src/media/`）

- **「Wikipedia に載っているから自由に使える」は誤りです。** 対象は Wikimedia Commons の
  ファイルだけで、1件ずつライセンス・作者・出典・利用条件を確認します
- **ライセンスを機械的に判定できない画像は、自動公開しません**
- **ライセンスは著作権だけの話です。** 肖像権・商標は別に確認します
- **推測でメタデータを埋めません。** 取得できなかった項目は `null` のままにします
- **Wikimedia 以外の素材も `src/media/data/site-assets.ts` に記録します。**
  出所が分からないものは「出所未確認」と書き、**推測で「自作」と書きません**
