# SalonFlow

サロン向け統合業務管理 SaaS。予約・顧客・電子カルテ・会計・分析をひとつのシステムにまとめます。

美容室、理容室、ネイルサロン、アイラッシュサロン、エステサロン、リラクゼーション、
整体・ボディケア、パーソナルサロン、複合美容サロンを対象としています。

> **製品名は設定で変更できます。** `PRODUCT_NAME` 環境変数を変えるだけで、
> 画面・通知・メタデータすべての表示名が切り替わります。

---

## 目次

- [1. これは何か / これは何でないか](#1-これは何か--これは何でないか)
- [2. 現在の実装状況](#2-現在の実装状況)
- [3. 技術構成](#3-技術構成)
- [4. セットアップ](#4-セットアップ)
- [5. デモデータ](#5-デモデータ)
- [6. ディレクトリ構成](#6-ディレクトリ構成)
- [7. 開発コマンド](#7-開発コマンド)
- [8. 重要な設計判断](#8-重要な設計判断)
- [9. プレースホルダー（未接続の外部連携）](#9-プレースホルダー未接続の外部連携)
- [10. 非機能目標](#10-非機能目標)
- [11. 本番運用前に必要な作業](#11-本番運用前に必要な作業)
- [12. 法務確認が必要な項目](#12-法務確認が必要な項目)
- [13. ドキュメント](#13-ドキュメント)

---

## 1. これは何か / これは何でないか

**これは**、公開情報と一般的なサロン業務要件をもとに独自設計した、
サロン管理カテゴリの業務システムです。

**これは以下ではありません。**

- 特定の既存サービスのクローンや模倣
- 既存サービスの画面デザイン・配色・文言・アイコン・HTML の複製物
- 既存サービスの非公開 API や内部仕様を利用したもの

本プロジェクトでは、既存サービスへの不正アクセス、スクレイピング、
リバースエンジニアリングを一切行っていません。
外部サービス連携は、正式な API 契約・OAuth・Webhook・
利用者自身が正当に取得した CSV の取り込みのみを前提としています。

デモデータはすべて架空です。実在の店舗・スタッフ・顧客は含まれません。
連絡先には予約済みドメイン `.invalid` と `090-0000-xxxx` の番号のみを使用しており、
実在の誰にも到達しません。

### 配置について

このディレクトリ `salonflow/` は、`yakiniku-senri` リポジトリ内の
**完全に独立したアプリケーション**です。リポジトリ直下の焼肉店 LP とは
コード・依存関係・ビルド・テストのいずれも共有していません。

ルートリポジトリへの変更は、ルートの `tsconfig.json` と `eslint.config.mjs` に
`salonflow/` を除外設定として追加した 2 箇所のみです。
将来 SalonFlow を独立リポジトリへ切り出す場合は、このディレクトリをそのまま移動できます。

---

## 2. 現在の実装状況

Phase 1（MVP）が動作する形で完成しています。

### 実装済み

| 領域             | 内容                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| 認証             | メール + パスワード、DB セッション、scrypt ハッシュ、ログイン失敗ロック、アイドルタイムアウト、セッション失効 |
| マルチテナント   | Organization / Brand / Store / Staff の 4 階層、テナントスコープ強制、越境テスト有り                          |
| 権限             | 17 の Permission、10 の標準ロール、店舗スコープ、項目単位マスキング                                           |
| 店舗             | 基本情報、営業時間、定休日、臨時休業、タイムゾーン、予約ルール                                                |
| スタッフ         | プロフィール、所属店舗、対応メニュー、スキル別所要時間係数、公開設定                                          |
| メニュー         | カテゴリ、価格、税区分、所要時間、準備/片付け/放置時間、オプション、必要設備                                  |
| 設備             | 席・シャンプー台・ネイルテーブル・ベッド・個室、同時利用数                                                    |
| シフト           | 日別シフト、休憩、休暇（承認制）                                                                              |
| **予約枠計算**   | 純関数エンジン。営業時間・シフト・設備・工程分割・バッファ・締切を考慮                                        |
| **重複予約防止** | PostgreSQL GiST 排他制約 + トランザクション + 冪等キー + 確定直前の再検証                                     |
| 予約台帳         | 日 / 3 日 / 週表示、スタッフ別列、工程ギャップの可視化、状態遷移、ブロック時間                                |
| 公開予約ページ   | `/booking/[storeSlug]` の 6 ステップフロー、多言語、モバイル最適化                                            |
| 顧客管理         | 一覧・検索・詳細・正規化・重複検知・統合・匿名化（削除依頼対応）                                              |
| 電子カルテ       | 業種別テンプレート、動的フィールド、閲覧監査、署名付き URL                                                    |
| 通知             | Outbox パターン、メール、idempotency key、指数バックオフ再送                                                  |
| ダッシュボード   | 当日指標、稼働率、30 日推移、経路別、メニュー別                                                               |
| 監査ログ         | 記録・閲覧画面・秘密情報の自動除去                                                                            |
| 多言語           | 日本語 / 英語（管理画面と予約画面を分離）                                                                     |
| API              | REST（公開空き枠 / 公開予約 / ファイル配信 / CSV 出力 / ジョブ）                                              |
| テスト           | 単体 153 / 結合 30（合計 183）                                                                                |

### 未実装（Phase 2 以降）

POS / 会計 UI・返金・レジ締め、在庫管理、クーポン UI、ポイント、回数券、月額会員、
キャンセル待ちの自動繰り上げ、SMS / LINE / Web Push、CSV インポート実行、
高度分析・非同期レポート、Webhook 配信、API キー、SaaS 課金、AI 機能、
パスキー / MFA / SSO、モバイルアプリ、店舗・スタッフ・メニューの編集画面。

> Phase 2 以降のテーブル（Sale / Payment / Ticket / Point / Coupon / Webhook 等）は
> **すでにスキーマに含まれています**。後からの破壊的マイグレーションを避けるためです。
> 会計・商品のデモデータも投入済みで、ダッシュボードの売上集計は実際に動作します。

---

## 3. 技術構成

| 領域           | 採用                                                                       |
| -------------- | -------------------------------------------------------------------------- |
| フレームワーク | Next.js 16.2 (App Router / React Server Components / Turbopack)            |
| 言語           | TypeScript 5（`strict` + `noUncheckedIndexedAccess`）                      |
| UI             | React 19.2 / Tailwind CSS v4 / shadcn/ui 方式の自前プリミティブ            |
| 表・グラフ     | TanStack Table / Recharts                                                  |
| バリデーション | Zod 4                                                                      |
| DB             | PostgreSQL 16（`btree_gist` 拡張が必須）                                   |
| ORM            | Prisma 6                                                                   |
| テスト         | Vitest 4（単体は純関数、結合は実 DB）                                      |
| 認証           | 自前の DB セッション（scrypt） — [ADR-0002](docs/adr/0002-session-auth.md) |
| i18n           | 自前の軽量辞書ローダー — [ADR-0005](docs/adr/0005-i18n.md)                 |
| ジョブ         | インプロセス実行 + HTTP トリガ — [ADR-0004](docs/adr/0004-jobs.md)         |

仕様書が推奨していた Auth.js / next-intl / BullMQ からの差分と、その理由・移行方針は
上記 ADR に記載しています。

---

## 4. セットアップ

### 前提

- Node.js 20.9 以上（開発は v22 で実施）
- PostgreSQL 14 以上（`btree_gist` 拡張が利用できること）
- npm 10 以上

### 手順

```bash
cd salonflow

# 1. 依存関係
npm install

# 2. 環境変数
cp .env.example .env
#    最低限 DATABASE_URL と SESSION_SECRET を設定してください。
#    SESSION_SECRET は 32 文字以上のランダム文字列である必要があります。
#    例: node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"

# 3. データベースの作成（例）
createdb salonflow

# 4. マイグレーション適用（排他制約と btree_gist 拡張を含む）
npm run db:migrate

# 5. デモデータ投入
npm run db:seed

# 6. 起動
npm run dev
```

`http://localhost:3100` を開きます。

詳細は [docs/SETUP.md](docs/SETUP.md) を参照してください。

---

## 5. デモデータ

`npm run db:seed` で以下が投入されます。**すべて架空です。**

| 種別     | 件数                                   |
| -------- | -------------------------------------- |
| 法人     | 1                                      |
| 店舗     | 2（Demo Beauty Salon 一号店 / 二号店） |
| スタッフ | 6                                      |
| 顧客     | 50                                     |
| メニュー | 20                                     |
| 予約     | 100                                    |
| カルテ   | 30                                     |
| 会計     | 50                                     |
| 商品     | 10                                     |
| 設備     | 12                                     |
| シフト   | 336                                    |

### デモ用ログイン

パスワードはすべて `DemoPassw0rd!`（`DEMO_ADMIN_PASSWORD` で変更可）。

| メールアドレス                   | ロール       | 確認できること                         |
| -------------------------------- | ------------ | -------------------------------------- |
| `owner@demo.example.invalid`     | 法人オーナー | 全機能                                 |
| `manager@demo.example.invalid`   | 店長         | 顧客 CSV 出力・監査ログが見えない      |
| `reception@demo.example.invalid` | 受付         | カルテ写真が見えない                   |
| `stylist@demo.example.invalid`   | スタッフ     | 自分の担当分のみ・連絡先がマスクされる |
| `viewer@demo.example.invalid`    | 閲覧専用     | 編集操作ができない・金額が伏せられる   |

複数のアカウントでログインし直すと、権限設計が画面にどう反映されるかを確認できます。

### 公開予約ページ

- `/booking/demo-beauty-salon-a`（即時予約制）
- `/booking/demo-beauty-salon-b`（予約リクエスト制）

---

## 6. ディレクトリ構成

仕様書 §23 の `packages/*` 構成に 1:1 対応するディレクトリ境界を、
単一 Next.js アプリ内に敷いています。将来の分割時にそのまま切り出せます。

```
salonflow/
├── prisma/
│   ├── schema.prisma          # 全モデル定義
│   ├── migrations/            # 排他制約を含む SQL
│   └── seed/                  # 架空のデモデータ
├── messages/
│   ├── admin/{ja,en}.json     # 管理画面の翻訳
│   └── booking/{ja,en}.json   # 予約画面の翻訳
├── src/
│   ├── app/
│   │   ├── admin/             # 管理画面（apps/admin 相当）
│   │   ├── booking/           # 公開予約（apps/booking 相当）
│   │   └── api/v1/            # REST API（apps/api 相当）
│   ├── components/
│   │   ├── ui/                # packages/ui 相当
│   │   ├── admin/
│   │   └── booking/
│   ├── config/                # packages/config 相当
│   ├── i18n/                  # packages/i18n 相当
│   ├── lib/                   # 純粋なユーティリティ（時刻・金額・税・正規化）
│   ├── server/
│   │   ├── api/               # 共通レスポンス形式
│   │   ├── auth/              # packages/auth 相当
│   │   ├── booking-engine/    # packages/booking-engine 相当（純関数）
│   │   ├── db/                # packages/database 相当 + テナントガード
│   │   ├── modules/           # ユースケース層
│   │   ├── notifications/     # packages/notifications 相当
│   │   ├── observability/     # packages/observability 相当
│   │   ├── permissions/       # packages/permissions 相当
│   │   ├── security/          # レート制限
│   │   └── storage/           # 署名付き URL
│   └── proxy.ts               # Next.js 16 の proxy（旧 middleware）
├── tests/
│   ├── unit/                  # DB 不要・純関数
│   ├── integration/           # 実 PostgreSQL に対して実行
│   ├── e2e/                   # Phase 2
│   └── load/                  # Phase 2
└── docs/
```

**依存方向は `app → modules → domain/infra` の一方向**です。
ドメイン層（`booking-engine`, `lib/tax`, `lib/money`, `lib/time`）は
I/O を一切行わない純関数であり、DB なしで単体テストできます。

---

## 6-b. デプロイ

最短は Docker Compose です（外部アカウント不要）。

```bash
cd salonflow
# docker-compose.yml のパスワードと SESSION_SECRET を書き換えてから
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
docker compose exec app npx tsx prisma/seed/index.ts   # デモデータ（任意）
```

Vercel・その他のホスティングを含む詳細は
[docs/operations/DEPLOYMENT.md](docs/operations/DEPLOYMENT.md) を参照してください。

**デプロイ後は必ず排他制約の存在を確認してください。** 失われていると
二重予約がエラーなく成立します（手順は DEPLOYMENT.md §4）。

---

## 7. 開発コマンド

```bash
npm run dev              # 開発サーバー（http://localhost:3100）
npm run build            # 本番ビルド
npm run start            # 本番サーバー

npm run typecheck        # tsc --noEmit
npm run lint             # ESLint
npm run format           # Prettier

npm test                 # 全テスト（単体 + 結合）
npm run test:unit        # 単体のみ（DB 不要）
npm run test:integration # 結合のみ（PostgreSQL が必要）

npm run db:migrate       # マイグレーション作成・適用（開発）
npm run db:deploy        # マイグレーション適用（本番）
npm run db:seed          # デモデータ投入（再実行可能）
npm run db:reset         # DB をリセットして再構築
```

### 結合テストの実行

結合テストは実 PostgreSQL に対して実行されます。既定の接続先は
`postgresql://salonflow:salonflow@localhost:5432/salonflow_test` です。

```bash
createdb salonflow_test
DATABASE_URL="postgresql://salonflow:salonflow@localhost:5432/salonflow_test?schema=public" \
  npx prisma migrate deploy
npm run test:integration
```

DB をモックしていないのは意図的です。二重予約防止は PostgreSQL の
排他制約が担保しており、モックでは何も証明できないためです。

---

## 8. 重要な設計判断

### 8-1. 二重予約は DB 制約で防ぐ

アプリケーション側の「この枠は空いているか」チェックだけでは、
2 つのトランザクションが互いの未コミット行を見られないため競合を検出できません。

```sql
ALTER TABLE "AppointmentStaff"
  ADD CONSTRAINT "appointment_staff_no_overlap"
  EXCLUDE USING gist (
    "staffId" WITH =,
    tstzrange("startAt", "endAt", '[)') WITH &&
  ) WHERE ("isActive");
```

- 半開区間 `[start, end)` により「10:00 終了」と「10:00 開始」は衝突しません。
- `WHERE (isActive)` の部分インデックス条件により、キャンセルは
  **行を削除せずフラグを倒すだけ**で枠を解放でき、履歴が残ります。
- 休憩・ブロック時間も同じテーブルの行として登録するため、制約 1 本で守られます。

同時 5 リクエストで 1 件だけが成立することを結合テストで検証しています。

### 8-2. 工程分割（放置時間）

カラーの「塗布 30 分 → 放置 30 分 → 仕上げ 30 分」では、
放置中スタイリストは手が空きますが、席は埋まったままです。

`buildOccupancyPlan()` はこれを
**スタッフ占有 2 ブロック + 設備占有 1 ブロック**に分解します。
予約台帳にはスタッフ列に穴が空いて見え、その 30 分に別の予約を入れられます。

### 8-3. 金額は整数、日時は UTC

- 金額はすべて最小通貨単位の整数（JPY なら 1 = 1 円）。浮動小数点は使いません。
- 日時は DB に `timestamptz`（UTC）で保存し、表示時に店舗タイムゾーンへ変換します。
  変換は `src/lib/time.ts` の関数経由でのみ行い、ホストの `TZ` に依存しません。

### 8-4. 認可はサーバー側の 3 段階

1. 認証（有効なセッションか）
2. テナントスコープ（対象の `organizationId` がセッションの法人と一致するか）
3. 権限 + 店舗スコープ

**クライアントから送られた `organizationId` / `storeId` は一切信用しません。**
セッションから導出した値のみを Repository へ渡します。

### 8-5. 通知は Outbox パターン

通知は予約作成と**同一トランザクション内**でキューに書き込み、
コミット後に送信します。「予約は失敗したのにメールだけ届く」
「予約は成功したのにメールが飛ばない」を両方防ぎます。

---

## 9. プレースホルダー（未接続の外部連携）

実サービス接続が必要な箇所は、**明示的なプレースホルダー**として実装しています。
本物の外部サービスと連携できるかのような偽装は行いません。

| 種別         | Phase 1 の挙動                                        | 本番化に必要なもの                             |
| ------------ | ----------------------------------------------------- | ---------------------------------------------- |
| メール送信   | `console` / `file` トランスポート。**実送信しません** | SMTP または送信事業者の正式契約                |
| SMS          | 未実装。呼び出すと明示的にエラー                      | SMS 事業者との契約                             |
| LINE 通知    | 未実装。呼び出すと明示的にエラー                      | LINE 公式アカウントと Messaging API の正式利用 |
| Web Push     | 未実装                                                | VAPID 鍵                                       |
| 決済         | インターフェース定義のみ                              | 決済事業者アカウントと本人確認                 |
| ストレージ   | ローカルファイルシステム + 署名付き URL               | S3 互換ストレージ                              |
| 地図         | 住所テキストのみ                                      | 地図 API の正式契約                            |
| 外部予約経路 | 値として定義するのみ                                  | 各サービスの正式 API 契約                      |
| エラー追跡   | 構造化ログを標準出力へ                                | Sentry 等の契約と DSN                          |

---

## 10. 非機能目標

以下は**初期目標値**であり、実測値ではありません。
本番相当のデータ量での負荷試験による検証が必要です。

| 指標              | 目標             |
| ----------------- | ---------------- |
| 管理画面 通常 API | p95 500ms 以下   |
| 公開空き枠 API    | p95 800ms 以下   |
| 予約確定 API      | p95 1,500ms 以下 |
| 月間稼働率        | 99.9%            |
| RPO               | 24 時間以内      |
| RTO               | 4 時間以内       |

---

## 11. 本番運用前に必要な作業

このコードベースは Phase 1 の機能要件を満たしていますが、
**そのまま本番投入できる状態ではありません。** 最低限以下が必要です。

### 必須

1. **MFA / パスキーの実装** — Phase 1 はパスワードのみ（リスク R-08）
2. **Redis + BullMQ の導入** — 現在のジョブ実行はインプロセスで、
   複数インスタンス構成では重複実行の可能性があります（リスク R-16）
3. **レート制限の外部化** — 現在はプロセスメモリ内。複数インスタンスでは
   インスタンスごとに独立した予算になります
4. **メール送信事業者の契約と SMTP アダプタの実装**
5. **オブジェクトストレージへの移行** — カルテ写真をローカル FS に置いたままにしない
6. **バックアップと PITR の設定・復旧演習** — [docs/operations/BACKUP_RESTORE.md](docs/operations/BACKUP_RESTORE.md)
7. **監視・アラート・エラー追跡の接続**
8. **負荷試験** — 人気時間帯の同時予約、空き枠検索、大規模 CSV 出力
9. **セキュリティテスト** — テナント越境・IDOR・権限昇格・CSRF・XSS の外部検証
10. **法務確認** — 次節および [docs/legal/LEGAL_REVIEW.md](docs/legal/LEGAL_REVIEW.md)

### 推奨

- Content Security Policy の `unsafe-inline` 除去（nonce 方式への移行）
- 保存データの暗号化（カルテ写真・顧客連絡先）
- データ保持期間の自動削除ジョブ
- 監査ログの長期保存基盤（改ざん防止）
- ステージング環境と本番同等データでのリハーサル

---

## 12. 法務確認が必要な項目

**本プロジェクトは法的結論を出していません。** 以下は専門家の確認が必要です。
詳細と確認観点は [docs/legal/LEGAL_REVIEW.md](docs/legal/LEGAL_REVIEW.md) に整理しています。

| 分野               | 主な論点                                               | 相談先 |
| ------------------ | ------------------------------------------------------ | ------ |
| 個人情報保護法     | 要配慮個人情報の該当性、同意取得、越境移転、委託先管理 | 弁護士 |
| 特定電子メール法   | 一斉配信のオプトイン、表示義務、送信者情報             | 弁護士 |
| 特定商取引法       | キャンセル料、前払、表示義務                           | 弁護士 |
| 電子帳簿保存法     | 会計データの保存要件、検索要件                         | 税理士 |
| 消費税・インボイス | 端数処理、税区分、適格請求書の記載事項                 | 税理士 |
| 資金決済法         | 回数券・ポイント・前払式支払手段の該当性、供託義務     | 弁護士 |
| 労働関連法令       | 勤怠・打刻・労働時間管理（Phase 2 で実装予定）         | 社労士 |
| 商標               | 製品名「SalonFlow」の使用可否                          | 弁理士 |

**労務管理機能**（シフト・勤怠）は、法令対応の確認が必要です。
Phase 1 では打刻機能を実装していません。

**税務・インボイス対応**の最終確認には、税理士等の専門家による確認が必要です。

**回数券・ポイント・月額会員**は資金決済法の規制に関わる可能性があるため、
Phase 1 では販売機能を実装していません（データモデルのみ用意）。

---

## 13. ドキュメント

| ファイル                                                                     | 内容                                                                                |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [docs/PHASE0_DESIGN.md](docs/PHASE0_DESIGN.md)                               | **Phase 0 設計資料**（ER 図・権限マトリクス・シーケンス図・リスク一覧・未確定事項） |
| [docs/SETUP.md](docs/SETUP.md)                                               | 環境構築手順                                                                        |
| [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md)       | アーキテクチャ詳細                                                                  |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md)                                     | 全モデル定義                                                                        |
| [docs/PERMISSIONS.md](docs/PERMISSIONS.md)                                   | 権限マトリクス                                                                      |
| [docs/api/API.md](docs/api/API.md)                                           | API 一覧と共通仕様                                                                  |
| [docs/api/openapi.yaml](docs/api/openapi.yaml)                               | OpenAPI 3.1 定義                                                                    |
| [docs/security/SECURITY.md](docs/security/SECURITY.md)                       | セキュリティ設計                                                                    |
| [docs/security/PRIVACY.md](docs/security/PRIVACY.md)                         | 個人情報の取り扱い                                                                  |
| [docs/operations/DEPLOYMENT.md](docs/operations/DEPLOYMENT.md)               | **デプロイ手順**（Docker Compose / Vercel / 任意の Node ホスティング）              |
| [docs/operations/OPERATIONS.md](docs/operations/OPERATIONS.md)               | 運用手順                                                                            |
| [docs/operations/BACKUP_RESTORE.md](docs/operations/BACKUP_RESTORE.md)       | バックアップと復旧                                                                  |
| [docs/operations/INCIDENT_RESPONSE.md](docs/operations/INCIDENT_RESPONSE.md) | インシデント対応                                                                    |
| [docs/legal/LEGAL_REVIEW.md](docs/legal/LEGAL_REVIEW.md)                     | 法務確認項目                                                                        |
| [docs/MIGRATION.md](docs/MIGRATION.md)                                       | マイグレーション方針                                                                |
| [docs/adr/](docs/adr/)                                                       | アーキテクチャ決定記録                                                              |
| [CHANGELOG.md](CHANGELOG.md)                                                 | 変更履歴                                                                            |

---

## ライセンス / 権利

本コードは本プロジェクトの成果物です。デモデータに含まれる名称・住所・
連絡先はすべて架空であり、実在の個人・団体とは一切関係ありません。
