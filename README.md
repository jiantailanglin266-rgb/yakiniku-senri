# 焼肉 千里 公式サイト

東京都世田谷区上馬の老舗焼肉店「焼肉 千里」（1965年創業）の公式サイトです。
黒・金・白を基調とした和モダンなブランドサイトとして、既存のWordPressサイトから全面リニューアルしています。

- ブランドコンセプト：**炎とともに、受け継がれる味。**
- サブコンセプト：世田谷で愛され続ける、老舗焼肉店。

---

## 1. 技術構成

| 項目            | 内容                                                                |
| --------------- | ------------------------------------------------------------------- |
| フレームワーク  | Next.js 16（App Router / React Server Components）                  |
| 言語            | TypeScript（strict）                                                |
| UI              | React 19                                                            |
| スタイル        | Tailwind CSS v4（`src/app/globals.css` の `@theme` でトークン定義） |
| アニメーション  | Framer Motion + CSS keyframes                                       |
| アイコン        | Lucide Icons（SNSのブランドアイコンのみ自前のインラインSVG）        |
| バリデーション  | Zod（メニュー・お知らせデータのビルド時検証）                       |
| 画像            | next/image（AVIF / WebP 自動変換）                                  |
| フォント        | next/font（Noto Serif JP / Noto Sans JP / Cormorant Garamond）      |
| テスト          | Vitest + Testing Library                                            |
| 整形 / 静的解析 | Prettier / ESLint                                                   |
| デプロイ想定    | Vercel                                                              |

コンテンツとUIは分離しており、**表示に使うデータはすべて `src/data/` 配下**にあります。
将来 WordPress やヘッドレスCMSへ接続する際は、`src/data/news.ts` の `getNews()` / `getNewsBySlug()` 等の
関数の中身だけを差し替えれば、UI側の変更は不要です。

---

## 2. セットアップ

```bash
npm install
```

```bash
cp .env.example .env.local
```

### 開発サーバー

```bash
npm run dev
```

http://localhost:3000 で起動します。

### 本番ビルド / 起動

```bash
npm run build
```

```bash
npm run start
```

### その他のコマンド

| コマンド               | 内容                         |
| ---------------------- | ---------------------------- |
| `npm run typecheck`    | TypeScript の型チェック      |
| `npm run lint`         | ESLint                       |
| `npm run test`         | Vitest（1回実行）            |
| `npm run test:watch`   | Vitest（ウォッチ）           |
| `npm run format`       | Prettier で整形              |
| `npm run placeholders` | プレースホルダー画像を再生成 |

---

## 3. ディレクトリ構成

```text
src/
├── app/                  ルーティング（App Router）
│   ├── page.tsx          トップページ
│   ├── layout.tsx        共通レイアウト・フォント・全体のメタデータ
│   ├── sitemap.ts        /sitemap.xml を生成
│   ├── robots.ts         /robots.txt を生成
│   ├── not-found.tsx     404ページ
│   └── <各ページ>/page.tsx
├── components/
│   ├── layout/           ヘッダー・フッター・モバイルナビ・固定バー
│   ├── home/             トップページの各セクション
│   ├── menu/             お品書きのUI
│   ├── news/             お知らせのUI
│   ├── page/             下層ページ共通（ヒーロー・関連リンク・FAQ）
│   ├── legal/            法的ページ共通レイアウト
│   ├── effects/          ローディング・火の粉・煙・ページ遷移
│   └── ui/               ボタン・見出し・画像・縦書きなどの汎用パーツ
├── data/                 ★ 編集するのは基本ここだけ
│   ├── store.ts          店舗情報（住所・電話・営業時間・定休日）
│   ├── site.ts           サイトURL・SNS・外部リンク
│   ├── media.ts          画像・動画のパス
│   ├── menu.ts           お品書き
│   ├── news.ts           お知らせ
│   ├── content.ts        ストーリー・こだわり・オーナー・テイクアウト・FAQ
│   └── navigation.ts     ナビゲーション項目
└── lib/                  SEO / 構造化データ / ユーティリティ

public/
├── images/               差し替え用の画像（下記参照）
└── videos/               ブランドムービーのmp4置き場
```

---

## 4. 画像の差し替え方法

**`/public/images/` にある同名ファイルを上書きするだけ**で反映されます。コードの変更は不要です。

```text
public/images/
├── hero/        hero-main.webp / hero-meat.webp / hero-charcoal.webp
├── movie/       movie-poster.webp
├── story/       story-history.webp / story-sauce.webp / story-family.webp
├── commitment/  commitment-legacy.webp / -sauce / -momi / -space
├── menu/        menu-momi-assortment.webp / menu-jo-rosu.webp / menu-cheese-fondue.webp
├── owner/       owner-profile.webp
├── takeout/     takeout-main.webp
├── gallery/     gallery-01.webp 〜 gallery-08.webp
├── access/      access-exterior.webp
├── news/        news-default.webp
└── common/      page-hero-*.webp（下層ページのヒーロー）/ ogp.png
```

- 現在入っているのは、`npm run placeholders` で生成した仮画像です。
- **拡張子を変える場合**（例：`.jpg` にする）は、`src/data/media.ts` の該当行の `src` を書き換えてください。
- **画像を一時的に外したい場合**は、`src` を空文字 `""` にしてください。
  レイアウトを崩さずにプレースホルダー表示へ切り替わります。
- 推奨形式は WebP または AVIF。next/image が自動で最適化・遅延読み込みを行います。
- ファーストビューの1枚目のみ `priority` が付いています（LCP対策）。
- ファビコン等は `public/favicon.ico` / `public/icon.png` / `public/apple-touch-icon.png` を差し替えてください。

### ファーストビューの背景を増減する

`src/data/media.ts` の `media.hero` 配列に追記・削除するだけです。
2枚以上ある場合、6.5秒ごとに**クロスフェード**で切り替わり、右下のインジケーターで手動操作もできます。

---

## 5. 動画の差し替え方法

`src/data/media.ts` の `brandMovie` を編集します。

```ts
export const brandMovie = {
  youtubeId: "", // 例: "dQw4w9WgXcQ"
  mp4: "", // 例: "/videos/brand-movie.mp4"
  poster: media.movie,
  // ...
};
```

- **YouTubeを使う場合**：`youtubeId` に動画IDを設定（`youtube-nocookie.com` で埋め込みます）。
- **mp4を使う場合**：`/public/videos/` にファイルを置き、`mp4` にパスを設定。
- **どちらも未設定の場合**：ポスター画像のみが表示され、再生ボタンは出ません
  （押せないダミーボタンを残さないための仕様です）。
- モーダル再生時のみ読み込むため、初期表示のコストはかかりません。
- 自動再生する場合は必ずミュートになります。

---

## 6. 店舗情報の変更方法

`src/data/store.ts` の1ファイルだけを編集してください。
ヘッダー・フッター・アクセス・構造化データ・各ページのメタデータすべてに反映されます。

```ts
export const store = {
  name: "焼肉 千里",
  phone: "03-3418-7496",
  phoneHref: "tel:+81334187496", // ← 電話番号を変えたらこちらも必ず更新
  businessHours: [/* ... */],
  closed: "木曜日",
};
```

`businessHours` の `days` / `opens` / `closes` は、構造化データ（`openingHoursSpecification`）に
そのまま使われます。表示用の `value` と食い違わないようにしてください。

---

## 7. お品書きの変更方法

`src/data/menu.ts` を編集します。

- **品目の追加・価格変更**：`menuItems` 配列を編集
- **カテゴリーの並び順**：`menuCategories` 配列の順番がそのまま画面に反映されます
- **品目が0件のカテゴリー**：タブにも本文にも表示されません（空のカテゴリーが出ません）
- **写真**：`image` に `/images/menu/xxx.webp` を指定。未指定でもレイアウトは崩れません
- **おすすめ**：`recommended: true` を付けるとトップページの SIGNATURE と「おすすめ」タブに出ます

データは Zod スキーマでビルド時に検証されるため、不正なデータがあるとビルドが失敗します。

---

## 8. お知らせの変更方法

`src/data/news.ts` の `news` 配列に追記するだけで、一覧・詳細ページ・`sitemap.xml` に自動反映されます。

```ts
{
  slug: "new-post",          // URLになります（/news/new-post）
  title: "タイトル",
  date: "2026-08-03",        // YYYY-MM-DD
  category: "info",          // newsCategories のキー
  lead: "一覧に出る要約文",
  body: ["本文の段落1", "本文の段落2"],
  image: media.news.src,     // 省略可
}
```

---

## 9. SNS・外部リンクの変更方法

`src/data/site.ts` の `socialLinks` / `ownerSiteUrl` を編集するか、`.env.local` で上書きします。

```env
NEXT_PUBLIC_INSTAGRAM_URL=
NEXT_PUBLIC_TABELOG_URL=
```

すべての外部リンクは `target="_blank" rel="noopener noreferrer"` と外部リンクアイコンが自動で付きます。

---

## 10. Google Maps の変更方法

既定では住所からの検索URLを自動生成しています。特定の場所を指定したい場合は `.env.local` で上書きしてください。

```env
NEXT_PUBLIC_GOOGLE_MAPS_URL=https://maps.app.goo.gl/xxxxxxxx
```

埋め込み地図（アクセスセクション）は `IntersectionObserver` による遅延読み込みで、
画面に入るまで iframe を生成しません。

---

## 11. WordPress / ヘッドレスCMS への接続

UIとデータが分離しているため、接続時に触るのは `src/data/` 配下のアクセサ関数だけです。

1. `src/data/news.ts` の `getNews()` / `getNewsBySlug()` / `getAllNewsSlugs()` を
   WP REST API（`/wp-json/wp/v2/posts`）や GraphQL の呼び出しに置き換える
2. 返り値を `newsSchema`（Zod）で `parse()` して型を保証する
3. 関数を `async` にし、呼び出し側のページで `await` する
   （`src/app/news/page.tsx` / `src/app/news/[slug]/page.tsx` / `src/components/home/NewsSection.tsx`）
4. ISR を使う場合は各ページに `export const revalidate = 600` などを追加

お品書き（`src/data/menu.ts`）も同じ手順でカスタム投稿タイプへ接続できます。

---

## 12. デプロイ

Vercel を想定しています。

1. リポジトリを Vercel にインポート
2. Framework Preset は自動で Next.js が選択されます
3. 環境変数に `.env.example` の内容を設定（最低限 `NEXT_PUBLIC_SITE_URL`）
4. デプロイ

### GitHub Pages（確認用プレビュー）

`main` へ push すると、`.github/workflows/deploy-pages.yml` が型チェック・Lint・テストを実行したうえで
静的エクスポート（`output: "export"`）をビルドし、GitHub Pages へ公開します。

- 公開URL：`https://<オーナー名>.github.io/<リポジトリ名>/`
- Pages ビルド時のみ `GITHUB_PAGES=true` / `PAGES_BASE_PATH` / `NEXT_PUBLIC_BASE_PATH` が設定され、
  サブディレクトリ配信に対応します（画像は `unoptimized`、各ページは `<path>/index.html` として出力）。
- **本番（Vercel）ビルドには一切影響しません。** 通常ビルドでは next/image の最適化がそのまま有効です。

> プレビューは確認用です。本番ドメインで公開したあとは、重複コンテンツを避けるため
> GitHub Pages を停止するか、リポジトリを private にすることをおすすめします。

### Vercel の環境変数

`NEXT_PUBLIC_SITE_URL` が未設定の場合は `https://yakinikusenri.com` が既定値として使われます。
**独自ドメインを本番に割り当てたら、必ずこの環境変数を設定してください**
（canonical / OGP / sitemap.xml のURLがすべてこの値を基準にします）。

---

## 13. 実装済みの主な内容

- ローディング演出（セッション中1回のみ／reduced motion時は非表示）
- フルスクリーンのファーストビュー（背景クロスフェード／一文字ずつの見出し表示／手動切替）
- ファーストビュー直下のブランドムービー枠（左右にスクロール連動の縦書き装飾）
- ブランドストーリー（左右交互レイアウト／背景の大きな英字）
- こだわり4項目、おすすめメニュー3品、お品書きカテゴリー一覧
- 炎・煙・火の粉の軽量アニメーション（純CSS。ページ中盤とCTAに限定）
- オーナー紹介（金色の波形装飾）／テイクアウト／ギャラリー（モーダル・キーボード操作対応）
- お知らせ（一覧・詳細）／アクセス（遅延読み込みの地図）／FAQ
- 予約CTA、モバイル下部の固定バー（電話・地図・お品書き）
- 全下層ページ、法的ページ、サイトマップページ、404ページ
- SEO：ページ別 title / description / canonical / OGP / Twitter Card / sitemap.xml / robots.txt
- 構造化データ：Restaurant（LocalBusiness）/ Organization / WebSite / BreadcrumbList / FAQPage / Article
- アクセシビリティ：スキップリンク、フォーカストラップ、キーボード操作、`prefers-reduced-motion` 対応、
  縦書き装飾のスクリーンリーダー除外、44px以上のタップ領域

### 質感仕上げ

- ページ全体を1枚の連続背景（`.bg-canvas`）で構成し、セクション固有の背景を持たせていません
- 背景は3枚を重ねています（すべて `position: fixed` / `pointer-events: none`）
  - `.bg-canvas`（`z-index:-3`）… 地の色、金の光だまり2点、炭火の赤のグラデーション
  - `.bg-ornament`（`z-index:-2`）… 金の地紋（七宝つなぎ）。画面中央を抜く放射マスクで周縁だけに出す
  - `.bg-grain`（`z-index:-1`）… グレイン
- 金の地紋の濃さは `.bg-ornament` の `opacity`（既定 `0.5`）で調整できます。
  地紋を出したくない場合は `opacity: 0` にするか、`layout.tsx` の該当 `div` を外してください
- 赤みの強さは `.bg-canvas` の `rgba(95, 11, 11, …)` / `rgba(185, 56, 30, …)` の alpha を調整してください
- SVG fractalNoise のグレイン（`.bg-grain`）でグラデーションのバンディングを抑制
- 濃色セクションは上下160pxの移行帯（`.section-bleed`）で境界を溶かしています
- 全画像に共通のカラーグレードとマスクフェードを適用し、矩形の縁を立たせません
- 入場アニメーションは duration 1100ms / `cubic-bezier(.22,1,.36,1)` / スタッガー80ms に統一

---

## 14. 公開前の確認事項（重要）

本サイトの初期データは、既存サイト（yakinikusenri.com）の掲載内容をもとに整理・再構成したものです。
**未確認の情報は追加していませんが、以下は公開前に必ず店舗へご確認ください。**

### 必ず確認が必要なもの

- [ ] **営業時間・ラストオーダー・定休日**（`src/data/store.ts`）
- [ ] **メニューの品目と価格**（`src/data/menu.ts`）— 既存サイト掲載時点の価格です
- [ ] **価格の税表記**（`src/data/store.ts` の `priceTaxIncluded`）— 現在は「税込」表示にしています
- [ ] **電話番号・住所**（`src/data/store.ts`）
- [ ] **外部リンクのURL**（`src/data/site.ts`）— Instagram / Facebook / X / 食べログ / オーナー公式サイト
- [ ] **お知らせ記事の本文** — 現在 `[本文をここに入力してください]` のプレースホルダーです（`src/data/news.ts`）
- [ ] **オーナーの読み仮名・出演作品の表記**（`src/data/content.ts`）

### 法的ページのプレースホルダー

以下は `[ ]` のまま残しています。公開前に確定した内容へ差し替えてください。

- `/privacy` … `[運営事業者名]` `[代表者名]` `[メールアドレス]`
- `/terms` … `[運営事業者名]` `[管轄裁判所名]`
- `/legal` … `[運営事業者名]` `[代表者名]` `[メールアドレス]` `[お支払方法]`

> `/legal`（特定商取引法に基づく表記）は、**オンライン販売・決済を行わない前提**で作成しています。
> 通信販売を開始する場合は、販売価格・送料・返品条件などの必須項目を追記してください。

### 画像・動画

- [ ] すべての画像を本番写真へ差し替え（現在は仮画像）
- [ ] `alt` テキストが実際の写真の内容と合っているか確認（`src/data/media.ts`）
- [ ] ブランドムービーの設定（未設定のうちは再生ボタンが表示されません）
- [ ] OGP画像（`public/images/common/ogp.png`）とファビコンの差し替え

### その他

- [ ] `NEXT_PUBLIC_SITE_URL` を本番ドメインに設定
- [ ] Google Search Console へ `sitemap.xml` を登録
- [ ] Googleビジネスプロフィールと、サイト上の店舗名・住所・電話番号の表記を統一（NAP統一）

---

## 15. テスト

```bash
npm run test
```

- 店舗情報・お品書き・お知らせのデータ整合性（電話リンク、住所統一、カテゴリー整合、重複ID）
- メタデータ（title / description / canonical / OGP / robots が `index,follow` であること）
- 構造化データ（表示していない情報が含まれていないこと、定休日が営業時間に含まれないこと）
- `sitemap.xml` / `robots.txt` の生成内容
- ヘッダー／フッター／モバイル固定バーのリンク、外部リンクの `target` と `rel`
- 画像未設定時にプレースホルダーへフォールバックすること
- モバイルメニューの開閉・Escape・背面スクロール固定
- 動画モーダル、ギャラリーモーダルの開閉とキーボード操作
- `prefers-reduced-motion` 時にアニメーションが無効化されること
