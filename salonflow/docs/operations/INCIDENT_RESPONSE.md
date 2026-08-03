# インシデント対応

**本書は暫定的な手順書です。** 運用開始前に、体制・連絡先・エスカレーション基準を
実際の組織に合わせて確定してください。

---

## 1. 重大度

| 等級 | 定義 | 例 | 初動 |
| --- | --- | --- | --- |
| SEV-1 | 個人情報の漏えい、または全テナント停止 | テナント越境、DB 流出、カルテ写真の公開 | 即時 |
| SEV-2 | 業務が回らない | 予約が取れない、重複予約が発生している、台帳が開かない | 1 時間以内 |
| SEV-3 | 一部機能の障害 | 通知が届かない、集計がずれる | 営業時間内 |
| SEV-4 | 軽微 | 表示崩れ、誤字 | 通常の開発サイクル |

---

## 2. 共通の初動

1. **記録を開始する** — 時刻、事象、実施した操作をすべて残す
2. **影響範囲を特定する** — どのテナント、どの期間、何件
3. **拡大を止める** — 必要なら該当機能を停止する
4. **証跡を保全する** — ログと監査ログを退避する（上書きされる前に）
5. **関係者へ連絡する** — 社内 → テナント → （必要なら）当局・本人

**復旧を急いで証跡を消さないでください。** 何が起きたか説明できないことが、
技術的な障害以上の問題になります。

---

## 3. シナリオ別

### 3-1. テナント越境（SEV-1）

他法人のデータが見えた、という報告。

```sql
-- 誰が何を見たかを特定
SELECT "createdAt", "actorLabel", action, "entityType", "entityId", "ipAddress"
FROM "AuditLog"
WHERE "organizationId" = '<被害テナント>'
  AND "actorId" NOT IN (SELECT "userId" FROM "UserRole" WHERE "organizationId" = '<被害テナント>')
ORDER BY "createdAt" DESC;
```

1. 該当エンドポイントを停止する
2. 上記クエリで閲覧範囲を確定する
3. 該当ユーザーのセッションを失効させる
   ```sql
   UPDATE "UserSession" SET "revokedAt" = now(), "revokedReason" = 'incident'
   WHERE "userId" = '<対象>';
   ```
4. 原因箇所を特定し、**再発防止のテストを先に書く**
5. 両テナントへ報告する
6. 個人情報保護委員会への報告要否を判断する（要弁護士確認）

### 3-2. 重複予約が発生している（SEV-2）

```sql
-- 排他制約が存在するか（最初に確認する）
SELECT conname FROM pg_constraint
WHERE conname IN ('appointment_staff_no_overlap','appointment_resource_no_overlap');

-- 実際に重なっている行を探す
SELECT a.id, b.id, a."staffId", a."startAt", a."endAt", b."startAt", b."endAt"
FROM "AppointmentStaff" a
JOIN "AppointmentStaff" b
  ON a."staffId" = b."staffId" AND a.id < b.id
 AND a."isActive" AND b."isActive"
 AND tstzrange(a."startAt", a."endAt", '[)') && tstzrange(b."startAt", b."endAt", '[)');
```

制約が存在しないなら、リストア時の欠落かマイグレーション漏れです。
**制約を再作成する前に、既存の重なりを解消する必要があります**
（重なったままでは制約を張れません）。

制約が存在するのに重なっているなら、それは制約を迂回する経路
（生 SQL、`isActive` の誤操作）があるということです。コード側の調査が必要です。

### 3-3. 通知が届かない（SEV-3）

```sql
SELECT status, count(*), min("scheduledAt") FROM "Notification" GROUP BY status;

SELECT n.id, n.recipient, d.attempt, d."errorMessage", d."nextRetryAt"
FROM "Notification" n
JOIN "NotificationDelivery" d ON d."notificationId" = n.id
WHERE n.status IN ('pending','failed')
ORDER BY d."startedAt" DESC LIMIT 50;
```

| `pending` が滞留 | ジョブが動いていない。cron とトークンを確認 |
| `failed` が多い | 送信事業者側の問題。`errorMessage` を確認 |
| `sent` なのに届かない | 迷惑メール判定。SPF / DKIM / DMARC を確認 |

再送は自動（指数バックオフ、最大 5 回）です。手動で再送する場合：

```sql
UPDATE "Notification" SET status = 'pending' WHERE id = '…';
```

### 3-4. カルテ写真が公開された（SEV-1）

1. **`SESSION_SECRET` をローテーションする** — 発行済みの署名付き URL がすべて失効します
   （同時に全セッションも失効し、全ユーザーが再ログインになります）
2. `medical_record.photo_viewed` の監査ログで閲覧範囲を確認する
3. ストレージの直接アクセス経路が開いていないか確認する
4. 影響を受けた顧客とテナントへ報告する

### 3-5. アカウント乗っ取りの疑い（SEV-1/2）

```sql
-- 該当ユーザーの全セッションを失効
UPDATE "UserSession" SET "revokedAt" = now(), "revokedReason" = 'suspected_compromise'
WHERE "userId" = '<対象>';

-- 直近の操作を確認
SELECT "createdAt", action, "entityType", "entityId", "ipAddress", "userAgent"
FROM "AuditLog" WHERE "actorId" = '<対象>' ORDER BY "createdAt" DESC LIMIT 200;
```

`customer.exported` が含まれていないか必ず確認してください。

---

## 4. 事後対応

インシデント収束後、48 時間以内に振り返りを行います。

- 何が起きたか（時系列）
- なぜ起きたか（技術的原因と、それを許した仕組み）
- なぜ早く気づけなかったか（検知の欠落）
- 再発防止策（**テストとして書けるものはテストにする**）

個人を責めない形式で行ってください。
「誰がミスしたか」ではなく「なぜミスが本番に到達できたか」を問います。

---

## 5. 連絡先

**運用開始前に埋めてください。**

| 役割 | 担当 | 連絡先 |
| --- | --- | --- |
| インシデント指揮 | 未定 | 未定 |
| 技術対応 | 未定 | 未定 |
| テナント連絡 | 未定 | 未定 |
| 法務・個人情報 | 未定 | 未定 |
| 広報 | 未定 | 未定 |
