# 環境構築手順

---

## 1. 前提

| ソフトウェア | バージョン | 備考 |
| --- | --- | --- |
| Node.js | 20.9 以上 | Next.js 16 の最低要件。開発は v22.22 で実施 |
| npm | 10 以上 | |
| PostgreSQL | 14 以上 | **`btree_gist` 拡張が利用できること**（重複予約防止に必須） |
| TypeScript | 5.1 以上 | 依存に含まれます |

`btree_gist` は PostgreSQL の contrib パッケージに含まれます。
Debian / Ubuntu では `postgresql-contrib` パッケージが必要です。
Neon / Supabase / RDS では標準で利用できます。

---

## 2. インストール

```bash
cd salonflow
npm install
```

`postinstall` で Prisma Client が生成されます。

---

## 3. データベース

### ローカル PostgreSQL

```bash
# ロールとデータベースを作成
sudo -u postgres psql -c "CREATE ROLE salonflow LOGIN PASSWORD 'salonflow';"
sudo -u postgres createdb -O salonflow salonflow
sudo -u postgres createdb -O salonflow salonflow_test   # 結合テスト用
```

`btree_gist` 拡張の作成には権限が必要です。初回マイグレーションが
`CREATE EXTENSION IF NOT EXISTS btree_gist` を実行するため、
接続ロールに拡張作成権限（またはスーパーユーザー権限）を与えるか、
あらかじめ管理者が拡張を作成しておいてください。

```bash
sudo -u postgres psql -d salonflow -c "CREATE EXTENSION IF NOT EXISTS btree_gist;"
```

### マネージド PostgreSQL

`DATABASE_URL` に接続文字列を設定します。
接続プーラー（PgBouncer 等）を経由する場合は、
マイグレーション用に直結の `DIRECT_DATABASE_URL` も設定してください。

---

## 4. 環境変数

```bash
cp .env.example .env
```

### 必須

| 変数 | 説明 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 接続文字列 |
| `SESSION_SECRET` | **32 文字以上**のランダム文字列。署名付き URL の HMAC 鍵も兼ねます |

`SESSION_SECRET` の生成：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

> `SESSION_SECRET` を変更すると、全セッションが無効化され、
> 発行済みの署名付き URL も失効します。

### 主な任意設定

| 変数 | 既定 | 説明 |
| --- | --- | --- |
| `PRODUCT_NAME` | `SalonFlow` | 製品名。画面・通知すべてに反映 |
| `APP_URL` | `http://localhost:3100` | 絶対 URL の生成と CSRF 判定に使用 |
| `DEFAULT_TIMEZONE` | `Asia/Tokyo` | 新規店舗の既定タイムゾーン |
| `MAIL_TRANSPORT` | `console` | `console` / `file` / `smtp` |
| `DEMO_MODE` | `false` | `true` でデモデータ告知バナーを表示 |
| `SESSION_TTL_SECONDS` | `43200` | セッションの絶対期限（12 時間） |
| `SESSION_IDLE_DAYS` | `7` | 無操作での失効までの日数 |
| `AUTH_MAX_FAILED_ATTEMPTS` | `5` | ロックまでのログイン失敗回数 |
| `LOG_LEVEL` | `info` | `debug` にすると SQL も出力 |

全変数は `.env.example` に説明付きで記載しています。

---

## 5. マイグレーション

```bash
npm run db:migrate    # 開発：作成 + 適用
npm run db:deploy     # 本番：適用のみ
```

初回マイグレーション `20260803185720_init` には、通常のテーブル定義に加えて
以下のカスタム SQL が含まれます。

- `CREATE EXTENSION IF NOT EXISTS btree_gist`
- `AppointmentStaff` / `AppointmentResource` への GiST 排他制約
- 時間区間・金額・評価値の CHECK 制約
- 空き枠検索用の部分インデックス

適用の確認：

```bash
psql "$DATABASE_URL" -c '\d+ "AppointmentStaff"' | grep no_overlap
```

`appointment_staff_no_overlap EXCLUDE USING gist (...)` が表示されれば成功です。

---

## 6. デモデータ

```bash
npm run db:seed
```

再実行可能です。デモ法人を削除してから作り直します。
**すべて架空のデータです。**

投入後、コンソールにログイン情報と公開予約ページの URL が表示されます。

---

## 7. 起動

```bash
npm run dev     # http://localhost:3100
```

| URL | 内容 |
| --- | --- |
| `/` | トップ（未ログイン時は店舗一覧） |
| `/signin` | 管理画面ログイン |
| `/admin` | ダッシュボード |
| `/admin/schedule` | 予約台帳 |
| `/booking/demo-beauty-salon-a` | 公開予約（即時予約制） |
| `/booking/demo-beauty-salon-b` | 公開予約（リクエスト制） |

---

## 8. テスト

```bash
npm run test:unit          # DB 不要
npm run test:integration   # PostgreSQL が必要
npm test                   # 両方
```

結合テストは既定で `salonflow_test` データベースを使用します
（`vitest.setup.ts` の既定値）。事前にマイグレーションを適用してください。

```bash
createdb salonflow_test
DATABASE_URL="postgresql://salonflow:salonflow@localhost:5432/salonflow_test?schema=public" \
  npx prisma migrate deploy
```

---

## 9. 通知の確認

Phase 1 の既定は `MAIL_TRANSPORT=console` です。**実際の送信は行いません。**

```bash
# メール本文をファイルへ書き出す
MAIL_TRANSPORT=file npm run dev
# .mailbox/ に .txt が生成されます
```

送信キューの処理はジョブエンドポイント経由です。

```bash
# 開発環境ではトークンを取得できます
TOKEN=$(curl -s localhost:3100/api/v1/jobs/notifications | jq -r .data.token)
curl -X POST -H "x-job-token: $TOKEN" localhost:3100/api/v1/jobs/notifications
```

---

## 10. 本番ビルド

```bash
npm run build
npm run start
```

ビルド前に以下がすべて通ることを確認してください。

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

---

## 11. よくある問題

| 症状 | 原因と対処 |
| --- | --- |
| `type "tstzrange" does not exist` | PostgreSQL のバージョンが古い。14 以上が必要 |
| `extension "btree_gist" is not available` | `postgresql-contrib` が未インストール |
| `permission denied to create extension` | 接続ロールに権限がない。管理者が事前に作成する |
| `Invalid environment configuration` | `.env` の必須項目が未設定。エラーに不足項目が列挙されます |
| `SESSION_SECRET must be at least 32 characters` | 文字列が短い。§4 の方法で生成する |
| 結合テストが `relation does not exist` で失敗 | テスト DB にマイグレーションが未適用（§8） |
| ルートの `npm run build` が salonflow を巻き込む | ルートの `tsconfig.json` / `eslint.config.mjs` の除外設定を確認 |
