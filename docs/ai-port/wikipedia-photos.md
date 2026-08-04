# Wikipedia 記事画像の取得（ライセンス未確認の経路）

> **⚠ この経路はライセンス確認をしていません。**
> `src/media/` の判定（取得と掲載可否の分離、クレジット同梱、承認キュー）を通りません。
> 両者を取り違えないでください。

このリポジトリには、外部画像を扱う経路が**2つ**あります。

|                | 検証済みの経路                 | この経路                                      |
| -------------- | ------------------------------ | --------------------------------------------- |
| コマンド       | `npm run media:sync`           | `npm run photos:sync`                         |
| 取得元         | Wikimedia Commons `imageinfo`  | Wikipedia REST summary API                    |
| 取得するもの   | 画像＋作者＋ライセンス＋出典   | **画像のみ**                                  |
| ライセンス判定 | `src/media/lib/eligibility.ts` | **なし**                                      |
| クレジット表示 | 画像と同じ `<figure>` に必須   | **なし**（出せない）                          |
| 承認           | 人が承認するまで非表示         | **なし**（即表示）                            |
| 保存先         | 参照（`upload.wikimedia.org`） | 自前ホスト（`public/images/ai-port/photos/`） |

`src/media/` の割り当てがある枠では、**そちらが優先されます**。
この経路の画像が出るのは、確認済みの画像が無い枠だけです。

---

## 1. なぜこの経路があるのか

`mountain-peak-demo`（同じ運営者の別サイト）が、この方式で495点の写真を掲載しています。
速く、確実に写真が集まる方式です。**自前ホストである点は、ホットリンクより行儀が良い**という利点もあります。

その方式をこのリポジトリにも適用したい、という判断で追加しました。

## 2. 何を確認していないのか

取得しているのは Wikipedia REST summary API の `originalimage.source` です。
これは**その記事に表示されている画像**を指し、**ライセンスを問わず**返ります。

したがって、取得物には次が混ざりえます。

- **CC BY / CC BY-SA の作品** — 作品ごとの作者表示が条件です。この経路は作者情報を
  取得していないため、条件を満たせません。
- **フェアユース等、そもそも再利用できない画像** — 日本語版・英語版ともに、
  記事内にこの種の画像が含まれることがあります。
- **ライセンス以外の権利が残る被写体** — 人物（肖像権・パブリシティ権）、
  商標、建築著作物、パノラマの自由が制限される国で撮られた建物など。

`scripts/` 配下を `extmetadata|LicenseShortName|Artist|imageinfo` で検索しても、
この経路のスクリプトには1件もヒットしません。**設計として取得していません。**

## 3. 画面での扱い

- 画像は装飾として出しています（`alt=""` / `aria-hidden`）。本文の意味は画像に依存しません。
- `/ai-port/image-credits` に「ライセンス未確認の写真」の節を常設し、
  **確認していないこと自体を明記**しています。この節を消さないでください。
- 権利者からの連絡を受け付ける導線（お問い合わせ）を同じ節に置いています。

## 4. 使い方

### PowerShell（Windows。mountainpeak と同じ手順）

```powershell
powershell -ExecutionPolicy Bypass -File scripts\wikipedia-photos.ps1
powershell -ExecutionPolicy Bypass -File scripts\wikipedia-photos-resize.ps1
node scripts/wikipedia-photos.mjs --index-only
```

原本は `%TEMP%\aiportphotos` に落ち、リサイズ後に `public/images/ai-port/photos/` へ入ります。

### Node（macOS / Linux / CI）

```bash
npm run photos:sync                 # 取得（既存はスキップ）
npm run photos:sync -- --dry-run    # 取得先URLの確認だけ
npm run photos:sync -- --only=topic-ai-agent
npm run photos:sync -- --force      # 既存も取り直す
npm run photos:index                # 一覧の作り直しだけ
```

`sharp` で 1280px / JPEG q82 に縮小して保存します（PowerShell 版と同じ設定）。

### 対象を足す

`scripts/wikipedia-photo-manifest.json` に追記します。

```json
{ "slug": "topic-ai-agent", "lang": "ja", "titles": ["産業用ロボット", "ロボット"] }
```

- `slug` は `<種別>-<スラッグ>` の形。`AiMediaBackdrop` / `AiMediaThumb` の
  `kind` / `slug` と対応します。
- `titles` は上から順に試し、画像が取れた時点で止まります。

### 環境変数

| 変数                          | 用途                                                        |
| ----------------------------- | ----------------------------------------------------------- |
| `WIKIPEDIA_PHOTOS_USER_AGENT` | 連絡先を含む User-Agent。Wikimedia の利用方針が求めています |

## 5. 相手のサーバーへの配慮

mountainpeak と同じ設定です。ここを緩めないでください。

- 逐次アクセス（並列にしない）
- summary 取得の前に3秒、ダウンロードの前に2秒
- 429 が返ったら20秒待つ
- 連絡先入りの User-Agent

## 6. 削除の求めがあったとき

`public/images/ai-port/photos/<slug>.jpg` を削除し、`npm run photos:index` を実行してください。
一覧から外れ、その枠は装飾表現に戻ります。**ビルドは壊れません。**

## 7. 現在の状態

**0件です。** 実装環境から Wikipedia / Wikimedia の全ホストへ到達できません
（ネットワークポリシーにより CONNECT が 403 で拒否されます）。
取得は、ネットワークの通る環境で実行してください。

---

## 関連

- [docs/media/README.md](../media/README.md) — 検証済みの経路（`src/media/`）
- [docs/media/license-checklist.md](../media/license-checklist.md) — 承認前チェックリスト
- [AGENTS.md](../../AGENTS.md) §5 — 画像の権利（固定要件）
