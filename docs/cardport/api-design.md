# CARD PORT — API 設計

現状は **API を持たない構成** です。掲載データは TypeScript のモジュールとして同梱され、
検索・比較・診断・シミュレーター・チャットはすべてブラウザ内で完結します。
そのため APIキー無し・サーバー無しでも全機能が動きます。

このドキュメントは、本番データ（Supabase）へ接続するときの設計を定義します。

---

## 1. 方針

| 原則                         | 内容                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------ |
| 読み取りはビルド時に解決する | 一覧・詳細は SSG。クローラにも利用者にも最速で届く                             |
| 書き込みは最小限             | 利用者から受け取るのはクリック計測と購読登録だけ                               |
| 秘密情報はサーバーに置く     | `SUPABASE_SERVICE_ROLE_KEY` / `ANTHROPIC_API_KEY` は `NEXT_PUBLIC_` を付けない |
| 個人情報を集めない           | 診断・シミュレーターの入力はサーバーへ送らない                                 |

---

## 2. データ取得（ビルド時）

`src/cardport/data/*.ts` の同期エクスポートを、非同期の取得関数へ置き換えます。
型（`src/cardport/data/types.ts`）は変えないので、コンポーネント側の修正は不要です。

```ts
// src/cardport/data/cards.ts（live 版のイメージ）
import { createClient } from "@supabase/supabase-js";
import { isMockData } from "@/cardport/config/site";
import { mockCards } from "./cards.mock";

export async function getCards(): Promise<Card[]> {
  if (isMockData) return mockCards;

  const supabase = createClient(url, anonKey);
  const { data, error } = await supabase
    .from("cards")
    .select(
      `
      *,
      card_fees(*), card_rewards(*), card_miles(*),
      card_insurance(*), card_lounges(*), card_features(*),
      card_business(*), card_crypto(*),
      card_scores(*), card_brand_map(*), card_category_map(*),
      card_issuers(*)
    `,
    )
    .eq("is_published", true);

  if (error) throw error;
  return data.map(toCard); // DB の行 → Card 型へ写像する関数
}
```

呼び出し側（`page.tsx`）は `await getCards()` にするだけです。

### 再生成のタイミング

| 環境         | 方式                                                                                  |
| ------------ | ------------------------------------------------------------------------------------- |
| GitHub Pages | 静的エクスポート。データ更新のたびに再ビルド                                          |
| Vercel       | ページごとに `export const revalidate = 3600`（ISR）。緊急時は On-Demand Revalidation |

キャンペーンの期限切れは、再ビルドを待たずに**クライアント側の日付比較**で表示が切り替わります
（`isExpired()`）。掲載期限を過ぎたまま「申込み可能」に見えることを防ぐためです。

---

## 3. ルートハンドラ（サーバー側）

静的エクスポートでは `force-static` のみ利用可能です。
サーバー運用に切り替えた場合に追加する想定のエンドポイント:

### `POST /api/track/click`

アフィリエイトクリックの記録。

```jsonc
// request
{
  "itemId": "nova-zero",
  "placement": "ranking",
  "position": 1,
  "locale": "ja",
  "isSponsored": true,
}
// response: 204 No Content
```

- レート制限: IP あたり 60 req/min
- 保存先: `affiliate_clicks`
- **クッキーやフィンガープリントで個人を追跡しません**
- 現状はこの送信を行わず、`dataLayer` イベントのみ発火します

### `POST /api/chat`

AIコンシェルジュを生成モデルへ接続する場合のエンドポイント。
`NEXT_PUBLIC_CHAT_API_URL` を設定すると、クライアントがここへ問い合わせます。

```jsonc
// request
{
  "locale": "ja",
  "message": "年会費無料で還元率が高いカードは？",
  // クライアントで retrieve() した結果。生成モデルへ渡す文脈
  "context": [
    {
      "id": "card:nova-zero",
      "title": "ノヴァ ゼロ",
      "body": "…",
      "href": "/ja/cards/nova-zero",
      "verifiedOn": "2026-07-15",
    },
  ],
}
```

サーバー側の必須処理:

1. **入力の検査** — カード番号らしき数字列・セキュリティコード・暗証番号を含む場合は 400 を返す
2. **文脈の限定** — `context` に無い情報を答えさせない旨をシステムプロンプトに明記する
3. **禁止事項の明示** — 審査通過・限度額の保証、多重申込みの推奨、借入れの勧誘を禁じる
4. **出典の強制** — 回答末尾に `context` の `href` と `verifiedOn` を必ず付ける
5. **レート制限** — IP あたり 20 req/min
6. **APIキーはサーバー内に留める** — レスポンスにも含めない

```
// システムプロンプトに必ず含める禁止事項
- 審査の通過・発行・利用限度額を保証しない
- 収入や信用情報を偽る方法を案内しない
- 多重申込みを促さない／借入れを勧めない
- カード番号・セキュリティコード・暗証番号・本人確認書類の入力を求めない
- 与えられた文脈に無い数値を答えない（不明なら「掲載データにありません」と言う）
```

### `POST /api/subscribe`

メールマガジン登録。

- 二重オプトイン（確認メールのリンクを踏むまで購読を有効にしない）
- Bot 対策（Turnstile 等）を必須
- 保存するのはメールアドレスと言語のみ

### `GET /api/health`

外部API（YouTube / Supabase）の疎通確認。管理画面から参照します。

---

## 4. 外部 API

### YouTube Data API

```
GET https://www.googleapis.com/youtube/v3/search
  ?key=$YOUTUBE_API_KEY
  &channelId=$NEXT_PUBLIC_YOUTUBE_CHANNEL_ID
  &part=snippet&order=date&maxResults=20&type=video
```

- **APIキーはサーバー側でのみ使用**します。クライアントへ出しません
- 取得結果は `Video` 型へ写像します
- キー未設定時は `src/cardport/data/videos.ts` のモックをそのまま表示します
- 失敗した場合もモックへフォールバックし、ページを 500 にしません
- 呼び出し結果は `api_logs` へ記録します

### 為替レート・カード会社の公開API

現時点では利用していません。導入する場合も、**取得できなかったときに空欄を表示する**設計にし、
古い値を最新であるかのように見せないでください。

---

## 5. エラーハンドリング方針

| 状況                 | 挙動                                                    |
| -------------------- | ------------------------------------------------------- |
| 外部APIの失敗        | モックまたは前回値へフォールバックし、`api_logs` に記録 |
| データの一部欠損     | その項目だけ非表示。ページ全体は落とさない              |
| 翻訳の欠損           | 英語 → 日本語の順にフォールバック                       |
| 提携リンクの期限切れ | 公式サイトへ `nofollow` で遷移し、PRラベルを外す        |
| 未定義の言語コード   | 404（`dynamicParams = false`）                          |

---

## 6. キャッシュ

| 対象              | 方針                                       |
| ----------------- | ------------------------------------------ |
| ページ HTML       | SSG / ISR（1時間）                         |
| 静的アセット      | `immutable`（Next.js の既定）              |
| サイトマップ・RSS | ビルド時生成                               |
| 比較リスト        | localStorage（サーバーへ送らない）         |
| チャット索引      | 言語ごとにメモリキャッシュ（`buildIndex`） |

Redis / KV は、クリック計測とレート制限をサーバー運用へ移すときに導入します。
