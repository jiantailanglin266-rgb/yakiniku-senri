/**
 * 画像・動画のパス設定（差し替えの起点）。
 *
 * ■ 画像の差し替え方法
 *   1. /public/images/<カテゴリー>/ にある同名ファイルを上書きするだけで反映されます。
 *   2. 別名・別拡張子（.webp / .avif 等）にする場合は、このファイルの src を書き換えてください。
 *   3. src を空文字にすると、その箇所は自動的にプレースホルダー表示になります（レイアウトは崩れません）。
 *
 * ■ 動画の差し替え方法
 *   brandMovie.youtubeId に YouTube の動画ID、または brandMovie.mp4 に /videos/xxx.mp4 を指定します。
 *   どちらも未設定の場合は、ポスター画像のみが表示されます（再生ボタンは出ません）。
 */

import { withBasePath } from "@/lib/base-path";

export type Media = {
  /** 空文字の場合はプレースホルダー表示 */
  src: string;
  alt: string;
  width: number;
  height: number;
};

const img = (src: string, alt: string, width = 1600, height = 1067): Media => ({
  // サブディレクトリ配信時のベースパスを自動付与します
  src: withBasePath(src),
  alt,
  width,
  height,
});

export const media = {
  /**
   * ブランドロゴ（ヘッダー・フッターで使用）。
   * 差し替える場合は、透過PNG / WebP を同じパスへ上書きしてください。
   * 縦横比が変わるときは width / height も合わせて更新してください。
   */
  logo: img("/images/brand/logo-senri.webp", "焼肉 千里 since 1965", 514, 303),

  /**
   * ファーストビューの3枚組（左から順に横並びで表示）。
   * スマートフォンでは中央（2枚目）のみを表示します。
   * 枚数を変える場合は HeroTriptych 側のグリッド列数も合わせてください。
   */
  hero: [
    img("/images/hero/hero-panel-1.webp", "炭火の網の上で焼かれる、焼肉 千里の肉", 632, 801),
    img("/images/hero/hero-panel-2.webp", "きめ細かなサシの入った厳選の赤身肉", 680, 801),
    img("/images/hero/hero-panel-3.webp", "雲丹とキャビアを添えた一品", 610, 801),
  ],

  /** ブランドムービーのポスター画像 */
  movie: img("/images/movie/movie-poster.webp", "炭火の上で焼かれる、焼肉 千里の肉", 1728, 992),

  story: {
    history: img("/images/story/story-history.webp", "創業当時から続く店内の様子"),
    sauce: img("/images/story/story-sauce.webp", "受け継がれてきた秘伝のタレ"),
    family: img("/images/story/story-family.webp", "家族や仲間と囲む焼肉のテーブル"),
  },

  commitment: {
    legacy: img("/images/commitment/commitment-legacy.webp", "世田谷・上馬の店舗外観", 1200, 900),
    sauce: img("/images/commitment/commitment-sauce.webp", "秘伝のタレをもみ込む手元", 1200, 900),
    momi: img("/images/commitment/commitment-momi.webp", "千里名物のもみシリーズ", 1200, 900),
    space: img("/images/commitment/commitment-space.webp", "ゆったりとした店内席", 1200, 900),
  },

  menu: {
    momiAssortment: img("/images/menu/menu-momi-assortment.webp", "もみ三種盛り合わせ", 1200, 900),
    joRosu: img("/images/menu/menu-jo-rosu.webp", "上ロース", 1200, 900),
    cheeseFondue: img("/images/menu/menu-cheese-fondue.webp", "石焼チーズフォンデュ", 1200, 900),
  },

  owner: img("/images/owner/owner-profile.webp", "三代目オーナーシェフ 河 明樹", 1200, 1500),

  takeout: img("/images/takeout/takeout-main.webp", "ご家庭で楽しめるテイクアウト", 1920, 1080),

  gallery: [
    img("/images/gallery/gallery-01.webp", "炭火で焼き上げる厳選の肉", 1200, 900),
    img("/images/gallery/gallery-02.webp", "もみシリーズの盛り合わせ", 1200, 1500),
    img("/images/gallery/gallery-03.webp", "落ち着いた雰囲気の店内", 1200, 900),
    img("/images/gallery/gallery-04.webp", "店舗の外観", 1200, 1500),
    img("/images/gallery/gallery-05.webp", "一品料理の盛り付け", 1200, 900),
    img("/images/gallery/gallery-06.webp", "テーブルに並ぶ焼肉のセット", 1200, 900),
    img("/images/gallery/gallery-07.webp", "厨房に立つスタッフ", 1200, 1500),
    img("/images/gallery/gallery-08.webp", "デザートと冷麺", 1200, 900),
  ],

  access: img("/images/access/access-exterior.webp", "焼肉 千里の店舗外観", 1600, 1067),

  news: img("/images/news/news-default.webp", "お知らせのサムネイル", 1200, 900),

  /** 下層ページのヒーロー背景 */
  pageHero: {
    about: img("/images/common/page-hero-about.webp", "", 1920, 900),
    commitment: img("/images/common/page-hero-commitment.webp", "", 1920, 900),
    menu: img("/images/common/page-hero-menu.webp", "", 1920, 900),
    takeout: img("/images/common/page-hero-takeout.webp", "", 1920, 900),
    owner: img("/images/common/page-hero-owner.webp", "", 1920, 900),
    news: img("/images/common/page-hero-news.webp", "", 1920, 900),
    access: img("/images/common/page-hero-access.webp", "", 1920, 900),
    contact: img("/images/common/page-hero-contact.webp", "", 1920, 900),
    legal: img("/images/common/page-hero-legal.webp", "", 1920, 900),
  },
} as const;

export const brandMovie = {
  /** 例: "dQw4w9WgXcQ" — YouTube動画ID。設定するとYouTube埋め込みが優先されます */
  youtubeId: "" as string,
  /** /public/videos/ に置いた mp4 のパス */
  mp4: withBasePath("/videos/brand-movie.mp4") as string,
  poster: media.movie,
  title: "受け継がれてきた味と、焼肉 千里の時間。",
  label: "MOVIE",

  /* ── 以下は構造化データ（VideoObject）用 ────────────────────
     動画を差し替えたら、この3つも実際の値へ更新してください。 */

  /** 動画の説明。検索結果に出ることがあります */
  description:
    "1965年創業、東京都世田谷区上馬の焼肉 千里のブランドムービー。炭火で焼き上げる肉と、六十年変わらない店の時間を収めています。",
  /** 再生時間（秒）。ISO 8601 形式へ自動変換します */
  durationSeconds: 14,
  /** このサイトで公開した日（YYYY-MM-DD） */
  uploadDate: "2026-08-04",
};

export const hasBrandMovie = Boolean(brandMovie.youtubeId || brandMovie.mp4);
