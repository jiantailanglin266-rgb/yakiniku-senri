# DB 設計（Supabase / PostgreSQL）

現在コンテンツは `src/portal/data/*.ts` に置いています（型は `src/portal/lib/types.ts`）。
管理画面から編集できるようにする段階で、このスキーマへ移行します。

---

## 設計の考え方

### 1. 翻訳は別テーブルに切り出す

`title_ja`, `title_en`, `title_ko` … と列を増やすと、言語追加のたびに `ALTER TABLE` が必要になります。
`(entity_type, entity_id, field, locale)` を主キーとする単一の翻訳テーブルにすると、
言語追加はデータ投入だけで済みます。

### 2. 「未確認」を NULL と false で区別する

`supports_staking BOOLEAN` だと「非対応」と「未調査」が同じになります。
`support_level` 型（`yes` / `no` / `partial` / `unknown`）を使い、
未調査を「非対応」と書いてしまう事故を型で防ぎます。

### 3. 事実確認日を必須にする

手数料などの変動する情報には `checked_at` を持たせ、NULL のあいだは
画面に「未検証」バッジを出します。

### 4. 市場データは DB に持たない

価格・時価総額は外部APIから取得してキャッシュします。
DB に入れると更新の責務が二重化し、どちらが正か分からなくなります。

---

## スキーマ

```sql
-- =============================================================================
-- 列挙型
-- =============================================================================
create type support_level  as enum ('yes', 'no', 'partial', 'unknown');
create type exchange_region as enum ('domestic', 'overseas');
create type learn_level     as enum ('beginner', 'intermediate', 'advanced');
create type wallet_type     as enum ('hot-mobile', 'hot-extension', 'hardware', 'smart-contract');
create type dataset_status  as enum ('sample', 'verified');

-- =============================================================================
-- 翻訳（全エンティティ共通）
--   言語を足すときに ALTER TABLE が不要になります。
-- =============================================================================
create table translations (
  entity_type text        not null,   -- 'coin' | 'exchange' | 'news' | ...
  entity_id   uuid        not null,
  field       text        not null,   -- 'name' | 'summary' | 'body' | ...
  locale      text        not null,   -- 'ja' | 'en' | 'ko' | ...
  value       text        not null,
  -- 機械翻訳をそのまま出さず、人手で直したものを優先するための印
  is_machine  boolean     not null default false,
  reviewed_at timestamptz,
  updated_at  timestamptz not null default now(),
  primary key (entity_type, entity_id, field, locale)
);
create index on translations (entity_type, entity_id);

-- =============================================================================
-- 通貨
-- =============================================================================
create table coins (
  id                 uuid primary key default gen_random_uuid(),
  external_id        text unique not null,   -- CoinGecko の id
  slug               text unique not null,
  symbol             text not null,
  color              text not null,
  categories         text[] not null default '{}',
  -- 検索の表記ゆれ（カタカナ・別名・旧名）
  aliases            text[] not null default '{}',
  max_supply         numeric,
  launched_at        date,
  website_url        text,
  whitepaper_url     text,
  explorer_url       text,
  github_url         text,
  is_published       boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index on coins (symbol);

-- 通貨と取引所の取扱関係
create table coin_listings (
  coin_id     uuid references coins(id) on delete cascade,
  exchange_id uuid references exchanges(id) on delete cascade,
  checked_at  date,
  primary key (coin_id, exchange_id)
);

-- =============================================================================
-- 取引所
-- =============================================================================
create table exchanges (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  name            text not null,
  region          exchange_region not null,
  color           text not null,
  logo_url        text,
  official_url    text not null,

  -- 編集部評価（ユーザーレビューではありません。混同しないよう列名で区別）
  editorial_rating       numeric(2,1) check (editorial_rating between 0 and 5),
  rating_fees            numeric(2,1),
  rating_assets          numeric(2,1),
  rating_security        numeric(2,1),
  rating_usability       numeric(2,1),

  listed_assets   integer,
  spot            support_level not null default 'unknown',
  margin          support_level not null default 'unknown',
  futures         support_level not null default 'unknown',
  copy_trading    support_level not null default 'unknown',
  savings         support_level not null default 'unknown',
  staking         support_level not null default 'unknown',
  lending         support_level not null default 'unknown',
  mobile_app      support_level not null default 'unknown',
  japanese        support_level not null default 'unknown',
  max_leverage    text,

  beginner_friendly boolean not null default false,
  -- 数値そのものは変動するため翻訳テーブル側に文言として持たせ、
  -- 「公式サイトで要確認」を既定値にできるようにします
  checked_at      date,
  is_published    boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- =============================================================================
-- ウォレット / ツール
-- =============================================================================
create table wallets (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  wallet_type   wallet_type not null,
  color         text not null,
  chains        text[] not null default '{}',
  mobile        support_level not null default 'unknown',
  extension     support_level not null default 'unknown',
  hardware      support_level not null default 'unknown',
  nft           support_level not null default 'unknown',
  swap          support_level not null default 'unknown',
  staking       support_level not null default 'unknown',
  beginner_friendly boolean not null default false,
  official_url  text not null,
  checked_at    date,
  is_published  boolean not null default false
);

create table tools (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,
  name           text not null,
  category       text not null,      -- 'dex' | 'defi' | 'tax' | ...
  color          text not null,
  chains         text[] not null default '{}',
  languages      text[] not null default '{}',
  free_plan      support_level not null default 'unknown',
  mobile         support_level not null default 'unknown',
  wallet_connect support_level not null default 'unknown',
  official_url   text not null,
  checked_at     date,
  is_published   boolean not null default false
);

create table tool_alternatives (
  tool_id        uuid references tools(id) on delete cascade,
  alternative_id uuid references tools(id) on delete cascade,
  primary key (tool_id, alternative_id),
  check (tool_id <> alternative_id)
);

-- =============================================================================
-- 記事・ニュース
-- =============================================================================
create table authors (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  -- 実在の裏付けが取れない経歴は入れない運用にします
  url          text,
  is_published boolean not null default true
);

create table news_articles (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  category     text not null,
  labels       text[] not null default '{}',   -- 'breaking' | 'regulation' | ...
  tags         text[] not null default '{}',
  outlet       text not null,                  -- 情報元。必須
  source_url   text,                           -- 一次情報
  published_at timestamptz not null,
  updated_at   timestamptz,
  checked_at   timestamptz,
  image_url    text,
  reading_minutes integer not null default 3,
  author_id    uuid references authors(id),
  reviewer_id  uuid references authors(id),
  -- 同じ出来事の記事を束ねるキー。見出しの正規化＋公開時刻の近さから自動生成
  story_key    text,
  is_published boolean not null default false
);
create index on news_articles (published_at desc);
create index on news_articles (story_key);

create table news_coins (
  news_id uuid references news_articles(id) on delete cascade,
  coin_id uuid references coins(id) on delete cascade,
  primary key (news_id, coin_id)
);

create table learn_articles (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  level           learn_level not null,
  author_id       uuid references authors(id),
  reviewer_id     uuid references authors(id),
  published_at    timestamptz not null,
  updated_at      timestamptz not null,
  reading_minutes integer not null default 5,
  is_published    boolean not null default false
);

create table videos (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  youtube_id   text,                       -- NULL のあいだは埋め込みも構造化データも出さない
  is_shorts    boolean not null default false,
  duration_sec integer not null,
  channel      text not null,
  published_at timestamptz not null,
  is_published boolean not null default false
);

-- =============================================================================
-- 診断
-- =============================================================================
create table diagnoses (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  sort_order   integer not null default 0,
  is_published boolean not null default false
);

create table diagnosis_questions (
  id           uuid primary key default gen_random_uuid(),
  diagnosis_id uuid references diagnoses(id) on delete cascade,
  sort_order   integer not null
);

create table diagnosis_results (
  id           uuid primary key default gen_random_uuid(),
  diagnosis_id uuid references diagnoses(id) on delete cascade,
  key          text not null,              -- 'beginner' | 'trader' | ...
  sort_order   integer not null,
  unique (diagnosis_id, key)
);

create table diagnosis_options (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid references diagnosis_questions(id) on delete cascade,
  sort_order  integer not null
);

-- 選択肢 → 結果への加点
create table diagnosis_scores (
  option_id uuid references diagnosis_options(id) on delete cascade,
  result_id uuid references diagnosis_results(id) on delete cascade,
  points    integer not null,
  primary key (option_id, result_id)
);

-- 結果からの誘導先
create table diagnosis_recommendations (
  result_id   uuid references diagnosis_results(id) on delete cascade,
  entity_type text not null,               -- 'exchange' | 'wallet' | 'tool' | 'learn' | 'coin'
  entity_id   uuid not null,
  sort_order  integer not null default 0,
  primary key (result_id, entity_type, entity_id)
);

-- =============================================================================
-- 収益化
-- =============================================================================
create table affiliate_links (
  id           uuid primary key default gen_random_uuid(),
  key          text unique not null,       -- 'aff-bitbank'
  program      text not null,
  -- 実URLは環境変数か Vault に置き、DBには参照キーだけを持たせます
  env_key      text not null,
  fallback_url text not null,
  starts_at    timestamptz,
  ends_at      timestamptz,
  -- リンク切れ検知バッチの結果
  last_checked_at timestamptz,
  last_status     integer
);

create table affiliate_clicks (
  id           bigserial primary key,
  link_key     text not null,
  placement    text not null,              -- 'exchange-compare-domestic' | ...
  variant      text,                       -- A/B テスト用
  locale       text not null,
  occurred_at  timestamptz not null default now()
);
create index on affiliate_clicks (link_key, placement, occurred_at desc);

create table campaigns (
  id           uuid primary key default gen_random_uuid(),
  target_type  text not null,              -- 'exchange' | 'tool' | 'wallet'
  target_id    uuid not null,
  starts_at    timestamptz not null,
  ends_at      timestamptz,
  affiliate_key text references affiliate_links(key),
  -- 条件を確認できていないキャンペーンを公開しないための歯止め
  checked_at   date,
  is_published boolean not null default false
);

-- =============================================================================
-- 運用
-- =============================================================================
create table page_meta (
  entity_type text not null,
  entity_id   uuid not null,
  locale      text not null,
  title       text,
  description text,
  og_image    text,
  noindex     boolean not null default false,
  primary key (entity_type, entity_id, locale)
);

-- 管理画面の全操作を残します。誰が何をいつ変えたか追えないと、
-- 誤った数値が入ったときに原因を特定できません。
create table audit_logs (
  id          bigserial primary key,
  actor_id    uuid not null,
  action      text not null,               -- 'create' | 'update' | 'delete' | 'publish'
  entity_type text not null,
  entity_id   uuid,
  diff        jsonb,
  occurred_at timestamptz not null default now(),
  ip_address  inet
);
create index on audit_logs (entity_type, entity_id, occurred_at desc);

-- =============================================================================
-- Row Level Security
--   公開済みだけを anon に見せ、書き込みは編集者ロールに限定します。
-- =============================================================================
alter table coins           enable row level security;
alter table exchanges       enable row level security;
alter table news_articles   enable row level security;
alter table learn_articles  enable row level security;

create policy "public reads published coins"
  on coins for select using (is_published = true);

create policy "editors write coins"
  on coins for all
  using (auth.jwt() ->> 'role' in ('editor', 'admin'))
  with check (auth.jwt() ->> 'role' in ('editor', 'admin'));
-- 他テーブルも同様
```

---

## 移行の順序

1. `translations` と `coins` を作り、`src/portal/data/coins.ts` から投入
2. `src/portal/data/*.ts` を Supabase 読み取りに置き換える
   （`getCoin()` 等の関数シグネチャを維持すれば UI 側は変更不要）
3. 管理画面に**認証を先に**入れる（Supabase Auth）
4. RLS と `audit_logs` を有効にしてから、書き込み機能を公開する
