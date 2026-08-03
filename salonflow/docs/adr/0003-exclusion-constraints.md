# ADR-0003: 重複予約は PostgreSQL の排他制約で防ぐ

- 状態: 採用
- 日付: 2026-08-03

## 背景

仕様書 §11 は重複予約防止を最重要要件とし、
「PostgreSQL exclusion constraint の検討」を挙げている。

## 決定

`AppointmentStaff` と `AppointmentResource` に GiST 排他制約を張り、
これを**唯一の確実な防波堤**とする。アプリ側のチェックは UX のための早期リターンと位置づける。

```sql
ALTER TABLE "AppointmentStaff"
  ADD CONSTRAINT "appointment_staff_no_overlap"
  EXCLUDE USING gist (
    "staffId" WITH =,
    tstzrange("startAt", "endAt", '[)') WITH &&
  ) WHERE ("isActive");
```

## 理由

アプリ側の `SELECT ... WHERE overlaps` は、**同時実行では機能しない**。

```
Tx A: SELECT → 空いている
Tx B: SELECT → 空いている   ← A の未コミット行は見えない
Tx A: INSERT → 成功
Tx B: INSERT → 成功         ← 二重予約成立
```

排他制約は Tx B を Tx A のコミットまでブロックし、その後 `23P01` で拒否する。
これは DB のインデックス層で行われるため、アプリの実装ミスで迂回できない。

## 設計上の選択

### 半開区間 `[start, end)`

「10:00 終了」と「10:00 開始」を衝突させないため。閉区間だと連続予約が組めない。

### 生成列ではなく式で制約を張る

`tstzrange("startAt","endAt",'[)')` を制約式に直接書く。
STORED 生成列を足すと Prisma のスキーマ管理と噛み合わない。

### `WHERE (isActive)` の部分制約

キャンセル時に行を削除せずフラグを倒すだけで枠が解放される。
履歴（誰がいつ何を予約していたか）が残り、無断キャンセル回数の集計にも使える。

### 予約に紐づかない占有行

`appointmentId` を nullable にし、休憩・ブロック時間も同じテーブルへ入れる。
制約 1 本で「ブロック中は予約できない」が保証される。

## 帰結

### 良い点

- 実装ミスで迂回できない保証。
- 同時 5 リクエストで 1 件のみ成立することをテストで確認済み。

### 悪い点

- **PostgreSQL 依存**。排他制約を持たない DB へは移行できない。
- Prisma のスキーマに制約が現れないため、マイグレーション SQL を人が保守する。
- 制約違反が Prisma の型付きエラーにならず、`isOverlapViolation()` で
  ドライバのコードと制約名の両方を見て判別している。
