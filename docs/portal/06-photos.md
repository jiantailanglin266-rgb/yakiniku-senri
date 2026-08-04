# CRYPTO PORT の写真（一括クレジット方式）

CRYPTO PORT には、画像の扱いが**2系統**あります。混ぜないでください。

| 系統                       | 対象                                 | クレジット           | 判定                       |
| -------------------------- | ------------------------------------ | -------------------- | -------------------------- |
| 共通メディア基盤           | `MediaSlot` / `WikimediaFigure` の枠 | 画像ごとに作者・出典 | `src/media` が1件ずつ判定  |
| **一括クレジット（本書）** | 解説記事・銘柄ページの写真           | サイト共通の1行      | 判定なし（検索上位を採用） |

## 1. この方式を採っている理由

運営判断です。既存の mountain-peak と同じ方式に揃えるため、
画像ごとの個別クレジットではなく、サイト共通の一括表記としています。

**この方式には次の制約があります。記録として残します。**

- 画像1件ずつのライセンス・作者・出典を確認していません
- CC BY-SA は作者名の表示を条件とするため、一括表記では条件を満たさない場合があります
- 表記している「CC BY-SA 4.0」は、実際の各ファイルのライセンスと一致しない場合があります
- 肖像権・商標・建築著作物など、著作権以外の権利は確認していません

個別クレジットが必要な画像は、共通メディア基盤（`src/media`）側で扱ってください。
そちらは 1件ずつ確認しないと表示できない作りになっています。

## 2. 取得のしかた

**この開発環境からは Wikimedia へ到達できません**（egress ポリシーで遮断）。
ネットワークの通る環境で実行してください。

### PowerShell（Windows）

```powershell
# 検索結果だけ見る
pwsh -File scripts\portal-photos.ps1 -DryRun

# 保存する
pwsh -File scripts\portal-photos.ps1 -Write

# 1件だけ試す
pwsh -File scripts\portal-photos.ps1 -Write -Only coin:bitcoin
```

実行ポリシーで止まる場合:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\portal-photos.ps1 -Write
```

### Node（macOS / Linux / CI）

```bash
npm run portal:photos -- --dry-run
npm run portal:photos -- --write
npm run portal:photos -- --write --only=coin:bitcoin
```

どちらも同じ処理です。実行後:

```bash
npm run format
npm run build
git add public/images/portal src/portal/data/photo-manifest.json
git commit -m "feat: CRYPTO PORT の写真を追加"
git push
```

## 3. ファイルの置き場所

| ファイル                                      | 役割                                            |
| --------------------------------------------- | ----------------------------------------------- |
| `src/portal/data/photo-targets.json`          | 取得対象（ページキー → 検索語）。手で編集します |
| `src/portal/data/photo-manifest.json`         | **実際に保存できた**ファイルの記録。自動生成    |
| `public/images/portal/<key>.jpg`              | 画像の実体。リポジトリへコミットします          |
| `src/portal/lib/photos.ts`                    | マニフェストの読み出しと一括クレジット文言      |
| `src/portal/components/media/PortalPhoto.tsx` | 表示。マニフェストに無ければ何も描画しません    |

マニフェストに載っていないページは、写真ではなく生成ビジュアルを表示します。
ファイルが無いのに `<img>` を出して 404 を並べないための仕組みです。

## 4. 取得条件

検索上位から、次を満たす最初の1枚を採用します。

- 横幅 1000px 以上
- 横長（縦長はカードで破綻するため除外）
- JPEG または PNG
- 900KB 以下（Commons のサムネイル生成で 1600px 幅に縮小して取得）

## 5. 出典の記録

一括クレジット方式でも、**元の Commons ファイル名だけは残します**
（`photo-manifest.json` の `commonsFile`）。
`/<言語>/image-credits` にファイル名の一覧を出し、Commons のファイルページへリンクします。
後から個別クレジットへ切り替えるとき、出所が分からなくならないようにするためです。
