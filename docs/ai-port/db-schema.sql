-- ============================================================
-- AI PORT — DBスキーマ案（PostgreSQL / Supabase 想定）
--
-- ⚠ 現在のサイトはこのDBを使っていません。
--   表示データはすべて src/data/ai-port/ のTypeScriptファイルにあり、
--   ビルド時にzodで検証されています。
--   このファイルは「CMS化するときの設計」であり、実装済みではありません。
--
-- ■ 移行の考え方
--   src/data/ai-port/*.ts の getXxx() / findXxx() の中身だけを
--   このスキーマへのクエリに差し替えれば、UI側の変更は不要です。
--
-- ■ 事実性のルールをスキーマ側でも守る
--   - 料金の「金額」カラムは作りません（変動が速く、古い数字は実害）
--   - レビュー点数・星の数のカラムも作りません（実データのない評価は出せない）
--   - 未確認の項目は NULL。NOT NULL 制約を付けず、「未確認」を表現できるようにします
-- ============================================================

-- ------------------------------------------------------------
-- 分類
-- ------------------------------------------------------------

create table tool_categories (
  id            text primary key,              -- 'chat', 'image', ...
  name          text not null,
  name_en       text not null,
  accent        text not null,
  description   text not null,
  sort_order    int  not null default 0
);

create table topics (
  slug          text primary key,              -- 'ai-agent', 'web3', ...
  name          text not null,
  name_en       text not null,
  accent        text not null,
  summary       text not null,
  topic_group   text not null,                 -- 'ai' | 'industry' | 'web3'
  queries       text[] not null default '{}',  -- ニュース収集の検索語
  questions     text[] not null default '{}',  -- AEO用の想定質問
  sort_order    int  not null default 0
);

create table topic_tool_categories (
  topic_slug    text references topics(slug) on delete cascade,
  category_id   text references tool_categories(id) on delete cascade,
  primary key (topic_slug, category_id)
);

-- ------------------------------------------------------------
-- AIツール
-- ------------------------------------------------------------

create type pricing_model as enum ('free-tier', 'paid', 'contact');

create table tools (
  slug          text primary key,
  name          text not null,
  maker         text not null,
  url           text not null check (url like 'https://%'),
  summary       text not null,
  best_for      text not null,
  strengths     text[] not null default '{}',
  pricing       pricing_model not null,

  -- ⚠ 3値。NULL は「編集部で未確認」を意味します。
  --   推測で true / false を入れないでください。
  japanese_ui   boolean,
  has_api       boolean,
  mobile_app    boolean,
  team_plan     boolean,

  -- 編集部が「まず試す価値がある」と考える度合い（1〜3）。人気度ではありません。
  editor_pick   smallint not null check (editor_pick between 1 and 3),

  -- 各項目を最後に公式サイトで確認した日
  verified_at   date,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()

  -- ⚠ price / rating / review_count は意図的に持ちません
);

create table tool_categories_map (
  tool_slug     text references tools(slug) on delete cascade,
  category_id   text references tool_categories(id) on delete cascade,
  is_primary    boolean not null default false,
  primary key (tool_slug, category_id)
);

create index on tool_categories_map (category_id);

-- ------------------------------------------------------------
-- 解説記事（自社の一次コンテンツ）
-- ------------------------------------------------------------

create table articles (
  slug          text primary key,
  title         text not null,
  description   text not null,
  topic_slug    text not null references topics(slug),
  lead          text not null,                 -- 冒頭の結論（AEOでここが引用される）
  key_points    text[] not null default '{}',  -- 3行の要点
  minutes       smallint not null,
  published_at  date not null,
  updated_at    date not null,
  status        text not null default 'draft'  -- 'draft' | 'published'
);

create table article_sections (
  id            bigserial primary key,
  article_slug  text not null references articles(slug) on delete cascade,
  position      int  not null,
  heading       text not null,
  paragraphs    text[] not null default '{}',
  bullet_list   text[] not null default '{}',
  unique (article_slug, position)
);

-- 手順（あると HowTo 構造化データを出力します）
create table article_steps (
  id            bigserial primary key,
  section_id    bigint not null references article_sections(id) on delete cascade,
  position      int  not null,
  name          text not null,
  body          text not null,
  unique (section_id, position)
);

create table article_faqs (
  id            bigserial primary key,
  article_slug  text not null references articles(slug) on delete cascade,
  position      int  not null,
  question      text not null,
  answer        text not null,
  unique (article_slug, position)
);

create table article_tools (
  article_slug  text references articles(slug) on delete cascade,
  tool_slug     text references tools(slug) on delete cascade,
  primary key (article_slug, tool_slug)
);

-- ------------------------------------------------------------
-- ニュース収集
-- ------------------------------------------------------------

create table vendors (
  id            text primary key,              -- 'openai', 'anthropic', ...
  name          text not null,
  terms         text[] not null default '{}',  -- ニュース検索に使う語
  accent        text not null,
  site          text not null,
  official_feed text,
  sort_order    int not null default 0
);

create table feeds (
  id            text primary key,
  label         text not null,
  url           text not null,
  kind          text not null,                 -- 'official' | 'aggregator' | 'community'
  vendor_id     text references vendors(id),
  lang          text not null default 'ja',
  enabled       boolean not null default true,
  last_fetched_at timestamptz,
  last_error    text                           -- 直近の失敗理由（運用の可視化用）
);

-- ⚠ 本文は保存しません。見出し・要約の一部・配信元・日時とリンクだけです。
--   外部記事の本文を保存・再配信すると、他社の記事を自社コンテンツとして
--   配っていることになります。
create table news_items (
  id            bigserial primary key,
  feed_id       text not null references feeds(id) on delete cascade,
  title         text not null,
  link          text not null,
  summary       text not null default '',      -- 240文字まで
  source_name   text,
  image_url     text,
  published_at  timestamptz not null,
  -- 見出しを正規化したキー。同じ記事が複数フィードから届くための重複除去に使います。
  dedupe_key    text not null,
  fetched_at    timestamptz not null default now(),
  unique (dedupe_key)
);

create index on news_items (published_at desc);

create table news_item_vendors (
  news_item_id  bigint references news_items(id) on delete cascade,
  vendor_id     text references vendors(id) on delete cascade,
  primary key (news_item_id, vendor_id)
);

-- ------------------------------------------------------------
-- AI診断
-- ------------------------------------------------------------

create table diagnoses (
  slug          text primary key,
  title         text not null,
  lead          text not null,
  description   text not null,
  minutes       smallint not null,
  accent        text not null,
  sort_order    int not null default 0
);

create table diagnosis_questions (
  id            bigserial primary key,
  diagnosis_slug text not null references diagnoses(slug) on delete cascade,
  key           text not null,                 -- 'q1'
  position      int  not null,
  text          text not null,
  help          text,
  unique (diagnosis_slug, key)
);

create table diagnosis_results (
  id            bigserial primary key,
  diagnosis_slug text not null references diagnoses(slug) on delete cascade,
  key           text not null,                 -- 軸ID
  title         text not null,
  catchphrase   text not null,
  description   text not null,
  actions       text[] not null default '{}',
  accent        text not null,
  unique (diagnosis_slug, key)
);

create table diagnosis_choices (
  id            bigserial primary key,
  question_id   bigint not null references diagnosis_questions(id) on delete cascade,
  key           text not null,                 -- 'a'
  label         text not null,
  -- 軸ID → 加点。参照整合性はアプリ側（テスト）で検査します。
  scores        jsonb not null default '{}'::jsonb,
  unique (question_id, key)
);

create table diagnosis_result_tools (
  result_id     bigint references diagnosis_results(id) on delete cascade,
  tool_slug     text references tools(slug) on delete cascade,
  position      int not null default 0,
  primary key (result_id, tool_slug)
);

-- ⚠ 回答内容は保存しません。
--   採点はブラウザ内で完結しており、その旨を画面に明記しています。
--   集計が必要になった場合も、個人を特定しない形（結果の分布のみ）にしてください。

-- ------------------------------------------------------------
-- 広告・アフィリエイト
-- ------------------------------------------------------------

create table ad_slots (
  id            text primary key,
  placement     text not null,                 -- 'in-article' | 'list-footer' | 'sidebar'
  -- ⚠ true なら UI が必ず「PR」を表示します（景品表示法・ステマ規制）。
  sponsored     boolean not null default true,
  title         text not null,
  body          text not null,
  cta_label     text not null,
  href          text not null,
  starts_at     timestamptz,
  ends_at       timestamptz,
  enabled       boolean not null default false
);

create table tool_affiliate_links (
  tool_slug     text primary key references tools(slug) on delete cascade,
  href          text not null check (href like 'https://%'),
  network       text,
  enabled       boolean not null default true
  -- ⚠ このテーブルはランキングのスコア計算から参照してはいけません。
  --   報酬で順位を変えないことが、サイトの信頼の前提です。
);

-- ------------------------------------------------------------
-- 閲覧履歴・お気に入り
--
-- 現在はブラウザの localStorage だけで完結させています（アカウント不要）。
-- 会員機能を作る場合のみ、以下を有効にしてください。
-- ------------------------------------------------------------

-- create table user_favorites (
--   user_id     uuid not null,
--   tool_slug   text not null references tools(slug) on delete cascade,
--   created_at  timestamptz not null default now(),
--   primary key (user_id, tool_slug)
-- );

-- create table user_history (
--   id          bigserial primary key,
--   user_id     uuid not null,
--   path        text not null,
--   visited_at  timestamptz not null default now()
-- );

-- ------------------------------------------------------------
-- Supabase を使う場合の Row Level Security（最低限）
-- ------------------------------------------------------------

-- 公開テーブルは匿名ユーザーに読み取りのみ許可し、書き込みは
-- サービスロール（管理画面・収集バッチ）だけに限定してください。
--
-- alter table tools enable row level security;
-- create policy "public read" on tools for select using (true);
--
-- alter table news_items enable row level security;
-- create policy "public read" on news_items for select using (true);
--
-- alter table tool_affiliate_links enable row level security;
-- -- ⚠ アフィリエイトリンクは公開読み取りにしてかまいませんが、
-- --   書き込みは必ずサービスロールに限定してください。
