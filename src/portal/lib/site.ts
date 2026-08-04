/**
 * CRYPTO PORT — ブランド設定
 *
 * サイト名・ロゴ・ドメインは仮のものです。
 * すべて環境変数で差し替えられるようにしてあるため、
 * 確定後はコードを触らずに `.env` の値を変えるだけで反映されます。
 */

import { withBasePath } from "@/lib/base-path";

export const brand = {
  /** 表示名（ヘッダー・フッター・OGP・構造化データで共有） */
  name: process.env.NEXT_PUBLIC_PORTAL_NAME ?? "CRYPTO PORT",
  /** ロゴのワードマークを2語で割るための分割 */
  nameParts: (process.env.NEXT_PUBLIC_PORTAL_NAME ?? "CRYPTO PORT").split(" "),
  /** 短縮名（モバイル・PWA） */
  shortName: process.env.NEXT_PUBLIC_PORTAL_SHORT_NAME ?? "CryptoPort",
  /** ロゴ画像。未指定ならCSSで描画するワードマークにフォールバックします */
  logo: process.env.NEXT_PUBLIC_PORTAL_LOGO ?? "",
  /** 運営者名（構造化データ Organization） */
  publisher: process.env.NEXT_PUBLIC_PORTAL_PUBLISHER ?? "CRYPTO PORT 編集部",
  /** 問い合わせ先 */
  contactEmail: process.env.NEXT_PUBLIC_PORTAL_EMAIL ?? "",
} as const;

/**
 * 公開URL。末尾スラッシュなしで正規化します。
 * GitHub Pages のサブディレクトリ配信にも追従させるため basePath を含みます。
 */
function normalizeOrigin(value: string): string {
  return value.replace(/\/+$/, "");
}

export const portalOrigin = normalizeOrigin(
  process.env.NEXT_PUBLIC_PORTAL_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://crypto-port.example.com",
);

/** ポータルのルート（例: https://example.com/yakiniku-senri） */
export const portalBase = `${portalOrigin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`;

/**
 * ファーストビューの動画ロゴ。
 *
 * 空文字にすると、これまでの文字ロゴ（`brand.nameParts`）に戻ります。
 * 差し替えるときは /public/videos/ にファイルを置いてパスを変えてください。
 * 消音でのループ再生が前提のため、音声トラックの有無は表示に影響しません。
 *
 * ■ WebM（VP9）である理由
 *   このサイトの背景は暗色なので、ロゴの背景は透過している必要があります。
 *   MP4/H.264 はアルファチャンネルを持てません。透過を保てる形式のうち、
 *   広く再生できるのが VP9 の WebM です。
 *   再生できないブラウザでは文字ロゴに落ちるので、
 *   **背景つきの MP4 を代替に置いてはいけません**（白い箱が出ます）。
 */
export const brandLogoVideo = withBasePath("/videos/crypto-port-logo.webm");

/**
 * ソーシャル。空文字のものはUIに出しません（未確認情報を載せないため）。
 */
export const socials = {
  x: process.env.NEXT_PUBLIC_PORTAL_X ?? "",
  youtube: process.env.NEXT_PUBLIC_PORTAL_YOUTUBE ?? "",
  line: process.env.NEXT_PUBLIC_PORTAL_LINE ?? "",
  discord: process.env.NEXT_PUBLIC_PORTAL_DISCORD ?? "",
  newsletter: process.env.NEXT_PUBLIC_PORTAL_NEWSLETTER ?? "",
} as const;

export const socialEntries = Object.entries(socials).filter(([, url]) => url.length > 0) as Array<
  [keyof typeof socials, string]
>;
