# 画像の取得・検証・掲載

Wikimedia Commons の画像を扱うための仕組みです。
SPORTS PORT で使っていますが、他サイトからも同じ形で呼び出せます。

## いちばん大事なこと

**「取得できた」と「使ってよい」は別です。**

Commons の API から画像が返ってきても、それは利用許可を意味しません。
ライセンス・作者・出典が揃って初めて公開候補になり、
さらに追加権利（肖像・商標・建築著作物）の確認を経て公開されます。

この分離をコードの構造で担保しています。

| 層                                | 役割                         | 判断すること                     |
| --------------------------------- | ---------------------------- | -------------------------------- |
| `scripts/wikimedia-sync.mjs`      | 取得                         | **何も判断しない**（生値を書く） |
| `src/wikimedia/licenses.ts`       | ライセンスの正規化と可否判定 | 商用可・改変可・許可リスト       |
| `src/wikimedia/risks.ts`          | 追加権利の推定               | 人物・商標・建築・美術           |
| `src/wikimedia/data/assets.ts`    | 組み立て                     | 上2つを適用して状態を決める      |
| `src/wikimedia/data/reviews.json` | 人間の判断                   | 保留中のものを承認／却下         |
| `WikimediaImage`                  | 表示                         | 条件を満たさないものは描画拒否   |

同期スクリプトを書き換えても、公開条件は緩みません。
判定は TypeScript 側にしか無く、テストで固定されているためです。

## 使い方

```bash
# 1. 取得（外部ネットワークが必要）
WIKIMEDIA_CONTACT_EMAIL=you@example.com npm run wikimedia:sync

# 試しに1件だけ、ファイルを書き換えずに確認する
npm run wikimedia:sync -- --dry-run --target=/sports/tennis

# 2. 判定結果を確認する
npm run dev   # → /sports-port/ja/admin の IMAGE REVIEW

# 3. 保留中のものを承認する
#    src/wikimedia/data/reviews.json に追記してコミット（＝コードレビューを通す）

# 4. 公開結果を確認する
#    /sports-port/ja/image-credits
```

探す対象は `src/wikimedia/data/targets.json` に書きます。
ここに書くのは「何を探すか」だけで、ライセンスや作者は絶対に書きません。

## 公開される条件

`evaluateAsset()` の `blockers` が空で、かつ `verificationStatus === "approved"` のときだけです。

blockers（人間が承認しても解消できない）:

- ライセンスを判定できない
- 許可リストに無いライセンス（CC BY-NC / CC BY-ND / GFDL など）
- 商用利用不可・改変不可
- クレジット必須なのに作者が不明
- Commons ファイルページのURLが無い
- 画像URLが無い

risks（人間が確認すれば解消できる）:

- 存命人物・著名人・子ども
- 商標・ロゴ・商品
- 美術作品・建築著作物
- イベント会場・建物内部
- 被写体が判別できない

自動で `approved` になるのは **PD または CC0 かつ 作者・出典が揃い、risks が空** のときだけです。
それ以外は `reviews.json` に人間の判断を書くまで公開されません。

## 画像とクレジットは切り離せません

`WikimediaImage` は、条件を満たさない asset を渡されると
画像ではなく生成ビジュアル（`FallbackVisual`）を返します。
クレジットを非表示にするプロパティはありません。

```tsx
// クレジットの無い画像は、そもそも描画されません
<WikimediaCardImage
  asset={assetForPage("/news/xxx", "card")}
  locale={locale}
  fallbackSeed={article.slug}
  fallbackAccent={sport.accent}
/>
```

`creditPlacement="none-hover"`（カード用）でも、クレジットは画像のすぐ下に
ホバー／フォーカスで出ます。記事末尾へまとめる方式は採っていません。

## 画像が無いときは、無理に載せません

適切な画像が見つからない場合は `FallbackVisual` を出します。
スラッグから決定的に生成する SVG なので、

- 権利の問題がゼロ
- 再ビルドしても絵が変わらない（ハイドレーションのずれが起きない）
- 競技ごとのアクセント色が付く

という性質があります。関連性の低い写真を装飾目的で並べるより、
こちらのほうが品質が高いという判断です。

## やらないこと

- Wikipedia 記事本文の画像をそのままコピーする
- Google 画像検索の結果を使う
- ライセンス確認を省略して「たぶん大丈夫」で載せる
- 作者名・ライセンス表示・出典URLを消す
- フェアユース画像を商用利用する
- クレジットを読めない大きさにする
- 画像の内容を誤認させる加工をする
- Wikimedia / Wikipedia の公認を受けているかのように見せる

最後の点について、`/image-credits` に
「当サイトは Wikimedia Foundation とは無関係であり、公認を受けたものではありません」
と明記しています。

## 関連ファイル

- 監査結果 → [audit.md](audit.md)
- ライセンス確認の手順 → [checklist.md](checklist.md)
- 実装済み・未実装 → [status.md](status.md)
