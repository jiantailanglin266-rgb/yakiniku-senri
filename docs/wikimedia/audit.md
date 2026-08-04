# 画像利用状況の監査

実施日: 2026-08-04
対象: `public/images/` 配下の全89点と、コードが生成する画像

## 結果の要約

| 分類                     | 点数 | 権利上のリスク | 対応                        |
| ------------------------ | ---: | -------------- | --------------------------- |
| 自サイトで生成した画像   |   47 | なし           | —                           |
| 国旗（flag-icons / MIT） |   42 | **表示義務**   | `/image-credits` で解消済み |
| Wikimedia Commons の画像 |    0 | —              | 取得は未実施                |
| 出所不明の画像           |    0 | —              | —                           |

## 内訳

### 1. 自サイトで生成した画像（47点）

`scripts/generate-placeholders.mjs` / `generate-sports-assets.mjs` /
`generate-cardport-assets.mjs` が SVG から書き出したものです。
第三者の著作物は含まれていません。

- `access` `brand` `commitment` `common` `gallery` `hero` `menu` `movie`
  `news` `owner` `story` `takeout`（焼肉千里）
- `ai-port` `cardport` `portal` `sports`（各ポータル）

チームエンブレム・選手のシルエット・カード背景・OGP画像も、
すべてコードで描画しています（`Crest` / `FallbackVisual`）。

### 2. 国旗（42点）

`public/images/flags/*.webp` は
[flag-icons](https://github.com/lipis/flag-icons)（MIT License）の SVG を
表示サイズの WebP へ変換したものです。

**監査で見つかった唯一の実問題がこれでした。**

MIT License は、著作権表示とライセンス本文の保持を求めます。

> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.

これまで出典はコミットメッセージと `docs/seo/08-multilingual.md` にしか無く、
**サイト上にもリポジトリの LICENSE にも表記がありませんでした**。

→ `src/wikimedia/data/third-party.ts` に登録し、
`/sports-port/<言語>/image-credits` に著作権表示・ライセンス・配布元・
加工内容を掲載して解消しました。
`tests/wikimedia.test.ts` が、この表記が消えたら落ちるようにしています。

### 3. 外部から取得した画像（0点）

Wikimedia Commons の画像は1点も掲載していません。
取得の仕組み（`npm run wikimedia:sync`）は実装済みですが、
**この開発環境は外部ネットワークがプロキシで遮断されており**
（`commons.wikimedia.org:443` への CONNECT が 403）、実行できていません。

ライセンス情報を推測で書き込むことはしないため、
`src/wikimedia/data/assets.generated.json` は空のままです。
外部ネットワークのある環境で同期を実行すると埋まります。

### 4. YouTube サムネイル

AI PORT が `i.ytimg.com` を直接参照しています（`next.config.ts` の remotePatterns）。
これは YouTube の埋め込み仕様に沿った参照で、画像の再配布ではありません。
SPORTS PORT の動画カードは、この監査の時点では生成ビジュアルを使っています。

## 現状の画像不足

写真が1枚も無い状態で、以下の面が生成ビジュアルで埋まっています。

| 面                   | 状態               |
| -------------------- | ------------------ |
| トップのヒーロー     | 生成ビジュアル     |
| 競技ページのヒーロー | 生成ビジュアル     |
| ニュースカード       | 生成ビジュアル     |
| 動画サムネイル       | 生成ビジュアル     |
| チーム               | 生成エンブレム     |
| 選手                 | 背番号のシルエット |
| OGP                  | 生成画像           |

選手・チームについては、**写真を入れる予定がありません**。
存命人物の肖像権とクラブの商標が絡み、Commons のライセンスだけでは
解決しないためです（詳細は [checklist.md](checklist.md)）。

競技・会場・用具の写真は、無人・非商標のものを対象に同期する設定になっています
（`src/wikimedia/data/targets.json`）。
