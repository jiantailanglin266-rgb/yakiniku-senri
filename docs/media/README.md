# 画像（Wikimedia Commons）サブシステム

`src/media/` は、Wikimedia Commons の画像を**ライセンスを確認したうえでだけ**掲載するための仕組みです。

このドキュメントは、実装した範囲・実装していない範囲・運用の手順をまとめたものです。

---

## 0. 現在の状態（重要）

**このリポジトリには、現時点で掲載可能な Wikimedia 画像が 1 件もありません。**

理由は、開発環境から Wikimedia のすべてのホスト（`commons.wikimedia.org` /
`upload.wikimedia.org` / `www.wikidata.org` / `query.wikidata.org` / `api.wikimedia.org`）へ
**HTTP 403 で到達できない**ためです。

そのうえで、次の判断をしています。

- **推測でファイル名・作者・ライセンスを埋めた「それらしいモックデータ」は作りません。**
  作者名やライセンスを推測で書くことは、このサブシステムが防ごうとしている行為そのものです。
- `src/media/data/assets.ts` は**空のまま**にしています。
- 画像が無い枠は、外部素材を使わない装飾表現（`FallbackVisual`）へ落ちます。
  そのため、画像が 0 件でも画面は成立します。

ネットワークが通る環境で `node scripts/wikimedia-sync.mjs --write` を実行すると、
候補が `needs_review` として貯まります。人が承認した時点で表示が始まります。

---

## 1. 設計の中心にある考え方

### 取得成功 ≠ 利用可能

API が 200 を返したことは、掲載してよい根拠になりません。

| 段階   | 担当                                      | 結果の置き場所                                             |
| ------ | ----------------------------------------- | ---------------------------------------------------------- |
| 取得   | `scripts/wikimedia-sync.mjs`              | `metadataRaw`（原文のまま保存）                            |
| 正規化 | `src/media/lib/license.ts`                | `licenseCode`（読めなければ `UNKNOWN`）                    |
| 判定   | `src/media/lib/eligibility.ts`            | `verificationStatus` / `rightsRisks` / `verificationNotes` |
| 承認   | 人（管理画面）                            | `verificationStatus = "approved"`                          |
| 描画   | `src/media/components/WikimediaImage.tsx` | `isPublishable()` が真のときだけ                           |

### 画像とクレジットは分離しない

`WikimediaImage` は `<figure>` を返し、画像とクレジットを**必ず同じ要素の中に**描画します。
クレジットを外して画像だけ使う経路は、意図的に用意していません。

`isPublishable()` が偽なら `null` を返すため、
**ライセンス情報の無い画像は、そもそもレンダリングできません。**

### 判定できないものは公開しない

- ライセンス表記が読めない → `license_unknown`（保留）
- 「CC BY」だけでバージョンが読めない → 最新版と決めつけず `UNKNOWN`
- 作者表示が必要なのに作者不明 → `needs_review`（保留）
- 肖像・商標・建築などの語彙を検出 → `rights_risk`（保留）

保留はすべて「表示しない」側に倒れます。

### ライセンスは著作権だけの話

CC ライセンスは著作権を扱うもので、**被写体の権利は別**です。

- 人物 → 肖像権・パブリシティ権
- ロゴ・商品 → 商標権
- 建築物・彫刻 → 建築著作物、国によっては「パノラマの自由」の制限
  （フランス・イタリア・ベルギー・ギリシャ・アイスランド・ウクライナなどを検出対象にしています）

`detectRightsRisks()` が語彙で拾い、**必ず人の確認へ回します**。
取りこぼしより「余分に確認へ回す」ほうが安全なので、語彙は広めに取っています。

---

## 2. ファイル構成

```
src/media/
  types.ts                     データモデル（取得結果と判定結果を別フィールドで持つ）
  config/licenses.ts           ライセンス定義とホワイトリスト（既定 PD, CC0）
  lib/license.ts               表記揺れの正規化。読めなければ UNKNOWN
  lib/eligibility.ts           掲載可否の判定 / detectRightsRisks / isPublishable
  lib/attribution.ts           クレジット文字列の組み立て（原文保持の印つき）
  lib/scoring.ts               候補の関連度スコア（しきい値 45 未満は不採用）
  lib/resolve.ts               掲載枠 → 表示する画像（唯一の解決口）
  data/assets.ts               画像本体のデータ（現在は空）
  data/usages.ts               ページと画像の結びつき
  data/requests.json           取得したい画像の指示（同期スクリプトの入力）
  i18n/labels.ts               ラベルの翻訳（作者名・ライセンス名は入れない）
  components/
    MediaSlot.tsx              ページ側の入口。画像 or 装飾
    WikimediaImage.tsx         画像＋クレジット（分離不可）
    WikimediaFigure.tsx        本文中の図版（画像が無ければ何も出さない）
    ImageAttribution.tsx       クレジット表示（最小 0.68rem・隠さない）
    ImageSourceDetails.tsx     出典・ライセンスの詳細（JS不要の details）
    ImageLicenseBadge.tsx      ライセンスバッジ
    FallbackVisual.tsx         画像が無いときの装飾（CSS/SVGのみ）
    MediaReviewQueue.tsx       管理画面の確認キュー
scripts/wikimedia-sync.mjs     取得パイプライン（既定は書き込みなし）
tests/media-license.test.ts    ライセンス正規化・判定順序・クレジット
tests/media-components.test.tsx 描画（クレジット分離不可・未承認は描画しない）
```

---

## 3. 使い方

### ページから画像枠を置く

```tsx
import { MediaSlot } from "@/media/components";
import { pageKey } from "@/media/data/usages";

<MediaSlot
  pageKey={pageKey("cardport", "news", article.slug)}
  slot="thumbnail"
  locale={locale}
  theme="news" // 画像が無いときの装飾テーマ
  seed={index}
/>;
```

`WikimediaImage` を直接呼ばないでください。
呼び出し側でフォールバックの分岐を書くと、
「画像が無いときに関連の薄い画像を貼る」抜け道ができます。

### 本文中の図版

```tsx
import { WikimediaFigure } from "@/media/components";

<WikimediaFigure pageKey={pageKey("cardport", "guide", guide.slug)} locale={locale} />;
```

画像が無ければ**何も描画しません**（装飾は入りません）。
意味のない装飾を本文に挟むと、読者に無関係な情報を見せることになるためです。

### 画像を取得する

```bash
# 1. 取得したい画像を src/media/data/requests.json に書く
# 2. まず書き込みなしで確認
node scripts/wikimedia-sync.mjs --dry-run

# 3. 問題なければ書き込み（src/media/data/assets.generated.json）
node scripts/wikimedia-sync.mjs --write
```

- スクリプトは **`approved` を付けません**。すべて `needs_review` 以下で止まります。
- **既存の画像を削除しません。** 同じIDが来たら更新、来なければそのまま残します。
- 一度人が承認した画像の状態は、再取得で巻き戻しません。

### 承認する

`/card-port/<言語>/admin` の「画像の確認キュー」で、状態と判定理由を確認します。

静的配信では書き込み先が無いため、承認ボタンは置いていません
（動かないボタンを置くと「承認済み」と誤解されるためです）。
本番では Supabase を接続し、`image_verification_logs` に履歴を残しながら更新してください。

---

## 4. 実装した範囲

- ライセンス正規化（表記揺れ・別名・前方一致・CC のパターン一致）
- 掲載可否の判定（順序つき・根拠つき）
- 追加権利のリスク検出（16分類 + パノラマの自由）
- クレジット表示（画像と分離不可・最小サイズ・原文保持）
- 出典/ライセンス詳細（JavaScript 不要）
- 候補の関連度スコアとしきい値（45未満は不採用 → 装飾へ）
- フォールバック装飾（13テーマ・10グリフ・外部素材なし）
- 取得パイプライン（既定は書き込みなし・承認は付けない）
- 画像の出典一覧ページ `/card-port/<言語>/image-credits`
- 管理画面の確認キュー
- DBスキーマ（7テーブル + 制約 + トリガ + RLS）
- テスト 57件

## 5. 実装していない範囲

| 項目                                 | 理由                                                             |
| ------------------------------------ | ---------------------------------------------------------------- |
| 実際の画像データ                     | 開発環境から Wikimedia へ到達できません（403）                   |
| 画像の自社ストレージへの保存         | 保存先の決定が必要です（`localPath` は用意済み）                 |
| 管理画面からの承認・却下操作         | 認証基盤と書き込み先が未接続です                                 |
| `ImageObject` 構造化データ           | 画像が0件のため、出すと画面と一致しません（§3 事実性）           |
| 画像サイトマップ                     | 同上                                                             |
| 既存画像（国旗・店舗写真）の出自記録 | 別途、撮影者・提供元の確認が必要です。**一括削除はしていません** |

---

## 6. 関連ドキュメント

- [image-guidelines.md](image-guidelines.md) — 画像を追加する人向けの手順
- [license-checklist.md](license-checklist.md) — 承認前チェックリスト
- [existing-image-audit.md](existing-image-audit.md) — 既存画像の棚卸し結果
