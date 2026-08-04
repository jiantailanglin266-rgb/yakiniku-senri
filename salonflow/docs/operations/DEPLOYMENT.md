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

## 0-b. どの方式を選ぶか

| 方式 | 向いている場面 | 商用利用 |
| --- | --- | --- |
| **A. Docker Compose**（§1） | 自前サーバー・VPS・オンプレ。1 台で完結 | 可 |
| **A′. Oracle Cloud Always Free** | クライアント提供を月額ゼロで運用したい | 可 |
| **B. Vercel + Neon**（§2） | 自分用の検証・デモを最短で公開したい | **要確認（下記）** |
| **C. 任意の Node.js ホスティング**（§3） | 既存の実行環境がある | 可 |

**クライアントへ提供する場合は方式 A または A′ を選んでください。**
Vercel の Hobby プランは商用利用を許可していません（§2 冒頭）。

Oracle Cloud Always Free の手順は独立した文書にまとめてあります。
2 段階のファイアウォールなど、このプラットフォーム固有の詰まりどころが
あるためです。

→ [DEPLOY_ORACLE_CLOUD.md](DEPLOY_ORACLE_CLOUD.md)

---

## 1. 方式 A：Docker Compose（自前サーバー・最短）

VPS やオンプレのサーバー 1 台で完結します。外部アカウントは不要です。

```bash
git clone https://github.com/jiantailanglin266-rgb/yakiniku-senri.git
cd yakiniku-senri
git checkout claude/salon-management-saas-86gcz2
cd salonflow

# 1. 設定ファイルを用意する
cp .env.production.example .env

#    SESSION_SECRET / POSTGRES_PASSWORD の生成:
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
openssl rand -base64 24

# 2. 起動
docker compose up -d --build

# 3. マイグレーション（排他制約と btree_gist を含む）
docker compose exec app npx prisma migrate deploy

# 4. 最初の法人・店舗・オーナーアカウントを作る
#    先に .env の BOOTSTRAP_* を埋めてください
docker compose run --rm bootstrap
```

`http://127.0.0.1:3100` で起動します（`APP_BIND` で変更可）。

`db` はホストに公開されません。アプリからは Compose ネットワーク越しに
届きます。自前サーバーの PostgreSQL をインターネットに晒すのは、
侵入と身代金要求の最短経路です。

**デモデータ（`prisma/seed/index.ts`）は本番では実行しないでください。**
架空の顧客と予約が入ります。`bootstrap` は法人・店舗・オーナーだけを作ります。

> 本番イメージには `src/` も `tsx` も入っていません（Next.js の standalone
> 出力を使うため）。運用 CLI は `dist/cli/*.mjs` に単一ファイルとして
> 事前バンドルされ、`node dist/cli/bootstrap.mjs` /
> `node dist/cli/check-mail.mjs` で実行します。

### HTTPS で公開する

Caddy を同梱しています。証明書の取得と更新は自動です。

```bash
# .env に DOMAIN と APP_URL を設定してから
docker compose --profile https up -d --build
```

事前に DNS の A レコードをこのサーバーへ向け、80 / 443 番を開けておいて
ください。証明書の取得には 80 番への到達が必要です。

`APP_URL` を設定しないと、通知メール内のリンクが `localhost` になり、
クロスオリジン判定も正しく働きません。

### 通知の配送

`scheduler` サービスが `JOB_INTERVAL_SECONDS`（既定 300 秒）ごとに
配送ジョブを叩きます。**これが動いていないと、予約確認とリマインドは
データベースに書かれたまま送信されません。**

```bash
docker compose logs -f scheduler
```

ジョブトークンは `SESSION_SECRET` から導出されるため、別途の秘密情報は
不要です。

---

## 2. 方式 B：Vercel + Neon

自分用の検証やデモを最短で公開する方式です。所要 15〜20 分。

> **クライアントへ提供する用途では、無料枠のまま使わないでください。**
>
> - Vercel の **Hobby プランは商用利用を許可していません**。クライアント提供は
>   商用にあたるため、Pro プラン以上への切り替えが必要です。
> - Neon の無料枠は使用量の上限に達すると**停止**します。予約システムが
>   月末に止まると、顧客は予約できず、店舗は台帳を開けません。
>
> 費用をかけずにクライアントへ提供したい場合は方式 A′
> （[DEPLOY_ORACLE_CLOUD.md](DEPLOY_ORACLE_CLOUD.md)）を選んでください。
> 最新の料金と規約は各社の公式ページで必ず確認してください。

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
