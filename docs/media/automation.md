# 画像取得の自動化

記事を書いてから画像が公開されるまでの流れと、実行方法をまとめます。

## 全体の流れ

```
記事を書く（src/cardport/data/*.ts）
  ↓
必要な画像枠を組み立てる          scripts/generate-media-requests.mjs
  ↓
Wikipedia の記事タイトル → 代表画像   scripts/lib/wikimedia-client.mjs
  ↓  （Commons にあるファイルだけ通します）
ライセンス・作者を Commons から取得    scripts/wikimedia-sync.mjs
  ↓
判定（読めない・非商用・改変不可は落とす）
  ↓
自動承認は PD / CC0 だけ（既定は無効） scripts/lib/media-approval.mjs
  ↓  それ以外は needs_review（＝表示されません）
承認済みだけダウンロードして最適化      scripts/media-optimize.mjs
  ↓
生成物の検証                        scripts/media-validate.mjs
  ↓
ビルド → GitHub Pages へデプロイ
```

## 実行方法は3つあります

| 方法                      | 人の手        | 使いどころ                               |
| ------------------------- | ------------- | ---------------------------------------- |
| **GitHub Actions**        | Push するだけ | 普段はこれ。取得も最適化もコミットも自動 |
| **PowerShell（Windows）** | コマンド1つ   | 手元で結果を見ながら進めたいとき         |
| **npm スクリプト個別**    | 各段階を手動  | 調整・デバッグ                           |

### 1. GitHub Actions（推奨）

`.github/workflows/media-sync.yml`

- **記事を追加して Push** すると自動で走ります（`src/cardport/data/*.ts` の変更を監視）
- **Actions タブから手動起動**もできます（自動承認の有無・件数を指定可能）
- **毎週月曜 12:15（日本時間）** に、掲載中の画像のライセンス・URL を再確認します

自動承認を常時有効にする場合は、リポジトリの Settings → Secrets and variables →
Actions → Variables に `MEDIA_AUTO_APPROVE = true` を設定します。
**設定しない限り、1件も自動承認されません。**

### 2. PowerShell（Windows のお手元で）

```powershell
# 取得だけ（承認しない）
.\scripts\media-sync.ps1

# パブリックドメインと CC0 は自動承認する
.\scripts\media-sync.ps1 -AutoApprove

# まず10枠だけ試す
.\scripts\media-sync.ps1 -AutoApprove -Limit 10

# 書き込まずに確認だけ
.\scripts\media-sync.ps1 -DryRun
```

実行が拒否される場合は、そのウィンドウだけ許可します。

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Wikimedia へ到達できるかを最初に確かめ、届かなければそこで止まります
（届かない環境で長時間走らせても意味がないためです）。

### 3. npm スクリプト個別

```bash
npm run media:requests -- --write     # 必要な画像枠を組み立てる
npm run media:sync -- --write         # 取得して判定する
npm run media:optimize -- --write     # 承認済みをダウンロードして最適化
npm run media:revalidate -- --write   # 掲載中の画像を再確認
npm run media:validate                # 生成物を検証
```

`--write` を付けない限り、どれもファイルを書き換えません。

---

## なぜ記事タイトルから取るのか

全文検索は、ファイル名や説明にたまたま語が入っただけの画像を拾います。
「payment」で検索すると、支払いと関係ない写真も大量に返ります。

記事の代表画像は、**その概念を説明するために人が選んだ1枚**です。
別サイト `mountain-peak` が 198 座すべての写真を集められているのは、この方法だからです。

対応表は `scripts/lib/media-keywords.mjs` の `wikipediaTitles` にあります。
対応が無い語は、従来どおり全文検索に回り、80 点の足切りが効きます。

### ただし、代表画像をそのまま採用はしません

Wikipedia の記事に表示されている画像には、各言語版へローカルアップロードされた
**非自由ファイル（フェアユース前提）が混ざります**。日本のサイトで再利用できません。

`fetchLeadImageTitle()` は `upload.wikimedia.org` の URL を見て、
`/wikipedia/commons/` 以外を捨てます。

```
https://upload.wikimedia.org/wikipedia/commons/a/ab/Example.jpg   → 通す
https://upload.wikimedia.org/wikipedia/ja/a/ab/Example.jpg        → 捨てる
```

そのうえで Commons の `imageinfo` を引き直し、ライセンス・作者を確認します。

---

## 自動承認の条件

`MEDIA_AUTO_APPROVE=true` のとき、**すべて**満たす場合だけ承認します。

- ライセンスが `MEDIA_AUTO_APPROVE_LICENSES`（既定 `PD,CC0`）に含まれる
- 関連度が `MEDIA_AUTO_APPROVE_SCORE`（既定 80）点以上
- 解像度が `MEDIA_AUTO_APPROVE_MIN_WIDTH` × `MEDIA_AUTO_APPROVE_MIN_HEIGHT`（既定 1200×675）以上
- 作者名が取得できている
- Commons のファイルページURLがある
- ライセンスURLがある
- 人物・ロゴ・ブランド・商品・美術作品の語が検出されない

最後の1項目は、点数と無関係に効きます。
**ライセンスは著作権だけの話**で、肖像権・商標権は含まないからです。

作者表示が必要なライセンス（CC BY / CC BY-SA）は既定で自動承認しません。
クレジットの出し方まで含めて人が確認する必要があるためです。

---

## 週次の再確認

一度確認したライセンスは、あとから変わることがあります。
ファイルが削除される、ライセンスが訂正される、URL が変わる——
いずれも「掲載してよい」という前提が崩れます。

`scripts/media-revalidate.mjs` が毎週、掲載中の画像を Commons と突き合わせ、
差異があった画像だけを `needs_review` に戻します（その時点で画面から消えます）。

**取得に失敗しただけでは戻しません。** 一時的なネットワーク障害と、
ファイルの削除は別だからです。到達できなかった件数は報告だけします。

---

## 生成されるファイル

| ファイル                                 | 生成元                          | 手で編集                             |
| ---------------------------------------- | ------------------------------- | ------------------------------------ |
| `src/media/data/requests.json`           | 人                              | **する**（自動生成より優先されます） |
| `src/media/data/requests.generated.json` | `media:requests`                | しない                               |
| `src/media/data/assets.generated.json`   | `media:sync` / `media:optimize` | しない                               |
| `src/media/data/usages.generated.json`   | `media:sync`                    | しない                               |
| `public/media/wikimedia/<id>/`           | `media:optimize`                | しない                               |

`public/media/wikimedia/<id>/meta.json` には、作者・ライセンス・出典・取得日時を
画像と同じ場所に置いています。ファイルだけがコピーされてもクレジットを辿れるようにするためです。

---

## 特定の画像を指名したいとき

`src/media/data/requests.json` に書いた行は、自動生成より優先されます。

```json
{
  "pageKey": "cardport:guide:points-basics",
  "slot": "inline",
  "query": "contactless payment terminal",
  "wikipediaTitles": { "lang": "ja", "titles": ["非接触型決済"] },
  "altJa": "コンビニのレジに置かれたタッチ決済端末",
  "altEn": "A contactless payment terminal at a convenience store checkout",
  "limit": 5
}
```

`altJa` / `altEn` を書くと、自動生成の代替テキストより優先されます。
画像を見て書いたほうが正確なので、承認するときに直すことをおすすめします。
