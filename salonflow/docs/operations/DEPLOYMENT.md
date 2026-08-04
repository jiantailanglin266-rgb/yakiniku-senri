# デプロイ手順

SalonFlow は Node.js アプリと PostgreSQL の 2 つだけで動きます。
Redis・オブジェクトストレージ・メール事業者は Phase 1 では必須ではありません
（ただし本番運用には必要 — §6）。

---

## 0. 必要なもの

| #   | 項目                        | 備考                                                  |
| --- | --------------------------- | ----------------------------------------------------- |
| 1   | PostgreSQL 14 以上          | **`btree_gist` 拡張が使えること**。重複予約防止に必須 |
| 2   | Node.js 20.9 以上の実行環境 | またはコンテナが動く環境                              |
| 3   | `SESSION_SECRET`            | 32 文字以上のランダム文字列                           |
| 4   | 公開ドメイン（任意）        | `APP_URL` に設定。通知内の絶対 URL と CSRF 判定に使用 |

`btree_gist` は Neon / Supabase / RDS / Cloud SQL いずれでも利用できます。

---

## 1. 方式 A：Docker Compose（自前サーバー・最短）

VPS やオンプレのサーバー 1 台で完結します。外部アカウントは不要です。

```bash
git clone https://github.com/jiantailanglin266-rgb/yakiniku-senri.git
cd yakiniku-senri/salonflow
git checkout claude/salon-management-saas-86gcz2

# 1. docker-compose.yml のパスワードと SESSION_SECRET を書き換える
#    SESSION_SECRET の生成:
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"

# 2. 起動
docker compose up -d --build

# 3. マイグレーション（排他制約と btree_gist を含む）
docker compose exec app npx prisma migrate deploy

# 4. デモデータ（任意。本番では実行しない）
docker compose exec app npx tsx prisma/seed/index.ts
```

`http://<サーバー>:3100` で起動します。

### 公開する場合

前段にリバースプロキシ（Nginx / Caddy）を置き、TLS を終端してください。
`docker-compose.yml` の `db` の `ports` は削除します。

```
# Caddy の例
salon.example.com {
    reverse_proxy localhost:3100
}
```

そのうえで `APP_URL=https://salon.example.com` を設定します。
これを設定しないと、通知メール内のリンクが `localhost` になり、
クロスオリジン判定も正しく働きません。

---

## 2. 方式 B：Vercel + Neon

無料枠だけで公開できます。所要 15〜20 分。

### 2-1. Neon でデータベースを作る

1. <https://neon.tech> にサインアップし、プロジェクトを作成
2. リージョンは利用者に近い場所（日本なら `Asia Pacific (Singapore)` など）
3. **Connection string を 2 種類**控える（ダッシュボードの Connection Details）
   - **Pooled**（`-pooler` を含む）→ `DATABASE_URL` に使う
   - **Direct**（`-pooler` を含まない）→ `DIRECT_DATABASE_URL` に使う
4. SQL Editor で拡張を作成する

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

> **なぜ 2 種類必要か**: 通常のクエリはプーラー経由が望ましい一方、
> マイグレーションが含む DDL はトランザクションモードのプーラーを通せません。
> Prisma はこの 2 つを自動的に使い分けます（`prisma/schema.prisma` の `directUrl`）。

### 2-2. Vercel にインポートする

1. <https://vercel.com> にサインアップし、**Add New → Project**
2. GitHub の `jiantailanglin266-rgb/yakiniku-senri` をインポート
3. **Root Directory に `salonflow` を指定する**（ここが唯一の必須設定）
   - Import 画面の「Root Directory」の **Edit** から `salonflow` を選ぶ
   - このリポジトリはルートに別アプリ（焼肉店 LP）を持つため、
     指定しないとそちらがビルドされます
4. Framework Preset は `Next.js` が自動検出されます
5. **Build Command は変更不要**
   - `package.json` に `vercel-build` を定義済みで、Vercel はこれを優先します
   - 中身: `prisma generate && prisma migrate deploy && next build`
   - つまり**デプロイのたびにマイグレーションが自動適用**されます

### 2-3. 環境変数

Import 画面の Environment Variables に以下を入れます（Production / Preview 両方）。

| 変数                  | 値                                    | 必須 |
| --------------------- | ------------------------------------- | :--: |
| `DATABASE_URL`        | Neon の **Pooled** 接続文字列         |  ○   |
| `DIRECT_DATABASE_URL` | Neon の **Direct** 接続文字列         |  ○   |
| `SESSION_SECRET`      | 32 文字以上のランダム文字列           |  ○   |
| `APP_URL`             | `https://<プロジェクト名>.vercel.app` |  ○   |
| `DEMO_MODE`           | `true`（デモとして公開する場合）      |      |
| `PRODUCT_NAME`        | `SalonFlow`                           |      |
| `DEFAULT_TIMEZONE`    | `Asia/Tokyo`                          |      |
| `MAIL_TRANSPORT`      | `console`（実送信しない）             |      |
| `LOG_LEVEL`           | `info`                                |      |

`SESSION_SECRET` の生成:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

`APP_URL` はデプロイ前にドメインが確定していないため、
一度デプロイして URL が決まってから設定・再デプロイでも構いません。

### 2-4. デモデータを入れる

初回デプロイ後、手元から実行します（Vercel 上では実行しません）。

```bash
cd salonflow
npm install
DATABASE_URL="<Neon の Direct 接続文字列>" \
DIRECT_DATABASE_URL="<Neon の Direct 接続文字列>" \
  npx tsx prisma/seed/index.ts
```

実行するとログイン用アカウントと公開予約ページの URL が表示されます。

### 2-5. 詰まりやすい箇所

| 症状                                      | 原因と対処                                                                          |
| ----------------------------------------- | ----------------------------------------------------------------------------------- |
| ルートの焼肉 LP がデプロイされる          | Root Directory が `salonflow` になっていない                                        |
| `Query Engine ... rhel-openssl-3.0.x`     | `binaryTargets` 設定済み。古いビルドキャッシュなら Redeploy（キャッシュ無効）で解消 |
| `extension "btree_gist" is not available` | 2-1 の 4 を実行していない                                                           |
| `prepared statement ... already exists`   | `DATABASE_URL` に Direct を入れている。Pooled に変える                              |
| マイグレーションが `P1001` で失敗         | `DIRECT_DATABASE_URL` が未設定、または Pooled を入れている                          |
| ログインできない                          | シード未実行。2-4 を実行する                                                        |
| ログイン後すぐログアウトされる            | `SESSION_SECRET` が Production と Preview で食い違っている                          |

---

## 3. 方式 C：任意の Node.js ホスティング

```bash
npm ci
npx prisma generate
npm run build
npx prisma migrate deploy
node .next/standalone/server.js   # PORT / HOSTNAME 環境変数で待受を指定
```

`.next/standalone` は `node_modules` を含む自己完結バンドルです。
`public/` と `.next/static/` は CDN に置くのが理想ですが、
同梱する場合は以下をコピーしてください。

```bash
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
```

---

## 4. デプロイ後の確認（必須）

```bash
# 1. 排他制約が存在するか — これが無いと重複予約が静かに発生します
psql "$DATABASE_URL" -c "
  SELECT conname FROM pg_constraint
  WHERE conname IN ('appointment_staff_no_overlap','appointment_resource_no_overlap');"
#   → 2 行返ること

# 2. マイグレーション状態
npx prisma migrate status
#   → Database schema is up to date!

# 3. アプリの応答
curl -sI https://<ドメイン>/ | head -1
curl -s -o /dev/null -w "%{http_code}\n" https://<ドメイン>/signin

# 4. 未ログインで管理画面がリダイレクトされるか
curl -s -o /dev/null -w "%{http_code}\n" https://<ドメイン>/admin
#   → 307

# 5. セキュリティヘッダ
curl -sI https://<ドメイン>/ | grep -iE "content-security|strict-transport|x-frame"
```

**手順 1 を省略しないでください。** リストアやマイグレーション漏れで
排他制約が失われていると、二重予約がエラーなく成立します。

---

## 5. 通知の定期実行

Phase 1 の通知配送は HTTP トリガ方式です。

```bash
# トークンは SESSION_SECRET から導出されます（本番では GET で取得できません）
node -e "console.log(require('crypto').createHash('sha256').update('jobs:notifications:'+process.env.SESSION_SECRET).digest('hex'))"
```

```
*/5 * * * * curl -fsS -X POST -H "x-job-token: $TOKEN" https://<ドメイン>/api/v1/jobs/notifications
```

Vercel の場合は Cron Jobs、その他は systemd timer / cron を使用します。

---

## 6. 本番運用の前に

このアプリは Phase 1（MVP）です。**そのまま実顧客のデータを扱える状態ではありません。**

| #   | 項目                         | 理由                                                                 |
| --- | ---------------------------- | -------------------------------------------------------------------- |
| 1   | MFA の実装                   | 認証がパスワードのみに依存（リスク R-08）                            |
| 2   | Redis の導入                 | ジョブとレート制限がプロセス内で完結しており、複数インスタンスで破綻 |
| 3   | メール事業者との契約         | 現在は実送信しない開発用トランスポート                               |
| 4   | オブジェクトストレージ       | カルテ写真をコンテナローカルに置かない                               |
| 5   | バックアップと復旧演習       | [BACKUP_RESTORE.md](BACKUP_RESTORE.md)                               |
| 6   | 監視・アラート               | [OPERATIONS.md](OPERATIONS.md) §3                                    |
| 7   | CSP の `unsafe-inline` 除去  | nonce 方式へ                                                         |
| 8   | 負荷試験・セキュリティテスト | [../../tests/load/README.md](../../tests/load/README.md)             |
| 9   | **法務確認**                 | [../legal/LEGAL_REVIEW.md](../legal/LEGAL_REVIEW.md)                 |

特に 9 は、規約・プライバシーポリシーが未作成のまま
実顧客の個人情報を受け付けることになるため、公開前に必須です。

---

## 7. デモとして公開する場合

実顧客を扱わず、機能確認のために公開するだけであれば、
上記 6 の多くは後回しにできます。ただし以下は守ってください。

- `DEMO_MODE=true` を設定する（架空データである旨のバナーが全画面に出ます）
- デモ用パスワードを既定値から変更する（`DEMO_ADMIN_PASSWORD`）
- `robots` は既に `noindex` が設定済み（架空店舗が検索結果に出ないため）
- 実在する個人の情報を入力しない
