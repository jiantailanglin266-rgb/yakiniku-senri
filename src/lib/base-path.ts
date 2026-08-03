/**
 * サブディレクトリ配信（GitHub Pages のプロジェクトページ等）用のベースパス。
 *
 * next/image は `unoptimized` 指定時に basePath を自動付与しないため、
 * /public 配下を直接参照するパスはこのヘルパーで前置します。
 * 本番（Vercel・独自ドメイン）では空文字となり、何も変わりません。
 */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** 先頭スラッシュ付きの公開パスにベースパスを付与します */
export function withBasePath(path: string): string {
  if (!path || !path.startsWith("/")) return path;
  return `${basePath}${path}`;
}
