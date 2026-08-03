# 運用手順

---

## 1. デプロイ

### 前提

- PostgreSQL 14 以上（`btree_gist` 利用可）
- Node.js 20.9 以上
- 環境変数（[../SETUP.md](../SETUP.md) §4）

### 手順

```bash
npm ci
npm run db:deploy      # マイグレーション適用（migrate deploy）
npm run build
npm run start
```

`db:deploy` は `migrate dev` と違い、スキーマの差分検出やリセットを行いません。
本番では必ずこちらを使います。

### デプロイ前チェック

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

---

## 2. 定期実行が必要なジョブ

| ジョブ | 間隔 | 方法 |
| --- | --- | --- |
| 通知配送 | 1〜5 分 | `POST /api/v1/jobs/notifications` |
| リマインド生成 | 1 時間 | **未実装**（Phase 2） |
| 冪等キーの掃除 | 1 日 | **未実装** |
| 保持期間の削除 | 1 日 | **未実装** |
| ポイント失効 | 1 日 | **未実装** |

### 通知配送の設定例（cron）

```
*/5 * * * * curl -fsS -X POST \
  -H "x-job-token: $SALONFLOW_JOB_TOKEN" \
  https://example.invalid/api/v1/jobs/notifications
```

トークンは `SESSION_SECRET` から導出されます。開発環境でのみ
`GET /api/v1/jobs/notifications` で取得できます。

> **注意**: Phase 1 のジョブ実行はインプロセスです。
> 複数インスタンス構成では、条件付き claim があってもスケジューラの設定次第で
> 重複起動しえます。本番では BullMQ + Redis への移行が必要です（ADR-0004）。

---

## 3. 監視

### 監視すべき指標

| 指標 | 閾値の目安 | 意味 |
| --- | --- | --- |
| 予約確定 API の p95 | 1,500ms | 遅延は予約取りこぼしに直結 |
| `SLOT_TAKEN` の発生率 | 通常 1% 未満 | 急増は空き枠表示の陳腐化 |
| 通知の `failed` 件数 | 0 | 送信事業者側の障害 |
| 通知の `pending` 滞留 | 5 分以上 | ジョブが動いていない |
| ログイン失敗率 | 急増を検知 | 総当たり攻撃 |
| `AuditLog` の `customer.exported` | 1 件でも通知 | 大量持ち出しの検知 |
| DB 接続数 | プール上限の 80% | コネクション枯渇 |

### 便利な確認クエリ

```sql
-- 通知の滞留
SELECT status, count(*), min("scheduledAt")
FROM "Notification" GROUP BY status;

-- 直近の予約競合（アプリログと突き合わせる）
SELECT date_trunc('hour', "createdAt") AS h, count(*)
FROM "AuditLog" WHERE action = 'appointment.created'
GROUP BY h ORDER BY h DESC LIMIT 24;

-- 顧客データの持ち出し履歴
SELECT "createdAt", "actorLabel", after->'_meta'->>'rowCount' AS rows
FROM "AuditLog" WHERE action = 'customer.exported'
ORDER BY "createdAt" DESC LIMIT 50;

-- 排他制約が生きているか
SELECT conname FROM pg_constraint
WHERE conname IN ('appointment_staff_no_overlap','appointment_resource_no_overlap');
```

最後のクエリが 2 行返さない場合、**重複予約が発生しうる状態です。**
最優先で調査してください。

---

## 4. ログ

構造化 JSON を標準出力へ 1 行 1 オブジェクトで出力します。

```json
{"ts":"2026-08-03T10:00:00.000Z","level":"warn","msg":"notification_delivery_failed",
 "organizationId":"clx…","notificationId":"clx…","attempt":2,"error":"…"}
```

`requestId` で API レスポンス・監査ログと突き合わせられます。

秘密情報らしきフィールド名（password / token / secret / cookie / card 等）は
自動的に `[redacted]` になります。

---

## 5. メンテナンスモード

**未実装**です。実装する場合は、公開予約ページのみを停止し
管理画面は動かし続けられる粒度が望ましい（当日の来店対応が続くため）。

---

## 6. 緊急時のテナントデータアクセス

運営者ロールは意図的にカルテを閲覧できません。
障害調査で必要になった場合の手続き：

1. テナント（サロン事業者）から書面で明示的な同意を得る
2. 対象範囲と期間を限定する
3. 一時的に該当テナント内のロールを付与する
4. 作業完了後、直ちにロールを剥奪する
5. 付与・作業・剥奪のすべてが監査ログに残ることを確認する
6. 作業内容をテナントへ報告する

**DB へ直接クエリして迂回しないでください。** 監査ログに残らず、
委託先管理の観点で説明できなくなります。

---

## 7. スケーリング

| 兆候 | 対応 |
| --- | --- |
| 空き枠 API が遅い | 部分インデックスの効き、日数上限（14 日）の見直し |
| DB 接続が枯渇 | 接続プーラー（PgBouncer）の導入 |
| 通知が滞留 | BullMQ + Redis への移行、ワーカーの分離 |
| レート制限が効かない | Redis への移行（複数インスタンスで必須） |
| 集計が重い | 読み取りレプリカ、集計の非同期化 |

---

## 8. 定期作業

| 頻度 | 作業 |
| --- | --- |
| 毎日 | バックアップの成否確認、通知の failed 確認 |
| 毎週 | `customer.exported` 監査ログのレビュー、依存の脆弱性確認 |
| 毎月 | リストア演習（[BACKUP_RESTORE.md](BACKUP_RESTORE.md)）、権限付与のレビュー |
| 四半期 | 保持期間ポリシーの見直し、アクセス権の棚卸し |
