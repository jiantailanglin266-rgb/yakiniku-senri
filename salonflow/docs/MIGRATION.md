# マイグレーション方針

---

## 1. 基本

```bash
npm run db:migrate    # 開発：スキーマ差分から SQL を生成し適用
npm run db:deploy     # 本番：既存の SQL を適用するのみ
```

本番では `migrate deploy` のみを使います。`migrate dev` は差分検出と
リセットを行うため、本番データを失う危険があります。

---

## 2. カスタム SQL を含むマイグレーション

排他制約・CHECK 制約・部分インデックスは Prisma スキーマで表現できないため、
マイグレーション SQL に手書きで追加しています。

```bash
# 1. スキーマを編集
# 2. SQL を生成（適用はしない）
npx prisma migrate dev --name <name> --create-only
# 3. 生成された migration.sql に手書き SQL を追記
# 4. 適用
npx prisma migrate dev
```

**`prisma db push` は使わないでください。** マイグレーション履歴を残さず、
カスタム SQL が消えます。

---

## 3. 排他制約に触れる変更

`AppointmentStaff` / `AppointmentResource` の `staffId`, `resourceId`,
`startAt`, `endAt`, `isActive` を変更する場合、排他制約の再作成が必要です。

```sql
ALTER TABLE "AppointmentStaff" DROP CONSTRAINT "appointment_staff_no_overlap";
-- 列の変更
ALTER TABLE "AppointmentStaff"
  ADD CONSTRAINT "appointment_staff_no_overlap"
  EXCLUDE USING gist (
    "staffId" WITH =,
    tstzrange("startAt", "endAt", '[)') WITH &&
  ) WHERE ("isActive");
```

**制約を落としている間は重複予約が発生しえます。**
メンテナンス時間帯に実施するか、既存データに重なりがないことを事前に確認してください。

制約の再作成は既存データを全件検証するため、大規模テーブルでは時間がかかります。
`ADD CONSTRAINT ... NOT VALID` は排他制約では使えません。

---

## 4. ゼロダウンタイムのための順序

破壊的変更は 3 段階に分けます。

### 列の追加

1. nullable または既定値付きで追加
2. アプリをデプロイ（新旧どちらでも動く状態）
3. バックフィル
4. NOT NULL 化

### 列の削除

1. アプリから参照を外してデプロイ
2. 数日運用して問題がないことを確認
3. 列を削除

### 列のリネーム

リネームは「追加 → 二重書き込み → バックフィル → 読み取り切替 → 削除」に分解します。
Prisma の `@map` で DB 上の名前を保ったままモデル名だけ変える方が安全な場合もあります。

---

## 5. 大規模テーブルでの注意

| 操作 | 注意 |
| --- | --- |
| `CREATE INDEX` | `CONCURRENTLY` を使う（別トランザクションが必要） |
| `ALTER TABLE ... SET NOT NULL` | 全件スキャンが走る |
| `ADD CONSTRAINT CHECK` | `NOT VALID` で追加してから `VALIDATE` |
| 排他制約の追加 | 全件検証。`CONCURRENTLY` 不可 |

想定される最大テーブルは `AppointmentStaff`、`AuditLog`、`Notification` です。

---

## 6. ロールバック

Prisma には自動ロールバックがありません。切り戻しは以下のいずれかです。

1. **前方修正**（推奨）— 打ち消すマイグレーションを新たに作る
2. **バックアップからのリストア** — データ損失を伴う

そのため、破壊的変更は §4 の段階分けで、
**各段階が単独で安全**になるようにします。

---

## 7. データ移行（外部システムから）

`ImportJob` テーブルを用意していますが、実行機能は Phase 2 です。

移行時の原則：

- **利用者自身が正当に取得したデータのみを対象とする**
- 既存サービスからの自動取得・スクレイピングは行わない
- 取り込み前にプレビューと検証を行う
- 失敗時にロールバックできる単位で処理する
- 取り込み結果を `ImportJob.errors` に行単位で記録する

---

## 8. 環境ごとの状態確認

```bash
npx prisma migrate status
```

`Database schema is up to date!` 以外が出た場合、デプロイを止めて調査してください。

リストア後は必ず以下も確認します。

```sql
SELECT conname FROM pg_constraint
WHERE conname IN ('appointment_staff_no_overlap','appointment_resource_no_overlap');
```
