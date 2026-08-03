# バックアップと復旧

---

## 1. 目標

| 指標 | 目標 | 意味 |
| --- | --- | --- |
| RPO | 24 時間以内 | 最大 24 時間分のデータ損失を許容 |
| RTO | 4 時間以内 | 障害検知から復旧完了まで |

**これは初期目標であり、実測値ではありません。** 復旧演習で検証してください。

RPO 24 時間は「日次バックアップのみ」を意味します。
サロンにとって 1 日分の予約が消えることは営業停止に近い影響があるため、
本番では PITR（Point-in-Time Recovery）の導入を強く推奨します。

---

## 2. バックアップ対象

| 対象 | 内容 | 重要度 |
| --- | --- | --- |
| PostgreSQL | 全データ | **最重要** |
| オブジェクトストレージ | カルテ写真 | **最重要**（再取得不可能） |
| 環境変数 | `SESSION_SECRET` ほか | 最重要（秘密管理サービスで） |
| マイグレーション履歴 | `prisma/migrations/` | Git で管理済み |

`SESSION_SECRET` を失うと、**全セッションが無効化され、
発行済みの署名付き URL がすべて失効**します。
DB を復旧しても、この値が違えば運用は再開できません。

---

## 3. バックアップ手順

### 論理バックアップ（日次）

```bash
pg_dump --format=custom --no-owner --no-acl \
  --file="salonflow-$(date +%Y%m%d).dump" "$DATABASE_URL"
```

### PITR（推奨）

マネージド PostgreSQL（Neon / Supabase / RDS）では、
サービス側の PITR 機能を有効化してください。保持期間は最低 7 日を推奨します。

### オブジェクトストレージ

バージョニングとクロスリージョンレプリケーションを有効化してください。
カルテ写真は再取得できません。

---

## 4. 復旧手順

### 4-1. 全損からの復旧

```bash
# 1. データベースを作成
createdb salonflow_restored

# 2. 拡張を事前作成（restore 前に必要）
psql -d salonflow_restored -c "CREATE EXTENSION IF NOT EXISTS btree_gist;"

# 3. リストア
pg_restore --dbname=salonflow_restored --no-owner --no-acl \
  salonflow-20260803.dump

# 4. 排他制約の存在を確認（最重要）
psql -d salonflow_restored -c "
  SELECT conname FROM pg_constraint
  WHERE conname IN ('appointment_staff_no_overlap','appointment_resource_no_overlap');"

# 5. マイグレーション状態を確認
DATABASE_URL="…salonflow_restored" npx prisma migrate status

# 6. 差分があれば適用
DATABASE_URL="…salonflow_restored" npx prisma migrate deploy
```

**ステップ 4 を省略しないでください。** 排他制約が失われた状態で運用を再開すると、
重複予約が静かに発生します。

### 4-2. 部分復旧（誤操作からの回復）

本システムは論理削除を基本としているため、多くの誤操作は DB 上で回復できます。

```sql
-- 誤って削除した顧客の復旧
UPDATE "Customer" SET "deletedAt" = NULL WHERE id = '…';

-- 誤ってキャンセルした予約の枠を復活（競合に注意）
UPDATE "AppointmentStaff" SET "isActive" = true WHERE "appointmentId" = '…';
```

2 番目のクエリは**排他制約に弾かれる可能性があります**。
その時間帯に別の予約が入っていれば復活できません。その場合は
`AppointmentStatusHistory` から経緯を確認し、顧客と調整してください。

顧客統合の取り消しは `CustomerMergeHistory.sourceSnapshot` から復元できます。

---

## 5. 復旧演習

**月次で実施してください。** 演習していないバックアップは、
バックアップではなく願望です。

### チェックリスト

- [ ] 最新のダンプから空の DB へリストアできる
- [ ] `btree_gist` 拡張が存在する
- [ ] 排他制約が 2 つとも存在する
- [ ] `prisma migrate status` が最新である
- [ ] アプリが起動し、ログインできる
- [ ] 予約台帳が正しく描画される
- [ ] 二重予約が拒否される（同じ枠へ 2 回予約を試す）
- [ ] カルテ写真が表示される（ストレージのリストアも含む）
- [ ] 所要時間を記録し、RTO 目標と比較する

---

## 6. データ保持

| データ | 保持期間 | 状態 |
| --- | --- | --- |
| バックアップ | 日次 30 日 / 月次 12 ヶ月 | 運用側で設定 |
| 監査ログ | プラン依存（90 日〜7 年） | 自動削除は未実装 |
| 論理削除データ | 30 日後に完全削除 | **未実装** |

会計データには法定保存期間があります（電子帳簿保存法、要税理士確認）。
バックアップの保持期間もこれに合わせる必要があります。
