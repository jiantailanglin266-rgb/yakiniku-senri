/**
 * SPORTS PORT — サイト設定
 *
 * サイト名・ロゴ・カラー・ドメインはここだけを書き換えれば全ページに反映されます。
 * 環境変数が設定されていればそちらを優先するため、
 * ビルド時（Vercel / GitHub Actions）に上書きすることもできます。
 *
 * ここに「未確認の実績値」を書かないでください（受賞歴・評価・会員数など）。
 * 実データがないものは空のままにします。
 */

export type SportsBrand = {
  /** 表示名 */
  name: string;
  /** ロゴのモノグラム（画像ロゴが用意できるまでの既定） */
  mark: string;
  /** 画像ロゴを使う場合のパス（/public 起点）。空なら mark を描画 */
  logoSrc: string;
  tagline: { ja: string; en: string };
  subCopy: { ja: string; en: string };
  /** 公開ドメイン（末尾スラッシュなし） */
  origin: string;
  /**
   * サイトのルートパス。ロケールセグメントの前に付きます。
   *
   * 単独リポジトリになったため、常に空文字です。
   * GitHub Pages の `/sports-port` は Next.js の basePath が付けるので、
   * ここに書くと `/sports-port/sports-port/ja/` と二重になります。
   */
  routePrefix: string;
};

export type SportsTheme = {
  /** 背景（最下層） */
  base: string;
  /** パネル背景 */
  surface: string;
  /** 主役アクセント */
  primary: string;
  secondary: string;
  tertiary: string;
  /** ライブ表示・得点フラッシュ */
  live: string;
  /** 警告・年齢制限系 */
  caution: string;
};

/**
 * 配信オリジン（スキーム＋ホストまで）。
 *
 * ⚠ ここにリポジトリ名（/sports-port）を入れないでください。
 *   絶対URLは `origin + basePath + /<言語>/...` で組み立てるため、
 *   入れると `/sports-port/sports-port/...` と二重になります。
 *
 * 分離前は千里の NEXT_PUBLIC_SITE_URL を引き継いでいましたが、
 * 単独リポジトリになったので参照しません。
 */
const origin = (
  process.env.NEXT_PUBLIC_SPORTS_ORIGIN || "https://jiantailanglin266-rgb.github.io"
).replace(/\/$/, "");

export const brand: SportsBrand = {
  name: process.env.NEXT_PUBLIC_SPORTS_SITE_NAME || "SPORTS PORT",
  mark: process.env.NEXT_PUBLIC_SPORTS_LOGO_MARK || "SP",
  logoSrc: process.env.NEXT_PUBLIC_SPORTS_LOGO_SRC || "",
  tagline: {
    ja: "世界中の熱狂を、リアルタイムで。",
    en: "Every roar on earth, in real time.",
  },
  subCopy: {
    ja: "試合速報、ニュース、配信、データ、Web3.0 をひとつのスポーツターミナルに。",
    en: "Live scores, news, streaming, data and Web3 in a single sports terminal.",
  },
  origin,
  routePrefix: process.env.NEXT_PUBLIC_SPORTS_ROUTE_PREFIX ?? "",
};

export const theme: SportsTheme = {
  base: "#04060f",
  surface: "#0a1020",
  primary: "#22d3ee",
  secondary: "#6366f1",
  tertiary: "#d946ef",
  live: "#f43f5e",
  caution: "#f59e0b",
};

/**
 * 機能フラグ。
 * 法規制や取引先の都合で「一時的に落とす」ことが多い領域を切り出しています。
 */
export const features = {
  /** ライブスコアの自動更新（体感を確認したいときだけ止める） */
  liveTicker: true,
  /** ベッティング比較の掲載。地域によっては丸ごと落とす想定 */
  betting: process.env.NEXT_PUBLIC_SPORTS_ENABLE_BETTING !== "false",
  web3: true,
  diagnosis: true,
  chatbot: true,
  /** 管理画面（デモ用の読み取り専用ダッシュボード） */
  admin: true,
} as const;

/**
 * 収益導線の表示制御。
 * 広告表記（rel="sponsored" / PR表記）はコンポーネント側で常に付与します。
 */
export const monetization = {
  streamingAffiliate: true,
  ticketAffiliate: true,
  goodsAffiliate: true,
  web3Affiliate: true,
  vpnAffiliate: false,
  /** 広告であることの日本語表記 */
  disclosureLabel: { ja: "PR", en: "Ad" },
} as const;

/** 外部SNS。実アカウントが決まるまでは空文字にしておきます（推測リンクを置かない） */
export const socials = {
  youtube: process.env.NEXT_PUBLIC_SPORTS_YOUTUBE_URL || "",
  x: process.env.NEXT_PUBLIC_SPORTS_X_URL || "",
  instagram: process.env.NEXT_PUBLIC_SPORTS_INSTAGRAM_URL || "",
  line: process.env.NEXT_PUBLIC_SPORTS_LINE_URL || "",
  newsletter: process.env.NEXT_PUBLIC_SPORTS_NEWSLETTER_URL || "",
} as const;

/**
 * データソース。
 * `mock` のときは外部APIを一切叩かず、同梱のモックデータで全ページが動きます。
 */
export const dataSource = (process.env.SPORTS_DATA_SOURCE || "mock") as "mock" | "live";

/** ライブスコアのポーリング間隔（秒）。実データの更新頻度と一致させること。 */
export const liveRefreshSec = Number(process.env.NEXT_PUBLIC_SPORTS_LIVE_REFRESH_SEC || 30);
