# SPORTS PORT — ディレクトリ構成 / DB設計 / API設計

---

## 1. ディレクトリ構成

```
src/
├── app/
│   ├── (senri)/                    焼肉 千里（既存サイト。ルートレイアウトを持つ）
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── menu/ news/ about/ …
│   ├── sports-port/                SPORTS PORT
│   │   ├── sports.css              デザインシステム（Tailwind @theme + @utility）
│   │   └── [locale]/
│   │       ├── layout.tsx          ルートレイアウト（15ロケールを事前生成）
│   │       ├── page.tsx            トップページ（25セクション）
│   │       ├── live/ matches/ leagues/ sports/ teams/ players/
│   │       ├── news/ videos/ streaming/
│   │       ├── web3/ fan-tokens/ nfts/ diagnosis/ betting/
│   │       ├── search/ guide/ faq/ admin/ sitemap/
│   │       └── legal/[slug]/
│   ├── api/sports/live/route.ts    ライブスコア取得（外部APIの境界）
│   ├── sports-sitemap.xml/route.ts 言語別サイトマップ（hreflang つき）
│   ├── sports-rss.xml/route.ts     ニュースRSS
│   ├── globals.css                 焼肉 千里のデザインシステム
│   ├── sitemap.ts / robots.ts / manifest.ts
│
├── sports/                         SPORTS PORT のドメイン層（app に依存しない）
│   ├── types.ts                    ドメインモデル
│   ├── config/site.ts              ブランド・テーマ・機能フラグ・収益フラグ
│   ├── i18n/
│   │   ├── locales.ts              15ロケール定義（国旗・タイムゾーン・RTL）
│   │   ├── dictionary.ts           ja / en の全文辞書
│   │   ├── partials.ts             他13言語の部分辞書
│   │   └── index.ts                getDictionary / text / localeContext
│   ├── data/                       モックデータ（＝将来のDBテーブルと同じ形）
│   │   ├── clock.ts sports.ts leagues.ts teams.ts players.ts
│   │   ├── matches.ts standings.ts news.ts videos.ts streaming.ts
│   │   ├── web3.ts diagnoses.ts content.ts legal.ts
│   ├── lib/
│   │   ├── api.ts                  データ取得の境界（mock ⇄ live 切替）
│   │   ├── url.ts                  ロケール付きURL・hreflang
│   │   ├── seo.ts                  メタデータ生成
│   │   ├── structured-data.ts      JSON-LD
│   │   ├── search.ts               検索索引（表記ゆれ対応）
│   │   ├── chat.ts                 チャットボットの文書検索（RAG）
│   │   ├── diagnosis.ts            診断スコアリング
│   │   ├── format.ts               日時・数値のローカライズ
│   │   ├── page.ts                 ページ共通のロケール解決
│   │   └── client-hooks.ts         タイムゾーン取得
│   └── components/                 hero / live / match / standings / cards /
│                                   streaming / diagnosis / chat / search / layout / ui
└── ...
```

### 依存の向き

```
app/sports-port/**  ──►  sports/components  ──►  sports/lib  ──►  sports/data  ──►  sports/types
                                          └─►  sports/i18n
```

`sports/` は `app/` を知りません。Next.js から切り離してテストできます。

---

## 2. DB設計

現在は `src/sports/data/*.ts` がデータストアです。
**型（`src/sports/types.ts`）をそのままテーブル定義にできる形**にしてあるため、
Supabase / PostgreSQL への移行時にドメイン層の書き換えは発生しません。

### 主要テーブル

```sql
-- 競技（表示ルールを JSONB で持ち、競技追加でスキーマ変更を起こさない）
create table sports (
  id                text primary key,
  slug              text unique not null,
  name              jsonb not null,          -- { ja, en, ... }
  glyph             text not null,
  accent            text not null,
  period_type       text not null,           -- half|quarter|set|inning|round|race|hole|map
  period_count      int  not null,
  has_draw          boolean not null,
  standings_type    text not null,
  standings_columns jsonb not null,          -- StandingsColumn[]
  stat_keys         jsonb not null,          -- SportStatKey[]
  primer            jsonb not null
);

create table competitions (                  -- 大会（リーグ以外のカップ戦・シリーズ）
  id text primary key, sport_id text references sports(id), format text, name jsonb
);

create table leagues (
  id text primary key,
  slug text unique not null,
  sport_id text not null references sports(id),
  name jsonb not null, short_name text not null,
  country text not null, region text not null, format text not null,
  season text not null, season_start date, season_end date, team_count int,
  description jsonb, honours jsonb, broadcast_ids text[], accent text,
  fetched_at timestamptz, source text, provenance text
);

create table seasons (
  id text primary key, league_id text references leagues(id), label text, starts_on date, ends_on date
);

create table countries ( code text primary key, name jsonb );

create table venues (
  id text primary key, name jsonb, city jsonb, country text, capacity int, geo point
);

create table teams (
  id text primary key,
  slug text unique not null,
  sport_id text references sports(id),
  league_id text references leagues(id),
  name jsonb not null, short_name text,
  aliases text[] not null default '{}',      -- 表記ゆれ検索の要
  country text, city jsonb, founded int,
  venue_id text references venues(id),
  crest jsonb,                               -- { initials, primary, secondary, shape }
  manager text, official_url text, social jsonb, fan_token_id text
);
create index on teams using gin (aliases);

create table players (
  id text primary key, slug text unique not null,
  sport_id text references sports(id), team_id text references teams(id),
  name jsonb, aliases text[], nationality text, birth_date date,
  height_cm int, weight_kg int, position jsonb, number int,
  season_stats jsonb, career_stats jsonb, transfers jsonb, honours jsonb, social jsonb
);

create table matches (
  id text primary key, slug text unique not null,
  sport_id text references sports(id), league_id text references leagues(id),
  season text, round jsonb,
  kickoff timestamptz not null,
  status text not null,                      -- scheduled|live|break|extra|finished|postponed|cancelled
  clock text, venue_id text references venues(id),
  home_team_id text references teams(id), away_team_id text references teams(id),
  home_score int, away_score int,            -- 未開始は NULL（0 と区別する）
  period_scores jsonb, predicted_lineup boolean,
  broadcast_ids text[], highlight_video_id text,
  preview jsonb, report jsonb,
  fetched_at timestamptz not null, refresh_interval_sec int not null,
  source text not null, provenance text not null
);
create index on matches (kickoff);
create index on matches (status) where status in ('live','break','extra');

create table match_events (
  id text primary key, match_id text references matches(id) on delete cascade,
  clock text, type text, side text, player_id text references players(id), text jsonb, ordinal int
);

create table match_statistics (
  match_id text references matches(id) on delete cascade,
  key text, home numeric, away numeric, primary key (match_id, key)
);

create table lineups (
  match_id text references matches(id) on delete cascade,
  side text, player_id text, name text, number int, position text, starter boolean
);

create table standings (
  league_id text references leagues(id), "group" text, team_id text references teams(id),
  rank int, change int, values jsonb, form text[], zone text,
  fetched_at timestamptz, primary key (league_id, "group", team_id)
);

create table news_sources ( id text primary key, name text, url text, kind text );
create table news (
  id text primary key, slug text unique not null,
  category text not null, confidence text not null,   -- official|report|rumour
  sport_id text, league_id text, match_id text,
  team_ids text[], player_ids text[],
  title jsonb, summary jsonb, body jsonb,
  published_at timestamptz, updated_at timestamptz,
  reading_minutes int, author_id text, supervisor_id text,
  sources jsonb not null, priority int
);

create table videos (
  id text primary key, slug text unique, youtube_id text, kind text,
  title jsonb, description jsonb, sport_id text, league_id text, match_id text,
  team_ids text[], player_ids text[], channel jsonb,
  published_at timestamptz, duration_sec int, chapters jsonb,
  ai_summary jsonb, transcript_excerpt jsonb
);

create table streaming_services (
  id text primary key, slug text unique, name text,
  regions text[], sport_ids text[], league_ids text[],
  monthly_price_jpy int, yearly_price_jpy int, free_trial_days int,
  live boolean, on_demand boolean, simultaneous_streams int, max_quality text,
  devices text[], japanese_commentary boolean, overseas_viewing text,
  cancellation jsonb, campaign jsonb, official_url text, affiliate_id text,
  verified_at date not null,                 -- 表示必須
  notes jsonb
);

create table broadcasts ( match_id text, service_id text, region text, primary key (match_id, service_id, region) );

create table web3_services ( id text primary key, slug text unique, name text, category text,
  summary jsonb, sport_ids text[], league_ids text[], chains text[], pricing jsonb,
  has_free_plan boolean, token text, wallet text[], languages text[], regions text[],
  features jsonb, how_to jsonb, benefits jsonb, risks jsonb, official_url text,
  affiliate_id text, verified_at date );

create table fan_tokens ( id text primary key, symbol text, team_id text, sport_id text,
  platform text, chain text, utility jsonb, official_url text, verified_at date );

create table nfts ( id text primary key, name text, sport_id text, chain text,
  marketplace text, summary jsonb, official_url text, verified_at date );

create table affiliate_links ( id text primary key, campaign text, label jsonb, url text,
  overrides jsonb, variants jsonb, disclosure boolean not null default true, active boolean );

create table affiliate_clicks ( id bigserial primary key, link_id text, placement text,
  variant text, locale text, region text, occurred_at timestamptz default now() );

create table diagnoses ( id text primary key, slug text unique, title jsonb, lead jsonb, disclaimer jsonb );
create table diagnosis_questions ( id text primary key, diagnosis_id text, ordinal int, text jsonb, options jsonb );
create table diagnosis_results ( id text primary key, diagnosis_id text, title jsonb, description jsonb,
  reasons jsonb, sport_ids text[], league_ids text[], team_ids text[], player_ids text[],
  streaming_ids text[], video_ids text[], accent text );

create table chatbot_documents ( id text primary key, kind text, question jsonb, answer jsonb,
  keywords text[], links jsonb, realtime boolean );

create table languages ( code text primary key, hreflang text, country text, label text, rtl boolean, intl text, time_zone text );
create table translations ( key text, locale text, value text, primary key (key, locale) );

create table authors ( id text primary key, name jsonb, role jsonb, bio jsonb, profile_url text );
create table supervisors ( id text primary key, name jsonb, credential jsonb, profile_url text );

create table users ( id uuid primary key, email text unique, created_at timestamptz );
create table favorites ( user_id uuid, entity_type text, entity_id text, primary key (user_id, entity_type, entity_id) );
create table notifications ( id bigserial primary key, user_id uuid, kind text, entity_id text,
  scheduled_for timestamptz, sent_at timestamptz );

create table api_logs ( id bigserial primary key, source text, endpoint text, status int,
  latency_ms int, error text, occurred_at timestamptz default now() );
```

### 設計上の要点

1. **多言語は JSONB の `{ ja, en, ... }`** で保持。言語を増やしてもスキーマ変更が不要
2. **競技差分は `sports` テーブルの JSONB 列**（`standings_columns` / `stat_keys`）。競技追加でテーブルは増えない
3. **`aliases text[]` + GIN インデックス**で表記ゆれ検索
4. **すべての取得データに `fetched_at` / `source` / `provenance`**。UI がこれを必ず表示する
5. **`home_score` は NULL 許容**。未開始と 0-0 を型で区別する

---

## 3. API設計

### 3.1 原則

- **外部APIをブラウザから直接呼ばない。** 必ず `app/api/**` か Server Component 経由
- APIキーは `NEXT_PUBLIC_` を付けない環境変数のみ
- 取得失敗時、古い値を「最新」として返さない（`ok: false` を返し、UI が「更新できていない」と表示する）

### 3.2 データ取得レイヤー（`src/sports/lib/api.ts`）

```ts
fetchWithGuards<T>(fetcher, {
  timeoutMs: 5000,        // タイムアウト
  retries: 2,             // 指数バックオフ（200ms → 400ms）
  source: "API名",
  refreshIntervalSec: 30, // 表示する更新間隔＝実際のポーリング間隔
}): Promise<Result<T>>

type Result<T> =
  | { ok: true;  data: T;       stamp: DataStamp }
  | { ok: false; error: string; stamp: DataStamp }
```

複数データソースの切り替え・重複排除・正規化もこの層で行います。

### 3.3 エンドポイント

| エンドポイント        | メソッド | 内容                       | キャッシュ        |
| --------------------- | -------- | -------------------------- | ----------------- |
| `/api/sports/live`    | GET      | 進行中の試合（正規化済み） | `revalidate = 30` |
| `/sports-sitemap.xml` | GET      | 言語別サイトマップ         | 静的              |
| `/sports-rss.xml`     | GET      | ニュースRSS                | 静的              |

静的書き出し（GitHub Pages）でも動くよう、すべて `export const dynamic = "force-static"` です。

### 3.4 ライブスコアの更新方式

現在の実装は **サーバー側エンドポイントへのポーリング**です。

```
ブラウザ ──(30秒ごと)──► /api/sports/live ──► lib/api.ts ──► 外部API or モック
    │                          │
    │◄── 正規化済みJSON ───────┘
    ▼
 前回との差分を比較 → 得点が変わった試合だけフラッシュ + 最終更新時刻を更新
 取得失敗 → 前回値を保持したまま「更新できていません（表示は前回取得時点）」と明示
```

**WebSocket / SSE ではなくポーリングを選んだ理由：**

- 静的書き出し（GitHub Pages）でもサイト全体が動く必要があった
- 無料APIのレート制限を前提にすると、接続を張り続けても更新頻度は上がらない
- 表示する更新間隔と実際の取得間隔を一致させやすい

サーバー常駐環境（Vercel など）で秒単位の更新が必要になったら、
`LiveTicker` の `useEffect` を SSE 購読に差し替えるだけで移行できます。

### 3.5 モック ⇄ 実API の切り替え

```bash
SPORTS_DATA_SOURCE=mock   # 同梱のモックデータ（既定）
SPORTS_DATA_SOURCE=live   # 外部API
```

`mock` のとき、全ページ上部に「デモデータを表示しています」バナーが出ます。
`usingMockData` フラグは `src/sports/lib/api.ts` から参照できます。
