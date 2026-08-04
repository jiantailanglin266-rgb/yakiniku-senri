# PORTALS

4つのポータルサイトを1つのコードベースで配信します。

| サイト      | URL                    | 内容                             |
| ----------- | ---------------------- | -------------------------------- |
| CRYPTO PORT | `/<言語>/`             | 暗号資産・Web3.0 の総合ポータル  |
| AI PORT     | `/ai-port`             | AIツールの比較・解説・ニュース   |
| CARD PORT   | `/card-port/<言語>/`   | クレジットカードの比較・診断     |
| SPORTS PORT | `/sports-port/<言語>/` | ライブスコア・ニュース・配信比較 |

もとは焼肉 千里の公式サイトと同居していましたが、別リポジトリへ分離しました。
履歴はそのまま引き継いでいます（`git log` で分離前の経緯まで辿れます）。

---

## セットアップ

```bash
npm ci
npm run dev
```

`http://localhost:3000/ja/` が CRYPTO PORT の入口です。
他のポータルは上の表のURLで開きます。

## 品質ゲート

変更のたびに、以下をすべて通してください。

```bash
npm run typecheck
npm run lint
npm run test
npm run format:check
npm run build
```

## 構成

```
src/
  portal/     CRYPTO PORT
  cardport/   CARD PORT
  sports/     SPORTS PORT
  components/ai-port/, data/ai-port/, lib/ai-port/   AI PORT
  media/      画像の取得・ライセンス判定・クレジット表示（4サイト共通）
  app/        ルーティング。ルートレイアウトは <html>/<body> とフォントだけ
```

`src/media/` は4サイトが共有しています。
ライセンス判定を1か所に閉じるための構成なので、サイトごとに複製しないでください。

## 画像

Wikimedia Commons の画像は、ライセンス・作者・出典を確認できたものだけを掲載します。
取得と掲載可否は別の工程です。

```bash
# 取得（GitHub Actions からも実行できます）
node scripts/wikimedia-sync.mjs --write

# 判定結果の確認
npm run media:validate
```

詳細は [docs/media/README.md](docs/media/README.md) を参照してください。

## ドキュメント

- [docs/portal/](docs/portal/) — CRYPTO PORT
- [docs/ai-port/](docs/ai-port/) — AI PORT
- [docs/cardport/](docs/cardport/) — CARD PORT
- [docs/sports-port/](docs/sports-port/) — SPORTS PORT
- [docs/media/](docs/media/) — 画像の取り扱い
