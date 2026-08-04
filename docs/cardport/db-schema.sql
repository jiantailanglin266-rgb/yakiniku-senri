-- =====================================================================
-- CARD PORT — データベーススキーマ（PostgreSQL / Supabase 想定）
--
-- src/cardport/data/types.ts と 1 対 1 で対応します。
--
-- ■ 履歴管理の方針
--   カード情報・キャンペーン・ランキングは「いつ、何が、どう変わったか」を
--   追えることが金融メディアの信頼性に直結します。
--   上書きだけで済ませず、*_history テーブルへ旧値を残します。
--
-- ■ 実行方法
--   psql "$DATABASE_URL" -f docs/cardport/db-schema.sql
-- =====================================================================

begin;

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 列挙型
-- ---------------------------------------------------------------------
create type card_brand as enum ('visa', 'mastercard', 'jcb', 'amex', 'diners', 'unionpay');
create type card_rank  as enum ('standard', 'gold', 'platinum', 'black', 'debit', 'prepaid', 'virtual', 'business');
create type eligibility_type as enum ('general', 'student', 'young', 'business', 'sole-proprietor');
create type insurance_condition as enum ('auto', 'usage', 'none');
create type news_kind as enum ('official', 'press', 'campaign', 'editorial', 'comparison', 'sponsored');
create type audit_action as enum ('insert', 'update', 'delete');

-- ---------------------------------------------------------------------
-- 多言語テキスト
--   翻訳は translations に集約し、本体テーブルには翻訳キーだけを持たせます。
--   言語を増やしても本体テーブルの列は増えません。
-- ---------------------------------------------------------------------
create table languages (
  code         text primary key,             -- 'ja', 'en', 'zh-cn' …
  hreflang     text not null,
  country_code text not null,                -- 国旗に使う ISO 3166-1 alpha-2
  label        text not null,                -- その言語での自称
  label_ja     text not null,
  is_rtl       boolean not null default false,
  intl_locale  text not null,
  currency     text not null,
  sort_order   integer not null,
  is_active    boolean not null default true
);

create table translations (
  id          uuid primary key default gen_random_uuid(),
  entity_type text not null,                 -- 'card', 'news', 'faq' …
  entity_id   uuid not null,
  field       text not null,                 -- 'name', 'summary' …
  locale      text not null references languages(code),
  value       text not null,
  updated_at  timestamptz not null default now(),
  unique (entity_type, entity_id, field, locale)
);
create index translations_entity_idx on translations (entity_type, entity_id);

-- ---------------------------------------------------------------------
-- マスタ
-- ---------------------------------------------------------------------
create table card_issuers (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  issuer_type  text not null,                -- bank / credit / distribution / telecom / fintech / crypto
  official_url text,
  created_at   timestamptz not null default now()
);

create table card_brands (
  code       card_brand primary key,
  label      text not null,
  sort_order integer not null
);

create table card_categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,           -- ⚠ cards.slug と衝突させないこと
  is_ranking boolean not null default true,
  accent     text not null,
  sort_order integer not null
);

-- ---------------------------------------------------------------------
-- カード
-- ---------------------------------------------------------------------
create table cards (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  issuer_id         uuid not null references card_issuers(id) on delete restrict,
  rank              card_rank not null,

  -- 券面プレースホルダー（実画像は card_assets で管理）
  art_from          text not null,
  art_via           text not null,
  art_to            text not null,
  art_texture       text not null,

  issue_days        integer not null default 0,
  fx_fee            numeric(4,2) not null default 0,
  available_regions text[] not null default '{JP}',
  official_url      text not null,
  affiliate_link_id uuid,

  is_published      boolean not null default false,
  verified_on       date not null,
  updated_on        date not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint cards_fx_fee_range check (fx_fee >= 0 and fx_fee <= 10)
);

create table card_fees (
  card_id          uuid primary key references cards(id) on delete cascade,
  annual_fee       integer not null,          -- 税込・円
  first_year_fee   integer not null,
  family_card_fee  integer not null default 0,
  etc_fee          integer not null default 0,
  -- 無条件無料なら null。「年間◯円以上の利用で無料」などの条件文
  fee_waiver_key   text,
  constraint card_fees_nonnegative check (annual_fee >= 0 and first_year_fee >= 0),
  constraint card_fees_first_year check (first_year_fee <= annual_fee)
);

create table card_rewards (
  card_id             uuid primary key references cards(id) on delete cascade,
  base_rate           numeric(4,2) not null,
  max_rate            numeric(4,2) not null,
  point_expiry_months integer,
  constraint card_rewards_rate_order check (max_rate >= base_rate)
);

create table card_miles (
  card_id      uuid primary key references cards(id) on delete cascade,
  mile_rate    numeric(4,2) not null default 0,  -- 1ポイント→何マイル
  transfer_fee integer not null default 0
);

create table card_insurance (
  id           uuid primary key default gen_random_uuid(),
  card_id      uuid not null references cards(id) on delete cascade,
  kind         text not null,                    -- travel-domestic / travel-overseas / shopping
  amount       bigint not null default 0,        -- 補償上限（円）
  condition    insurance_condition not null default 'none',
  unique (card_id, kind)
);

create table card_lounges (
  id      uuid primary key default gen_random_uuid(),
  card_id uuid not null references cards(id) on delete cascade,
  label_key text not null
);

create table card_features (
  card_id          uuid primary key references cards(id) on delete cascade,
  touch_payment    boolean not null default true,
  mobile_payments  text[] not null default '{}',
  electronic_money text[] not null default '{}'
);

create table card_eligibility (
  card_id uuid not null references cards(id) on delete cascade,
  type    eligibility_type not null,
  primary key (card_id, type)
);

create table card_brand_map (
  card_id uuid not null references cards(id) on delete cascade,
  brand   card_brand not null references card_brands(code),
  primary key (card_id, brand)
);

create table card_category_map (
  card_id     uuid not null references cards(id) on delete cascade,
  category_id uuid not null references card_categories(id) on delete cascade,
  primary key (card_id, category_id)
);

-- 法人カード固有
create table card_business (
  card_id                 uuid primary key references cards(id) on delete cascade,
  additional_cards        integer not null default 0,
  accounting_integrations text[] not null default '{}',
  receipt_management      boolean not null default false,
  virtual_cards           boolean not null default false
);

-- 暗号資産連携
create table card_crypto (
  card_id          uuid primary key references cards(id) on delete cascade,
  supported_assets text[] not null default '{}',
  stablecoin       boolean not null default false
);

-- 実際の券面画像（提供元の許諾を必ず記録すること）
create table card_assets (
  id            uuid primary key default gen_random_uuid(),
  card_id       uuid not null references cards(id) on delete cascade,
  url           text not null,
  width         integer not null,
  height        integer not null,
  -- 使用許諾の根拠。空のまま公開してはいけません
  license_note  text not null,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- キャンペーン
-- ---------------------------------------------------------------------
create table card_campaigns (
  id           uuid primary key default gen_random_uuid(),
  card_id      uuid not null references cards(id) on delete cascade,
  max_value    integer not null default 0,     -- 獲得可能額の目安（円相当）
  starts_on    date,
  ends_on      date not null,
  official_url text not null,
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index card_campaigns_ends_on_idx on card_campaigns (ends_on);

-- 達成条件は1行1条件で持ち、必ず全文を表示します
create table card_campaign_conditions (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references card_campaigns(id) on delete cascade,
  sort_order  integer not null,
  text_key    text not null
);

-- ---------------------------------------------------------------------
-- 評価・ランキング
-- ---------------------------------------------------------------------
create table ranking_criteria (
  axis        text primary key,               -- reward / fee / benefit / insurance / usability / trust
  label_key   text not null,
  definition_key text not null,
  sort_order  integer not null
);

create table card_scores (
  card_id uuid not null references cards(id) on delete cascade,
  axis    text not null references ranking_criteria(axis),
  score   numeric(3,2) not null,
  primary key (card_id, axis),
  constraint card_scores_range check (score >= 0 and score <= 5)
);

create table ranking_weights (
  category_id uuid references card_categories(id) on delete cascade,
  axis        text not null references ranking_criteria(axis),
  weight      numeric(5,3) not null,
  primary key (category_id, axis)
);

-- 算出結果のスナップショット。順位の変遷を後から説明できるようにします
create table rankings (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid references card_categories(id) on delete cascade,
  card_id     uuid not null references cards(id) on delete cascade,
  position    integer not null,
  score       numeric(4,2) not null,
  computed_at timestamptz not null default now()
);
create index rankings_lookup_idx on rankings (category_id, computed_at desc);

create table card_comparisons (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  card_ids   uuid[] not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- レビュー
--   ⚠ AggregateRating を出力してよいのは、このテーブルに
--     検証済み（is_verified）のレコードが十分にある場合だけです。
-- ---------------------------------------------------------------------
create table card_reviews (
  id           uuid primary key default gen_random_uuid(),
  card_id      uuid not null references cards(id) on delete cascade,
  rating       integer not null,
  posted_on    date not null,
  is_verified  boolean not null default false,
  is_published boolean not null default false,
  constraint card_reviews_rating_range check (rating between 1 and 5)
);

-- ---------------------------------------------------------------------
-- 記事・ニュース・動画
-- ---------------------------------------------------------------------
create table authors (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  is_supervisor boolean not null default false,
  created_at    timestamptz not null default now()
);

create table supervisors (
  author_id  uuid primary key references authors(id) on delete cascade,
  -- 実在する資格のみを記載すること。無い場合は空配列
  credentials text[] not null default '{}'
);

create table news_sources (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  url          text,
  is_official  boolean not null default false
);

create table news (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  category        text not null,
  kind            news_kind not null,
  tags            text[] not null default '{}',
  source_id       uuid references news_sources(id),
  author_id       uuid not null references authors(id),
  supervisor_id   uuid references authors(id),
  -- 同じ発表を扱う記事をまとめるキー（重複ニュースの検出）
  story_key       text,
  reading_minutes integer not null default 3,
  published_at    timestamptz not null,
  updated_at      timestamptz not null,
  is_published    boolean not null default false
);
create index news_story_idx on news (story_key);
create index news_published_idx on news (published_at desc);

create table news_related_cards (
  news_id uuid not null references news(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  primary key (news_id, card_id)
);

create table articles (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  level           text not null,             -- beginner / intermediate / advanced
  author_id       uuid not null references authors(id),
  reading_minutes integer not null default 5,
  updated_on      date not null,
  is_published    boolean not null default false
);

create table videos (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  youtube_id       text,
  is_short         boolean not null default false,
  duration_seconds integer not null,
  published_at     timestamptz not null,
  is_published     boolean not null default false
);

create table video_chapters (
  id         uuid primary key default gen_random_uuid(),
  video_id   uuid not null references videos(id) on delete cascade,
  at_seconds integer not null,
  label_key  text not null
);

create table video_cards (
  video_id uuid not null references videos(id) on delete cascade,
  card_id  uuid not null references cards(id) on delete cascade,
  primary key (video_id, card_id)
);

-- ---------------------------------------------------------------------
-- サービス
-- ---------------------------------------------------------------------
create table financial_tools (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  category       text not null,
  free_plan      boolean not null default false,
  platforms      text[] not null default '{}',
  integrations   text[] not null default '{}',
  languages      text[] not null default '{}',
  business_ready boolean not null default false,
  official_url   text not null,
  affiliate_link_id uuid,
  is_published   boolean not null default false
);

create table payment_services (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  service_type text not null,              -- qr / wallet / bnpl / transit / bank-pay
  base_rate    numeric(4,2) not null default 0,
  official_url text not null,
  is_published boolean not null default false
);

create table payment_service_cards (
  service_id uuid not null references payment_services(id) on delete cascade,
  card_id    uuid not null references cards(id) on delete cascade,
  primary key (service_id, card_id)
);

create table web3_services (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  category        text not null,
  regions         text[] not null default '{}',
  fiat_currencies text[] not null default '{}',
  crypto_assets   text[] not null default '{}',
  card_brands     card_brand[] not null default '{}',
  has_app         boolean not null default false,
  official_url    text not null,
  is_published    boolean not null default false
);

-- リスクと規制注記は必須。空では公開できません
create table web3_service_risks (
  id         uuid primary key default gen_random_uuid(),
  service_id uuid not null references web3_services(id) on delete cascade,
  sort_order integer not null,
  text_key   text not null
);

-- ---------------------------------------------------------------------
-- 診断・シミュレーター
-- ---------------------------------------------------------------------
create table diagnoses (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  accent       text not null,
  pool_categories text[] not null default '{}',
  pool_ranks   card_rank[] not null default '{}',
  is_published boolean not null default false
);

create table diagnosis_questions (
  id           uuid primary key default gen_random_uuid(),
  diagnosis_id uuid not null references diagnoses(id) on delete cascade,
  sort_order   integer not null,
  question_key text not null,
  help_key     text
);

create table diagnosis_options (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references diagnosis_questions(id) on delete cascade,
  sort_order  integer not null,
  label_key   text not null,
  -- 軸ごとの重み。{"reward": 5, "fee": 2} の形
  weights     jsonb not null default '{}',
  -- 必須条件。満たさないカードは減点（除外はしない）
  requires    jsonb not null default '{}'
);

-- 集計用（個人を特定できる情報は保存しません）
create table diagnosis_results (
  id           uuid primary key default gen_random_uuid(),
  diagnosis_id uuid not null references diagnoses(id) on delete cascade,
  answer_code  text not null,               -- 回答を圧縮した文字列
  locale       text not null references languages(code),
  top_card_id  uuid references cards(id),
  created_at   timestamptz not null default now()
);

create table simulations (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  accent       text not null,
  method_key   text not null,
  is_published boolean not null default false
);

-- ---------------------------------------------------------------------
-- FAQ・固定ページ
-- ---------------------------------------------------------------------
create table faqs (
  id           uuid primary key default gen_random_uuid(),
  scope        text not null,               -- site / card / business / web3 / point / diagnosis
  sort_order   integer not null,
  is_published boolean not null default true
);

create table pages (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  updated_on   date not null,
  is_published boolean not null default true
);

-- ---------------------------------------------------------------------
-- アフィリエイト
-- ---------------------------------------------------------------------
create table affiliate_links (
  id           uuid primary key default gen_random_uuid(),
  key          text not null unique,        -- コード側の affiliateId
  program      text not null,
  url          text,                        -- 空なら未提携（公式サイトへ nofollow）
  region_urls  jsonb not null default '{}', -- {"JP": "...", "US": "..."}
  variants     jsonb not null default '[]', -- A/Bテスト
  expires_on   date,
  last_checked_at timestamptz,              -- リンク切れ検知の最終確認
  is_healthy   boolean not null default true,
  created_at   timestamptz not null default now()
);

alter table cards
  add constraint cards_affiliate_fk
  foreign key (affiliate_link_id) references affiliate_links(id) on delete set null;

alter table financial_tools
  add constraint tools_affiliate_fk
  foreign key (affiliate_link_id) references affiliate_links(id) on delete set null;

create table affiliate_clicks (
  id           bigserial primary key,
  link_id      uuid references affiliate_links(id) on delete set null,
  item_id      text not null,               -- カード・サービスの識別子
  placement    text not null,               -- ranking / card-detail / comparison …
  position     integer not null default 0,
  locale       text not null,
  region       text,
  is_sponsored boolean not null default false,
  occurred_at  timestamptz not null default now()
);
create index affiliate_clicks_time_idx on affiliate_clicks (occurred_at desc);
create index affiliate_clicks_item_idx on affiliate_clicks (item_id, placement);

-- ---------------------------------------------------------------------
-- 利用者
--   ⚠ カード番号・セキュリティコード・暗証番号・本人確認書類は
--     いかなる形でも保存しません。そのための列を作らないでください。
-- ---------------------------------------------------------------------
create table users (
  id         uuid primary key default gen_random_uuid(),
  email      text unique,
  locale     text references languages(code),
  created_at timestamptz not null default now()
);

create table favorites (
  user_id    uuid not null references users(id) on delete cascade,
  card_id    uuid not null references cards(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, card_id)
);

-- ---------------------------------------------------------------------
-- 運用ログ
-- ---------------------------------------------------------------------
create table api_logs (
  id           bigserial primary key,
  service      text not null,              -- youtube / supabase / chat …
  endpoint     text not null,
  status_code  integer,
  error_message text,
  occurred_at  timestamptz not null default now()
);
create index api_logs_time_idx on api_logs (occurred_at desc);

create table update_logs (
  id          bigserial primary key,
  entity_type text not null,
  entity_id   uuid not null,
  action      audit_action not null,
  actor_id    uuid references users(id),
  -- 変更前後の差分。上書きだけで済ませないための要。
  before      jsonb,
  after       jsonb,
  occurred_at timestamptz not null default now()
);
create index update_logs_entity_idx on update_logs (entity_type, entity_id, occurred_at desc);

-- ---------------------------------------------------------------------
-- 履歴テーブル
--   年会費や還元率が「いつ変わったか」を後から説明できるようにします。
-- ---------------------------------------------------------------------
create table card_fees_history (
  id             bigserial primary key,
  card_id        uuid not null references cards(id) on delete cascade,
  annual_fee     integer not null,
  first_year_fee integer not null,
  fee_waiver_key text,
  valid_from     timestamptz not null,
  valid_to       timestamptz
);

create table card_rewards_history (
  id         bigserial primary key,
  card_id    uuid not null references cards(id) on delete cascade,
  base_rate  numeric(4,2) not null,
  max_rate   numeric(4,2) not null,
  valid_from timestamptz not null,
  valid_to   timestamptz
);

create table card_campaigns_history (
  id          bigserial primary key,
  campaign_id uuid not null references card_campaigns(id) on delete cascade,
  snapshot    jsonb not null,
  valid_from  timestamptz not null,
  valid_to    timestamptz
);

-- 変更前の値を履歴へ退避する共通トリガ
create or replace function record_fee_history() returns trigger as $$
begin
  update card_fees_history
     set valid_to = now()
   where card_id = old.card_id and valid_to is null;

  insert into card_fees_history (card_id, annual_fee, first_year_fee, fee_waiver_key, valid_from)
  values (old.card_id, old.annual_fee, old.first_year_fee, old.fee_waiver_key, now());

  return new;
end;
$$ language plpgsql;

create trigger card_fees_history_trigger
  before update on card_fees
  for each row
  when (old.annual_fee is distinct from new.annual_fee
     or old.first_year_fee is distinct from new.first_year_fee
     or old.fee_waiver_key is distinct from new.fee_waiver_key)
  execute function record_fee_history();

create or replace function record_reward_history() returns trigger as $$
begin
  update card_rewards_history
     set valid_to = now()
   where card_id = old.card_id and valid_to is null;

  insert into card_rewards_history (card_id, base_rate, max_rate, valid_from)
  values (old.card_id, old.base_rate, old.max_rate, now());

  return new;
end;
$$ language plpgsql;

create trigger card_rewards_history_trigger
  before update on card_rewards
  for each row
  when (old.base_rate is distinct from new.base_rate or old.max_rate is distinct from new.max_rate)
  execute function record_reward_history();

-- ---------------------------------------------------------------------
-- Row Level Security（Supabase 前提）
--   公開データは誰でも読める。書き込みは認証済みの編集者だけ。
-- ---------------------------------------------------------------------
alter table cards            enable row level security;
alter table card_campaigns   enable row level security;
alter table news             enable row level security;
alter table affiliate_clicks enable row level security;
alter table users            enable row level security;
alter table favorites        enable row level security;

create policy cards_public_read on cards
  for select using (is_published = true);

create policy campaigns_public_read on card_campaigns
  for select using (is_published = true);

create policy news_public_read on news
  for select using (is_published = true);

-- クリック計測は匿名で書き込めますが、読み出しは管理者だけです
create policy clicks_insert_anon on affiliate_clicks
  for insert with check (true);

create policy favorites_owner on favorites
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

commit;
