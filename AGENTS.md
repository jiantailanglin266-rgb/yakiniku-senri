<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# CRYPTO PORT の固定要件

以下は**毎回必ず満たすべき条件**です。機能追加やリファクタリングで壊さないでください。

このリポジトリは `jiantailanglin266-rgb/yakiniku-senri` から分離したものです（2026-08-05）。
分離前は焼肉 千里・AI PORT・CARD PORT・SPORTS PORT と同居し、
`/yakiniku-senri/<言語>/` で配信していました。
コード内に同居前提のコメントが残っている場合があります。

## 1. 多言語切り替え（国旗つき）

- ヘッダーに**言語切り替えUIを常時設置**する（`src/portal/components/layout/LocaleSwitcher.tsx`）
- 選択肢には**必ず国旗を表示**する。国旗は `public/images/flags/<国コード>.webp`
- 国旗だけにせず、**必ずその言語での言語名を併記**する
  （言語と国は1対1ではないため、旗だけでは誤解を招きます）
- 対応言語は `src/portal/i18n/config.ts` で管理。**言語を追加したら国旗も追加**する
- 国旗は flag-icons（MIT）です。**ライセンス全文への導線を消さないでください**
  （`public/licenses/flag-icons-LICENSE.txt`。テストで機械的に守っています）

## 2. 作業の完了条件

1. `npm run typecheck` / `npm run lint` / `npm run test` / `npm run format:check` / `npm run build` を通す
2. 本番ビルドで実際に描画して確認する（devサーバーはCSS再生成が遅れることがある）
3. コミット → push → PR作成 → **マージ** → デプロイ結果の確認まで行う
4. 報告時に**GitHubの公開URLを併記**する

## 3. 事実性

- **未確認の情報をサイトに載せない。** 推測値を入れるくらいなら空のままにする
- `AggregateRating` / `Review` / 受賞歴 / メディア掲載は、**実データがない限り出力しない**
- 構造化データは**画面に表示している内容とだけ**一致させる
- **特定銘柄の推奨・値上がりの示唆をしない。**
  マーキーのコイン画像から上昇チャートとキャッチコピーを切り落としているのはこのためです
  （`src/portal/components/home/CoinMarquee.tsx`）
- すべての言語でリスク注記を落とさない（金融メディアとしての最低条件。テストで守っています）

## 4. デプロイ（GitHub Pages）

公開URL: `https://<オーナー>.github.io/crypto-port/`

### 触ってはいけない設計

| 項目                                                    | 理由                                                                                                                             |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `PAGES_BASE_PATH` と `NEXT_PUBLIC_BASE_PATH` を両方指定 | 片方だけだと、ページは開けるのに**画像だけ404**になります（next/image は unoptimized のとき basePath を自動付与しません）        |
| `NEXT_PUBLIC_PORTAL_URL` は**オリジンだけ**             | `portalBase = PORTAL_URL + BASE_PATH` のため、リポジトリ名を付けると sitemap と robots が `/crypto-port/crypto-port/` になります |
| `package-lock.json` をコミットする                      | `setup-node` の npm キャッシュと `npm ci` の両方に必須です。無いとデプロイが即座に失敗します                                     |
| `trailingSlash: true`                                   | 各ページを `<path>/index.html` として出力し、GitHub Pages で確実に解決させるため                                                 |
| `.nojekyll`                                             | `_next/` を Jekyll に無視されないようにするため                                                                                  |

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

### 例外：一括クレジットの写真

解説記事・銘柄ページの写真だけは、運営判断により**サイト共通の一括表記**で運用しています。

- 対象は `public/images/portal/` に置いた画像のみ
- 表示は `PortalPhoto` / `PageVisual` に限定し、`src/media` の判定経路とは混ぜません
- 画像ごとのライセンス・作者は確認していません

### 未解決の課題

`src/media/data/site-assets.ts` に記録してあります。**推測で「問題なし」と書き換えないでください。**

- マーキーのコイン画像に、実在する銘柄の**商標**が描かれています（権利者への確認は未実施）
- Dogecoin の画像に柴犬（Kabosu）の意匠が含まれ、元写真の著作権との関係が未確認です

---

## 6. 分離後に可能になった改善（未実施）

- `src/app/[locale]` をルートグループへ移し、`<html lang={locale}>` にする。
  いまはルートが `lang="ja"` 固定で、実際の言語は `[locale]/layout.tsx` の
  `<div lang dir>` で宣言しています。同居時代の制約の名残です。URLは変わりません。
