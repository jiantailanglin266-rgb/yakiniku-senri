# API 仕様

OpenAPI 定義: [openapi.yaml](openapi.yaml)

---

## 1. 共通仕様

### 1-1. レスポンス形式

すべてのエンドポイントが同じ封筒を返します。

```jsonc
// 成功
{ "data": { ... }, "requestId": "9f3c…" }

// 失敗
{
  "error": {
    "code": "SLOT_TAKEN",
    "message": "選択された時間は、ほかの予約で埋まりました",
    "details": [{ "path": "customer.email", "message": "形式を確認してください" }]
  },
  "requestId": "9f3c…"
}
```

`requestId` はレスポンスヘッダ `x-request-id` にも入り、
監査ログ・アプリケーションログの同名フィールドと一致します。
問い合わせ調査はこの ID から辿ります。

### 1-2. HTTP ステータス

| コード | 意味 |
| --- | --- |
| 200 | 成功 |
| 201 | 作成成功 |
| 400 | リクエスト形式が不正（JSON パース失敗など） |
| 401 | 未認証 |
| 403 | 権限不足、署名不正、クロスオリジン拒否 |
| 404 | 対象が存在しない、またはアクセス権がない（区別しない） |
| 409 | 競合（枠が埋まった、冪等キーの再利用、処理中） |
| 410 | 署名付き URL の期限切れ |
| 422 | 業務ルール違反（営業時間外、締切超過など） |
| 429 | レート制限 |
| 500 | 予期しないエラー |
| 501 | 未実装（未接続の外部連携） |

**404 は「存在しない」と「アクセス権がない」を区別しません。**
区別自体が情報漏えいになるためです。

### 1-3. 認証

| 種別 | 方式 |
| --- | --- |
| 管理画面 API | セッション Cookie（`sf_session`, HttpOnly） |
| 公開 API | 認証なし（レート制限あり） |
| ジョブ API | `x-job-token` ヘッダ（`SESSION_SECRET` 由来の共有シークレット） |

API キーによるアクセスは Phase 3 です（`ApiKey` テーブルのみ用意）。

### 1-4. 冪等性

状態変更エンドポイントは `Idempotency-Key` ヘッダを受け付けます。

| 状況 | 応答 |
| --- | --- |
| 同一キー・同一内容・完了済み | 保存済みレスポンスを再生（元のステータス） |
| 同一キー・異なる内容 | `409 IDEMPOTENCY_KEY_REUSED` |
| 同一キー・処理中 | `409 REQUEST_IN_FLIGHT` |

失敗時はキーを解放します。顧客が別の枠を選んで即座に再試行できるようにするためです。
記録は 24 時間で失効します。

### 1-5. レート制限

| エンドポイント | 既定 |
| --- | --- |
| 公開空き枠 | 60 / 分 / IP |
| 公開予約作成 | 10 / 分 / IP |
| ログイン | 10 / 分 / IP |

超過時は `429` と `Retry-After` ヘッダを返します。

### 1-6. CSRF

状態変更メソッドは `Origin` ヘッダを検証します（`src/proxy.ts`）。
自サイト以外のオリジンは `403 CROSS_ORIGIN_BLOCKED` になります。

---

## 2. 実装済みエンドポイント

### `GET /api/v1/public/stores/{storeSlug}/availability`

公開の空き枠検索。認証不要。

**クエリパラメータ**

| 名前 | 必須 | 説明 |
| --- | :-: | --- |
| `from` | ○ | 開始日 `YYYY-MM-DD` |
| `days` | | 取得日数（1〜14、既定 7） |
| `serviceId` | ○ | メニュー ID。複数指定可（1〜10 件） |
| `optionId` | | オプション ID。複数指定可 |
| `staffId` | | 指名するスタッフ |

**レスポンス**

```jsonc
{
  "data": {
    "timeZone": "Asia/Tokyo",
    "days": [
      {
        "dateISO": "2026-08-05",
        "storeClosed": false,
        "slots": [
          { "startAt": "2026-08-05T01:00:00.000Z", "staffId": "clx…" }
        ]
      }
    ]
  },
  "requestId": "…"
}
```

`cache-control: no-store` を返します。空き枠は即座に陳腐化するため、
キャッシュすると埋まった枠を表示してしまいます。

**この結果は非拘束です。** 枠は次の瞬間に他の顧客に取られ得ます。

---

### `POST /api/v1/public/appointments`

公開予約の確定。認証不要。

**リクエスト**

```jsonc
{
  "storeSlug": "demo-beauty-salon-a",
  "serviceIds": ["clx…"],
  "optionIds": [],
  "staffId": "clx…",
  "startAt": "2026-08-05T01:00:00.000Z",
  "isDesignated": true,
  "customer": {
    "name": "山田 花子",
    "nameKana": "ヤマダ ハナコ",
    "phone": "090-1234-5678",
    "email": "hanako@example.invalid",
    "note": "アレルギーあり"
  },
  "consent": { "terms": true, "cancellation": true, "privacy": true }
}
```

- `customer.phone` と `customer.email` は**どちらか一方が必須**です。
- `consent` の 3 項目はすべて `true` でなければ `422` になります。
- 既存顧客は正規化した電話番号またはメールで照合し、再利用します。
  氏名だけでは照合しません（同姓同名を混同しないため）。

**レスポンス（201）**

```jsonc
{
  "data": {
    "reference": "A-20260805-3F9A21",
    "status": "confirmed",
    "startAt": "2026-08-05T01:00:00.000Z",
    "endAt": "2026-08-05T02:00:00.000Z",
    "totalAmount": 5500,
    "requiresApproval": false,
    "notificationSent": true
  },
  "requestId": "…"
}
```

**主なエラー**

| コード | HTTP | 意味 |
| --- | --- | --- |
| `SLOT_TAKEN` | 409 | 確定処理中に他の予約が入った |
| `STORE_CLOSED` | 422 | 休業日 |
| `OUTSIDE_BUSINESS_HOURS` | 422 | 営業時間外 |
| `BOOKING_CUTOFF_PASSED` | 422 | 受付締切を過ぎた |
| `TOO_FAR_IN_ADVANCE` | 422 | 予約可能期間を超えた |
| `STAFF_UNAVAILABLE` | 422 | 指名スタッフが対応不可 |
| `RESOURCE_UNAVAILABLE` | 422 | 設備に空きがない |
| `CONTACT_REQUIRED` | 422 | 連絡先が未入力 |

---

### `GET /api/v1/files`

署名付き URL による非公開ファイル配信。

**クエリ**: `key`, `expires`, `signature`

署名の検証に加えて、**セッションと権限を再確認**します。
URL が転送されても、権限のない相手には配信されません。

| 状況 | 応答 |
| --- | --- |
| 署名不正 | 403 |
| 期限切れ | 410 |
| 未ログイン | 401 |
| `maskMedicalPhoto` が有効なロール | 403 |

---

### `GET /api/v1/customers/export`

顧客一覧の CSV 出力。`customer.export` 権限が必要。

- UTF-8 BOM 付き（Excel で文字化けしないため）
- ロールのマスク設定を適用（画面で見えない値はファイルにも出ない）
- 先頭が `= + - @` タブ CR のセルにシングルクォートを前置（CSV インジェクション対策）
- 出力の都度、行数を監査ログへ記録

---

### `POST /api/v1/jobs/notifications`

通知アウトボックスの配送。`x-job-token` ヘッダが必要。

開発環境では `GET` でトークンを取得できます（本番では 404）。

条件付き UPDATE で claim するため、多重起動しても同じ通知を二度送りません。

---

## 3. 未実装のエンドポイント（Phase 2 以降）

仕様書 §12 が挙げるうち、以下は未実装です。
管理画面の対応機能は Server Actions で実装されています。

| エンドポイント | 現状 | 予定 |
| --- | --- | --- |
| `POST /api/auth/*` | Server Actions で実装 | Phase 2 で REST 化 |
| `GET /api/stores` | 未実装 | Phase 3 |
| `GET /api/appointments` | 管理画面で実装 | Phase 3 |
| `POST /api/appointments` | Server Action で実装 | Phase 3 |
| `PATCH /api/appointments/:id` | Server Action で実装 | Phase 3 |
| `POST /api/appointments/:id/cancel` | Server Action で実装 | Phase 3 |
| `POST /api/appointments/:id/check-in` | Server Action で実装 | Phase 3 |
| `POST /api/appointments/:id/complete` | Server Action で実装 | Phase 3 |
| `GET/POST/PATCH /api/customers` | 管理画面・Server Action で実装 | Phase 3 |
| `POST /api/customers/merge` | Server Action で実装 | Phase 3 |
| `GET /api/services` | 管理画面で実装 | Phase 3 |
| `POST /api/sales` | 未実装 | Phase 2 |
| `POST /api/refunds` | 未実装 | Phase 2 |
| `GET /api/reports/sales` | ダッシュボードで実装 | Phase 3 |
| `POST /api/imports` | 未実装 | Phase 2 |
| `POST /api/exports` | 顧客のみ実装 | Phase 2 |
| `POST /api/webhooks/:provider` | 未実装 | Phase 3 |

Server Actions で先に実装したのは、Phase 1 の利用者が管理画面のみであり、
外部システム連携（API キー・スコープ・レート制限の設計を伴う）は
Phase 3 の課題だからです。ユースケースは `src/server/modules/**` に集約されているため、
REST 化は薄いハンドラを足すだけになります。

---

## 4. Webhook（Phase 3）

スキーマ（`WebhookEndpoint` / `WebhookDelivery`）のみ実装済みです。

想定イベント: `appointment.created`, `appointment.updated`, `appointment.cancelled`,
`appointment.completed`, `customer.created`, `customer.updated`, `sale.completed`,
`refund.created`, `membership.renewed`, `membership.payment_failed`

実装時に必要な機能: HMAC 署名、配信履歴、再送、指数バックオフ、
Dead Letter Queue、タイムアウト、`eventId` による重複防止、シークレットローテーション、
**SSRF 対策（プライベート IP・メタデータエンドポイントの拒否）**。
