# データモデル

正の定義は `prisma/schema.prisma` です。本書はその読み方と設計判断をまとめます。

---

## 1. 全体の規約

| 規約 | 内容 |
| --- | --- |
| 金額 | `Int`。最小通貨単位（JPY なら円）。浮動小数点は使わない |
| 日時 | `DateTime @db.Timestamptz(3)`。DB は UTC 固定、表示時に店舗 TZ へ変換 |
| 日付のみ | `@db.Date`（営業日・シフト日・生年月日） |
| 時刻のみ | `Int`（現地の午前 0 時からの分数）。1440 超で深夜営業を表現 |
| 率 | ベーシスポイントの `Int`（10000 = 100.00%）。歩合・割引・所要時間係数 |
| テナント | 業務行は `organizationId`、店舗固有は `storeId` を持つ |
| 論理削除 | `deletedAt`。物理削除しない |
| 楽観ロック | 複数人が編集しうる行に `version` |
| 監査 | `createdBy` / `updatedBy` |

---

## 2. モデル一覧（63）

### テナント・認証・権限（10）

| モデル | 役割 |
| --- | --- |
| `Organization` | テナントのルート。法人 |
| `Brand` | 法人内のブランド |
| `Store` | 店舗。予約ルール・営業設定を保持 |
| `StoreBusinessHour` | 曜日別の営業時間・中休み |
| `StoreHoliday` | 定休日以外の休業・特別営業時間 |
| `User` | ログインアカウント。失敗回数・ロックを保持 |
| `UserSession` | DB セッション。IP / UA / 失効理由 |
| `Permission` | 権限キーのマスタ |
| `Role` | ロール。マスキング設定と自分の担当のみ制限を持つ |
| `RolePermission` / `UserRole` | 割当。`UserRole.storeId` が null なら法人全店 |

### スタッフ・設備（6）

`Staff`, `StaffStore`, `StaffSkill`, `StaffShift`, `StaffTimeOff`,
`ResourceType`, `Resource`

`StaffSkill.durationFactorBps` は、そのスタッフの所要時間係数です。
研修生を 12500（125%）にすると、空き枠計算が自動的に長めに確保します。

### 顧客（6）

`Customer`, `CustomerAddress`, `CustomerTag`, `CustomerTagAssignment`,
`CustomerConsent`, `CustomerMergeHistory`

- `phoneNormalized` / `emailNormalized` は重複検知と検索のための正規化列。
  元の入力は別カラムに保持します。
- `visitCount` / `totalSpent` / `lastVisitAt` は非正規化した集計値で、
  予約完了時と統合時に更新します。
- `mergedIntoId` は統合で吸収された側に立ちます。行は消しません。
- `anonymizedAt` は削除依頼への対応記録です。

### メニュー（6）

`ServiceCategory`, `Service`, `ServiceOption`, `ServiceStaff`,
`ServiceResource`, `StoreServicePrice`

`Service.unattendedStartMinute` / `unattendedMinutes` が工程分割の要です。
カラーの放置時間をここに書くと、スタッフだけが解放され席は埋まったままになります。

`Service.storeId` が null なら法人全店で使えます。

### 予約（7）

| モデル | 役割 |
| --- | --- |
| `Appointment` | 顧客から見た 1 件の予約 |
| `AppointmentService` | 予約内のメニュー。**予約時点の名称・価格をスナップショット** |
| `AppointmentServiceOption` | オプションのスナップショット |
| `AppointmentStaff` | **スタッフ時間の占有ブロック**。排他制約の対象 |
| `AppointmentResource` | **設備時間の占有ブロック**。排他制約の対象 |
| `AppointmentStatusHistory` | 全状態遷移の記録 |
| `Waitlist` | キャンセル待ち（Phase 3 で自動繰り上げ） |

**なぜスナップショットを持つか**: メニュー価格を変更したときに、
過去の予約金額まで書き換わってはいけないためです。

**なぜ占有ブロックが独立した行か**:

1. 工程分割で 1 予約が複数ブロックになる（塗布 → 放置 → 仕上げ）
2. 排他制約は 1 行 1 区間でしか張れない
3. 予約に紐づかない占有（休憩・ブロック時間）を同じ制約で守れる

`AppointmentStaff.appointmentId` が nullable なのはこのためです。
`kind` が `service` 以外の行は予約を持ちません。

`isActive` はキャンセル時に false になります。行を消さずに枠だけ解放します。

### カルテ（5）

`MedicalRecordTemplate`, `MedicalRecordField`, `MedicalRecord`,
`MedicalRecordResponse`, `MedicalRecordPhoto`

業種別項目を**テーブル定義ではなくレコード**で表現します。
ヘア・ネイル・アイ・エステの違いは `MedicalRecordField` の行の違いであり、
新しい項目を足すのにマイグレーションは要りません。

`MedicalRecordResponse.value` は `Json` です。1 カラムが全フィールド型を担います。

`MedicalRecordPhoto.storageKey` は保管キーであり、公開 URL ではありません。
配信は必ず署名付き短期 URL を経由します。

### 商品・在庫（5）

`Product`, `Inventory`, `InventoryTransaction`, `Supplier`,
`PurchaseOrder`, `PurchaseOrderItem`

`Product.isRetail` で店販商品と施術商材を区別します。

### 会計（6）

`CashRegisterSession`, `Sale`, `SaleItem`, `Payment`, `Refund`, `CouponUsage`

`Payment.providerToken` のみを保持し、**カード情報は保存しません**。

`Sale.appointmentId` は `@unique` です。1 予約 1 会計を DB で保証します。

### 回数券・会員・ポイント（6）

`Ticket`, `TicketUsage`, `MembershipPlan`, `MembershipSubscription`,
`PointAccount`, `PointTransaction`

CHECK 制約で `remainingUses` が 0〜`totalUses` の範囲、
`PointAccount.balance` が非負であることを保証します。

**Phase 1 では販売機能を実装していません**（資金決済法の確認が必要なため）。

### 通知・販促（5）

`MessageTemplate`, `Notification`, `NotificationDelivery`,
`MarketingSegment`, `MarketingCampaign`

`Notification.idempotencyKey` が `@unique` です。二重キューを DB で防ぎます。

`MarketingSegment.definition` は構造化 JSON です。生 SQL は保存しません。

### 口コミ・アンケート（3）

`Review`, `Survey`, `SurveyResponse`

自社サービス内の口コミのみを扱います。外部口コミサイトからの自動取得は行いません。

### 連携・運用（8）

`ImportJob`, `ExportJob`, `WebhookEndpoint`, `WebhookDelivery`, `ApiKey`,
`AuditLog`, `Subscription`, `Invoice`, `FeatureFlag`, `IdempotencyRecord`

`ApiKey.keyHash` は SHA-256 です。平文は作成時に 1 度だけ表示します。

`AuditLog.before` / `after` は秘密情報を除去してから保存します。

---

## 3. 制約とインデックス

### 排他制約（重複予約防止）

```sql
ALTER TABLE "AppointmentStaff"
  ADD CONSTRAINT "appointment_staff_no_overlap"
  EXCLUDE USING gist (
    "staffId" WITH =,
    tstzrange("startAt", "endAt", '[)') WITH &&
  ) WHERE ("isActive");

ALTER TABLE "AppointmentResource"
  ADD CONSTRAINT "appointment_resource_no_overlap"
  EXCLUDE USING gist (
    "resourceId" WITH =,
    tstzrange("startAt", "endAt", '[)') WITH &&
  ) WHERE ("isActive");
```

### CHECK 制約

| テーブル | 制約 |
| --- | --- |
| `Appointment`, `AppointmentStaff`, `AppointmentResource` | `startAt < endAt` |
| `Ticket` | `0 <= remainingUses <= totalUses` |
| `PointAccount` | `balance >= 0` |
| `Inventory` | `quantity >= 0` |
| `Review` | `rating BETWEEN 1 AND 5` |

### 部分インデックス

```sql
CREATE INDEX "appointment_staff_active_window_idx"
  ON "AppointmentStaff" ("storeId", "startAt", "endAt") WHERE ("isActive");
CREATE INDEX "appointment_resource_active_window_idx"
  ON "AppointmentResource" ("storeId", "startAt", "endAt") WHERE ("isActive");
```

空き枠計算がカレンダーの各日について発行するスキャンを支えます。
キャンセル済みの行を除外するので、稼働年数が伸びてもインデックスが太りません。

---

## 4. リレーション上の判断

| 判断 | 理由 |
| --- | --- |
| `Customer` は法人スコープ（店舗スコープではない） | チェーンで同じ顧客を共有するため。どの店舗が見られるかは権限側で制御 |
| `Service.storeId` が nullable | 全店共通メニューと店舗限定メニューを同じテーブルで扱う |
| `MedicalRecord` は `storeId` 必須 | カルテは施術が行われた店舗に属する |
| `Appointment.customerId` が nullable | ゲスト予約と飛び込み来店のため |
| `Sale.appointmentId` が unique | 1 予約 1 会計を DB で保証 |
| 顧客削除時に `Sale` を消さない | 帳簿保存義務との整合（要専門家確認） |

---

## 5. 未実装だがスキーマに含まれるもの

Phase 2 以降の機能でも、**テーブルは Phase 1 で作成済み**です。
後からの破壊的マイグレーションを減らすためです。

会計・在庫・クーポン・ポイント・回数券・月額会員・Webhook・API キー・
インポート/エクスポートジョブ・SaaS 課金・キャンセル待ち。

会計と商品についてはデモデータも投入されており、
ダッシュボードの売上集計は実際のデータで動作します。
