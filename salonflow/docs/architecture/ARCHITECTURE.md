# アーキテクチャ

---

## 1. 全体像

```
                         ┌──────────────────────────────────────────┐
                         │            Client (Browser)              │
                         │  管理画面(/admin)   公開予約(/booking)    │
                         └───────────────┬──────────────────────────┘
                                         │ HTTPS
┌────────────────────────────────────────▼─────────────────────────────────────┐
│                        Next.js 16 App Router (single app)                     │
│  proxy.ts: requestId 付与 / クロスオリジン拒否                                  │
│                                                                               │
│  ┌─────────────── Presentation ───────────────┐  ┌──── Route Handlers ─────┐ │
│  │ RSC pages / Client islands / Server Actions │  │ /api/v1/**  (REST)      │ │
│  └───────────────────┬─────────────────────────┘  └────────────┬────────────┘ │
│                      │                                          │             │
│  ┌───────────────────▼──────────────────────────────────────────▼───────────┐ │
│  │                     Application Layer  (src/server/modules)               │ │
│  │  appointments / customers / medical-records / booking / dashboard         │ │
│  │  ── 必ず RequestContext（認証済みテナント + 権限）を引数に取る ──          │ │
│  └───────────────────┬──────────────────────────────────────────────────────┘ │
│                      │                                                        │
│  ┌───────────┬───────┴────────┬─────────────┬──────────────┬───────────────┐  │
│  │  auth     │  permissions   │ booking-    │ notifications│ observability │  │
│  │  session  │  RBAC + mask   │ engine(pure)│  outbox      │ audit / logs  │  │
│  └───────────┴────────────────┴─────────────┴──────────────┴───────────────┘  │
│                      │                                                        │
│  ┌───────────────────▼──────────────────────────────────────────────────────┐ │
│  │           Tenant guard (src/server/db/tenant.ts) + Prisma Client          │ │
│  └───────────────────┬──────────────────────────────────────────────────────┘ │
└──────────────────────┼────────────────────────────────────────────────────────┘
                       │
              ┌────────▼─────────┐
              │   PostgreSQL 16  │
              │  btree_gist で   │
              │  排他制約を付与  │
              └──────────────────┘
```

---

## 2. レイヤ規約

| レイヤ | 場所 | 責務 | 禁止 |
| --- | --- | --- | --- |
| Presentation | `src/app/**`, `src/components/**` | 描画、フォーム、Server Action の入口 | Prisma を直接触らない |
| Application | `src/server/modules/**` | ユースケース、トランザクション境界、監査ログ発行 | HTTP / React に依存しない |
| Domain | `src/server/booking-engine`, `src/lib/{time,money,tax,normalize}` | 純関数 | **I/O を一切行わない** |
| Infrastructure | `src/server/{db,notifications,storage,security}` | Prisma、メール、ファイル、レート制限 | ビジネスルールを持たない |

**依存方向は `app → modules → domain/infra` の一方向**です。逆流を禁止します。

### ドメイン層を純関数に保つ理由

空き枠計算・料金計算・税計算・重複判定は、DB なしで単体テストできます。

```
tests/unit/booking-engine.test.ts   45 テスト（DB 不要、実行 0.1 秒）
tests/unit/tax.test.ts              28 テスト
tests/unit/time.test.ts             21 テスト
```

これらが速く確実に回ることが、予約エンジンに手を入れ続けられる前提です。

---

## 3. モジュール境界と将来の分割

仕様書 §23 の `packages/*` 構成に 1:1 対応します。

| 仕様書の package | 本実装 |
| --- | --- |
| `packages/database` | `src/server/db` + `prisma/` |
| `packages/auth` | `src/server/auth` |
| `packages/permissions` | `src/server/permissions` |
| `packages/booking-engine` | `src/server/booking-engine` |
| `packages/notifications` | `src/server/notifications` |
| `packages/validation` | 各モジュール内の Zod スキーマ |
| `packages/i18n` | `src/i18n` + `messages/` |
| `packages/config` | `src/config` |
| `packages/observability` | `src/server/observability` |
| `packages/ui` | `src/components/ui` |
| `apps/admin` | `src/app/admin` |
| `apps/booking` | `src/app/booking` |
| `apps/api` | `src/app/api` |

単一アプリで始めた理由は [ADR-0001](../adr/0001-single-app.md) を参照してください。

---

## 4. 予約エンジン

本システムの中核です。3 つのモジュールに分かれます。

### 4-1. `interval.ts` — 区間代数

半開区間 `[start, end)` の重なり判定・マージ・差分・積。
半開である理由は、「10:00 終了」と「10:00 開始」を衝突させないためであり、
PostgreSQL の排他制約が使う `tstzrange(..., '[)')` と一致させるためです。

### 4-2. `occupancy.ts` — 占有計画

メニューの組み合わせから、**スタッフ占有ブロック**と**設備占有ブロック**を導出します。

```
カラー（90 分、放置 30 分〜60 分、席 1）
  → スタッフ: [0,30) と [60,90)   ← 放置中は解放
  → 設備:     [0,90)              ← 席は埋まったまま
```

これがサロン管理システムの肝です。放置中もスタイリストを拘束すると、
現実の稼働率を再現できず、システムが「使えない」ものになります。

準備時間・片付け時間はスタッフ占有を前後に伸ばしますが、
顧客の滞在時間は伸ばしません。店舗バッファは最後のスタッフブロックのみを伸ばします。

スタッフごとの所要時間係数（`durationFactorBps`）は切り上げで適用します。
研修生の所要時間を短く見積もって過密にするより、余らせる方が安全だからです。

### 4-3. `availability.ts` — 空き枠計算

制約を安い順に適用します。

1. リードタイム（受付締切・最短予約時間・最大予約可能日）
2. 営業時間（曜日別 + 臨時休業 + 中休み）
3. スタッフのシフト（勤務外は候補から除外）
4. スタッフの既存予約・休憩・ブロック
5. 設備の空き（種別ごとに必要数を確保）

設備は**種別ごとに必要区間の和集合に対して 1 回だけ割り当て**ます。
工程ごとに別の席を割り当ててしまうと、施術中に顧客を移動させることになるためです。

`verifySlot()` は `computeAvailability()` と同じ判定を単一枠に対して行い、
予約確定直前の再検証に使います。表示は非拘束、確定はこちらが門番です。

---

## 5. 予約確定の流れ

```
1. メニュー・店舗ルールを読み込む（トランザクション外、安価）
2. 所要時間と料金をサーバーで再計算
   → クライアントが送ってきた金額は採用しない
3. トランザクション開始
   3-1. 競合データをトランザクション内で読み直す
   3-2. verifySlot() で再検証
   3-3. Appointment / AppointmentService を INSERT
   3-4. AppointmentStaff / AppointmentResource を INSERT
        → GiST 排他制約が競合を拒否（SQLSTATE 23P01）
   3-5. AppointmentStatusHistory を INSERT
   3-6. Notification を INSERT（Outbox）
4. コミット
5. コミット後に通知を送信
```

ステップ 3-1 の「トランザクション内での読み直し」により、
表示から確定までの間に起きた変化に追随します。
それでも取り切れない同時実行は、3-4 の DB 制約が止めます。

エラー変換：

| PostgreSQL | 例外 | API |
| --- | --- | --- |
| `23P01` exclusion_violation | `BookingConflictError` | `409 SLOT_TAKEN` |
| `40001` serialization_failure | 1 回だけ自動リトライ | 失敗時 500 |
| （アプリ判定） | `BookingRejectedError` | `422` + 理由コード |

---

## 6. テナント分離

`src/server/db/tenant.ts` が唯一のスコープ生成点です。

```ts
orgScope(context)               // 組織スコープ
storeScope(context, storeId?)   // 店舗スコープ（アクセス権を検証）
assertTenant(context, row)      // 主キー取得後の所属検証
assertTenantStore(context, row) // 店舗の可視性も検証
```

Prisma のグローバルミドルウェアではなく明示的なヘルパーにしたのは、
「どのクエリがどうスコープされているか」がコード上で見えるようにするためです。
ミドルウェアは書き忘れを防ぎますが、`include` の奥まで届かず、
「効いているつもり」を生みやすいと判断しました。

代わりに、越境を試みる結合テストを常設しています。

---

## 7. 通知（Outbox パターン）

```
[予約トランザクション]
  ├─ Appointment INSERT
  ├─ AppointmentStaff INSERT
  └─ Notification INSERT (status=pending, idempotencyKey)
COMMIT
  ↓
[ディスパッチャ]
  ├─ pending を条件付き UPDATE で claim（status=sending）
  ├─ トランスポートで送信
  └─ status=sent / failed（指数バックオフで再送、最大 5 回）
```

これにより、以下が両方防げます。

- 予約はロールバックしたのにメールだけ届く
- 予約はコミットしたのにプロセス停止でメールが飛ばない

`idempotencyKey` は (イベント, チャネル, 予約 ID, 宛先, 予定時刻) の SHA-256 です。
再キューは `createMany({ skipDuplicates: true })` で無害な no-op になります。

---

## 8. 時刻の扱い

| 場所 | 表現 |
| --- | --- |
| DB | `timestamptz`（UTC） |
| ドメイン計算 | `Date`（UTC の瞬間） |
| 店舗の営業時間・シフト | 現地の「午前 0 時からの分数」（`Int`） |
| 表示 | 店舗タイムゾーンへ変換 |

変換は `src/lib/time.ts` の関数経由でのみ行います。
`Intl.DateTimeFormat` を用いた 2 パス法でオフセットを解決するため、
DST 境界でも正しく動作し、ホストの `TZ` 設定に依存しません。

「午前 0 時からの分数」が 1440 を超えることを許容しており、
`26:00` のような深夜営業を自然に表現できます。

---

## 9. 金額の扱い

すべて最小通貨単位の整数です（JPY なら 1 = 1 円）。
`src/lib/money.ts` が `assertMoney()` で非整数の混入を検出します。

按分（値引きや税額を明細へ配分する処理）は最大剰余法で行い、
**合計が必ず元の金額と一致**します。1 円の誤差もレジ締めでは問題になります。

税計算は `src/lib/tax.ts`。内税・外税、標準/軽減/非課税/不課税、
端数処理モードを扱い、適格請求書に必要な税率別の内訳を返します。
税率は設定として定義しており、法令の写しではありません。

---

## 10. Next.js 16 固有の事項

| 事項 | 対応 |
| --- | --- |
| `params` / `searchParams` が Promise | すべて `await` |
| `cookies()` / `headers()` が非同期 | すべて `await` |
| `middleware` → `proxy` へ改称 | `src/proxy.ts` |
| `next lint` 廃止 | `eslint .` を直接実行 |
| Turbopack が既定 | 設定は不要 |
| `serverRuntimeConfig` 廃止 | 環境変数を直接参照 |

---

## 11. 性能上の配慮

| 箇所 | 対応 |
| --- | --- |
| 予約台帳 | 予約数によらず固定回数のクエリ（N+1 を作らない） |
| ダッシュボード | 独立集計を `Promise.all` で並列化 |
| 空き枠検索 | `(storeId, startAt, endAt) WHERE isActive` の部分インデックス |
| 顧客検索 | 正規化列（`phoneNormalized`, `emailNormalized`）にインデックス |
| セッション | `lastSeenAt` 更新を 1 分に 1 回へ throttle |
| RequestContext | React `cache` で 1 リクエスト 1 回に集約 |
| 一覧 | 常にページネーション（既定 25、上限 100） |

大規模集計の非同期化（`ExportJob` / `ImportJob`）はスキーマのみ用意し、
実行は Phase 3 です。
