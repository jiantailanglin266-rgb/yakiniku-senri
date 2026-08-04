# 実装済み / 未実装

## 実装済み

### 取得

- `npm run wikimedia:sync` — Commons の File 名前空間のみを検索し、
  `imageinfo` + `extmetadata` + カテゴリを取得
- 連絡先入りの User-Agent、`maxlag=5`、指数バックオフ、リクエスト間隔
- Wikidata の P31 / P570 による存命人物の判定
- `--dry-run` / `--target=` オプション
- 解像度不足・URL欠落は取得時点で除外し、理由を記録

### 判定

- ライセンス正規化（表記揺れ・非商用・改変不可・不明の切り分け）
- 許可リスト（環境変数 `WIKIMEDIA_ALLOWED_LICENSES` で変更可）
- blockers（承認しても解消できない）と risks（人間が確認すれば解消）の分離
- 追加権利の推定（人物・子ども・商標・商品・美術・建築・屋内・イベント）
- PD / CC0 かつ作者・出典が揃っているものだけを自動承認

### 表示

- `WikimediaImage` — 条件を満たさない asset は描画せず、生成ビジュアルへ
- `WikimediaHero` / `WikimediaFigure` / `WikimediaCardImage`
- `ImageAttribution` — 作者・出典・ライセンスをそれぞれリンク、`translate="no"`
- `ImageLicenseBadge`
- `FallbackVisual` — 決定的な SVG（乱数なし）
- `next/image` による遅延読み込み・レスポンシブ配信（`sizes` 必須）

### 運用

- `/sports-port/<言語>/image-credits` — 出典一覧（絞り込み付き）
- `/sports-port/<言語>/admin` の IMAGE REVIEW — 承認状況の可視化
- `src/wikimedia/data/reviews.json` — 人間の承認記録（コミット＝レビュー）
- テスト53件（`tests/wikimedia.test.ts` / `tests/wikimedia-components.test.tsx`）

## 未実装（意図的なものを含む）

| 項目                         | 状態         | 理由                                                                                                      |
| ---------------------------- | ------------ | --------------------------------------------------------------------------------------------------------- |
| 実画像の取得                 | 未実行       | この環境から Wikimedia API へ到達できません（プロキシが 403）。推測でメタデータを書かないため空のままです |
| 画像の自社ストレージへの複製 | 未実装       | まず取得を通してから。複製しても作者・ライセンス・出典の保持義務は変わりません                            |
| 管理画面からの承認ボタン     | **やらない** | 静的サイトに書き込み口を作らないため。承認は `reviews.json` のコミットで行い、必ずレビューを通します      |
| ライセンス表示のモーダル     | **やらない** | クリックしないとクレジットが見えない形は避けます。常に画像のそばに出します                                |
| 選手・チームの写真           | **やらない** | 肖像権・パブリシティ権・商標が絡み、Commons のライセンスだけでは解決しません                              |
| `ImageObject` 構造化データ   | 未実装       | 画像が0点のため。掲載開始と同時に、表示している画像だけを出力します                                       |
| 画像サイトマップ             | 未実装       | 同上。存在しない画像をサイトマップに書くことになるため                                                    |
| ライセンスの定期再確認バッチ | 未実装       | 実運用の cron 前提。手順は checklist.md の「公開後」を参照                                                |

## 環境変数

```bash
# Wikimedia の API 利用方針に沿って、連絡先の分かる User-Agent を送ります
WIKIMEDIA_CONTACT_EMAIL=you@example.com

# 許可するライセンス（カンマ区切り）。未設定なら PD / CC0 / CC BY / CC BY-SA
WIKIMEDIA_ALLOWED_LICENSES=PD,CC0
```

`WIKIMEDIA_ALLOWED_LICENSES` を狭めると、既に公開中の画像も表示が止まります
（判定は毎ビルド走ります）。広げる場合は、クレジット表示の要件も併せて確認してください。
