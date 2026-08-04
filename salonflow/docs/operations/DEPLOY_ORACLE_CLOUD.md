# Oracle Cloud Always Free へのデプロイ

クライアント提供を前提に、月額費用ゼロで SalonFlow を運用する手順です。

> **先に読んでください。**
> Always Free は SLA がなく、条件が予告なく変わります。実際に 2026 年 6 月、
> ARM の無料枠が 4 OCPU/24GB から 2 OCPU/12GB へ**予告なく半減**しました。
> クライアントのデータを預かる以上、§8 のバックアップと §10 の契約上の注意は
> 省略しないでください。

---

## 0. 全体像

```
                    インターネット
                          │
                    ┌─────▼─────┐
                    │   Caddy   │  :80 / :443  自動TLS
                    └─────┬─────┘
                          │
   ┌──────────────────────┼──────────────────────┐
   │  Oracle Cloud VM (Ampere A1 / Ubuntu)        │
   │                      │                       │
   │   ┌──────────┐  ┌────▼─────┐  ┌───────────┐ │
   │   │scheduler │─▶│   app    │─▶│PostgreSQL │ │
   │   │(通知配送) │  │Next.js 16│  │    16     │ │
   │   └──────────┘  └──────────┘  └─────┬─────┘ │
   │                                      │       │
   │                              ┌───────▼─────┐ │
   │                              │ backups/    │ │  cron 日次
   │                              └───────┬─────┘ │
   └──────────────────────────────────────┼───────┘
                                          │
                                   別の場所へ複製（必須）
```

すべて 1 台の VM に載ります。外部の有料サービスは使いません。

---

## 1. インスタンスを作る

### 1-1. 作成

Oracle Cloud にサインアップ後、**Compute → Instances → Create Instance**。

| 項目 | 値 |
| --- | --- |
| Image | **Ubuntu 24.04** （Oracle Linux でも可） |
| Shape | **VM.Standard.A1.Flex**（Ampere ARM） |
| OCPU / Memory | **2 OCPU / 12 GB**（Always Free の上限） |
| Boot volume | 50 GB（Always Free は合計 200 GB まで） |
| SSH key | 手元の公開鍵を登録 |

### 1-2. 「Out of host capacity」が出る場合

ARM インスタンスは慢性的に在庫不足で、これが**最初の関門**です。

- 別の Availability Domain（AD-1 / AD-2 / AD-3）を試す
- 時間帯を変えて再試行する（深夜〜早朝が通りやすい傾向）
- リージョンを変える（ただしホームリージョンは後から変更できません）

**AMD の Micro インスタンス（VM.Standard.E2.1.Micro）は 1 GB メモリしかなく、
`next build` がメモリ不足で失敗します。** どうしても ARM が取れない場合は §11 を参照してください。

### 1-3. 接続

```bash
ssh -i ~/.ssh/your-key ubuntu@<パブリックIP>
```

---

## 2. ネットワークを開ける（2 か所あります）

**ここが Oracle Cloud で最も多い詰まりどころです。** 他のクラウドと違い、
**2 段階のファイアウォール**があり、片方だけ開けても通信できません。

### 2-1. Security List（クラウド側）

**Networking → Virtual Cloud Networks → （VCN）→ Subnets → （サブネット）→ Security Lists**

Ingress Rules に以下を追加します。

| Source | Protocol | Port | 用途 |
| --- | --- | --- | --- |
| `0.0.0.0/0` | TCP | 80 | HTTP（証明書取得と HTTPS への転送） |
| `0.0.0.0/0` | TCP | 443 | HTTPS |

### 2-2. VM 内の iptables（OS 側）

**Oracle の Ubuntu / Oracle Linux イメージは、既定で 22 番以外をすべて拒否します。**
Security List だけ開けても繋がらないのはこれが原因です。

```bash
# 現状を確認（REJECT 行が並んでいるはずです）
sudo iptables -L INPUT -n --line-numbers

# 80 / 443 を許可（既存の REJECT 行より前に挿入する必要があります）
sudo iptables -I INPUT 6 -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 7 -p tcp --dport 443 -j ACCEPT

# 再起動後も残るように永続化
sudo apt-get update && sudo apt-get install -y iptables-persistent
sudo netfilter-persistent save
```

> `-I INPUT 6` の番号は環境によって変わります。`--line-numbers` で
> `REJECT all` の行番号を確認し、**その手前**に挿入してください。
> 末尾に `-A` で追加すると REJECT が先に評価され、効きません。

Oracle Linux の場合は firewalld です。

```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 2-3. 疎通確認

```bash
# VM 内から
curl -sI http://localhost

# 手元から（アプリ起動後）
curl -sI http://<パブリックIP>
```

---

## 3. Docker を入れる

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo tee /etc/apt/keyrings/docker.asc > /dev/null
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# sudo なしで docker を使えるようにする（再ログインが必要）
sudo usermod -aG docker $USER
newgrp docker

docker --version && docker compose version
```

### swap を追加する

12 GB あれば `next build` は通りますが、ビルド中の一時的なピークに備えて
swap を用意しておくと安全です。

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

---

## 4. ドメインを向ける

証明書の自動取得には**独自ドメインが必須**です（IP アドレスには発行できません）。

DNS の A レコードをインスタンスのパブリック IP へ向けます。

```
salon.example.com.   A   <パブリックIP>
```

反映を確認してから次へ進んでください。

```bash
dig +short salon.example.com
```

> ドメインは年 1,000〜1,500 円程度かかります。ここだけは無料になりません。
> 費用をかけたくない場合は、無料の DDNS サービス（DuckDNS など）でも
> Let's Encrypt の証明書は取得できます。

---

## 5. アプリを配置する

```bash
git clone https://github.com/jiantailanglin266-rgb/yakiniku-senri.git
cd yakiniku-senri
git checkout claude/salon-management-saas-86gcz2
cd salonflow

cp .env.production.example .env
nano .env
```

最低限、次の 4 つを設定します。

```bash
# 生成コマンド
openssl rand -base64 24                                                    # POSTGRES_PASSWORD
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"  # SESSION_SECRET
```

| 変数 | 値 |
| --- | --- |
| `POSTGRES_PASSWORD` | 上記で生成 |
| `SESSION_SECRET` | 上記で生成（32文字以上） |
| `DOMAIN` | `salon.example.com` |
| `APP_URL` | `https://salon.example.com` |

`SESSION_SECRET` は**必ず控えておいてください**。失うと全セッションが無効になり、
カルテ写真の署名付き URL もすべて失効します。

### 起動

```bash
# ARM 上でのビルドは 5〜10 分ほどかかります
docker compose --profile https up -d --build

# 進捗を見る
docker compose logs -f app
```

### マイグレーションと初期テナント作成

まず `.env` の `BOOTSTRAP_*` を埋めます（`.env.production.example` 参照）。

```bash
docker compose exec app npx prisma migrate deploy

docker compose run --rm bootstrap
```

`bootstrap` は専用プロファイルの使い捨てサービスです。常駐する `app` コンテナに
初期パスワードを持たせないために分けてあります。何度実行しても、既存の法人が
あれば何もせず終了します。

オーナーがログインできたら、`.env` から `BOOTSTRAP_ADMIN_PASSWORD` を削除して
ください。サーバー上に平文パスワードを残す理由はありません。

> **デモデータ（`db:seed`）は本番では実行しないでください。** 架空の顧客 50 名と
> 予約 100 件が入ります。`bootstrap` は法人・店舗・オーナーだけを作ります。

> 本番イメージには `src/` も `tsx` も入っていません（standalone 出力のため）。
> CLI は `dist/cli/*.mjs` に単一ファイルとして事前バンドルされており、
> `node dist/cli/bootstrap.mjs` / `node dist/cli/check-mail.mjs` で実行します。

---

## 6. 確認する

```bash
# 1. 排他制約 — これが無いと二重予約が静かに成立します。最優先で確認
docker compose exec db psql -U salonflow -d salonflow -c \
  "SELECT conname FROM pg_constraint WHERE conname LIKE '%no_overlap%';"
#    → 2 行返ること

# 2. HTTPS
curl -sI https://salon.example.com | head -1
#    → HTTP/2 200

# 3. 未ログインで管理画面がリダイレクトされるか
curl -s -o /dev/null -w "%{http_code}\n" https://salon.example.com/admin
#    → 307

# 4. セキュリティヘッダ
curl -sI https://salon.example.com | grep -iE "content-security|strict-transport"

# 5. 証明書
echo | openssl s_client -connect salon.example.com:443 2>/dev/null | \
  openssl x509 -noout -dates
```

ブラウザで `https://salon.example.com/signin` を開き、bootstrap で作った
アカウントでログインできることを確認します。

### 証明書が取得できないとき

```bash
docker compose logs caddy | grep -i error
```

ほぼ必ず以下のどれかです。

| 原因 | 確認方法 |
| --- | --- |
| **iptables を開けていない**（最多） | `sudo iptables -L INPUT -n --line-numbers` |
| Security List を開けていない | OCI コンソール |
| DNS が未反映 | `dig +short salon.example.com` |
| `DOMAIN` の綴り違い | `.env` |

---

## 7. メール送信を設定する

**ここを飛ばすと、予約確認もリマインドも顧客に届きません。**
既定は `console`（ログに出すだけ）です。

### 7-1. 送信事業者を用意する

無料枠で使えるもの（いずれも商用可）:

| 事業者 | 無料枠 | 注意 |
| --- | --- | --- |
| Brevo | 300 通/日 | **メール本文に事業者ロゴが入ります**（有料で除去） |
| Resend | 3,000 通/月・100 通/日 | 独自ドメインの認証が必要 |

1 店舗の予約確認とリマインドなら、どちらも無料枠で足ります。

> **Oracle Cloud は既定で 25 番ポートを遮断しています。**
> 587 または 465 を使ってください。

### 7-2. 設定

`.env` を編集します。

```bash
MAIL_TRANSPORT=smtp
MAIL_FROM=SalonFlow <no-reply@salon.example.com>
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=<事業者の指定値>
SMTP_PASSWORD=<APIキー>
```

```bash
docker compose up -d app scheduler

# 接続と認証だけ確認
docker compose exec app node dist/cli/check-mail.mjs

# 実際に 1 通送ってみる
docker compose exec app node dist/cli/check-mail.mjs あなたのアドレス@example.com
```

### 7-3. 迷惑メール対策

送信元ドメインに **SPF / DKIM / DMARC** を設定してください。
未設定だと Gmail などで迷惑メール扱いになり、**リマインドが届きません**。
設定方法は各事業者のダッシュボードに表示されます。

---

## 8. バックアップ（省略不可）

マネージド DB ではないので、**バックアップを取るのはあなたです。**

### 8-1. 日次バックアップ

```bash
cd ~/yakiniku-senri/salonflow
mkdir -p backups

# 手動で 1 回試す
docker compose exec -T db pg_dump --format=custom --no-owner --no-acl \
  -U salonflow salonflow > backups/manual-$(date -u +%Y%m%d).dump
ls -lh backups/
```

cron に登録します。

```bash
crontab -e
```

```
15 3 * * * cd /home/ubuntu/yakiniku-senri/salonflow && docker compose exec -T db pg_dump --format=custom --no-owner --no-acl -U salonflow salonflow > backups/salonflow-$(date -u +\%Y\%m\%dT\%H\%M\%SZ).dump 2>> backups/backup.log && find backups -name 'salonflow-*.dump' -mtime +30 -delete
```

### 8-2. サーバー外へ複製する（これが本体）

**同じサーバーの中にあるバックアップは、サーバーが失われたら一緒に消えます。**
Always Free のインスタンスは、規約違反の誤検知やリソース回収で消える可能性があります。

```bash
# rclone で外部ストレージへ同期する例（Google Drive など無料枠でも可）
sudo apt-get install -y rclone
rclone config          # 対話設定
rclone sync backups/ remote:salonflow-backups/
```

cron の末尾に `&& rclone sync backups/ remote:salonflow-backups/` を追加します。

### 8-3. 復旧を試す（月1回）

**演習していないバックアップは、バックアップではなく願望です。**

```bash
# 検証用DBへ復元
docker compose exec -T db createdb -U salonflow restore_test
cat backups/salonflow-XXXX.dump | \
  docker compose exec -T db pg_restore -U salonflow -d restore_test --no-owner --no-acl

# 排他制約が復元されているか（最重要）
docker compose exec db psql -U salonflow -d restore_test -c \
  "SELECT conname FROM pg_constraint WHERE conname LIKE '%no_overlap%';"

# 件数を確認
docker compose exec db psql -U salonflow -d restore_test -c \
  'SELECT count(*) FROM "Appointment";'

docker compose exec db dropdb -U salonflow restore_test
```

---

## 9. 運用

### 更新

```bash
cd ~/yakiniku-senri && git pull
cd salonflow
docker compose --profile https up -d --build
docker compose exec app npx prisma migrate deploy
```

### ログ

```bash
docker compose logs -f app          # アプリ
docker compose logs -f scheduler    # 通知配送
docker compose logs caddy           # TLS / アクセス
```

### 通知が滞留していないか

```bash
docker compose exec db psql -U salonflow -d salonflow -c \
  'SELECT status, count(*), min("scheduledAt") FROM "Notification" GROUP BY status;'
```

`pending` が 5 分以上滞留していたら scheduler が動いていません。

### ディスク

```bash
df -h
docker system df
docker system prune -a --volumes   # 古いイメージの削除（ボリュームに注意）
```

### 自動起動

`docker-compose.yml` で `restart: unless-stopped` を指定しているため、
VM の再起動後は自動で復帰します。念のため確認してください。

```bash
sudo reboot
# 再接続後
docker compose ps
```

---

## 10. クライアント提供にあたっての注意

無料枠での運用は、技術的には問題なく動きます。**契約上の問題が残ります。**

| リスク | 内容 |
| --- | --- |
| **SLA が無い** | 障害時に Oracle は復旧を約束しません。連絡窓口も実質ありません |
| **条件が変わる** | 2026年6月に ARM 枠が予告なく半減しました |
| **アカウント停止** | 誤検知でも異議申立の手段が限られます |
| **データ消失** | §8 のオフサイト複製が唯一の保険です |

### 契約書に明記すべきこと

- 無償のインフラ上で運用しており、可用性の保証がないこと
- 障害・データ消失時の責任範囲
- バックアップの取得頻度と復旧目標（RPO 24時間 / RTO 4時間 が現実的な線）
- インフラ提供者の都合でサービスが停止しうること
- 有償インフラへ移行する場合の条件と費用

**この 5 点を書面にしないまま提供するのは避けてください。**
サロンにとって予約データの消失は営業停止と同義であり、
「無料だったので」は通用しません。

### 実顧客のデータを扱う前に

このシステムは Phase 1（MVP）です。以下は未実装です。

| # | 項目 | 影響 |
| --- | --- | --- |
| 1 | MFA / パスワードリセット | パスワードのみに依存 |
| 2 | 保存データの暗号化 | ディスク流出時に平文 |
| 3 | 保持期間の自動削除 | 不要データが滞留 |
| 4 | 規約・プライバシーポリシー | **未作成**。同意チェックのリンク先が存在しません |

特に 4 は、顧客の個人情報を受け付ける前に必須です。
[../legal/LEGAL_REVIEW.md](../legal/LEGAL_REVIEW.md) を参照してください。

---

## 11. ARM が確保できない場合

### 選択肢 A：手元でビルドしてイメージを転送する

AMD Micro（1 GB）でも、ビルド済みイメージなら動く可能性があります。

```bash
# 手元（ARM Mac など）でビルド
docker build --platform linux/amd64 -t salonflow:latest .
docker save salonflow:latest | gzip > salonflow.tar.gz
scp salonflow.tar.gz ubuntu@<IP>:~

# サーバー側
gunzip -c salonflow.tar.gz | docker load
```

ただし 1 GB では PostgreSQL とアプリの同居が厳しく、swap 頼みになります。
**クライアント提供には勧めません。**

### 選択肢 B：国内 VPS（月 800〜1,500 円）

さくらの VPS / ConoHa / Xserver VPS などで、同じ `docker compose` がそのまま動きます。
SLA があり、サポート窓口があり、レイテンシも国内向けに有利です。

**月 1,000 円をクライアントに請求できるなら、こちらを強く勧めます。**
Always Free で節約できる金額に対して、負うリスクが見合いません。
