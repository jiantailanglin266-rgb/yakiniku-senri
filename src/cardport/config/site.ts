/**
 * CARD PORT — サイト全体の設定。
 *
 * サイト名・ロゴ・ドメイン・カラー・運営会社は、
 * このファイルと環境変数だけで差し替えられるようにしています。
 * コンポーネント側にこれらの値を直接書かないでください。
 */

const env = (key: string, fallback: string): string => {
  const value = process.env[key];
  return value && value.length > 0 ? value : fallback;
};

/**
 * 末尾スラッシュを取り除いた公開URL。
 *
 * ■ 独自ドメインを取るまでは、実際に配信しているURLに揃えます
 *   既定値を `https://cardport.example` にしていたため、環境変数を置かないまま
 *   デプロイすると、存在しないドメインの canonical とサイトマップが出ていました
 *   （静的エクスポートで 1,598 件）。
 *   実在しないURLを検索エンジンに申告することになるため、
 *   既定は「いま配信しているURL」にします。
 *   独自ドメインが決まったら `NEXT_PUBLIC_CARDPORT_URL` で上書きしてください。
 */
export const cardportUrl = env(
  "NEXT_PUBLIC_CARDPORT_URL",
  "https://jiantailanglin266-rgb.github.io/card-port",
).replace(/\/$/, "");

/**
 * サブディレクトリ配信（GitHub Pages のプロジェクトページ等）のベースパス。
 * 既存サイトと同じ環境変数を共有します。
 */
export const cardportBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export type BrandConfig = {
  /** サイト名（表示用） */
  name: string;
  /** サイト名の短縮形（ファビコン・PWA用） */
  shortName: string;
  /** ロゴのワードマーク。2語に分けてグラデーションを掛け分けます */
  wordmark: { lead: string; tail: string };
  /** タグライン（コンセプト） */
  tagline: { ja: string; en: string };
};

export const brand: BrandConfig = {
  name: env("NEXT_PUBLIC_CARDPORT_NAME", "CARD PORT"),
  shortName: env("NEXT_PUBLIC_CARDPORT_SHORT_NAME", "CARD PORT"),
  wordmark: {
    lead: env("NEXT_PUBLIC_CARDPORT_WORDMARK_LEAD", "CARD"),
    tail: env("NEXT_PUBLIC_CARDPORT_WORDMARK_TAIL", "PORT"),
  },
  tagline: {
    ja: "未来の支払いと信用を、ひとつの画面に。",
    en: "Every payment and every credit, on one screen.",
  },
};

/**
 * 運営会社情報。
 *
 * ⚠ 公開前に必ず実在の情報へ差し替えてください。
 *   未確認の情報を載せないという方針に従い、初期値は明確なプレースホルダーです。
 */
export type CompanyConfig = {
  legalName: string;
  representative: string;
  established: string;
  address: string;
  email: string;
  /** 実在する登録番号がない間は空文字のままにします */
  registrationNumber: string;
  /** 情報が確定していないことを画面に明示するか */
  isPlaceholder: boolean;
};

export const company: CompanyConfig = {
  legalName: env("NEXT_PUBLIC_CARDPORT_COMPANY", "CARD PORT 編集部（運営会社 未設定）"),
  representative: env("NEXT_PUBLIC_CARDPORT_REPRESENTATIVE", ""),
  established: env("NEXT_PUBLIC_CARDPORT_ESTABLISHED", ""),
  address: env("NEXT_PUBLIC_CARDPORT_ADDRESS", ""),
  email: env("NEXT_PUBLIC_CARDPORT_EMAIL", ""),
  registrationNumber: env("NEXT_PUBLIC_CARDPORT_REGISTRATION", ""),
  isPlaceholder: !process.env.NEXT_PUBLIC_CARDPORT_COMPANY,
};

/**
 * ブランドカラー。
 * ここを変えると `cardport.css` の `@theme` が参照する CSS 変数も追随します
 * （`ThemeVariables` コンポーネントが :root へ流し込みます）。
 */
export const palette = {
  base: env("NEXT_PUBLIC_CARDPORT_COLOR_BASE", "#05070f"),
  surface: env("NEXT_PUBLIC_CARDPORT_COLOR_SURFACE", "#0b1020"),
  cyan: env("NEXT_PUBLIC_CARDPORT_COLOR_CYAN", "#22d3ee"),
  electric: env("NEXT_PUBLIC_CARDPORT_COLOR_ELECTRIC", "#3b82f6"),
  violet: env("NEXT_PUBLIC_CARDPORT_COLOR_VIOLET", "#8b5cf6"),
  magenta: env("NEXT_PUBLIC_CARDPORT_COLOR_MAGENTA", "#e548a8"),
  emerald: env("NEXT_PUBLIC_CARDPORT_COLOR_EMERALD", "#34d399"),
  gold: env("NEXT_PUBLIC_CARDPORT_COLOR_GOLD", "#e3c37a"),
} as const;

/** ソーシャル・外部チャネル。空文字のものはUIに出しません */
export const channels = {
  youtube: env("NEXT_PUBLIC_CARDPORT_YOUTUBE", ""),
  x: env("NEXT_PUBLIC_CARDPORT_X", ""),
  line: env("NEXT_PUBLIC_CARDPORT_LINE", ""),
  instagram: env("NEXT_PUBLIC_CARDPORT_INSTAGRAM", ""),
  newsletter: env("NEXT_PUBLIC_CARDPORT_NEWSLETTER", ""),
};

/** YouTube チャンネルID（Data API 未設定時はモック表示） */
export const youtubeChannelId = env("NEXT_PUBLIC_YOUTUBE_CHANNEL_ID", "");

/**
 * モックデータと本番データの切り替え。
 * `NEXT_PUBLIC_DATA_SOURCE=live` で外部データ、既定は `mock`。
 */
export const dataSource: "mock" | "live" =
  process.env.NEXT_PUBLIC_DATA_SOURCE === "live" ? "live" : "mock";

export const isMockData = dataSource === "mock";

/**
 * 静的エクスポート（GitHub Pages プレビュー）では生成ページ数を抑えます。
 * Vercel などのサーバ運用では全言語の詳細ページを生成します。
 */
export const isStaticExport = process.env.GITHUB_PAGES === "true";

/** アフィリエイト計測に付与するサイト識別子 */
export const affiliateSiteId = env("NEXT_PUBLIC_AFFILIATE_SITE_ID", "cardport");

/** 先頭スラッシュ付きの公開パスにベースパスを付与します */
export function cardportAsset(path: string): string {
  if (!path || !path.startsWith("/")) return path;
  return `${cardportBasePath}${path}`;
}

/** サイト内パスを絶対URLへ変換します（構造化データ・OGP用） */
export function cardportAbsoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const isDuplicated =
    cardportBasePath !== "" &&
    cardportUrl.endsWith(cardportBasePath) &&
    normalized.startsWith(cardportBasePath);
  return `${cardportUrl}${isDuplicated ? normalized.slice(cardportBasePath.length) : normalized}`;
}
