/**
 * 自動翻訳の状態管理。
 *
 * Google 翻訳ウィジェットは `googtrans` という Cookie を読んで翻訳先を決めます。
 * 形式は `/<原文の言語>/<翻訳先の言語>`（例: /ja/en）。
 * 日本語に戻すときは Cookie を消します。
 *
 * ■ なぜ Cookie を書いてリロードするのか
 *   ウィジェットの内部セレクトを直接操作すると、翻訳が
 *   React のハイドレーション途中に走って表示が壊れることがあります。
 *   Cookie を書いてから読み込み直すと、ウィジェットが初期化時にまとめて
 *   翻訳するため、崩れにくくなります。
 */

import { SOURCE_LANGUAGE } from "@/data/languages";

const COOKIE_NAME = "googtrans";

/** 現在の翻訳先を返します。未翻訳（原文のまま）なら日本語コードを返します。 */
export function readCurrentLanguage(): string {
  if (typeof document === "undefined") return SOURCE_LANGUAGE;

  const raw = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);

  if (!raw) return SOURCE_LANGUAGE;

  // 値は "/ja/en" の形。末尾が翻訳先です。
  const target = decodeURIComponent(raw).split("/").filter(Boolean).pop();
  return target || SOURCE_LANGUAGE;
}

/**
 * Cookie を書き込みます。
 * ウィジェットはドメイン違いの Cookie を見落とすことがあるため、
 * ホスト名そのものと、先頭にドットを付けた形の両方へ書きます。
 */
function writeCookie(value: string | null): void {
  const hostname = window.location.hostname;
  const expiry = value ? "" : "; expires=Thu, 01 Jan 1970 00:00:01 GMT"; /* 削除用 */
  const body = value ? encodeURIComponent(value) : "";

  const domains = [undefined, hostname, `.${hostname}`];
  for (const domain of domains) {
    document.cookie =
      `${COOKIE_NAME}=${body}; path=/` + (domain ? `; domain=${domain}` : "") + expiry;
  }
}

/** 翻訳先を切り替えて再読み込みします。 */
export function applyLanguage(code: string): void {
  if (code === SOURCE_LANGUAGE) {
    writeCookie(null);
  } else {
    writeCookie(`/${SOURCE_LANGUAGE}/${code}`);
  }
  window.location.reload();
}

/**
 * 現在の翻訳先を React から購読するためのフック。
 *
 * Cookie はサーバーからは読めないため、サーバーでは常に原文（日本語）を返し、
 * ハイドレーション後にクライアントの実際の値へ切り替わります。
 * useSyncExternalStore はこの「サーバーとクライアントで値が異なる」場面のための
 * 仕組みなので、effect 内で setState するより安全です。
 */
export function subscribeLanguage(): () => void {
  // Cookie は再読み込みでしか変わらないため、購読は不要です
  return () => {};
}

export function getServerLanguage(): string {
  return SOURCE_LANGUAGE;
}
